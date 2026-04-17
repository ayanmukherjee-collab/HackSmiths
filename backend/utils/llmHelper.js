const fetch = require('node-fetch'); // Fallback if needed, but we'll try native fetch first
const https = require('https');

async function callLLM(systemPrompt, userPrompt, isJsonResponse = false) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.LLM_MODEL || "deepseek/deepseek-chat";

    if (!apiKey) {
        console.error("Missing OPENROUTER_API_KEY in .env");
        throw new Error("LLM API key not configured");
    }

    const payload = {
        model: model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ]
    };

    if (isJsonResponse) {
        payload.response_format = { type: "json_object" };
    }

    try {
        // Try to use native fetch (Node 18+)
        if (typeof globalThis.fetch === 'function') {
            const response = await globalThis.fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`OpenRouter API error: ${response.status} - ${errText}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            return isJsonResponse ? JSON.parse(content) : content;
        } else {
            // Fallback for older Node versions (use https module)
            return new Promise((resolve, reject) => {
                const req = https.request('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.choices[0].message.content;
                                resolve(isJsonResponse ? JSON.parse(content) : content);
                            } catch (e) {
                                reject(e);
                            }
                        } else {
                            reject(new Error(`OpenRouter API error: ${res.statusCode} - ${data}`));
                        }
                    });
                });
                req.on('error', reject);
                req.write(JSON.stringify(payload));
                req.end();
            });
        }
    } catch (error) {
        console.error("LLM Call Failed:", error);
        throw error;
    }
}

module.exports = {
    callLLM
};
