const path = require('path');
const fs = require('fs');
const ocrHelper = require('../utils/ocrHelper');
const parser = require('../utils/parser');
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

        // Return cached strategy document if available
        if (fs.existsSync(strategyCachePath)) {
            return res.status(200).json({
                success: true,
                fileId,
                data: JSON.parse(fs.readFileSync(strategyCachePath, 'utf8'))
            });
        }

        // 1. Get Text
        const tesseractTxtPath = path.join(uploadDir, `${fileId}.txt`);
        let text;
        if (fs.existsSync(tesseractTxtPath)) {
            text = fs.readFileSync(tesseractTxtPath, 'utf8');
        } else {
            text = ocrHelper.getCachedText(filePath);
            if (!text) {
                const result = await ocrHelper.extractTextFromPDF(filePath);
                text = result.text;
            }
        }

        // 2. Get Parsed Data
        let parsedData;
        if (fs.existsSync(parsedCachePath)) {
            parsedData = JSON.parse(fs.readFileSync(parsedCachePath, 'utf8'));
        } else {
            parsedData = await parser.parseFinancialText(text);
            fs.writeFileSync(parsedCachePath, JSON.stringify(parsedData, null, 2), 'utf8');
        }

        // 3. Generate Strategy via LLM
        const systemPrompt = `You are a Chief Financial Officer AI. Review the provided SME financial health dataset and generate an overarching executive summary strategy document, identifying top-level insights, key recommendations, and next steps for the portfolio of companies.

You MUST return a JSON object exactly matching this schema:
{
  "executiveSummary": "String (A high-level overview of the entire dataset's performance)",
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

        // Cache the strategy document
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

module.exports = {
    getPredictions
};
