import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { Download } from 'lucide-react';
import { Compartment, LcaInputParams, LcaResult } from '../lca/types';

interface DashboardViewProps {
  params: LcaInputParams;
  result: LcaResult;
  onExportJson: () => void;
  onExportCsv: () => void;
}

const fmt = (n: number, dec = 2) =>
  n.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec });

export const DashboardView: React.FC<DashboardViewProps> = ({
  params,
  result,
  onExportJson,
  onExportCsv,
}) => {
  const [compartmentFilter, setCompartmentFilter] = useState<'all' | Compartment>('all');
  const stageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ghgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sensCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const charts: Chart[] = [];

    // Chart 1: Stage Contribution Bar Chart
    if (stageCanvasRef.current) {
      const ch = new Chart(stageCanvasRef.current, {
        type: 'bar',
        data: {
          labels: result.stageBreakdown.map((s) => `${s.stageId}: ${s.stageName.split('—')[0].trim()}`),
          datasets: [
            {
              label: 'CPO (kg CO2-eq / ton CPO)',
              data: result.stageBreakdown.map((s) => Number(s.gwpPerTonCpo.toFixed(2))),
              backgroundColor: result.stageBreakdown.map((s) =>
                s.lifecyclePhase === 'Upstream (Hulu)' ? '#0f766e' : '#d97706'
              ),
              borderRadius: 4,
              barThickness: 22,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `${fmt(Number(ctx.raw), 1)} kg CO2-eq / ton CPO`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: '#f1f5f9' },
              ticks: { font: { family: 'IBM Plex Mono', size: 11 }, color: '#475569' },
              title: {
                display: true,
                text: 'kg CO2-eq per ton CPO',
                color: '#64748b',
                font: { size: 11 },
              },
            },
            y: {
              grid: { display: false },
              ticks: { font: { family: 'DM Sans', size: 12 }, color: '#1e293b' },
            },
          },
        },
      });
      charts.push(ch);
    }

    // Chart 2: GHG Gas Breakdown Doughnut
    if (ghgCanvasRef.current) {
      const gb = result.ghgBreakdown;
      const items = [
        { label: 'CO2 Fosil (Pupuk, Solar, Urea/Dolomit)', val: gb.co2Fossil, color: '#0f766e' },
        { label: 'CO2 LUC & Drainase Gambut', val: gb.co2LucPeat, color: '#dc2626' },
        { label: 'Metana Biogenik (CH4 — POME/EFB/Gambut)', val: gb.ch4Biogenic, color: '#d97706' },
        { label: 'Metana Fosil (CH4 — Hulu)', val: gb.ch4Fossil, color: '#64748b' },
        { label: 'Dinitrogen Oksida (N2O)', val: gb.n2o, color: '#2563eb' },
      ].filter((x) => x.val > 0.05);

      const ch = new Chart(ghgCanvasRef.current, {
        type: 'doughnut',
        data: {
          labels: items.map((x) => x.label),
          datasets: [
            {
              data: items.map((x) => Number(x.val.toFixed(2))),
              backgroundColor: items.map((x) => x.color),
              borderWidth: 2,
              borderColor: '#ffffff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '58%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                padding: 12,
                font: { family: 'DM Sans', size: 11 },
                color: '#334155',
              },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const v = Number(ctx.raw);
                  const pct = result.gwpCpo > 0 ? (v / result.gwpCpo) * 100 : 0;
                  return ` ${fmt(v, 1)} kg CO2-eq (${fmt(pct, 1)}%)`;
                },
              },
            },
          },
        },
      });
      charts.push(ch);
    }

    // Chart 3: Sensitivity Comparison (Allocation & POME Mitigation)
    if (sensCanvasRef.current && result.sensitivity.length > 0) {
      const ch = new Chart(sensCanvasRef.current, {
        type: 'bar',
        data: {
          labels: result.sensitivity.map((s) => s.label),
          datasets: [
            {
              label: 'GWP CPO (kg CO2-eq/t CPO)',
              data: result.sensitivity.map((s) => Number(s.gwpCpo.toFixed(1))),
              backgroundColor: result.sensitivity.map((s) =>
                s.group === 'Alokasi' ? '#2563eb' : '#0f766e'
              ),
              borderRadius: 4,
              maxBarThickness: 38,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `${fmt(Number(ctx.raw), 1)} kg CO2-eq / ton CPO`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: '#f1f5f9' },
              ticks: { font: { family: 'IBM Plex Mono', size: 11 }, color: '#475569' },
            },
            x: {
              grid: { display: false },
              ticks: { font: { family: 'DM Sans', size: 11 }, color: '#334155' },
            },
          },
        },
      });
      charts.push(ch);
    }

    return () => {
      charts.forEach((c) => c.destroy());
    };
  }, [result]);

  const filteredInventory = result.inventoryRows.filter((r) =>
    compartmentFilter === 'all' ? true : r.compartment === compartmentFilter
  );

  return (
    <div className="space-y-8">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-teal-700">
            Dashboard Analisis Dampak Daur Hidup (LCIA) · Alokasi{' '}
            {params.allocationMethod === 'energy'
              ? 'Energi (LHV)'
              : params.allocationMethod === 'economic'
              ? 'Ekonomi'
              : 'Massa'}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Profil Emisi &amp; Kontribusi Tahapan Cradle-to-Gate
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh CSV (LCI &amp; LCIA)
          </button>
          <button
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh JSON (openLCA)
          </button>
        </div>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Global Warming Potential — CPO</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {fmt(result.gwpCpo, 1)}
            </span>
            <span className="text-xs font-mono text-slate-400">kg CO2-eq/t</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            IPCC {params.gwpStandard} · Porsi alokasi {fmt(result.allocationCpo * 100, 1)}%
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Global Warming Potential — PK</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {fmt(result.gwpPk, 1)}
            </span>
            <span className="text-xs font-mono text-slate-400">kg CO2-eq/t</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Co-product Palm Kernel · Porsi alokasi {fmt(result.allocationPk * 100, 1)}%
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Acidification Potential (AP)</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {fmt(result.apCpo, 2)}
            </span>
            <span className="text-xs font-mono text-slate-400">kg SO2-eq/t CPO</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            PK: <span className="font-mono">{fmt(result.apPk, 2)}</span> kg SO2-eq/t · CML-IA
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Eutrophication Potential (EP)</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {fmt(result.epCpo, 2)}
            </span>
            <span className="text-xs font-mono text-slate-400">kg PO4-eq/t CPO</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            PK: <span className="font-mono">{fmt(result.epPk, 2)}</span> kg PO4-eq/t · CML-IA
          </p>
        </div>
      </div>

      {/* Primary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-baseline justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Kontribusi Emisi GWP 100a per Tahapan Proses
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Teal: Upstream (Hulu Kebun &amp; Transportasi) · Amber: Core (PKS &amp; IPAL POME)
              </p>
            </div>
          </div>
          <div className="h-72 relative">
            <canvas ref={stageCanvasRef} />
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Komposisi Gas Rumah Kaca (GWP 100a)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              CO2 biogenik ({fmt(result.ghgBreakdown.co2BiogenicMemo, 0)} kg/t CPO) dicatat terpisah (GWP = 0)
            </p>
          </div>
          <div className="h-72 relative">
            <canvas ref={ghgCanvasRef} />
          </div>
        </div>
      </div>

      {/* Process Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Tabel Kontribusi Dampak per Tahapan Daur Hidup (Per 1 ton CPO &amp; 1 ton PK)
            </h2>
            <p className="text-xs text-slate-500">
              Selaras dengan Tabel 12 &amp; Tabel 13 Pedoman Penyusunan Laporan LCA PROPER KLHK 2021
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <tr>
                <th className="py-3 px-4">Tahapan Proses</th>
                <th className="py-3 px-4">Fase</th>
                <th className="py-3 px-4 text-right">GWP CPO (kg CO2-eq)</th>
                <th className="py-3 px-4 text-right">Porsi GWP</th>
                <th className="py-3 px-4 text-right">GWP PK (kg CO2-eq)</th>
                <th className="py-3 px-4 text-right">AP CPO (kg SO2-eq)</th>
                <th className="py-3 px-4 text-right">EP CPO (kg PO4-eq)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.stageBreakdown.map((st) => (
                <tr key={st.stageId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <span className="font-mono text-xs text-slate-400 mr-2">{st.stageId}</span>
                    {st.stageName}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                    {st.lifecyclePhase}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                    {fmt(st.gwpPerTonCpo, 2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    {fmt(st.gwpSharePercent, 1)}%
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    {fmt(st.gwpPerTonPk, 2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    {fmt(st.apPerTonCpo, 3)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    {fmt(st.epPerTonCpo, 3)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-900">
              <tr>
                <td className="py-3 px-4" colSpan={2}>
                  Total Dampak Cradle-to-Gate
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums">
                  {fmt(result.gwpCpo, 2)}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums">100,0%</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums">
                  {fmt(result.gwpPk, 2)}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums">
                  {fmt(result.apCpo, 3)}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums">
                  {fmt(result.epCpo, 3)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Sensitivity Analysis Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Analisis Sensitivitas: Metode Alokasi &amp; Skenario Mitigasi POME
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Biru: variasi metode alokasi co-product CPO/PK · Teal: variasi teknologi penanganan limbah POME (Bab 6.2 PROPER)
            </p>
          </div>
        </div>
        <div className="h-64 relative">
          <canvas ref={sensCanvasRef} />
        </div>
      </div>

      {/* Elementary Flow Inventory (LCI) Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Inventori Aliran Dasar (Life Cycle Inventory — Elementary Flows)
            </h2>
            <p className="text-xs text-slate-500">
              Akumulasi matriks intervensi g = B · s teralokasi per 1 ton CPO dan total produksi tahunan
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
            {[
              { id: 'all' as const, label: 'Semua' },
              { id: 'air' as const, label: 'Emisi ke Udara' },
              { id: 'water' as const, label: 'Emisi ke Air' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCompartmentFilter(f.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  compartmentFilter === f.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <tr>
                <th className="py-3 px-4">Aliran Dasar (Elementary Flow)</th>
                <th className="py-3 px-4">Kompartemen</th>
                <th className="py-3 px-4 text-right">Per ton TBS</th>
                <th className="py-3 px-4 text-right">Per ton CPO</th>
                <th className="py-3 px-4 text-right">Total Tahunan</th>
                <th className="py-3 px-4 text-right">Kontribusi GWP (kg CO2-eq)</th>
                <th className="py-3 px-4">Proses Dominan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map((row) => (
                <tr key={row.flowId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-slate-900">
                    {row.name}
                    <span className="ml-2 text-xs font-mono text-slate-400">({row.unit})</span>
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-600 capitalize">
                    {row.compartment === 'air' ? 'Udara' : 'Air'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                    {fmt(row.amountPerTonFfb, 4)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900 font-medium">
                    {fmt(row.amountPerTonCpo, 4)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                    {fmt(row.amountAnnualTotal, 1)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900">
                    {fmt(row.gwpContributionCpo, 2)}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">{row.dominantStage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
