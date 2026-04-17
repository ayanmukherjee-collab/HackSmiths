const path = require('path');
const fs = require('fs');
const ocrHelper = require('../utils/ocrHelper');
const parser = require('../utils/parser');
const calculator = require('../utils/calculator');
const scorer = require('../utils/scorer');
const riskDetector = require('../utils/riskDetector');
const suggestionEngine = require('../utils/suggestionEngine');
const predictor = require('../utils/predictor');
const multer = require('multer');
const crypto = require('crypto');
const logger = require('../utils/logger');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueId = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        cb(null, `${uniqueId}.pdf`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: fileFilter
}).single('pdfFile');

const fullAnalysis = (req, res) => {
    upload(req, res, async function (err) {
        const startTime = Date.now();
        
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const fileId = path.parse(req.file.filename).name;
        const filePath = req.file.path;

        try {
            logger.info(`--- INIT: MASTER ANALYSIS FLOW --- [FileID: ${fileId}]`);
            // 1. OCR (now with JSON output)
            const ocrJson = await ocrHelper.extractTextFromPDFAsJSON(filePath, fileId).catch(e => ({ error: e.message }));
            if (ocrJson.error) throw new Error(`OCR Failed: ${ocrJson.error}`);
            
            // Combine all pages text for parsing
            const combinedText = ocrJson.pages.map(p => `--- Page ${p.pageNumber} ---\n${p.text}`).join('\n');
            
            // 2. Parse
            logger.info("Executing Parsing Matrix.");
        const parsedData = await parser.parseFinancialText(combinedText);
            
            // 3. Calculate
            logger.info("Executing Financial Analytics.");
            const financials = calculator.getCompleteFinancials(parsedData);
            
            // 4. Score
            logger.info("Scoring Matrix algorithms executing...");
            const healthScore = scorer.calculateHealthScore(financials.overall, financials.monthly);
            
            // 5. Risks
            logger.info("Tracking Risk Parameters.");
            const risks = await riskDetector.detectRisks(financials.overall, financials.monthly);
            
            // 6. Suggestions
            logger.info("Polling Suggestion AI module.");
            const suggestions = await suggestionEngine.generateSuggestions(risks, financials.overall);
            
            // 7. Graph Data
            logger.info("Formulating Client Chart Datasets.");
            const labels = financials.monthly.map(m => m.month);
            const revenueItems = parsedData.invoices.filter(i => i.type === 'revenue');
            const categoriesMap = {};
            revenueItems.forEach(item => {
                const cat = item.description.split(' ')[0] || 'General';
                categoriesMap[cat] = (categoriesMap[cat] || 0) + item.amount;
            });
            const pieLabels = Object.keys(categoriesMap).slice(0, 5);
            const pieData = Object.values(categoriesMap).slice(0, 5);
            if(pieLabels.length === 0) { pieLabels.push("General"); pieData.push(financials.overall.totalRevenue); }

            const plColors = financials.monthly.map(m => m.profit >= 0 ? '#4ade80' : '#f87171');
            
            let color = '#f87171';
            if (healthScore) {
                if (['A+', 'A', 'B'].includes(healthScore.grade)) color = '#4ade80';
                else if (healthScore.grade === 'C') color = '#facc15';
            }

            const graphData = {
                revenueVsExpenses: { labels, datasets: [ { label: "Revenue", data: financials.monthly.map(m => m.revenue) }, { label: "Expenses", data: financials.monthly.map(m => m.expenses) } ] },
                profitMarginTrend: { labels, datasets: [{ label: "Profit Margin %", data: financials.monthly.map(m => m.margin) }] },
                revenueBreakdown: { labels: pieLabels, data: pieData },
                healthScoreGauge: { score: healthScore ? healthScore.overallScore : 0, grade: healthScore ? healthScore.grade : "F", color },
                monthlyProfitLoss: { labels, data: financials.monthly.map(m => m.profit), colors: plColors }
            };

            // 8. Predictions
            logger.info("Formulating Regression Model Matrix securely...");
            const currentScore = healthScore ? healthScore.overallScore : 0;
            const predictions = await predictor.predictFuture(financials.monthly, currentScore);

            const endTime = Date.now();
            logger.info(`--- TERMINATE: MASTER ANALYSIS FLOW --- Completed elegantly inside ${endTime - startTime}ms.`);

            return res.status(200).json({
                success: true,
                message: "Full pipeline execution successful.",
                fileId,
                ocrData: ocrJson,
                extractedText: combinedText,
                parsedData,
                financials,
                healthScore,
                risks,
                suggestions,
                graphData,
                predictions,
                processingTime: `${endTime - startTime}ms`
            });

        } catch (error) {
            const endTime = Date.now();
            return res.status(500).json({ 
                success: false, 
                message: error.message,
                processingTime: `${endTime - startTime}ms`
            });
        }
    });
};

module.exports = {
    fullAnalysis
};
