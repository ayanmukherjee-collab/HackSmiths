const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '../uploads');

router.get('/', (req, res) => {
    try {
        if (!fs.existsSync(uploadDir)) {
            return res.status(200).json({ success: true, files: [] });
        }

        const files = fs.readdirSync(uploadDir);
        const pdfFiles = files.filter(f => f.endsWith('.pdf'));

        const fileData = pdfFiles.map(file => {
            const filePath = path.join(uploadDir, file);
            const stats = fs.statSync(filePath);

            const sizeInBytes = stats.size;
            const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
            let formattedSize = `${sizeInMB} MB`;
            if (sizeInMB < 0.1) {
                formattedSize = `${(sizeInBytes / 1024).toFixed(0)} KB`;
            }

            const date = new Date(stats.mtime);
            const formattedDate = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

            const id = file.replace('.pdf', '');

            return {
                id: id,
                name: file,
                size: formattedSize,
                date: formattedDate,
                status: 'parsed',
            };
        });

        fileData.sort((a, b) => new Date(b.date) - new Date(a.date));

        return res.status(200).json({
            success: true,
            files: fileData
        });
    } catch (e) {
        console.error("Error listing files:", e);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.delete('/:id', (req, res) => {
    try {
        const fileId = req.params.id;
        if (!fileId || fileId.includes('..') || fileId.includes('/')) {
            return res.status(400).json({ success: false, message: 'Invalid file ID' });
        }

        const pdfPath = path.join(uploadDir, `${fileId}.pdf`);
        const txtPath = path.join(uploadDir, `${fileId}.pdf.txt`);
        const jsonPath = path.join(uploadDir, `${fileId}.json`);

        let deleted = false;

        if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
            deleted = true;
        }
        if (fs.existsSync(txtPath)) {
            fs.unlinkSync(txtPath);
        }
        if (fs.existsSync(jsonPath)) {
            fs.unlinkSync(jsonPath);
        }

        if (deleted) {
            try {
                const { generateGraphData } = require('../utils/generate_graph');
                generateGraphData();
                const { generateHealthData } = require('../utils/generate_health');
                generateHealthData();
                const { generateAnalyticsData } = require('../utils/generate_analytics');
                generateAnalyticsData();
            } catch (aggregateErr) {
                console.warn("Aggregate recalculation warning:", aggregateErr.message);
            }

            return res.status(200).json({ success: true, message: 'File deleted successfully' });
        } else {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

    } catch (e) {
        console.error("Error deleting file:", e);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
