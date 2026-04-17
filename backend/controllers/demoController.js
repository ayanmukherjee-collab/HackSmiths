const logger = require('../utils/logger');

const getDemoData = (req, res) => {
    logger.info("Demo endpoint called. Generating mock analysis data.");
    
    // Hardcoded realistic mock data
    const parsedData = {
        invoices: [
            { date: "2024-01-10", description: "SaaS Subscription", amount: 15000, type: "revenue" },
            { date: "2024-01-15", description: "Cloud Hosting", amount: 2500, type: "expense" }
        ],
        summary: { totalItems: 2, dateRange: { from: "2024-01-01", to: "2024-03-31" } }
    };
    
    const financials = {
        overall: {
            totalRevenue: 150000,
            totalExpenses: 65000,
            netProfit: 85000,
            profitMargin: 56.6,
            expenseRatio: 43.3,
            totalTax: 15000,
            effectiveTaxRate: 10
        },
        monthly: [
            { month: "2024-01", revenue: 45000, expenses: 22000, profit: 23000, margin: 51.1 },
            { month: "2024-02", revenue: 50000, expenses: 21000, profit: 29000, margin: 58.0 },
            { month: "2024-03", revenue: 55000, expenses: 22000, profit: 33000, margin: 60.0 }
        ]
    };
    
    const healthScore = {
        overallScore: 88,
        grade: "A",
        breakdown: {
            profitMarginScore: { score: 100, weight: 40, weighted: 40 },
            revenueTrendScore: { score: 100, weight: 25, weighted: 25 },
            expenseControlScore: { score: 100, weight: 20, weighted: 20 },
            consistencyScore: { score: 20, weight: 15, weighted: 3 }
        }
    };
    
    const risks = [
        {
            riskId: "INCONSISTENT_INCOME",
            title: "Inconsistent Income",
            description: "Monthly revenue is somewhat volatile.",
            severity: "medium",
            currentValue: "variance detected",
            threshold: "CV > 20%"
        }
    ];
    
    const suggestions = {
        suggestions: [
            {
                category: "growth",
                priority: "medium",
                title: "Explore Market Expansion",
                description: "With stable margins, now might be a strategic time to test expanding into adjacent markets.",
                relatedRisk: null
            }
        ],
        totalSuggestions: 1,
        urgentCount: 0
    };
    
    const graphData = {
        revenueVsExpenses: { labels: ["2024-01", "2024-02", "2024-03"], datasets: [ { label: "Revenue", data: [45000, 50000, 55000] }, { label: "Expenses", data: [22000, 21000, 22000] } ] },
        profitMarginTrend: { labels: ["2024-01", "2024-02", "2024-03"], datasets: [{ label: "Profit Margin %", data: [51.1, 58.0, 60.0] }] },
        revenueBreakdown: { labels: ["SaaS", "Consulting", "Other"], data: [90000, 50000, 10000] },
        healthScoreGauge: { score: 88, grade: "A", color: "#4ade80" },
        monthlyProfitLoss: { labels: ["2024-01", "2024-02", "2024-03"], data: [23000, 29000, 33000], colors: ["#4ade80", "#4ade80", "#4ade80"] }
    };

    const predictions = {
        predictions: [
            { month: "2024-04", predictedRevenue: 60000, predictedExpenses: 22000, predictedProfit: 38000, predictedScore: 92, confidence: "high" },
            { month: "2024-05", predictedRevenue: 65000, predictedExpenses: 22500, predictedProfit: 42500, predictedScore: 95, confidence: "high" }
        ],
        trend: "improving",
        warnings: [],
        summary: "Your financial health is predicted to improve due to scalable revenue margins."
    };

    return res.status(200).json({
        success: true,
        message: "Demo analysis successful.",
        fileId: "demo-file-12345",
        extractedText: "Mock extracted text for demonstration...",
        parsedData,
        financials,
        healthScore,
        risks,
        suggestions,
        graphData,
        predictions,
        processingTime: "45ms"
    });
};

module.exports = {
    getDemoData
};
