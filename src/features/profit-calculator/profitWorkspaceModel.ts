import type { ProductListDatasetPayload, ProductListRowPayload } from '../product-domain/productListTypes'
import type { ActualCommissionSnapshot, ActualOutboundFeeSnapshot, OfficialCommissionCalculationResult, OfficialOutboundFeeCalculationResult } from './domain'

export type OpenProfitCalculatorPrefilled = () => void;

export type ProfitProductListState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: ProductListDatasetPayload }
  | { status: 'error'; message: string };

export type ProfitListFilters = {
  skuQuery: string;
  titleQuery: string;
  outboundFeeFilter: 'all' | 'calculated' | 'failed' | 'pending';
  differenceFilter: 'all' | 'outboundFee' | 'commission' | 'any';
};

export type ProfitOutboundFeeMap = Record<string, OfficialOutboundFeeCalculationResult>;
export type ProfitActualOutboundFeeMap = Record<string, ActualOutboundFeeSnapshot>;
export type ProfitCommissionMap = Record<string, OfficialCommissionCalculationResult>;
export type ProfitActualCommissionMap = Record<string, ActualCommissionSnapshot>;

export function siteCodeFromStoreCode(storeCode?: string) {
  const normalized = (storeCode || '').toUpperCase();
  if (normalized.endsWith('-NSA') || normalized.endsWith('-SAU') || normalized.endsWith('-SA')) {
    return 'SA';
  }
  if (normalized.endsWith('-NAE') || normalized.endsWith('-UAE') || normalized.endsWith('-AE')) {
    return 'AE';
  }
  return undefined;
}

export function profitRowKey(record: ProductListRowPayload) {
  return record.partnerSku || record.skuParent || record.offerCode || record.title || 'unknown';
}

export function rowSkuId(record: ProductListRowPayload) {
  return record.partnerSku || '';
}

export function parseAmount(value?: string) {
  if (!value) {
    return undefined;
  }
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function rowSalePrice(record: ProductListRowPayload) {
  return parseAmount(record.salePrice) ?? parseAmount(record.referencePrice) ?? parseAmount(record.originalPrice);
}

export function rowSearchText(record: ProductListRowPayload) {
  return [record.skuParent, record.partnerSku, record.pskuCode, record.offerCode, record.barcode, record.title, record.brand]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function taxIncludedOutboundFeeForFilter(value?: OfficialOutboundFeeCalculationResult) {
  if (value?.status === 'CALCULATED' && typeof value.taxIncludedFeeAmount === 'number' && Number.isFinite(value.taxIncludedFeeAmount)) {
    return value.taxIncludedFeeAmount;
  }
  return undefined;
}

export function taxIncludedCommissionForFilter(value?: OfficialCommissionCalculationResult) {
  if (
    value?.status === 'CALCULATED'
    && typeof value.taxIncludedCommissionAmount === 'number'
    && Number.isFinite(value.taxIncludedCommissionAmount)
  ) {
    return value.taxIncludedCommissionAmount;
  }
  return undefined;
}

export function hasMeaningfulDifference(left?: number, right?: number) {
  return left !== undefined && right !== undefined && Math.abs(left - right) > 0.05;
}

export function hasOutboundFeeDifference(
  rowKey: string,
  outboundFeeByRowKey: ProfitOutboundFeeMap,
  noonOutboundFeeByRowKey: ProfitOutboundFeeMap,
  actualOutboundFeeByRowKey: ProfitActualOutboundFeeMap
) {
  const effectiveFee = taxIncludedOutboundFeeForFilter(outboundFeeByRowKey[rowKey]);
  const noonFee = taxIncludedOutboundFeeForFilter(noonOutboundFeeByRowKey[rowKey]);
  const snapshot = actualOutboundFeeByRowKey[rowKey];
  const actualFee = snapshot?.latestFeeAmount ?? snapshot?.averageFeeAmount;
  return hasMeaningfulDifference(noonFee ?? effectiveFee, typeof actualFee === 'number' ? actualFee : undefined);
}

export function hasCommissionDifference(
  rowKey: string,
  commissionByRowKey: ProfitCommissionMap,
  actualCommissionByRowKey: ProfitActualCommissionMap
) {
  const commission = taxIncludedCommissionForFilter(commissionByRowKey[rowKey]);
  const snapshot = actualCommissionByRowKey[rowKey];
  const actualCommission = snapshot?.latestCommissionAmount ?? snapshot?.averageCommissionAmount;
  return hasMeaningfulDifference(commission, typeof actualCommission === 'number' ? actualCommission : undefined);
}

export function filterRows(
  rows: ProductListRowPayload[],
  filters: ProfitListFilters,
  outboundFeeByRowKey: ProfitOutboundFeeMap,
  noonOutboundFeeByRowKey: ProfitOutboundFeeMap,
  actualOutboundFeeByRowKey: ProfitActualOutboundFeeMap,
  commissionByRowKey: ProfitCommissionMap,
  actualCommissionByRowKey: ProfitActualCommissionMap
) {
  const skuQuery = filters.skuQuery.trim().toLowerCase();
  const titleQuery = filters.titleQuery.trim().toLowerCase();
  return rows.filter((row) => {
    const rowKey = profitRowKey(row);
    const outboundFee = outboundFeeByRowKey[rowKey];
    const searchText = rowSearchText(row);
    if (skuQuery && !searchText.includes(skuQuery)) {
      return false;
    }
    if (titleQuery && !String(row.title || '').toLowerCase().includes(titleQuery)) {
      return false;
    }
    if (filters.outboundFeeFilter === 'calculated') {
      return outboundFee?.status === 'CALCULATED';
    }
    if (filters.outboundFeeFilter === 'failed') {
      return outboundFee?.status === 'FAILED';
    }
    if (filters.outboundFeeFilter === 'pending') {
      return !outboundFee;
    }
    if (filters.differenceFilter !== 'all') {
      const outboundFeeDifferent = hasOutboundFeeDifference(rowKey, outboundFeeByRowKey, noonOutboundFeeByRowKey, actualOutboundFeeByRowKey);
      const commissionDifferent = hasCommissionDifference(rowKey, commissionByRowKey, actualCommissionByRowKey);
      if (filters.differenceFilter === 'outboundFee' && !outboundFeeDifferent) {
        return false;
      }
      if (filters.differenceFilter === 'commission' && !commissionDifferent) {
        return false;
      }
      if (filters.differenceFilter === 'any' && !outboundFeeDifferent && !commissionDifferent) {
        return false;
      }
    }
    return true;
  });
}

export type ProfitCalculatorWorkspaceOptions = {
  enabled?: boolean;
};
