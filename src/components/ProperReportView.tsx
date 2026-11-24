import React, { useState } from 'react';
import { Check, Download, FileText, SlidersHorizontal } from 'lucide-react';
import { PdfReportScope } from '../lca/pdfReport';
import { LcaInputParams, LcaResult, ReportMetadata } from '../lca/types';

interface ProperReportViewProps {
  params: LcaInputParams;
  result: LcaResult;
  meta: ReportMetadata;
  onChangeMeta: (next: ReportMetadata) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onExportStandaloneHtml: () => void;
  onExportPdf: (scope: PdfReportScope) => void;
}

const fmt = (n: number, dec = 2) =>
  n.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec });

export const ProperReportView: React.FC<ProperReportViewProps> = ({
  params,
  result,
  meta,
  onChangeMeta,
  onExportJson,
  onExportCsv,
  onExportStandaloneHtml,
  onExportPdf,
}) => {
  const [sectionMode, setSectionMode] = useState<PdfReportScope>('all');
  const [showMetaEditor, setShowMetaEditor] = useState(false);
  const [pdfSaved, setPdfSaved] = useState(false);

  const handleDownloadPdfClick = () => {
    onExportPdf(sectionMode);
    setPdfSaved(true);
    window.setTimeout(() => setPdfSaved(false), 2600);
  };

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
      ? 'Methane Capture dengan Pembakaran Suar (Flaring, 85% penangkapan CH4)'
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

  const pareto80Materials = result.materialContributions.filter((m) => m.isPareto80);

  const ureaTotalAnnualKg = (params.ureaKgHaYear / params.ffbYieldTonHaYear) * result.annualFfbTon;
  const sp36TotalAnnualKg = (params.sp36KgHaYear / params.ffbYieldTonHaYear) * result.annualFfbTon;
  const kclTotalAnnualKg = (params.kclKgHaYear / params.ffbYieldTonHaYear) * result.annualFfbTon;
  const dolomitTotalAnnualKg =
    (params.dolomitKgHaYear / params.ffbYieldTonHaYear) * result.annualFfbTon;
  const totalDieselAnnualL =
    (params.fieldDieselLHaYear / params.ffbYieldTonHaYear +
      params.transportDistanceKm * params.transportFuelLPerTkm +
      params.millDieselLPerTonFfb) *
    result.annualFfbTon;
  const totalWaterAnnualM3 = params.millWaterM3PerTonFfb * result.annualFfbTon;

  const updateMeta = <K extends keyof ReportMetadata>(key: K, value: ReportMetadata[K]) => {
    onChangeMeta({ ...meta, [key]: value });
  };

  const showExec = sectionMode === 'all' || sectionMode === 'exec';
  const showTech = sectionMode === 'all' || sectionMode === 'tech';
  const showAppendix = sectionMode === 'all' || sectionMode === 'appendix';

  return (
    <div className="space-y-6">
      {/* Control Toolbar (hidden when printing) */}
      <div className="no-print space-y-4 pb-5 border-b border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-teal-700">
              Mengacu pada Pedoman Penyusunan Laporan Penilaian Daur Hidup (LCA) — Ditjen PPKL KLHK (September 2021)
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Generator Laporan LCA Resmi PROPER KLHK
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMetaEditor((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg whitespace-nowrap"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {showMetaEditor ? 'Tutup Identitas Pemrakarsa' : 'Edit Identitas Pemrakarsa'}
            </button>
            <button
              type="button"
              onClick={onExportStandaloneHtml}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh index.html Mandiri
            </button>
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              type="button"
              onClick={onExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              JSON
            </button>
            <button
              type="button"
              onClick={handleDownloadPdfClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg whitespace-nowrap cursor-pointer"
            >
              {pdfSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  PDF Diunduh
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  Cetak / Simpan PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
          {[
            { id: 'all' as const, label: 'Dokumen Lengkap (Siap Cetak)' },
            { id: 'exec' as const, label: 'Laporan Eksekutif' },
            { id: 'tech' as const, label: 'Laporan Teknis (Bab 1–7)' },
            { id: 'appendix' as const, label: 'Indeks & Lampiran LCI' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSectionMode(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                sectionMode === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Collapsible Identity Metadata Editor */}
        {showMetaEditor && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-600">Nama Perusahaan (Pemrakarsa)</span>
              <input
                type="text"
                value={meta.companyName}
                onChange={(e) => updateMeta('companyName', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-600">Unit Pabrik Kelapa Sawit (PKS)</span>
              <input
                type="text"
                value={meta.millName}
                onChange={(e) => updateMeta('millName', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-600">Lokasi Geografis</span>
              <input
                type="text"
                value={meta.location}
                onChange={(e) => updateMeta('location', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-600">Periode Data Kajian (1 Tahun)</span>
              <input
                type="text"
                value={meta.studyPeriod}
                onChange={(e) => updateMeta('studyPeriod', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-600">Ketua Praktisi LCA</span>
              <input
                type="text"
                value={meta.leadPractitioner}
                onChange={(e) => updateMeta('leadPractitioner', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-600">Email &amp; Kontak Pemrakarsa</span>
              <input
                type="text"
                value={meta.contactEmail}
                onChange={(e) => updateMeta('contactEmail', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
              />
            </label>
          </div>
        )}
      </div>

      {/* Report Document Container */}
      <article className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 space-y-10 text-slate-800 leading-relaxed max-w-5xl mx-auto">
        {/* Document Cover Header */}
        <header className="pb-8 border-b-2 border-teal-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="font-semibold text-teal-800">
              DOKUMEN PENILAIAN DAUR HIDUP (LIFE CYCLE ASSESSMENT) — PROPER KLHK
            </span>
            <span className="font-mono">
              Versi {meta.reportVersion} · Tanggal Publikasi: {meta.reportDate}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight text-balance">
            Laporan Penilaian Daur Hidup (LCA) Cradle-to-Gate Produk Crude Palm Oil (CPO) dan Palm
            Kernel (PK)
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-900">{meta.companyName}</p>
              <p>{meta.millName}</p>
              <p>{meta.location}</p>
            </div>
            <div className="sm:text-right text-xs space-y-0.5">
              <p>Periode Data: {meta.studyPeriod}</p>
              <p>Ketua Praktisi: {meta.leadPractitioner}</p>
              <p>Kontak: {meta.contactEmail}</p>
              <p>Standar Acuan: SNI ISO 14040:2016, SNI ISO 14044:2017 &amp; Permen LHK No. 1/2021</p>
            </div>
          </div>
        </header>

        {/* ===================================================================== */}
        {/* LAPORAN EKSEKUTIF (Hal. 3–4 Pedoman KLHK 2021)                        */}
        {/* ===================================================================== */}
        {showExec && (
          <section className="space-y-5">
            <div className="pb-2 border-b border-slate-200">
              <p className="text-xs font-mono text-teal-700">BAGIAN I · HAL. 3–4 PEDOMAN KLHK 2021</p>
              <h2 className="text-xl font-bold text-slate-900">Ringkasan Eksekutif (Laporan Eksekutif)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <p>
                  <strong>a. Judul Kajian:</strong> Penilaian Daur Hidup (LCA) Cradle-to-Gate
                  Produksi Crude Palm Oil (CPO) dan Palm Kernel (PK) pada {meta.millName}.
                </p>
                <p>
                  <strong>b. Identitas Pemrakarsa:</strong> {meta.companyName}, {meta.location} (
                  {meta.contactEmail} · {meta.website}).
                </p>
                <p>
                  <strong>c. Praktisi LCA:</strong> {meta.leadPractitioner}; Tim: {meta.teamMembers}.
                </p>
                <p>
                  <strong>d. Tanggal Publikasi:</strong> {meta.reportDate} (Periode kajian:{' '}
                  {meta.studyPeriod}).
                </p>
              </div>
              <div className="space-y-2">
                <p>
                  <strong>e. Tujuan LCA:</strong> Melakukan kuantifikasi jejak lingkungan dan
                  identifikasi <em>hotspot</em> proses produksi CPO dan PK guna perbaikan kinerja
                  lingkungan serta pemenuhan Dokumen Hijau PROPER sesuai Permen LHK No. 1 Tahun
                  2021.
                </p>
                <p>
                  <strong>f. Lingkup &amp; Unit Fungsi:</strong> Batasan sistem{' '}
                  <strong>Cradle-to-Gate</strong> mencakup 2 produk (CPO &amp; PK) dengan unit
                  fungsi <strong>1 ton CPO</strong> dan <strong>1 ton PK</strong> di pintu gerbang
                  pabrik.
                </p>
                <p>
                  <strong>g. Kualitas Data:</strong> Data primer operasional kebun &amp; PKS sebesar{' '}
                  <span className="font-mono font-semibold">
                    {fmt(result.dataQualityStats.primaryPercent, 1)}%
                  </span>{' '}
                  dan data sekunder (IPCC 2006/2019, Ecoinvent 3.8, BioGrace, RSPO PalmGHG) sebesar{' '}
                  <span className="font-mono font-semibold">
                    {fmt(result.dataQualityStats.secondaryPercent, 1)}%
                  </span>
                  .
                </p>
              </div>
            </div>

            {/* Executive Summary KPI Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-500">GWP 100a (CPO)</p>
                <p className="text-lg font-bold font-mono text-slate-900 mt-1">
                  {fmt(result.gwpCpo, 1)}
                </p>
                <p className="text-xs font-mono text-slate-500">kg CO2-eq / ton CPO</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-500">GWP 100a (PK)</p>
                <p className="text-lg font-bold font-mono text-slate-900 mt-1">
                  {fmt(result.gwpPk, 1)}
                </p>
                <p className="text-xs font-mono text-slate-500">kg CO2-eq / ton PK</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-500">Asidifikasi (AP)</p>
                <p className="text-lg font-bold font-mono text-slate-900 mt-1">
                  {fmt(result.apCpo, 2)}
                </p>
                <p className="text-xs font-mono text-slate-500">kg SO2-eq / ton CPO</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-500">Eutrofikasi (EP)</p>
                <p className="text-lg font-bold font-mono text-slate-900 mt-1">
                  {fmt(result.epCpo, 2)}
                </p>
                <p className="text-xs font-mono text-slate-500">kg PO4-eq / ton CPO</p>
              </div>
            </div>

            <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-lg text-sm text-slate-800">
              <strong>Intisari Interpretasi &amp; Rekomendasi Utama:</strong> Hotspot utama dampak
              pemanasan global (GWP 100a) berasal dari tahap{' '}
              <strong>{result.topGwpStage.stageName}</strong> dengan kontribusi{' '}
              <span className="font-mono font-semibold">
                {fmt(result.topGwpStage.gwpSharePercent, 1)}%
              </span>{' '}
              ({fmt(result.topGwpStage.gwpPerTonCpo, 1)} kg CO2-eq/ton CPO).
              {result.pomeReductionPotentialKgCo2eq > 20
                ? ` Penerapan sistem penangkapan metana (Methane Capture / PLTBg) pada IPAL POME berpotensi menurunkan emisi sebesar ${fmt(result.pomeReductionPotentialKgCo2eq, 1)} kg CO2-eq/ton CPO (${fmt((result.pomeReductionPotentialKgCo2eq / result.gwpCpo) * 100, 1)}%).`
                : ' Instalasi penangkapan gas metana POME telah aktif secara optimal; prioritas mitigasi lanjutan difokuskan pada efisiensi pemupukan presisi (4R) dan pengurangan konsumsi solar operasional.'}
            </div>
          </section>
        )}

        {/* ===================================================================== */}
        {/* LAPORAN TEKNIS LENGKAP (UMUM + BAB 1 s/d BAB 7)                       */}
        {/* ===================================================================== */}
        {showTech && (
          <div className="space-y-10">
            {/* UMUM */}
            <section className="space-y-4 print-avoid-break">
              <div className="pb-2 border-b border-slate-200">
                <p className="text-xs font-mono text-teal-700">UMUM · HAL. 6 PEDOMAN KLHK 2021</p>
                <h2 className="text-lg font-bold text-slate-900">
                  Riwayat Dokumen &amp; Pernyataan Kepatuhan
                </h2>
              </div>
              <p className="text-sm text-slate-700">
                Laporan Penilaian Daur Hidup ini disusun sesuai dengan standar{' '}
                <strong>SNI ISO 14040:2016</strong> dan <strong>SNI ISO 14044:2017</strong> serta
                mengacu pada Pedoman Penyusunan Laporan Penilaian Daur Hidup (LCA) Direktorat
                Jenderal Pengendalian Pencemaran dan Kerusakan Lingkungan (PPKL) KLHK (2021).{' '}
                <em>
                  Dokumen dan data di dalamnya adalah untuk keperluan pelaporan PROPER dan tidak
                  bersifat publik. Penggunaan data adalah seizin {meta.companyName} atau Sekretariat
                  PROPER KLHK.
                </em>
              </p>

              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Tabel 1. Riwayat Dokumen Laporan LCA
                </p>
                <table className="w-full text-xs border border-slate-200">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2 px-3 text-left">Tanggal</th>
                      <th className="py-2 px-3 text-left">Versi</th>
                      <th className="py-2 px-3 text-left">Pemangku Kepentingan</th>
                      <th className="py-2 px-3 text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 font-mono">{meta.reportDate}</td>
                      <td className="py-2 px-3 font-mono">{meta.reportVersion}</td>
                      <td className="py-2 px-3">{meta.companyName} / Sekretariat PROPER</td>
                      <td className="py-2 px-3">Versi submit perhitungan LCI &amp; LCIA Cradle-to-Gate</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* BAB 1: PENDAHULUAN */}
            <section className="space-y-3 print-avoid-break">
              <div className="pb-2 border-b border-slate-200">
                <p className="text-xs font-mono text-teal-700">BAB 01</p>
                <h2 className="text-lg font-bold text-slate-900">1. Pendahuluan</h2>
              </div>
              <p className="text-sm text-slate-700">
                <strong>1.1 Profil Singkat Perusahaan:</strong> {meta.companyName} mengoperasikan{' '}
                {meta.millName} yang berlokasi di {meta.location}. Pada periode kajian{' '}
                {meta.studyPeriod}, unit pengolahan menerima pasokan Tandan Buah Segar (TBS) sebesar{' '}
                <span className="font-mono font-semibold">{fmt(result.annualFfbTon, 0)} ton/tahun</span>{' '}
                (setara luasan efektif <span className="font-mono">{fmt(result.impliedAreaHa, 0)} ha</span>{' '}
                pada produktivitas {fmt(params.ffbYieldTonHaYear, 1)} ton TBS/ha/tahun) dan
                menghasilkan produk utama <strong>Crude Palm Oil (CPO)</strong> sebesar{' '}
                <span className="font-mono font-semibold">{fmt(result.annualCpoTon, 0)} ton/tahun</span>{' '}
                (OER {fmt(params.oerPercent, 1)}%) serta produk samping bernilai ekonomi{' '}
                <strong>Palm Kernel (PK)</strong> sebesar{' '}
                <span className="font-mono font-semibold">{fmt(result.annualPkTon, 0)} ton/tahun</span>{' '}
                (KER {fmt(params.kerPercent, 1)}%).
              </p>
              <p className="text-sm text-slate-700">
                <strong>1.2 Latar Belakang Kajian:</strong> Kajian ini dilaksanakan{' '}
                <em>
                  “untuk melakukan penilaian dampak lingkungan (jejak lingkungan) dari proses
                  produksi perusahaan guna memenuhi persyaratan dokumen hijau PROPER Nasional sesuai
                  dengan Peraturan Menteri Lingkungan Hidup dan Kehutanan Republik Indonesia Nomor 1
                  Tahun 2021 tentang Program Penilaian Peringkat Kinerja Perusahaan Dalam Pengelolaan
                  Lingkungan Hidup”
                </em>
                , sekaligus menyediakan dasar kuantitatif bagi program efisiensi energi, penurunan
                emisi GRK, dan pengendalian beban pencemar POME.
              </p>
            </section>

            {/* BAB 2: TUJUAN DAN LINGKUP */}
            <section className="space-y-5">
              <div className="pb-2 border-b border-slate-200">
                <p className="text-xs font-mono text-teal-700">BAB 02</p>
                <h2 className="text-lg font-bold text-slate-900">2. Tujuan dan Lingkup Kajian</h2>
              </div>

              <div className="space-y-2 text-sm text-slate-700">
                <h3 className="font-semibold text-slate-900">2.1 Tujuan Kajian</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>2.1.1 Tujuan Penerapan:</strong> Mengidentifikasi <em>hotspot</em>{' '}
                    dampak lingkungan sepanjang rantai produksi kebun hingga pabrik (cradle-to-gate),
                    menetapkan basis (<em>baseline</em>) jejak karbon dan pencemaran per ton CPO &amp;
                    PK, serta merumuskan rekomendasi mitigasi berbasis data.
                  </li>
                  <li>
                    <strong>2.1.2 Pihak yang Dituju:</strong> (a) Manajemen internal {meta.companyName};
                    (b) Pemangku kepentingan rantai pasok; dan (c) Pemerintah Republik Indonesia,
                    khususnya Kementerian Lingkungan Hidup dan Kehutanan (Sekretariat PROPER).
                  </li>
                  <li>
                    <strong>2.1.3 Pernyataan Komparatif:</strong>{' '}
                    <span className="font-semibold text-slate-900">
                      “Kajian ini tidak ditujukan sebagai pernyataan komparatif untuk disampaikan
                      kepada masyarakat.”
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3 text-sm text-slate-700">
                <h3 className="font-semibold text-slate-900">2.2 Lingkup LCA</h3>
                <p>
                  <strong>2.2.1 Sistem Produk &amp; Fungsi:</strong> Sistem produk mencakup budidaya
                  perkebunan kelapa sawit (pemupukan, herbisida, solar operasional, kondisi lahan),
                  pengangkutan TBS ke pabrik, pengolahan di PKS (sterilisasi, ekstraksi, boiler
                  biomassa/solar, pengelolaan EFB), dan pengolahan limbah cair POME. Fungsi sistem
                  adalah memproduksi minyak sawit mentah (CPO) dan inti sawit (PK) sebagai bahan baku
                  industri pangan, oleokimia, dan bioenergi.
                </p>
                <p>
                  <strong>2.2.2 Unit Fungsi &amp; Aliran Acuan:</strong> Unit fungsi (unit deklarasi)
                  adalah <strong>1 ton Crude Palm Oil (CPO)</strong> dan{' '}
                  <strong>1 ton Palm Kernel (PK)</strong> di pintu gerbang PKS. Aliran acuan
                  terhitung untuk memenuhi 1 ton CPO (sistem gabungan sebelum alokasi) adalah{' '}
                  <span className="font-mono font-semibold">
                    {fmt(result.ffbRequiredPerTonCpo, 3)} ton TBS
                  </span>{' '}
                  berdasarkan rendemen OER {fmt(params.oerPercent, 1)}% selama periode 1 tahun (
                  {meta.studyPeriod}).
                </p>
                <p>
                  <strong>2.2.3 Batasan Sistem (Cradle-to-Gate):</strong> Batasan sistem yang dipilih
                  adalah <strong>Cradle-to-Gate</strong> (Hulu Kebun hingga Pintu Gerbang PKS). Tahap
                  hilir (distribusi ekspor, pemurnian rafinasi/refinery, penggunaan konsumen, dan{' '}
                  <em>end-of-life</em>) tidak disertakan karena CPO &amp; PK merupakan produk antara
                  (<em>intermediate commodity</em>) yang memiliki beragam jalur pemanfaatan di luar
                  kendali operasional perusahaan.
                </p>

                {/* Diagram Sistem Produk (Mengacu Gambar 2 & 3 SNI ISO 14040 pada Pedoman KLHK Hal. 21) */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-lg print-avoid-break">
                  <p className="text-xs font-semibold text-slate-700 mb-3">
                    Gambar 1. Diagram Batasan Sistem Produk Cradle-to-Gate CPO &amp; PK (Acuan SNI ISO 14040:2016)
                  </p>
                  <svg viewBox="0 0 860 220" className="w-full h-auto" role="img" aria-label="Diagram Batasan Sistem Produk Kelapa Sawit Cradle to Gate">
                    {/* System Boundary Outer Dashed Box */}
                    <rect x="12" y="12" width="836" height="196" rx="10" fill="#ffffff" stroke="#0f766e" strokeWidth="1.5" strokeDasharray="6 4" />
                    <text x="26" y="32" fontSize="11" fontWeight="700" fill="#0f766e">BATAS SISTEM KAJIAN: CRADLE-TO-GATE (HULU HINGGA PINTU GERBANG PKS)</text>

                    {/* Upstream Box */}
                    <rect x="28" y="48" width="235" height="142" rx="8" fill="#f0fdfa" stroke="#99f6e4" strokeWidth="1.2" />
                    <text x="40" y="68" fontSize="11" fontWeight="700" fill="#115e59">UPSTREAM (HULU / KEBUN)</text>
                    <rect x="40" y="78" width="211" height="46" rx="5" fill="#ffffff" stroke="#cbd5e1" />
                    <text x="48" y="96" fontSize="10" fontWeight="600" fill="#0f172a">P1. Produksi Pupuk &amp; Solar WTT</text>
                    <text x="48" y="112" fontSize="9" fill="#475569">Urea, SP-36, KCl, Dolomit, Herbisida</text>
                    <rect x="40" y="132" width="211" height="48" rx="5" fill="#ffffff" stroke="#cbd5e1" />
                    <text x="48" y="150" fontSize="10" fontWeight="600" fill="#0f172a">P2 &amp; P3. Budidaya TBS &amp; Lahan</text>
                    <text x="48" y="166" fontSize="9" fill="#475569">N2O, CO2 Urea, Solar Kebun, LUC/Gambut</text>

                    {/* Arrow 1 -> 2 */}
                    <line x1="263" y1="120" x2="296" y2="120" stroke="#0f172a" strokeWidth="1.5" />
                    <polygon points="296,116 304,120 296,124" fill="#0f172a" />

                    {/* Transport Box */}
                    <rect x="306" y="76" width="136" height="88" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
                    <text x="316" y="96" fontSize="10" fontWeight="700" fill="#0f172a">P4. Transportasi</text>
                    <text x="316" y="114" fontSize="9.5" fill="#334155">Angkut TBS ke PKS</text>
                    <text x="316" y="130" fontSize="9" fill="#64748b">Jarak: {params.transportDistanceKm} km</text>
                    <text x="316" y="146" fontSize="9" fill="#64748b">Solar Truk Diesel</text>

                    {/* Arrow 2 -> 3 */}
                    <line x1="442" y1="120" x2="474" y2="120" stroke="#0f172a" strokeWidth="1.5" />
                    <polygon points="474,116 482,120 474,124" fill="#0f172a" />

                    {/* Core Mill Box */}
                    <rect x="484" y="48" width="230" height="142" rx="8" fill="#fffbeb" stroke="#fde68a" strokeWidth="1.2" />
                    <text x="496" y="68" fontSize="11" fontWeight="700" fill="#92400e">CORE PROCESS (INTI PKS)</text>
                    <rect x="496" y="78" width="206" height="46" rx="5" fill="#ffffff" stroke="#cbd5e1" />
                    <text x="504" y="96" fontSize="10" fontWeight="600" fill="#0f172a">P5. Pengolahan TBS &amp; Boiler</text>
                    <text x="504" y="112" fontSize="9" fill="#475569">Biomassa {params.biomassBoilerSharePercent}% · Genset · EFB</text>
                    <rect x="496" y="132" width="206" height="48" rx="5" fill="#ffffff" stroke="#cbd5e1" />
                    <text x="504" y="150" fontSize="10" fontWeight="600" fill="#0f172a">P6. IPAL Limbah Cair (POME)</text>
                    <text x="504" y="166" fontSize="9" fill="#475569">{params.pomeTreatment === 'open_lagoon' ? 'Open Lagoon (0% Capture)' : 'Methane Capture / Biogas'}</text>

                    {/* Arrow 3 -> Outputs */}
                    <line x1="714" y1="100" x2="740" y2="100" stroke="#0f766e" strokeWidth="1.5" />
                    <polygon points="740,96 748,100 740,104" fill="#0f766e" />
                    <line x1="714" y1="150" x2="740" y2="150" stroke="#d97706" strokeWidth="1.5" />
                    <polygon points="740,146 748,150 740,154" fill="#d97706" />

                    {/* Outputs */}
                    <rect x="750" y="74" width="84" height="50" rx="6" fill="#0f766e" />
                    <text x="792" y="96" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff">CPO</text>
                    <text x="792" y="112" textAnchor="middle" fontSize="9" fill="#ccfbf1">OER {params.oerPercent}%</text>

                    <rect x="750" y="130" width="84" height="46" rx="6" fill="#d97706" />
                    <text x="792" y="150" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff">PK</text>
                    <text x="792" y="165" textAnchor="middle" fontSize="9" fill="#fef3c7">KER {params.kerPercent}%</text>
                  </svg>
                </div>

                <p>
                  <strong>2.2.4 Kriteria Cut-Off:</strong> Kriteria <em>cut-off</em> ditetapkan
                  sebesar <strong>&lt;1%</strong> massa dan energi; infrastruktur bangunan,
                  transportasi karyawan (<em>commuting</em>), dan aktivitas domestik perkantoran
                  dikeluarkan sesuai panduan Bab 2.2.3.2 Pedoman KLHK 2021.
                </p>
                <p>
                  <strong>2.2.5 Prosedur Alokasi:</strong> Karena unit PKS menghasilkan dua produk
                  bernilai ekonomi secara simultan (CPO dan PK), diterapkan{' '}
                  <strong>{allocLabel}</strong> menghasilkan pembagian beban{' '}
                  <span className="font-mono font-semibold">
                    {fmt(result.allocationCpo * 100, 2)}% untuk CPO
                  </span>{' '}
                  dan{' '}
                  <span className="font-mono font-semibold">
                    {fmt(result.allocationPk * 100, 2)}% untuk PK
                  </span>
                  . Pemanfaatan internal fiber dan cangkang pada boiler diperlakukan dalam siklus
                  tertutup tanpa <em>double counting</em>.
                </p>
                <p>
                  <strong>2.2.7–2.2.12 Asumsi, Data Hilang &amp; Tinjauan Kritis:</strong> Emisi
                  CO2 biogenik dari pembakaran biomassa dan flaring biogas dihitung dalam inventori
                  namun dikarakterisasi dengan GWP = 0 sesuai IPCC. Tidak terdapat data kritis yang
                  hilang pada aliran utama; aliran pendukung minor diestimasi memakai basis data
                  generik Ecoinvent/IPCC. Status Tinjauan Kritis (ISO/TS 14071):{' '}
                  <strong>
                    {meta.criticalReviewDone
                      ? `Dilakukan oleh ${meta.criticalReviewer}`
                      : 'Tidak dilakukan (Kajian internal & pelaporan PROPER)'}
                  </strong>
                  .
                </p>

                {/* Tabel 2: Persyaratan Kualitas Data */}
                <div className="pt-2 print-avoid-break">
                  <p className="text-xs font-semibold text-slate-700 mb-2">
                    Tabel 2. Persyaratan Kualitas Data (Acuan Hal. 29 Pedoman KLHK 2021)
                  </p>
                  <table className="w-full text-xs border border-slate-200">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="py-2 px-3 text-left">Indikator</th>
                        <th className="py-2 px-3 text-left">Kondisi pada Kajian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr><td className="py-1.5 px-3 font-medium">Cakupan Waktu</td><td className="py-1.5 px-3">Periode 1 tahun produksi penuh ({meta.studyPeriod})</td></tr>
                      <tr><td className="py-1.5 px-3 font-medium">Cakupan Geografis</td><td className="py-1.5 px-3">{meta.location} (data hulu generik RoW/GLO)</td></tr>
                      <tr><td className="py-1.5 px-3 font-medium">Cakupan Teknologi</td><td className="py-1.5 px-3">Teknologi spesifik PKS ({pomeLabel}; boiler biomassa {params.biomassBoilerSharePercent}%)</td></tr>
                      <tr><td className="py-1.5 px-3 font-medium">Kelengkapan &amp; Presisi</td><td className="py-1.5 px-3">Kelengkapan inventori {fmt(result.dataQualityStats.completenessPercent, 1)}% mencakup seluruh aliran massa, energi, dan emisi dominan</td></tr>
                      <tr><td className="py-1.5 px-3 font-medium">Konsistensi &amp; Reproduksibilitas</td><td className="py-1.5 px-3">Model matriks openLCA (A·s=f) terdokumentasi transparan sehingga dapat direproduksi independen</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* BAB 3: METODE PELAKSANAAN LCA */}
            <section className="space-y-4 print-avoid-break">
              <div className="pb-2 border-b border-slate-200">
                <p className="text-xs font-mono text-teal-700">BAB 03</p>
                <h2 className="text-lg font-bold text-slate-900">3. Metode Pelaksanaan LCA</h2>
              </div>
              <p className="text-sm text-slate-700">
                <strong>3.1 &amp; 3.2 Standar &amp; Perangkat Lunak Perhitungan:</strong> Kajian
                merujuk pada <strong>SNI ISO 14040:2016</strong>,{' '}
                <strong>SNI ISO 14044:2017</strong>, dan <strong>Permen LHK No. 1 Tahun 2021</strong>.
                Perhitungan inventori dan karakterisasi dampak dijalankan menggunakan perangkat lunak
                kalkulator LCA berbasis arsitektur data <strong>openLCA (olca-schema)</strong> dengan
                penyelesaian sistem persamaan matriks linear <strong>A·s = f</strong>,{' '}
                <strong>g = B·s</strong>, dan <strong>h = C·g</strong>.
              </p>

              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Tabel 3. Kategori Dampak, Indikator Kategori, dan Metode Penilaian Dampak (Hal. 36 Pedoman KLHK 2021)
                </p>
                <table className="w-full text-xs border border-slate-200">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2 px-3 text-left">No.</th>
                      <th className="py-2 px-3 text-left">Kategori Dampak</th>
                      <th className="py-2 px-3 text-left">Indikator Kategori</th>
                      <th className="py-2 px-3 text-left">Metode Karakterisasi</th>
                      <th className="py-2 px-3 text-left">Alasan Pemilihan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 font-mono">1</td>
                      <td className="py-2 px-3 font-medium">Global Warming Potential (GWP 100a)</td>
                      <td className="py-2 px-3 font-mono">kg CO2-eq</td>
                      <td className="py-2 px-3">IPCC {params.gwpStandard} GWP 100a</td>
                      <td className="py-2 px-3">Wajib Permen LHK 01/2021; dominan pada POME CH4, N2O pupuk &amp; gambut</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono">2</td>
                      <td className="py-2 px-3 font-medium">Potensi Hujan Asam (Acidification / AP)</td>
                      <td className="py-2 px-3 font-mono">kg SO2-eq</td>
                      <td className="py-2 px-3">CML-IA Baseline v4.8</td>
                      <td className="py-2 px-3">Wajib Permen LHK 01/2021; relevan terhadap NH3 urea, NOx &amp; SO2</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono">3</td>
                      <td className="py-2 px-3 font-medium">Potensi Eutrofikasi (Eutrophication / EP)</td>
                      <td className="py-2 px-3 font-mono">kg PO4-eq</td>
                      <td className="py-2 px-3">CML-IA Baseline v4.8</td>
                      <td className="py-2 px-3">Wajib Permen LHK 01/2021; relevan terhadap pencucian NO3, PO4 &amp; COD POME</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-mono">4</td>
                      <td className="py-2 px-3 font-medium">Penggunaan Energi (CED)</td>
                      <td className="py-2 px-3 font-mono">MJ-eq</td>
                      <td className="py-2 px-3">LHV BioGrace / Ecoinvent</td>
                      <td className="py-2 px-3">Wajib Permen LHK 01/2021; mengevaluasi efisiensi energi fosil &amp; biomassa</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* BAB 4: INVENTORI DAUR HIDUP */}
            <section className="space-y-5">
              <div className="pb-2 border-b border-slate-200">
                <p className="text-xs font-mono text-teal-700">BAB 04</p>
                <h2 className="text-lg font-bold text-slate-900">4. Inventori Daur Hidup (LCI)</h2>
              </div>

              <p className="text-sm text-slate-700">
                Data primer mencakup produktivitas TBS ({fmt(params.ffbYieldTonHaYear, 1)} t/ha/thn),
                dosis pemupukan, jarak angkut TBS ({params.transportDistanceKm} km), rendemen OER/KER,
                debit &amp; COD POME, serta pemakaian solar dan air proses. Data sekunder faktor emisi
                bersumber dari <strong>IPCC 2006/2019 Refinement</strong>,{' '}
                <strong>IPCC 2013 Wetlands Supplement</strong>, <strong>RSPO PalmGHG v4</strong>,{' '}
                <strong>BioGrace</strong>, dan <strong>Ecoinvent 3.8</strong>.
              </p>

              {/* Tabel 6: Ringkasan Inventori Proses Inti */}
              <div className="overflow-x-auto print-avoid-break">
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Tabel 6. Ringkasan Inventori Sistem Proses Sesuai Total 1 Tahun ({meta.studyPeriod}) dan Per Unit Fungsi (1 ton CPO)
                </p>
                <table className="w-full text-xs border border-slate-200">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2 px-3 text-left">Input / Output</th>
                      <th className="py-2 px-3 text-right">Total 1 Tahun</th>
                      <th className="py-2 px-3 text-left">Unit</th>
                      <th className="py-2 px-3 text-right">Per 1 ton CPO (Teralokasi)</th>
                      <th className="py-2 px-3 text-left">Unit</th>
                      <th className="py-2 px-3 text-left">Proses Dominan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-1.5 px-3 font-medium">Bahan Baku: Tandan Buah Segar (TBS)</td>
                      <td className="py-1.5 px-3 text-right font-mono">{fmt(result.annualFfbTon, 0)}</td>
                      <td className="py-1.5 px-3 font-mono">ton</td>
                      <td className="py-1.5 px-3 text-right font-mono">{fmt(result.ffbRequiredPerTonCpo * result.allocationCpo, 2)}</td>
                      <td className="py-1.5 px-3 font-mono">ton</td>
                      <td className="py-1.5 px-3">PKS Inti (Ekstraksi)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-medium">Air Proses Pabrik</td>
                      <td className="py-1.5 px-3 text-right font-mono">{fmt(totalWaterAnnualM3, 0)}</td>
                      <td className="py-1.5 px-3 font-mono">m3</td>
                      <td className="py-1.5 px-3 text-right font-mono">{fmt(params.millWaterM3PerTonFfb * result.ffbRequiredPerTonCpo * result.allocationCpo, 2)}</td>
                      <td className="py-1.5 px-3 font-mono">m3</td>
                      <td className="py-1.5 px-3">PKS Inti (Sterilisasi &amp; Klarifikasi)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-medium">Pupuk Sintetis (Urea + SP-36 + KCl + Dolomit)</td>
                      <td className="py-1.5 px-3 text-right font-mono">{fmt((ureaTotalAnnualKg + sp36TotalAnnualKg + kclTotalAnnualKg + dolomitTotalAnnualKg) / 1000, 1)}</td>
                      <td className="py-1.5 px-3 font-mono">ton</td>
                      <td className="py-1.5 px-3 text-right font-mono">{fmt(((params.ureaKgHaYear + params.sp36KgHaYear + params.kclKgHaYear + params.dolomitKgHaYear) / params.ffbYieldTonHaYear) * result.ffbRequiredPerTonCpo * result.allocationCpo, 1)}</td>
                      <td className="py-1.5 px-3 font-mono">kg</td>
                      <td className="py-1.5 px-3">Perkebunan (Budidaya TBS)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-medium">Bahan Bakar Cair: Solar Industri (Total)</td>
                      <td className="py-1.5 px-3 text-right font-mono">{fmt(totalDieselAnnualL, 0)}</td>
                      <td className="py-1.5 px-3 font-mono">liter</td>
                      <td className="py-1.5 px-3 text-right font-mono">{fmt((totalDieselAnnualL / result.annualFfbTon) * result.ffbRequiredPerTonCpo * result.allocationCpo, 2)}</td>
                      <td className="py-1.5 px-3 font-mono">liter</td>
                      <td className="py-1.5 px-3">Kebun, Transportasi TBS &amp; Genset PKS</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-medium">Output Produk Utama: Crude Palm Oil (CPO)</td>
                      <td className="py-1.5 px-3 text-right font-mono">{fmt(result.annualCpoTon, 0)}</td>
                      <td className="py-1.5 px-3 font-mono">ton</td>
                      <td className="py-1.5 px-3 text-right font-mono">1,00</td>
                      <td className="py-1.5 px-3 font-mono">ton</td>
                      <td className="py-1.5 px-3">PKS Inti</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-medium">Output Co-product: Palm Kernel (PK)</td>
                      <td className="py-1.5 px-3 text-right font-mono">{fmt(result.annualPkTon, 0)}</td>
                      <td className="py-1.5 px-3 font-mono">ton</td>
                      <td className="py-1.5 px-3 text-right font-mono">{fmt(params.kerPercent / params.oerPercent, 3)}</td>
                      <td className="py-1.5 px-3 font-mono">ton</td>
                      <td className="py-1.5 px-3">PKS Inti (Stasiun Kernel)</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-medium">Limbah Cair: POME Diolah di IPAL</td>
                      <td className="py-1.5 px-3 text-right font-mono">{fmt(result.annualPomeM3, 0)}</td>
                      <td className="py-1.5 px-3 font-mono">m3</td>
                      <td className="py-1.5 px-3 text-right font-mono">{fmt(params.pomeVolumeM3PerTonFfb * result.ffbRequiredPerTonCpo * result.allocationCpo, 2)}</td>
                      <td className="py-1.5 px-3 font-mono">m3</td>
                      <td className="py-1.5 px-3">IPAL PKS (POME)</td>
                    </tr>
                    {result.inventoryRows
                      .filter((r) => r.amountPerTonCpo > 0.0005)
                      .map((r) => (
                        <tr key={r.flowId}>
                          <td className="py-1.5 px-3">
                            Emisi ({r.compartment === 'air' ? 'Udara' : 'Air'}): {r.name}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono">{fmt(r.amountAnnualTotal, 0)}</td>
                          <td className="py-1.5 px-3 font-mono">{r.unit}</td>
                          <td className="py-1.5 px-3 text-right font-mono">{fmt(r.amountPerTonCpo, 3)}</td>
                          <td className="py-1.5 px-3 font-mono">{r.unit}</td>
                          <td className="py-1.5 px-3">{r.dominantStage}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Tabel 9: Ringkasan Pemeriksaan Kualitas Data */}
              <div className="print-avoid-break">
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Tabel 9. Validasi &amp; Ringkasan Pemeriksaan Kualitas Data (Hal. 48 Pedoman KLHK 2021)
                </p>
                <p className="text-xs text-slate-600 mb-2">
                  Validasi neraca massa (OER + KER + EFB + Cangkang/Fiber + POME/Air) dan
                  ketersediaan data menghasilkan kelengkapan{' '}
                  <span className="font-mono font-semibold">
                    {fmt(result.dataQualityStats.completenessPercent, 1)}%
                  </span>{' '}
                  dengan komposisi{' '}
                  <span className="font-mono font-semibold">
                    {result.dataQualityStats.primaryCount} aliran data primer ({fmt(result.dataQualityStats.primaryPercent, 1)}%)
                  </span>{' '}
                  dan{' '}
                  <span className="font-mono font-semibold">
                    {result.dataQualityStats.secondaryCount} aliran data sekunder/literatur ({fmt(result.dataQualityStats.secondaryPercent, 1)}%)
                  </span>
                  . Data dinilai memenuhi persyaratan untuk tahap Penilaian Dampak Daur Hidup (LCIA).
                </p>
              </div>
            </section>

            {/* BAB 5: PENILAIAN DAMPAK DAUR HIDUP (LCIA) */}
            <section className="space-y-4 print-avoid-break">
              <div className="pb-2 border-b border-slate-200">
                <p className="text-xs font-mono text-teal-700">BAB 05</p>
                <h2 className="text-lg font-bold text-slate-900">5. Penilaian Dampak Daur Hidup (LCIA)</h2>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Tabel 12. Hasil Karakterisasi Dampak Berdasarkan Tahap Daur Hidup (Per 1 ton CPO)
                </p>
                <table className="w-full text-xs border border-slate-200">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2 px-3 text-left">Kategori Dampak</th>
                      <th className="py-2 px-3 text-left">Unit</th>
                      <th className="py-2 px-3 text-right">Upstream / Cradle / Hulu</th>
                      <th className="py-2 px-3 text-right">Gate to Gate / Core PKS</th>
                      <th className="py-2 px-3 text-right">Total per 1 ton CPO</th>
                      <th className="py-2 px-3 text-right">Total per 1 ton PK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    <tr>
                      <td className="py-2 px-3 font-sans font-medium">Global Warming Potential (GWP 100a)</td>
                      <td className="py-2 px-3">kg CO2-eq</td>
                      <td className="py-2 px-3 text-right">{fmt(upstreamGwp, 2)}</td>
                      <td className="py-2 px-3 text-right">{fmt(coreGwp, 2)}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{fmt(result.gwpCpo, 2)}</td>
                      <td className="py-2 px-3 text-right">{fmt(result.gwpPk, 2)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-sans font-medium">Acidification Potential (AP)</td>
                      <td className="py-2 px-3">kg SO2-eq</td>
                      <td className="py-2 px-3 text-right">{fmt(upstreamAp, 3)}</td>
                      <td className="py-2 px-3 text-right">{fmt(coreAp, 3)}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{fmt(result.apCpo, 3)}</td>
                      <td className="py-2 px-3 text-right">{fmt(result.apPk, 3)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-sans font-medium">Eutrophication Potential (EP)</td>
                      <td className="py-2 px-3">kg PO4-eq</td>
                      <td className="py-2 px-3 text-right">{fmt(upstreamEp, 3)}</td>
                      <td className="py-2 px-3 text-right">{fmt(coreEp, 3)}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{fmt(result.epCpo, 3)}</td>
                      <td className="py-2 px-3 text-right">{fmt(result.epPk, 3)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-slate-700">
                <strong>5.5 Keterkaitan LCIA dengan LCI (Aturan Pareto 80%):</strong> Berdasarkan
                hukum Pareto 80%, penyumbang dominan dampak GWP 100a berasal dari{' '}
                {pareto80Materials.map((m, i) => (
                  <span key={m.material}>
                    {i > 0 ? ', ' : ''}
                    <strong>{m.material}</strong> ({fmt(m.gwpSharePercent, 1)}%)
                  </span>
                ))}
                .
              </p>

              <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900">
                <strong>5.6 Pernyataan Wajib (Hal. 58 Pedoman KLHK 2021):</strong>{' '}
                <em>
                  “Hasil LCIA merupakan ekspresi relatif dan tidak memprediksi dampak pada kategori
                  endpoint, terlampauinya nilai ambang, batas keselamatan, atau risiko.”
                </em>
              </div>
            </section>

            {/* BAB 6: INTERPRETASI DAUR HIDUP */}
            <section className="space-y-5">
              <div className="pb-2 border-b border-slate-200">
                <p className="text-xs font-mono text-teal-700">BAB 06</p>
                <h2 className="text-lg font-bold text-slate-900">6. Interpretasi Daur Hidup</h2>
              </div>

              {/* Tabel 13 & 14 */}
              <div className="overflow-x-auto print-avoid-break">
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Tabel 13. Ringkasan Kontribusi Penting dari Proses (Hotspot Analysis — Hal. 60 Pedoman KLHK 2021)
                </p>
                <table className="w-full text-xs border border-slate-200">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2 px-3 text-left">Proses</th>
                      <th className="py-2 px-3 text-right">GWP (%)</th>
                      <th className="py-2 px-3 text-right">Asidifikasi (%)</th>
                      <th className="py-2 px-3 text-right">Eutrofikasi (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    {result.stageBreakdown.map((st) => (
                      <tr key={st.stageId}>
                        <td className="py-1.5 px-3 font-sans text-slate-800">{st.stageName}</td>
                        <td className="py-1.5 px-3 text-right font-semibold">{fmt(st.gwpSharePercent, 1)}%</td>
                        <td className="py-1.5 px-3 text-right">{fmt(st.apSharePercent, 1)}%</td>
                        <td className="py-1.5 px-3 text-right">{fmt(st.epSharePercent, 1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto print-avoid-break">
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Tabel 14. Ringkasan Kontribusi Penting dari Bahan / Aktivitas &amp; Uji Pareto 80% (Hal. 61 Pedoman KLHK 2021)
                </p>
                <table className="w-full text-xs border border-slate-200">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2 px-3 text-left">Masukan / Keluaran LCI</th>
                      <th className="py-2 px-3 text-right">GWP (kg CO2-eq)</th>
                      <th className="py-2 px-3 text-right">Porsi GWP</th>
                      <th className="py-2 px-3 text-right">Kumulatif</th>
                      <th className="py-2 px-3 text-left">Status Pareto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.materialContributions.map((m) => (
                      <tr key={m.material}>
                        <td className="py-1.5 px-3 font-medium text-slate-800">{m.material}</td>
                        <td className="py-1.5 px-3 text-right font-mono">{fmt(m.gwpPerTonCpo, 1)}</td>
                        <td className="py-1.5 px-3 text-right font-mono">{fmt(m.gwpSharePercent, 1)}%</td>
                        <td className="py-1.5 px-3 text-right font-mono">{fmt(m.cumulativeGwpPercent, 1)}%</td>
                        <td className="py-1.5 px-3 text-xs font-medium text-teal-800">
                          {m.isPareto80 ? 'Hotspot Utama (Pareto 80%)' : 'Kontributor Sekunder'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bab 6.2 Sensitivitas */}
              <div className="overflow-x-auto print-avoid-break">
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  6.2 Evaluasi Kelengkapan, Sensitivitas (Metode Alokasi &amp; Mitigasi POME), Ketidakpastian, dan Konsistensi
                </p>
                <table className="w-full text-xs border border-slate-200">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2 px-3 text-left">Skenario Uji Sensitivitas</th>
                      <th className="py-2 px-3 text-left">Kelompok</th>
                      <th className="py-2 px-3 text-right">GWP CPO (kg CO2-eq/t)</th>
                      <th className="py-2 px-3 text-right">GWP PK (kg CO2-eq/t)</th>
                      <th className="py-2 px-3 text-right">Selisih vs Skenario Aktif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    {result.sensitivity.map((sc) => (
                      <tr key={sc.label}>
                        <td className="py-1.5 px-3 font-sans text-slate-800">{sc.label}</td>
                        <td className="py-1.5 px-3 font-sans text-slate-500">{sc.group}</td>
                        <td className="py-1.5 px-3 text-right">{fmt(sc.gwpCpo, 1)}</td>
                        <td className="py-1.5 px-3 text-right">{fmt(sc.gwpPk, 1)}</td>
                        <td className="py-1.5 px-3 text-right">
                          {sc.deltaPercentVsCurrent >= 0 ? '+' : ''}
                          {fmt(sc.deltaPercentVsCurrent, 1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* BAB 7: KESIMPULAN, KETERBATASAN & REKOMENDASI */}
            <section className="space-y-3 print-avoid-break">
              <div className="pb-2 border-b border-slate-200">
                <p className="text-xs font-mono text-teal-700">BAB 07</p>
                <h2 className="text-lg font-bold text-slate-900">
                  7. Kesimpulan, Keterbatasan, dan Rekomendasi
                </h2>
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                <p>
                  <strong>7.1 Kesimpulan:</strong> Total potensi pemanasan global (GWP 100a)
                  cradle-to-gate tercatat sebesar{' '}
                  <strong className="font-mono">{fmt(result.gwpCpo, 1)} kg CO2-eq/ton CPO</strong>{' '}
                  dan <strong className="font-mono">{fmt(result.gwpPk, 1)} kg CO2-eq/ton PK</strong>,
                  dengan potensi asidifikasi{' '}
                  <strong className="font-mono">{fmt(result.apCpo, 2)} kg SO2-eq/ton CPO</strong>{' '}
                  serta potensi eutrofikasi{' '}
                  <strong className="font-mono">{fmt(result.epCpo, 2)} kg PO4-eq/ton CPO</strong>.
                  Hotspot GWP terbesar berada pada <strong>{result.topGwpStage.stageName}</strong> (
                  {fmt(result.topGwpStage.gwpSharePercent, 1)}%), hotspot AP pada{' '}
                  <strong>{result.topApStage.stageName}</strong> (
                  {fmt(result.topApStage.apSharePercent, 1)}%), dan hotspot EP pada{' '}
                  <strong>{result.topEpStage.stageName}</strong> (
                  {fmt(result.topEpStage.epSharePercent, 1)}%).
                </p>
                <p>
                  <strong>7.2 Keterbatasan Kajian:</strong> Kajian terbatas pada batasan{' '}
                  <em>cradle-to-gate</em> periode 1 tahun dengan faktor emisi N2O tanah dan manufaktur
                  pupuk menggunakan data sekunder IPCC Tier 1 dan Ecoinvent 3.8. Variasi musim panen
                  dan fluktuasi COD POME harian dapat menimbulkan ketidakpastian estimasi sekitar ±15%.
                </p>
                <p>
                  <strong>7.3 Rekomendasi Berbasis Hotspot:</strong>
                </p>
                <ol className="list-decimal pl-5 space-y-1">
                  {result.pomeReductionPotentialKgCo2eq > 20 && (
                    <li>
                      <strong>Instalasi Methane Capture &amp; Pemanfaatan Biogas (PLTBg):</strong>{' '}
                      Menangkap 90% metana POME mampu memangkas jejak karbon sebesar{' '}
                      <span className="font-mono font-semibold">
                        {fmt(result.pomeReductionPotentialKgCo2eq, 1)} kg CO2-eq/ton CPO
                      </span>{' '}
                      sekaligus menyubstitusi kebutuhan solar genset PKS.
                    </li>
                  )}
                  <li>
                    <strong>Pemupukan Presisi &amp; Substitusi Organik (EFB/Kompos):</strong>{' '}
                    Mengoptimalkan dosis Urea ({params.ureaKgHaYear} kg/ha) melalui analisis daun
                    (LSU) serta aplikasi mulsa/kompos tandan kosong (EFB) untuk menekan emisi N2O,
                    volatilisasi NH3 (AP), dan pencucian NO3/PO4 (EP).
                  </li>
                  <li>
                    <strong>Pemanfaatan Efluen IPAL (Land Application) &amp; Efisiensi OER:</strong>{' '}
                    {params.pomeLandApplication
                      ? 'Mempertahankan dan memantau kualitas land application POME sesuai baku mutu guna mencegah limpasan nutrien ke sungai.'
                      : 'Mengembangkan skema land application terkendali untuk menekan potensi eutrofikasi dari pelepasan residu COD dan fosfat ke badan air.'}
                  </li>
                  {params.enablePeat && params.peatPercent > 0 && (
                    <li>
                      <strong>Tata Kelola Air Lahan Gambut (Water Management):</strong> Menjaga
                      tinggi muka air tanah gambut sesuai regulasi KLHK dan menghentikan ekspansi baru
                      pada lahan gambut untuk menahan laju oksidasi karbon.
                    </li>
                  )}
                </ol>
              </div>
            </section>
          </div>
        )}

        {/* ===================================================================== */}
        {/* INDEKS LAPORAN (TABEL 15) & LAMPIRAN RINCIAN INVENTORI (HAL. viii–xii) */}
        {/* ===================================================================== */}
        {showAppendix && (
          <div className="space-y-8 print-break-before">
            <section className="space-y-3">
              <div className="pb-2 border-b border-slate-200">
                <p className="text-xs font-mono text-teal-700">INDEKS LAPORAN · TABEL 15 HAL. viii–ix PEDOMAN KLHK 2021</p>
                <h2 className="text-lg font-bold text-slate-900">Indeks Pengungkapan Laporan PROPER</h2>
              </div>
              <table className="w-full text-xs border border-slate-200">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-2 px-3 text-left">Bab</th>
                    <th className="py-2 px-3 text-left">Item Pengungkapan Wajib</th>
                    <th className="py-2 px-3 text-left">Status Pemenuhan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ['Umum & Bab 1', 'Riwayat dokumen, identitas pemrakarsa, profil & latar belakang Permen LHK 01/2021', 'Tercantum (Umum & Bab 1)'],
                    ['Bab 2 (Tujuan & Lingkup)', 'Tujuan, pihak dituju, pernyataan non-komparatif, unit fungsi, diagram sistem, cut-off, alokasi, Tabel 2 kualitas data', 'Tercantum (Bab 2.1 – 2.2)'],
                    ['Bab 3 (Metode)', 'Acuan SNI ISO 14040/14044, perangkat lunak openLCA, Tabel 3 kategori & metode dampak', 'Tercantum (Bab 3.1 – 3.3)'],
                    ['Bab 4 (LCI)', 'Deskripsi unit proses, sumber literatur, Tabel 6 inventori total & unit fungsi, Tabel 9 validasi data', 'Tercantum (Bab 4 & Lampiran)'],
                    ['Bab 5 (LCIA)', 'Tabel 12 karakterisasi dampak per tahap, analisis Pareto 80%, pernyataan ekspresi relatif (5.6)', 'Tercantum (Bab 5.1 – 5.6)'],
                    ['Bab 6 (Interpretasi)', 'Tabel 13 & 14 identifikasi hotspot proses & bahan, evaluasi kelengkapan & analisis sensitivitas', 'Tercantum (Bab 6.1 – 6.2)'],
                    ['Bab 7 (Kesimpulan)', 'Kesimpulan kuantitatif, keterbatasan kajian, rekomendasi spesifik berbasis hotspot', 'Tercantum (Bab 7.1 – 7.3)'],
                    ['Tinjauan Kritis', 'Status pelaksanaan tinjauan kritis (ISO/TS 14071)', meta.criticalReviewDone ? 'Dilakukan' : 'Tidak Dilakukan (Opsional)'],
                  ].map(([bab, item, st]) => (
                    <tr key={bab}>
                      <td className="py-1.5 px-3 font-semibold text-slate-800">{bab}</td>
                      <td className="py-1.5 px-3 text-slate-700">{item}</td>
                      <td className="py-1.5 px-3 font-medium text-teal-800">{st}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Lampiran Rincian Inventori per Subsistem */}
            <section className="space-y-4">
              <div className="pb-2 border-b border-slate-200">
                <p className="text-xs font-mono text-teal-700">LAMPIRAN · HAL. x–xii PEDOMAN KLHK 2021</p>
                <h2 className="text-lg font-bold text-slate-900">
                  Lampiran Rincian Inventori Daur Hidup per Unit Proses (Referensi openLCA)
                </h2>
              </div>

              {result.processes.map((proc) => (
                <div key={proc['@id']} className="print-avoid-break">
                  <p className="text-xs font-semibold text-slate-800 mb-1.5">
                    Unit Proses {proc.code}: {proc.name} (Referensi: {proc.quantitativeReference})
                  </p>
                  <table className="w-full text-xs border border-slate-200">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="py-1.5 px-3 text-left">Arah</th>
                        <th className="py-1.5 px-3 text-left">Aliran</th>
                        <th className="py-1.5 px-3 text-right">Jumlah</th>
                        <th className="py-1.5 px-3 text-left">Unit</th>
                        <th className="py-1.5 px-3 text-left">Sumber Data</th>
                        <th className="py-1.5 px-3 text-left">Dataset Referensi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {proc.exchanges.map((ex, idx) => (
                        <tr key={`${ex.flowId}-${idx}`}>
                          <td className="py-1.5 px-3">{ex.isInput ? 'Input' : 'Output'}</td>
                          <td className="py-1.5 px-3 font-medium text-slate-800">{ex.flowName}</td>
                          <td className="py-1.5 px-3 text-right font-mono">{fmt(ex.amount, 4)}</td>
                          <td className="py-1.5 px-3 font-mono">{ex.unit}</td>
                          <td className="py-1.5 px-3">{ex.dataQuality}</td>
                          <td className="py-1.5 px-3 text-slate-500">{ex.datasetRef}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </section>
          </div>
        )}
      </article>
    </div>
  );
};
