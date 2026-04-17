const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Ensure uploads directory exists
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

const uploadFile = (req, res) => {
    logger.info("Upload sequence initiated natively.");
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            logger.error(`Multer upload failed: ${err.message}`);
            return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        } else if (err) {
            logger.error(`Upload error: ${err.message}`);
            return res.status(400).json({ success: false, message: err.message });
        }

        if (!req.file) {
            logger.warn("Upload returned empty natively without throwing generic headers.");
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const fileId = path.parse(req.file.filename).name;
        logger.info(`File successfully secured onto disk uniquely tied mapping to: ${fileId}`);

        return res.status(200).json({
            success: true,
            fileId: fileId,
            fileName: req.file.originalname,
            message: 'File uploaded successfully'
        });
    });
};

module.exports = {
    uploadFile
};
