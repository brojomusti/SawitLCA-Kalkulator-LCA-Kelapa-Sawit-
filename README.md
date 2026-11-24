# 🌴 SawitLCA — Kalkulator LCA Kelapa Sawit & Laporan PROPER KLHK

[![Standard](https://img.shields.io/badge/Standard-ISO%2014040%20%2F%2014044-2e7d32.svg)](https://www.iso.org/)
[![Compliance](https://img.shields.io/badge/Regulasi-PROPER%20KLHK-1565c0.svg)](#)
[![Schema](https://img.shields.io/badge/Schema-openLCA%20Compatible-ef6c00.svg)](https://www.openlca.org/)
[![Architecture](https://img.shields.io/badge/Architecture-Serverless%20SPA%20(HTML5%2FJS)-37474f.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**SawitLCA** adalah aplikasi berbasis web mandiri (*serverless Single-Page Application*) untuk menghitung dan menganalisis **Life Cycle Assessment (LCA)** pada ruang lingkup ***cradle-to-gate*** bagi industri perkebunan dan pabrik kelapa sawit (PKS) penghasil **Crude Palm Oil (CPO)** dan **Palm Kernel (PK)**. 

Dirancang selaras dengan kerangka kerja **ISO 14040:2006 / ISO 14044:2006**, struktur skema **openLCA**, serta pedoman penyusunan dokumen **Daur Hidup Produk (LCA) untuk Penilaian Peringkat Kinerja Perusahaan dalam Pengelolaan Lingkungan Hidup (PROPER) Kementerian Lingkungan Hidup dan Kehutanan (KLHK)**.

---

## 🎯 Fitur Utama

* **1. Definisi Tujuan & Ruang Lingkup (*Goal & Scope Definition*)**
  * Penetapan unit fungsional (*Functional Unit*): **1 Ton CPO** atau **1 Ton PK** (*at mill gate*).
  * Batasan sistem (*System Boundary*) terstruktur dari fase pembibitan/perkebunan (*Estate*), transportasi Tandan Buah Segar (TBS), hingga pengolahan di Pabrik Kelapa Sawit (*Mill*).
  * Dukungan aturan alokasi multi-produk berbasis **Massa (*Mass Allocation*)** dan **Nilai Ekonomi (*Economic Allocation*)** untuk CPO, PK, Cangkang (PKS), dan Serat (*Mesocarp Fibre*).

* **2. Inventori Daur Hidup (*Life Cycle Inventory / LCI*) Kompatibel openLCA**
  * **Sub-sistem Perkebunan (*Estate*)**: Input pupuk sintetis (Urea, NPK, MOP, RP, Kieserite), herbisida/pestisida, konsumsi bahan bakar alat berat/kendaraan kebun, serta perhitungan emisi lapangan langsung ($\text{N}_2\text{O}$ dari pemupukan, emisi lahan gambut/mineral, dan *Land Use Change*).
  * **Sub-sistem Transportasi TBS**: Kalkulasi jarak tempuh dan konsumsi solar armada angkut dari kebun inti, plasma, maupun pihak ketiga.
  * **Sub-sistem Pabrik Kelapa Sawit (*Mill*)**: Neraca massa ekstraksi OER (*Oil Extraction Rate*) dan KER (*Kernel Extraction Rate*), konsumsi energi boiler biomassa (cangkang & fiber), genset diesel, konsumsi listrik grid, pemakaian air proses, serta emisi metana ($\text{CH}_4$) dari pengelolaan limbah cair (**POME** — kolam terbuka vs *Methane Capture Biogas*).

* **3. Penilaian Dampak Daur Hidup (*Life Cycle Impact Assessment / LCIA*)**
  * Kalkulasi otomatis indikator dampak lingkungan utama sesuai standar pelaporan PROPER KLHK:
    * **Global Warming Potential (GWP 100-year)** ($\text{kg CO}_2\text{e}$)
    * **Acidification Potential (AP)** ($\text{kg SO}_2\text{e}$)
    * **Eutrophication Potential (EP)** ($\text{kg PO}_4^{3-}\text{e}$)
    * **Photochemical Ozone Creation Potential (POCP)** ($\text{kg C}_2\text{H}_4\text{e}$)
    * **Cumulative Energy Demand (CED)** ($\text{MJ}$) & **Water Footprint** ($\text{m}^3$)
  * Analisis kontribusi (*Hotspot Analysis*) interaktif berbasis grafik untuk mengidentifikasi unit proses penyumbang dampak terbesar.

* **4. Generator Laporan Otomatis (Siap Audit PROPER KLHK)**
  * Menyusun draf laporan teknis LCA terstruktur (Bab 1 Tujuan & Ruang Lingkup, Bab 2 Analisis Inventori LCI, Bab 3 Penilaian Dampak LCIA, Bab 4 Interpretasi & Rekomendasi Program Peningkatan Kinerja Lingkungan).
  * Ekspor data inventori ke format **JSON-LD / CSV skema openLCA** serta cetak laporan PDF rapi (*Print-ready CSS layout*).

---

## 🏗️ Arsitektur & Struktur Sistem

Aplikasi ini dibangun menggunakan arsitektur **100% Client-Side (Zero-Backend)** sehingga aman untuk kerahasiaan data operasional perusahaan dan dapat dijalankan secara luring (*offline*) maupun di-hosting di GitHub Pages / Vercel.

```text
SawitLCA/
├── index.html              # Antarmuka utama SPA & tata letak laporan cetak
├── css/
│   └── style.css           # Styling kustom & aturan CSS Print Media untuk laporan PROPER
├── js/
│   ├── app.js              # Kontroler navigasi & manajemen state aplikasi
│   ├── emission-factors.js # Basis data faktor emisi (IPCC, ecoinvent/openLCA, & faktor lokal Indonesia)
│   ├── lca-engine.js       # Mesin kalkulasi neraca massa, alokasi CPO/PK, & karakterisasi LCIA
│   ├── charts.js           # Visualisasi grafik kontribusi hotspot & diagram Sankey/Bar
│   └── report-generator.js # Penyusun naskah otomatis laporan LCA PROPER KLHK & ekspor CSV/JSON
├── data/
│   └── sample-pks-60tph.json # Dataset simulasi studi kasus PKS kapasitas 60 Ton TBS/jam
└── README.md               # Dokumentasi repositori
