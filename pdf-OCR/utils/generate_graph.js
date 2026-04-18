const fs = require('fs');
const path = require('path');
const { parseTextFile } = require('../controllers/graphController');

const uploadsDir = path.join(__dirname, '../uploads');

function generateGraphData() {
    const files = fs.readdirSync(uploadsDir);
    const txtFiles = files.filter(f => f.endsWith('.txt'));
    const yearData = {};

    for (const file of txtFiles) {
        const content = fs.readFileSync(path.join(uploadsDir, file), 'utf-8');
        const parsed = parseTextFile(content);

        if (parsed.monthlyData.length > 0) {
            const year = parsed.year;
            if (!yearData[year]) yearData[year] = { data: [], format: parsed.format };
            yearData[year].data.push(...parsed.monthlyData);
            yearData[year].format = parsed.format;
        }
    }

    const sortedYears = Object.keys(yearData).sort();
    const graphs = sortedYears.map(year => ({
        year,
        chartType: "line",
        title: `Financial Performance - FY ${year}`,
        resolution: yearData[year].format === 'corporate' ? 'quarter' : 'month',
        data: yearData[year].data
    }));

    const graphJson = { availableYears: sortedYears, graphs };
    const outputPath = path.join(uploadsDir, 'graph.json');
    fs.writeFileSync(outputPath, JSON.stringify(graphJson, null, 2), 'utf-8');
    console.log(`Generated graph data: ${sortedYears.length} year(s) [${sortedYears.join(', ')}]. Output saved to ${outputPath}`);
}

module.exports = { generateGraphData };
