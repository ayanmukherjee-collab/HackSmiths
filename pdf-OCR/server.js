const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadRoutes = require('./routes/upload');
app.use('/api/ocr/upload', uploadRoutes);

const filesRoutes = require('./routes/files');
app.use('/api/files', filesRoutes);

const analyzeRoutes = require('./routes/analyze');
app.use('/api/ocr', analyzeRoutes);

const graphRoutes = require('./routes/graph');
app.use('/api/graph-data', graphRoutes);

const strategyRoutes = require('./routes/strategy');
app.use('/api/strategy', strategyRoutes);

const parsedRoutes = require('./routes/parsed');
app.use('/api/parsed', parsedRoutes);

const fs = require('fs');
app.get('/api/graphs', (req, res) => {
    const graphPath = path.join(__dirname, 'uploads', 'graph.json');
    if (fs.existsSync(graphPath)) {
        return res.status(200).json({
            success: true,
            data: JSON.parse(fs.readFileSync(graphPath, 'utf8'))
        });
    }
    return res.status(404).json({ success: false, message: 'No graph data available yet. Upload a PDF first.' });
});

const { generateHealthData } = require('./utils/generate_health');
app.get('/api/health-score', (req, res) => {
    const healthPath = path.join(__dirname, 'uploads', 'health.json');
    if (fs.existsSync(healthPath)) {
        return res.status(200).json({
            success: true,
            data: JSON.parse(fs.readFileSync(healthPath, 'utf8'))
        });
    }
    try {
        const data = generateHealthData();
        return res.status(200).json({ success: true, data });
    } catch (e) {
        return res.status(404).json({ success: false, message: 'No health data available yet. Upload a PDF first.' });
    }
});

const { generateAnalyticsData } = require('./utils/generate_analytics');
app.get('/api/analytics', (req, res) => {
    const analyticsPath = path.join(__dirname, 'uploads', 'analytics.json');
    if (fs.existsSync(analyticsPath)) {
        return res.status(200).json({
            success: true,
            data: JSON.parse(fs.readFileSync(analyticsPath, 'utf8'))
        });
    }
    try {
        const data = generateAnalyticsData();
        return res.status(200).json({ success: true, data });
    } catch (e) {
        return res.status(404).json({ success: false, message: 'No analytics data available yet.' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

try { generateHealthData(); } catch (e) { console.warn('Initial health data generation skipped:', e.message); }
try {
    const { generateAnalyticsData } = require('./utils/generate_analytics');
    generateAnalyticsData();
} catch (e) { console.warn('Initial analytics data generation skipped:', e.message); }

app.listen(PORT, () => {
    console.log(`pdf-OCR Service is running on port ${PORT}`);
});
