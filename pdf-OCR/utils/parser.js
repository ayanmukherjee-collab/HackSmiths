const { callLLM } = require('./llmHelper');

async function parseFinancialText(rawText) {
    if (!rawText || typeof rawText !== 'string' || rawText.trim() === '') {
        return {
            companies: [],
            warning: "No text provided for parsing.",
            summary: { totalCompanies: 0 }
        };
    }

    const systemPrompt = `You are a financial data extraction assistant. Your job is to extract tabular financial health data of SMEs from parsed PDF text into structured JSON format. 
The text contains multiple pages. Different columns of metric values for the same companies are spread across different pages, so you must merge the data using the order of appearance or the row index.

You MUST always return valid JSON conforming EXACTLY to this schema:
{
  "companies": [
    {
      "businessId": "SME-202021-001",
      "businessName": "string",
      "state": "string",
      "sector": "string",
      "metrics": {
         "grossSalesK": number (if available),
         "netProfitK": number (if available),
         "workingCapitalK": number (if available),
         "currentRatio": number (if available),
         "debtEquityRatio": number (if available),
         "financialHealthScore": number (if available),
         "riskLabel": "string"
      }
    }
  ],
  "summary": {
    "totalCompanies": number
  }
}`;

    const userPrompt = `Extract SME financial health data from the following text and carefully merge properties across pages for each business:\n\n${rawText}`;

    try {
        const result = await callLLM(systemPrompt, userPrompt, true);

        // Ensure structure exists
        if (!result.companies) result.companies = [];
        if (!result.summary) {
            result.summary = { totalCompanies: result.companies.length };
        }

        if (result.companies.length === 0 && !result.warning) {
            result.warning = "No SME financial health data could be identified in the text.";
        }

        return result;
    } catch (e) {
        console.error("LLM Parsing Error:", e);
        return {
            companies: [],
            warning: "Failed to parse data using LLM: " + e.message,
            summary: { totalCompanies: 0 }
        };
    }
}

module.exports = {
    parseFinancialText
};
