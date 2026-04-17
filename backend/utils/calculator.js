function calculateFinancials(parsedData) {
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalTax = 0;

    if (!parsedData || !parsedData.invoices) {
        return {
            totalRevenue: 0,
            totalExpenses: 0,
            netProfit: 0,
            profitMargin: 0,
            expenseRatio: 0,
            totalTax: 0,
            effectiveTaxRate: 0
        };
    }

    parsedData.invoices.forEach(item => {
        if (item.type === 'revenue') {
            totalRevenue += (item.amount || 0);
        } else if (item.type === 'expense') {
            totalExpenses += (item.amount || 0);
        }
        totalTax += (item.taxAmount || 0);
    });

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
    const effectiveTaxRate = totalRevenue > 0 ? (totalTax / totalRevenue) * 100 : 0;

    return {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        netProfit: parseFloat(netProfit.toFixed(2)),
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        expenseRatio: parseFloat(expenseRatio.toFixed(2)),
        totalTax: parseFloat(totalTax.toFixed(2)),
        effectiveTaxRate: parseFloat(effectiveTaxRate.toFixed(2))
    };
}

function calculateMonthlyBreakdown(parsedData) {
    if (!parsedData || !parsedData.invoices) return [];

    const monthlyData = {};

    parsedData.invoices.forEach(item => {
        let monthKey = "Unknown";
        if (item.date && item.date !== "Unknown") {
            try {
                let d;
                if (item.date.includes('/')) {
                    const parts = item.date.split('/');
                    if (parts[0].length === 2 && parts[2].length === 4) {
                        d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                    } else if (parts[2].length === 2 && parts[0].length === 4) {
                        d = new Date(item.date);
                    } else {
                         // Fallback
                         d = new Date(item.date);
                    }
                } else {
                    d = new Date(item.date);
                }
                
                if (!isNaN(d.getTime())) {
                    monthKey = d.toISOString().substring(0, 7); // YYYY-MM
                }
            } catch (e) {
                monthKey = "Unknown";
            }
        }

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { revenue: 0, expenses: 0 };
        }

        if (item.type === 'revenue') {
            monthlyData[monthKey].revenue += (item.amount || 0);
        } else if (item.type === 'expense') {
            monthlyData[monthKey].expenses += (item.amount || 0);
        }
    });

    const breakdown = Object.keys(monthlyData).map(month => {
        const rev = monthlyData[month].revenue;
        const exp = monthlyData[month].expenses;
        const profit = rev - exp;
        const margin = rev > 0 ? (profit / rev) * 100 : 0;
        
        return {
            month,
            revenue: parseFloat(rev.toFixed(2)),
            expenses: parseFloat(exp.toFixed(2)),
            profit: parseFloat(profit.toFixed(2)),
            margin: parseFloat(margin.toFixed(2))
        };
    });

    // Sort chronologically
    breakdown.sort((a, b) => a.month.localeCompare(b.month));

    return breakdown;
}

function getCompleteFinancials(parsedData) {
    return {
        overall: calculateFinancials(parsedData),
        monthly: calculateMonthlyBreakdown(parsedData)
    };
}

module.exports = {
    calculateFinancials,
    calculateMonthlyBreakdown,
    getCompleteFinancials
};
