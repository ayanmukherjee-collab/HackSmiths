const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../uploads');

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

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.startsWith('Page ') || line.toLowerCase().startsWith('sme financial health')) {
                section = 0;
                npPctColumnIndex = -1;
                continue;
            }

            if (line.includes('Business ID') && line.includes('Business Name')) {
                section = 1;
                continue;
            }

            if (line.includes('NP Pct')) {
                section = 2;
                const headers = line.split(/\s{2,}/);
                npPctColumnIndex = headers.findIndex(h => h.trim() === 'NP Pct');
                continue;
            }

            if (line.includes('Gross Sales K') || line.includes('Loading Unloading K') ||
                line.includes('Opening Stock K') || line.includes('Sundry Debtors K') ||
                line.includes('Owner Capital K') || line.includes('CC Limit Sanctioned K') ||
                line.includes('Shop Rent K') || line.includes('Net Profit K') ||
                line.includes('Total Assets K')) {
                section = 0;
                continue;
            }

            if (section === 1) {
                const parts = line.split(/\s{2,}/);
                if (parts.length >= 2) {
                    companyNames.push(parts[1]);
                    months.push(parts[parts.length - 1]);
                    industries.push(parts.length >= 4 ? parts[parts.length - 2] : "Unknown");
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
