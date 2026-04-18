const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueId = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        cb(null, `${uniqueId}.pdf`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: fileFilter
}).single('pdfFile');

const ocrHelper = require('../utils/ocrHelper');

const uploadFile = (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const fileId = path.parse(req.file.filename).name;

        try {
            await ocrHelper.extractTextFromPDF(req.file.path);
            const { generateGraphData } = require('../utils/generate_graph');
            generateGraphData();
            const { generateHealthData } = require('../utils/generate_health');
            generateHealthData();
            const { generateAnalyticsData } = require('../utils/generate_analytics');
            generateAnalyticsData();
        } catch (e) {
            console.error("Background extraction error:", e);
        }

        return res.status(200).json({
            success: true,
            fileId: fileId,
            fileName: req.file.originalname,
            message: 'File uploaded and text extracted successfully'
        });
    });
};

module.exports = {
    uploadFile
};
