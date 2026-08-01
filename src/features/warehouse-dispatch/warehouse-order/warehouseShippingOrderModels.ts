import type { OrderLogisticsQuoteImportResult } from '../../logistics-quote/types';

export type QuoteExportSelection = {
  forwarderCode?: string;
  routeCode?: string;
};

export type QuoteImportResultState = {
  orderId: string;
  segmentIds: string[];
  result: OrderLogisticsQuoteImportResult;
};

export type DetailLineFilter =
  | 'ALL'
  | 'MISSING_MATERIAL'
  | 'MISSING_PRICE'
  | 'INQUIRY_REQUIRED'
  | 'UNSUPPORTED';

export type QuoteBillingUnit = 'KG' | 'CBM';

export type DetailUnitPriceFilter = 'ALL' | `PRICE:${string}:${QuoteBillingUnit}`;

export type LineQuoteDraft = {
  unitPrice?: string;
  billingUnit?: QuoteBillingUnit;
  yiteMaterial?: string;
};

export const QUOTE_BILLING_UNIT_OPTIONS: Array<{ label: string; value: QuoteBillingUnit }> = [
  { label: 'CNY / KG', value: 'KG' },
  { label: 'CNY / CBM', value: 'CBM' }
];

export const YITE_MATERIAL_OPTIONS = ['塑料', '陶瓷', '金属', '纸', '纺织', '木制'].map((value) => ({
  label: value,
  value
}));
