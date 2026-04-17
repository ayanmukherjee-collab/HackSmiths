const path = require('path');
const fs = require('fs');
const ocrHelper = require('../utils/ocrHelper');

const extractText = async (req, res) => {
    try {
        const { fileId } = req.params;
        const uploadDir = path.join(__dirname, '../uploads');
        const filePath = path.join(uploadDir, `${fileId}.pdf`);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }
        
        // Use OCR helper to get JSON output
        const ocrJson = await ocrHelper.extractTextFromPDFAsJSON(filePath, fileId);
        
        return res.status(200).json({
            success: true,
            fileId,
            ...ocrJson
        });
        
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    extractText
};
