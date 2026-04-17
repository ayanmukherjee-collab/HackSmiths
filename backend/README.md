# FinSight Backend API

A robust Node.js and Express backend capable of performing end-to-end financial analysis heavily relying on OCR parsing, mathematical modeling, and AI predicting.

## Requirements
- Node.js installed
- Tesseract dependencies implicitly pulled via npm.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install express cors multer dotenv tesseract.js pdf-img-convert
   ```

2. Start the Server:
   ```bash
   npm start
   ```

3. Configure Environment Variables:
   Set `PORT=5000` in `.env`.

## Core Features
1. **OCR Scanning Engine**: Converts raw local PDF pages into text blocks.
2. **Deterministic Structuring**: Extracts text specifically translating strings into raw chronologically categorized JSON variables (`Revenue`, `Expense`, `Tax`).
3. **Health AI Engine**: Leverages weighted algorithm frameworks scoring margins inherently creating an overall `0-100` grade mapping severity arrays.
4. **Predictive Models**: Forecasts 3 months linearly into the future highlighting trends instantly.

## API Documentation

### 1. `GET /api/demo`
Returns a highly orchestrated sample JSON payload highlighting realistic extracted inputs without relying on disk read bottlenecks.
**Response**:
```json
{
  "success": true,
  "financials": { ... },
  "predictions": { ... }
}
```

### 2. `POST /api/analyze` 
Runs the exact pipeline step by step immediately.
**Payload Body (FormData)**: `pdfFile` - The appended binary application/pdf.
**Response**:
```json
{
  "success": true,
  "healthScore": { "overallScore": 88 },
  "risks": [{ "title": "Low Margin" }]
}
```

### 3. Step-Through Analytical Nodes
* `GET /api/extract/:fileId` -> Triggers Tesseract natively.
* `GET /api/parse/:fileId` -> Outputs invoices structures safely.
* `GET /api/calculate/:fileId` -> Computes overarching metrics.
* `GET /api/score/:fileId` -> Scores health.
* `GET /api/risks/:fileId` -> Projects severe liabilities dynamically.
* `GET /api/predict/:fileId` -> Yields regressive forecasts continuously.

## Testing Interfaces
A simple validation GUI is exposed safely under `test/index.html`. Open this locally in your browser directly after activating the server natively to test connections directly against the endpoints.
