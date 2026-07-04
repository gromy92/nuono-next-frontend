export type PreOrderProfitSiteCode = 'SA' | 'AE';

export type PreOrderProfitStatus = 'READY' | 'INCOMPLETE_INPUT' | 'MISSING_RULE' | 'INVALID_FORMULA';

export type PreOrderProfitCompetitor = {
  id: string;
  candidateId?: string;
  storeCode?: string;
  title: string;
  url: string;
  platform: string;
  site: PreOrderProfitSiteCode;
  price: number;
  currency: 'SAR' | 'AED';
  sellerName: string;
  notes: string;
};

export type PreOrderProfitPurchaseOrder = {
  id: string;
  storeCode?: string;
  site?: PreOrderProfitSiteCode;
  name: string;
  notes: string;
  createdAt?: string;
  itemCount?: number;
  itemCandidateIds?: string[];
};

export type PreOrderProfitInput = {
  id: string;
  storeCode?: string;
  title: string;
  skuHint: string;
  purchaseUrl: string;
  purchasePriceRmb: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  actualWeightKg: number;
  categoryId: string;
  site: PreOrderProfitSiteCode;
  logisticsCarrierId: string;
  salePrice: number;
  targetMarginPct: number;
  candidateStatus?: string;
  categoryLabel?: string;
  logisticsCarrierLabel?: string;
  notes?: string;
  competitorCount?: number;
  purchaseOrderCount?: number;
  purchaseOrders?: PreOrderProfitPurchaseOrder[];
  relationsLoaded?: boolean;
  calculation?: PreOrderProfitCalculation;
  competitors: PreOrderProfitCompetitor[];
  aiSummary?: string;
  aiSuggestedPurchaseOrderId?: string;
};

export type PreOrderProfitSiteConfig = {
  site: PreOrderProfitSiteCode;
  label: string;
  currency: 'SAR' | 'AED';
  taxRate: number;
  exchangeRateRmbPerCurrency: number;
};

export type PreOrderProfitCategoryRule = {
  id: string;
  site: PreOrderProfitSiteCode;
  label: string;
  commissionRate: number;
  outboundFee: number;
};

export type PreOrderProfitLogisticsRule = {
  id: string;
  label: string;
  unitPriceRmbPerKg: number;
  volumeDivisorCm3PerKg: number;
};

export type PreOrderProfitCostLine = {
  key: string;
  label: string;
  amount: number;
  source: 'manual' | 'fixed' | 'rule';
  note: string;
};

export type PreOrderProfitCalculation = {
  status: PreOrderProfitStatus;
  statusText: string;
  missingFields: string[];
  currency: string;
  siteLabel: string;
  taxRatePct: number;
  exchangeRate: number;
  actualWeightKg: number;
  volumeWeightKg: number;
  chargeableWeightKg: number;
  procurementCost: number;
  domesticLogisticsCost: number;
  firstLegLogisticsCost: number;
  commissionBase: number;
  commissionTaxIncluded: number;
  outboundBase: number;
  outboundTaxIncluded: number;
  totalCost: number;
  estimatedProfit: number;
  estimatedMarginPct: number;
  breakEvenPrice: number | null;
  targetMarginPrice: number | null;
  costLines: PreOrderProfitCostLine[];
};
