import type { ProductListSummaryPayload } from './list';

export type ProductHistoryPayload = {
  ready: boolean;
  source?: string;
  message?: string;
  warnings: string[];
  listSummary?: ProductListSummaryPayload;
  historyItems: Array<Record<string, unknown>>;
  pendingKeyContentHistoryCount?: number;
  visibleKeyContentHistoryCount?: number;
  pendingKeyContentHistoryVisibleAfter?: string;
  note?: string;
};
