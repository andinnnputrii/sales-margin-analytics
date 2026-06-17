# 📊 Global Sales Intelligence & Profit Margin Analytics Dashboard

🔗 **Live Dashboard:** [Akses di sini](https://sales-margin-analytics-putriandini.netlify.app/)
🎥 **Video Presentasi:** [Tonton di YouTube](LINK_VIDEO_KAMU_DISINI)

Dashboard data *storytelling* interaktif yang mengintegrasikan visualisasi **D3.js** dengan kekuatan **Generative AI (LLM)** menggunakan framework **SCR (Setup, Conflict, Resolution)**. Dashboard ini dirancang secara modular untuk menganalisis metrik performa retail, mendeteksi anomali margin profit secara statistik, dan merumuskan narasi bisnis eksekutif secara otomatis.

---

## 🚀 Fitur Utama

1. **Automated Data Storytelling (SCR Framework)**: LLM secara otomatis membaca data agregat dan membagi analisis ke dalam tiga zona visual terpisah: *Setup* (konteks), *Conflict* (masalah/anomali), dan *Resolution* (rekomendasi aksi).
2. **Statistical Anomaly Detection**: Menggunakan perhitungan *Z-Score* pada margin keuntungan untuk mengidentifikasi sub-kategori yang berkinerja buruk secara ekstrem (Z-Score < -0.8 atau profit negatif) dan memberikan *visual highlight* semantis (warna merah/oranye).
3. **Interactive Narrative Title**: Judul utama dashboard digenerasikan secara dinamis oleh AI untuk mencerminkan *insight* paling kritis dari data terbaru, bukan sekadar judul deskriptif statis.
4. **Custom AI Insight Console**: Menyediakan kolom tanya jawab kustom bagi manajemen untuk mengeksplorasi data dengan pertanyaan bebas maupun tombol pertanyaan cepat.
5. **Dual Layout Integration**: Navigasi tab yang mulus untuk berpindah antara AI Dashboard berbasis D3.js dan visualisasi komparatif mikro yang di-embed langsung dari *Tableau Public*.

---

## 📁 Struktur Berkas

Pastikan seluruh struktur berkas berada dalam satu folder utama (root) seperti berikut:

```
sales-margin-analytics/
├── .gitignore                           # ⚠️ Mencegah API Key terunggah ke GitHub
├── index.html                           # Layout utama (tab bar + 3 zona SCR)
├── style.css                            # Semua styling komponen visual (Dark theme)
├── config.js                            # ⚠️ API key & konfigurasi model AI
├── app.js                               # Orkestrator utama: load data, render, filter
├── aiInsight.js                         # Komunikasi dengan LLM (Groq / Ollama)
├── anomalyDetector.js                   # Deteksi anomali: Z-score, MoM, dan IQR
├── storyEngine.js                       # Generator narasi SCR otomatis via LLM
├── ollama-proxy.php                     # Proxy opsional untuk integrasi model lokal
└── Sales_BY_Category_202606040914-1.csv # Dataset utama penjualan retail
```
---

## Langkah-langkah Menjalankan Proyek:
1. Buka folder proyek menggunakan code editor (VS Code).
2. Jalankan lokal server. Pilihan praktis:
3. Menggunakan extension Live Server di VS Code (Klik kanan pada index.html -> Open with Live Server).

---

### Konfigurasi Penyedia AI (LLM Setup)
Anda dapat memilih antara menggunakan layanan cloud berbasis API (Groq) atau model lokal tanpa internet (Ollama). Pengaturan dikelola melalui file config.js.

Menggunakan Groq API (Default Dev)
1. Buka file config.js.
2. Pastikan AI_PROVIDER diset ke 'groq'.
3. Isi properti GROQ_API_KEY dengan API Key Groq Anda yang valid:
 ```js
    GROQ_API_KEY: 'gsk_YOUR_ACTUAL_API_KEY_HERE',
    GROQ_MODEL: 'llama-3.1-8b-instant',
```
---

📊 Dataset & Insight Utama
Profil Data
1. Sumber Data: Adventure Works Sales modifikasi (18.106 transaksi).
2. Rentang Waktu: Juli 2001 – Juli 2004.
3. Metrik Utama: Kategori (Bikes, Clothing, Accessories), Sales, Profit, Qty, dan Wilayah (Territory).
---

Insight Kritis yang Ditemukan
1. Dominasi Revenue vs Margin: Sektor Bikes mendominasi omzet hingga ~97% dari total sales, namun sektor Accessories memiliki efisiensi margin terbaik yang konsisten di angka 55-62%.

2. Anomali Margin Negatif: Sub-kategori Caps (Clothing) terdeteksi memiliki margin negatif (-2.3%). Hal ini otomatis memicu indikator Conflict berwarna merah karena performanya berada di bawah ambang batas statistik Z-score.

3. Penyebaran Geografis: Wilayah Southwest menghasilkan revenue terbesar secara konsisten tiap kuartal.
---

📝 Refleksi Proyek
Apa yang Berhasil
1. Progressive Enhancement: Visualisasi grafik D3.js muncul terlebih dahulu tanpa menunggu proses API LLM selesai, sehingga mencegah blank screen dan menjaga kenyamanan pengguna (user experience).

2. Pipeline Otomatis: Integrasi filter interaktif berjalan mulus. Saat filter diubah, seluruh pipa data (Data → Anomaly Checking → Chart Re-render → Prompt Update → AI Response) langsung diperbarui secara dinamis.

3. Efisiensi Z-Score: Pendekatan statistik berhasil memotong beban token prompt LLM karena AI hanya perlu membaca rangkuman data anomali yang sudah difilter oleh sistem, bukan seluruh baris mentah CSV.

---
Rencana Pengembangan ke Depan
1. Brushing & Linking: Menambahkan fitur drill-down interaktif antar chart (misalnya, mengklik satu wilayah di peta/grafik akan otomatis memfilter grafik produk di sebelahnya tanpa menggunakan menu dropdown manual).

2. Optimasi Prompting: Meningkatkan kualitas rekayasa prompt agar model visual yang lebih kecil (seperti Llama 1B/8B) dapat menghasilkan rekomendasi resolusi bisnis yang jauh lebih spesifik dan kontekstual.

Dibuat untuk Final Project Data Visualization · 2026