// aiInsight.js
async function callGroq(prompt) {
    if (!CONFIG.GROQ_API_KEY) throw new Error("Groq API Key belum diisi!");
    try {
        const response = await fetch(CONFIG.GROQ_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${CONFIG.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: CONFIG.GROQ_MODEL,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                max_tokens: 600
            })
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `HTTP Error ${response.status}`);
        }
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (err) {
        console.error("Groq Error:", err);
        throw err;
    }
}

async function callOllama(prompt) {
    const response = await fetch("ollama-proxy.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: CONFIG.OLLAMA_MODEL, prompt: prompt, stream: false })
    });
    if (!response.ok) throw new Error("Ollama Proxy Error");
    const data = await response.json();
    return data.response || "";
}

async function callAI(prompt) {
    if (CONFIG.AI_PROVIDER === 'groq') return await callGroq(prompt);
    return await callOllama(prompt);
}

async function getInsight(summary, question) {
    const prompt = `Data Penjualan: Total Sales=$${summary.totalSales}, Margin=${summary.overallMargin}%. Pertanyaan User: ${question}. Berikan rekomendasi bisnis superstore yang tajam berbahasa Indonesia.`;
    return await callAI(prompt);
}

async function narrateAllAlerts(anomalies) {
    const prompt = `Berikan ringkasan eksekutif 2 kalimat dalam Bahasa Indonesia mengenai daftar sub-kategori yang mengalami anomali kerugian berikut: ${JSON.stringify(anomalies.profitOutliers)}`;
    return await callAI(prompt);
}