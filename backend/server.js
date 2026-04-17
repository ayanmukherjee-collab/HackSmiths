const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins
app.use(cors());

// Enable JSON body parsing
app.use(express.json());

// Routes
const uploadRoutes = require('./routes/upload');
app.use('/api/upload', uploadRoutes);

const analyzeRoutes = require('./routes/analyze');
app.use('/api', analyzeRoutes);

// Main health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
