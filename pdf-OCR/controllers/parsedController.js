const path = require('path');
const fs = require('fs');

const getParsedData = async (req, res) => {
    try {
        const { fileId } = req.params;
        const uploadDir = path.join(__dirname, '../uploads');
        const parsedCachePath = path.join(uploadDir, `${fileId}.pdf_parsed.json`);

        if (fs.existsSync(parsedCachePath)) {
            const parsedData = JSON.parse(fs.readFileSync(parsedCachePath, 'utf8'));
            return res.status(200).json({ success: true, fileId, data: parsedData });
        } else {
            return res.status(404).json({ success: false, message: 'Parsed data not found' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getParsedData
};
