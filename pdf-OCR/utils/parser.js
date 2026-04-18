const { parseTextFile } = require('../controllers/graphController');

/**
 * Non-AI parser that directly extracts structured data from OCR text.
 * Replaces the previous LLM-based parser for instant results.
 */
async function parseFinancialText(rawText) {
    if (!rawText || typeof rawText !== 'string' || rawText.trim() === '') {
        return {
            companies: [],
            warning: "No text provided for parsing.",
            summary: { totalCompanies: 0 }
        };
    }

    const parsed = parseTextFile(rawText);

    // Map to the expected schema used by predictController & others
    const companies = parsed.companies.map((c, idx) => {
        const monthly = parsed.monthlyData[idx] || {};
        const health = parsed.healthRows[idx] || {};
        return {
            businessId: c.businessId,
            businessName: c.name,
            state: c.state,
            sector: c.sector,
            metrics: {
                grossSalesK: monthly.grossSales || null,
                netProfitK: monthly.netProfit || null,
                workingCapitalK: null,
                currentRatio: null,
                debtEquityRatio: null,
                financialHealthScore: health.score || null,
                riskLabel: health.riskLabel || 'Unknown'
            }
        };
    });

    return {
        companies,
        summary: { totalCompanies: companies.length },
        year: parsed.year,
        monthlyData: parsed.monthlyData
    };
}

module.exports = {
    parseFinancialText
};
