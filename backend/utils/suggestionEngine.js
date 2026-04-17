const { callLLM } = require('./llmHelper');

async function generateSuggestions(risks, financials) {
    const systemPrompt = `You are a strategic business advisor. You will be provided with a company's financial summary and a list of detected financial risks. Your job is to output 3 to 5 highly actionable, specific, and practical business suggestions to improve their financial health.

Return the suggestions in this EXACT JSON structure:
{
  "suggestions": [
    {
      "category": "cost_reduction" | "revenue_growth" | "tax" | "general" | "urgent_action" | "growth",
      "priority": "urgent" | "high" | "medium" | "low",
      "title": "String (Short, actionable title like 'Review Pricing Strategy')",
      "description": "String (1-2 sentences explaining what to do and why, referencing the financials or risks)",
      "relatedRisk": "String (The ID of the risk it addresses, or null if general)"
    }
  ],
  "totalSuggestions": number,
  "urgentCount": number
}

If critical or high risks are present, prioritize urgent_action and high-priority suggestions. If financials are perfectly healthy, provide general or growth suggestions. Ensure suggestions are distinct.`;

    const userPrompt = `Financials: ${JSON.stringify(financials)}
Detected Risks: ${JSON.stringify(risks)}`;

    try {
        const result = await callLLM(systemPrompt, userPrompt, true);
        
        if (!result.suggestions) result.suggestions = [];
        result.totalSuggestions = result.suggestions.length;
        result.urgentCount = result.suggestions.filter(s => s.priority === "urgent").length;
        
        // Sort by priority manually if LLM didn't order them perfectly
        const priorityWeight = { "urgent": 4, "high": 3, "medium": 2, "low": 1 };
        result.suggestions.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));

        return result;
    } catch (e) {
        console.error("LLM Suggestion Engine Error:", e);
        // Fallback to basic suggestion
        return {
            suggestions: [{
                category: "general",
                priority: "medium",
                title: "Review Financial Statements",
                description: "Manually review the current financial state to determine next steps.",
                relatedRisk: null
            }],
            totalSuggestions: 1,
            urgentCount: 0
        };
    }
}

module.exports = {
    generateSuggestions
};
