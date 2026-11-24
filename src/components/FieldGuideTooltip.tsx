import React, { useEffect, useRef, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { FIELD_GUIDES, GuideFieldKey } from '../lca/fieldGuides';

interface FieldGuideTooltipProps {
  fieldKey: GuideFieldKey;
  onOpenFullGuide?: (fieldKey: GuideFieldKey) => void;
}

export const FieldGuideTooltip: React.FC<FieldGuideTooltipProps> = ({
  fieldKey,
  onOpenFullGuide,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const entry = FIELD_GUIDES[fieldKey];

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  if (!entry) return null;

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Panduan pengisian untuk ${entry.label}`}
        aria-expanded={open}
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
          open
            ? 'text-teal-800 bg-teal-50'
            : 'text-slate-400 hover:text-teal-700 hover:bg-slate-100'
        }`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`Bantuan ${entry.label}`}
          className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 top-7 z-40 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-left space-y-2.5"
        >
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold text-slate-900 leading-snug">{entry.label}</p>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                {entry.unit} · Tipikal: {entry.typicalRange}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup panduan singkat"
              className="p-0.5 text-slate-400 hover:text-slate-700 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">{entry.whatItIs}</p>

          <div className="space-y-1.5 pt-1 text-[11px] text-slate-600 leading-relaxed">
            <p>
              <span className="font-semibold text-slate-800">Pengaruh LCA: </span>
              {entry.lcaImpact}
            </p>
            <p>
              <span className="font-semibold text-slate-800">Sumber Data: </span>
              {entry.whereToFind}
            </p>
          </div>

          {onOpenFullGuide && (
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenFullGuide(fieldKey);
                }}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline"
              >
                Lihat di Panduan Pengisian Lengkap →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
