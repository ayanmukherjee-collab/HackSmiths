const path = require('path');
const fs = require('fs');
const ocrHelper = require('../utils/ocrHelper');
const parser = require('../utils/parser');
const calculator = require('../utils/calculator');
const riskDetector = require('../utils/riskDetector');

const getRisks = async (req, res) => {
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
        
        const risks = await riskDetector.detectRisks(financials.overall, financials.monthly);
        
        const summary = {
            total: risks.length,
            critical: risks.filter(r => r.severity === 'critical').length,
            high: risks.filter(r => r.severity === 'high').length,
            medium: risks.filter(r => r.severity === 'medium').length,
        };

        return res.status(200).json({
            success: true,
            fileId,
            data: {
                risks,
                summary
            }
        });
        
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getRisks
};
