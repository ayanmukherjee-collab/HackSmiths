const { callLLM } = require('./llmHelper');

async function detectRisks(financials, monthlyBreakdown) {
    if (!financials) return [];

    const systemPrompt = `You are an expert financial risk analyst. You will be provided with a company's overall financials and their monthly breakdown. Your task is to analyze this data and return a JSON array of detected financial risks.

Each risk MUST exactly match this JSON structure:
[
  {
    "riskId": "STRING (e.g., LOW_PROFIT_MARGIN, NET_LOSS, DECLINING_REVENUE, HIGH_EXPENSE_RATIO, etc.)",
    "title": "String (Human-readable title)",
    "description": "String (Detailed explanation of the risk, using actual numbers from the data)",
    "severity": "critical" | "high" | "medium" | "low",
    "currentValue": "String (The specific metric that triggered the risk, e.g., '5%' or '-$1,000')",
    "threshold": "String (The healthy threshold this violated, e.g., '< 10%' or '> 70%')"
  }
]

Analyze for common business risks: low profit margins (<10%), net losses, declining revenue over consecutive months, inconsistent income/high variance, expenses growing faster than revenue, or high expense ratios (>70%). Only return actual risks you detect in the data. Return an empty array if financials are perfectly healthy.`;

    const userPrompt = `Financials: ${JSON.stringify(financials)}
Monthly Breakdown: ${JSON.stringify(monthlyBreakdown)}`;

    try {
        const result = await callLLM(systemPrompt, userPrompt, true);
        return Array.isArray(result) ? result : [];
    } catch (e) {
        console.error("LLM Risk Detection Error:", e);
        // Fallback to basic rule
        if (financials.netProfit < 0) {
            return [{
                riskId: "NET_LOSS",
                title: "Net Loss Detected",
                description: `The business is operating at a net loss of $${Math.abs(financials.netProfit).toLocaleString()}.`,
                severity: "critical",
                currentValue: `-$${Math.abs(financials.netProfit).toLocaleString()}`,
                threshold: "< $0"
            }];
        }
        return [];
    }
}

module.exports = {
    detectRisks
};
