const express = require('express');
const router = express.Router();
const parsedController = require('../controllers/parsedController');

router.get('/:fileId', parsedController.getParsedData);

module.exports = router;
