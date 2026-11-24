import { OLCA_FLOWS, getImpactCategories } from './olcaData';
import { LcaInputParams, LcaResult, ReportMetadata } from './types';

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports full openLCA-structured JSON (Flows, Processes, Matrix, LCI, LCIA, PROPER metadata)
 */
export function downloadJsonReport(
  params: LcaInputParams,
  result: LcaResult,
  meta: ReportMetadata
) {
  const payload = {
    schema: 'olca-schema-inspired/v2.0',
    standard: 'SNI ISO 14040:2016 / SNI ISO 14044:2017 / Permen LHK No. 1 Tahun 2021 (PROPER)',
    generatedAt: new Date().toISOString(),
    metadata: meta,
    inputParameters: params,
    allocationSummary: {
      method: params.allocationMethod,
      allocationFactorCPO: Number(result.allocationCpo.toFixed(6)),
      allocationFactorPK: Number(result.allocationPk.toFixed(6)),
      ffbRequiredPerTonCpo: Number(result.ffbRequiredPerTonCpo.toFixed(4)),
    },
    lciaHeadlinePerFunctionalUnit: {
      functionalUnitCPO: '1 ton Crude Palm Oil (CPO) di pintu gerbang PKS',
      functionalUnitPK: '1 ton Palm Kernel (PK) di pintu gerbang PKS',
      GWP100a_kgCO2eq_per_tonCPO: Number(result.gwpCpo.toFixed(3)),
      GWP100a_kgCO2eq_per_tonPK: Number(result.gwpPk.toFixed(3)),
      AP_kgSO2eq_per_tonCPO: Number(result.apCpo.toFixed(4)),
      AP_kgSO2eq_per_tonPK: Number(result.apPk.toFixed(4)),
      EP_kgPO4eq_per_tonCPO: Number(result.epCpo.toFixed(4)),
      EP_kgPO4eq_per_tonPK: Number(result.epPk.toFixed(4)),
      CED_MJ_per_tonCPO: Number(result.cedCpo.toFixed(2)),
    },
    stageBreakdown: result.stageBreakdown,
    elementaryInventoryLCI: result.inventoryRows,
    materialParetoHotspots: result.materialContributions,
    sensitivityAnalysis: result.sensitivity,
    openLcaModel: {
      flows: OLCA_FLOWS,
      processes: result.processes,
      impactCategories: getImpactCategories(params.gwpStandard),
      matrixSolution: {
        technosphereFlows: result.matrix.technosphereFlows,
        processNames: result.matrix.processNames,
        A: result.matrix.A,
        f_demandFor1TonCpoJoint: result.matrix.f,
        s_scalingVector: result.matrix.s,
      },
    },
  };

  const slug = meta.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32);
  triggerDownload(
    `LCA-Sawit-${slug}-${meta.reportDate}.json`,
    JSON.stringify(payload, null, 2),
    'application/json;charset=utf-8'
  );
}

/**
 * Exports Excel-compatible CSV containing LCIA Process Breakdown + Complete LCI Elementary Flows
 */
export function downloadCsvReport(
  params: LcaInputParams,
  result: LcaResult,
  meta: ReportMetadata
) {
  const esc = (v: string | number) => {
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const lines: string[] = [];
  lines.push('LAPORAN RINGKAS LCI & LCIA KELAPA SAWIT (CRADLE-TO-GATE)');
  lines.push(`Perusahaan,${esc(meta.companyName)}`);
  lines.push(`Unit PKS,${esc(meta.millName)}`);
  lines.push(`Periode Kajian,${esc(meta.studyPeriod)}`);
  lines.push(`Metode Alokasi,${esc(params.allocationMethod)} (CPO: ${(result.allocationCpo * 100).toFixed(2)}% | PK: ${(result.allocationPk * 100).toFixed(2)}%)`);
  lines.push(`Standar GWP,${esc(params.gwpStandard)}`);
  lines.push('');

  lines.push('BAGIAN 1: RINGKASAN HASIL LCIA PER UNIT FUNGSIONAL');
  lines.push('Kategori Dampak,Satuan,Per 1 ton CPO,Per 1 ton PK,Metode Karakterisasi');
  lines.push(`Global Warming Potential (GWP 100a),kg CO2-eq,${result.gwpCpo.toFixed(3)},${result.gwpPk.toFixed(3)},IPCC ${params.gwpStandard}`);
  lines.push(`Acidification Potential (AP),kg SO2-eq,${result.apCpo.toFixed(4)},${result.apPk.toFixed(4)},CML-IA Baseline`);
  lines.push(`Eutrophication Potential (EP),kg PO4-eq,${result.epCpo.toFixed(4)},${result.epPk.toFixed(4)},CML-IA Baseline`);
  lines.push(`Cumulative Energy Demand (CED),MJ-eq,${result.cedCpo.toFixed(2)},${result.cedPk.toFixed(2)},LHV BioGrace/Ecoinvent`);
  lines.push('');

  lines.push('BAGIAN 2: BREAKDOWN KONTRIBUSI PER TAHAPAN PROSES (PER 1 TON CPO)');
  lines.push('Kode,Tahapan Proses,Fase,GWP (kg CO2-eq),Kontribusi GWP (%),AP (kg SO2-eq),Kontribusi AP (%),EP (kg PO4-eq),Kontribusi EP (%)');
  for (const st of result.stageBreakdown) {
    lines.push(
      [
        st.stageId,
        esc(st.stageName),
        esc(st.lifecyclePhase),
        st.gwpPerTonCpo.toFixed(3),
        st.gwpSharePercent.toFixed(2),
        st.apPerTonCpo.toFixed(4),
        st.apSharePercent.toFixed(2),
        st.epPerTonCpo.toFixed(4),
        st.epSharePercent.toFixed(2),
      ].join(',')
    );
  }
  lines.push('');

  lines.push('BAGIAN 3: TABEL INVENTORI DAUR HIDUP (LCI — ELEMENTARY FLOWS)');
  lines.push('Flow ID,Nama Aliran Dasar,Kompartemen,Satuan,Jumlah per ton TBS,Jumlah per ton CPO,Jumlah per ton PK,Total Tahunan,Kontribusi GWP CPO (kg CO2-eq),Proses Dominan');
  for (const row of result.inventoryRows) {
    lines.push(
      [
        row.flowId,
        esc(row.name),
        row.compartment,
        row.unit,
        row.amountPerTonFfb.toFixed(6),
        row.amountPerTonCpo.toFixed(6),
        row.amountPerTonPk.toFixed(6),
        row.amountAnnualTotal.toFixed(2),
        row.gwpContributionCpo.toFixed(3),
        esc(row.dominantStage),
      ].join(',')
    );
  }

  const bom = '\uFEFF';
  const slug = meta.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32);
  triggerDownload(
    `LCI-LCIA-Sawit-${slug}-${meta.reportDate}.csv`,
    bom + lines.join('\n'),
    'text/csv;charset=utf-8'
  );
}

/**
 * Generates a self-contained single-file standalone index.html (Tailwind CDN + Chart.js CDN + Vanilla JS ES Module)
 * satisfying the explicit standalone single-file HTML5 deliverable with current scenario pre-loaded!
 */
export function downloadStandaloneHtml(params: LcaInputParams, meta: ReportMetadata) {
  const initialJson = JSON.stringify({ params, meta });
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SawitLCA — Kalkulator LCA Kelapa Sawit Standalone (openLCA & PROPER KLHK 2021)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'DM Sans', sans-serif; }
    h1,h2,h3,h4 { font-family: 'Plus Jakarta Sans', sans-serif; }
    .font-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
    @media print { .no-print { display: none !important; } body { background: #fff !important; } }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 antialiased">
  <header class="no-print sticky top-0 z-30 bg-white border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
      <span class="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">SawitLCA Standalone</span>
      <nav class="flex items-center gap-6 text-sm font-medium">
        <button data-nav="calc" class="nav-btn text-teal-700 font-semibold whitespace-nowrap">Kalkulator</button>
        <button data-nav="dash" class="nav-btn text-slate-600 hover:text-slate-900 whitespace-nowrap">Dashboard &amp; Grafik</button>
        <button data-nav="report" class="nav-btn text-slate-600 hover:text-slate-900 whitespace-nowrap">Laporan PROPER 2021</button>
      </nav>
      <div class="flex items-center gap-2">
        <button id="btnExportJson" class="px-3 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg whitespace-nowrap">Unduh JSON</button>
        <button onclick="window.print()" class="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg whitespace-nowrap">Cetak PDF</button>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-6 py-8">
    <section id="view-calc" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div class="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6">
        <div class="flex gap-2 border-b border-slate-200 pb-4 mb-6">
          <button data-step="1" class="step-btn px-4 py-2 text-sm font-semibold rounded-lg bg-teal-700 text-white">1. Parameter &amp; Alokasi</button>
          <button data-step="2" class="step-btn px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-700">2. Kebun (Hulu)</button>
          <button data-step="3" class="step-btn px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-700">3. Pabrik (PKS)</button>
        </div>

        <div id="step-1" class="step-panel grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label class="block"><span class="text-xs font-medium text-slate-600">Target Produksi CPO (ton/tahun)</span><input id="targetCpoTonYear" type="number" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" /></label>
          <label class="block"><span class="text-xs font-medium text-slate-600">Oil Extraction Rate — OER (%)</span><input id="oerPercent" type="number" step="0.1" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" /></label>
          <label class="block"><span class="text-xs font-medium text-slate-600">Kernel Extraction Rate — KER (%)</span><input id="kerPercent" type="number" step="0.1" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" /></label>
          <label class="block"><span class="text-xs font-medium text-slate-600">Metode Alokasi CPO &amp; PK</span>
            <select id="allocationMethod" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
              <option value="energy">Alokasi Energi (LHV: CPO 37 / PK 18.5 MJ/kg)</option>
              <option value="economic">Alokasi Ekonomi (Harga Pasar Relatif)</option>
              <option value="mass">Alokasi Massa (OER vs KER)</option>
            </select>
          </label>
          <label class="block"><span class="text-xs font-medium text-slate-600">Harga CPO (Rp/kg)</span><input id="priceCpoIdrKg" type="number" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" /></label>
          <label class="block"><span class="text-xs font-medium text-slate-600">Harga PK (Rp/kg)</span><input id="pricePkIdrKg" type="number" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" /></label>
        </div>

        <div id="step-2" class="step-panel hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label class="block"><span class="text-xs font-medium text-slate-600">Produktivitas TBS (ton/ha/tahun)</span><input id="ffbYieldTonHaYear" type="number" step="0.5" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" /></label>
          <label class="block"><span class="text-xs font-medium text-slate-600">Pupuk Urea 46% N (kg/ha/tahun)</span><input id="ureaKgHaYear" type="number" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" /></label>
          <label class="block"><span class="text-xs font-medium text-slate-600">Pupuk SP-36 (kg/ha/tahun)</span><input id="sp36KgHaYear" type="number" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" /></label>
          <label class="block"><span class="text-xs font-medium text-slate-600">Pupuk KCl / MOP (kg/ha/tahun)</span><input id="kclKgHaYear" type="number" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" /></label>
          <label class="block"><span class="text-xs font-medium text-slate-600">Dolomit (kg/ha/tahun)</span><input id="dolomitKgHaYear" type="number" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" /></label>
          <label class="block"><span class="text-xs font-medium text-slate-600">Herbisida bahan aktif (kg/ha/tahun)</span><input id="herbicideKgHaYear" type="number" step="0.1" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" /></label>
          <label class="block"><span class="text-xs font-medium text-slate-600">Solar Alat Berat Kebun (L/ha/tahun)</span><input id="fieldDieselLHaYear" type="number" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" /></label>
          <label class="block"><span class="text-xs font-medium text-slate-600">Jarak Angkut TBS ke PKS (km)</span><input id="transportDistanceKm" type="number" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" /></label>
          <label class="flex items-center gap-2 pt-2"><input id="enablePeat" type="checkbox" class="h-4 w-4 accent-teal-700" /><span class="text-sm font-medium text-slate-700">Aktifkan Drainase Lahan Gambut</span></label>
          <label class="block"><span class="text-xs font-medium text-slate-600">Persentase Lahan Gambut (%)</span><input id="peatPercent" type="number" min="0" max="100" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" /></label>
        </div>

        <div id="step-3" class="step-panel hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label class="block sm:col-span-2"><span class="text-xs font-medium text-slate-600">Metode Penanganan Limbah Cair POME</span>
            <select id="pomeTreatment" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
              <option value="open_lagoon">Kolam Anaerobik Terbuka (Open Lagoon — 0% Capture)</option>
              <option value="methane_capture_flare">Methane Capture + Flaring (85% Capture)</option>
              <option value="methane_capture_biogas">Methane Capture + Biogas PLTBg (90% Capture)</option>
            </select>
          </label>
          <label class="block"><span class="text-xs font-medium text-slate-600">Volume POME (m3 / ton TBS)</span><input id="pomeVolumeM3PerTonFfb" type="number" step="0.01" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" /></label>
          <label class="block"><span class="text-xs font-medium text-slate-600">COD Influen POME (mg/L)</span><input id="pomeCodMgL" type="number" step="1000" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" /></label>
          <label class="block"><span class="text-xs font-medium text-slate-600">Solar Genset Tambahan PKS (L / ton TBS)</span><input id="millDieselLPerTonFfb" type="number" step="0.1" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm" /></label>
          <label class="block"><span class="text-xs font-medium text-slate-600">Penanganan Tandan Kosong (EFB)</span>
            <select id="efbTreatment" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
              <option value="mulching">Mulsa Organik di Kebun</option>
              <option value="composting">Co-composting dengan POME</option>
              <option value="open_dumping">Dumping Terbuka</option>
            </select>
          </label>
        </div>
      </div>

      <aside class="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5 h-fit">
        <div>
          <p class="text-xs font-medium text-slate-500">Global Warming Potential (GWP 100a)</p>
          <p id="kpiGwpCpo" class="text-3xl font-bold font-mono text-slate-900 mt-1">-</p>
          <p class="text-xs text-slate-500">kg CO2-eq / ton CPO</p>
        </div>
        <div class="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
          <div><p class="text-xs text-slate-500">GWP 100a PK</p><p id="kpiGwpPk" class="text-lg font-semibold font-mono text-slate-900">-</p><p class="text-xs text-slate-400">kg CO2-eq/t PK</p></div>
          <div><p class="text-xs text-slate-500">Alokasi CPO / PK</p><p id="kpiAlloc" class="text-lg font-semibold font-mono text-teal-700">-</p><p class="text-xs text-slate-400">rasio beban</p></div>
          <div><p class="text-xs text-slate-500">Acidification (AP)</p><p id="kpiAp" class="text-lg font-semibold font-mono text-slate-900">-</p><p class="text-xs text-slate-400">kg SO2-eq/t CPO</p></div>
          <div><p class="text-xs text-slate-500">Eutrophication (EP)</p><p id="kpiEp" class="text-lg font-semibold font-mono text-slate-900">-</p><p class="text-xs text-slate-400">kg PO4-eq/t CPO</p></div>
        </div>
      </aside>
    </section>

    <section id="view-dash" class="hidden space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white border border-slate-200 rounded-xl p-6"><h3 class="text-base font-bold mb-4">Kontribusi Emisi GWP per Tahapan (kg CO2-eq/ton CPO)</h3><canvas id="stageChart" height="220"></canvas></div>
        <div class="bg-white border border-slate-200 rounded-xl p-6"><h3 class="text-base font-bold mb-4">Komposisi Gas Rumah Kaca (CO2, CH4, N2O)</h3><canvas id="ghgChart" height="220"></canvas></div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl p-6 overflow-x-auto">
        <h3 class="text-base font-bold mb-4">Tabel Breakdown Tahapan Daur Hidup (Cradle-to-Gate)</h3>
        <table class="w-full text-sm text-left"><thead class="border-b border-slate-200 text-xs text-slate-500"><tr><th class="py-2">Tahapan</th><th class="py-2 text-right">GWP (kg CO2-eq/t CPO)</th><th class="py-2 text-right">Porsi (%)</th><th class="py-2 text-right">AP (kg SO2-eq/t CPO)</th><th class="py-2 text-right">EP (kg PO4-eq/t CPO)</th></tr></thead><tbody id="stageTableBody" class="divide-y divide-slate-100 font-mono"></tbody></table>
      </div>
    </section>

    <section id="view-report" class="hidden bg-white border border-slate-200 rounded-xl p-8 space-y-6">
      <div id="properReportContent"></div>
    </section>
  </main>

  <script type="module">
    const INITIAL = ${initialJson};
    const state = { ...INITIAL.params };
    const meta = { ...INITIAL.meta };
    let stageChart = null, ghgChart = null, lastRes = null;

    function solveLinear(A, f) {
      const n = A.length;
      const M = A.map((r, i) => [...r, f[i]]);
      for (let c = 0; c < n; c++) {
        let p = c;
        for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
        [M[c], M[p]] = [M[p], M[c]];
        const pv = M[c][c];
        for (let k = c; k <= n; k++) M[c][k] /= pv;
        for (let r = 0; r < n; r++) {
          if (r === c) continue;
          const fac = M[r][c];
          for (let k = c; k <= n; k++) M[r][k] -= fac * M[c][k];
        }
      }
      return M.map(r => r[n]);
    }

    function compute() {
      const oer = Math.max(0.01, state.oerPercent / 100);
      const ker = Math.max(0.005, state.kerPercent / 100);
      const y = Math.max(1, state.ffbYieldTonHaYear);
      const ffbPerCpo = 1 / oer;
      const allocCpo = state.allocationMethod === 'energy'
        ? (oer * 37) / (oer * 37 + ker * 18.5)
        : state.allocationMethod === 'economic'
        ? (oer * state.priceCpoIdrKg) / (oer * state.priceCpoIdrKg + ker * state.pricePkIdrKg)
        : oer / (oer + ker);
      const allocPk = 1 - allocCpo;

      const urea = state.ureaKgHaYear / y, sp36 = state.sp36KgHaYear / y, kcl = state.kclKgHaYear / y, dol = state.dolomitKgHaYear / y, herb = state.herbicideKgHaYear / y;
      const dField = state.fieldDieselLHaYear / y, dTrans = state.transportDistanceKm * 0.075, dMill = state.millDieselLPerTonFfb;
      const dTot = dField + dTrans + dMill;

      const nKg = urea * 0.46;
      const n2oField = nKg * (0.01 + 0.1 * 0.01 + 0.3 * 0.0075) * (44 / 28);
      const nh3Field = nKg * 0.1 * (17 / 14);
      const no3Field = nKg * 0.3 * (62 / 14);
      const po4Field = sp36 * 0.36 * 0.4364 * 0.025 * 3.0662;

      const pomeV = state.pomeVolumeM3PerTonFfb;
      const codKgM3 = (state.pomeCodMgL / 1000) * (state.efbTreatment === 'composting' ? 0.88 : 1);
      const cap = state.pomeTreatment === 'open_lagoon' ? 0 : state.pomeTreatment === 'methane_capture_flare' ? 0.85 : 0.90;
      const ch4PomeM3 = codKgM3 * 0.85 * 0.25 * 0.8 * (1 - cap);
      const peatF = state.enablePeat ? (state.peatPercent / 100) : 0;

      const A = [
        [1, -1, 0, 0, 0, 0],
        [0, -1, 1, 0, 0, 0],
        [0,  1, 0,-1, 0, 0],
        [0,  0, 0, 1,-1, 0],
        [0,  0, 0, 0,-pomeV, 1],
        [0,  0, 0, 0, 1, 0],
      ];
      const s = solveLinear(A, [0, 0, 0, 0, 0, ffbPerCpo]);
      const efbCh4 = 0.22 * (state.efbTreatment === 'mulching' ? 0.12 : state.efbTreatment === 'composting' ? 0.35 : 4.2);
      const efbN2o = 0.22 * (state.efbTreatment === 'mulching' ? 0.015 : state.efbTreatment === 'composting' ? 0.045 : 0.025);

      const stages = [
        { name: 'Hulu Agrokimia & Solar WTT', co2: urea*1.62+sp36*0.68+kcl*0.35+dol*0.032+herb*10.97+dTot*0.51, luc: 0, ch4b: 0, ch4f: urea*0.0042+sp36*0.0018+kcl*0.0008+herb*0.025+dTot*0.0032, n2o: urea*0.0001, so2: urea*0.0055+sp36*0.011+kcl*0.0014+dol*0.0002+herb*0.048+dTot*0.0028, nox: urea*0.0038+sp36*0.0025+kcl*0.0012+dol*0.0003+herb*0.032+dTot*0.0016, nh3: 0, no3: 0, po4: sp36*0.0015+herb*0.015, cod: 0 },
        { name: 'Perkebunan (Pupuk & Alat Berat)', co2: urea*0.7333+dol*0.4767+dField*2.68, luc: 0, ch4b: 0, ch4f: dField*0.00036, n2o: n2oField+dField*0.00014, so2: dField*0.0034, nox: dField*0.0285, nh3: nh3Field, no3: no3Field, po4: po4Field, cod: 0 },
        { name: 'LUC & Drainase Gambut', co2: 0, luc: (peatF*40333)/y, ch4b: (peatF*45)/y, ch4f: 0, n2o: (peatF*1.89)/y, so2: 0, nox: 0, nh3: 0, no3: 0, po4: 0, cod: 0 },
        { name: 'Transportasi TBS ke PKS', co2: dTrans*2.68, luc: 0, ch4b: 0, ch4f: dTrans*0.00036, n2o: dTrans*0.00014, so2: dTrans*0.0034, nox: dTrans*0.0285, nh3: 0, no3: 0, po4: 0, cod: 0 },
        { name: 'PKS Inti (Boiler, Genset & EFB)', co2: dMill*2.68, luc: 0, ch4b: 0.95*0.042+efbCh4, ch4f: dMill*0.00036, n2o: 0.95*0.0056+dMill*0.00014+efbN2o, so2: 0.95*0.045+dMill*0.0034, nox: 0.95*0.38+dMill*0.0285, nh3: 0, no3: 0, po4: 0, cod: 0 },
        { name: 'IPAL PKS (Limbah Cair POME)', co2: 0, luc: 0, ch4b: ch4PomeM3, ch4f: 0, n2o: 0, so2: 0, nox: 0, nh3: 0, no3: 0, po4: 0.045*0.35, cod: codKgM3*0.15*0.35 },
      ].map((st, j) => {
        const sc = s[j] * allocCpo;
        return {
          name: st.name,
          gwp: (st.co2 + st.luc + st.ch4b*27 + st.ch4f*29.8 + st.n2o*273) * sc,
          ap: (st.so2*1 + st.nox*0.7 + st.nh3*1.88) * sc,
          ep: (st.po4*1 + st.no3*0.1 + st.nh3*0.35 + st.nox*0.13 + st.cod*0.022) * sc,
          co2F: st.co2 * sc,
          co2L: st.luc * sc,
          ch4: (st.ch4b*27 + st.ch4f*29.8) * sc,
          n2o: st.n2o * 273 * sc,
        };
      });

      const gwpCpo = stages.reduce((a, b) => a + b.gwp, 0);
      const pkFactor = (oer / ker) * (allocPk / allocCpo);
      const apCpo = stages.reduce((a, b) => a + b.ap, 0);
      const epCpo = stages.reduce((a, b) => a + b.ep, 0);
      lastRes = { stages, gwpCpo, gwpPk: gwpCpo * pkFactor, apCpo, epCpo, allocCpo, allocPk, s };
      render();
    }

    function render() {
      const r = lastRes;
      document.getElementById('kpiGwpCpo').textContent = r.gwpCpo.toFixed(1);
      document.getElementById('kpiGwpPk').textContent = r.gwpPk.toFixed(1);
      document.getElementById('kpiAlloc').textContent = (r.allocCpo*100).toFixed(1) + '% / ' + (r.allocPk*100).toFixed(1) + '%';
      document.getElementById('kpiAp').textContent = r.apCpo.toFixed(2);
      document.getElementById('kpiEp').textContent = r.epCpo.toFixed(2);

      document.getElementById('stageTableBody').innerHTML = r.stages.map(st => \`
        <tr><td class="py-2.5 font-sans font-medium text-slate-800">\${st.name}</td>
        <td class="py-2.5 text-right">\${st.gwp.toFixed(2)}</td>
        <td class="py-2.5 text-right">\${(r.gwpCpo > 0 ? st.gwp/r.gwpCpo*100 : 0).toFixed(1)}%</td>
        <td class="py-2.5 text-right">\${st.ap.toFixed(3)}</td>
        <td class="py-2.5 text-right">\${st.ep.toFixed(3)}</td></tr>\`).join('');

      const top = [...r.stages].sort((a,b) => b.gwp - a.gwp)[0];
      document.getElementById('properReportContent').innerHTML = \`
        <div class="border-b border-slate-200 pb-4">
          <p class="text-xs font-semibold text-teal-700">LAPORAN PENILAIAN DAUR HIDUP (LCA) — PEDOMAN PROPER KLHK 2021</p>
          <h2 class="text-2xl font-bold mt-1">\${meta.companyName} — \${meta.millName}</h2>
          <p class="text-sm text-slate-600 mt-1">Periode: \${meta.studyPeriod} · Batasan Sistem: Cradle-to-Gate · Standar: SNI ISO 14040:2016 &amp; SNI ISO 14044:2017</p>
        </div>
        <div class="grid grid-cols-3 gap-4 py-4">
          <div class="p-4 bg-slate-50 rounded-lg border border-slate-200"><p class="text-xs text-slate-500">GWP 100a (IPCC AR6)</p><p class="text-xl font-bold font-mono">\${r.gwpCpo.toFixed(1)} kg CO2-eq/t CPO</p></div>
          <div class="p-4 bg-slate-50 rounded-lg border border-slate-200"><p class="text-xs text-slate-500">Acidification (CML-IA)</p><p class="text-xl font-bold font-mono">\${r.apCpo.toFixed(2)} kg SO2-eq/t CPO</p></div>
          <div class="p-4 bg-slate-50 rounded-lg border border-slate-200"><p class="text-xs text-slate-500">Eutrophication (CML-IA)</p><p class="text-xl font-bold font-mono">\${r.epCpo.toFixed(2)} kg PO4-eq/t CPO</p></div>
        </div>
        <p class="text-sm text-slate-700 leading-relaxed"><strong>Pernyataan Wajib (Bab 2.1.3 &amp; 5.6 PROPER KLHK 2021):</strong> Kajian ini tidak ditujukan sebagai pernyataan komparatif untuk disampaikan kepada masyarakat. Hasil LCIA merupakan ekspresi relatif dan tidak memprediksi dampak pada kategori endpoint, terlampauinya nilai ambang, batas keselamatan, atau risiko.</p>
        <p class="text-sm text-slate-700 leading-relaxed"><strong>Hotspot Utama:</strong> Tahap <strong>\${top.name}</strong> berkontribusi sebesar <strong>\${(top.gwp/r.gwpCpo*100).toFixed(1)}%</strong> (\${top.gwp.toFixed(1)} kg CO2-eq/ton CPO) terhadap total GWP 100a.</p>
      \`;

      if (window.Chart) {
        const ctx1 = document.getElementById('stageChart');
        if (stageChart) stageChart.destroy();
        stageChart = new Chart(ctx1, {
          type: 'bar',
          data: { labels: r.stages.map(s => s.name), datasets: [{ label: 'kg CO2-eq / ton CPO', data: r.stages.map(s => Number(s.gwp.toFixed(2))), backgroundColor: '#0f766e', borderRadius: 4 }] },
          options: { indexAxis: 'y', plugins: { legend: { display: false } } }
        });
        const ctx2 = document.getElementById('ghgChart');
        if (ghgChart) ghgChart.destroy();
        ghgChart = new Chart(ctx2, {
          type: 'doughnut',
          data: {
            labels: ['CO2 Fosil', 'CO2 LUC/Gambut', 'Metana (CH4)', 'Dinitrogen Oksida (N2O)'],
            datasets: [{ data: [r.stages.reduce((a,b)=>a+b.co2F,0), r.stages.reduce((a,b)=>a+b.co2L,0), r.stages.reduce((a,b)=>a+b.ch4,0), r.stages.reduce((a,b)=>a+b.n2o,0)].map(v=>Number(v.toFixed(2))), backgroundColor: ['#0f766e','#dc2626','#d97706','#2563eb'] }]
          }
        });
      }
    }

    Object.keys(state).forEach(k => {
      const el = document.getElementById(k);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = Boolean(state[k]);
      else el.value = state[k];
      el.addEventListener('input', () => {
        state[k] = el.type === 'checkbox' ? el.checked : (el.tagName === 'SELECT' ? el.value : parseFloat(el.value) || 0);
        compute();
      });
    });

    document.querySelectorAll('.step-btn').forEach(btn => btn.addEventListener('click', () => {
      const st = btn.dataset.step;
      document.querySelectorAll('.step-panel').forEach(p => p.classList.add('hidden'));
      document.getElementById('step-' + st).classList.remove('hidden');
      document.querySelectorAll('.step-btn').forEach(b => { b.className = 'step-btn px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-700'; });
      btn.className = 'step-btn px-4 py-2 text-sm font-semibold rounded-lg bg-teal-700 text-white';
    }));

    document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => {
      const v = btn.dataset.nav;
      ['calc','dash','report'].forEach(id => document.getElementById('view-' + id).classList.toggle('hidden', id !== v));
      document.querySelectorAll('.nav-btn').forEach(b => { b.className = b === btn ? 'nav-btn text-teal-700 font-semibold whitespace-nowrap' : 'nav-btn text-slate-600 hover:text-slate-900 whitespace-nowrap'; });
      if (v === 'dash') render();
    }));

    document.getElementById('btnExportJson').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify({ meta, params: state, result: lastRes }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sawitlca-standalone-result.json'; a.click();
    });

    compute();
  </script>
</body>
</html>`;

  triggerDownload('sawitlca-standalone-index.html', html, 'text/html;charset=utf-8');
}
