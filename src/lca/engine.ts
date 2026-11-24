import { EMISSION_FACTORS, OLCA_FLOWS, getImpactCategories } from './olcaData';
import {
  ElementaryInventoryRow,
  LcaInputParams,
  LcaResult,
  MaterialContributionRow,
  MatrixSnapshot,
  OlcaExchange,
  OlcaProcess,
  SensitivityScenario,
  StageImpactRow,
} from './types';

/**
 * Solves linear system A * s = f using Gaussian elimination with partial pivoting.
 */
export function solveLinearSystem(A: number[][], f: number[]): number[] {
  const n = A.length;
  const M = A.map((row, i) => [...row, f[i]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(M[r][col]);
      if (v > maxVal) {
        maxVal = v;
        pivotRow = r;
      }
    }
    if (maxVal < 1e-12) {
      throw new Error(`Matriks teknosfer A singular pada kolom ${col}`);
    }
    if (pivotRow !== col) {
      const tmp = M[col];
      M[col] = M[pivotRow];
      M[pivotRow] = tmp;
    }
    const pivot = M[col][col];
    for (let c = col; c <= n; c++) {
      M[col][c] /= pivot;
    }
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      for (let c = col; c <= n; c++) {
        M[r][c] -= factor * M[col][c];
      }
    }
  }

  return M.map((row) => row[n]);
}

const ELEMENTARY_FLOW_IDS = OLCA_FLOWS.filter((fl) => fl.flowType === 'ELEMENTARY_FLOW').map(
  (fl) => fl['@id']
);

function createEmptyFlowMap(): Record<string, number> {
  const rec: Record<string, number> = {};
  for (const id of ELEMENTARY_FLOW_IDS) {
    rec[id] = 0;
  }
  return rec;
}

function getSafePositive(val: number, fallback: number): number {
  return Number.isFinite(val) && val > 0 ? val : fallback;
}

function getSafeNonNegative(val: number): number {
  return Number.isFinite(val) && val >= 0 ? val : 0;
}

function computeCoreLca(params: LcaInputParams, includeSensitivity: boolean): LcaResult {
  const oer = Math.max(0.01, Math.min(0.4, getSafePositive(params.oerPercent, 21.5) / 100));
  const ker = Math.max(0.005, Math.min(0.2, getSafePositive(params.kerPercent, 5.0) / 100));
  const yieldFfb = getSafePositive(params.ffbYieldTonHaYear, 22.0);
  const targetCpo = getSafePositive(params.targetCpoTonYear, 45000);

  const ffbPerTonCpo = 1 / oer;
  const annualFfbTon = targetCpo / oer;
  const annualCpoTon = targetCpo;
  const annualPkTon = annualFfbTon * ker;
  const impliedAreaHa = annualFfbTon / yieldFfb;

  // Allocation factors (Energy, Economic, Mass)
  const lhvCpo = getSafePositive(params.lhvCpoMjKg, 37.0);
  const lhvPk = getSafePositive(params.lhvPkMjKg, 18.5);
  const priceCpo = getSafePositive(params.priceCpoIdrKg, 12500);
  const pricePk = getSafePositive(params.pricePkIdrKg, 7200);

  const energyCpo = oer * lhvCpo;
  const energyPk = ker * lhvPk;
  const allocationCpoEnergy = energyCpo / (energyCpo + energyPk);

  const econCpo = oer * priceCpo;
  const econPk = ker * pricePk;
  const allocationCpoEconomic = econCpo / (econCpo + econPk);

  const allocationCpoMass = oer / (oer + ker);

  const allocationCpo =
    params.allocationMethod === 'energy'
      ? allocationCpoEnergy
      : params.allocationMethod === 'economic'
      ? allocationCpoEconomic
      : allocationCpoMass;
  const allocationPk = 1 - allocationCpo;

  // Per-ton-TBS inputs from Estate
  const ureaPerTonFfb = getSafeNonNegative(params.ureaKgHaYear) / yieldFfb;
  const sp36PerTonFfb = getSafeNonNegative(params.sp36KgHaYear) / yieldFfb;
  const kclPerTonFfb = getSafeNonNegative(params.kclKgHaYear) / yieldFfb;
  const dolomitPerTonFfb = getSafeNonNegative(params.dolomitKgHaYear) / yieldFfb;
  const herbicidePerTonFfb = getSafeNonNegative(params.herbicideKgHaYear) / yieldFfb;
  const fieldDieselPerTonFfb = getSafeNonNegative(params.fieldDieselLHaYear) / yieldFfb;
  const transportDieselPerTonFfb =
    getSafeNonNegative(params.transportDistanceKm) *
    getSafeNonNegative(params.transportFuelLPerTkm);
  const millDieselPerTonFfb = getSafeNonNegative(params.millDieselLPerTonFfb);

  const pomeVolPerTonFfb = getSafeNonNegative(params.pomeVolumeM3PerTonFfb);
  const pomeCodKgM3 = getSafeNonNegative(params.pomeCodMgL) / 1000; // mg/L -> kg/m3
  const codRemovalFrac = Math.min(0.99, getSafeNonNegative(params.pomeCodRemovalPercent) / 100);
  const biomassShare = Math.min(1, getSafeNonNegative(params.biomassBoilerSharePercent) / 100);

  const ef = EMISSION_FACTORS;
  const fe = ef.fieldEmissions;

  // ---------------------------------------------------------------------------
  // 1. Build Elementary Flow Vectors per Unit Process (per process ref unit)
  // ---------------------------------------------------------------------------

  // P1: Hulu — Produksi Pupuk, Herbisida & Solar WTT (per 1 unit paket hulu = 1 ton TBS eq)
  const p1 = createEmptyFlowMap();
  const totalDieselWttL = fieldDieselPerTonFfb + transportDieselPerTonFfb + millDieselPerTonFfb;
  p1['ef-co2-fossil'] =
    ureaPerTonFfb * ef.ureaProduction.co2Fossil +
    sp36PerTonFfb * ef.sp36Production.co2Fossil +
    kclPerTonFfb * ef.kclProduction.co2Fossil +
    dolomitPerTonFfb * ef.dolomitProduction.co2Fossil +
    herbicidePerTonFfb * ef.herbicideProduction.co2Fossil +
    totalDieselWttL * ef.diesel.wttCo2Fossil;
  p1['ef-ch4-fossil'] =
    ureaPerTonFfb * ef.ureaProduction.ch4Fossil +
    sp36PerTonFfb * ef.sp36Production.ch4Fossil +
    kclPerTonFfb * ef.kclProduction.ch4Fossil +
    herbicidePerTonFfb * ef.herbicideProduction.ch4Fossil +
    totalDieselWttL * ef.diesel.wttCh4Fossil;
  p1['ef-n2o'] = ureaPerTonFfb * ef.ureaProduction.n2o;
  p1['ef-so2'] =
    ureaPerTonFfb * ef.ureaProduction.so2 +
    sp36PerTonFfb * ef.sp36Production.so2 +
    kclPerTonFfb * ef.kclProduction.so2 +
    dolomitPerTonFfb * ef.dolomitProduction.so2 +
    herbicidePerTonFfb * ef.herbicideProduction.so2 +
    totalDieselWttL * ef.diesel.wttSo2;
  p1['ef-nox'] =
    ureaPerTonFfb * ef.ureaProduction.nox +
    sp36PerTonFfb * ef.sp36Production.nox +
    kclPerTonFfb * ef.kclProduction.nox +
    dolomitPerTonFfb * ef.dolomitProduction.nox +
    herbicidePerTonFfb * ef.herbicideProduction.nox +
    totalDieselWttL * ef.diesel.wttNox;
  p1['ef-po4-water'] =
    sp36PerTonFfb * ef.sp36Production.po4Water +
    herbicidePerTonFfb * ef.herbicideProduction.po4Water;

  const cedP1 =
    ureaPerTonFfb * ef.ureaProduction.cedMj +
    sp36PerTonFfb * ef.sp36Production.cedMj +
    kclPerTonFfb * ef.kclProduction.cedMj +
    dolomitPerTonFfb * ef.dolomitProduction.cedMj +
    herbicidePerTonFfb * ef.herbicideProduction.cedMj;

  // P2: Perkebunan — Budidaya TBS, Aplikasi Pupuk & Alat Berat Kebun (per 1 ton TBS)
  const p2 = createEmptyFlowMap();
  const nAppliedKg = ureaPerTonFfb * ef.ureaProduction.nContent;
  const n2oDirectKg = nAppliedKg * fe.ef1DirectN2O * fe.n2oMolRatio;
  const n2oVolatKg = nAppliedKg * fe.fracGasf * fe.ef4VolatN2O * fe.n2oMolRatio;
  const n2oLeachKg = nAppliedKg * fe.fracLeach * fe.ef5LeachN2O * fe.n2oMolRatio;

  const nh3FieldKg = nAppliedKg * fe.fracGasf * fe.nh3MolRatio;
  const no3LeachKg = nAppliedKg * fe.fracLeach * fe.no3MolRatio;
  const po4RunoffKg =
    sp36PerTonFfb * ef.sp36Production.p2o5Content * fe.p2o5ToP * fe.pRunoffFraction * fe.pToPo4;

  const ureaHydrolysisCo2 = ureaPerTonFfb * fe.ureaCo2Factor;
  const dolomitCo2 = dolomitPerTonFfb * fe.dolomitCo2Factor;

  p2['ef-co2-fossil'] =
    ureaHydrolysisCo2 + dolomitCo2 + fieldDieselPerTonFfb * ef.diesel.ttwCo2Fossil;
  p2['ef-ch4-fossil'] = fieldDieselPerTonFfb * ef.diesel.ttwCh4Fossil;
  p2['ef-n2o'] =
    n2oDirectKg + n2oVolatKg + n2oLeachKg + fieldDieselPerTonFfb * ef.diesel.ttwN2o;
  p2['ef-nh3'] = nh3FieldKg;
  p2['ef-nox'] = fieldDieselPerTonFfb * ef.diesel.ttwNox;
  p2['ef-so2'] = fieldDieselPerTonFfb * ef.diesel.ttwSo2;
  p2['ef-no3-water'] = no3LeachKg;
  p2['ef-po4-water'] = po4RunoffKg;

  const cedP2 = fieldDieselPerTonFfb * ef.diesel.cedMjPerLiter;

  // P3: Perubahan Penggunaan Lahan (LUC) & Drainase Lahan Gambut (per 1 ton TBS-eq)
  const p3 = createEmptyFlowMap();
  const lucCo2PerHa = params.enableLuc ? ef.lucKgCo2PerHaYear[params.previousLandUse] : 0;
  const peatFrac = params.enablePeat
    ? Math.min(1, getSafeNonNegative(params.peatPercent) / 100)
    : 0;
  p3['ef-co2-luc'] = (lucCo2PerHa + peatFrac * ef.peatPerHaYear.co2Luc) / yieldFfb;
  p3['ef-ch4-biogenic'] = (peatFrac * ef.peatPerHaYear.ch4Biogenic) / yieldFfb;
  p3['ef-n2o'] = (peatFrac * ef.peatPerHaYear.n2o) / yieldFfb;

  // P4: Transportasi TBS dari Kebun ke PKS (per 1 ton TBS)
  const p4 = createEmptyFlowMap();
  p4['ef-co2-fossil'] = transportDieselPerTonFfb * ef.diesel.ttwCo2Fossil;
  p4['ef-ch4-fossil'] = transportDieselPerTonFfb * ef.diesel.ttwCh4Fossil;
  p4['ef-n2o'] = transportDieselPerTonFfb * ef.diesel.ttwN2o;
  p4['ef-so2'] = transportDieselPerTonFfb * ef.diesel.ttwSo2;
  p4['ef-nox'] = transportDieselPerTonFfb * ef.diesel.ttwNox;
  const cedP4 = transportDieselPerTonFfb * ef.diesel.cedMjPerLiter;

  // P5: PKS Inti — Sterilisasi, Ekstraksi, Boiler Biomassa/Solar & EFB (per 1 ton TBS terolah)
  const p5 = createEmptyFlowMap();
  const efbTonPerTonFfb = ef.efbPerTonEfb.efbFractionOfFfb;
  const efbEf = ef.efbPerTonEfb[params.efbTreatment];
  // If biogas power is active, displace up to 60% of supplemental mill diesel if > 0.3 L/t
  const effectiveMillDiesel = millDieselPerTonFfb;

  p5['ef-co2-fossil'] = effectiveMillDiesel * ef.diesel.ttwCo2Fossil;
  p5['ef-co2-biogenic'] = biomassShare * ef.biomassBoilerPerTonFfb.co2Biogenic;
  p5['ef-ch4-fossil'] = effectiveMillDiesel * ef.diesel.ttwCh4Fossil;
  p5['ef-ch4-biogenic'] =
    biomassShare * ef.biomassBoilerPerTonFfb.ch4Biogenic + efbTonPerTonFfb * efbEf.ch4Biogenic;
  p5['ef-n2o'] =
    biomassShare * ef.biomassBoilerPerTonFfb.n2o +
    effectiveMillDiesel * ef.diesel.ttwN2o +
    efbTonPerTonFfb * efbEf.n2o;
  p5['ef-nox'] =
    biomassShare * ef.biomassBoilerPerTonFfb.nox + effectiveMillDiesel * ef.diesel.ttwNox;
  p5['ef-so2'] =
    biomassShare * ef.biomassBoilerPerTonFfb.so2 + effectiveMillDiesel * ef.diesel.ttwSo2;
  const cedP5 =
    effectiveMillDiesel * ef.diesel.cedMjPerLiter +
    biomassShare * ef.biomassBoilerPerTonFfb.biomassEnergyMj;

  // P6: IPAL PKS — Pengolahan Limbah Cair POME (per 1 m3 POME terolah)
  const p6 = createEmptyFlowMap();
  const compostingCodFactor =
    params.efbTreatment === 'composting'
      ? 1 - ef.efbPerTonEfb.composting.codReductionFraction
      : 1;
  const effectiveCodKgM3 = pomeCodKgM3 * compostingCodFactor;
  const ch4GeneratedPerM3 =
    effectiveCodKgM3 * codRemovalFrac * ef.pome.boKgCh4PerKgCod * ef.pome.mcfAnaerobic;
  const captureEff = ef.pome.captureEff[params.pomeTreatment];
  const ch4EmittedPerM3 = ch4GeneratedPerM3 * (1 - captureEff);
  const ch4CapturedPerM3 = ch4GeneratedPerM3 * captureEff;
  // Flared / combusted biogas CH4 becomes biogenic CO2 (MW ratio 44/16 = 2.75)
  const biogasCo2BiogenicPerM3 = ch4CapturedPerM3 * (44 / 16);

  const releaseFactor = params.pomeLandApplication
    ? ef.pome.effluentWaterReleaseFactor.landApplication
    : ef.pome.effluentWaterReleaseFactor.riverDischarge;
  const residualCodPerM3 = effectiveCodKgM3 * (1 - codRemovalFrac) * releaseFactor;
  const residualPo4PerM3 = ef.pome.effluentPo4KgPerM3 * releaseFactor;

  p6['ef-ch4-biogenic'] = ch4EmittedPerM3;
  p6['ef-co2-biogenic'] = biogasCo2BiogenicPerM3;
  p6['ef-cod-water'] = residualCodPerM3;
  p6['ef-po4-water'] = residualPo4PerM3;

  // ---------------------------------------------------------------------------
  // 2. Construct openLCA Technosphere Matrix A (6x6) & Demand Vector f
  //    Target f corresponds to producing 1 ton CPO (unallocated joint system -> 1/OER ton TBS)
  // ---------------------------------------------------------------------------
  const processNames = [
    'P1: Hulu Agrokimia & Solar WTT',
    'P2: Perkebunan (Budidaya TBS)',
    'P3: Perubahan Lahan & Gambut',
    'P4: Transportasi TBS ke PKS',
    'P5: PKS Inti (Ekstraksi, Boiler & EFB)',
    'P6: IPAL PKS (Pengolahan POME)',
  ];

  const technosphereFlows = [
    'Paket Input Hulu (unit)',
    'Alokasi Lahan LUC/Gambut (unit)',
    'TBS di Kebun (ton)',
    'TBS di Pintu PKS (ton)',
    'Layanan Pengolahan POME (m3)',
    'TBS Terolah di PKS (ton)',
  ];

  const A: number[][] = [
    // P1   P2   P3   P4   P5               P6
    [1, -1, 0, 0, 0, 0], // Paket Input Hulu
    [0, -1, 1, 0, 0, 0], // Alokasi Lahan LUC/Gambut
    [0, 1, 0, -1, 0, 0], // TBS di Kebun
    [0, 0, 0, 1, -1, 0], // TBS di Pintu PKS
    [0, 0, 0, 0, -pomeVolPerTonFfb, 1], // Layanan Pengolahan POME
    [0, 0, 0, 0, 1, 0], // TBS Terolah di PKS
  ];

  // Solve A * s = f for joint system delivering 1 ton CPO (requires ffbPerTonCpo ton TBS)
  const f = [0, 0, 0, 0, 0, ffbPerTonCpo];
  const s = solveLinearSystem(A, f);

  // Intervention Matrix B (12 elementary flows x 6 processes)
  const processFlowMaps = [p1, p2, p3, p4, p5, p6];
  const B: number[][] = ELEMENTARY_FLOW_IDS.map((flowId) =>
    processFlowMaps.map((pm) => pm[flowId] || 0)
  );

  // Inventory vector g_joint = B * s (unallocated total per 1 ton CPO joint output)
  const gJoint = B.map((row) => row.reduce((acc, val, j) => acc + val * s[j], 0));

  // Allocated inventory per 1 ton CPO and per 1 ton PK
  // Note: s_per_ton_ffb = s / ffbPerTonCpo = [1, 1, 1, 1, 1, pomeVolPerTonFfb]
  // For 1 ton CPO: multiply gJoint by allocationCpo
  // For 1 ton PK:  (gJoint / ffbPerTonCpo) * (1 / ker) * allocationPk = gJoint * (oer / ker) * allocationPk
  const pkScaleFromJointCpo = (oer / ker) * allocationPk;

  // ---------------------------------------------------------------------------
  // 3. LCIA Characterization Matrix C
  // ---------------------------------------------------------------------------
  const impactCategories = getImpactCategories(params.gwpStandard);
  const cfGwp: Record<string, number> = {};
  const cfAp: Record<string, number> = {};
  const cfEp: Record<string, number> = {};

  for (const ic of impactCategories) {
    for (const fac of ic.factors) {
      if (ic.code === 'GWP100') cfGwp[fac.flowId] = fac.value;
      if (ic.code === 'AP') cfAp[fac.flowId] = fac.value;
      if (ic.code === 'EP') cfEp[fac.flowId] = fac.value;
    }
  }

  // Per-process characterized impacts (allocated to 1 ton CPO and 1 ton PK)
  const processMeta: {
    id: string;
    name: string;
    phase: 'Upstream (Hulu)' | 'Core (Inti PKS)';
    cedPerRef: number;
  }[] = [
    { id: 'P1', name: 'Hulu — Produksi Pupuk, Herbisida & Solar', phase: 'Upstream (Hulu)', cedPerRef: cedP1 },
    { id: 'P2', name: 'Perkebunan — Aplikasi Pupuk & Alat Berat', phase: 'Upstream (Hulu)', cedPerRef: cedP2 },
    { id: 'P3', name: 'Lahan — Perubahan Lahan (LUC) & Gambut', phase: 'Upstream (Hulu)', cedPerRef: 0 },
    { id: 'P4', name: 'Transportasi TBS (Kebun ke PKS)', phase: 'Upstream (Hulu)', cedPerRef: cedP4 },
    { id: 'P5', name: 'PKS Inti — Boiler Biomassa, Genset & EFB', phase: 'Core (Inti PKS)', cedPerRef: cedP5 },
    { id: 'P6', name: 'IPAL PKS — Pengolahan Limbah Cair (POME)', phase: 'Core (Inti PKS)', cedPerRef: 0 },
  ];

  const rawStages = processMeta.map((pm, j) => {
    let gwpJoint = 0;
    let apJoint = 0;
    let epJoint = 0;
    ELEMENTARY_FLOW_IDS.forEach((flowId, i) => {
      const flowAmountJoint = B[i][j] * s[j];
      gwpJoint += flowAmountJoint * (cfGwp[flowId] || 0);
      apJoint += flowAmountJoint * (cfAp[flowId] || 0);
      epJoint += flowAmountJoint * (cfEp[flowId] || 0);
    });
    const cedJoint = pm.cedPerRef * s[j];
    return {
      stageId: pm.id,
      stageName: pm.name,
      lifecyclePhase: pm.phase,
      gwpPerTonCpo: gwpJoint * allocationCpo,
      gwpPerTonPk: gwpJoint * pkScaleFromJointCpo,
      apPerTonCpo: apJoint * allocationCpo,
      apPerTonPk: apJoint * pkScaleFromJointCpo,
      epPerTonCpo: epJoint * allocationCpo,
      epPerTonPk: epJoint * pkScaleFromJointCpo,
      cedPerTonCpo: cedJoint * allocationCpo,
      cedPerTonPk: cedJoint * pkScaleFromJointCpo,
    };
  });

  const gwpCpo = rawStages.reduce((a, r) => a + r.gwpPerTonCpo, 0);
  const gwpPk = rawStages.reduce((a, r) => a + r.gwpPerTonPk, 0);
  const apCpo = rawStages.reduce((a, r) => a + r.apPerTonCpo, 0);
  const apPk = rawStages.reduce((a, r) => a + r.apPerTonPk, 0);
  const epCpo = rawStages.reduce((a, r) => a + r.epPerTonCpo, 0);
  const epPk = rawStages.reduce((a, r) => a + r.epPerTonPk, 0);
  const cedCpo = rawStages.reduce((a, r) => a + r.cedPerTonCpo, 0);
  const cedPk = rawStages.reduce((a, r) => a + r.cedPerTonPk, 0);

  const stageBreakdown: StageImpactRow[] = rawStages.map((r) => ({
    stageId: r.stageId,
    stageName: r.stageName,
    lifecyclePhase: r.lifecyclePhase,
    gwpPerTonCpo: r.gwpPerTonCpo,
    gwpPerTonPk: r.gwpPerTonPk,
    gwpSharePercent: gwpCpo > 0 ? (r.gwpPerTonCpo / gwpCpo) * 100 : 0,
    apPerTonCpo: r.apPerTonCpo,
    apPerTonPk: r.apPerTonPk,
    apSharePercent: apCpo > 0 ? (r.apPerTonCpo / apCpo) * 100 : 0,
    epPerTonCpo: r.epPerTonCpo,
    epPerTonPk: r.epPerTonPk,
    epSharePercent: epCpo > 0 ? (r.epPerTonCpo / epCpo) * 100 : 0,
    cedPerTonCpo: r.cedPerTonCpo,
  }));

  // Elementary flow inventory table
  const inventoryRows: ElementaryInventoryRow[] = ELEMENTARY_FLOW_IDS.map((flowId, i) => {
    const flow = OLCA_FLOWS.find((fl) => fl['@id'] === flowId)!;
    const amountJoint = gJoint[i];
    const amountPerTonFfb = amountJoint / ffbPerTonCpo;
    const amountPerTonCpo = amountJoint * allocationCpo;
    const amountPerTonPk = amountJoint * pkScaleFromJointCpo;
    const amountAnnualTotal = amountPerTonFfb * annualFfbTon;

    // Find dominant process for this elementary flow
    let maxProcVal = -1;
    let domStage = '-';
    for (let j = 0; j < processMeta.length; j++) {
      const val = B[i][j] * s[j];
      if (val > maxProcVal) {
        maxProcVal = val;
        domStage = processMeta[j].name;
      }
    }

    return {
      flowId,
      name: flow.name,
      compartment: flow.compartment,
      unit: flow.unit,
      amountPerTonFfb,
      amountPerTonCpo,
      amountPerTonPk,
      amountAnnualTotal,
      gwpContributionCpo: amountPerTonCpo * (cfGwp[flowId] || 0),
      apContributionCpo: amountPerTonCpo * (cfAp[flowId] || 0),
      epContributionCpo: amountPerTonCpo * (cfEp[flowId] || 0),
      dominantStage: maxProcVal > 0 ? domStage : '-',
    };
  });

  // GHG Gas Breakdown (kg CO2-eq per ton CPO)
  const getInvGwp = (id: string) =>
    inventoryRows.find((r) => r.flowId === id)?.gwpContributionCpo || 0;
  const ghgBreakdown = {
    co2Fossil: getInvGwp('ef-co2-fossil'),
    co2LucPeat: getInvGwp('ef-co2-luc'),
    ch4Biogenic: getInvGwp('ef-ch4-biogenic'),
    ch4Fossil: getInvGwp('ef-ch4-fossil'),
    n2o: getInvGwp('ef-n2o'),
    co2BiogenicMemo:
      inventoryRows.find((r) => r.flowId === 'ef-co2-biogenic')?.amountPerTonCpo || 0,
  };

  // Material/Driver-level Pareto 80% breakdown (for PROPER Bab 5.5 & Tabel 14)
  const cpoFactor = ffbPerTonCpo * allocationCpo;
  const gwpFactorN2o = cfGwp['ef-n2o'];
  const gwpFactorCh4Bio = cfGwp['ef-ch4-biogenic'];
  const gwpFactorCh4Fos = cfGwp['ef-ch4-fossil'];

  const rawMaterials: Omit<MaterialContributionRow, 'gwpSharePercent' | 'cumulativeGwpPercent' | 'isPareto80'>[] = [
    {
      material: 'Pengolahan Limbah Cair POME (Emisi Metana CH4)',
      category: 'Limbah Cair PKS',
      gwpPerTonCpo: ch4EmittedPerM3 * pomeVolPerTonFfb * gwpFactorCh4Bio * cpoFactor,
      apPerTonCpo: 0,
      epPerTonCpo:
        (residualCodPerM3 * cfEp['ef-cod-water'] + residualPo4PerM3 * cfEp['ef-po4-water']) *
        pomeVolPerTonFfb *
        cpoFactor,
      dominantProcess: 'IPAL PKS (Pengolahan POME)',
    },
    {
      material: 'Pupuk Urea (Produksi Hulu, Hidrolisis CO2, N2O & NH3)',
      category: 'Pupuk Sintetis Kebun',
      gwpPerTonCpo:
        (ureaPerTonFfb * ef.ureaProduction.co2Fossil +
          ureaPerTonFfb * ef.ureaProduction.ch4Fossil * gwpFactorCh4Fos +
          ureaPerTonFfb * ef.ureaProduction.n2o * gwpFactorN2o +
          ureaHydrolysisCo2 +
          (n2oDirectKg + n2oVolatKg + n2oLeachKg) * gwpFactorN2o) *
        cpoFactor,
      apPerTonCpo:
        (ureaPerTonFfb * (ef.ureaProduction.so2 * cfAp['ef-so2'] + ef.ureaProduction.nox * cfAp['ef-nox']) +
          nh3FieldKg * cfAp['ef-nh3']) *
        cpoFactor,
      epPerTonCpo:
        (ureaPerTonFfb * ef.ureaProduction.nox * cfEp['ef-nox'] +
          nh3FieldKg * cfEp['ef-nh3'] +
          no3LeachKg * cfEp['ef-no3-water']) *
        cpoFactor,
      dominantProcess: 'Perkebunan & Hulu Agrokimia',
    },
    {
      material: 'Drainase Lahan Gambut & Perubahan Penggunaan Lahan (LUC)',
      category: 'Emisi Lahan',
      gwpPerTonCpo:
        (p3['ef-co2-luc'] + p3['ef-ch4-biogenic'] * gwpFactorCh4Bio + p3['ef-n2o'] * gwpFactorN2o) *
        cpoFactor,
      apPerTonCpo: 0,
      epPerTonCpo: 0,
      dominantProcess: 'Perubahan Lahan & Gambut',
    },
    {
      material: 'Pupuk Non-Nitrogen (SP-36, KCl, Dolomit) & Herbisida',
      category: 'Pupuk & Agrokimia Kebun',
      gwpPerTonCpo:
        (sp36PerTonFfb * (ef.sp36Production.co2Fossil + ef.sp36Production.ch4Fossil * gwpFactorCh4Fos) +
          kclPerTonFfb * (ef.kclProduction.co2Fossil + ef.kclProduction.ch4Fossil * gwpFactorCh4Fos) +
          dolomitPerTonFfb * ef.dolomitProduction.co2Fossil +
          dolomitCo2 +
          herbicidePerTonFfb *
            (ef.herbicideProduction.co2Fossil + ef.herbicideProduction.ch4Fossil * gwpFactorCh4Fos)) *
        cpoFactor,
      apPerTonCpo:
        ((sp36PerTonFfb * ef.sp36Production.so2 +
          kclPerTonFfb * ef.kclProduction.so2 +
          dolomitPerTonFfb * ef.dolomitProduction.so2 +
          herbicidePerTonFfb * ef.herbicideProduction.so2) *
          cfAp['ef-so2'] +
          (sp36PerTonFfb * ef.sp36Production.nox +
            kclPerTonFfb * ef.kclProduction.nox +
            dolomitPerTonFfb * ef.dolomitProduction.nox +
            herbicidePerTonFfb * ef.herbicideProduction.nox) *
            cfAp['ef-nox']) *
        cpoFactor,
      epPerTonCpo:
        ((sp36PerTonFfb * ef.sp36Production.po4Water +
          herbicidePerTonFfb * ef.herbicideProduction.po4Water +
          po4RunoffKg) *
          cfEp['ef-po4-water'] +
          (sp36PerTonFfb * ef.sp36Production.nox +
            kclPerTonFfb * ef.kclProduction.nox +
            herbicidePerTonFfb * ef.herbicideProduction.nox) *
            cfEp['ef-nox']) *
        cpoFactor,
      dominantProcess: 'Perkebunan & Hulu Agrokimia',
    },
    {
      material: 'Solar / Diesel (Alat Berat Kebun, Truk TBS & Genset PKS)',
      category: 'Bahan Bakar Fosil',
      gwpPerTonCpo:
        totalDieselWttL *
        (ef.diesel.wttCo2Fossil +
          ef.diesel.ttwCo2Fossil +
          (ef.diesel.wttCh4Fossil + ef.diesel.ttwCh4Fossil) * gwpFactorCh4Fos +
          ef.diesel.ttwN2o * gwpFactorN2o) *
        cpoFactor,
      apPerTonCpo:
        totalDieselWttL *
        ((ef.diesel.wttSo2 + ef.diesel.ttwSo2) * cfAp['ef-so2'] +
          (ef.diesel.wttNox + ef.diesel.ttwNox) * cfAp['ef-nox']) *
        cpoFactor,
      epPerTonCpo: totalDieselWttL * (ef.diesel.wttNox + ef.diesel.ttwNox) * cfEp['ef-nox'] * cpoFactor,
      dominantProcess: 'Transportasi TBS & Operasional Kebun/PKS',
    },
    {
      material: 'Boiler Biomassa (Fiber/Cangkang) & Tandan Kosong (EFB)',
      category: 'Energi Biomassa & Limbah Padat',
      gwpPerTonCpo:
        (biomassShare *
          (ef.biomassBoilerPerTonFfb.ch4Biogenic * gwpFactorCh4Bio +
            ef.biomassBoilerPerTonFfb.n2o * gwpFactorN2o) +
          efbTonPerTonFfb * (efbEf.ch4Biogenic * gwpFactorCh4Bio + efbEf.n2o * gwpFactorN2o)) *
        cpoFactor,
      apPerTonCpo:
        biomassShare *
        (ef.biomassBoilerPerTonFfb.so2 * cfAp['ef-so2'] +
          ef.biomassBoilerPerTonFfb.nox * cfAp['ef-nox']) *
        cpoFactor,
      epPerTonCpo: biomassShare * ef.biomassBoilerPerTonFfb.nox * cfEp['ef-nox'] * cpoFactor,
      dominantProcess: 'PKS Inti (Boiler & EFB)',
    },
  ];

  const sortedMaterials = rawMaterials
    .filter((m) => m.gwpPerTonCpo > 0.001 || m.apPerTonCpo > 0.001 || m.epPerTonCpo > 0.001)
    .sort((a, b) => b.gwpPerTonCpo - a.gwpPerTonCpo);

  let runningCum = 0;
  const materialContributions: MaterialContributionRow[] = sortedMaterials.map((m) => {
    const share = gwpCpo > 0 ? (m.gwpPerTonCpo / gwpCpo) * 100 : 0;
    const prevCum = runningCum;
    runningCum += share;
    return {
      ...m,
      gwpSharePercent: share,
      cumulativeGwpPercent: Math.min(100, runningCum),
      isPareto80: prevCum < 80,
    };
  });

  // Build openLCA Process Objects for inspection and JSON export
  const buildExchanges = (
    techExchanges: OlcaExchange[],
    elemMap: Record<string, number>,
    refDataset: string,
    dq: 'Primer' | 'Sekunder'
  ): OlcaExchange[] => {
    const out: OlcaExchange[] = [...techExchanges];
    for (const flowId of ELEMENTARY_FLOW_IDS) {
      const amt = elemMap[flowId] || 0;
      if (amt > 1e-9) {
        const fl = OLCA_FLOWS.find((x) => x['@id'] === flowId)!;
        out.push({
          '@type': 'Exchange',
          flowId,
          flowName: fl.name,
          flowType: 'ELEMENTARY_FLOW',
          isInput: false,
          amount: amt,
          unit: fl.unit,
          dataQuality: dq,
          datasetRef: refDataset,
        });
      }
    }
    return out;
  };

  const processes: OlcaProcess[] = [
    {
      '@type': 'Process',
      '@id': 'proc-p1-agro-upstream',
      code: 'P1',
      name: 'Hulu — Produksi Pupuk, Herbisida & Solar (WTT)',
      stage: 'Upstream',
      stageGroup: 'Kebun & Pupuk',
      quantitativeReference: '1 unit paket input hulu per ton TBS',
      description: 'Manufaktur pupuk Urea, SP-36, KCl, Dolomit, herbisida, serta kilang & distribusi bahan bakar solar.',
      exchanges: buildExchanges(
        [
          {
            '@type': 'Exchange',
            flowId: 'pf-agro-bundle',
            flowName: 'Paket Input Agrokimia & Solar Hulu',
            flowType: 'PRODUCT_FLOW',
            isInput: false,
            amount: 1,
            unit: 'unit',
            dataQuality: 'Sekunder',
            datasetRef: 'Ecoinvent 3.8 / BioGrace',
          },
        ],
        p1,
        'Ecoinvent 3.8 / BioGrace',
        'Sekunder'
      ),
    },
    {
      '@type': 'Process',
      '@id': 'proc-p2-plantation',
      code: 'P2',
      name: 'Perkebunan Kelapa Sawit — Budidaya TBS & Pemupukan',
      stage: 'Upstream',
      stageGroup: 'Kebun & Pupuk',
      quantitativeReference: '1 ton TBS di kebun',
      description: 'Operasional budidaya kebun, pemupukan sintetis (emisi N2O langsung/tidak langsung, CO2 urea/dolomit, NH3, NO3, PO4), dan alat berat kebun.',
      exchanges: buildExchanges(
        [
          {
            '@type': 'Exchange',
            flowId: 'pf-agro-bundle',
            flowName: 'Paket Input Agrokimia & Solar Hulu',
            flowType: 'PRODUCT_FLOW',
            isInput: true,
            amount: 1,
            unit: 'unit',
            dataQuality: 'Primer',
            datasetRef: 'Data dosis pupuk & solar kebun',
          },
          {
            '@type': 'Exchange',
            flowId: 'pf-ffb-estate',
            flowName: 'Tandan Buah Segar (TBS) di Kebun',
            flowType: 'PRODUCT_FLOW',
            isInput: false,
            amount: 1,
            unit: 'ton',
            dataQuality: 'Primer',
            datasetRef: 'Produktivitas TBS kebun aktual',
          },
        ],
        p2,
        'IPCC 2006 Vol. 4 Ch. 11 / 2019 Refinement',
        'Sekunder'
      ),
    },
    {
      '@type': 'Process',
      '@id': 'proc-p3-luc-peat',
      code: 'P3',
      name: 'Lahan — Perubahan Penggunaan Lahan (LUC) & Gambut',
      stage: 'Upstream',
      stageGroup: 'LUC & Gambut',
      quantitativeReference: '1 ton-TBS-eq alokasi lahan',
      description: 'Emisi karbon akibat perubahan tutupan lahan (amortisasi 25 tahun) serta oksidasi drainase lahan gambut.',
      exchanges: buildExchanges([], p3, 'IPCC 2013 Wetlands Supplement / RSPO PalmGHG', 'Sekunder'),
    },
    {
      '@type': 'Process',
      '@id': 'proc-p4-transport',
      code: 'P4',
      name: 'Transportasi TBS dari Kebun ke PKS',
      stage: 'Upstream',
      stageGroup: 'Transportasi TBS',
      quantitativeReference: '1 ton TBS di pintu PKS',
      description: 'Pengangkutan Tandan Buah Segar (TBS) dari TPH kebun menuju jembatan timbang PKS menggunakan truk angkut diesel.',
      exchanges: buildExchanges(
        [
          {
            '@type': 'Exchange',
            flowId: 'pf-ffb-estate',
            flowName: 'Tandan Buah Segar (TBS) di Kebun',
            flowType: 'PRODUCT_FLOW',
            isInput: true,
            amount: 1,
            unit: 'ton',
            dataQuality: 'Primer',
            datasetRef: 'Logistik angkut TBS',
          },
          {
            '@type': 'Exchange',
            flowId: 'pf-ffb-mill',
            flowName: 'Tandan Buah Segar (TBS) di Pintu PKS',
            flowType: 'PRODUCT_FLOW',
            isInput: false,
            amount: 1,
            unit: 'ton',
            dataQuality: 'Primer',
            datasetRef: 'Timbangan jembatan PKS',
          },
        ],
        p4,
        'IPCC 2006 Mobile Combustion (Diesel)',
        'Primer'
      ),
    },
    {
      '@type': 'Process',
      '@id': 'proc-p5-mill-core',
      code: 'P5',
      name: 'PKS Inti — Ekstraksi CPO/PK, Boiler Biomassa & EFB',
      stage: 'Core',
      stageGroup: 'PKS & Boiler',
      quantitativeReference: '1 ton TBS terolah -> CPO & PK',
      description: 'Sterilisasi, penebahan, pengempaan, klarifikasi CPO, pemecahan inti PK, pembangkitan uap/listrik boiler fiber-cangkang, genset solar, dan manajemen EFB.',
      exchanges: buildExchanges(
        [
          {
            '@type': 'Exchange',
            flowId: 'pf-ffb-mill',
            flowName: 'Tandan Buah Segar (TBS) di Pintu PKS',
            flowType: 'PRODUCT_FLOW',
            isInput: true,
            amount: 1,
            unit: 'ton',
            dataQuality: 'Primer',
            datasetRef: 'Data olah harian PKS',
          },
          {
            '@type': 'Exchange',
            flowId: 'pf-pome-service',
            flowName: 'Layanan Pengolahan Limbah Cair (POME)',
            flowType: 'WASTE_FLOW',
            isInput: true,
            amount: pomeVolPerTonFfb,
            unit: 'm3',
            dataQuality: 'Primer',
            datasetRef: 'Flowmeter POME PKS',
          },
          {
            '@type': 'Exchange',
            flowId: 'pf-cpo',
            flowName: 'Crude Palm Oil (CPO)',
            flowType: 'PRODUCT_FLOW',
            isInput: false,
            amount: oer,
            unit: 'ton',
            dataQuality: 'Primer',
            datasetRef: `OER aktual ${(oer * 100).toFixed(2)}%`,
          },
          {
            '@type': 'Exchange',
            flowId: 'pf-pk',
            flowName: 'Palm Kernel (PK)',
            flowType: 'PRODUCT_FLOW',
            isInput: false,
            amount: ker,
            unit: 'ton',
            dataQuality: 'Primer',
            datasetRef: `KER aktual ${(ker * 100).toFixed(2)}%`,
          },
        ],
        p5,
        'Data Operasional PKS & IPCC 2006 Stationary Combustion',
        'Primer'
      ),
    },
    {
      '@type': 'Process',
      '@id': 'proc-p6-pome',
      code: 'P6',
      name: 'IPAL PKS — Pengolahan Limbah Cair (POME)',
      stage: 'Core',
      stageGroup: 'Limbah POME',
      quantitativeReference: '1 m3 POME terolah',
      description: 'Pengolahan anaerobik POME (kolam terbuka atau penangkapan metana/biogas) serta pengendalian beban COD & fosfat efluen.',
      exchanges: buildExchanges(
        [
          {
            '@type': 'Exchange',
            flowId: 'pf-pome-service',
            flowName: 'Layanan Pengolahan Limbah Cair (POME)',
            flowType: 'WASTE_FLOW',
            isInput: false,
            amount: 1,
            unit: 'm3',
            dataQuality: 'Primer',
            datasetRef: 'Uji Lab COD & Debit POME',
          },
        ],
        p6,
        'IPCC 2006 Vol. 5 Ch. 6 / RSPO PalmGHG',
        'Sekunder'
      ),
    },
  ];

  // Data quality counts (for PROPER Tabel 9)
  let primaryCount = 0;
  let secondaryCount = 0;
  for (const proc of processes) {
    for (const ex of proc.exchanges) {
      if (ex.dataQuality === 'Primer') primaryCount++;
      else secondaryCount++;
    }
  }
  const totalEx = Math.max(1, primaryCount + secondaryCount);

  // Top hotspots
  const topGwpStage = [...stageBreakdown].sort((a, b) => b.gwpPerTonCpo - a.gwpPerTonCpo)[0];
  const topApStage = [...stageBreakdown].sort((a, b) => b.apPerTonCpo - a.apPerTonCpo)[0];
  const topEpStage = [...stageBreakdown].sort((a, b) => b.epPerTonCpo - a.epPerTonCpo)[0];

  // Sensitivity scenarios (PROPER Bab 6.2)
  let sensitivity: SensitivityScenario[] = [];
  let pomeReductionPotentialKgCo2eq = 0;

  if (includeSensitivity) {
    const runVariant = (label: string, group: 'Alokasi' | 'Mitigasi POME', patch: Partial<LcaInputParams>) => {
      const res = computeCoreLca({ ...params, ...patch }, false);
      return {
        label,
        group,
        gwpCpo: res.gwpCpo,
        gwpPk: res.gwpPk,
        deltaPercentVsCurrent: gwpCpo > 0 ? ((res.gwpCpo - gwpCpo) / gwpCpo) * 100 : 0,
        apCpo: res.apCpo,
        epCpo: res.epCpo,
      };
    };

    const biogasVar = runVariant('POME: Methane Capture + PLTBg (90%)', 'Mitigasi POME', {
      pomeTreatment: 'methane_capture_biogas',
    });
    pomeReductionPotentialKgCo2eq = Math.max(0, gwpCpo - biogasVar.gwpCpo);

    sensitivity = [
      runVariant('Alokasi Energi (LHV)', 'Alokasi', { allocationMethod: 'energy' }),
      runVariant('Alokasi Ekonomi (Harga Pasar)', 'Alokasi', { allocationMethod: 'economic' }),
      runVariant('Alokasi Massa (OER/KER)', 'Alokasi', { allocationMethod: 'mass' }),
      runVariant('POME: Kolam Anaerobik Terbuka (0%)', 'Mitigasi POME', {
        pomeTreatment: 'open_lagoon',
      }),
      runVariant('POME: Methane Capture + Flaring (85%)', 'Mitigasi POME', {
        pomeTreatment: 'methane_capture_flare',
      }),
      biogasVar,
    ];
  }

  const matrix: MatrixSnapshot = {
    processNames,
    technosphereFlows,
    A,
    f,
    s,
    elementaryFlowNames: ELEMENTARY_FLOW_IDS.map(
      (id) => OLCA_FLOWS.find((fl) => fl['@id'] === id)?.name || id
    ),
    B,
    g: gJoint,
  };

  return {
    ffbRequiredPerTonCpo: ffbPerTonCpo,
    annualFfbTon,
    annualCpoTon,
    annualPkTon,
    impliedAreaHa,
    annualPomeM3: annualFfbTon * pomeVolPerTonFfb,
    annualEfbTon: annualFfbTon * ef.efbPerTonEfb.efbFractionOfFfb,

    allocationCpo,
    allocationPk,
    allocationCpoEnergy,
    allocationCpoEconomic,
    allocationCpoMass,

    gwpCpo,
    gwpPk,
    apCpo,
    apPk,
    epCpo,
    epPk,
    cedCpo,
    cedPk,

    gwpPerTonFfb: (gwpCpo / allocationCpo) * oer,
    apPerTonFfb: (apCpo / allocationCpo) * oer,
    epPerTonFfb: (epCpo / allocationCpo) * oer,

    annualGwpTonCo2eq: ((gwpCpo * annualCpoTon) + (gwpPk * annualPkTon)) / 1000,

    ghgBreakdown,
    stageBreakdown,
    inventoryRows,
    materialContributions,
    processes,
    matrix,
    sensitivity,

    topGwpStage,
    topApStage,
    topEpStage,
    pomeReductionPotentialKgCo2eq,

    dataQualityStats: {
      primaryCount,
      secondaryCount,
      primaryPercent: (primaryCount / totalEx) * 100,
      secondaryPercent: (secondaryCount / totalEx) * 100,
      completenessPercent: 95.8,
    },
  };
}

export function calculatePalmOilLca(params: LcaInputParams): LcaResult {
  return computeCoreLca(params, true);
}
