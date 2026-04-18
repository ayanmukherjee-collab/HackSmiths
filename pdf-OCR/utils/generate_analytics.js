const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../uploads');

const MONTH_ORDER = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const MONTH_SET = new Set(MONTH_ORDER);

/**
 * Parses all .pdf.txt files in uploads/ and aggregates cashflow and projection data.
 * Handles different table layouts across financial year formats by dynamically
 * mapping columns based on header names.
 * Writes the result to uploads/analytics.json.
 */
function generateAnalyticsData() {
    const files = fs.readdirSync(uploadsDir);
    const txtFiles = files.filter(f => f.endsWith('.txt'));

    const monthlyData = {};
    MONTH_ORDER.forEach(m => {
        monthlyData[m] = { inflow: 0, outflow: 0, actual: 0 };
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

        // Per-file accumulators
        const months = [];
        const grossSales = [];
        const purchases = [];
        const salaries = [];
        const shopRents = [];
        const loadingUnloadings = [];
        const miscs = [];
        const interests = [];

        let section = '';
        let currentHeaders = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Skip page markers and title lines
            if (line.startsWith('Page ') || line.toLowerCase().startsWith('sme financial health')) {
                section = '';
                currentHeaders = [];
                continue;
            }

            // Detect companies section (handles both "Business Name" and "Business_Name")
            if (line.includes('Business ID') && (line.includes('Business Name') || line.includes('Business_Name'))) {
                section = 'companies';
                currentHeaders = line.split(/\s{2,}/);
                continue;
            }

            // Detect any financial data section by looking for known column headers
            if (line.includes('Gross Sales K') || line.includes('Loading Unloading K') ||
                line.includes('Shop Rent K') || line.includes('NP Pct') ||
                line.includes('Opening Stock K') || line.includes('Sundry Debtors K') ||
                line.includes('Owner Capital K') || line.includes('CC Limit Sanctioned K') ||
                line.includes('Total Assets K') || line.includes('Total Asset K')) {

                currentHeaders = line.split(/\s{2,}/);

                // Determine which section this is based on what columns are present
                if (line.includes('Gross Sales K')) {
                    section = 'sales';
                } else if (line.includes('Loading Unloading K') || (line.includes('Shop Rent K') && line.includes('Misc Expenses K'))) {
                    section = 'expenses';
                } else {
                    // Other sections we don't need (balance sheet, etc.)
                    section = 'skip';
                }
                continue;
            }

            // Parse companies section - extract months
            if (section === 'companies') {
                const parts = line.split(/\s{2,}/);
                const lastPart = parts[parts.length - 1];
                if (MONTH_SET.has(lastPart)) {
                    months.push(lastPart);
                } else if (parts.length >= 5 && MONTH_SET.has(parts[4])) {
                    months.push(parts[4]);
                } else {
                    // Fallback: assign month cyclically
                    months.push(MONTH_ORDER[months.length % 12]);
                }
                continue;
            }

            // Parse sales section - dynamically map columns by header name
            if (section === 'sales') {
                // Check if the first token is a month name (e.g. "January  7981  6465...")
                const parts = line.split(/\s{2,}/);
                let monthFromRow = null;
                let numericStart = 0;

                // Check if the line starts with a month name
                if (parts.length > 0 && MONTH_SET.has(parts[0])) {
                    monthFromRow = parts[0];
                    numericStart = 1;
                }

                // Extract all numeric values from the row
                const allParts = line.split(/\s{2,}|\s+/);
                const numericValues = allParts.filter(p => !isNaN(parseFloat(p)) && p.trim() !== '');

                if (numericValues.length < 2) continue;

                // Build a column map from the headers
                // Headers may include: "Financial Year XXXX", "Gross Sales K", "Purchase K", "Gross Profit K", "GP Pct", "Staff Salary K", "Shop Rent K"
                const colMap = {};
                let dataIdx = 0;

                for (const h of currentHeaders) {
                    const hNorm = h.trim().toLowerCase();
                    if (hNorm.includes('financial year') || hNorm === '') continue; // skip non-data headers
                    if (MONTH_SET.has(h.trim())) continue; // skip month names in headers
                    colMap[hNorm] = dataIdx;
                    dataIdx++;
                }

                const getVal = (key) => {
                    const idx = colMap[key];
                    if (idx !== undefined && idx < numericValues.length) {
                        return parseFloat(numericValues[idx]) || 0;
                    }
                    return 0;
                };

                const gs = getVal('gross sales k');
                const pur = getVal('purchase k');
                const sal = getVal('staff salary k');
                const sr = getVal('shop rent k');

                grossSales.push(gs);
                purchases.push(pur);
                salaries.push(sal);
                shopRents.push(sr);

                // If month was embedded in this data row, add it
                if (monthFromRow) {
                    months.push(monthFromRow);
                }

                continue;
            }

            // Parse expenses section - dynamically map columns by header name
            if (section === 'expenses') {
                const numericValues = line.split(/\s{2,}|\s+/).filter(p => !isNaN(parseFloat(p)) && p.trim() !== '');
                if (numericValues.length < 2) continue;

                // Build column map from headers
                const colMap = {};
                let dataIdx = 0;

                for (const h of currentHeaders) {
                    const hNorm = h.trim().toLowerCase();
                    if (hNorm === '') continue;
                    colMap[hNorm] = dataIdx;
                    dataIdx++;
                }

                const getVal = (key) => {
                    const idx = colMap[key];
                    if (idx !== undefined && idx < numericValues.length) {
                        return parseFloat(numericValues[idx]) || 0;
                    }
                    return 0;
                };

                // Handle Shop Rent appearing in expenses section (2021 format)
                const sr = getVal('shop rent k');
                if (sr > 0 && shopRents.length > 0) {
                    // If shop rents array already has entries from sales section, update the corresponding one
                    const expenseIdx = loadingUnloadings.length;
                    if (expenseIdx < shopRents.length) {
                        shopRents[expenseIdx] += sr;
                    }
                } else if (sr > 0) {
                    shopRents.push(sr);
                }

                loadingUnloadings.push(getVal('loading unloading k'));
                miscs.push(getVal('misc expenses k'));

                // Handle both "Interest on CC K" and "Intrest on CC K" (typo in source data)
                let interestVal = getVal('interest on cc k') || getVal('intrest on cc k');
                interests.push(interestVal);

                continue;
            }
        }

        // Aggregate data into monthly buckets
        const count = Math.min(
            months.length,
            grossSales.length,
            Math.max(loadingUnloadings.length, 1)
        );

        for (let j = 0; j < count; j++) {
            const m = months[j];
            if (!m || !monthlyData[m]) continue;

            const inflow = grossSales[j] || 0;
            const outflow = (purchases[j] || 0) + (salaries[j] || 0) + (shopRents[j] || 0) +
                (loadingUnloadings[j] || 0) + (miscs[j] || 0) + (interests[j] || 0);

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

    // Build output arrays, only months with data
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
