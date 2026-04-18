const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../uploads');

/**
 * Parses all .txt files in uploads/ and aggregates Financial Health Score,
 * Current Ratio, Debt-Equity Ratio, NP Pct, Risk Label across all companies
 * and years. Writes the result to uploads/health.json.
 */
function generateHealthData() {
    const files = fs.readdirSync(uploadsDir);
    const txtFiles = files.filter(f => f.endsWith('.txt'));

    const allCompanies = [];   // flat list of every company row across all files
    const yearSummaries = {};  // { "2021": { count, totalScore, ... }, ... }

    for (const file of txtFiles) {
        const filePath = path.join(uploadsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').map(l => l.trim()).filter(l => l);

        // --- Detect year ---
        let detectedYear = 'Unknown';
        for (const line of lines) {
            const yearMatch = line.match(/sme financial health\s+(\d{4})/i);
            if (yearMatch) {
                detectedYear = yearMatch[1];
                break;
            }
        }

        // --- Extract company names ---
        const companyNames = [];
        const states = [];
        const sectors = [];

        // --- Financial fields per company (parallel arrays) ---
        const npPcts = [];
        const currentRatios = [];
        const debtEquityRatios = [];
        const rocePcts = [];
        const healthScores = [];
        const riskLabels = [];

        let section = '';  // track which section we're parsing

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Skip page markers and headers
            if (line.startsWith('Page ') || line.toLowerCase().startsWith('sme financial health')) {
                section = '';
                continue;
            }

            // --- Section: Company names ---
            if (line.includes('Business ID') && line.includes('Business Name')) {
                section = 'companies';
                continue;
            }

            // --- Section: NP Pct ---
            if (line.includes('NP Pct') && (line.includes('Net Profit K') || line.includes('Opening Stock K') || line.includes('Loading Unloading K'))) {
                // NP Pct header can appear in two different page layouts
                const headers = line.split(/\s{2,}/);
                section = 'npPct';
                // Find the column index of NP Pct
                section = 'npPct_idx_' + headers.findIndex(h => h.trim() === 'NP Pct');
                continue;
            }

            // --- Section: Owner Capital / Current Ratio / Debt Equity ---
            if (line.includes('Owner Capital K') && line.includes('Current Ratio')) {
                section = 'ratios';
                continue;
            }

            // --- Section: Financial Health Score ---
            if (line.includes('Financial Health Score')) {
                section = 'healthScore';
                continue;
            }

            // Skip other header rows
            if (line.includes('Gross Sales K') || line.includes('Loading Unloading K') ||
                line.includes('Opening Stock K') || line.includes('Sundry Debtors K') ||
                line.includes('Shop Rent K') || line.includes('Net Profit K') ||
                line.includes('Total Assets K') || line.includes('CC Limit Sanctioned K') ||
                line.includes('Current Assets K')) {
                if (!line.includes('Financial Health Score')) {
                    section = '';
                }
                continue;
            }

            // --- Parse company rows ---
            if (section === 'companies') {
                const parts = line.split(/\s{2,}/);
                if (parts.length >= 3) {
                    companyNames.push(parts[1]);
                    states.push(parts[2]);
                    sectors.push(parts.length >= 4 ? parts[3] : 'Unknown');
                }
            }

            // --- Parse NP Pct rows ---
            if (section.startsWith('npPct_idx_')) {
                const colIdx = parseInt(section.replace('npPct_idx_', ''), 10);
                const parts = line.split(/\s{2,}|\s+/).filter(p => p.trim() !== '');
                if (parts.length > colIdx && colIdx >= 0) {
                    const val = parseFloat(parts[colIdx]);
                    if (!isNaN(val)) npPcts.push(val);
                }
            }

            // --- Parse Current Ratio / Debt Equity / ROCE rows ---
            if (section === 'ratios') {
                const parts = line.split(/\s{2,}|\s+/).filter(p => p.trim() !== '');
                // Expected order: Owner Capital K, Working Capital K, Current Ratio, Debt Equity Ratio, ICR, ROCE Pct, [Total Asset K]
                if (parts.length >= 6) {
                    const cr = parseFloat(parts[2]);
                    const de = parseFloat(parts[3]);
                    const roce = parseFloat(parts[5]);
                    if (!isNaN(cr)) currentRatios.push(cr);
                    if (!isNaN(de)) debtEquityRatios.push(de);
                    if (!isNaN(roce)) rocePcts.push(roce);
                }
            }

            // --- Parse Health Score / Risk Label rows ---
            if (section === 'healthScore') {
                // Lines look like: "1000   100Good" or "1500   61Medium" or with Total Assets: "7703   1000   100Good"
                const parts = line.split(/\s{2,}|\s+/).filter(p => p.trim() !== '');
                // Find the part that contains the score+label (e.g. "100Good", "66Medium")
                const lastPart = parts[parts.length - 1];
                const scoreMatch = lastPart.match(/^(\d+)(Good|Medium|Poor|Bad)$/i);
                if (scoreMatch) {
                    healthScores.push(parseInt(scoreMatch[1], 10));
                    riskLabels.push(scoreMatch[2]);
                }
            }
        }

        // --- Build company records ---
        const count = Math.min(
            companyNames.length,
            healthScores.length || Infinity,
            npPcts.length || Infinity,
            currentRatios.length || Infinity,
            debtEquityRatios.length || Infinity
        );

        for (let j = 0; j < count; j++) {
            const company = {
                name: companyNames[j] || 'Unknown',
                state: states[j] || 'Unknown',
                sector: sectors[j] || 'Unknown',
                year: detectedYear,
                npPct: npPcts[j] ?? null,
                currentRatio: currentRatios[j] ?? null,
                debtEquityRatio: debtEquityRatios[j] ?? null,
                rocePct: rocePcts[j] ?? null,
                healthScore: healthScores[j] ?? null,
                riskLabel: riskLabels[j] || 'Unknown'
            };
            allCompanies.push(company);
        }

        // Year-level summary
        if (!yearSummaries[detectedYear]) {
            yearSummaries[detectedYear] = { count: 0, totalScore: 0, goodCount: 0 };
        }
        const ys = yearSummaries[detectedYear];
        for (let j = 0; j < count; j++) {
            if (healthScores[j] != null) {
                ys.totalScore += healthScores[j];
                ys.count++;
            }
            if ((riskLabels[j] || '').toLowerCase() === 'good') {
                ys.goodCount++;
            }
        }
    }

    // --- Aggregate calculations ---
    const validScores = allCompanies.filter(c => c.healthScore != null);
    const validCR = allCompanies.filter(c => c.currentRatio != null);
    const validDE = allCompanies.filter(c => c.debtEquityRatio != null);
    const validNP = allCompanies.filter(c => c.npPct != null);
    const validROCE = allCompanies.filter(c => c.rocePct != null);
    const goodCount = allCompanies.filter(c => (c.riskLabel || '').toLowerCase() === 'good').length;

    const avg = (arr, key) => {
        if (arr.length === 0) return 0;
        return arr.reduce((sum, c) => sum + c[key], 0) / arr.length;
    };

    const round2 = (v) => Math.round(v * 100) / 100;

    // --- Anomaly Derivation ---
    const rawAnomalies = [];
    allCompanies.forEach((company, idx) => {
        // High Risk / Poor or Bad rating
        if (company.riskLabel && (company.riskLabel.toLowerCase() === 'poor' || company.riskLabel.toLowerCase() === 'bad')) {
            rawAnomalies.push({
                id: company.name,
                date: company.year || '2023',
                description: 'High Risk Profile Detected',
                amount: `Score: ${company.healthScore || 0}`,
                severity: 'HIGH'
            });
        }
        // Liquidity Crisis
        else if (company.currentRatio != null && company.currentRatio < 1.0) {
            rawAnomalies.push({
                id: company.name,
                date: company.year || '2023',
                description: 'Severe Liquidity Deficit',
                amount: `Ratio: ${company.currentRatio}`,
                severity: 'HIGH'
            });
        }
        // Heavy Leverage
        else if (company.debtEquityRatio != null && company.debtEquityRatio > 1.5) {
            rawAnomalies.push({
                id: company.name,
                date: company.year || '2023',
                description: 'High Leverage Exposure',
                amount: `D/E Ratio: ${company.debtEquityRatio}`,
                severity: 'MEDIUM'
            });
        }
        // Sub-optimal Margins
        else if (company.npPct != null && company.npPct < 5.0 && company.npPct > 0) {
            rawAnomalies.push({
                id: company.name,
                date: company.year || '2023',
                description: 'Sub-optimal Net Profit Margin',
                amount: `${company.npPct}% NP`,
                severity: 'LOW'
            });
        }
        // Negative Margins
        else if (company.npPct != null && company.npPct <= 0) {
            rawAnomalies.push({
                id: company.name,
                date: company.year || '2023',
                description: 'Negative Operating Margin',
                amount: `${company.npPct}% NP`,
                severity: 'HIGH'
            });
        }
    });

    // Take top 8 anomalies prioritizing severity
    const severityWeight = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    const anomalies = rawAnomalies
        .sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity])
        .slice(0, 8);

    const healthJson = {
        overallScore: round2(avg(validScores, 'healthScore')),
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
            poorCount: allCompanies.filter(c => (c.riskLabel || '').toLowerCase() === 'poor' || (c.riskLabel || '').toLowerCase() === 'bad').length
        },
        overallRiskLabel: getOverallRiskLabel(avg(validScores, 'healthScore')),
        yearBreakdown: Object.keys(yearSummaries).sort().map(year => ({
            year,
            avgScore: yearSummaries[year].count > 0 ? round2(yearSummaries[year].totalScore / yearSummaries[year].count) : 0,
            companies: yearSummaries[year].count,
            goodPct: yearSummaries[year].count > 0 ? round2((yearSummaries[year].goodCount / yearSummaries[year].count) * 100) : 0
        })),
        anomalies: anomalies
    };

    const outputPath = path.join(uploadsDir, 'health.json');
    fs.writeFileSync(outputPath, JSON.stringify(healthJson, null, 2), 'utf-8');
    console.log(`Generated health data: ${allCompanies.length} companies across ${healthJson.availableYears.length} year(s). Overall score: ${healthJson.overallScore}. Output saved to ${outputPath}`);

    return healthJson;
}

function getOverallRiskLabel(score) {
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Medium';
    return 'Poor';
}

module.exports = { generateHealthData };
