const fs = require('fs');
const path = require('path');
const { parseTextFile, parseIndianNumber } = require('../controllers/graphController');

const uploadsDir = path.join(__dirname, '../uploads');

function generateAnalyticsData() {
    const files = fs.readdirSync(uploadsDir);
    const txtFiles = files.filter(f => f.endsWith('.txt'));

    const allPeriods = [];
    let opex = { interest: 0, opExpenses: 0, depreciation: 0, tax: 0, other: 0 };
    let unit = 'K'; // K for SME (thousands), Cr for corporate (crores)

    for (const file of txtFiles) {
        const content = fs.readFileSync(path.join(uploadsDir, file), 'utf-8');
        const parsed = parseTextFile(content);

        if (parsed.format === 'corporate') {
            unit = 'Cr';
            // Use quarterly data for cashflow + projection
            for (const row of parsed.monthlyData) {
                allPeriods.push({
                    period: row.month,
                    inflow: row.grossSales,
                    outflow: row.purchase
                });
            }

            // For opex, use ONLY the latest quarter (not sum of all)
            const lines = content.split('\n').map(l => l.trim()).filter(l => l);
            let inQR = false;
            let colCount = 0;

            for (const line of lines) {
                if (line === 'Quarterly Results') { inQR = true; continue; }
                if (line === 'Profit & Loss' || line === 'Balance Sheet') { inQR = false; continue; }
                if (!inQR) continue;

                // Period header to count columns
                if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/.test(line)) {
                    colCount = line.split(/\s{2,}/).filter(p => p.trim()).length;
                    continue;
                }

                // Extract LAST column value for each metric
                const parts = line.split(/\s{2,}/);
                if (parts.length < 2) continue;
                const name = parts[0].replace(/\s*\+$/, '').trim();
                const lastVal = parseIndianNumber(parts[parts.length - 1]);

                if (name === 'Interest') opex.interest = lastVal;
                else if (name === 'Expenses') opex.opExpenses = lastVal;
                else if (name === 'Depreciation') opex.depreciation = lastVal;
                else if (name.startsWith('Tax')) opex.tax = lastVal; // Tax % row
            }

            // Tax is a percentage, compute actual tax from PBT
            const latestData = parsed.monthlyData[parsed.monthlyData.length - 1];
            if (latestData) {
                // PBT = grossProfit - depreciation + other income ≈ grossProfit
                // But we can compute: Net Profit = PBT * (1 - tax%), so PBT = NP / (1 - tax/100)
                // Tax amount = PBT - NP
                const pbt = latestData.grossProfit; // financing profit isn't exactly PBT but close enough
                const taxAmount = pbt - latestData.netProfit;
                opex.tax = Math.max(0, Math.round(taxAmount));
            }

        } else if (parsed.format === 'sme') {
            unit = 'K';
            for (const row of parsed.monthlyData) {
                allPeriods.push({
                    period: row.month.substring(0, 3),
                    inflow: row.grossSales,
                    outflow: row.purchase
                });
            }

            // SME expense breakdown from raw text
            const lines = content.split('\n').map(l => l.trim()).filter(l => l);
            let section = '';
            for (const line of lines) {
                if (line.includes('Gross Sales K') && line.includes('Staff Salary K')) { section = 'sales'; continue; }
                if (line.includes('Shop Rent K') && line.includes('Misc Expenses K')) { section = 'expenses'; continue; }
                if (line.includes('NP Pct') || line.includes('Business ID')) { section = ''; continue; }

                if (section === 'sales') {
                    const parts = line.split(/\s{2,}/);
                    if (parts.length >= 6) opex.other += parseFloat(parts[5]) || 0; // Staff salary -> other
                } else if (section === 'expenses') {
                    const nums = line.split(/\s+/).map(Number).filter(n => !isNaN(n));
                    if (nums.length >= 5) {
                        opex.opExpenses += nums[0] || 0;  // Shop rent
                        opex.depreciation += nums[1] || 0; // Loading
                        opex.other += nums[2] || 0;       // Misc
                        opex.interest += nums[4] || 0;    // Interest
                    }
                }
            }
        }
    }

    // Build output
    const cashflow = allPeriods.map(d => ({ name: d.period, inflow: Math.round(d.inflow), outflow: Math.round(d.outflow) }));
    const projection = allPeriods.map(d => ({ month: d.period, actual: Math.round(d.inflow), projection: Math.round(d.inflow * 1.12) }));

    // Build opex breakdown with meaningful labels
    let opexBreakdown;
    if (unit === 'Cr') {
        opexBreakdown = [
            { name: 'Interest', value: Math.round(opex.interest) },
            { name: 'Operating Exp', value: Math.round(opex.opExpenses) },
            { name: 'Depreciation', value: Math.round(opex.depreciation) },
            { name: 'Tax', value: Math.round(opex.tax) },
        ].filter(item => item.value > 0);
    } else {
        opexBreakdown = [
            { name: 'Payroll', value: Math.round(opex.other) },
            { name: 'Rent & Utilities', value: Math.round(opex.opExpenses) },
            { name: 'Logistics', value: Math.round(opex.depreciation) },
            { name: 'Interest', value: Math.round(opex.interest) },
        ].filter(item => item.value > 0);
    }

    const analyticsJson = { cashflow, projection, opexBreakdown, unit };

    const outputPath = path.join(uploadsDir, 'analytics.json');
    fs.writeFileSync(outputPath, JSON.stringify(analyticsJson, null, 2), 'utf-8');
    console.log(`Generated analytics data: ${cashflow.length} periods. Output saved to ${outputPath}`);

    return analyticsJson;
}

module.exports = { generateAnalyticsData };
