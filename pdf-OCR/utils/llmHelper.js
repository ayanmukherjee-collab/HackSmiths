async function callLLM(systemPrompt, userPrompt, isJsonResponse = false) {
    const { OPENROUTER_API_KEY } = process.env;

    if (!OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY environment variable is missing.");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "deepseek/deepseek-chat",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter Error response:", errorText);
        throw new Error(`OpenRouter API responded with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";

    if (isJsonResponse) {
        try {
            const cleanContent = content.replace(/```json/gi, "").replace(/```/gi, "").trim();
            return JSON.parse(cleanContent);
        } catch (e) {
            console.error("Failed to parse JSON string:", content);
            throw new Error("Failed to parse LLM response as JSON: " + e.message);
        }
    }

    return content;
}

module.exports = { callLLM };
