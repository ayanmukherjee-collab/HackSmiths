const path = require('path');
const fs = require('fs');
const ocrHelper = require('../utils/ocrHelper');
const parser = require('../utils/parser');
const { callLLM } = require('../utils/llmHelper');

const getGraphData = async (req, res) => {
  try {
    const { fileId } = req.params;
    const uploadDir = path.join(__dirname, '../uploads');
    const filePath = path.join(uploadDir, `${fileId}.pdf`);
    const parsedCachePath = `${filePath}_parsed.json`;
    const graphsCachePath = `${filePath}_graphs.json`;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Return cached graphs directly if available
    if (fs.existsSync(graphsCachePath)) {
      return res.status(200).json({
        success: true,
        fileId,
        data: JSON.parse(fs.readFileSync(graphsCachePath, 'utf8'))
      });
    }

    // 1. Get Text
    let text = ocrHelper.getCachedText(filePath);
    if (!text) {
      const result = await ocrHelper.extractTextFromPDF(filePath);
      text = result.text;
    }

    // 2. Get Parsed Data
    let parsedData;
    if (fs.existsSync(parsedCachePath)) {
      parsedData = JSON.parse(fs.readFileSync(parsedCachePath, 'utf8'));
    } else {
      parsedData = await parser.parseFinancialText(text);
      fs.writeFileSync(parsedCachePath, JSON.stringify(parsedData, null, 2), 'utf8');
    }

    // 3. Generate Charts via LLM
    const systemPrompt = `You are a financial data visualization expert. Your task is to analyze structured financial data and generate datasets ready for charting libraries (like Recharts).

Based on the provided SME financial health data, generate insightful graph data.
You MUST return a JSON object exactly matching this schema:
{
  "graphs": [
    {
      "chartType": "bar",
      "title": "String (e.g., Gross Sales vs Net Profit by Company)",
      "dataKey1": "String (e.g., grossSales)",
      "dataKey2": "String (optional, e.g., netProfit)",
      "data": [
        { "name": "Company Name", "grossSales": 100, "netProfit": 50 }
      ]
    },
    {
      "chartType": "pie",
      "title": "String (e.g., SME Distribution by Sector)",
      "dataKey1": "String (e.g., count)",
      "data": [
        { "name": "FMCG Trading", "count": 12 }
      ]
    }
  ]
}

Create at least 3 distinct, valuable charts using the raw tabular data. Identify overall trends or aggregations if appropriate.`;

    const userPrompt = `Generate JSON chart configurations for the following parsed SME financial data:\n\n${JSON.stringify(parsedData)}`;

    const graphDataOutput = await callLLM(systemPrompt, userPrompt, true);

    // Cache the graphs
    fs.writeFileSync(graphsCachePath, JSON.stringify(graphDataOutput, null, 2), 'utf8');

    return res.status(200).json({
      success: true,
      fileId,
      data: graphDataOutput
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getGraphData
};
