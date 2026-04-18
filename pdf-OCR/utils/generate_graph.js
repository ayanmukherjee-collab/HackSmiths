const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../uploads');

const MONTH_ORDER = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const MONTH_SET = new Set(MONTH_ORDER);

function generateGraphData() {
    const files = fs.readdirSync(uploadsDir);
    const txtFiles = files.filter(f => f.endsWith('.txt'));

    const yearData = {};

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
        const profitMargins = [];
        const months = [];
        const industries = [];

        let section = 0;
        let npPctColumnIndex = -1;
        let companiesHeaders = [];
        let hasMonthInCompanies = false;

        // Column indices for the companies section
        let colIdxName = 1;
        let colIdxSector = -1;
        let colIdxMonth = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.startsWith('Page ') || line.toLowerCase().startsWith('sme financial health')) {
                section = 0;
                npPctColumnIndex = -1;
                continue;
            }

            // Detect companies header (handles "Business Name" and "Business_Name")
            if (line.includes('Business ID') && (line.includes('Business Name') || line.includes('Business_Name'))) {
                section = 1;
                companiesHeaders = line.split(/\s{2,}/);

                // Dynamically find column indices
                colIdxName = companiesHeaders.findIndex(h => h.includes('Business') && (h.includes('Name') || h.includes('_Name')));
                colIdxSector = companiesHeaders.findIndex(h => h.trim() === 'Sector');

                // Check if there's a month/financial year column by looking if the last column is a "Financial Year" field
                // or if the data rows will have month names at the end
                hasMonthInCompanies = companiesHeaders.some(h => h.includes('Financial Year'));
                if (hasMonthInCompanies) {
                    colIdxMonth = companiesHeaders.length - 1; // month is last column in data rows
                }

                if (colIdxName < 0) colIdxName = 1;
                if (colIdxSector < 0) colIdxSector = companiesHeaders.findIndex(h => h.trim() === 'State') + 1; // Sector is after State

                continue;
            }

            if (line.includes('NP Pct')) {
                section = 2;
                const headers = line.split(/\s{2,}/);
                npPctColumnIndex = headers.findIndex(h => h.trim() === 'NP Pct');
                continue;
            }

            // Detect sales section header — extract months from data rows if companies section didn't have them
            if (line.includes('Gross Sales K') && line.includes('Purchase K')) {
                section = 3; // sales section — used to extract months when companies don't have them
                continue;
            }

            if (line.includes('Loading Unloading K') ||
                line.includes('Opening Stock K') || line.includes('Sundry Debtors K') ||
                line.includes('Owner Capital K') || line.includes('CC Limit Sanctioned K') ||
                line.includes('Shop Rent K') || line.includes('Net Profit K') ||
                line.includes('Total Assets K') || line.includes('Total Asset K')) {
                section = 0;
                continue;
            }

            if (section === 1) {
                const parts = line.split(/\s{2,}/);
                if (parts.length >= 2) {
                    companyNames.push(parts[colIdxName] || parts[1]);
                    industries.push(parts[colIdxSector] || 'Unknown');

                    if (hasMonthInCompanies) {
                        const lastPart = parts[parts.length - 1];
                        months.push(MONTH_SET.has(lastPart) ? lastPart : 'Unknown');
                    }
                    // If no month column in companies section, we'll fill months from sales rows
                }
            } else if (section === 2 && npPctColumnIndex >= 0) {
                const parts = line.split(/\s{2,}|\s+/);
                const values = parts.filter(p => p.trim() !== '');

                if (values.length > npPctColumnIndex) {
                    const npPct = parseFloat(values[npPctColumnIndex]);
                    if (!isNaN(npPct)) {
                        profitMargins.push(npPct);
                    }
                }
            } else if (section === 3 && !hasMonthInCompanies) {
                // Extract month from sales data rows (e.g., "January   7981   6465...")
                const parts = line.split(/\s{2,}/);
                if (parts.length > 0 && MONTH_SET.has(parts[0])) {
                    months.push(parts[0]);
                }
            }
        }

        const count = Math.min(companyNames.length, profitMargins.length, months.length, industries.length);
        if (count > 0) {
            if (!yearData[detectedYear]) {
                yearData[detectedYear] = [];
            }
            for (let i = 0; i < count; i++) {
                yearData[detectedYear].push({
                    name: companyNames[i],
                    industry: industries[i],
                    month: months[i],
                    npPct: profitMargins[i]
                });
            }
        }
    }

    const sortedYears = Object.keys(yearData).sort();
    const graphs = sortedYears.map(year => ({
        year,
        chartType: "bar",
        title: `Profit Margin (Net Profit %) - FY ${year}`,
        dataKey1: "npPct",
        data: yearData[year]
    }));

    const graphJson = {
        availableYears: sortedYears,
        graphs
    };

    const outputPath = path.join(uploadsDir, 'graph.json');
    fs.writeFileSync(outputPath, JSON.stringify(graphJson, null, 2), 'utf-8');
    console.log(`Generated graph data: ${sortedYears.length} year(s) [${sortedYears.join(', ')}]. Output saved to ${outputPath}`);
}

module.exports = { generateGraphData };
