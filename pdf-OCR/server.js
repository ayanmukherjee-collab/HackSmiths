const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Routes
const uploadRoutes = require('./routes/upload');
app.use('/api/ocr/upload', uploadRoutes); // Updated to /ocr/upload based on contract

const analyzeRoutes = require('./routes/analyze');
app.use('/api/ocr', analyzeRoutes); // Extract fits under ocr namespace

// Parallel Team Generation Routes
const graphRoutes = require('./routes/graph');
app.use('/api/graph-data', graphRoutes);

const strategyRoutes = require('./routes/strategy');
app.use('/api/strategy', strategyRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`pdf-OCR Service is running on port ${PORT}`);
});
