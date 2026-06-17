// app.js
const COLOR = {
    normal: '#64748b',
    good: '#10b981',
    warning: '#f97316',
    severe: '#ef4444',
    accent: '#2563eb'
};

function parseNum(val) {
    if (!val) return 0;
    const num = parseFloat(String(val).trim().replace(',', '.'));
    return isNaN(num) ? 0 : num;
}

let allData = [];
let filteredData = [];
let summaryStats = {};
let currentAnomalies = {};

// Memuat data berkas riil dari CSV SALES kamu
d3.csv('Sales_BY_Category_202606040914-1.csv').then(async function(data) {
    allData = data.map(d => ({
        subcat: d['SubCategory'] || d['Sub-Category'] || 'Lainnya',
        category: d['Category'] || 'Umum',
        segment: d['Segment'] || 'Umum',
        territory: d['Territory'] || 'Global',
        qty: parseNum(d['Qty']),
        sales: parseNum(d['Sales']),
        profit: parseNum(d['Profit'])
    }));

    // Inisialisasi Opsi Dropdown Filter Secara Otomatis dari Isi Data Riil
    populateFilter('filter-category', [...new Set(allData.map(d => d.category))]);
    populateFilter('filter-segment', [...new Set(allData.map(d => d.segment))]);
    populateFilter('filter-territory', [...new Set(allData.map(d => d.territory))]);

    // Jalankan kalkulasi perdana
    processMetricsAndRender(allData);

    // Muat Komponen Narasi AI Otomatis dari Groq/Ollama
    try {
        const titleText = await generateTitle(summaryStats, currentAnomalies);
        document.getElementById('narrative-title').textContent = titleText.replace(/"/g, '');

        const storyText = await generateStory(summaryStats, currentAnomalies);
        const scr = parseStoryResponse(storyText);
        
        document.getElementById('setup-text').textContent = scr.setup;
        document.getElementById('conflict-text').textContent = scr.conflict;
        document.getElementById('resolution-text').textContent = scr.resolution;
        document.getElementById('insight-output').innerHTML = `<p style="line-height:1.6;">${scr.resolution}</p>`;
    } catch (e) {
        console.error("Narasi otomatis dilewati:", e);
        document.getElementById('narrative-title').textContent = "Dashboard Analisis Komparatif Finansial";
    }
}).catch(err => console.error("Gagal membaca file CSV:", err));

function populateFilter(elementId, uniqueValues) {
    const select = document.getElementById(elementId);
    if (!select) return;
    select.innerHTML = `<option value="ALL">-- SEMUA DATA --</option>` + 
        uniqueValues.map(v => `<option value="${v}">${v}</option>`).join('');
}

// Handler Aksi Trigger Saat Filter Diubah Pengguna
window.onFilterChange = function() {
    const catVal = document.getElementById('filter-category').value;
    const segVal = document.getElementById('filter-segment').value;
    const terrVal = document.getElementById('filter-territory').value;

    filteredData = allData.filter(d => {
        const mCat = (catVal === 'ALL' || d.category === catVal);
        const mSeg = (segVal === 'ALL' || d.segment === segVal);
        const mTerr = (terrVal === 'ALL' || d.territory === terrVal);
        return mCat && mSeg && mTerr;
    });

    processMetricsAndRender(filteredData);
};

function processMetricsAndRender(data) {
    summaryStats = computeSummary(data);
    currentAnomalies = detectAllAnomalies(data);

    const mb = document.getElementById('model-badge');
    if (mb) mb.textContent = CONFIG.GROQ_MODEL;

    renderSummaryCards(summaryStats);
    renderAlertList(currentAnomalies);
    renderD3Chart(data, currentAnomalies);
    renderScatterPlot(data, currentAnomalies);
}

function renderSummaryCards(stats) {
    const container = document.getElementById('summary-cards');
    if (!container) return;
    container.innerHTML = `
        <div class="card" style="border-top: 4px solid var(--accent);">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">TOTAL PENJUALAN</div>
            <div style="font-size: 1.4rem; font-weight: 700; margin-top: 4px;">$${Math.round(stats.totalSales).toLocaleString()}</div>
        </div>
        <div class="card" style="border-top: 4px solid var(--success);">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">UNTUNG BERSIH</div>
            <div style="font-size: 1.4rem; font-weight: 700; margin-top: 4px; color: var(--success);">$${Math.round(stats.totalProfit).toLocaleString()}</div>
        </div>
        <div class="card" style="border-top: 4px solid ${stats.overallMargin > 0 ? 'var(--success)' : 'var(--danger)'};">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">PROFIT MARGIN</div>
            <div style="font-size: 1.4rem; font-weight: 700; margin-top: 4px;">${stats.overallMargin}%</div>
        </div>
        <div class="card" style="border-top: 4px solid var(--warning);">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">KUANTITAS TERJUAL (QTY)</div>
            <div style="font-size: 1.4rem; font-weight: 700; margin-top: 4px; color: var(--warning);">${stats.totalQty.toLocaleString()} item</div>
        </div>
        <div class="card" style="border-top: 4px solid #7c3aed;">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">TOTAL TRANSAKSI</div>
            <div style="font-size: 1.4rem; font-weight: 700; margin-top: 4px; color: #7c3aed;">${stats.totalOrders.toLocaleString()} Orders</div>
        </div>
    `;
}

function renderAlertList(anomalies) {
    let severeCount = 0, warningCount = 0;
    anomalies.profitOutliers.forEach(a => { if (a.severity === 'severe') severeCount++; else warningCount++; });
    document.getElementById('badge-severe').textContent = `${severeCount} Kritis`;
    document.getElementById('badge-warning').textContent = `${warningCount} Peringatan`;

    const container = document.getElementById('alert-tab-raw');
    if (!container) return;
    if (anomalies.profitOutliers.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); padding: 1rem 0;">Aman. Tidak ada outlier negatif pada segmen data terpilih.</p>`;
        return;
    }
    container.innerHTML = anomalies.profitOutliers.map(a => `
        <div style="padding: 10px 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: ${a.severity === 'severe' ? 'var(--danger)' : 'var(--warning)'}"></span>
                <span style="font-weight: 600;">${a.name}</span>
            </div>
            <span style="font-weight: 700; color: var(--danger);">Margin: ${a.margin}% ($${a.profit.toLocaleString()})</span>
        </div>
    `).join('');
}

// CHART 1: BAR CHART D3
function renderD3Chart(data, anomalies) {
    const anomalyMap = buildAnomalyMap(anomalies);
    const aggregated = d3.rollups(data, v => d3.sum(v, d => d.profit), d => d.subcat)
        .map(([name, profit]) => ({ name, profit }))
        .sort((a, b) => b.profit - a.profit).slice(0, 8);

    const margin = {top: 10, right: 20, bottom: 35, left: 100},
          width = document.getElementById('chart-subcat').offsetWidth - margin.left - margin.right || 450,
          height = 290 - margin.top - margin.bottom;

    d3.select("#chart-subcat").html("");
    const svg = d3.select("#chart-subcat").append("svg")
        .attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([d3.min(aggregated, d => d.profit) - 1000, d3.max(aggregated, d => d.profit)]).range([0, width]);
    const y = d3.scaleBand().range([0, height]).domain(aggregated.map(d => d.name)).padding(.2);

    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(5));
    svg.append("g").call(d3.axisLeft(y));

    svg.selectAll("rect").data(aggregated).join("rect")
        .attr("x", d => x(Math.min(0, d.profit))).attr("y", d => y(d.name))
        .attr("width", d => Math.abs(x(d.profit) - x(0))).attr("height", y.bandwidth()).attr("rx", 3)
        .attr("fill", d => {
            const sev = anomalyMap.get(d.name);
            return sev === 'severe' ? COLOR.severe : (sev === 'warning' ? COLOR.warning : (d.profit > 0 ? COLOR.good : COLOR.severe));
        });

    const worst = anomalies.profitOutliers[0];
    if (worst) {
        document.getElementById('chart-title-subcat').innerHTML = `⚠️ <strong>Isu Utama:</strong> Kebocoran Profit Terdeteksi Kritis pada <strong>${worst.name}</strong> (${worst.margin}%)`;
    }
}

// CHART 2: SCATTER PLOT D3 (MEMBUKTIKAN SALES BESAR BELUM TENTU PROFIT TINGGI)
function renderScatterPlot(data, anomalies) {
    const subcatData = d3.rollups(data, 
        v => ({ sales: d3.sum(v, d => d.sales), profit: d3.sum(v, d => d.profit) }), 
        d => d.subcat
    ).map(([name, v]) => ({ name, sales: v.sales, profit: v.profit }));

    const margin = {top: 20, right: 30, bottom: 40, left: 60},
          width = document.getElementById('chart-scatter').offsetWidth - margin.left - margin.right || 450,
          height = 290 - margin.top - margin.bottom;

    d3.select("#chart-scatter").html("");
    const svg = d3.select("#chart-scatter").append("svg")
        .attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, d3.max(subcatData, d => d.sales) * 1.05]).range([0, width]);
    const y = d3.scaleLinear().domain([d3.min(subcatData, d => d.profit) - 1000, d3.max(subcatData, d => d.profit) * 1.05]).range([height, 0]);

    // Garis bantu horizontal nol profit
    svg.append("line").attr("x1", 0).attr("x2", width).attr("y1", y(0)).attr("y2", y(0))
        .attr("stroke", "#cbd5e1").attr("stroke-width", 1.5).attr("stroke-dasharray", "4,4");

    svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("$.2s")));
    svg.append("g").call(d3.axisLeft(y).tickFormat(d3.format("$.2s")));

    // Gambar Titik Representasi Sub-Kategori
    svg.selectAll("circle").data(subcatData).join("circle")
        .attr("cx", d => x(d.sales)).attr("cy", d => y(d.profit)).attr("r", 7)
        .attr("fill", d => d.profit < 0 ? COLOR.severe : COLOR.accent)
        .attr("opacity", 0.85).style("cursor", "pointer");

    // Tempel label teks singkat di atas lingkaran plot
    svg.selectAll(".scatter-label").data(subcatData).join("text")
        .attr("class", "scatter-label")
        .attr("x", d => x(d.sales) + 9).attr("y", d => y(d.profit) + 4)
        .text(d => d.name).attr("font-size", "9px").attr("fill", "#475569");
}

// ── BINDING INTERAKSI GLOBAL KLIK TOMBOL ──
window.requestInsight = async function() {
    const btn = document.getElementById('btn-insight');
    const output = document.getElementById('insight-output');
    const q = document.getElementById('custom-question');
    if (!btn || !output || !q) return;

    const query = q.value.trim();
    if (!query) return;

    btn.disabled = true; btn.textContent = 'Berpikir...';
    output.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">Agen AI sedang mengevaluasi matriks keterkaitan sales-profit...</p>';
    
    try {
        const text = await getInsight(summaryStats, query);
        output.innerHTML = `<p style="line-height:1.6;">${text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</p>`;
    } catch (e) {
        output.innerHTML = `<p style="color: var(--danger)">Gagal memproses rekomendasi: ${e.message}</p>`;
    } finally {
        btn.disabled = false; btn.textContent = 'Minta Insight →';
    }
};

window.quickAsk = function(questionText) {
    const el = document.getElementById('custom-question');
    if (el) {
        el.value = questionText;
        window.requestInsight();
    }
};

window.requestAlertNarration = async function() {
    const btn = document.getElementById('btn-narrate');
    const output = document.getElementById('ai-narration-output');
    if (!btn || !output) return;

    btn.disabled = true; btn.textContent = 'Memuat...';
    output.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">LLM sedang merumuskan ringkasan deviasi...</p>';

    try {
        const text = await narrateAllAlerts(currentAnomalies);
        output.innerHTML = `<p style="line-height:1.6; font-size: 0.9rem;">${text}</p>`;
        const aiTabBtn = document.querySelectorAll('.alert-tab')[1];
        if (aiTabBtn) window.switchAlertTab('ai', aiTabBtn);
    } catch (e) {
        output.innerHTML = `<p style="color: var(--danger)">Gagal: ${e.message}</p>`;
    } finally {
        btn.disabled = false; btn.textContent = 'Rangkum Isu (AI)';
    }
};

window.switchAlertTab = function(type, element) {
    document.querySelectorAll('.alert-tab').forEach(b => b.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('alert-tab-raw').style.display = type === 'raw' ? 'block' : 'none';
    document.getElementById('alert-tab-ai').style.display = type === 'ai' ? 'block' : 'none';
};

document.addEventListener('DOMContentLoaded', () => {
    const txtArea = document.getElementById('custom-question');
    if (txtArea) {
        txtArea.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                window.requestInsight();
            }
        });
    }
});