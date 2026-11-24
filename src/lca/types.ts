export type FlowType = 'ELEMENTARY_FLOW' | 'PRODUCT_FLOW' | 'WASTE_FLOW';
export type Compartment = 'air' | 'water' | 'soil' | 'technosphere';
export type AllocationMethod = 'energy' | 'economic' | 'mass';
export type PomeTreatment = 'open_lagoon' | 'methane_capture_flare' | 'methane_capture_biogas';
export type EfbTreatment = 'mulching' | 'composting' | 'open_dumping';
export type PreviousLandUse = 'mineral_replanting' | 'shrubland' | 'secondary_forest';
export type GwpStandard = 'AR6' | 'AR5';

export interface OlcaFlow {
  '@type': 'Flow';
  '@id': string;
  name: string;
  flowType: FlowType;
  compartment: Compartment;
  unit: string;
  cas?: string;
  formula?: string;
  description: string;
}

export interface OlcaExchange {
  '@type': 'Exchange';
  flowId: string;
  flowName: string;
  flowType: FlowType;
  isInput: boolean;
  amount: number;
  unit: string;
  dataQuality: 'Primer' | 'Sekunder';
  datasetRef: string;
}

export interface OlcaProcess {
  '@type': 'Process';
  '@id': string;
  code: string;
  name: string;
  stage: 'Upstream' | 'Core';
  stageGroup: 'Kebun & Pupuk' | 'LUC & Gambut' | 'Transportasi TBS' | 'PKS & Boiler' | 'Limbah POME';
  quantitativeReference: string;
  description: string;
  exchanges: OlcaExchange[];
}

export interface OlcaImpactFactor {
  flowId: string;
  value: number;
  unit: string;
  source: string;
}

export interface OlcaImpactCategory {
  '@type': 'ImpactCategory';
  '@id': string;
  code: 'GWP100' | 'AP' | 'EP' | 'CED';
  name: string;
  referenceUnit: string;
  method: string;
  factors: OlcaImpactFactor[];
}

export interface LcaInputParams {
  // Tab 1: Parameter Dasar & Unit Fungsional
  targetCpoTonYear: number;
  oerPercent: number;
  kerPercent: number;
  allocationMethod: AllocationMethod;
  lhvCpoMjKg: number;
  lhvPkMjKg: number;
  priceCpoIdrKg: number;
  pricePkIdrKg: number;
  gwpStandard: GwpStandard;

  // Tab 2: Data Input Kebun (Upstream)
  plantationAreaHa: number;
  ffbYieldTonHaYear: number;
  ureaKgHaYear: number;
  sp36KgHaYear: number;
  kclKgHaYear: number;
  dolomitKgHaYear: number;
  herbicideKgHaYear: number;
  fieldDieselLHaYear: number;
  transportDistanceKm: number;
  transportFuelLPerTkm: number;
  enableLuc: boolean;
  previousLandUse: PreviousLandUse;
  enablePeat: boolean;
  peatPercent: number;

  // Tab 3: Data Input Pabrik (Core PKS)
  pomeTreatment: PomeTreatment;
  pomeVolumeM3PerTonFfb: number;
  pomeCodMgL: number;
  pomeCodRemovalPercent: number;
  pomeLandApplication: boolean;
  biomassBoilerSharePercent: number;
  millDieselLPerTonFfb: number;
  efbTreatment: EfbTreatment;
  millWaterM3PerTonFfb: number;
}

export interface ReportMetadata {
  companyName: string;
  millName: string;
  location: string;
  contactEmail: string;
  website: string;
  studyPeriod: string;
  reportDate: string;
  reportVersion: string;
  leadPractitioner: string;
  teamMembers: string;
  criticalReviewDone: boolean;
  criticalReviewer: string;
}

export interface StageImpactRow {
  stageId: string;
  stageName: string;
  lifecyclePhase: 'Upstream (Hulu)' | 'Core (Inti PKS)';
  gwpPerTonCpo: number;
  gwpPerTonPk: number;
  gwpSharePercent: number;
  apPerTonCpo: number;
  apPerTonPk: number;
  apSharePercent: number;
  epPerTonCpo: number;
  epPerTonPk: number;
  epSharePercent: number;
  cedPerTonCpo: number;
}

export interface ElementaryInventoryRow {
  flowId: string;
  name: string;
  compartment: Compartment;
  unit: string;
  amountPerTonFfb: number;
  amountPerTonCpo: number;
  amountPerTonPk: number;
  amountAnnualTotal: number;
  gwpContributionCpo: number;
  apContributionCpo: number;
  epContributionCpo: number;
  dominantStage: string;
}

export interface MaterialContributionRow {
  material: string;
  category: string;
  gwpPerTonCpo: number;
  gwpSharePercent: number;
  apPerTonCpo: number;
  epPerTonCpo: number;
  cumulativeGwpPercent: number;
  isPareto80: boolean;
  dominantProcess: string;
}

export interface SensitivityScenario {
  label: string;
  group: 'Alokasi' | 'Mitigasi POME';
  gwpCpo: number;
  gwpPk: number;
  deltaPercentVsCurrent: number;
  apCpo: number;
  epCpo: number;
}

export interface MatrixSnapshot {
  processNames: string[];
  technosphereFlows: string[];
  A: number[][];
  f: number[];
  s: number[];
  elementaryFlowNames: string[];
  B: number[][];
  g: number[];
}

export interface LcaResult {
  // Production mass balance
  ffbRequiredPerTonCpo: number;
  annualFfbTon: number;
  annualCpoTon: number;
  annualPkTon: number;
  impliedAreaHa: number;
  annualPomeM3: number;
  annualEfbTon: number;

  // Allocation factors
  allocationCpo: number;
  allocationPk: number;
  allocationCpoEnergy: number;
  allocationCpoEconomic: number;
  allocationCpoMass: number;

  // Headline LCIA per functional unit (1 ton CPO & 1 ton PK)
  gwpCpo: number;
  gwpPk: number;
  apCpo: number;
  apPk: number;
  epCpo: number;
  epPk: number;
  cedCpo: number;
  cedPk: number;

  // Unallocated per ton TBS
  gwpPerTonFfb: number;
  apPerTonFfb: number;
  epPerTonFfb: number;

  // Annual total emissions
  annualGwpTonCo2eq: number;

  // GHG breakdown (per ton CPO)
  ghgBreakdown: {
    co2Fossil: number;
    co2LucPeat: number;
    ch4Biogenic: number;
    ch4Fossil: number;
    n2o: number;
    co2BiogenicMemo: number;
  };

  // Detailed tables
  stageBreakdown: StageImpactRow[];
  inventoryRows: ElementaryInventoryRow[];
  materialContributions: MaterialContributionRow[];
  processes: OlcaProcess[];
  matrix: MatrixSnapshot;
  sensitivity: SensitivityScenario[];

  // Key hotspots for interpretation
  topGwpStage: StageImpactRow;
  topApStage: StageImpactRow;
  topEpStage: StageImpactRow;
  pomeReductionPotentialKgCo2eq: number;

  // Quality stats for PROPER Table 9
  dataQualityStats: {
    primaryCount: number;
    secondaryCount: number;
    primaryPercent: number;
    secondaryPercent: number;
    completenessPercent: number;
  };
}
