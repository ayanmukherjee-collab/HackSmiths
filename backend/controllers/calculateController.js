const path = require('path');
const fs = require('fs');
const ocrHelper = require('../utils/ocrHelper');
const parser = require('../utils/parser');
const calculator = require('../utils/calculator');

const calculate = async (req, res) => {
    try {
        const { fileId } = req.params;
        const uploadDir = path.join(__dirname, '../uploads');
        const filePath = path.join(uploadDir, `${fileId}.pdf`);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }
        
        // 1. Get cached raw text
        let text = ocrHelper.getCachedText(filePath);
        if (!text) {
            // Re-run OCR block if cache was dropped
            const result = await ocrHelper.extractTextFromPDF(filePath);
            text = result.text;
        }

        // 2. Parse using Regex logic natively
        const parsedData = await parser.parseFinancialText(text);

        // 3. Compute metric tables natively
        const financials = calculator.getCompleteFinancials(parsedData);

        return res.status(200).json({
            success: true,
            fileId,
            data: financials,
            summary: parsedData.summary
        });
        
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    calculate
};
