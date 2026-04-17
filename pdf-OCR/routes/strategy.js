const express = require('express');
const router = express.Router();
const predictController = require('../controllers/predictController');

router.get('/predict/:fileId', predictController.getPredictions);

module.exports = router;
