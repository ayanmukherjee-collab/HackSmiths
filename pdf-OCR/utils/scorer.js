function calculateHealthScore(financials, monthlyBreakdown) {
    if (!financials) return null;

    // 1. Profit Margin Score (40% weight)
    const margin = financials.profitMargin || 0;
    let pmScore = 0;
    if (margin >= 20) pmScore = 100;
    else if (margin >= 10) pmScore = 70;
    else if (margin >= 5) pmScore = 40;
    else if (margin >= 0) pmScore = 20;
    else pmScore = 0;
    
    // 2. Revenue Trend Score (25% weight)
    let revTrendScore = 60; // Default Stable
    if (monthlyBreakdown && monthlyBreakdown.length > 1) {
        let increasing = 0;
        let decreasing = 0;
        for (let i = 1; i < monthlyBreakdown.length; i++) {
            if (monthlyBreakdown[i].revenue > monthlyBreakdown[i-1].revenue) increasing++;
            else if (monthlyBreakdown[i].revenue < monthlyBreakdown[i-1].revenue) decreasing++;
        }
        if (increasing > decreasing) revTrendScore = 100;
        else if (decreasing > increasing) revTrendScore = 20;
        else revTrendScore = 60;
    } else if (monthlyBreakdown && monthlyBreakdown.length === 1) {
        revTrendScore = 60; // Stable
    }

    // 3. Expense Control Score (20% weight)
    const er = financials.expenseRatio || 0;
    let ecScore = 0;
    if (er < 50 && er > 0) ecScore = 100; // Making sure there is some revenue
    else if (er === 0 && financials.totalRevenue === 0) ecScore = 0; // Edge case
    else if (er < 50) ecScore = 100;
    else if (er <= 70) ecScore = 60;
    else if (er <= 85) ecScore = 30;
    else ecScore = 10;

    // 4. Consistency Score (15% weight)
    let consistencyScore = 100;
    if (monthlyBreakdown && monthlyBreakdown.length > 1) {
        const profits = monthlyBreakdown.map(m => m.profit);
        const avgProfit = profits.reduce((a, b) => a + b, 0) / profits.length;
        
        let variance = 0;
        profits.forEach(p => {
            variance += Math.pow(p - avgProfit, 2);
        });
        variance = variance / profits.length;
        const stdDev = Math.sqrt(variance);
        
        if (Math.abs(avgProfit) > 0) {
             const cv = (stdDev / Math.abs(avgProfit));
             if (cv < 0.2) consistencyScore = 100;       
             else if (cv < 0.5) consistencyScore = 80;   
             else if (cv < 1.0) consistencyScore = 50;   
             else consistencyScore = 20;                 
        } else {
             if (stdDev > 0) consistencyScore = 20;
             else consistencyScore = 100;
        }
    }

    const totalScore = (
        (pmScore * 0.40) + 
        (revTrendScore * 0.25) + 
        (ecScore * 0.20) + 
        (consistencyScore * 0.15)
    );

    const overallScore = Math.round(totalScore);

    // Determine Grade Mapping
    let grade = "F";
    if (overallScore >= 90) grade = "A+";
    else if (overallScore >= 80) grade = "A";
    else if (overallScore >= 70) grade = "B";
    else if (overallScore >= 60) grade = "C";
    else if (overallScore >= 50) grade = "D";

    return {
        overallScore,
        grade,
        breakdown: {
            profitMarginScore: { score: pmScore, weight: 40, weighted: pmScore * 0.40 },
            revenueTrendScore: { score: revTrendScore, weight: 25, weighted: revTrendScore * 0.25 },
            expenseControlScore: { score: ecScore, weight: 20, weighted: ecScore * 0.20 },
            consistencyScore: { score: consistencyScore, weight: 15, weighted: consistencyScore * 0.15 }
        }
    };
}

module.exports = {
    calculateHealthScore
};
