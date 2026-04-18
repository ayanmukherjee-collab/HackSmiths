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

    const allCompanies = [];
    const yearSummaries = {};

    for (const file of txtFiles) {
        const filePath = path.join(uploadsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').map(l => l.trim()).filter(l => l);

        let detectedYear = 'Unknown';
        for (const line of lines) {
            const yearMatch = line.match(/sme financial health\s+(\d{4})/i);
            if (yearMatch) {
                detectedYear = yearMatch[1];
                break;
            }
        }

        const companyNames = [];
        const states = [];
        const sectors = [];

        const npPcts = [];
        const currentRatios = [];
        const debtEquityRatios = [];
        const rocePcts = [];
        const healthScores = [];
        const riskLabels = [];

        let section = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.startsWith('Page ') || line.toLowerCase().startsWith('sme financial health')) {
                section = '';
                continue;
            }

            if (line.includes('Business ID') && line.includes('Business Name')) {
                section = 'companies';
                continue;
            }

            if (line.includes('NP Pct') && (line.includes('Net Profit K') || line.includes('Opening Stock K') || line.includes('Loading Unloading K'))) {
                const headers = line.split(/\s{2,}/);
                section = 'npPct';
                section = 'npPct_idx_' + headers.findIndex(h => h.trim() === 'NP Pct');
                continue;
            }

            if (line.includes('Owner Capital K') && line.includes('Current Ratio')) {
                section = 'ratios';
                continue;
            }

            if (line.includes('Financial Health Score')) {
                section = 'healthScore';
                continue;
            }

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

            if (section === 'companies') {
                const parts = line.split(/\s{2,}/);
                if (parts.length >= 3) {
                    companyNames.push(parts[1]);
                    states.push(parts[2]);
                    sectors.push(parts.length >= 4 ? parts[3] : 'Unknown');
                }
            }

            if (section.startsWith('npPct_idx_')) {
                const colIdx = parseInt(section.replace('npPct_idx_', ''), 10);
                const parts = line.split(/\s{2,}|\s+/).filter(p => p.trim() !== '');
                if (parts.length > colIdx && colIdx >= 0) {
                    const val = parseFloat(parts[colIdx]);
                    if (!isNaN(val)) npPcts.push(val);
                }
            }

            if (section === 'ratios') {
                const parts = line.split(/\s{2,}|\s+/).filter(p => p.trim() !== '');
                if (parts.length >= 6) {
                    const cr = parseFloat(parts[2]);
                    const de = parseFloat(parts[3]);
                    const roce = parseFloat(parts[5]);
                    if (!isNaN(cr)) currentRatios.push(cr);
                    if (!isNaN(de)) debtEquityRatios.push(de);
                    if (!isNaN(roce)) rocePcts.push(roce);
                }
            }

            if (section === 'healthScore') {
                const parts = line.split(/\s{2,}|\s+/).filter(p => p.trim() !== '');
                const lastPart = parts[parts.length - 1];
                const scoreMatch = lastPart.match(/^(\d+)(Good|Medium|Poor|Bad)$/i);
                if (scoreMatch) {
                    healthScores.push(parseInt(scoreMatch[1], 10));
                    riskLabels.push(scoreMatch[2]);
                }
            }
        }

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

    const rawAnomalies = [];
    allCompanies.forEach((company, idx) => {
        if (company.riskLabel && (company.riskLabel.toLowerCase() === 'poor' || company.riskLabel.toLowerCase() === 'bad')) {
            rawAnomalies.push({
                id: company.name,
                date: company.year || '2023',
                description: 'High Risk Profile Detected',
                amount: `Score: ${company.healthScore || 0}`,
                severity: 'HIGH'
            });
        }
        else if (company.currentRatio != null && company.currentRatio < 1.0) {
            rawAnomalies.push({
                id: company.name,
                date: company.year || '2023',
                description: 'Severe Liquidity Deficit',
                amount: `Ratio: ${company.currentRatio}`,
                severity: 'HIGH'
            });
        }
        else if (company.debtEquityRatio != null && company.debtEquityRatio > 1.5) {
            rawAnomalies.push({
                id: company.name,
                date: company.year || '2023',
                description: 'High Leverage Exposure',
                amount: `D/E Ratio: ${company.debtEquityRatio}`,
                severity: 'MEDIUM'
            });
        }
        else if (company.npPct != null && company.npPct < 5.0 && company.npPct > 0) {
            rawAnomalies.push({
                id: company.name,
                date: company.year || '2023',
                description: 'Sub-optimal Net Profit Margin',
                amount: `${company.npPct}% NP`,
                severity: 'LOW'
            });
        }
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
