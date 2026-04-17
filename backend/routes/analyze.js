const express = require('express');
const router = express.Router();
const extractController = require('../controllers/extractController');
const parseController = require('../controllers/parseController');
const calculateController = require('../controllers/calculateController');
const scoreController = require('../controllers/scoreController');
const riskController = require('../controllers/riskController');
const suggestController = require('../controllers/suggestController');
const graphController = require('../controllers/graphController');
const predictController = require('../controllers/predictController');
const fullAnalyzeController = require('../controllers/fullAnalyzeController');
const demoController = require('../controllers/demoController');
const logger = require('../utils/logger');

// Middleware to Validate FileId efficiently on all localized routes natively
const validateFileId = (req, res, next) => {
    const fileId = req.params.fileId;
    if (fileId && !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
        logger.error(`Validation Failed: Invalid file ID format: ${fileId}`);
        return res.status(400).json({ success: false, message: 'Invalid file ID format.' });
    }
    next();
};

router.get('/demo', demoController.getDemoData);
router.get('/extract/:fileId', validateFileId, extractController.extractText);
router.get('/parse/:fileId', validateFileId, parseController.parseData);
router.get('/calculate/:fileId', validateFileId, calculateController.calculate);
router.get('/score/:fileId', validateFileId, scoreController.getScore);
router.get('/risks/:fileId', validateFileId, riskController.getRisks);
router.get('/suggestions/:fileId', validateFileId, suggestController.getSuggestions);
router.get('/graph-data/:fileId', validateFileId, graphController.getGraphData);
router.get('/predict/:fileId', validateFileId, predictController.getPredictions);
router.post('/', fullAnalyzeController.fullAnalysis);

module.exports = router;
