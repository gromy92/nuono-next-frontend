import type { ProductListRowPayload } from '../product-domain/productListTypes';

export type ProductLogisticsCostRow = {
  id: number;
  logicalStoreId: number;
  productMasterId: number;
  productVariantId: number;
  partnerSku: string;
  barcode?: string | null;
  siteCode?: string | null;
  forwarderCode: string;
  forwarderName?: string | null;
  transportMode?: string | null;
  routeName?: string | null;
  serviceName?: string | null;
  batchReferenceNo?: string | null;
  sourceType: string;
  costType: string;
  feeType: string;
  cargoCategoryCode?: string | null;
  cargoCategoryName?: string | null;
  chargeUnit?: string | null;
  unitCostCny?: number | null;
  totalCostCny?: number | null;
  currencyCode?: string | null;
  confidenceLevel?: string | null;
  costOccurredAt?: string | null;
  refreshedAt?: string | null;
};

export type ProductLogisticsRateCardRow = {
  id: number;
  siteCode: string;
  forwarderCode: string;
  forwarderName?: string | null;
  transportMode: string;
  feeType: string;
  cargoCategoryCode: string;
  cargoCategoryName: string;
  cargoCategoryDescription?: string | null;
  chargeUnit: string;
  unitCostCny: number;
  currencyCode?: string | null;
  sourceType: string;
  sourceReference?: string | null;
  effectiveAt?: string | null;
  remark?: string | null;
};

export type CostDataStatus = 'ALL' | 'WITH_DATA' | 'MISSING_DATA';

export type ForwarderEligibilityStatus = 'SUPPORTED' | 'INQUIRY_REQUIRED' | 'UNSUPPORTED';

export type ProductLogisticsEligibilityView = {
  partnerSku: string;
  eligibilityStatus: ForwarderEligibilityStatus;
};

export type ProductLogisticsEligibilityListView = {
  items: ProductLogisticsEligibilityView[];
};

export type ManualCurrentQuoteWithEligibilityResult = {
  eligibilityStatus: ForwarderEligibilityStatus;
  currentCost?: ProductLogisticsCostRow | null;
};

export type CostFilters = {
  searchText: string;
  siteCode: string;
  forwarderCode: string;
  transportMode: string;
  cargoCategoryCode: string;
  dataStatus: CostDataStatus;
};

export type ProductCostTableRow = {
  rowKey: string;
  product: ProductListRowPayload;
  partnerSku: string;
  eligibilityStatus: ForwarderEligibilityStatus;
  currentCost?: ProductLogisticsCostRow;
  historyCosts: ProductLogisticsCostRow[];
};

export type ManualQuoteFormValues = {
  eligibilityStatus: ForwarderEligibilityStatus;
  unitCostCny?: number;
  chargeUnit?: string;
  cargoCategoryCode?: string;
  remark?: string;
};

export type RateCardFormValues = {
  cargoCategoryCode: string;
  unitCostCny: number;
  chargeUnit: string;
  sourceReference?: string;
};

export type CargoCategoryOption = {
  label: string;
  value: string;
  cargoCategoryName: string;
};

export type ProductLogisticsRouteOption = {
  siteCode: string;
  forwarderCode: string;
  forwarderName: string;
  transportMode: string;
};

export const DEFAULT_FILTERS: CostFilters = {
  searchText: '',
  siteCode: 'SA',
  forwarderCode: 'YITE',
  transportMode: 'SEA',
  cargoCategoryCode: 'ALL',
  dataStatus: 'ALL'
};

export const TRANSPORT_OPTIONS = [
  { label: '海运', value: 'SEA' },
  { label: '空运', value: 'AIR' }
];

export const CHARGE_UNIT_OPTIONS = [
  { label: 'CBM', value: 'CBM' },
  { label: 'KG', value: 'KG' },
  { label: 'PCS', value: 'PCS' },
  { label: 'BOX', value: 'BOX' }
];

export const FORWARDER_ELIGIBILITY_OPTIONS = [
  { label: '可发', value: 'SUPPORTED' },
  { label: '需询价', value: 'INQUIRY_REQUIRED' },
  { label: '不接', value: 'UNSUPPORTED' }
];

export const ALL_CATEGORY_FILTER = 'ALL';
export const UNCATEGORIZED_CATEGORY_FILTER = '__UNCATEGORIZED__';
