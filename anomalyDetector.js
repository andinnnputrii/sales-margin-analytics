// anomalyDetector.js
function computeSummary(data) {
    const totalSales = d3.sum(data, d => d.sales);
    const totalProfit = d3.sum(data, d => d.profit);
    const totalQty = d3.sum(data, d => d.qty);
    const overallMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(2) : 0;
    
    // Total Orders dihitung dari keunikan SalesOrderID (jika kolom tersedia) atau baris unik data
    const totalOrders = data.length;

    return {
        totalSales: totalSales.toFixed(2),
        totalProfit: totalProfit.toFixed(2),
        overallMargin,
        totalQty: totalQty,
        totalOrders: totalOrders
    };
}

function detectAllAnomalies(data) {
    const subcatRollup = d3.rollups(data,
        v => {
            const s = d3.sum(v, d => d.sales);
            const p = d3.sum(v, d => d.profit);
            return { sales: s, profit: p, margin: s > 0 ? (p / s) * 100 : 0 };
        },
        d => d.subcat
    );

    const margins = subcatRollup.map(([_, v]) => v.margin);
    const meanMargin = d3.mean(margins) || 0;
    const stdDevMargin = d3.deviation(margins) || 1;

    const profitOutliers = [];
    subcatRollup.forEach(([name, v]) => {
        const zScore = (v.margin - meanMargin) / stdDevMargin;
        if (zScore < -0.8 || v.profit < 0) {
            profitOutliers.push({
                name: name,
                sales: Math.round(v.sales),
                profit: Math.round(v.profit),
                margin: v.margin.toFixed(1),
                zScore: zScore.toFixed(2),
                severity: zScore < -1.4 ? 'severe' : 'warning'
            });
        }
    });

    return { profitOutliers: profitOutliers.sort((a,b) => a.profit - b.profit) };
}

function buildAnomalyMap(anomalies) {
    const map = new Map();
    anomalies.profitOutliers.forEach(a => map.set(a.name, a.severity));
    return map;
}