export type GuideFieldKey =
  | 'targetCpoTonYear'
  | 'gwpStandard'
  | 'oerPercent'
  | 'kerPercent'
  | 'allocationMethod'
  | 'lhvCpoMjKg'
  | 'lhvPkMjKg'
  | 'priceCpoIdrKg'
  | 'pricePkIdrKg'
  | 'plantationAreaHa'
  | 'ffbYieldTonHaYear'
  | 'ureaKgHaYear'
  | 'sp36KgHaYear'
  | 'kclKgHaYear'
  | 'dolomitKgHaYear'
  | 'herbicideKgHaYear'
  | 'fieldDieselLHaYear'
  | 'transportDistanceKm'
  | 'transportFuelLPerTkm'
  | 'enableLuc'
  | 'enablePeat'
  | 'pomeTreatment'
  | 'pomeVolumeM3PerTonFfb'
  | 'pomeCodMgL'
  | 'pomeCodRemovalPercent'
  | 'pomeLandApplication'
  | 'biomassBoilerSharePercent'
  | 'millDieselLPerTonFfb'
  | 'millWaterM3PerTonFfb'
  | 'efbTreatment';

export interface FieldGuideEntry {
  key: GuideFieldKey;
  step: 1 | 2 | 3;
  stepLabel: string;
  label: string;
  unit: string;
  typicalRange: string;
  whatItIs: string;
  lcaImpact: string;
  whereToFind: string;
}

export const LCA_GLOSSARY = [
  {
    term: 'Unit Fungsional (1 ton CPO & 1 ton PK)',
    explanation:
      'Satuan acuan standar agar semua emisi dan konsumsi sumber daya dapat dibandingkan secara adil per ton produk yang keluar dari gerbang pabrik.',
  },
  {
    term: 'Batasan Sistem Cradle-to-Gate',
    explanation:
      'Perhitungan dimulai dari hulu (pembuatan pupuk, budidaya kebun, dan angkut TBS) hingga pintu gerbang PKS (produk CPO & PK siap kirim), tidak termasuk rafinasi atau konsumen akhir.',
  },
  {
    term: 'GWP 100a, AP, dan EP',
    explanation:
      'GWP 100a mengukur potensi pemanasan global (kg CO2-eq); AP mengukur potensi hujan asam dari NH3/NOx/SO2 (kg SO2-eq); EP mengukur potensi penyuburan berlebih/eutrofikasi perairan dari nutrien & COD (kg PO4-eq).',
  },
  {
    term: 'Alokasi Co-product (CPO vs PK)',
    explanation:
      'Karena 1 ton TBS menghasilkan CPO dan Palm Kernel bersamaan, total emisi sistem dibagi proporsional menurut kandungan energi (LHV), nilai ekonomi (harga pasar), atau massa.',
  },
];

export const FIELD_GUIDES: Record<GuideFieldKey, FieldGuideEntry> = {
  targetCpoTonYear: {
    key: 'targetCpoTonYear',
    step: 1,
    stepLabel: 'Parameter & Alokasi',
    label: 'Target Produksi CPO Tahunan',
    unit: 'ton CPO/thn',
    typicalRange: '30.000 – 90.000 ton/thn (PKS 30–60 ton TBS/jam)',
    whatItIs: 'Total volume minyak sawit mentah (CPO) yang diproduksi pabrik selama periode kajian 1 tahun.',
    lcaImpact:
      'Menentukan skala total inventori tahunan (ton CO2-eq/tahun, kebutuhan TBS, dan total volume POME) untuk Tabel 6 Laporan PROPER; tidak mengubah intensitas per 1 ton CPO.',
    whereToFind: 'Laporan Produksi Tahunan PKS (Januari–Desember).',
  },
  gwpStandard: {
    key: 'gwpStandard',
    step: 1,
    stepLabel: 'Parameter & Alokasi',
    label: 'Standar Karakterisasi GWP 100a',
    unit: 'IPCC AR6 / AR5',
    typicalRange: 'IPCC AR6 (terbaru, 2021) atau AR5 (2013)',
    whatItIs: 'Faktor pengali untuk mengubah gas metana (CH4) dan N2O menjadi setara karbon dioksida (CO2-eq) dalam horizon 100 tahun.',
    lcaImpact:
      'AR6 memberi bobot CH4 biogenik sedikit lebih rendah (27 vs 28) tetapi N2O sedikit lebih tinggi (273 vs 265) dibanding AR5.',
    whereToFind: 'Pilih IPCC AR6 untuk pelaporan terbaru atau AR5 jika menyamakan basis dengan audit tahun sebelumnya.',
  },
  oerPercent: {
    key: 'oerPercent',
    step: 1,
    stepLabel: 'Parameter & Alokasi',
    label: 'Oil Extraction Rate (OER)',
    unit: '% TBS',
    typicalRange: '20,0% – 23,5%',
    whatItIs: 'Persentase berat CPO yang berhasil diekstraksi dari setiap ton Tandan Buah Segar (TBS) yang diolah.',
    lcaImpact:
      'Sangat berpengaruh: semakin tinggi OER, semakin sedikit TBS yang dibutuhkan per ton CPO sehingga intensitas emisi per ton CPO turun signifikan.',
    whereToFind: 'Rekapitulasi Rendemen Harian/Tahunan Laboratorium PKS.',
  },
  kerPercent: {
    key: 'kerPercent',
    step: 1,
    stepLabel: 'Parameter & Alokasi',
    label: 'Kernel Extraction Rate (KER)',
    unit: '% TBS',
    typicalRange: '4,2% – 5,8%',
    whatItIs: 'Persentase berat inti sawit (Palm Kernel / PK) yang dihasilkan dari total TBS terolah.',
    lcaImpact:
      'Memengaruhi rasio alokasi beban lingkungan antara CPO dan PK serta total produksi PK tahunan.',
    whereToFind: 'Laporan Produksi Stasiun Kernel PKS.',
  },
  allocationMethod: {
    key: 'allocationMethod',
    step: 1,
    stepLabel: 'Parameter & Alokasi',
    label: 'Metode Alokasi Co-product',
    unit: 'Energi / Ekonomi / Massa',
    typicalRange: 'Alokasi Energi (standar EU RED/BioGrace) atau Ekonomi (PROPER/ISO)',
    whatItIs: 'Aturan pembagian emisi bersama antara CPO dan Palm Kernel yang keluar dari proses pabrik yang sama.',
    lcaImpact:
      'Alokasi energi membebankan ~89–90% dampak ke CPO; alokasi massa membebankan ~81% ke CPO. Perbandingan ketiganya otomatis diuji pada Analisis Sensitivitas Bab 6.2.',
    whereToFind: 'Ditetapkan sesuai tujuan kajian LCA (energi untuk biofuel/ISCC, ekonomi untuk pasar komoditas).',
  },
  lhvCpoMjKg: {
    key: 'lhvCpoMjKg',
    step: 1,
    stepLabel: 'Parameter & Alokasi',
    label: 'Nilai Kalor Bawah (LHV) CPO',
    unit: 'MJ/kg',
    typicalRange: '36,5 – 37,5 MJ/kg (default BioGrace: 37,0)',
    whatItIs: 'Kandungan energi bersih per kilogram CPO untuk menghitung porsi alokasi energi.',
    lcaImpact: 'Semakin tinggi LHV CPO relatif terhadap PK, semakin besar porsi emisi yang dialokasikan ke CPO.',
    whereToFind: 'Referensi standar BioGrace / EU RED II (gunakan default 37,0 jika tidak ada uji kalorimeter).',
  },
  lhvPkMjKg: {
    key: 'lhvPkMjKg',
    step: 1,
    stepLabel: 'Parameter & Alokasi',
    label: 'Nilai Kalor Bawah (LHV) PK',
    unit: 'MJ/kg',
    typicalRange: '18,0 – 20,0 MJ/kg (default: 18,5)',
    whatItIs: 'Kandungan energi bersih per kilogram Palm Kernel (inti sawit).',
    lcaImpact: 'Digunakan bersama KER untuk menghitung porsi alokasi energi produk samping PK.',
    whereToFind: 'Referensi literatur sawit / RSPO PalmGHG (gunakan default 18,5 MJ/kg).',
  },
  priceCpoIdrKg: {
    key: 'priceCpoIdrKg',
    step: 1,
    stepLabel: 'Parameter & Alokasi',
    label: 'Harga Pasar Referensi CPO',
    unit: 'Rp/kg',
    typicalRange: 'Rp 11.000 – Rp 14.500 / kg',
    whatItIs: 'Harga rata-rata penjualan CPO selama periode kajian untuk skema Alokasi Ekonomi.',
    lcaImpact: 'Hanya berlaku saat metode Alokasi Ekonomi dipilih; harga lebih tinggi memperbesar porsi beban emisi CPO.',
    whereToFind: 'Harga rata-rata tender KPBN atau laporan keuangan penjualan tahunan perusahaan.',
  },
  pricePkIdrKg: {
    key: 'pricePkIdrKg',
    step: 1,
    stepLabel: 'Parameter & Alokasi',
    label: 'Harga Pasar Referensi PK',
    unit: 'Rp/kg',
    typicalRange: 'Rp 5.500 – Rp 8.500 / kg',
    whatItIs: 'Harga rata-rata penjualan Palm Kernel selama periode kajian untuk Alokasi Ekonomi.',
    lcaImpact: 'Menentukan bobot ekonomi PK terhadap total nilai penjualan CPO + PK.',
    whereToFind: 'Laporan penjualan inti sawit (PK) perusahaan pada tahun kajian.',
  },
  plantationAreaHa: {
    key: 'plantationAreaHa',
    step: 2,
    stepLabel: 'Input Kebun (Hulu)',
    label: 'Luas Areal Kebun Inti/Pemasok',
    unit: 'ha',
    typicalRange: '4.000 – 15.000 ha (tergantung kapasitas PKS)',
    whatItIs: 'Total luas tanaman menghasilkan (TM) yang memasok TBS ke PKS.',
    lcaImpact: 'Menjadi referensi profil kebun pada Bab 1 Laporan PROPER dan pembanding terhadap luas efektif kebutuhan TBS.',
    whereToFind: 'Data Areal Statement / Laporan Agronomi Kebun.',
  },
  ffbYieldTonHaYear: {
    key: 'ffbYieldTonHaYear',
    step: 2,
    stepLabel: 'Input Kebun (Hulu)',
    label: 'Produktivitas TBS (Yield)',
    unit: 'ton TBS/ha/thn',
    typicalRange: '18 – 26 ton/ha/thn',
    whatItIs: 'Rata-rata hasil panen Tandan Buah Segar per hektar kebun dalam satu tahun.',
    lcaImpact:
      'Berbanding terbalik dengan emisi kebun per ton TBS: yield lebih tinggi membagi beban pupuk, solar kebun, dan emisi lahan ke lebih banyak ton TBS.',
    whereToFind: 'Laporan Produksi Panen Tahunan (ton TBS dibagi luas TM).',
  },
  ureaKgHaYear: {
    key: 'ureaKgHaYear',
    step: 2,
    stepLabel: 'Input Kebun (Hulu)',
    label: 'Pupuk Urea (46% N)',
    unit: 'kg/ha/thn',
    typicalRange: '180 – 320 kg/ha/thn',
    whatItIs: 'Dosis aplikasi pupuk nitrogen Urea rata-rata per hektar per tahun.',
    lcaImpact:
      'Penyumbang utama emisi kebun: memicu CO2 manufaktur & hidrolisis urea, gas N2O (GWP 273× CO2), amonia NH3 (Acidification), serta pencucian nitrat NO3⁻ (Eutrophication).',
    whereToFind: 'Realisasi Pemupukan Tahunan Divisi Agronomi (jika memakai NPK majemuk, konversikan kandungan N ke setara Urea).',
  },
  sp36KgHaYear: {
    key: 'sp36KgHaYear',
    step: 2,
    stepLabel: 'Input Kebun (Hulu)',
    label: 'Pupuk SP-36 (36% P2O5)',
    unit: 'kg/ha/thn',
    typicalRange: '80 – 180 kg/ha/thn',
    whatItIs: 'Dosis aplikasi pupuk fosfat (setara SP-36 atau Rock Phosphate) per hektar per tahun.',
    lcaImpact: 'Sumber utama limpasan fosfat (PO4³⁻) ke badan air yang meningkatkan Eutrophication Potential (EP) dan emisi SO2 hulu.',
    whereToFind: 'Laporan Realisasi Pemupukan Fosfat (RP / SP-36 / TSP) Kebun.',
  },
  kclKgHaYear: {
    key: 'kclKgHaYear',
    step: 2,
    stepLabel: 'Input Kebun (Hulu)',
    label: 'Pupuk KCl / MOP (60% K2O)',
    unit: 'kg/ha/thn',
    typicalRange: '200 – 350 kg/ha/thn',
    whatItIs: 'Dosis aplikasi pupuk kalium (Muriate of Potash / KCl) per hektar per tahun.',
    lcaImpact: 'Berkontribusi moderat pada emisi CO2 fosil dan kebutuhan energi (CED) dari proses penambangan & pengolahan pupuk di hulu.',
    whereToFind: 'Laporan Realisasi Pemupukan Kalium (MOP/KCl) Kebun.',
  },
  dolomitKgHaYear: {
    key: 'dolomitKgHaYear',
    step: 2,
    stepLabel: 'Input Kebun (Hulu)',
    label: 'Dolomit — CaMg(CO3)2',
    unit: 'kg/ha/thn',
    typicalRange: '100 – 300 kg/ha/thn',
    whatItIs: 'Amelioran kapur magnesium untuk menetralkan keasaman tanah perkebunan.',
    lcaImpact: 'Pelapukan karbonat di tanah melepaskan 0,477 kg CO2 per kg dolomit (IPCC 2006 Eq. 11.12).',
    whereToFind: 'Laporan Realisasi Pemupukan Dolomit / Kieserite Kebun.',
  },
  herbicideKgHaYear: {
    key: 'herbicideKgHaYear',
    step: 2,
    stepLabel: 'Input Kebun (Hulu)',
    label: 'Herbisida / Pestisida (bahan aktif)',
    unit: 'kg a.i./ha/thn',
    typicalRange: '1,5 – 4,0 kg bahan aktif/ha/thn',
    whatItIs: 'Total bahan aktif herbisida (misal glifosat/paraquat) dan pestisida yang diaplikasikan per hektar per tahun.',
    lcaImpact: 'Meski dosisnya kecil, manufaktur bahan aktif kimia memiliki intensitas karbon dan energi tinggi (~11 kg CO2/kg a.i.).',
    whereToFind: 'Catatan Gudang Agrokimia Kebun (kalikan volume liter dengan konsentrasi bahan aktif).',
  },
  fieldDieselLHaYear: {
    key: 'fieldDieselLHaYear',
    step: 2,
    stepLabel: 'Input Kebun (Hulu)',
    label: 'Solar Alat Berat Kebun',
    unit: 'L/ha/thn',
    typicalRange: '35 – 80 liter/ha/thn',
    whatItIs: 'Konsumsi bahan bakar solar untuk traktor, excavator parit, perawatan jalan, dan kendaraan operasional blok kebun.',
    lcaImpact: 'Setiap liter solar menghasilkan ~3,25 kg CO2-eq (kilang + pembakaran) serta NOx & SO2 (Acidification).',
    whereToFind: 'Rekapitulasi Pemakaian BBM Traksi & Workshop Kebun.',
  },
  transportDistanceKm: {
    key: 'transportDistanceKm',
    step: 2,
    stepLabel: 'Input Kebun (Hulu)',
    label: 'Jarak Rata-rata Angkut TBS ke PKS',
    unit: 'km',
    typicalRange: '8 – 35 km (satu arah rata-rata tertimbang)',
    whatItIs: 'Jarak tempuh rata-rata truk pengangkut TBS dari Tempat Pengumpulan Hasil (TPH) kebun ke jembatan timbang PKS.',
    lcaImpact: 'Menentukan total konsumsi solar transportasi TBS (ton·km) dan emisi CO2 serta NOx kendaraan angkutan.',
    whereToFind: 'Data Logistik Angkutan TBS atau rata-rata jarak Google Maps tiap afdeling/pemasok.',
  },
  transportFuelLPerTkm: {
    key: 'transportFuelLPerTkm',
    step: 2,
    stepLabel: 'Input Kebun (Hulu)',
    label: 'Konsumsi Solar Truk Angkut',
    unit: 'L/ton·km',
    typicalRange: '0,06 – 0,09 L/ton·km (default: 0,075)',
    whatItIs: 'Rasio pemakaian solar truk per ton muatan TBS untuk setiap kilometer jarak angkut (termasuk perjalanan pulang kosong).',
    lcaImpact: 'Langsung mengalikan jarak angkut untuk menghitung kebutuhan solar tahap P4 (Transportasi TBS).',
    whereToFind: 'Total liter solar truk TBS dibagi (total ton TBS × rata-rata jarak km), atau gunakan nilai default 0,075.',
  },
  enableLuc: {
    key: 'enableLuc',
    step: 2,
    stepLabel: 'Input Kebun (Hulu)',
    label: 'Emisi Perubahan Penggunaan Lahan (LUC)',
    unit: 'kg CO2/ha/thn',
    typicalRange: '0 (replanting/ex-kebun) s/d 6.400 kg CO2/ha/thn',
    whatItIs: 'Emisi karbon akibat perubahan tutupan vegetasi sebelumnya menjadi kebun sawit, diamortisasi selama siklus tanam 25 tahun.',
    lcaImpact: 'Jika kebun dibuka dari lahan non-hutan/replanting nilainya 0; jika dari hutan sekunder, kontribusi CO2-LUC bisa sangat besar.',
    whereToFind: 'Dokumen Analisis Land Use Change Assessment (LUCA) RSPO/ISPO atau peta sejarah tutupan lahan.',
  },
  enablePeat: {
    key: 'enablePeat',
    step: 2,
    stepLabel: 'Input Kebun (Hulu)',
    label: 'Drainase Lahan Gambut',
    unit: '% luas areal gambut',
    typicalRange: '0% (mineral) hingga 100% (gambut penuh)',
    whatItIs: 'Proporsi blok kebun yang berada di tanah gambut terdrainase, tempat oksidasi bahan organik melepas CO2, CH4 parit, dan N2O secara terus-menerus.',
    lcaImpact: 'Dampak paling sensitif pada GWP: tiap 1 ha gambut terdrainase melepas ~40,3 ton CO2/tahun (IPCC Wetlands 2013).',
    whereToFind: 'Peta Jenis Tanah (Soil Map) Kebun & Dokumen Pemantauan Tinggi Muka Air Gambut.',
  },
  pomeTreatment: {
    key: 'pomeTreatment',
    step: 3,
    stepLabel: 'Input Pabrik (PKS)',
    label: 'Sistem Pengolahan Limbah Cair (POME)',
    unit: 'Open Lagoon / Capture',
    typicalRange: 'Open Lagoon (konvensional) vs Methane Capture (85–90%)',
    whatItIs: 'Teknologi pengolahan limbah cair panas berkadar organik tinggi (POME) yang berasal dari stasiun sterilisasi dan klarifikasi.',
    lcaImpact:
      'Penentu terbesar GWP di pabrik! Kolam anaerobik terbuka melepas gas metana (CH4) bebas ke udara (~60% total GWP CPO), sedangkan Methane Capture dapat memangkas emisi ini hingga 85–90%.',
    whereToFind: 'Konfigurasi eksisting IPAL PKS (apakah memiliki covered lagoon/biogas digester atau kolam terbuka).',
  },
  pomeVolumeM3PerTonFfb: {
    key: 'pomeVolumeM3PerTonFfb',
    step: 3,
    stepLabel: 'Input Pabrik (PKS)',
    label: 'Debit POME per ton TBS',
    unit: 'm3/ton TBS',
    typicalRange: '0,60 – 0,75 m3/ton TBS (default: 0,67)',
    whatItIs: 'Volume limbah cair POME yang dihasilkan untuk setiap ton TBS yang diproses di pabrik.',
    lcaImpact: 'Berbanding lurus dengan total beban COD yang masuk IPAL dan potensi pembentukan metana (CH4).',
    whereToFind: 'Catatan Flowmeter Inlet IPAL dibagi total TBS olah tahunan.',
  },
  pomeCodMgL: {
    key: 'pomeCodMgL',
    step: 3,
    stepLabel: 'Input Pabrik (PKS)',
    label: 'Konsentrasi COD Influen POME',
    unit: 'mg/L',
    typicalRange: '50.000 – 65.000 mg/L (default: 55.000)',
    whatItIs: 'Chemical Oxygen Demand (COD) atau konsentrasi beban organik pada POME mentah sebelum masuk kolam anaerobik.',
    lcaImpact: 'Semakin tinggi COD influen, semakin besar jumlah metana (CH4) yang terbentuk per m3 POME.',
    whereToFind: 'Hasil Uji Laboratorium Terakreditasi (rata-rata inlet fat pit / kolam anaerobik 1).',
  },
  pomeCodRemovalPercent: {
    key: 'pomeCodRemovalPercent',
    step: 3,
    stepLabel: 'Input Pabrik (PKS)',
    label: 'Efisiensi Penyisihan COD',
    unit: '%',
    typicalRange: '80% – 92% (default: 85%)',
    whatItIs: 'Persentase beban COD organik yang terurai oleh bakteri anaerobik di dalam sistem IPAL.',
    lcaImpact: 'Menentukan fraksi COD yang terkonversi menjadi biogas CH4 dan fraksi residu COD yang tersisa di efluen.',
    whereToFind: 'Selisih COD inlet dan outlet kolam anaerobik pada laporan pemantauan swapantau IPAL.',
  },
  pomeLandApplication: {
    key: 'pomeLandApplication',
    step: 3,
    stepLabel: 'Input Pabrik (PKS)',
    label: 'Pemanfaatan Efluen untuk Land Application',
    unit: 'Ya / Tidak',
    typicalRange: 'Aktif jika PKS memiliki izin Land Application (BOD < 5.000 mg/L)',
    whatItIs: 'Pengaliran limbah cair POME yang telah diolah ke parit/flatbed blok kebun sebagai pupuk organik cair, bukan dibuang ke sungai.',
    lcaImpact: 'Menurunkan drastis pelepasan residu COD dan fosfat ke badan air permukaan sehingga menekan Eutrophication Potential (EP).',
    whereToFind: 'Izin Lingkungan / Persetujuan Teknis Pemanfaatan Air Limbah (Land Application) PKS.',
  },
  biomassBoilerSharePercent: {
    key: 'biomassBoilerSharePercent',
    step: 3,
    stepLabel: 'Input Pabrik (PKS)',
    label: 'Porsi Energi Uap dari Biomassa (Fiber & Cangkang)',
    unit: '% kebutuhan uap',
    typicalRange: '90% – 100%',
    whatItIs: 'Persentase energi panas dan listrik pabrik yang dipenuhi dari pembakaran serabut (fiber) dan cangkang sawit di boiler turbin uap.',
    lcaImpact: 'CO2 biomassa bersifat netral karbon (GWP = 0), namun pembakaran tetap menghasilkan sedikit emisi NOx, SO2, CH4, dan N2O cerobong.',
    whereToFind: 'Laporan Neraca Energi & Operasional Stasiun Boiler PKS.',
  },
  millDieselLPerTonFfb: {
    key: 'millDieselLPerTonFfb',
    step: 3,
    stepLabel: 'Input Pabrik (PKS)',
    label: 'Konsumsi Solar Genset Tambahan',
    unit: 'L/ton TBS',
    typicalRange: '0,5 – 2,5 L/ton TBS',
    whatItIs: 'Solar fosil yang dipakai genset cadangan saat start-up awal boiler, maintenance, atau saat pasokan uap turbin tidak mencukupi.',
    lcaImpact: 'Langsung menambah emisi CO2 fosil (P5), NOx, dan kebutuhan energi tak terbarukan di pabrik.',
    whereToFind: 'Catatan Pemakaian Solar Genset PKS dibagi total TBS olah tahunan.',
  },
  millWaterM3PerTonFfb: {
    key: 'millWaterM3PerTonFfb',
    step: 3,
    stepLabel: 'Input Pabrik (PKS)',
    label: 'Konsumsi Air Proses PKS',
    unit: 'm3/ton TBS',
    typicalRange: '1,10 – 1,50 m3/ton TBS',
    whatItIs: 'Kebutuhan air baku (dari sungai/waduk melalui WTP) untuk boiler, pengenceran klarifikasi, dan pembersihan pabrik.',
    lcaImpact: 'Tercatat eksplisit pada Tabel 6 Inventori Proses Inti Laporan PROPER untuk evaluasi efisiensi air.',
    whereToFind: 'Catatan Flowmeter Water Treatment Plant (WTP) PKS.',
  },
  efbTreatment: {
    key: 'efbTreatment',
    step: 3,
    stepLabel: 'Input Pabrik (PKS)',
    label: 'Penanganan Tandan Kosong (EFB)',
    unit: 'Mulsa / Kompos / Dumping',
    typicalRange: 'Mulsa Kebun atau Co-composting (hindari Open Dumping)',
    whatItIs: 'Metode pengelolaan limbah padat Tandan Kosong Kelapa Sawit (~22% berat TBS) setelah proses penebahan.',
    lcaImpact:
      'Penumpukan terbuka (open dumping) memicu kondisi anaerobik dengan emisi metana tinggi; mulsa kebun rendah emisi, dan co-composting dengan POME sekaligus mengurangi beban COD POME sebesar 12%.',
    whereToFind: 'SOP Pengelolaan Limbah Padat Non-B3 PKS & Laporan Aplikasi Janjang Kosong.',
  },
};

export const FIELD_GUIDE_LIST: FieldGuideEntry[] = Object.values(FIELD_GUIDES);
