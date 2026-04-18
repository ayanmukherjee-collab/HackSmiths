const path = require('path');
const fs = require('fs');
const { parseTextFile } = require('./graphController');
const { callLLM } = require('../utils/llmHelper');

const getPredictions = async (req, res) => {
    try {
        const { fileId } = req.params;
        const uploadDir = path.join(__dirname, '../uploads');
        const filePath = path.join(uploadDir, `${fileId}.pdf`);
        const parsedCachePath = `${filePath}_parsed.json`;
        const strategyCachePath = `${filePath}_strategy.json`;

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        if (fs.existsSync(strategyCachePath)) {
            return res.status(200).json({
                success: true,
                fileId,
                data: JSON.parse(fs.readFileSync(strategyCachePath, 'utf8'))
            });
        }

        // Read the text file directly — no OCR needed at this point
        const txtPath = path.join(uploadDir, `${fileId}.pdf.txt`);
        const altTxtPath = path.join(uploadDir, `${fileId}.txt`);
        let text = '';
        if (fs.existsSync(txtPath)) {
            text = fs.readFileSync(txtPath, 'utf8');
        } else if (fs.existsSync(altTxtPath)) {
            text = fs.readFileSync(altTxtPath, 'utf8');
        }

        // Use fast local parser (no AI)
        let parsedData;
        if (fs.existsSync(parsedCachePath)) {
            parsedData = JSON.parse(fs.readFileSync(parsedCachePath, 'utf8'));
        } else {
            parsedData = parseTextFile(text);
            fs.writeFileSync(parsedCachePath, JSON.stringify(parsedData, null, 2), 'utf8');
        }

        const systemPrompt = `You are a Chief Financial Officer AI. Review the provided SME financial health dataset and generate an overarching executive summary strategy document, identifying top-level insights, key recommendations, and next steps for the portfolio of companies.

You MUST return a JSON object exactly matching this schema:
{
  "executiveSummary": "String (An in-depth, structured Markdown insight of the financial situation based on all provided data. You MUST include headings, subheadings, and bullet points.)",
  "keyRecommendations": [
    {
      "title": "String (e.g., Marketing Re-investment)",
      "description": "String (Detailed strategic advice)"
    }
  ],
  "nextSteps": "String (Actionable immediate next step paragraph)",
  "riskAnalysis": "String (Overview of companies at risk and why)"
}`;

        const userPrompt = `Generate a strategic financial insight report based on the following SME dataset:\n\n${JSON.stringify(parsedData)}`;

        const strategyDataOutput = await callLLM(systemPrompt, userPrompt, true);

        fs.writeFileSync(strategyCachePath, JSON.stringify(strategyDataOutput, null, 2), 'utf8');

        return res.status(200).json({
            success: true,
            fileId,
            data: strategyDataOutput
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getPortfolioPredictions = async (req, res) => {
    try {
        const uploadDir = path.join(__dirname, '../uploads');
        const strategyCachePath = path.join(uploadDir, 'portfolio_strategy.json');

        if (fs.existsSync(strategyCachePath)) {
            return res.status(200).json({
                success: true,
                data: JSON.parse(fs.readFileSync(strategyCachePath, 'utf8'))
            });
        }

        const allFiles = fs.readdirSync(uploadDir).filter(f => f.endsWith('_parsed.json'));
        if (allFiles.length === 0) {
            return res.status(404).json({ success: false, message: 'No documents processed yet' });
        }

        let allParsedData = { companies: [] };
        allFiles.forEach(file => {
            const data = JSON.parse(fs.readFileSync(path.join(uploadDir, file), 'utf8'));
            if (data && data.companies) {
                allParsedData.companies = allParsedData.companies.concat(data.companies);
            }
        });

        const systemPrompt = `You are a Chief Financial Officer AI. Review the provided SME financial health dataset and generate an overarching executive summary strategy document, identifying top-level insights, key recommendations, and next steps for the portfolio of companies.

You MUST return a JSON object exactly matching this schema:
{
  "executiveSummary": "String (An in-depth, structured Markdown insight of the financial situation based on all provided data. You MUST include headings, subheadings, and bullet points.)",
  "keyRecommendations": [
    {
      "title": "String (e.g., Marketing Re-investment)",
      "description": "String (Detailed strategic advice)"
    }
  ],
  "nextSteps": "String (Actionable immediate next step paragraph)",
  "riskAnalysis": "String (Overview of companies at risk and why)"
}`;

        const userPrompt = `Generate a strategic financial insight report based on the following overall portfolio SME dataset:\n\n${JSON.stringify(allParsedData)}`;

        const strategyDataOutput = await callLLM(systemPrompt, userPrompt, true);

        fs.writeFileSync(strategyCachePath, JSON.stringify(strategyDataOutput, null, 2), 'utf8');

        return res.status(200).json({
            success: true,
            data: strategyDataOutput
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getPredictions,
    getPortfolioPredictions
};
