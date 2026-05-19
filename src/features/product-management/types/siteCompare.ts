import type { ProductSummarySurface } from './list';

export type ProductSiteCompareModalState = {
  open: boolean;
  loading: boolean;
  summary: ProductSummarySurface | null;
  rows: Array<Record<string, unknown>>;
  activeSiteOfferCode?: string;
  dirtySiteOfferCodes: string[];
  note?: string;
};
