const path = require('path');
const fs = require('fs');
const ocrHelper = require('../utils/ocrHelper');
const parser = require('../utils/parser');
const calculator = require('../utils/calculator');
const scorer = require('../utils/scorer');

const getGraphData = async (req, res) => {
    try {
        const { fileId } = req.params;
        const uploadDir = path.join(__dirname, '../uploads');
        const filePath = path.join(uploadDir, `${fileId}.pdf`);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }
        
        let text = ocrHelper.getCachedText(filePath);
        if (!text) {
            const result = await ocrHelper.extractTextFromPDF(filePath);
            text = result.text;
        }

        const parsedData = await parser.parseFinancialText(text);
        const financials = calculator.getCompleteFinancials(parsedData);
        const healthScore = scorer.calculateHealthScore(financials.overall, financials.monthly);

        // 1. Revenue vs Expenses Bar Chart
        const labels = financials.monthly.map(m => m.month);
        const revVsExp = {
            labels,
            datasets: [
                { label: "Revenue", data: financials.monthly.map(m => m.revenue) },
                { label: "Expenses", data: financials.monthly.map(m => m.expenses) }
            ]
        };

        // 2. Profit Margin Trend Line Chart
        const profitMarginTrend = {
            labels,
            datasets: [
                { label: "Profit Margin %", data: financials.monthly.map(m => m.margin) }
            ]
        };

        // 3. Revenue Breakdown Pie Chart
        const revenueItems = parsedData.invoices.filter(i => i.type === 'revenue');
        const categoriesMap = {};
        revenueItems.forEach(item => {
            // Very naive categorization grouping by first word
            const cat = item.description.split(' ')[0] || 'General';
            categoriesMap[cat] = (categoriesMap[cat] || 0) + item.amount;
        });
        const pieLabels = Object.keys(categoriesMap).slice(0, 5); 
        const pieData = Object.values(categoriesMap).slice(0, 5);
        if(pieLabels.length === 0) { 
            pieLabels.push("General"); 
            pieData.push(financials.overall.totalRevenue); 
        }
        
        const revenueBreakdown = {
            labels: pieLabels,
            data: pieData
        };

        // 4. Health Score Gauge
        let color = '#f87171'; // red
        if (healthScore) {
            if (['A+', 'A', 'B'].includes(healthScore.grade)) color = '#4ade80'; // green
            else if (healthScore.grade === 'C') color = '#facc15'; // yellow
        }
        const healthScoreGauge = {
            score: healthScore ? healthScore.overallScore : 0,
            grade: healthScore ? healthScore.grade : "F",
            color: color
        };

        // 5. Monthly Profit/Loss Bar Chart
        const plColors = financials.monthly.map(m => m.profit >= 0 ? '#4ade80' : '#f87171');
        const profitLoss = {
            labels,
            data: financials.monthly.map(m => m.profit),
            colors: plColors
        };

        return res.status(200).json({
            success: true,
            fileId,
            data: {
                revenueVsExpenses: revVsExp,
                profitMarginTrend,
                revenueBreakdown,
                healthScoreGauge,
                monthlyProfitLoss: profitLoss
            }
        });
        
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getGraphData
};
