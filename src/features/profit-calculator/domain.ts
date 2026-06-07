export type ProfitCalculationPayload = {
  ready: boolean;
  message?: string;
  title?: string;
  site: string;
  marketCurrency: string;
  salePrice: number;
  purchasePrice: number;
  exchangeRate: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightGrams: number;
  cubeVolumeCbm: number;
  dimensionalWeightGrams: number;
  warehouseDeliveryFeeRmb: number;
  airFirstLegFeeRmb: number;
  oceanFirstLegFeeRmb: number;
  officialOutboundFee?: {
    ready?: boolean;
    status?: 'CALCULATED' | 'FAILED' | 'MANUAL_OVERRIDE';
    failureCode?: string;
    message?: string;
    ownerUserId?: number;
    storeCode?: string;
    skuId?: string;
    variantId?: number;
    partnerSku?: string;
    childSku?: string;
    site?: string;
    country?: string;
    platform?: string;
    fulfillmentType?: string;
    salePrice?: number;
    effectiveSourceId?: number;
    specSourceType?: string;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    weightGrams?: number;
    feeAmount?: number;
    currency?: string;
    taxMultiplier?: number;
    taxIncludedFeeAmount?: number;
    matchedClassificationName?: string;
    matchedSlabNaturalKey?: string;
    sourceVersionId?: number;
    calculationFactId?: number;
    evidence?: Record<string, unknown>;
  };
  officialCommission?: OfficialCommissionCalculationResult;
  notes: string[];
  scenarios: Array<{
    code: string;
    label: string;
    grossRevenueRmb: number;
    commissionRatePct: number;
    commissionAmountMarket: number;
    platformFeeAmountMarket: number;
    vatAmountMarket: number;
    platformDeductionRmb: number;
    settlementRevenueRmb: number;
    purchasePriceRmb: number;
    firstLegFeeRmb: number;
    warehouseDeliveryFeeRmb: number;
    domesticShippingFeeRmb: number;
    fulfillmentFeeRmb: number;
    totalCostRmb: number;
    profitRmb: number;
    marginRatePct: number;
  }>;
};

export type ProfitCalculationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: ProfitCalculationPayload }
  | { status: 'error'; message: string };

export type OfficialOutboundFeeCalculationResult = NonNullable<ProfitCalculationPayload['officialOutboundFee']>;

export type OfficialCommissionCalculationResult = {
  ready?: boolean;
  status?: 'CALCULATED' | 'FAILED';
  failureCode?: string;
  message?: string;
  ownerUserId?: number;
  storeCode?: string;
  skuId?: string;
  variantId?: number;
  partnerSku?: string;
  childSku?: string;
  site?: string;
  country?: string;
  platform?: string;
  fulfillmentType?: string;
  salePrice?: number;
  marketCurrency?: string;
  brand?: string;
  productFulltype?: string;
  categoryPath?: string;
  categoryName?: string;
  brandRestriction?: string;
  amountRangeLabel?: string;
  amountMin?: number;
  amountMax?: number;
  amountCurrency?: string;
  commissionRate?: number;
  commissionAmount?: number;
  currency?: string;
  taxMultiplier?: number;
  taxIncludedCommissionAmount?: number;
  matchedRuleNaturalKey?: string;
  sourceVersionId?: number;
  calculationFactId?: number;
  evidence?: Record<string, unknown>;
};

export type ActualOutboundFeeSnapshot = {
  partnerSku?: string | null;
  sku?: string | null;
  currency?: string | null;
  sampleCount: number;
  transactionRowCount: number;
  totalFeeAmount?: number | null;
  averageFeeAmount?: number | null;
  latestFeeAmount?: number | null;
  latestTransactionDate?: string | null;
};

export type ActualCommissionSnapshot = {
  partnerSku?: string | null;
  sku?: string | null;
  currency?: string | null;
  sampleCount: number;
  transactionRowCount: number;
  totalCommissionAmount?: number | null;
  averageCommissionAmount?: number | null;
  latestCommissionAmount?: number | null;
  latestTransactionDate?: string | null;
};

export type OfficialOutboundFeeCalculationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: OfficialOutboundFeeCalculationResult }
  | { status: 'error'; message: string };

export type ProfitPendingCarryoverState = {
  source: 'candidate';
};

export type ProfitQuickSignalStatus = 'READY' | 'PARTIAL' | 'BLOCKED';

export type ProfitDetailSeedPayload = {
  title?: string;
  site?: string;
  salePrice?: number;
  purchasePrice?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  weightGrams?: number;
  vatRate?: number;
  exchangeRate?: number;
  domesticShippingFee?: number;
  warehouseDeliveryUnitPrice?: number;
  airFreightUnitPrice?: number;
  oceanFreightUnitPrice?: number;
  airFreightDimFactor?: number;
  fbnCommissionRate?: number;
  fbpCommissionRate?: number;
  fbnOutboundFee?: number;
  manualFbnOutboundFeeOverride?: boolean;
  fbpDirectShipFee?: number;
  fulfillmentFee?: number;
  ownerUserId?: number;
  storeCode?: string;
  skuId?: string;
};

export type ProfitQuickSignalsPayload = {
  ready: boolean;
  message?: string;
  signalVersion?: string;
  marketCurrency?: string;
  signals: Array<{
    candidateKey?: string;
    candidateId?: number;
    title?: string;
    status: ProfitQuickSignalStatus;
    missingInputs: string[];
    usedDefaults: string[];
    inputSnapshot?: {
      site?: string;
      salePrice?: number;
      purchasePrice?: number;
      lengthCm?: number;
      widthCm?: number;
      heightCm?: number;
      weightGrams?: number;
    };
    quickScenarios: Array<{
      code: string;
      label: string;
      profitRmb: number;
      marginRatePct: number;
      firstLegFeeRmb: number;
    }>;
    detailSeed?: ProfitDetailSeedPayload;
  }>;
};

export type ProcurementProfitSignalsState =
  | { status: 'idle' }
  | { status: 'loading'; demandItemId: number }
  | {
      status: 'success';
      demandItemId: number;
      data: ProfitQuickSignalsPayload;
      signalByCandidateId: Record<number, ProfitQuickSignalsPayload['signals'][number]>;
    }
  | { status: 'error'; demandItemId: number; message: string };

export type ProfitFormValues = {
  title?: string;
  site: 'SA' | 'AE';
  ownerUserId?: number;
  storeCode?: string;
  skuId?: string;
  salePrice: number;
  purchasePrice: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightGrams: number;
  fbnCommissionRate: number;
  fbpCommissionRate: number;
  vatRate: number;
  exchangeRate: number;
  domesticShippingFee: number;
  warehouseDeliveryUnitPrice: number;
  airFreightUnitPrice: number;
  oceanFreightUnitPrice: number;
  airFreightDimFactor: number;
  fbnOutboundFee: number;
  manualFbnOutboundFeeOverride?: boolean;
  fbpDirectShipFee: number;
  fulfillmentFee: number;
};

export const PROFIT_FORM_DEFAULTS: ProfitFormValues = {
  title: '',
  site: 'SA',
  salePrice: 49,
  purchasePrice: 12.5,
  lengthCm: 18,
  widthCm: 8,
  heightCm: 8,
  weightGrams: 280,
  fbnCommissionRate: 0.15,
  fbpCommissionRate: 0.15,
  vatRate: 0.15,
  exchangeRate: 1.8833,
  domesticShippingFee: 2.2,
  warehouseDeliveryUnitPrice: 2.5,
  airFreightUnitPrice: 65,
  oceanFreightUnitPrice: 1300,
  airFreightDimFactor: 5000,
  fbnOutboundFee: 8,
  manualFbnOutboundFeeOverride: false,
  fbpDirectShipFee: 10,
  fulfillmentFee: 7
};

export function formatMoney(value?: number | null, fractionDigits = 2) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '-';
  }
  return value.toFixed(fractionDigits);
}

export function formatPercent(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '-';
  }
  return `${value.toFixed(2)}%`;
}

export function profitScenarioColor(profitValue?: number | null) {
  if (typeof profitValue !== 'number' || !Number.isFinite(profitValue)) {
    return '#64748b';
  }
  if (profitValue > 0) {
    return '#15803d';
  }
  if (profitValue < 0) {
    return '#b91c1c';
  }
  return '#92400e';
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function normalizeProfitSite(site?: string): ProfitFormValues['site'] {
  return site?.toUpperCase() === 'AE' ? 'AE' : 'SA';
}

export function profitQuickSignalStatusMeta(status?: ProfitQuickSignalStatus) {
  if (status === 'READY') {
    return { label: '已就绪', color: 'success' as const };
  }
  if (status === 'PARTIAL') {
    return { label: '默认估算', color: 'processing' as const };
  }
  if (status === 'BLOCKED') {
    return { label: '待补', color: 'warning' as const };
  }
  return { label: '未计算', color: 'default' as const };
}

export function profitMissingInputLabel(fieldKey: string) {
  if (fieldKey === 'salePrice') {
    return '目标售价';
  }
  if (fieldKey === 'purchasePrice') {
    return '采购单价';
  }
  if (fieldKey === 'lengthCm') {
    return '长度';
  }
  if (fieldKey === 'widthCm') {
    return '宽度';
  }
  if (fieldKey === 'heightCm') {
    return '高度';
  }
  if (fieldKey === 'weightGrams') {
    return '重量';
  }
  return fieldKey;
}

export function getProfitDetailMissingFields(values?: Partial<ProfitFormValues>) {
  const missingFields: string[] = [];
  if (!isFiniteNumber(values?.salePrice)) {
    missingFields.push('salePrice');
  }
  if (!isFiniteNumber(values?.purchasePrice)) {
    missingFields.push('purchasePrice');
  }
  if (!isFiniteNumber(values?.lengthCm)) {
    missingFields.push('lengthCm');
  }
  if (!isFiniteNumber(values?.widthCm)) {
    missingFields.push('widthCm');
  }
  if (!isFiniteNumber(values?.heightCm)) {
    missingFields.push('heightCm');
  }
  if (!isFiniteNumber(values?.weightGrams)) {
    missingFields.push('weightGrams');
  }
  return missingFields;
}

export function getProfitCarryoverRetainedCoreFields(values?: Partial<ProfitFormValues>) {
  const retainedFields: string[] = [];
  if (values?.site) {
    retainedFields.push('site');
  }
  if (isFiniteNumber(values?.salePrice)) {
    retainedFields.push('salePrice');
  }
  if (isFiniteNumber(values?.purchasePrice)) {
    retainedFields.push('purchasePrice');
  }
  if (isFiniteNumber(values?.lengthCm)) {
    retainedFields.push('lengthCm');
  }
  if (isFiniteNumber(values?.widthCm)) {
    retainedFields.push('widthCm');
  }
  if (isFiniteNumber(values?.heightCm)) {
    retainedFields.push('heightCm');
  }
  if (isFiniteNumber(values?.weightGrams)) {
    retainedFields.push('weightGrams');
  }
  return retainedFields;
}

export function profitCarryoverFieldLabel(fieldKey: string) {
  if (fieldKey === 'site') {
    return '目标站点';
  }
  return profitMissingInputLabel(fieldKey);
}

export function hasProfitDetailRequiredFields(values: Partial<ProfitFormValues>) {
  return getProfitDetailMissingFields(values).length === 0;
}

export function findQuickScenario(
  signal?: ProfitQuickSignalsPayload['signals'][number],
  scenarioCode?: 'FBN_AIR' | 'FBN_OCEAN'
) {
  if (!signal || !scenarioCode) {
    return undefined;
  }
  return signal.quickScenarios.find((item) => item.code === scenarioCode);
}

export function siteCurrency(site?: string) {
  if (site === 'AE') {
    return 'AED';
  }
  if (site === 'SA') {
    return 'SAR';
  }
  return site || 'SAR';
}

export function midpointPrice(min?: number | null, max?: number | null) {
  if (typeof min === 'number' && typeof max === 'number') {
    return Number(((min + max) / 2).toFixed(2));
  }
  if (typeof min === 'number') {
    return Number(min.toFixed(2));
  }
  if (typeof max === 'number') {
    return Number(max.toFixed(2));
  }
  return undefined;
}
