import type { PurchaseOrderLogisticsQuoteImportResult } from '../purchase-order/types';

export type QuoteExportSelection = {
  forwarderCode?: string;
  routeCode?: string;
};

export type QuoteImportResultState = {
  orderId: string;
  segmentIds: string[];
  result: PurchaseOrderLogisticsQuoteImportResult;
};

export type DetailLineFilter = 'ALL' | 'MISSING_MATERIAL' | 'PENDING_QUOTE';

export type LineQuoteDraft = {
  unitPrice?: string;
  yiteMaterial?: string;
};

export const YITE_MATERIAL_OPTIONS = ['塑料', '陶瓷', '金属', '纸', '纺织', '木制'].map((value) => ({
  label: value,
  value
}));
