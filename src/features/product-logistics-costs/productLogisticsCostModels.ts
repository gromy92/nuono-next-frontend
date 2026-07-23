import type { ProductListRowPayload } from '../product-management/types';

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
  chargeUnit: string;
  unitCostCny: number;
  currencyCode?: string | null;
  sourceType: string;
  sourceReference?: string | null;
  effectiveAt?: string | null;
  remark?: string | null;
};

export type CostDataStatus = 'ALL' | 'WITH_DATA' | 'MISSING_DATA';

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
  currentCost?: ProductLogisticsCostRow;
  historyCosts: ProductLogisticsCostRow[];
};

export type ManualQuoteFormValues = {
  unitCostCny: number;
  chargeUnit: string;
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

export const DEFAULT_FILTERS: CostFilters = {
  searchText: '',
  siteCode: 'SA',
  forwarderCode: 'YITE',
  transportMode: 'SEA',
  cargoCategoryCode: 'ALL',
  dataStatus: 'ALL'
};

export const FORWARDER_OPTIONS = [
  { label: '义特', value: 'YITE' },
  { label: '易通', value: 'ET' },
  { label: 'CHIC', value: 'QIKE' }
];

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

export const ALL_CATEGORY_FILTER = 'ALL';
export const UNCATEGORIZED_CATEGORY_FILTER = '__UNCATEGORIZED__';
