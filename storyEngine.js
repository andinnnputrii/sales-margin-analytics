async function generateStory(summary, anomalies) {
    const prompt = buildStoryPrompt(summary, anomalies);
    if (CONFIG.AI_PROVIDER === 'ollama') return await callOllama(prompt);
    return await callGroq(prompt);
}

async function generateTitle(summary, anomalies) {
    const severeCount = (anomalies.profitOutliers ? anomalies.profitOutliers.filter(a => a.severity === 'severe').length : 0);
    const worstAnomaly = (anomalies.profitOutliers && anomalies.profitOutliers[0]) || null;
    const context = `Data penjualan Superstore: Total Sales: $${summary.totalSales}, Profit Margin: ${summary.overallMargin}% - Anomali kritis terdeteksi: ${severeCount} ${worstAnomaly ? '- Anomali terparah: ' + JSON.stringify(worstAnomaly) : ''}`;
    const prompt = context + `\nTulis SATU judul dashboard dalam Bahasa Indonesia. Judul harus naratif (mengandung insight, bukan deskriptif). Maksimal 12 kata. Format: fakta kunci + implikasi atau rekomendasi. Hanya tulis judulnya saja, tanpa tanda kutip.`;
    if (CONFIG.AI_PROVIDER === 'ollama') return await callOllama(prompt);
    return await callGroq(prompt);
}

function buildStoryPrompt(summary, anomalies) {
    const profitLines = anomalies.profitOutliers && anomalies.profitOutliers.length > 0 
        ? anomalies.profitOutliers.map(a => `${a.name}: margin ${a.margin}% (Z=${a.zScore}, ${a.severity})`).join('\n') 
        : 'Tidak ada';
    const catLines = summary.categories ? summary.categories.map(c => `${c.category} : sales $${(c.sales/1000).toFixed(0)}K, margin ${c.margin}%`).join('\n') : '';
    
    return `Kamu analis bisnis senior. Berdasarkan data berikut, tulis narasi bisnis format SCR:
DATA KESELURUHAN: Total Sales: $${summary.totalSales}, Margin: ${summary.overallMargin}%
KATEGORI: ${catLines}
ANOMALI PROFIT: ${profitLines}

Tulis narasi dalam Bahasa Indonesia dengan FORMAT PERSIS seperti ini:
**SETUP**
[1 kalimat konteks]
**CONFLICT**
[1-2 kalimat masalah anomali paling kritis]
**RESOLUTION**
[1-2 kalimat rekomendasi konkret]
`;
}

function parseStoryResponse(text) {
    const result = { setup: "", conflict: "", resolution: "", raw: text };
    const setupMatch = text.match(/\*{0,2}SETUP\*{0,2}[\s\S]*?\n([\s\S]*?)(?=\*{0,2}CONFLICT|\*{0,2}RESOLUTION|$)/i);
    const conflictMatch = text.match(/\*{0,2}CONFLICT\*{0,2}[\s\S]*?\n([\s\S]*?)(?=\*{0,2}RESOLUTION|\*{0,2}SETUP|$)/i);
    const resolveMatch = text.match(/\*{0,2}RESOLUTION\*{0,2}[\s\S]*?\n([\s\S]*?)(?=\*{0,2}SETUP|\*{0,2}CONFLICT|$)/i);
    
    if (setupMatch) result.setup = setupMatch[1].trim();
    if (conflictMatch) result.conflict = conflictMatch[1].trim();
    if (resolveMatch) result.resolution = resolveMatch[1].trim();
    
    if (!result.setup && !result.conflict && !result.resolution) {
        result.setup = text.trim();
    }
    return result;
}
