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

        let extractedText;
        let pageCountValue;

        // Cache extraction text capability
        const cachedText = ocrHelper.getCachedText(filePath);
        if (cachedText) {
            extractedText = cachedText;
            pageCountValue = null; // Can't easily know without metadata from cached version, we could store it separately.
        } else {
            const { text, pageCount } = await ocrHelper.extractTextFromPDF(filePath);
            extractedText = text;
            pageCountValue = pageCount;
        }

        return res.status(200).json({
            success: true,
            fileId,
            extractedText: extractedText,
            pageCount: pageCountValue
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    extractText
};
