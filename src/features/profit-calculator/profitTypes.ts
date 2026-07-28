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

