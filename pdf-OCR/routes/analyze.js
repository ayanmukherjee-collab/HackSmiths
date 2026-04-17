const express = require('express');
const router = express.Router();
const extractController = require('../controllers/extractController');

router.get('/extract/:fileId', extractController.extractText);

module.exports = router;
