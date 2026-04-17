const { callLLM } = require('./llmHelper');

async function predictFuture(monthlyBreakdown, currentScore) {
    if (!monthlyBreakdown || monthlyBreakdown.length === 0) {
        return { predictions: [], trend: "stable", warnings: [], summary: "Not enough historical data to predict." };
    }

    const systemPrompt = `You are an expert financial forecaster. You will be provided with a company's historical monthly financial data and their current health score (0-100). Your task is to intelligently project the next 3 months of revenue, expenses, profit, and health score.

Consider realistic business dynamics: expenses rarely drop to zero, seasonality might exist, and exponential growth usually flattens. 

You MUST return a JSON object exactly matching this schema:
{
  "predictions": [
    {
      "month": "YYYY-MM (String, chronologically following the last month in data)",
      "predictedRevenue": number (float),
      "predictedExpenses": number (float),
      "predictedProfit": number (float, Revenue - Expenses),
      "predictedScore": number (int, 0 to 100),
      "confidence": "high" | "medium" | "low"
    }
  ],
  "trend": "improving" | "stable" | "declining",
  "warnings": ["String (List any risks like impending net losses or score drops, empty array if none)"],
  "summary": "String (1-2 sentences summarizing the future outlook)"
}

Ensure the predictions array has exactly 3 chronological items corresponding to the next 3 months.`;

    const userPrompt = `Historical Monthly Data: ${JSON.stringify(monthlyBreakdown)}\nCurrent Health Score: ${currentScore}`;

    try {
        const result = await callLLM(systemPrompt, userPrompt, true);
        
        // Ensure structure exists
        if (!result.predictions) result.predictions = [];
        if (!result.warnings) result.warnings = [];
        if (!result.trend) result.trend = "stable";
        if (!result.summary) result.summary = "Prediction generated successfully.";

        return result;
    } catch (e) {
        console.error("LLM Prediction Error:", e);
        // Minimal fallback
        return {
            predictions: [],
            trend: "stable",
            warnings: ["Failed to generate deep predictions due to API error."],
            summary: "Unable to project future data accurately at this time."
        };
    }
}

module.exports = {
    predictFuture
};
