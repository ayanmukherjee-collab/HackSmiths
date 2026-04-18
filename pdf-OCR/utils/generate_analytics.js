const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../uploads');

const MONTH_ORDER = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

/**
 * Parses all .txt files in uploads/ and aggregates cashflow and projection data.
 * Writes the result to uploads/analytics.json.
 */
function generateAnalyticsData() {
    const files = fs.readdirSync(uploadsDir);
    const txtFiles = files.filter(f => f.endsWith('.txt'));

    const monthlyData = {};

    MONTH_ORDER.forEach(m => {
        monthlyData[m] = {
            inflow: 0,
            outflow: 0,
            actual: 0
        };
    });

    let totalSalaries = 0;
    let totalShopRents = 0;
    let totalLoadingUnloading = 0;
    let totalInterests = 0;
    let totalMiscs = 0;

    for (const file of txtFiles) {
        const filePath = path.join(uploadsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').map(l => l.trim()).filter(l => l);

        const months = [];
        const grossSales = [];
        const purchases = [];
        const salaries = [];
        const shopRents = [];
        const loadingUnloadings = [];
        const miscs = [];
        const interests = [];

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

            if (line.includes('Gross Sales K') && line.includes('Purchase K')) {
                const headers = line.split(/\s{2,}/);
                section = 'sales';
                continue;
            }

            if (line.includes('Loading Unloading K') && line.includes('Misc Expenses K')) {
                section = 'expenses';
                continue;
            }

            if (line.includes('Opening Stock K') || line.includes('Sundry Debtors K') || line.includes('Owner Capital K') || line.includes('CC Limit Sanctioned K')) {
                section = '';
                continue;
            }

            if (section === 'companies') {
                const parts = line.split(/\s{2,}/);
                const monthCandidate = parts[parts.length - 1];
                if (MONTH_ORDER.includes(monthCandidate)) {
                    months.push(monthCandidate);
                } else if (parts.length >= 5 && MONTH_ORDER.includes(parts[4])) {
                    months.push(parts[4]);
                } else {
                    months.push(MONTH_ORDER[months.length % 12]);
                }
            }

            if (section === 'sales') {
                const parts = line.split(/\s{2,}|\s+/).filter(p => !isNaN(parseFloat(p)));
                if (parts.length >= 6) {
                    grossSales.push(parseFloat(parts[0]) || 0);
                    purchases.push(parseFloat(parts[1]) || 0);
                    salaries.push(parseFloat(parts[4]) || 0);
                    shopRents.push(parseFloat(parts[5]) || 0);
                }
            }

            if (section === 'expenses') {
                const parts = line.split(/\s{2,}|\s+/).filter(p => !isNaN(parseFloat(p)));
                if (parts.length >= 4) {
                    loadingUnloadings.push(parseFloat(parts[0]) || 0);
                    miscs.push(parseFloat(parts[1]) || 0);
                    interests.push(parseFloat(parts[3]) || 0);
                }
            }
        }

        const count = Math.min(months.length, grossSales.length, expensesLength(loadingUnloadings, miscs));

        for (let j = 0; j < count; j++) {
            const m = months[j];
            if (!monthlyData[m]) continue;

            const inflow = grossSales[j] || 0;
            const outflow = (purchases[j] || 0) + (salaries[j] || 0) + (shopRents[j] || 0) + (loadingUnloadings[j] || 0) + (miscs[j] || 0) + (interests[j] || 0);

            monthlyData[m].inflow += inflow;
            monthlyData[m].outflow += outflow;
            monthlyData[m].actual += inflow;

            totalSalaries += salaries[j] || 0;
            totalShopRents += shopRents[j] || 0;
            totalLoadingUnloading += loadingUnloadings[j] || 0;
            totalInterests += interests[j] || 0;
            totalMiscs += miscs[j] || 0;
        }
    }

    function expensesLength(arr1, arr2) {
        return Math.max(arr1.length, arr2.length) > 0 ? Math.max(arr1.length, arr2.length) : Infinity;
    }

    const cashflowArray = [];
    const projectionArray = [];
    const PROJECTION_MODIFIER = 1.12;

    MONTH_ORDER.forEach(m => {
        const data = monthlyData[m];
        if (data.inflow > 0 || data.outflow > 0) {
            cashflowArray.push({
                name: m.substring(0, 3),
                inflow: Math.round(data.inflow),
                outflow: Math.round(data.outflow)
            });

            projectionArray.push({
                month: m.substring(0, 3),
                actual: Math.round(data.actual),
                projection: Math.round(data.actual * PROJECTION_MODIFIER)
            });
        }
    });

    const opexBreakdown = [
        { name: 'Payroll', value: Math.round(totalSalaries) },
        { name: 'Rent & Utilities', value: Math.round(totalShopRents) },
        { name: 'Logistics', value: Math.round(totalLoadingUnloading) },
        { name: 'Interest', value: Math.round(totalInterests) },
        { name: 'Misc', value: Math.round(totalMiscs) }
    ];

    const analyticsJson = {
        cashflow: cashflowArray,
        projection: projectionArray,
        opexBreakdown: opexBreakdown
    };

    const outputPath = path.join(uploadsDir, 'analytics.json');
    fs.writeFileSync(outputPath, JSON.stringify(analyticsJson, null, 2), 'utf-8');
    console.log(`Generated analytics data: ${cashflowArray.length} months. Output saved to ${outputPath}`);

    return analyticsJson;
}

module.exports = { generateAnalyticsData };
