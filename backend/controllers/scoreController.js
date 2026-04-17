const path = require('path');
const fs = require('fs');
const ocrHelper = require('../utils/ocrHelper');
const parser = require('../utils/parser');
const calculator = require('../utils/calculator');
const scorer = require('../utils/scorer');

const getScore = async (req, res) => {
    try {
        const { fileId } = req.params;
        const uploadDir = path.join(__dirname, '../uploads');
        const filePath = path.join(uploadDir, `${fileId}.pdf`);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }
        
        let text = ocrHelper.getCachedText(filePath);
        if (!text) {
            const result = await ocrHelper.extractTextFromPDF(filePath);
            text = result.text;
        }

        const parsedData = await parser.parseFinancialText(text);
        const financials = calculator.getCompleteFinancials(parsedData);
        
        const healthScore = scorer.calculateHealthScore(financials.overall, financials.monthly);

        return res.status(200).json({
            success: true,
            fileId,
            data: healthScore
        });
        
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getScore
};
