const fs = require('fs');
const path = require('path');
const { parseTextFile, parseIndianNumber } = require('../controllers/graphController');

const uploadsDir = path.join(__dirname, '../uploads');

/**
 * Parses all .txt files and generates health metrics.
 * Supports both SME and Corporate document formats.
 */
function generateHealthData() {
    const files = fs.readdirSync(uploadsDir);
    const txtFiles = files.filter(f => f.endsWith('.txt'));

    const allCompanies = [];
    const yearSummaries = {};

    for (const file of txtFiles) {
        const filePath = path.join(uploadsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = parseTextFile(content);

        if (parsed.format === 'sme') {
            buildSMEHealth(content, parsed, allCompanies, yearSummaries);
        } else if (parsed.format === 'corporate') {
            buildCorporateHealth(content, parsed, allCompanies, yearSummaries);
        }
    }

    // Compute aggregates
    const validScores = allCompanies.filter(c => c.healthScore != null);
    const validCR = allCompanies.filter(c => c.currentRatio != null);
    const validDE = allCompanies.filter(c => c.debtEquityRatio != null);
    const validNP = allCompanies.filter(c => c.npPct != null);
    const validROCE = allCompanies.filter(c => c.rocePct != null);
    const goodCount = allCompanies.filter(c => (c.riskLabel || '').toLowerCase() === 'good').length;

    const avg = (arr, key) => arr.length === 0 ? 0 : arr.reduce((s, c) => s + c[key], 0) / arr.length;
    const round2 = (v) => Math.round(v * 100) / 100;

    // Build anomalies
    const rawAnomalies = [];
    allCompanies.forEach(company => {
        if (company.riskLabel && ['poor', 'bad'].includes(company.riskLabel.toLowerCase())) {
            rawAnomalies.push({ id: company.name, date: company.year, description: 'High Risk Profile Detected', amount: `Score: ${company.healthScore || 0}`, severity: 'HIGH' });
        } else if (company.currentRatio != null && company.currentRatio < 1.0) {
            rawAnomalies.push({ id: company.name, date: company.year, description: 'Severe Liquidity Deficit', amount: `Ratio: ${company.currentRatio}`, severity: 'HIGH' });
        } else if (company.debtEquityRatio != null && company.debtEquityRatio > 1.5) {
            rawAnomalies.push({ id: company.name, date: company.year, description: 'High Leverage Exposure', amount: `D/E: ${company.debtEquityRatio}`, severity: 'MEDIUM' });
        } else if (company.npPct != null && company.npPct < 5.0 && company.npPct > 0) {
            rawAnomalies.push({ id: company.name, date: company.year, description: 'Sub-optimal Net Profit Margin', amount: `${company.npPct}% NP`, severity: 'LOW' });
        }
    });

    const severityWeight = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    const anomalies = rawAnomalies.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]).slice(0, 8);

    const overallScore = round2(avg(validScores, 'healthScore'));

    const healthJson = {
        overallScore,
        totalCompanies: allCompanies.length,
        totalFiles: Object.keys(yearSummaries).length,
        availableYears: Object.keys(yearSummaries).sort(),
        aggregates: {
            avgCurrentRatio: round2(avg(validCR, 'currentRatio')),
            avgDebtEquityRatio: round2(avg(validDE, 'debtEquityRatio')),
            avgNpPct: round2(avg(validNP, 'npPct')),
            avgRocePct: round2(avg(validROCE, 'rocePct')),
            complianceRate: allCompanies.length > 0 ? round2((goodCount / allCompanies.length) * 100) : 0,
            goodCount,
            mediumCount: allCompanies.filter(c => (c.riskLabel || '').toLowerCase() === 'medium').length,
            poorCount: allCompanies.filter(c => ['poor', 'bad'].includes((c.riskLabel || '').toLowerCase())).length
        },
        overallRiskLabel: getOverallRiskLabel(overallScore),
        yearBreakdown: Object.keys(yearSummaries).sort().map(year => ({
            year,
            avgScore: yearSummaries[year].count > 0 ? round2(yearSummaries[year].totalScore / yearSummaries[year].count) : 0,
            companies: yearSummaries[year].count,
            goodPct: yearSummaries[year].count > 0 ? round2((yearSummaries[year].goodCount / yearSummaries[year].count) * 100) : 0
        })),
        anomalies
    };

    const outputPath = path.join(uploadsDir, 'health.json');
    fs.writeFileSync(outputPath, JSON.stringify(healthJson, null, 2), 'utf-8');
    console.log(`Generated health data: ${allCompanies.length} companies across ${healthJson.availableYears.length} year(s). Overall score: ${healthJson.overallScore}. Output saved to ${outputPath}`);

    return healthJson;
}

// ─── SME Health Builder ─────────────────────────────────────
function buildSMEHealth(content, parsed, allCompanies, yearSummaries) {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    const year = parsed.year;

    const companyNames = [], states = [], sectors = [];
    const npPcts = [], currentRatios = [], debtEquityRatios = [], rocePcts = [];
    const healthScores = [], riskLabels = [];
    let section = '';

    for (const line of lines) {
        if (line.startsWith('Page ') || line.toLowerCase().startsWith('sme financial health')) { section = ''; continue; }
        if (line.includes('Business ID') && line.includes('Business Name')) { section = 'companies'; continue; }
        if (line.includes('NP Pct') && (line.includes('Opening Stock') || line.includes('Closing Stock'))) {
            const headers = line.split(/\s{2,}/);
            section = 'npPct_idx_' + headers.findIndex(h => h.trim() === 'NP Pct');
            continue;
        }
        if (line.includes('Owner Capital K') && line.includes('Current Ratio')) { section = 'ratios'; continue; }
        if (line.includes('Financial Health Score')) { section = 'healthScore'; continue; }
        if (line.includes('Gross Sales K') || line.includes('Loading Unloading K') ||
            line.includes('Opening Stock K') || line.includes('Sundry Debtors K') ||
            line.includes('Shop Rent K') || line.includes('Net Profit K') ||
            line.includes('Current Assets K')) {
            if (!line.includes('Financial Health Score')) section = '';
            continue;
        }

        if (section === 'companies') {
            const parts = line.split(/\s{2,}/);
            if (parts.length >= 3) { companyNames.push(parts[1]); states.push(parts[2]); sectors.push(parts[3] || 'Unknown'); }
        }
        if (section.startsWith('npPct_idx_')) {
            const colIdx = parseInt(section.replace('npPct_idx_', ''), 10);
            const parts = line.split(/\s{2,}|\s+/).filter(p => p.trim() !== '');
            if (parts.length > colIdx && colIdx >= 0) { const val = parseFloat(parts[colIdx]); if (!isNaN(val)) npPcts.push(val); }
        }
        if (section === 'ratios') {
            const parts = line.split(/\s{2,}|\s+/).filter(p => p.trim() !== '');
            if (parts.length >= 6) {
                const cr = parseFloat(parts[2]); const de = parseFloat(parts[3]); const roce = parseFloat(parts[5]);
                if (!isNaN(cr)) currentRatios.push(cr);
                if (!isNaN(de)) debtEquityRatios.push(de);
                if (!isNaN(roce)) rocePcts.push(roce);
            }
        }
        if (section === 'healthScore') {
            const parts = line.split(/\s{2,}|\s+/).filter(p => p.trim() !== '');
            const lastPart = parts[parts.length - 1];
            const scoreMatch = lastPart.match(/^(\d+)(Good|Medium|Poor|Bad)$/i);
            if (scoreMatch) { healthScores.push(parseInt(scoreMatch[1], 10)); riskLabels.push(scoreMatch[2]); }
        }
    }

    const count = Math.min(companyNames.length, Math.max(healthScores.length, npPcts.length, currentRatios.length, 1));
    if (!yearSummaries[year]) yearSummaries[year] = { count: 0, totalScore: 0, goodCount: 0 };
    const ys = yearSummaries[year];

    for (let j = 0; j < count; j++) {
        const company = {
            name: companyNames[j] || 'Unknown', state: states[j] || 'Unknown', sector: sectors[j] || 'Unknown',
            year, npPct: npPcts[j] ?? null, currentRatio: currentRatios[j] ?? null,
            debtEquityRatio: debtEquityRatios[j] ?? null, rocePct: rocePcts[j] ?? null,
            healthScore: healthScores[j] ?? null, riskLabel: riskLabels[j] || 'Unknown'
        };
        allCompanies.push(company);
        if (company.healthScore != null) { ys.totalScore += company.healthScore; ys.count++; }
        if ((company.riskLabel || '').toLowerCase() === 'good') ys.goodCount++;
    }
}

// ─── Corporate Health Builder ───────────────────────────────
function buildCorporateHealth(content, parsed, allCompanies, yearSummaries) {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);

    // Parse Balance Sheet for ratios
    let balancePeriods = [];
    const balanceMetrics = {};
    let currentSection = '';

    // Also parse ROE from Ratios section
    let roePeriods = [];
    let roeValues = [];

    for (const line of lines) {
        if (line === 'Balance Sheet') { currentSection = 'balance'; continue; }
        if (line === 'Cash Flows') { currentSection = 'cashflow'; continue; }
        if (line === 'Ratios') { currentSection = 'ratios'; continue; }
        if (line === 'Quarterly Results' || line === 'Profit & Loss') { currentSection = 'pl'; continue; }
        if (line.startsWith('Consolidated Figures') || line.startsWith('Standalone Figures')) continue;

        if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/.test(line)) {
            const periods = line.split(/\s{2,}/).map(p => p.trim()).filter(p => p);
            if (currentSection === 'balance') balancePeriods = periods;
            if (currentSection === 'ratios') roePeriods = periods;
            continue;
        }

        if (currentSection === 'balance') {
            const parts = line.split(/\s{2,}/);
            if (parts.length >= 2) {
                const name = parts[0].replace(/\s*\+$/, '').trim();
                balanceMetrics[name] = parts.slice(1).map(parseIndianNumber);
            }
        }

        if (currentSection === 'ratios' && line.startsWith('ROE')) {
            const parts = line.split(/\s{2,}/);
            roeValues = parts.slice(1).map(v => parseIndianNumber(v));
        }
    }

    // Use the latest available annual data for health metrics
    // Balance Sheet fields: Equity Capital, Reserves, Borrowing, Total Liabilities, Total Assets
    const equity = balanceMetrics['Equity Capital'] || [];
    const reserves = balanceMetrics['Reserves'] || [];
    const borrowing = balanceMetrics['Borrowing'] || [];
    const totalAssets = balanceMetrics['Total Assets'] || [];

    // Use quarterly data for NP Pct from parsed monthlyData
    const monthlyData = parsed.monthlyData || [];
    const latestPeriods = monthlyData.length > 0 ? monthlyData : [];

    // Determine year from balance sheet periods
    const latestBSPeriod = balancePeriods.length > 0 ? balancePeriods[balancePeriods.length - 1] : '';
    const yearMatch = latestBSPeriod.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : parsed.year || 'Unknown';

    if (!yearSummaries[year]) yearSummaries[year] = { count: 0, totalScore: 0, goodCount: 0 };
    const ys = yearSummaries[year];

    // For each period in the balance sheet, compute health metrics
    const count = Math.max(balancePeriods.length, 1);

    // Use last period values for the company-level stats
    const lastIdx = Math.max(0, balancePeriods.length - 1);

    // Current Ratio ≈ (Total Assets - Fixed Assets) / (Total Liabilities - Equity - Reserves)
    // More simply for NBFC: Total Assets / Borrowing
    const totalAssetsVal = totalAssets[lastIdx] || 0;
    const borrowingVal = borrowing[lastIdx] || 0;
    const equityVal = equity[lastIdx] || 0;
    const reservesVal = reserves[lastIdx] || 0;
    const netWorth = equityVal + reservesVal;

    // Debt to Equity = Borrowing / Net Worth
    const debtEquity = netWorth > 0 ? Math.round((borrowingVal / netWorth) * 100) / 100 : 0;

    // Current-like ratio = Total Assets / Borrowing (simplified)
    const currentRatio = borrowingVal > 0 ? Math.round((totalAssetsVal / borrowingVal) * 100) / 100 : 0;

    // NP Pct — average of all quarterly NP%
    const npPcts = latestPeriods.map(d => d.npPct).filter(v => v != null);
    const avgNpPct = npPcts.length > 0 ? Math.round(npPcts.reduce((a, b) => a + b, 0) / npPcts.length * 100) / 100 : 0;

    // ROE — use latest from ratios section
    const latestROE = roeValues.length > 0 ? roeValues[roeValues.length - 1] : 0;

    // Compute a health score (0-100) from multiple factors
    // - NP% contribution (weight 30): >20% = 30, >10% = 20, >5% = 10
    // - D/E contribution (weight 25): <3 = 25, <5 = 15, <8 = 10
    // - ROE contribution (weight 25): >20% = 25, >15% = 20, >10% = 15
    // - Revenue growth contribution (weight 20): derived from data trend
    let healthScore = 0;

    // NP% score
    if (avgNpPct >= 20) healthScore += 30;
    else if (avgNpPct >= 10) healthScore += 20;
    else if (avgNpPct >= 5) healthScore += 10;
    else healthScore += 5;

    // D/E score (lower is better)
    if (debtEquity <= 3) healthScore += 25;
    else if (debtEquity <= 5) healthScore += 15;
    else if (debtEquity <= 8) healthScore += 10;
    else healthScore += 5;

    // ROE score
    if (latestROE >= 20) healthScore += 25;
    else if (latestROE >= 15) healthScore += 20;
    else if (latestROE >= 10) healthScore += 15;
    else healthScore += 5;

    // Revenue trend score (check if growing)
    if (latestPeriods.length >= 4) {
        const first = latestPeriods[0].grossSales;
        const last = latestPeriods[latestPeriods.length - 1].grossSales;
        const growth = first > 0 ? ((last - first) / first) * 100 : 0;
        if (growth > 50) healthScore += 20;
        else if (growth > 20) healthScore += 15;
        else if (growth > 0) healthScore += 10;
        else healthScore += 5;
    } else {
        healthScore += 10;
    }

    const riskLabel = healthScore >= 80 ? 'Good' : healthScore >= 60 ? 'Medium' : 'Poor';

    const company = {
        name: 'Company', state: 'India', sector: 'Corporate',
        year, npPct: avgNpPct, currentRatio, debtEquityRatio: debtEquity,
        rocePct: latestROE, healthScore, riskLabel
    };

    allCompanies.push(company);
    ys.totalScore += healthScore;
    ys.count++;
    if (riskLabel.toLowerCase() === 'good') ys.goodCount++;
}

function getOverallRiskLabel(score) {
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Medium';
    return 'Poor';
}

module.exports = { generateHealthData };
