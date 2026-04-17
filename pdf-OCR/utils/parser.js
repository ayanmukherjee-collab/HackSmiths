const { callLLM } = require('./llmHelper');

async function parseFinancialText(rawText) {
    if (!rawText || typeof rawText !== 'string' || rawText.trim() === '') {
        return {
            invoices: [],
            warning: "No text provided for parsing.",
            summary: { totalItems: 0, dateRange: { from: null, to: null } }
        };
    }

    const systemPrompt = `You are a financial data extraction assistant. Your job is to extract unstructured OCR text from financial documents (like invoices, bank statements, or receipts) into structured JSON. Extract each transaction or line item as an invoice object.

You MUST always return valid JSON conforming EXACTLY to this schema:
{
  "invoices": [
    {
      "date": "string (DD/MM/YYYY format) or 'Unknown'",
      "description": "string (clear description of the item or transaction)",
      "amount": number (float, total amount, do not include currency symbols),
      "type": "revenue" (if it is incoming money/sales) or "expense" (if it's a purchase/cost/fee),
      "taxAmount": number (float, extract tax like GST/VAT if specifically mentioned, otherwise 0.0)
    }
  ],
  "summary": {
    "totalItems": number (total number of invoices),
    "dateRange": {
      "from": "string (DD/MM/YYYY or 'Unknown')",
      "to": "string (DD/MM/YYYY or 'Unknown')"
    }
  }
}`;

    const userPrompt = `Extract financial data from the following text:\n\n${rawText}`;

    try {
        const result = await callLLM(systemPrompt, userPrompt, true);
        
        // Ensure structure exists in case LLM misses top-level keys
        if (!result.invoices) result.invoices = [];
        if (!result.summary) {
            let fromDate = "Unknown";
            let toDate = "Unknown";
            if (result.invoices.length > 0) {
                fromDate = result.invoices[0].date || "Unknown";
                toDate = result.invoices[result.invoices.length - 1].date || "Unknown";
            }
            result.summary = { totalItems: result.invoices.length, dateRange: { from: fromDate, to: toDate } };
        }
        
        if (result.invoices.length === 0 && !result.warning) {
            result.warning = "No structured financial data could be identified in the text.";
        }
        
        return result;
    } catch (e) {
        console.error("LLM Parsing Error:", e);
        return {
            invoices: [],
            warning: "Failed to parse data using LLM: " + e.message,
            summary: { totalItems: 0, dateRange: { from: null, to: null } }
        };
    }
}

module.exports = {
    parseFinancialText
};
