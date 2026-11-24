import {
  GwpStandard,
  LcaInputParams,
  OlcaFlow,
  OlcaImpactCategory,
  PreviousLandUse,
  ReportMetadata,
} from './types';

/**
 * openLCA-inspired Flow Catalog (olca-schema compliant structure)
 */
export const OLCA_FLOWS: OlcaFlow[] = [
  // Elementary Flows — Emissions to Air
  {
    '@type': 'Flow',
    '@id': 'ef-co2-fossil',
    name: 'Carbon dioxide, fossil',
    flowType: 'ELEMENTARY_FLOW',
    compartment: 'air',
    unit: 'kg',
    cas: '124-38-9',
    formula: 'CO2',
    description: 'Emisi CO2 fosil dari pembakaran solar, produksi pupuk/agrokimia, hidrolisis urea, dan pelapukan dolomit.',
  },
  {
    '@type': 'Flow',
    '@id': 'ef-co2-luc',
    name: 'Carbon dioxide, land transformation & peat',
    flowType: 'ELEMENTARY_FLOW',
    compartment: 'air',
    unit: 'kg',
    cas: '124-38-9',
    formula: 'CO2 (LUC/Peat)',
    description: 'Emisi CO2 dari perubahan penggunaan lahan (LUC, amortisasi 25 tahun) dan oksidasi drainase lahan gambut.',
  },
  {
    '@type': 'Flow',
    '@id': 'ef-co2-biogenic',
    name: 'Carbon dioxide, biogenic',
    flowType: 'ELEMENTARY_FLOW',
    compartment: 'air',
    unit: 'kg',
    cas: '124-38-9',
    formula: 'CO2 (bio)',
    description: 'Emisi CO2 biogenik dari pembakaran biomassa fiber/cangkang boiler & flaring biogas (GWP100 = 0 sesuai IPCC).',
  },
  {
    '@type': 'Flow',
    '@id': 'ef-ch4-biogenic',
    name: 'Methane, non-fossil (biogenic)',
    flowType: 'ELEMENTARY_FLOW',
    compartment: 'air',
    unit: 'kg',
    cas: '74-82-8',
    formula: 'CH4 (bio)',
    description: 'Emisi metana biogenik dari degradasi anaerobik POME, dekomposisi EFB, boiler biomassa, dan saluran drainase gambut.',
  },
  {
    '@type': 'Flow',
    '@id': 'ef-ch4-fossil',
    name: 'Methane, fossil',
    flowType: 'ELEMENTARY_FLOW',
    compartment: 'air',
    unit: 'kg',
    cas: '74-82-8',
    formula: 'CH4 (fossil)',
    description: 'Emisi metana fosil dari rantai hulu produksi pupuk, herbisida, serta kilang dan pembakaran solar.',
  },
  {
    '@type': 'Flow',
    '@id': 'ef-n2o',
    name: 'Dinitrogen monoxide',
    flowType: 'ELEMENTARY_FLOW',
    compartment: 'air',
    unit: 'kg',
    cas: '10024-97-2',
    formula: 'N2O',
    description: 'Emisi N2O langsung dan tidak langsung dari pupuk nitrogen (IPCC Tier 1), drainase gambut, serta pembakaran.',
  },
  {
    '@type': 'Flow',
    '@id': 'ef-nh3',
    name: 'Ammonia',
    flowType: 'ELEMENTARY_FLOW',
    compartment: 'air',
    unit: 'kg',
    cas: '7664-41-7',
    formula: 'NH3',
    description: 'Volatilisasi amonia ke udara dari aplikasi pupuk Urea (FracGASF = 10% N).',
  },
  {
    '@type': 'Flow',
    '@id': 'ef-nox',
    name: 'Nitrogen oxides',
    flowType: 'ELEMENTARY_FLOW',
    compartment: 'air',
    unit: 'kg',
    cas: '10102-44-0',
    formula: 'NOx',
    description: 'Emisi oksida nitrogen dari pembakaran mesin diesel (alat berat, truk TBS, genset) dan boiler biomassa PKS.',
  },
  {
    '@type': 'Flow',
    '@id': 'ef-so2',
    name: 'Sulfur dioxide',
    flowType: 'ELEMENTARY_FLOW',
    compartment: 'air',
    unit: 'kg',
    cas: '7446-09-5',
    formula: 'SO2',
    description: 'Emisi sulfur dioksida dari produksi pupuk fosfat/urea, pembakaran bahan bakar fosil, dan boiler.',
  },
  // Elementary Flows — Emissions to Water
  {
    '@type': 'Flow',
    '@id': 'ef-no3-water',
    name: 'Nitrate (to freshwater)',
    flowType: 'ELEMENTARY_FLOW',
    compartment: 'water',
    unit: 'kg',
    cas: '14797-55-8',
    formula: 'NO3-',
    description: 'Pencucian (leaching) nitrat ke badan air permukaan/tanah dari aplikasi pupuk nitrogen (FracLEACH = 30% N).',
  },
  {
    '@type': 'Flow',
    '@id': 'ef-po4-water',
    name: 'Phosphate (to freshwater)',
    flowType: 'ELEMENTARY_FLOW',
    compartment: 'water',
    unit: 'kg',
    cas: '14265-44-2',
    formula: 'PO4^3-',
    description: 'Limpasan fosfat dari pupuk SP-36 dan residu fosfat pada efluen akhir POME.',
  },
  {
    '@type': 'Flow',
    '@id': 'ef-cod-water',
    name: 'COD, Chemical Oxygen Demand',
    flowType: 'ELEMENTARY_FLOW',
    compartment: 'water',
    unit: 'kg',
    formula: 'COD',
    description: 'Residu beban organik COD pada efluen akhir IPAL POME yang dilepas ke perairan.',
  },
  // Product / Technosphere Flows
  {
    '@type': 'Flow',
    '@id': 'pf-agro-bundle',
    name: 'Paket Input Agrokimia & Solar Hulu',
    flowType: 'PRODUCT_FLOW',
    compartment: 'technosphere',
    unit: 'unit',
    description: 'Aliran produk hulu gabungan (Urea, SP-36, KCl, Dolomit, Herbisida, Solar WTT) per ton TBS.',
  },
  {
    '@type': 'Flow',
    '@id': 'pf-ffb-estate',
    name: 'Tandan Buah Segar (TBS) di Kebun',
    flowType: 'PRODUCT_FLOW',
    compartment: 'technosphere',
    unit: 'ton',
    description: 'Buah kelapa sawit segar hasil panen di blok kebun sebelum pengangkutan ke PKS.',
  },
  {
    '@type': 'Flow',
    '@id': 'pf-ffb-mill',
    name: 'Tandan Buah Segar (TBS) di Pintu PKS',
    flowType: 'PRODUCT_FLOW',
    compartment: 'technosphere',
    unit: 'ton',
    description: 'TBS terkirim di jembatan timbang PKS siap masuk stasiun sterilisasi.',
  },
  {
    '@type': 'Flow',
    '@id': 'pf-pome-service',
    name: 'Layanan Pengolahan Limbah Cair (POME)',
    flowType: 'WASTE_FLOW',
    compartment: 'technosphere',
    unit: 'm3',
    description: 'Volume limbah cair POME yang diolah di sistem kolam anaerobik atau instalasi methane capture.',
  },
  {
    '@type': 'Flow',
    '@id': 'pf-cpo',
    name: 'Crude Palm Oil (CPO)',
    flowType: 'PRODUCT_FLOW',
    compartment: 'technosphere',
    unit: 'ton',
    description: 'Minyak sawit mentah (produk utama) di tangki timbun pintu gerbang PKS.',
  },
  {
    '@type': 'Flow',
    '@id': 'pf-pk',
    name: 'Palm Kernel (PK)',
    flowType: 'PRODUCT_FLOW',
    compartment: 'technosphere',
    unit: 'ton',
    description: 'Inti sawit (co-product) hasil pemisahan cangkang di stasiun kernel PKS.',
  },
];

/**
 * Embedded Reference Emission Factors (IPCC 2006/2019, RSPO PalmGHG v4, BioGrace, Ecoinvent 3.8)
 */
export const EMISSION_FACTORS = {
  // Upstream fertilizer manufacturing (per kg product) — Ecoinvent 3.8 / BioGrace
  ureaProduction: {
    co2Fossil: 1.62,
    ch4Fossil: 0.0042,
    n2o: 0.0001,
    so2: 0.0055,
    nox: 0.0038,
    cedMj: 48.9,
    nContent: 0.46,
    source: 'Ecoinvent 3.8: urea production {RoW} / BioGrace',
  },
  sp36Production: {
    co2Fossil: 0.68,
    ch4Fossil: 0.0018,
    so2: 0.011,
    nox: 0.0025,
    po4Water: 0.0015,
    cedMj: 12.4,
    p2o5Content: 0.36,
    source: 'Ecoinvent 3.8: single superphosphate production {RoW}',
  },
  kclProduction: {
    co2Fossil: 0.35,
    ch4Fossil: 0.0008,
    so2: 0.0014,
    nox: 0.0012,
    cedMj: 6.8,
    k2oContent: 0.6,
    source: 'Ecoinvent 3.8: potassium chloride production {RoW}',
  },
  dolomitProduction: {
    co2Fossil: 0.032,
    so2: 0.0002,
    nox: 0.0003,
    cedMj: 0.55,
    source: 'Ecoinvent 3.8: dolomite mining & crushing {RoW}',
  },
  herbicideProduction: {
    co2Fossil: 10.97,
    ch4Fossil: 0.025,
    so2: 0.048,
    nox: 0.032,
    po4Water: 0.015,
    cedMj: 268.0,
    source: 'Ecoinvent 3.8: glyphosate production {GLO} / BioGrace',
  },
  // Field stoichiometric & IPCC Tier 1 factors (IPCC 2006 Vol. 4 Ch. 11 & 2019 Refinement)
  fieldEmissions: {
    ureaCo2Factor: 0.2 * (44 / 12), // 0.7333 kg CO2 / kg Urea (IPCC Eq. 11.13)
    dolomitCo2Factor: 0.13 * (44 / 12), // 0.4767 kg CO2 / kg Dolomit (IPCC Eq. 11.12)
    ef1DirectN2O: 0.01, // kg N2O-N / kg N applied
    fracGasf: 0.1, // fraction of synthetic N volatilized as NH3/NOx
    ef4VolatN2O: 0.01, // kg N2O-N / kg NH3-N volatilized
    fracLeach: 0.3, // fraction of N leached as NO3-
    ef5LeachN2O: 0.0075, // kg N2O-N / kg N leached
    n2oMolRatio: 44 / 28, // 1.5714 kg N2O / kg N2O-N
    nh3MolRatio: 17 / 14, // 1.2143 kg NH3 / kg NH3-N
    no3MolRatio: 62 / 14, // 4.4286 kg NO3- / kg NO3-N
    pRunoffFraction: 0.025, // 2.5% P runoff to freshwater
    p2o5ToP: 61.948 / 141.945, // 0.4364
    pToPo4: 94.971 / 30.974, // 3.0662
  },
  // Diesel (Solar Industri) — per liter (density ~0.84 kg/L, LHV ~36.0 MJ/L)
  diesel: {
    wttCo2Fossil: 0.51,
    wttCh4Fossil: 0.0032,
    wttSo2: 0.0028,
    wttNox: 0.0016,
    ttwCo2Fossil: 2.68,
    ttwCh4Fossil: 0.00036,
    ttwN2o: 0.00014,
    ttwSo2: 0.0034,
    ttwNox: 0.0285,
    cedMjPerLiter: 42.8, // including upstream energy
    source: 'IPCC 2006 Vol. 2 / BioGrace Diesel WTW',
  },
  // Land Use Change (kg CO2 / ha / year, 25-year amortization) — RSPO PalmGHG v4
  lucKgCo2PerHaYear: {
    mineral_replanting: 0,
    shrubland: 1850,
    secondary_forest: 6400,
  } as Record<PreviousLandUse, number>,
  // Peatland drainage — IPCC 2013 Wetlands Supplement (Tropical Oil Palm)
  peatPerHaYear: {
    co2Luc: 40333, // 11 t C/ha/yr * 44/12
    ch4Biogenic: 45.0, // ditch CH4 emissions
    n2o: 1.89, // 1.2 kg N2O-N/ha/yr * 44/28
    source: 'IPCC 2013 Wetlands Supplement (Drained Tropical Peat — Oil Palm)',
  },
  // POME Anaerobic Digestion — IPCC 2006 Vol. 5 Ch. 6 & RSPO PalmGHG
  pome: {
    boKgCh4PerKgCod: 0.25,
    mcfAnaerobic: 0.8,
    captureEff: {
      open_lagoon: 0.0,
      methane_capture_flare: 0.85,
      methane_capture_biogas: 0.9,
    },
    effluentPo4KgPerM3: 0.045,
    effluentWaterReleaseFactor: {
      landApplication: 0.08, // 92% retained in soil/plant nutrient loop
      riverDischarge: 0.35, // residual discharge after aerobic polishing ponds
    },
    source: 'IPCC 2006 Vol. 5 Ch. 6 / RSPO PalmGHG v4',
  },
  // Biomass Boiler (Fiber + Shell) per ton TBS at 100% biomass steam share
  biomassBoilerPerTonFfb: {
    co2Biogenic: 285.0,
    ch4Biogenic: 0.042,
    n2o: 0.0056,
    nox: 0.38,
    so2: 0.045,
    biomassEnergyMj: 2450,
    source: 'IPCC 2006 Stationary Biomass Combustion / RSPO PalmGHG',
  },
  // EFB (22% of TBS) management per ton EFB
  efbPerTonEfb: {
    efbFractionOfFfb: 0.22,
    mulching: { ch4Biogenic: 0.12, n2o: 0.015 },
    composting: { ch4Biogenic: 0.35, n2o: 0.045, codReductionFraction: 0.12 },
    open_dumping: { ch4Biogenic: 4.2, n2o: 0.025 },
  },
};

/**
 * LCIA Characterization Matrix C (IPCC AR6/AR5 GWP100a & CML-IA Baseline)
 */
export function getImpactCategories(gwpStandard: GwpStandard): OlcaImpactCategory[] {
  const ch4BioGwp = gwpStandard === 'AR6' ? 27.0 : 28.0;
  const ch4FossilGwp = gwpStandard === 'AR6' ? 29.8 : 30.0;
  const n2oGwp = gwpStandard === 'AR6' ? 273.0 : 265.0;
  const gwpMethodLabel =
    gwpStandard === 'AR6'
      ? 'IPCC AR6 (2021) GWP 100a'
      : 'IPCC AR5 (2013) GWP 100a';

  return [
    {
      '@type': 'ImpactCategory',
      '@id': 'ic-gwp100',
      code: 'GWP100',
      name: 'Global Warming Potential (GWP 100a)',
      referenceUnit: 'kg CO2-eq',
      method: gwpMethodLabel,
      factors: [
        { flowId: 'ef-co2-fossil', value: 1.0, unit: 'kg CO2-eq/kg', source: gwpMethodLabel },
        { flowId: 'ef-co2-luc', value: 1.0, unit: 'kg CO2-eq/kg', source: gwpMethodLabel },
        { flowId: 'ef-co2-biogenic', value: 0.0, unit: 'kg CO2-eq/kg', source: 'IPCC Biogenic Neutrality' },
        { flowId: 'ef-ch4-biogenic', value: ch4BioGwp, unit: 'kg CO2-eq/kg', source: gwpMethodLabel },
        { flowId: 'ef-ch4-fossil', value: ch4FossilGwp, unit: 'kg CO2-eq/kg', source: gwpMethodLabel },
        { flowId: 'ef-n2o', value: n2oGwp, unit: 'kg CO2-eq/kg', source: gwpMethodLabel },
      ],
    },
    {
      '@type': 'ImpactCategory',
      '@id': 'ic-ap',
      code: 'AP',
      name: 'Acidification Potential (AP)',
      referenceUnit: 'kg SO2-eq',
      method: 'CML-IA Baseline v4.8',
      factors: [
        { flowId: 'ef-so2', value: 1.0, unit: 'kg SO2-eq/kg', source: 'CML-IA Baseline' },
        { flowId: 'ef-nox', value: 0.7, unit: 'kg SO2-eq/kg', source: 'CML-IA Baseline' },
        { flowId: 'ef-nh3', value: 1.88, unit: 'kg SO2-eq/kg', source: 'CML-IA Baseline' },
      ],
    },
    {
      '@type': 'ImpactCategory',
      '@id': 'ic-ep',
      code: 'EP',
      name: 'Eutrophication Potential (EP)',
      referenceUnit: 'kg PO4-eq',
      method: 'CML-IA Baseline v4.8',
      factors: [
        { flowId: 'ef-po4-water', value: 1.0, unit: 'kg PO4-eq/kg', source: 'CML-IA Baseline' },
        { flowId: 'ef-no3-water', value: 0.1, unit: 'kg PO4-eq/kg', source: 'CML-IA Baseline' },
        { flowId: 'ef-nh3', value: 0.35, unit: 'kg PO4-eq/kg', source: 'CML-IA Baseline' },
        { flowId: 'ef-nox', value: 0.13, unit: 'kg PO4-eq/kg', source: 'CML-IA Baseline' },
        { flowId: 'ef-cod-water', value: 0.022, unit: 'kg PO4-eq/kg', source: 'CML-IA Baseline' },
      ],
    },
  ];
}

export const DEFAULT_INPUTS: LcaInputParams = {
  targetCpoTonYear: 45000,
  oerPercent: 21.5,
  kerPercent: 5.0,
  allocationMethod: 'energy',
  lhvCpoMjKg: 37.0,
  lhvPkMjKg: 18.5,
  priceCpoIdrKg: 12500,
  pricePkIdrKg: 7200,
  gwpStandard: 'AR6',

  plantationAreaHa: 9500,
  ffbYieldTonHaYear: 22.0,
  ureaKgHaYear: 250,
  sp36KgHaYear: 120,
  kclKgHaYear: 280,
  dolomitKgHaYear: 200,
  herbicideKgHaYear: 2.5,
  fieldDieselLHaYear: 55,
  transportDistanceKm: 18,
  transportFuelLPerTkm: 0.075,
  enableLuc: false,
  previousLandUse: 'mineral_replanting',
  enablePeat: false,
  peatPercent: 0,

  pomeTreatment: 'open_lagoon',
  pomeVolumeM3PerTonFfb: 0.67,
  pomeCodMgL: 55000,
  pomeCodRemovalPercent: 85,
  pomeLandApplication: false,
  biomassBoilerSharePercent: 95,
  millDieselLPerTonFfb: 1.8,
  efbTreatment: 'mulching',
  millWaterM3PerTonFfb: 1.25,
};

export const SCENARIO_PRESETS: {
  id: string;
  name: string;
  summary: string;
  overrides: Partial<LcaInputParams>;
}[] = [
  {
    id: 'baseline',
    name: 'Baseline PKS Konvensional',
    summary: 'Lahan mineral, kolam POME anaerobik terbuka, boiler biomassa 95%',
    overrides: {
      enableLuc: false,
      enablePeat: false,
      peatPercent: 0,
      pomeTreatment: 'open_lagoon',
      pomeLandApplication: false,
      efbTreatment: 'mulching',
      millDieselLPerTonFfb: 1.8,
    },
  },
  {
    id: 'biogas',
    name: 'PKS Rendah Karbon (PLTBg)',
    summary: 'Methane Capture 90% + PLTBg, EFB co-composting, land application',
    overrides: {
      enableLuc: false,
      enablePeat: false,
      peatPercent: 0,
      pomeTreatment: 'methane_capture_biogas',
      pomeLandApplication: true,
      efbTreatment: 'composting',
      millDieselLPerTonFfb: 0.4,
      ureaKgHaYear: 220,
    },
  },
  {
    id: 'peat',
    name: 'Skenario Kebun Gambut (25%)',
    summary: '25% blok lahan gambut terdrainase + kolam POME terbuka',
    overrides: {
      enableLuc: false,
      enablePeat: true,
      peatPercent: 25,
      pomeTreatment: 'open_lagoon',
      pomeLandApplication: false,
      efbTreatment: 'mulching',
      millDieselLPerTonFfb: 1.8,
    },
  },
];

export const DEFAULT_REPORT_METADATA: ReportMetadata = {
  companyName: 'PT Agro Nusantara Sawit Tbk',
  millName: 'Pabrik Kelapa Sawit (PKS) Sei Kampar — Kapasitas 45 ton TBS/jam',
  location: 'Kabupaten Kampar, Provinsi Riau, Indonesia',
  contactEmail: 'sustainability@agronusantarasawit.co.id',
  website: 'https://www.agronusantarasawit.co.id',
  studyPeriod: 'Januari – Desember 2025',
  reportDate: new Date().toISOString().slice(0, 10),
  reportVersion: '01.0 (Final PROPER)',
  leadPractitioner: 'Ir. Hendra Wijaya, M.Eng. (Lead LCA Practitioner)',
  teamMembers: 'Dr. Rina Kusuma, S.T., M.Si.; Dimas Pratama, S.T. (Tim Lingkungan & Energi PKS)',
  criticalReviewDone: false,
  criticalReviewer: 'Panel Tinjauan Kritis Eksternal (Opsional sesuai ISO/TS 14071)',
};
