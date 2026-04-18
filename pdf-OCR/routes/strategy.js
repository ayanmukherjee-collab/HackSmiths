const express = require('express');
const router = express.Router();
const predictController = require('../controllers/predictController');

router.get('/predict/:fileId', predictController.getPredictions);
router.get('/portfolio', predictController.getPortfolioPredictions);

module.exports = router;
