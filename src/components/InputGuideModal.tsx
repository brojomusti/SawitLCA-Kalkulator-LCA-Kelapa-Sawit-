import React, { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { FIELD_GUIDE_LIST, GuideFieldKey, LCA_GLOSSARY } from '../lca/fieldGuides';

interface InputGuideModalProps {
  open: boolean;
  initialStepFilter: 'overview' | 1 | 2 | 3;
  highlightFieldKey?: GuideFieldKey | null;
  onClose: () => void;
  onJumpToStep: (step: 1 | 2 | 3) => void;
}

export const InputGuideModal: React.FC<InputGuideModalProps> = ({
  open,
  initialStepFilter,
  highlightFieldKey,
  onClose,
  onJumpToStep,
}) => {
  const [filter, setFilter] = useState<'overview' | 1 | 2 | 3>(initialStepFilter);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) {
      setFilter(initialStepFilter);
      setQuery('');
    }
  }, [open, initialStepFilter, highlightFieldKey]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FIELD_GUIDE_LIST.filter((item) => {
      const matchesTab = q ? true : filter === 'overview' ? true : item.step === filter;
      if (!matchesTab) return false;
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.whatItIs.toLowerCase().includes(q) ||
        item.lcaImpact.toLowerCase().includes(q) ||
        item.whereToFind.toLowerCase().includes(q) ||
        item.unit.toLowerCase().includes(q)
      );
    });
  }, [filter, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[1px] p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-teal-700">
              Referensi Pengguna · Parameter Kebun &amp; Pabrik Kelapa Sawit
            </p>
            <h2 id="guide-modal-title" className="text-lg font-bold text-slate-900 mt-0.5">
              Panduan Pengisian Data Kalkulator LCA
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal panduan"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            {[
              { id: 'overview' as const, label: 'Konsep Dasar LCA' },
              { id: 1 as const, label: '01. Parameter & Alokasi' },
              { id: 2 as const, label: '02. Input Kebun' },
              { id: 3 as const, label: '03. Input Pabrik' },
            ].map((tab) => (
              <button
                key={String(tab.id)}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  filter === tab.id && !query.trim()
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari OER, Urea, POME, COD..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {filter === 'overview' && !query.trim() && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900">
                  4 Konsep Utama LCA Sawit yang Perlu Diketahui
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Penjelasan ringkas bagi pengguna baru sebelum memasukkan angka operasional kebun dan pabrik.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {LCA_GLOSSARY.map((g) => (
                  <div key={g.term} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-slate-900">{g.term}</h4>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{g.explanation}</p>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Tips Praktis Pengumpulan Data
                </h3>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-600 leading-relaxed">
                  <li>
                    Gunakan data aktual 1 tahun penuh (Januari–Desember) agar selaras dengan syarat
                    pelaporan <strong>PROPER KLHK</strong>.
                  </li>
                  <li>
                    Jika belum memiliki data laboratorium spesifik (misal LHV, faktor konsumsi solar
                    truk, atau COD POME), gunakan nilai default referensi IPCC/RSPO yang sudah
                    terisi otomatis.
                  </li>
                  <li>
                    Klik ikon <strong>(?)</strong> di sebelah label parameter kapan saja untuk
                    membaca definisi, rentang angka wajar, dan asal dokumennya.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {(filter !== 'overview' || query.trim().length > 0) && (
            <div className="space-y-1 divide-y divide-slate-200">
              {filteredEntries.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    Parameter “{query}” tidak ditemukan.
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="mt-2 text-xs font-semibold text-teal-700 hover:underline"
                  >
                    Tampilkan semua parameter
                  </button>
                </div>
              ) : (
                filteredEntries.map((item) => {
                  const isHighlighted = highlightFieldKey === item.key;
                  return (
                    <div
                      key={item.key}
                      className={`py-4 first:pt-1 space-y-2 rounded-lg transition-colors ${
                        isHighlighted ? 'bg-teal-50/70 px-4 -mx-4' : ''
                      }`}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">{item.label}</h3>
                          <span className="text-xs font-mono text-slate-500">
                            {item.unit} · Tipikal: {item.typicalRange}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onJumpToStep(item.step);
                            onClose();
                          }}
                          className="text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline whitespace-nowrap"
                        >
                          Tahap 0{item.step}: {item.stepLabel} →
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{item.whatItIs}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-slate-600">
                        <p>
                          <span className="font-semibold text-slate-800">Pengaruh ke LCA: </span>
                          {item.lcaImpact}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">Sumber Data Lapangan: </span>
                          {item.whereToFind}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Menampilkan {filteredEntries.length} panduan parameter · Acuan IPCC 2006/2019 &amp; PROPER KLHK 2021
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
