import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LcaInputParams, LcaResult, ReportMetadata } from './types';

export type PdfReportScope = 'all' | 'exec' | 'tech' | 'appendix';

const fmt = (n: number, dec = 2) =>
  n.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec });

/** Normalizes Unicode subscripts/superscripts/symbols not supported by jsPDF standard Helvetica (WinAnsi). */
const pdfSafe = (value: string | number): string =>
  String(value)
    .replace(/₀/g, '0')
    .replace(/₁/g, '1')
    .replace(/₂/g, '2')
    .replace(/₃/g, '3')
    .replace(/₄/g, '4')
    .replace(/₅/g, '5')
    .replace(/₆/g, '6')
    .replace(/₇/g, '7')
    .replace(/₈/g, '8')
    .replace(/₉/g, '9')
    .replace(/²/g, '2')
    .replace(/³/g, '3')
    .replace(/⁻/g, '-')
    .replace(/⁺/g, '+')
    .replace(/[–—]/g, '-')
    .replace(/·/g, '|')
    .replace(/•/g, '-')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/→/g, '->')
    .replace(/×/g, 'x')
    .replace(/±/g, '+/-');

type DocWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

const TEAL: [number, number, number] = [15, 118, 110];
const DARK_TEAL: [number, number, number] = [17, 94, 89];
const SLATE_900: [number, number, number] = [15, 23, 42];
const SLATE_600: [number, number, number] = [71, 85, 105];
const SLATE_200: [number, number, number] = [226, 232, 240];
const SLATE_50: [number, number, number] = [248, 250, 252];
const AMBER: [number, number, number] = [217, 119, 6];

export function generateProperPdfReport(
  params: LcaInputParams,
  result: LcaResult,
  meta: ReportMetadata,
  scope: PdfReportScope = 'all'
): string {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as DocWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;
  let y = 18;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 18) {
      doc.addPage();
      y = 18;
    }
  };

  const addSectionHeader = (kicker: string, title: string) => {
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...TEAL);
    doc.text(pdfSafe(kicker), marginX, y);
    y += 5;
    doc.setFontSize(13);
    doc.setTextColor(...SLATE_900);
    doc.text(pdfSafe(title), marginX, y);
    y += 2.5;
    doc.setDrawColor(...SLATE_200);
    doc.setLineWidth(0.4);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 5.5;
  };

  const addSubheading = (text: string) => {
    ensureSpace(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...SLATE_900);
    doc.text(pdfSafe(text), marginX, y);
    y += 5;
  };

  const addParagraph = (text: string, opts?: { italic?: boolean; bold?: boolean; indent?: number }) => {
    const indent = opts?.indent ?? 0;
    const style = opts?.bold ? 'bold' : opts?.italic ? 'italic' : 'normal';
    doc.setFont('helvetica', style);
    doc.setFontSize(9);
    doc.setTextColor(...SLATE_600);
    const lines = doc.splitTextToSize(pdfSafe(text), contentWidth - indent) as string[];
    const blockHeight = lines.length * 4.3 + 2.5;
    ensureSpace(blockHeight);
    doc.text(lines, marginX + indent, y);
    y += blockHeight;
  };

  const addCalloutBox = (title: string, body: string, fillRgb: [number, number, number] = SLATE_50) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    const lines = doc.splitTextToSize(pdfSafe(`${title} ${body}`), contentWidth - 8) as string[];
    const boxH = lines.length * 4.3 + 7;
    ensureSpace(boxH + 3);
    doc.setFillColor(...fillRgb);
    doc.setDrawColor(...SLATE_200);
    doc.roundedRect(marginX, y - 1, contentWidth, boxH, 2, 2, 'FD');
    doc.setTextColor(...SLATE_900);
    doc.text(lines, marginX + 4, y + 4);
    y += boxH + 4;
  };

  const runTable = (
    caption: string,
    head: string[],
    body: (string | number)[][],
    colAlignRight: number[] = []
  ) => {
    ensureSpace(24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...SLATE_900);
    doc.text(pdfSafe(caption), marginX, y);
    y += 3;

    const columnStyles: Record<number, { halign: 'right' }> = {};
    for (const idx of colAlignRight) {
      columnStyles[idx] = { halign: 'right' };
    }

    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [head.map((cell) => pdfSafe(cell))],
      body: body.map((row) => row.map((cell) => pdfSafe(cell))),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2.2,
        textColor: SLATE_900,
        lineColor: SLATE_200,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: DARK_TEAL,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: SLATE_50,
      },
      columnStyles,
    });

    y = (doc.lastAutoTable?.finalY ?? y + 12) + 6;
  };

  // Precompute shared derived figures
  const allocLabel =
    params.allocationMethod === 'energy'
      ? 'Alokasi Energi (berdasarkan Lower Heating Value / LHV)'
      : params.allocationMethod === 'economic'
      ? 'Alokasi Ekonomi (berdasarkan harga pasar relatif)'
      : 'Alokasi Massa (berdasarkan rasio rendemen OER dan KER)';

  const pomeLabel =
    params.pomeTreatment === 'open_lagoon'
      ? 'Kolam Anaerobik Terbuka (Open Anaerobic Lagoon, 0% penangkapan CH4)'
      : params.pomeTreatment === 'methane_capture_flare'
      ? 'Methane Capture dengan Flaring (85% penangkapan CH4)'
      : 'Methane Capture dengan Pemanfaatan Biogas / PLTBg (90% penangkapan CH4)';

  const upstreamGwp = result.stageBreakdown
    .filter((s) => s.lifecyclePhase === 'Upstream (Hulu)')
    .reduce((a, b) => a + b.gwpPerTonCpo, 0);
  const coreGwp = result.stageBreakdown
    .filter((s) => s.lifecyclePhase === 'Core (Inti PKS)')
    .reduce((a, b) => a + b.gwpPerTonCpo, 0);
  const upstreamAp = result.stageBreakdown
    .filter((s) => s.lifecyclePhase === 'Upstream (Hulu)')
    .reduce((a, b) => a + b.apPerTonCpo, 0);
  const coreAp = result.stageBreakdown
    .filter((s) => s.lifecyclePhase === 'Core (Inti PKS)')
    .reduce((a, b) => a + b.apPerTonCpo, 0);
  const upstreamEp = result.stageBreakdown
    .filter((s) => s.lifecyclePhase === 'Upstream (Hulu)')
    .reduce((a, b) => a + b.epPerTonCpo, 0);
  const coreEp = result.stageBreakdown
    .filter((s) => s.lifecyclePhase === 'Core (Inti PKS)')
    .reduce((a, b) => a + b.epPerTonCpo, 0);

  const pareto80Text = result.materialContributions
    .filter((m) => m.isPareto80)
    .map((m) => `${m.material} (${fmt(m.gwpSharePercent, 1)}%)`)
    .join('; ');

  const totalFertilizerAnnualTon =
    (((params.ureaKgHaYear + params.sp36KgHaYear + params.kclKgHaYear + params.dolomitKgHaYear) /
      params.ffbYieldTonHaYear) *
      result.annualFfbTon) /
    1000;
  const totalDieselAnnualL =
    (params.fieldDieselLHaYear / params.ffbYieldTonHaYear +
      params.transportDistanceKm * params.transportFuelLPerTkm +
      params.millDieselLPerTonFfb) *
    result.annualFfbTon;
  const totalWaterAnnualM3 = params.millWaterM3PerTonFfb * result.annualFfbTon;

  // =========================================================================
  // COVER HEADER BLOCK
  // =========================================================================
  doc.setFillColor(...DARK_TEAL);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(204, 251, 241);
  doc.text('DOKUMEN PENILAIAN DAUR HIDUP (LIFE CYCLE ASSESSMENT) - PROPER KLHK', marginX, 12);

  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(
    'Laporan Penilaian Daur Hidup (LCA) Cradle-to-Gate Produk Crude Palm Oil (CPO) dan Palm Kernel (PK)',
    contentWidth
  ) as string[];
  doc.text(titleLines, marginX, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text(
    pdfSafe(`Versi ${meta.reportVersion}  |  Tanggal Publikasi: ${meta.reportDate}  |  Periode Kajian: ${meta.studyPeriod}`),
    marginX,
    35
  );

  y = 48;

  // Metadata Box
  doc.setFillColor(...SLATE_50);
  doc.setDrawColor(...SLATE_200);
  doc.roundedRect(marginX, y, contentWidth, 24, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...SLATE_900);
  doc.text(pdfSafe(meta.companyName), marginX + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...SLATE_600);
  doc.text(pdfSafe(`${meta.millName} - ${meta.location}`), marginX + 4, y + 11.5);
  doc.text(pdfSafe(`Praktisi LCA: ${meta.leadPractitioner} | Kontak: ${meta.contactEmail}`), marginX + 4, y + 16.5);
  doc.text(
    'Standar Acuan: SNI ISO 14040:2016, SNI ISO 14044:2017 & Permen LHK No. 1 Tahun 2021 (Pedoman PROPER KLHK 2021)',
    marginX + 4,
    y + 21.5
  );
  y += 31;

  const showExec = scope === 'all' || scope === 'exec';
  const showTech = scope === 'all' || scope === 'tech';
  const showAppendix = scope === 'all' || scope === 'appendix';

  // =========================================================================
  // BAGIAN I: LAPORAN EKSEKUTIF
  // =========================================================================
  if (showExec) {
    addSectionHeader('BAGIAN I · HAL. 3–4 PEDOMAN KLHK 2021', 'Ringkasan Eksekutif (Laporan Eksekutif)');

    addParagraph(
      `Kajian Penilaian Daur Hidup (LCA) ini mengevaluasi profil dampak lingkungan cradle-to-gate untuk produksi Crude Palm Oil (CPO) dan Palm Kernel (PK) pada ${meta.millName} (${meta.companyName}) periode ${meta.studyPeriod}. Unit fungsi yang ditetapkan adalah 1 ton CPO dan 1 ton PK di pintu gerbang pabrik dengan metode ${allocLabel} (CPO ${fmt(result.allocationCpo * 100, 1)}% : PK ${fmt(result.allocationPk * 100, 1)}%).`
    );

    runTable(
      'Ringkasan Hasil Karakterisasi Dampak Lingkungan (LCIA) per Unit Fungsional',
      ['Kategori Dampak', 'Indikator', 'Per 1 ton CPO', 'Per 1 ton PK', 'Metode Karakterisasi'],
      [
        ['Global Warming Potential (GWP 100a)', 'kg CO2-eq', fmt(result.gwpCpo, 2), fmt(result.gwpPk, 2), `IPCC ${params.gwpStandard} GWP 100a`],
        ['Acidification Potential (AP)', 'kg SO2-eq', fmt(result.apCpo, 3), fmt(result.apPk, 3), 'CML-IA Baseline v4.8'],
        ['Eutrophication Potential (EP)', 'kg PO4-eq', fmt(result.epCpo, 3), fmt(result.epPk, 3), 'CML-IA Baseline v4.8'],
        ['Cumulative Energy Demand (CED)', 'MJ-eq', fmt(result.cedCpo, 1), fmt(result.cedPk, 1), 'LHV BioGrace / Ecoinvent'],
      ],
      [2, 3]
    );

    const execSummaryRec =
      result.pomeReductionPotentialKgCo2eq > 20
        ? `Penerapan sistem penangkapan metana (Methane Capture / PLTBg) pada IPAL POME berpotensi menurunkan emisi sebesar ${fmt(result.pomeReductionPotentialKgCo2eq, 1)} kg CO2-eq/ton CPO (${fmt((result.pomeReductionPotentialKgCo2eq / result.gwpCpo) * 100, 1)}%).`
        : 'Instalasi penangkapan gas metana POME telah beroperasi optimal; prioritas mitigasi lanjutan difokuskan pada pemupukan presisi (4R) dan efisiensi solar operasional.';

    addCalloutBox(
      'Intisari Hotspot & Rekomendasi:',
      `Hotspot utama GWP 100a berasal dari tahap ${result.topGwpStage.stageName} dengan kontribusi ${fmt(result.topGwpStage.gwpSharePercent, 1)}% (${fmt(result.topGwpStage.gwpPerTonCpo, 1)} kg CO2-eq/ton CPO). Komposisi data inventori: ${fmt(result.dataQualityStats.primaryPercent, 1)}% data primer dan ${fmt(result.dataQualityStats.secondaryPercent, 1)}% data sekunder. ${execSummaryRec}`,
      [240, 253, 250]
    );
  }

  // =========================================================================
  // LAPORAN TEKNIS (UMUM + BAB 1 s/d BAB 7)
  // =========================================================================
  if (showTech) {
    // UMUM
    addSectionHeader('UMUM · HAL. 6 PEDOMAN KLHK 2021', 'Riwayat Dokumen & Pernyataan Kepatuhan');
    addParagraph(
      `Laporan ini disusun mengacu pada SNI ISO 14040:2016, SNI ISO 14044:2017, dan Pedoman Penyusunan Laporan Penilaian Daur Hidup (LCA) Ditjen PPKL KLHK (2021). Dokumen dan data di dalamnya adalah untuk keperluan pelaporan PROPER dan tidak bersifat publik. Penggunaan data adalah seizin ${meta.companyName} atau Sekretariat PROPER KLHK.`
    );
    runTable(
      'Tabel 1. Riwayat Dokumen Laporan LCA',
      ['Tanggal', 'Versi', 'Pemangku Kepentingan', 'Keterangan'],
      [[meta.reportDate, meta.reportVersion, `${meta.companyName} / Sekretariat PROPER`, 'Versi submit LCI & LCIA Cradle-to-Gate']]
    );

    // BAB 1
    addSectionHeader('BAB 01', '1. Pendahuluan');
    addParagraph(
      `1.1 Profil Singkat Perusahaan: ${meta.companyName} mengoperasikan ${meta.millName} di ${meta.location}. Pada periode ${meta.studyPeriod}, unit pengolahan menerima ${fmt(result.annualFfbTon, 0)} ton TBS/tahun (luasan efektif ${fmt(result.impliedAreaHa, 0)} ha pada yield ${fmt(params.ffbYieldTonHaYear, 1)} ton/ha/thn) dan memproduksi ${fmt(result.annualCpoTon, 0)} ton CPO/tahun (OER ${fmt(params.oerPercent, 1)}%) serta ${fmt(result.annualPkTon, 0)} ton PK/tahun (KER ${fmt(params.kerPercent, 1)}%).`
    );
    addParagraph(
      '1.2 Latar Belakang Kajian: Kajian ini dilaksanakan "untuk melakukan penilaian dampak lingkungan (jejak lingkungan) dari proses produksi perusahaan guna memenuhi persyaratan dokumen hijau PROPER Nasional sesuai dengan Peraturan Menteri Lingkungan Hidup dan Kehutanan Republik Indonesia Nomor 1 Tahun 2021 tentang Program Penilaian Peringkat Kinerja Perusahaan Dalam Pengelolaan Lingkungan Hidup."'
    );

    // BAB 2
    addSectionHeader('BAB 02', '2. Tujuan dan Lingkup Kajian');
    addSubheading('2.1 Tujuan Kajian');
    addParagraph(
      `• 2.1.1 Tujuan Penerapan: Mengidentifikasi hotspot lingkungan pada rantai produksi kebun hingga pabrik (cradle-to-gate), menetapkan baseline jejak karbon, asidifikasi, dan eutrofikasi per ton CPO & PK, serta merumuskan strategi mitigasi.`,
      { indent: 2 }
    );
    addParagraph(
      `• 2.1.2 Pihak yang Dituju: Manajemen internal ${meta.companyName}, pemangku kepentingan rantai pasok, serta Kementerian Lingkungan Hidup dan Kehutanan (Sekretariat PROPER).`,
      { indent: 2 }
    );
    addParagraph(
      '• 2.1.3 Pernyataan Komparatif: "Kajian ini tidak ditujukan sebagai pernyataan komparatif untuk disampaikan kepada masyarakat."',
      { bold: true, indent: 2 }
    );

    addSubheading('2.2 Lingkup LCA & Batasan Sistem (Cradle-to-Gate)');
    addParagraph(
      `Sistem produk mencakup budidaya kebun (pemupukan, herbisida, solar alat berat, kondisi lahan LUC/gambut), pengangkutan TBS (${params.transportDistanceKm} km), pengolahan PKS (sterilisasi, ekstraksi, boiler biomassa ${params.biomassBoilerSharePercent}%, solar genset, penanganan EFB), dan IPAL POME (${pomeLabel}). Unit fungsi adalah 1 ton CPO dan 1 ton PK di pintu gerbang PKS dengan aliran acuan gabungan ${fmt(result.ffbRequiredPerTonCpo, 3)} ton TBS/ton CPO. Tahap hilir (distribusi ekspor, rafinasi, penggunaan, akhir masa hidup) tidak dicakup karena CPO/PK adalah produk antara. Kriteria cut-off ditetapkan <1% massa/energi.`
    );

    // Vector Diagram Sistem Produk (Cradle-to-Gate)
    ensureSpace(46);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...SLATE_900);
    doc.text('Gambar 1. Diagram Batasan Sistem Produk Cradle-to-Gate CPO & PK (SNI ISO 14040:2016)', marginX, y);
    y += 3;

    const diagH = 34;
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.35);
    doc.roundedRect(marginX, y, contentWidth, diagH, 2, 2, 'S');
    const bxY = y + 7;
    const bxH = 21;
    const boxes = [
      { x: marginX + 4, w: 46, fill: [240, 253, 250] as [number, number, number], t: 'UPSTREAM (P1-P3)', s: 'Pupuk, Solar, Kebun & Lahan' },
      { x: marginX + 55, w: 32, fill: SLATE_50, t: 'TRANSPORT (P4)', s: `Angkut TBS (${params.transportDistanceKm} km)` },
      { x: marginX + 92, w: 48, fill: [255, 251, 235] as [number, number, number], t: 'CORE PKS (P5-P6)', s: 'Ekstraksi, Boiler & POME' },
      { x: marginX + 145, w: 29, fill: TEAL, t: 'OUTPUT GATE', s: `CPO ${params.oerPercent}% | PK ${params.kerPercent}%`, dark: true },
    ];
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      doc.setFillColor(...b.fill);
      doc.setDrawColor(...SLATE_200);
      doc.roundedRect(b.x, bxY, b.w, bxH, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(b.dark ? 255 : 15, b.dark ? 255 : 23, b.dark ? 255 : 42);
      doc.text(pdfSafe(b.t), b.x + 2.5, bxY + 7.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(b.dark ? 240 : 71, b.dark ? 253 : 85, b.dark ? 250 : 105);
      const subLines = doc.splitTextToSize(pdfSafe(b.s), b.w - 4) as string[];
      doc.text(subLines, b.x + 2.5, bxY + 13);
      if (i < boxes.length - 1) {
        const ax1 = b.x + b.w + 0.8;
        const ax2 = boxes[i + 1].x - 0.8;
        const midY = bxY + bxH / 2;
        doc.setDrawColor(...SLATE_900);
        doc.line(ax1, midY, ax2, midY);
      }
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...TEAL);
    doc.text('BATAS SISTEM: CRADLE-TO-GATE (HULU HINGGA PINTU GERBANG PKS)', marginX + 4, y + 4.5);
    y += diagH + 6;

    runTable(
      'Tabel 2. Persyaratan Kualitas Data (Acuan Hal. 29 Pedoman KLHK 2021)',
      ['Indikator Kualitas Data', 'Kondisi pada Kajian'],
      [
        ['Cakupan Waktu', `Periode 1 tahun produksi penuh (${meta.studyPeriod})`],
        ['Cakupan Geografis', `${meta.location} (data hulu generik RoW/GLO)`],
        ['Cakupan Teknologi', `Spesifik PKS: ${pomeLabel}; boiler biomassa ${params.biomassBoilerSharePercent}%`],
        ['Kelengkapan & Presisi', `Kelengkapan inventori ${fmt(result.dataQualityStats.completenessPercent, 1)}% mencakup seluruh aliran massa, energi & emisi dominan`],
        ['Konsistensi & Reproduksibilitas', 'Model matriks openLCA (A·s = f, g = B·s, h = C·g) transparan dan dapat direproduksi independen'],
        ['Tinjauan Kritis (ISO/TS 14071)', meta.criticalReviewDone ? `Dilakukan oleh ${meta.criticalReviewer}` : 'Tidak dilakukan (Kajian internal & pelaporan PROPER)'],
      ]
    );

    // BAB 3
    addSectionHeader('BAB 03', '3. Metode Pelaksanaan LCA');
    addParagraph(
      'Kajian merujuk SNI ISO 14040:2016, SNI ISO 14044:2017, dan Permen LHK No. 1 Tahun 2021. Perhitungan menggunakan perangkat lunak kalkulator LCA berbasis skema openLCA (olca-schema) dengan solver sistem linear A·s = f, g = B·s, dan karakterisasi h = C·g.'
    );
    runTable(
      'Tabel 3. Kategori Dampak, Indikator Kategori, dan Metode Penilaian Dampak (Hal. 36 Pedoman KLHK 2021)',
      ['No', 'Kategori Dampak', 'Indikator', 'Metode Karakterisasi', 'Alasan Pemilihan'],
      [
        ['1', 'Global Warming Potential (GWP 100a)', 'kg CO2-eq', `IPCC ${params.gwpStandard} GWP 100a`, 'Wajib Permen LHK 01/2021; dominan pada POME CH4, N2O pupuk & gambut'],
        ['2', 'Potensi Hujan Asam (AP)', 'kg SO2-eq', 'CML-IA Baseline v4.8', 'Wajib Permen LHK 01/2021; relevan terhadap NH3 urea, NOx & SO2'],
        ['3', 'Potensi Eutrofikasi (EP)', 'kg PO4-eq', 'CML-IA Baseline v4.8', 'Wajib Permen LHK 01/2021; relevan terhadap NO3, PO4 & COD POME'],
        ['4', 'Penggunaan Energi (CED)', 'MJ-eq', 'LHV BioGrace / Ecoinvent', 'Wajib Permen LHK 01/2021; evaluasi energi fosil & biomassa'],
      ]
    );

    // BAB 4
    addSectionHeader('BAB 04', '4. Inventori Daur Hidup (LCI)');
    addParagraph(
      `Data primer mencakup produktivitas TBS (${fmt(params.ffbYieldTonHaYear, 1)} t/ha/thn), dosis pemupukan, jarak angkut TBS (${params.transportDistanceKm} km), rendemen OER/KER, debit & COD POME, serta konsumsi solar dan air proses. Faktor emisi sekunder bersumber dari IPCC 2006/2019 Refinement, IPCC 2013 Wetlands Supplement, RSPO PalmGHG v4, BioGrace, dan Ecoinvent 3.8. Validasi kualitas data (Tabel 9): ${result.dataQualityStats.primaryCount} aliran primer (${fmt(result.dataQualityStats.primaryPercent, 1)}%) dan ${result.dataQualityStats.secondaryCount} aliran sekunder (${fmt(result.dataQualityStats.secondaryPercent, 1)}%).`
    );

    const lciRows: (string | number)[][] = [
      ['Bahan Baku: Tandan Buah Segar (TBS)', fmt(result.annualFfbTon, 0), 'ton', fmt(result.ffbRequiredPerTonCpo * result.allocationCpo, 2), 'ton', 'PKS Inti (Ekstraksi)'],
      ['Air Proses Pabrik', fmt(totalWaterAnnualM3, 0), 'm3', fmt(params.millWaterM3PerTonFfb * result.ffbRequiredPerTonCpo * result.allocationCpo, 2), 'm3', 'PKS Inti'],
      ['Pupuk Sintetis (Urea, SP-36, KCl, Dolomit)', fmt(totalFertilizerAnnualTon, 1), 'ton', fmt(((params.ureaKgHaYear + params.sp36KgHaYear + params.kclKgHaYear + params.dolomitKgHaYear) / params.ffbYieldTonHaYear) * result.ffbRequiredPerTonCpo * result.allocationCpo, 1), 'kg', 'Perkebunan (Budidaya)'],
      ['Bahan Bakar Cair: Solar Industri (Total)', fmt(totalDieselAnnualL, 0), 'liter', fmt((totalDieselAnnualL / result.annualFfbTon) * result.ffbRequiredPerTonCpo * result.allocationCpo, 2), 'liter', 'Kebun, Transport & PKS'],
      ['Output Utama: Crude Palm Oil (CPO)', fmt(result.annualCpoTon, 0), 'ton', '1,00', 'ton', 'PKS Inti'],
      ['Output Co-product: Palm Kernel (PK)', fmt(result.annualPkTon, 0), 'ton', fmt(params.kerPercent / params.oerPercent, 3), 'ton', 'PKS Inti (Kernel)'],
      ['Limbah Cair: POME Diolah di IPAL', fmt(result.annualPomeM3, 0), 'm3', fmt(params.pomeVolumeM3PerTonFfb * result.ffbRequiredPerTonCpo * result.allocationCpo, 2), 'm3', 'IPAL PKS (POME)'],
      ...result.inventoryRows
        .filter((r) => r.amountPerTonCpo > 0.0005)
        .map((r) => [
          `Emisi (${r.compartment === 'air' ? 'Udara' : 'Air'}): ${r.name}`,
          fmt(r.amountAnnualTotal, 0),
          r.unit,
          fmt(r.amountPerTonCpo, 3),
          r.unit,
          r.dominantStage,
        ]),
    ];

    runTable(
      `Tabel 6. Ringkasan Inventori Sistem Proses Total 1 Tahun (${meta.studyPeriod}) dan Per Unit Fungsi (1 ton CPO)`,
      ['Input / Output', 'Total 1 Tahun', 'Unit', 'Per 1 ton CPO', 'Unit', 'Proses Dominan'],
      lciRows,
      [1, 3]
    );

    // BAB 5
    addSectionHeader('BAB 05', '5. Penilaian Dampak Daur Hidup (LCIA)');
    runTable(
      'Tabel 12. Hasil Karakterisasi Dampak Berdasarkan Tahap Daur Hidup (Per 1 ton CPO & 1 ton PK)',
      ['Kategori Dampak', 'Unit', 'Upstream / Hulu', 'Core / PKS', 'Total 1 t CPO', 'Total 1 t PK'],
      [
        ['Global Warming Potential (GWP 100a)', 'kg CO2-eq', fmt(upstreamGwp, 2), fmt(coreGwp, 2), fmt(result.gwpCpo, 2), fmt(result.gwpPk, 2)],
        ['Acidification Potential (AP)', 'kg SO2-eq', fmt(upstreamAp, 3), fmt(coreAp, 3), fmt(result.apCpo, 3), fmt(result.apPk, 3)],
        ['Eutrophication Potential (EP)', 'kg PO4-eq', fmt(upstreamEp, 3), fmt(coreEp, 3), fmt(result.epCpo, 3), fmt(result.epPk, 3)],
      ],
      [2, 3, 4, 5]
    );

    addParagraph(`5.5 Keterkaitan LCIA dengan Hasil LCI (Aturan Pareto 80%): Kontributor dominan GWP 100a berasal dari ${pareto80Text}.`);
    addCalloutBox(
      '5.6 Pernyataan Wajib (Hal. 58 Pedoman KLHK 2021):',
      '"Hasil LCIA merupakan ekspresi relatif dan tidak memprediksi dampak pada kategori endpoint, terlampauinya nilai ambang, batas keselamatan, atau risiko."',
      SLATE_50
    );

    // BAB 6
    addSectionHeader('BAB 06', '6. Interpretasi Daur Hidup');
    runTable(
      'Tabel 13. Ringkasan Kontribusi Penting dari Proses (Hotspot Analysis — Hal. 60 Pedoman KLHK 2021)',
      ['Proses', 'GWP (kg CO2-eq)', 'Porsi GWP', 'Porsi AP', 'Porsi EP'],
      result.stageBreakdown.map((st) => [
        `${st.stageId}: ${st.stageName}`,
        fmt(st.gwpPerTonCpo, 2),
        `${fmt(st.gwpSharePercent, 1)}%`,
        `${fmt(st.apSharePercent, 1)}%`,
        `${fmt(st.epSharePercent, 1)}%`,
      ]),
      [1, 2, 3, 4]
    );

    runTable(
      'Tabel 14. Ringkasan Kontribusi Penting dari Bahan / Aktivitas & Uji Pareto 80% (Hal. 61 Pedoman KLHK 2021)',
      ['Masukan / Keluaran LCI', 'GWP (kg CO2-eq)', 'Porsi GWP', 'Kumulatif', 'Status Pareto'],
      result.materialContributions.map((m) => [
        m.material,
        fmt(m.gwpPerTonCpo, 1),
        `${fmt(m.gwpSharePercent, 1)}%`,
        `${fmt(m.cumulativeGwpPercent, 1)}%`,
        m.isPareto80 ? 'Hotspot Utama (80%)' : 'Kontributor Sekunder',
      ]),
      [1, 2, 3]
    );

    runTable(
      '6.2 Analisis Sensitivitas: Metode Alokasi Co-Product & Skenario Mitigasi POME',
      ['Skenario Uji Sensitivitas', 'Kelompok', 'GWP CPO', 'GWP PK', 'Selisih vs Aktif'],
      result.sensitivity.map((sc) => [
        sc.label,
        sc.group,
        `${fmt(sc.gwpCpo, 1)} kg CO2-eq`,
        `${fmt(sc.gwpPk, 1)} kg CO2-eq`,
        `${sc.deltaPercentVsCurrent >= 0 ? '+' : ''}${fmt(sc.deltaPercentVsCurrent, 1)}%`,
      ]),
      [2, 3, 4]
    );

    // BAB 7
    addSectionHeader('BAB 07', '7. Kesimpulan, Keterbatasan, dan Rekomendasi');
    addParagraph(
      `7.1 Kesimpulan: Total potensi pemanasan global (GWP 100a) cradle-to-gate tercatat sebesar ${fmt(result.gwpCpo, 1)} kg CO2-eq/ton CPO dan ${fmt(result.gwpPk, 1)} kg CO2-eq/ton PK, dengan potensi asidifikasi ${fmt(result.apCpo, 2)} kg SO2-eq/ton CPO serta potensi eutrofikasi ${fmt(result.epCpo, 2)} kg PO4-eq/ton CPO. Hotspot GWP terbesar berada pada ${result.topGwpStage.stageName} (${fmt(result.topGwpStage.gwpSharePercent, 1)}%), hotspot AP pada ${result.topApStage.stageName} (${fmt(result.topApStage.apSharePercent, 1)}%), dan hotspot EP pada ${result.topEpStage.stageName} (${fmt(result.topEpStage.epSharePercent, 1)}%).`
    );
    addParagraph(
      '7.2 Keterbatasan Kajian: Kajian dibatasi pada lingkup cradle-to-gate periode 1 tahun. Faktor emisi N2O tanah dan manufaktur pupuk mengacu pada data sekunder IPCC Tier 1 dan Ecoinvent 3.8 dengan kisaran ketidakpastian estimasi sekitar ±15%.'
    );
    addSubheading('7.3 Rekomendasi Mitigasi Berbasis Hotspot');
    let recNum = 1;
    if (result.pomeReductionPotentialKgCo2eq > 20) {
      addParagraph(
        `${recNum++}. Instalasi Methane Capture & PLTBg: Menangkap 90% metana POME berpotensi memangkas emisi sebesar ${fmt(result.pomeReductionPotentialKgCo2eq, 1)} kg CO2-eq/ton CPO sekaligus mengurangi pemakaian solar genset.`,
        { indent: 2 }
      );
    }
    addParagraph(
      `${recNum++}. Pemupukan Presisi (4R) & Substitusi Organik EFB: Mengoptimalkan dosis Urea (${params.ureaKgHaYear} kg/ha) melalui analisis daun serta aplikasi mulsa/kompos EFB guna menekan N2O, NH3 (AP), dan pencucian NO3/PO4 (EP).`,
      { indent: 2 }
    );
    addParagraph(
      `${recNum++}. Pengelolaan Efluen IPAL (Land Application): ${params.pomeLandApplication ? 'Mempertahankan kepatuhan baku mutu land application POME untuk mencegah limpasan nutrien ke perairan.' : 'Mengembangkan skema land application terkendali guna menurunkan beban eutrofikasi COD & fosfat ke sungai.'}`,
      { indent: 2 }
    );
    if (params.enablePeat && params.peatPercent > 0) {
      addParagraph(
        `${recNum++}. Tata Kelola Air Gambut: Menjaga tinggi muka air tanah gambut sesuai regulasi KLHK dan menghentikan ekspansi baru di lahan gambut untuk menahan oksidasi karbon.`,
        { indent: 2 }
      );
    }
  }

  // =========================================================================
  // INDEKS LAPORAN (TABEL 15) & LAMPIRAN RINCIAN INVENTORI
  // =========================================================================
  if (showAppendix) {
    if (scope === 'all') {
      doc.addPage();
      y = 18;
    }
    addSectionHeader('INDEKS LAPORAN · TABEL 15 HAL. viii–ix', 'Indeks Pengungkapan & Lampiran Rincian LCI');
    runTable(
      'Tabel 15. Indeks Pengungkapan Laporan PROPER KLHK 2021',
      ['Bab', 'Item Pengungkapan Wajib', 'Status Pemenuhan'],
      [
        ['Umum & Bab 1', 'Riwayat dokumen, identitas pemrakarsa, profil & latar belakang Permen LHK 01/2021', 'Tercantum'],
        ['Bab 2 (Tujuan & Lingkup)', 'Tujuan, pernyataan non-komparatif, unit fungsi, diagram sistem, cut-off, alokasi, Tabel 2', 'Tercantum'],
        ['Bab 3 (Metode)', 'Acuan SNI ISO 14040/14044, skema openLCA, Tabel 3 kategori & metode dampak', 'Tercantum'],
        ['Bab 4 (LCI)', 'Deskripsi unit proses, literatur, Tabel 6 inventori total & unit fungsi, Tabel 9 validasi', 'Tercantum'],
        ['Bab 5 (LCIA)', 'Tabel 12 karakterisasi dampak per tahap, Pareto 80%, pernyataan ekspresi relatif (5.6)', 'Tercantum'],
        ['Bab 6 (Interpretasi)', 'Tabel 13 & 14 hotspot proses/bahan, evaluasi kelengkapan & analisis sensitivitas', 'Tercantum'],
        ['Bab 7 (Kesimpulan)', 'Kesimpulan kuantitatif, keterbatasan kajian, rekomendasi spesifik berbasis hotspot', 'Tercantum'],
        ['Tinjauan Kritis', 'Status tinjauan kritis (ISO/TS 14071)', meta.criticalReviewDone ? 'Dilakukan' : 'Tidak Dilakukan (Opsional)'],
      ]
    );

    addSubheading('Lampiran Rincian Inventori Daur Hidup per Unit Proses (Referensi openLCA)');
    for (const proc of result.processes) {
      runTable(
        `Unit Proses ${proc.code}: ${proc.name} (Ref: ${proc.quantitativeReference})`,
        ['Arah', 'Aliran (Flow)', 'Jumlah', 'Unit', 'Data', 'Dataset Referensi'],
        proc.exchanges.map((ex) => [
          ex.isInput ? 'Input' : 'Output',
          ex.flowName,
          fmt(ex.amount, 4),
          ex.unit,
          ex.dataQuality,
          ex.datasetRef,
        ]),
        [2]
      );
    }
  }

  // Add page footer & subtle accent line on every page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...SLATE_200);
    doc.setLineWidth(0.25);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE_600);
    doc.text(
      pdfSafe(`Laporan LCA PROPER KLHK 2021 | ${meta.companyName} | ${meta.studyPeriod}`).slice(0, 95),
      marginX,
      pageHeight - 8
    );
    doc.setTextColor(...AMBER);
    doc.text(`Halaman ${p} dari ${totalPages}`, pageWidth - marginX, pageHeight - 8, {
      align: 'right',
    });
  }

  // Trigger reliable Blob download (works inside sandboxed iframes without window.print blocking)
  const slug =
    meta.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32) || 'perusahaan';
  const scopeSuffix = scope === 'all' ? 'Lengkap' : scope;
  const filename = `Laporan-LCA-PROPER-${slug}-${scopeSuffix}-${meta.reportDate}.pdf`;

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);

  return filename;
}
