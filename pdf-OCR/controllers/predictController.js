const path = require('path');
const fs = require('fs');
const { parseTextFile } = require('./graphController');
const { callLLM, callLLMStream } = require('../utils/llmHelper');

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

You MUST return the output EXACTLY matching these XML-like tags:
<executiveSummary>
An in-depth, structured Markdown insight of the financial situation based on all provided data. You MUST include headings, subheadings, and bullet points.
</executiveSummary>
<keyRecommendations>
A valid JSON array of objects with "title" and "description" keys. Do NOT use markdown code blocks inside this tag. e.g. [{"title": "Marketing Re-investment", "description": "Detailed strategic advice"}]
</keyRecommendations>
<nextSteps>
Actionable immediate next step paragraph
</nextSteps>
<riskAnalysis>
Overview of companies at risk and why
</riskAnalysis>`;

        const userPrompt = `Generate a strategic financial insight report based on the following SME dataset:\n\n${JSON.stringify(parsedData)}`;

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const strategyDataOutputText = await callLLMStream(systemPrompt, userPrompt, (chunk) => {
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        });

        const extractTag = (text, tag) => {
            const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i');
            const match = text.match(regex);
            return match ? match[1].trim() : "";
        };

        const execSummary = extractTag(strategyDataOutputText, "executiveSummary");
        let keyRecsText = extractTag(strategyDataOutputText, "keyRecommendations");
        let keyRecs = [];
        try {
            keyRecsText = keyRecsText.replace(/```json/gi, '').replace(/```/gi, '').trim();
            if (keyRecsText) keyRecs = JSON.parse(keyRecsText);
        } catch (e) {
            console.error("Could not parse keyRecommendations:", keyRecsText);
        }

        const strategyDataOutput = {
            executiveSummary: execSummary,
            keyRecommendations: keyRecs,
            nextSteps: extractTag(strategyDataOutputText, "nextSteps"),
            riskAnalysis: extractTag(strategyDataOutputText, "riskAnalysis")
        };

        fs.writeFileSync(strategyCachePath, JSON.stringify(strategyDataOutput, null, 2), 'utf8');
        res.write(`data: ${JSON.stringify({ chunk: "[DONE]" })}\n\n`);
        res.end();

    } catch (error) {
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: error.message });
        } else {
            res.end();
        }
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

You MUST return the output EXACTLY matching these XML-like tags:
<executiveSummary>
An in-depth, structured Markdown insight of the financial situation based on all provided data. You MUST include headings, subheadings, and bullet points.
</executiveSummary>
<keyRecommendations>
A valid JSON array of objects with "title" and "description" keys. Do NOT use markdown code blocks inside this tag. e.g. [{"title": "Marketing Re-investment", "description": "Detailed strategic advice"}]
</keyRecommendations>
<nextSteps>
Actionable immediate next step paragraph
</nextSteps>
<riskAnalysis>
Overview of companies at risk and why
</riskAnalysis>`;

        const userPrompt = `Generate a strategic financial insight report based on the following overall portfolio SME dataset:\n\n${JSON.stringify(allParsedData)}`;

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const strategyDataOutputText = await callLLMStream(systemPrompt, userPrompt, (chunk) => {
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        });

        const extractTag = (text, tag) => {
            const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i');
            const match = text.match(regex);
            return match ? match[1].trim() : "";
        };

        const execSummary = extractTag(strategyDataOutputText, "executiveSummary");
        let keyRecsText = extractTag(strategyDataOutputText, "keyRecommendations");
        let keyRecs = [];
        try {
            keyRecsText = keyRecsText.replace(/```json/gi, '').replace(/```/gi, '').trim();
            if (keyRecsText) keyRecs = JSON.parse(keyRecsText);
        } catch (e) {
            console.error("Could not parse keyRecommendations:", keyRecsText);
        }

        const strategyDataOutput = {
            executiveSummary: execSummary,
            keyRecommendations: keyRecs,
            nextSteps: extractTag(strategyDataOutputText, "nextSteps"),
            riskAnalysis: extractTag(strategyDataOutputText, "riskAnalysis")
        };

        fs.writeFileSync(strategyCachePath, JSON.stringify(strategyDataOutput, null, 2), 'utf8');
        res.write(`data: ${JSON.stringify({ chunk: "[DONE]" })}\n\n`);
        res.end();

    } catch (error) {
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: error.message });
        } else {
            res.end();
        }
    }
};

module.exports = {
    getPredictions,
    getPortfolioPredictions
};
