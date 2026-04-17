const express = require('express');
const router = express.Router();
const graphController = require('../controllers/graphController');

router.get('/:fileId', graphController.getGraphData);

module.exports = router;
