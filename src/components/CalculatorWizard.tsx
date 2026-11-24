import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, RotateCcw } from 'lucide-react';
import { FIELD_GUIDES, GuideFieldKey } from '../lca/fieldGuides';
import { SCENARIO_PRESETS } from '../lca/olcaData';
import { loadSavedWizardStep, saveWizardStep } from '../lca/storage';
import {
  AllocationMethod,
  EfbTreatment,
  GwpStandard,
  LcaInputParams,
  LcaResult,
  PomeTreatment,
  PreviousLandUse,
} from '../lca/types';
import { FieldGuideTooltip } from './FieldGuideTooltip';
import { InputGuideModal } from './InputGuideModal';

interface CalculatorWizardProps {
  params: LcaInputParams;
  result: LcaResult;
  lastSavedAt: Date | null;
  restoredFromStorage: boolean;
  onChange: (next: LcaInputParams) => void;
  onReset: () => void;
  onNavigate: (tab: 'dashboard' | 'proper') => void;
}

const fmt = (n: number, dec = 1) =>
  n.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec });

export const CalculatorWizard: React.FC<CalculatorWizardProps> = ({
  params,
  result,
  lastSavedAt,
  restoredFromStorage,
  onChange,
  onReset,
  onNavigate,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(() => loadSavedWizardStep());
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStepFilter, setGuideStepFilter] = useState<'overview' | 1 | 2 | 3>('overview');
  const [highlightGuideField, setHighlightGuideField] = useState<GuideFieldKey | null>(null);

  useEffect(() => {
    saveWizardStep(step);
  }, [step]);

  const openGuideModal = (filter: 'overview' | 1 | 2 | 3, fieldKey: GuideFieldKey | null = null) => {
    setGuideStepFilter(filter);
    setHighlightGuideField(fieldKey);
    setGuideOpen(true);
  };

  const openGuideForField = (fieldKey: GuideFieldKey) => {
    const entry = FIELD_GUIDES[fieldKey];
    openGuideModal(entry ? entry.step : step, fieldKey);
  };

  const handleReset = () => {
    setStep(1);
    onReset();
  };

  const formattedSaveTime = lastSavedAt
    ? lastSavedAt.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  const update = <K extends keyof LcaInputParams>(key: K, value: LcaInputParams[K]) => {
    onChange({ ...params, [key]: value });
  };

  const numInput = (
    key: keyof LcaInputParams & GuideFieldKey,
    label: string,
    unit: string,
    opts?: { step?: number; min?: number; max?: number; hint?: string }
  ) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <label htmlFor={String(key)} className="text-sm font-medium text-slate-700">
            {label}
          </label>
          <FieldGuideTooltip fieldKey={key} onOpenFullGuide={openGuideForField} />
        </div>
        <span className="text-xs font-mono text-slate-400 shrink-0">{unit}</span>
      </div>
      <input
        id={String(key)}
        type="number"
        step={opts?.step ?? 1}
        min={opts?.min ?? 0}
        max={opts?.max}
        value={params[key] as number}
        onChange={(e) => update(key, (parseFloat(e.target.value) || 0) as never)}
        className="w-full px-3 py-2 text-sm font-mono tabular-nums text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 transition-colors"
      />
      {opts?.hint && <p className="text-xs text-slate-500">{opts.hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Intro & Scenario Presets Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-teal-700">
            SNI ISO 14040/14044 · Skema Matriks openLCA · Batasan Sistem Cradle-to-Gate
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1 text-balance">
            Kalkulator Inventori &amp; Dampak Daur Hidup Kelapa Sawit
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Hitung profil emisi gas rumah kaca (GWP 100a), pengasaman (AP), dan eutrofikasi (EP)
            per 1 ton Crude Palm Oil (CPO) serta 1 ton Palm Kernel (PK) di pintu gerbang PKS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {SCENARIO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange({ ...params, ...preset.overrides })}
              title={preset.summary}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-teal-700 hover:text-teal-800 transition-colors whitespace-nowrap"
            >
              {preset.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => openGuideModal('overview')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg transition-colors whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Panduan Pengisian
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Main 12-col Asymmetric Scientific Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 columns: 3-Step Parameter Wizard */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl">
          {/* Stepper Tabs */}
          <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50/70 rounded-t-xl overflow-hidden">
            {[
              { id: 1 as const, num: '01', title: 'Parameter & Alokasi' },
              { id: 2 as const, num: '02', title: 'Input Kebun (Hulu)' },
              { id: 3 as const, num: '03', title: 'Input Pabrik (PKS)' },
            ].map((t) => {
              const active = step === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setStep(t.id)}
                  className={`px-4 py-3.5 text-left transition-colors border-b-2 ${
                    active
                      ? 'bg-white border-teal-700 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                    <span
                      className={`text-xs font-mono font-semibold ${
                        active ? 'text-teal-700' : 'text-slate-400'
                      }`}
                    >
                      {t.num}.
                    </span>
                    <span className="text-sm font-semibold truncate">{t.title}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-6 space-y-6">
            {step === 1 && (
              <>
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-base font-semibold text-slate-900">
                    Parameter Dasar, Unit Fungsional &amp; Skema Alokasi
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Unit fungsional ditetapkan sebesar 1 ton CPO dan 1 ton PK di pintu gerbang PKS.
                    Aliran acuan tahunan dihitung dari target produksi CPO dan rendemen (OER/KER).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {numInput('targetCpoTonYear', 'Target Produksi CPO Tahunan', 'ton CPO/thn', {
                    step: 1000,
                    min: 100,
                    hint: `Kebutuhan TBS: ${fmt(result.annualFfbTon, 0)} ton/thn · Output PK: ${fmt(result.annualPkTon, 0)} ton/thn`,
                  })}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <label htmlFor="gwpStandard" className="text-sm font-medium text-slate-700">
                        Standar Faktor Karakterisasi GWP 100a
                      </label>
                      <FieldGuideTooltip fieldKey="gwpStandard" onOpenFullGuide={openGuideForField} />
                    </div>
                    <select
                      id="gwpStandard"
                      value={params.gwpStandard}
                      onChange={(e) => update('gwpStandard', e.target.value as GwpStandard)}
                      className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
                    >
                      <option value="AR6">IPCC AR6 (2021) — CH4 bio: 27,0 · CH4 fosil: 29,8 · N2O: 273</option>
                      <option value="AR5">IPCC AR5 (2013) — CH4 bio: 28,0 · CH4 fosil: 30,0 · N2O: 265</option>
                    </select>
                    <p className="text-xs text-slate-500">
                      CML-IA Baseline v4.8 digunakan untuk AP (kg SO2-eq) dan EP (kg PO4-eq).
                    </p>
                  </div>

                  {numInput('oerPercent', 'Oil Extraction Rate (OER)', '% TBS', {
                    step: 0.1,
                    min: 10,
                    max: 30,
                    hint: `1 ton CPO membutuhkan ${fmt(result.ffbRequiredPerTonCpo, 2)} ton TBS`,
                  })}
                  {numInput('kerPercent', 'Kernel Extraction Rate (KER)', '% TBS', {
                    step: 0.1,
                    min: 1,
                    max: 12,
                    hint: `Rasio co-product PK/CPO = ${fmt(params.kerPercent / Math.max(1, params.oerPercent), 3)} ton PK/ton CPO`,
                  })}
                </div>

                {/* Allocation selector */}
                <div className="pt-5 border-t border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold text-slate-900">
                          Metode Alokasi Co-product (ISO 14044 §4.3.4)
                        </h3>
                        <FieldGuideTooltip
                          fieldKey="allocationMethod"
                          onOpenFullGuide={openGuideForField}
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        Memisahkan beban lingkungan bersama antara produk utama CPO dan co-product PK.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'energy' as AllocationMethod,
                        label: 'Alokasi Energi (LHV)',
                        sub: `CPO ${fmt(result.allocationCpoEnergy * 100, 1)}% · PK ${fmt((1 - result.allocationCpoEnergy) * 100, 1)}%`,
                      },
                      {
                        id: 'economic' as AllocationMethod,
                        label: 'Alokasi Ekonomi',
                        sub: `CPO ${fmt(result.allocationCpoEconomic * 100, 1)}% · PK ${fmt((1 - result.allocationCpoEconomic) * 100, 1)}%`,
                      },
                      {
                        id: 'mass' as AllocationMethod,
                        label: 'Alokasi Massa',
                        sub: `CPO ${fmt(result.allocationCpoMass * 100, 1)}% · PK ${fmt((1 - result.allocationCpoMass) * 100, 1)}%`,
                      },
                    ].map((opt) => {
                      const active = params.allocationMethod === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => update('allocationMethod', opt.id)}
                          className={`p-3.5 text-left rounded-lg border transition-colors ${
                            active
                              ? 'border-teal-700 bg-teal-50/50 text-slate-900'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-sm font-semibold">{opt.label}</div>
                          <div className="text-xs font-mono tabular-nums text-slate-500 mt-1">
                            {opt.sub}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {params.allocationMethod === 'energy' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {numInput('lhvCpoMjKg', 'Nilai Kalor Bawah (LHV) CPO', 'MJ/kg', {
                        step: 0.5,
                        hint: 'Default BioGrace / EU RED II: 37,0 MJ/kg',
                      })}
                      {numInput('lhvPkMjKg', 'Nilai Kalor Bawah (LHV) PK', 'MJ/kg', {
                        step: 0.5,
                        hint: 'Default literatur sawit: 18,5 MJ/kg',
                      })}
                    </div>
                  )}

                  {params.allocationMethod === 'economic' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {numInput('priceCpoIdrKg', 'Harga Pasar Referensi CPO', 'Rp/kg', {
                        step: 100,
                      })}
                      {numInput('pricePkIdrKg', 'Harga Pasar Referensi PK', 'Rp/kg', {
                        step: 100,
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-base font-semibold text-slate-900">
                    Data Input Kebun (Tahap Upstream / Budidaya &amp; Transportasi TBS)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Masukkan produktivitas TBS, dosis pemupukan per hektar per tahun, konsumsi solar
                    operasional &amp; angkutan TBS, serta kondisi lahan (LUC / gambut).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {numInput('plantationAreaHa', 'Luas Areal Kebun Inti/Pemasok', 'ha', {
                    step: 100,
                    hint: `Luas terhitung untuk target CPO: ${fmt(result.impliedAreaHa, 0)} ha`,
                  })}
                  {numInput('ffbYieldTonHaYear', 'Produktivitas TBS (Yield)', 'ton TBS/ha/thn', {
                    step: 0.5,
                    min: 5,
                    max: 40,
                    hint: 'Rata-rata kebun sawit Indonesia: 18–26 ton/ha/thn',
                  })}
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    Pupuk Sintetis, Amelioran &amp; Herbisida
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {numInput('ureaKgHaYear', 'Pupuk Urea (46% N)', 'kg/ha/thn', {
                      step: 10,
                      hint: `Menghasilkan emisi CO2 hidrolisis + N2O langsung/tidak langsung (IPCC Tier 1)`,
                    })}
                    {numInput('sp36KgHaYear', 'Pupuk SP-36 (36% P2O5)', 'kg/ha/thn', {
                      step: 10,
                      hint: 'Kontributor utama limpasan fosfat (PO4) pada Eutrofikasi',
                    })}
                    {numInput('kclKgHaYear', 'Pupuk KCl / MOP (60% K2O)', 'kg/ha/thn', {
                      step: 10,
                    })}
                    {numInput('dolomitKgHaYear', 'Dolomit — CaMg(CO3)2', 'kg/ha/thn', {
                      step: 10,
                      hint: 'Faktor pelapukan karbonat IPCC Eq. 11.12: 0,477 kg CO2/kg',
                    })}
                    {numInput('herbicideKgHaYear', 'Herbisida / Pestisida (bahan aktif)', 'kg a.i./ha/thn', {
                      step: 0.5,
                      hint: 'Proxy Ecoinvent: Glyphosate (10,97 kg CO2/kg a.i.)',
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    Bahan Bakar Alat Berat &amp; Transportasi TBS ke PKS
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {numInput('fieldDieselLHaYear', 'Solar Alat Berat Kebun', 'L/ha/thn', {
                      step: 5,
                    })}
                    {numInput('transportDistanceKm', 'Jarak Rata-rata ke PKS', 'km', {
                      step: 1,
                    })}
                    {numInput('transportFuelLPerTkm', 'Konsumsi Solar Truk', 'L/ton·km', {
                      step: 0.005,
                      hint: 'Default truk 8–12 ton: 0,075 L/tkm',
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Kondisi Lahan: Perubahan Penggunaan Lahan (LUC) &amp; Drainase Gambut
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                          <label htmlFor="enableLuc" className="text-sm font-medium text-slate-800 cursor-pointer">
                            Sertakan Emisi LUC (25 thn)
                          </label>
                          <FieldGuideTooltip fieldKey="enableLuc" onOpenFullGuide={openGuideForField} />
                        </div>
                        <input
                          id="enableLuc"
                          type="checkbox"
                          checked={params.enableLuc}
                          onChange={(e) => update('enableLuc', e.target.checked)}
                          className="h-4 w-4 accent-teal-700 rounded cursor-pointer"
                        />
                      </div>
                      {params.enableLuc && (
                        <select
                          value={params.previousLandUse}
                          onChange={(e) =>
                            update('previousLandUse', e.target.value as PreviousLandUse)
                          }
                          className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg"
                        >
                          <option value="mineral_replanting">
                            Ex-Perkebunan / Replanting (0 kg CO2/ha/thn)
                          </option>
                          <option value="shrubland">
                            Semak Belukar / Padang Rumput (1.850 kg CO2/ha/thn)
                          </option>
                          <option value="secondary_forest">
                            Hutan Sekunder Terdegradasi (6.400 kg CO2/ha/thn)
                          </option>
                        </select>
                      )}
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                          <label htmlFor="enablePeat" className="text-sm font-medium text-slate-800 cursor-pointer">
                            Drainase Lahan Gambut
                          </label>
                          <FieldGuideTooltip fieldKey="enablePeat" onOpenFullGuide={openGuideForField} />
                        </div>
                        <input
                          id="enablePeat"
                          type="checkbox"
                          checked={params.enablePeat}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            onChange({
                              ...params,
                              enablePeat: checked,
                              peatPercent: checked && params.peatPercent === 0 ? 20 : params.peatPercent,
                            });
                          }}
                          className="h-4 w-4 accent-teal-700 rounded cursor-pointer"
                        />
                      </div>
                      {params.enablePeat && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-600">
                            <span>Proporsi areal gambut</span>
                            <span className="font-mono font-semibold text-slate-900">
                              {params.peatPercent}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={params.peatPercent}
                            onChange={(e) => update('peatPercent', parseFloat(e.target.value))}
                            className="w-full accent-teal-700"
                          />
                          <p className="text-xs text-slate-500">
                            IPCC Wetlands 2013: 40,3 t CO2 + 45 kg CH4 + 1,89 kg N2O / ha gambut / thn
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-base font-semibold text-slate-900">
                    Data Input Pabrik Kelapa Sawit (Core Process — PKS &amp; IPAL POME)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Konfigurasi penanganan limbah cair POME, pemanfaatan biomassa cangkang/fiber pada
                    boiler turbin uap, konsumsi solar genset, dan pengelolaan tandan kosong (EFB).
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Sistem Pengolahan Limbah Cair Pabrik Kelapa Sawit (POME)
                    </h3>
                    <FieldGuideTooltip fieldKey="pomeTreatment" onOpenFullGuide={openGuideForField} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'open_lagoon' as PomeTreatment,
                        title: 'Kolam Anaerobik Terbuka',
                        desc: '0% penangkapan CH4 · Emisi metana langsung ke atmosfer',
                      },
                      {
                        id: 'methane_capture_flare' as PomeTreatment,
                        title: 'Methane Capture + Flaring',
                        desc: '85% CH4 ditangkap & dibakar menjadi CO2 biogenik',
                      },
                      {
                        id: 'methane_capture_biogas' as PomeTreatment,
                        title: 'Methane Capture + PLTBg',
                        desc: '90% CH4 ditangkap & dimanfaatkan sebagai biogas energi',
                      },
                    ].map((opt) => {
                      const active = params.pomeTreatment === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => update('pomeTreatment', opt.id)}
                          className={`p-3.5 text-left rounded-lg border transition-colors ${
                            active
                              ? 'border-teal-700 bg-teal-50/50 text-slate-900'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-sm font-semibold">{opt.title}</div>
                          <p className="text-xs text-slate-500 mt-1 leading-snug">{opt.desc}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                    {numInput('pomeVolumeM3PerTonFfb', 'Debit POME per ton TBS', 'm3/ton TBS', {
                      step: 0.02,
                      hint: 'Tipikal PKS: 0,60 – 0,75 m3/ton TBS',
                    })}
                    {numInput('pomeCodMgL', 'Konsentrasi COD Influen', 'mg/L', {
                      step: 1000,
                      hint: 'Default RSPO/IPCC: 50.000 – 65.000 mg/L',
                    })}
                    {numInput('pomeCodRemovalPercent', 'Efisiensi Penyisihan COD', '%', {
                      step: 1,
                      min: 40,
                      max: 98,
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={params.pomeLandApplication}
                        onChange={(e) => update('pomeLandApplication', e.target.checked)}
                        className="h-4 w-4 accent-teal-700 rounded shrink-0"
                      />
                      <span className="text-sm text-slate-700">
                        Efluen akhir IPAL dimanfaatkan untuk <strong>Land Application</strong> di kebun
                        (menurunkan pelepasan COD &amp; fosfat ke badan air sungai)
                      </span>
                    </label>
                    <FieldGuideTooltip
                      fieldKey="pomeLandApplication"
                      onOpenFullGuide={openGuideForField}
                    />
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-200 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Energi Boiler Biomassa, Solar Genset &amp; Tandan Kosong (EFB)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {numInput(
                      'biomassBoilerSharePercent',
                      'Porsi Energi Uap dari Biomassa (Fiber & Cangkang)',
                      '% kebutuhan uap',
                      {
                        step: 5,
                        min: 0,
                        max: 100,
                        hint: 'CO2 pembakaran biomassa bersifat biogenik (GWP = 0)',
                      }
                    )}
                    {numInput('millDieselLPerTonFfb', 'Konsumsi Solar Genset Tambahan', 'L/ton TBS', {
                      step: 0.1,
                      hint: 'Start-up turbin, pemeliharaan, atau beban puncak',
                    })}
                    {numInput('millWaterM3PerTonFfb', 'Konsumsi Air Proses PKS', 'm3/ton TBS', {
                      step: 0.05,
                      hint: 'Dilaporkan dalam tabel LCI PROPER (tipikal 1,1 – 1,5 m3/t TBS)',
                    })}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <label htmlFor="efbTreatment" className="text-sm font-medium text-slate-700">
                          Penanganan Tandan Kosong (EFB — 22% TBS)
                        </label>
                        <FieldGuideTooltip
                          fieldKey="efbTreatment"
                          onOpenFullGuide={openGuideForField}
                        />
                      </div>
                      <select
                        id="efbTreatment"
                        value={params.efbTreatment}
                        onChange={(e) => update('efbTreatment', e.target.value as EfbTreatment)}
                        className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
                      >
                        <option value="mulching">Mulsa Organik di Kebun (Emisi CH4 rendah)</option>
                        <option value="composting">Co-composting dengan POME (Mengurangi beban COD 12%)</option>
                        <option value="open_dumping">Penumpukan Terbuka / Open Dumping (Emisi CH4 tinggi)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step Footer Navigation */}
            <div className="pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  disabled={step === 1}
                  onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap"
                >
                  Tahap Sebelumnya
                </button>
                {formattedSaveTime && (
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    {restoredFromStorage
                      ? 'Data terakhir dipulihkan dari browser'
                      : `Tersimpan otomatis · ${formattedSaveTime}`}
                  </span>
                )}
              </div>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  Lanjut ke Tahap 0{step + 1}
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  Lihat Dashboard &amp; Grafik
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right 4 columns: Live Real-Time LCIA Readout */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-6 lg:sticky lg:top-24">
          <div className="pb-4 border-b border-slate-200">
            <p className="text-xs font-medium text-slate-500">
              Ringkasan Hasil Real-Time · IPCC {params.gwpStandard}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                {fmt(result.gwpCpo, 1)}
              </span>
              <span className="text-xs font-mono text-slate-500">kg CO2-eq / ton CPO</span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Setara <span className="font-mono font-medium text-slate-700">{fmt(result.gwpCpo / 1000, 3)}</span> t CO2-eq/t CPO · Total tahunan{' '}
              <span className="font-mono font-medium text-slate-700">{fmt(result.annualGwpTonCo2eq, 0)}</span> t CO2-eq/thn
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <div>
              <p className="text-xs text-slate-500">GWP 100a — Palm Kernel</p>
              <p className="text-lg font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
                {fmt(result.gwpPk, 1)}
              </p>
              <p className="text-xs font-mono text-slate-400">kg CO2-eq / ton PK</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Cumulative Energy (CED)</p>
              <p className="text-lg font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
                {fmt(result.cedCpo, 0)}
              </p>
              <p className="text-xs font-mono text-slate-400">MJ-eq / ton CPO</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Acidification (AP)</p>
              <p className="text-lg font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
                {fmt(result.apCpo, 2)}
              </p>
              <p className="text-xs font-mono text-slate-400">kg SO2-eq / ton CPO</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Eutrophication (EP)</p>
              <p className="text-lg font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
                {fmt(result.epCpo, 2)}
              </p>
              <p className="text-xs font-mono text-slate-400">kg PO4-eq / ton CPO</p>
            </div>
          </div>

          {/* Allocation Split Bar */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">
                Alokasi ({params.allocationMethod === 'energy' ? 'Energi LHV' : params.allocationMethod === 'economic' ? 'Ekonomi' : 'Massa'})
              </span>
              <span className="font-mono tabular-nums text-slate-600">
                CPO {fmt(result.allocationCpo * 100, 1)}% · PK {fmt(result.allocationPk * 100, 1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-teal-700 h-full transition-all duration-200"
                style={{ width: `${result.allocationCpo * 100}%` }}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-200"
                style={{ width: `${result.allocationPk * 100}%` }}
              />
            </div>
          </div>

          {/* Dominant Hotspot Callout */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <p className="text-xs font-medium text-slate-500">Hotspot Dominan GWP 100a</p>
            <p className="text-sm font-semibold text-slate-900">{result.topGwpStage.stageName}</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Menyumbang{' '}
              <span className="font-mono font-semibold text-teal-800">
                {fmt(result.topGwpStage.gwpSharePercent, 1)}%
              </span>{' '}
              ({fmt(result.topGwpStage.gwpPerTonCpo, 1)} kg CO2-eq/ton CPO).
              {result.pomeReductionPotentialKgCo2eq > 20 && (
                <>
                  {' '}
                  Potensi mitigasi via Methane Capture PLTBg:{' '}
                  <span className="font-mono font-semibold text-emerald-700">
                    -{fmt(result.pomeReductionPotentialKgCo2eq, 0)} kg CO2-eq/t CPO
                  </span>
                  .
                </>
              )}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
            >
              Buka Dashboard &amp; Grafik Interaktif
            </button>
            <button
              type="button"
              onClick={() => onNavigate('proper')}
              className="w-full py-2.5 px-4 text-sm font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors whitespace-nowrap"
            >
              Generate Laporan PROPER KLHK 2021
            </button>
          </div>
        </aside>
      </div>

      <InputGuideModal
        open={guideOpen}
        initialStepFilter={guideStepFilter}
        highlightFieldKey={highlightGuideField}
        onClose={() => setGuideOpen(false)}
        onJumpToStep={(targetStep) => setStep(targetStep)}
      />
    </div>
  );
};
