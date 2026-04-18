const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const graphController = require('../controllers/graphController');

// Serve aggregate graph.json (no fileId required)
router.get('/', (req, res) => {
    const graphPath = path.join(__dirname, '../uploads/graph.json');
    if (fs.existsSync(graphPath)) {
        return res.status(200).json({
            success: true,
            data: JSON.parse(fs.readFileSync(graphPath, 'utf8'))
        });
    }
    return res.status(404).json({ success: false, message: 'No graph data available yet. Upload a PDF first.' });
});

// Serve file-specific graph data
router.get('/:fileId', graphController.getGraphData);

module.exports = router;
