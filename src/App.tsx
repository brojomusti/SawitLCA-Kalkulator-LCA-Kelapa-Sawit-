import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ChevronDown, Download, FileCode2, FileSpreadsheet, FileJson, FileText } from 'lucide-react';
import { CalculatorWizard } from './components/CalculatorWizard';
import { DashboardView } from './components/DashboardView';
import { OlcaModelView } from './components/OlcaModelView';
import { ProperReportView } from './components/ProperReportView';
import { calculatePalmOilLca } from './lca/engine';
import {
  downloadCsvReport,
  downloadJsonReport,
  downloadStandaloneHtml,
} from './lca/exporters';
import { generateProperPdfReport, PdfReportScope } from './lca/pdfReport';
import { DEFAULT_INPUTS } from './lca/olcaData';
import {
  clearSavedParams,
  loadSavedParams,
  loadSavedReportMeta,
  saveParams,
  saveReportMeta,
} from './lca/storage';
import { LcaInputParams, ReportMetadata } from './lca/types';

type ActiveTab = 'calculator' | 'dashboard' | 'olca' | 'proper';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('calculator');
  const [initialLoaded] = useState(() => loadSavedParams());
  const [params, setParams] = useState<LcaInputParams>(initialLoaded.params);
  const [reportMeta, setReportMeta] = useState<ReportMetadata>(() => loadSavedReportMeta());
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    initialLoaded.restored ? new Date() : null
  );
  const [restoredFromStorage, setRestoredFromStorage] = useState<boolean>(initialLoaded.restored);
  const [exportOpen, setExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const isFirstRenderRef = useRef(true);
  const skipNextSaveRef = useRef(false);

  const result = useMemo(() => calculatePalmOilLca(params), [params]);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    if (saveParams(params)) {
      setLastSavedAt(new Date());
      setRestoredFromStorage(false);
    }
  }, [params]);

  useEffect(() => {
    saveReportMeta(reportMeta);
  }, [reportMeta]);

  const handleResetParams = () => {
    skipNextSaveRef.current = true;
    clearSavedParams();
    setParams({ ...DEFAULT_INPUTS });
    setLastSavedAt(null);
    setRestoredFromStorage(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportJson = () => {
    downloadJsonReport(params, result, reportMeta);
    setExportOpen(false);
  };

  const handleExportCsv = () => {
    downloadCsvReport(params, result, reportMeta);
    setExportOpen(false);
  };

  const handleExportHtml = () => {
    downloadStandaloneHtml(params, reportMeta);
    setExportOpen(false);
  };

  const handleExportPdf = (scope: PdfReportScope = 'all') => {
    setExportOpen(false);
    generateProperPdfReport(params, result, reportMeta, scope);
  };

  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'calculator', label: 'Kalkulator' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'olca', label: 'Model openLCA' },
    { id: 'proper', label: 'Laporan PROPER' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Strictly 3-Zone Top Bar Contract */}
      <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className="text-lg font-bold tracking-tight text-slate-900 hover:text-teal-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            SawitLCA
          </button>

          {/* Zone 2: 4 Clean Single-Line Navigation Links */}
          <nav
            aria-label="Navigasi utama"
            className="flex items-center gap-5 sm:gap-7 overflow-x-auto"
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    active
                      ? 'text-teal-800 border-teal-700 font-semibold'
                      : 'text-slate-600 border-transparent hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action with Export Menu */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Laporan
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {exportOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <FileJson className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Ekspor LCI &amp; LCIA (JSON openLCA)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Ekspor Tabel Inventori (CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportHtml}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <FileCode2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Unduh Standalone index.html</span>
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => handleExportPdf('all')}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <FileText className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Cetak / Unduh Laporan PROPER KLHK (PDF)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'calculator' && (
          <CalculatorWizard
            params={params}
            result={result}
            lastSavedAt={lastSavedAt}
            restoredFromStorage={restoredFromStorage}
            onChange={setParams}
            onReset={handleResetParams}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            params={params}
            result={result}
            onExportJson={handleExportJson}
            onExportCsv={handleExportCsv}
          />
        )}

        {activeTab === 'olca' && <OlcaModelView params={params} result={result} />}

        {activeTab === 'proper' && (
          <ProperReportView
            params={params}
            result={result}
            meta={reportMeta}
            onChangeMeta={setReportMeta}
            onExportJson={handleExportJson}
            onExportCsv={handleExportCsv}
            onExportStandaloneHtml={handleExportHtml}
            onExportPdf={handleExportPdf}
          />
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="no-print border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            SawitLCA · Metodologi SNI ISO 14040/14044, Skema openLCA &amp; Pedoman PROPER KLHK 2021
          </span>
          <span>
            Referensi Faktor Emisi: IPCC 2006/2019 · IPCC Wetlands 2013 · RSPO PalmGHG · CML-IA Baseline
          </span>
        </div>
      </footer>
    </div>
  );
}
