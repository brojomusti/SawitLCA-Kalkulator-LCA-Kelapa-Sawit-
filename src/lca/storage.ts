import { DEFAULT_INPUTS, DEFAULT_REPORT_METADATA } from './olcaData';
import { LcaInputParams, ReportMetadata } from './types';

const STORAGE_KEYS = {
  params: 'sawitlca:params:v1',
  reportMeta: 'sawitlca:reportMeta:v1',
  wizardStep: 'sawitlca:wizardStep:v1',
} as const;

const VALID_ALLOCATION = new Set(['energy', 'economic', 'mass']);
const VALID_GWP = new Set(['AR6', 'AR5']);
const VALID_LAND_USE = new Set(['mineral_replanting', 'shrubland', 'secondary_forest']);
const VALID_POME = new Set(['open_lagoon', 'methane_capture_flare', 'methane_capture_biogas']);
const VALID_EFB = new Set(['mulching', 'composting', 'open_dumping']);

function sanitizeParams(raw: unknown): LcaInputParams {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_INPUTS };
  const src = raw as Record<string, unknown>;
  const merged: LcaInputParams = { ...DEFAULT_INPUTS };

  for (const key of Object.keys(DEFAULT_INPUTS) as (keyof LcaInputParams)[]) {
    const defVal = DEFAULT_INPUTS[key];
    const incoming = src[key];
    if (typeof defVal === 'number' && typeof incoming === 'number' && Number.isFinite(incoming)) {
      (merged as unknown as Record<string, unknown>)[key] = incoming;
    } else if (typeof defVal === 'boolean' && typeof incoming === 'boolean') {
      (merged as unknown as Record<string, unknown>)[key] = incoming;
    }
  }

  if (typeof src.allocationMethod === 'string' && VALID_ALLOCATION.has(src.allocationMethod)) {
    merged.allocationMethod = src.allocationMethod as LcaInputParams['allocationMethod'];
  }
  if (typeof src.gwpStandard === 'string' && VALID_GWP.has(src.gwpStandard)) {
    merged.gwpStandard = src.gwpStandard as LcaInputParams['gwpStandard'];
  }
  if (typeof src.previousLandUse === 'string' && VALID_LAND_USE.has(src.previousLandUse)) {
    merged.previousLandUse = src.previousLandUse as LcaInputParams['previousLandUse'];
  }
  if (typeof src.pomeTreatment === 'string' && VALID_POME.has(src.pomeTreatment)) {
    merged.pomeTreatment = src.pomeTreatment as LcaInputParams['pomeTreatment'];
  }
  if (typeof src.efbTreatment === 'string' && VALID_EFB.has(src.efbTreatment)) {
    merged.efbTreatment = src.efbTreatment as LcaInputParams['efbTreatment'];
  }

  return merged;
}

export function loadSavedParams(): { params: LcaInputParams; restored: boolean } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.params);
    if (!raw) return { params: { ...DEFAULT_INPUTS }, restored: false };
    const parsed = JSON.parse(raw);
    return { params: sanitizeParams(parsed), restored: true };
  } catch {
    return { params: { ...DEFAULT_INPUTS }, restored: false };
  }
}

export function saveParams(params: LcaInputParams): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEYS.params, JSON.stringify(params));
    return true;
  } catch {
    return false;
  }
}

export function clearSavedParams(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.params);
    window.localStorage.removeItem(STORAGE_KEYS.wizardStep);
  } catch {
    // Ignore storage access errors in restricted environments
  }
}

export function loadSavedReportMeta(): ReportMetadata {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.reportMeta);
    if (!raw) return { ...DEFAULT_REPORT_METADATA };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_REPORT_METADATA };
    return { ...DEFAULT_REPORT_METADATA, ...parsed };
  } catch {
    return { ...DEFAULT_REPORT_METADATA };
  }
}

export function saveReportMeta(meta: ReportMetadata): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS.reportMeta, JSON.stringify(meta));
  } catch {
    // Ignore storage access errors
  }
}

export function loadSavedWizardStep(): 1 | 2 | 3 {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.wizardStep);
    if (raw === '1' || raw === '2' || raw === '3') {
      return Number(raw) as 1 | 2 | 3;
    }
    return 1;
  } catch {
    return 1;
  }
}

export function saveWizardStep(step: 1 | 2 | 3): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS.wizardStep, String(step));
  } catch {
    // Ignore storage access errors
  }
}
