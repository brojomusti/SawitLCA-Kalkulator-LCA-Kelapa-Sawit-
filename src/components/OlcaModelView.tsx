import React, { useState } from 'react';
import { EMISSION_FACTORS, OLCA_FLOWS, getImpactCategories } from '../lca/olcaData';
import { LcaInputParams, LcaResult } from '../lca/types';

interface OlcaModelViewProps {
  params: LcaInputParams;
  result: LcaResult;
}

const fmt = (n: number, dec = 3) =>
  n.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec });

export const OlcaModelView: React.FC<OlcaModelViewProps> = ({ params, result }) => {
  const [subTab, setSubTab] = useState<'matrix' | 'schema' | 'formulas'>('matrix');
  const [selectedProcessId, setSelectedProcessId] = useState<string>(result.processes[0]?.['@id'] || '');
  const impactCategories = getImpactCategories(params.gwpStandard);

  const selectedProcess =
    result.processes.find((p) => p['@id'] === selectedProcessId) || result.processes[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-teal-700">
            Arsitektur Data openLCA (olca-schema) · Penyelesaian Matriks Linear ISO 14044
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Model Matriks, Skema JSON openLCA &amp; Rumus Matematis
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start md:self-auto">
          {[
            { id: 'matrix' as const, label: 'Matriks A · s = f' },
            { id: 'schema' as const, label: 'Skema openLCA' },
            { id: 'formulas' as const, label: 'Rumus & Faktor Emisi' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                subTab === t.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {subTab === 'matrix' && (
        <div className="space-y-6">
          {/* Algorithm Explanation */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900">
              Cara Kerja Algoritma Matriks Linear &amp; Alokasi Co-Product
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="font-mono font-semibold text-teal-800">1. Sistem Linear A · s = f</p>
                <p className="mt-1.5">
                  Matriks teknosfer <strong>A</strong> (6×6) menghubungkan aliran produk antar unit
                  proses (input bernilai negatif, output positif). Vektor permintaan <strong>f</strong>{' '}
                  meminta <span className="font-mono">{fmt(result.ffbRequiredPerTonCpo, 3)}</span> ton
                  TBS terolah untuk 1 ton CPO. Eliminasi Gauss dengan <em>partial pivoting</em>{' '}
                  menyelesaikan vektor skala <strong>s = A⁻¹·f</strong>.
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="font-mono font-semibold text-teal-800">2. Inventori LCI g = B · s</p>
                <p className="mt-1.5">
                  Matriks intervensi (biosfer) <strong>B</strong> (12×6) memuat intensitas emisi per
                  unit referensi tiap proses. Perkalian <strong>g = B·s</strong> menghasilkan total
                  aliran dasar gabungan sebelum alokasi.
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="font-mono font-semibold text-teal-800">3. Alokasi CPO &amp; PK</p>
                <p className="mt-1.5">
                  Karena 1 ton TBS menghasilkan CPO ({params.oerPercent}%) dan PK ({params.kerPercent}
                  %) secara simultan, inventori dibagi memakai faktor alokasi{' '}
                  <strong>α_CPO = {fmt(result.allocationCpo * 100, 2)}%</strong> dan{' '}
                  <strong>α_PK = {fmt(result.allocationPk * 100, 2)}%</strong> sehingga neraca beban
                  terjaga penuh (OER·I_CPO + KER·I_PK = I_TBS).
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="font-mono font-semibold text-teal-800">4. Karakterisasi h = C · g</p>
                <p className="mt-1.5">
                  Matriks faktor karakterisasi <strong>C</strong> (IPCC {params.gwpStandard} GWP100a
                  &amp; CML-IA Baseline) mengonversi setiap aliran dasar menjadi skor dampak{' '}
                  <strong>GWP</strong>, <strong>AP</strong>, dan <strong>EP</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Live Technosphere Matrix A + f + s */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">
                Matriks Teknosfer A (6×6), Vektor Permintaan f, dan Solusi Vektor Skala s
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nilai diperbarui real-time setiap kali parameter OER atau debit POME diubah
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-3 px-4">Aliran Teknosfer (Baris)</th>
                    <th className="py-3 px-3 text-right font-mono">P1</th>
                    <th className="py-3 px-3 text-right font-mono">P2</th>
                    <th className="py-3 px-3 text-right font-mono">P3</th>
                    <th className="py-3 px-3 text-right font-mono">P4</th>
                    <th className="py-3 px-3 text-right font-mono">P5</th>
                    <th className="py-3 px-3 text-right font-mono">P6</th>
                    <th className="py-3 px-4 text-right font-mono bg-slate-100 text-slate-800">
                      f (Permintaan)
                    </th>
                    <th className="py-3 px-4 text-right font-mono bg-teal-50 text-teal-900">
                      s = A⁻¹·f (Skala)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                  {result.matrix.technosphereFlows.map((flowName, r) => (
                    <tr key={flowName} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-800">
                        {flowName}
                      </td>
                      {result.matrix.A[r].map((val, c) => (
                        <td
                          key={c}
                          className={`py-2.5 px-3 text-right ${
                            val > 0
                              ? 'text-teal-800 font-semibold'
                              : val < 0
                              ? 'text-amber-700 font-semibold'
                              : 'text-slate-300'
                          }`}
                        >
                          {val === 0 ? '0' : val.toFixed(2)}
                        </td>
                      ))}
                      <td className="py-2.5 px-4 text-right bg-slate-50/80 text-slate-900 font-semibold">
                        {result.matrix.f[r].toFixed(3)}
                      </td>
                      <td className="py-2.5 px-4 text-right bg-teal-50/60 text-teal-900 font-bold">
                        {result.matrix.s[r].toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subTab === 'schema' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Process Selector & Exchanges */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Proses &amp; Pertukaran (openLCA Process Exchanges)
                </h2>
                <p className="text-xs text-slate-500">
                  Pilih unit proses untuk memeriksa input, output, kualitas data, dan referensi dataset
                </p>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1.5">
              {result.processes.map((proc) => (
                <button
                  key={proc['@id']}
                  type="button"
                  onClick={() => setSelectedProcessId(proc['@id'])}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    selectedProcess['@id'] === proc['@id']
                      ? 'bg-teal-700 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-teal-700'
                  }`}
                >
                  {proc.code}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-mono text-slate-400">
                  @id: {selectedProcess['@id']} · Ref: {selectedProcess.quantitativeReference}
                </p>
                <h3 className="text-base font-semibold text-slate-900 mt-1">
                  {selectedProcess.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1">{selectedProcess.description}</p>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3">Arah</th>
                      <th className="py-2.5 px-3">Aliran (Flow)</th>
                      <th className="py-2.5 px-3 text-right">Jumlah</th>
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">Referensi Dataset</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedProcess.exchanges.map((ex, idx) => (
                      <tr key={`${ex.flowId}-${idx}`}>
                        <td className="py-2 px-3 font-medium text-slate-700">
                          {ex.isInput ? 'Input' : 'Output'}
                        </td>
                        <td className="py-2 px-3 text-slate-900 font-medium">{ex.flowName}</td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-900">
                          {fmt(ex.amount, 4)} {ex.unit}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{ex.dataQuality}</td>
                        <td className="py-2 px-3 text-slate-500">{ex.datasetRef}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: openLCA Flows JSON Catalog */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">
                Katalog Flow JSON (olca-schema)
              </h2>
              <p className="text-xs text-slate-500">
                {OLCA_FLOWS.length} objek aliran (12 Elementary Flows &amp; 6 Product/Waste Flows)
              </p>
            </div>
            <div className="p-4 bg-slate-950 text-slate-100 font-mono text-xs overflow-auto max-h-[540px] leading-relaxed">
              <pre>{JSON.stringify(OLCA_FLOWS, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {subTab === 'formulas' && (
        <div className="space-y-6">
          {/* Mathematical Equations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                1. Konversi Emisi Pupuk Nitrogen (Urea) ke N2O &amp; CO2 (IPCC 2006 Vol. 4 Ch. 11)
              </h3>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 space-y-1.5">
                <div>F_SN = M_urea × 0,46 (kg N)</div>
                <div>N2O_langsung = F_SN × EF1 (0,01) × (44 / 28)</div>
                <div>N2O_volatilisasi = F_SN × Frac_GASF (0,10) × EF4 (0,01) × (44 / 28)</div>
                <div>N2O_pencucian = F_SN × Frac_LEACH (0,30) × EF5 (0,0075) × (44 / 28)</div>
                <div>CO2_hidrolisis_urea = M_urea × 0,20 × (44 / 12) = 0,7333 × M_urea</div>
                <div>CO2_dolomit = M_dolomit × 0,13 × (44 / 12) = 0,4767 × M_dolomit</div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Selain GRK, volatilisasi NH3 (F_SN × 0,10 × 17/14) berkontribusi ke Acidification
                dan Eutrophication, sedangkan pencucian NO3⁻ (F_SN × 0,30 × 62/14) serta limpasan
                PO4³⁻ dari SP-36 berkontribusi ke Eutrophication.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                2. Konversi Beban COD POME ke Emisi Metana CH4 (IPCC 2006 Vol. 5 Ch. 6)
              </h3>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 space-y-1.5">
                <div>CH4_terbentuk = V_POME × COD_in × η_COD × B_o × MCF</div>
                <div>CH4_emisi = CH4_terbentuk × (1 − η_capture)</div>
                <div>B_o = 0,25 kg CH4 / kg COD · MCF = 0,80 (kolam anaerobik dalam)</div>
                <div>η_capture = 0% (Open Lagoon) | 85% (Flaring) | 90% (PLTBg)</div>
                <div>CO2_bio_biogas = CH4_tertangkap × (44 / 16) [GWP = 0]</div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Residu COD pasca penyisihan anaerobik yang dilepas ke perairan (atau direduksi
                melalui <em>land application</em>) dikarakterisasi ke Eutrophication Potential
                (faktor 0,022 kg PO4-eq / kg COD).
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                3. Alokasi Co-Product CPO &amp; Palm Kernel (ISO 14044 §4.3.4)
              </h3>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 space-y-1.5">
                <div>Alokasi Energi: α_CPO = (OER × LHV_CPO) / (OER × LHV_CPO + KER × LHV_PK)</div>
                <div>Alokasi Ekonomi: α_CPO = (OER × P_CPO) / (OER × P_CPO + KER × P_PK)</div>
                <div>Dampak per 1 ton CPO: I_CPO = α_CPO × (I_TBS / OER)</div>
                <div>Dampak per 1 ton PK:  I_PK  = (1 − α_CPO) × (I_TBS / KER)</div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Default LHV mengacu pada standar BioGrace / EU RED II: CPO = 37,0 MJ/kg dan PK =
                18,5 MJ/kg. Seluruh metode alokasi menjamin konservasi beban total per ton TBS.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                4. Drainase Lahan Gambut &amp; Solar WTW (IPCC Wetlands 2013 &amp; BioGrace)
              </h3>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 space-y-1.5">
                <div>Gambut CO2 = 40.333 kg CO2/ha/thn (11 t C/ha/thn × 44/12)</div>
                <div>Gambut CH4 parit = 45 kg CH4/ha/thn · N2O = 1,89 kg N2O/ha/thn</div>
                <div>Solar WTT (kilang) = 0,51 kg CO2/L · TTW (bakar) = 2,68 kg CO2/L</div>
                <div>Total Solar WTW ≈ 3,25 kg CO2-eq / liter solar</div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Faktor emisi hulu pupuk mengacu pada Ecoinvent 3.8 (Urea: {EMISSION_FACTORS.ureaProduction.co2Fossil}{' '}
                kg CO2/kg; SP-36: {EMISSION_FACTORS.sp36Production.co2Fossil}; KCl:{' '}
                {EMISSION_FACTORS.kclProduction.co2Fossil}; Herbisida:{' '}
                {EMISSION_FACTORS.herbicideProduction.co2Fossil} kg CO2/kg a.i.).
              </p>
            </div>
          </div>

          {/* Characterization Factors Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">
                Matriks Faktor Karakterisasi LCIA (Matrix C) — Aktif: IPCC {params.gwpStandard} &amp; CML-IA Baseline
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-3 px-4">Kategori Dampak</th>
                    <th className="py-3 px-4">Aliran Dasar (Elementary Flow)</th>
                    <th className="py-3 px-4 text-right">Faktor Karakterisasi</th>
                    <th className="py-3 px-4">Satuan</th>
                    <th className="py-3 px-4">Sumber Metode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {impactCategories.flatMap((ic) =>
                    ic.factors.map((fac) => {
                      const fl = OLCA_FLOWS.find((x) => x['@id'] === fac.flowId);
                      return (
                        <tr key={`${ic.code}-${fac.flowId}`}>
                          <td className="py-2.5 px-4 font-semibold text-slate-800">{ic.name}</td>
                          <td className="py-2.5 px-4 text-slate-700">{fl?.name || fac.flowId}</td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-teal-800">
                            {fac.value}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-500">{fac.unit}</td>
                          <td className="py-2.5 px-4 text-slate-500">{fac.source}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
