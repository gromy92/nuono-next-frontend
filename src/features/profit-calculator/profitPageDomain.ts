import type { ProductListRowPayload } from '../product-domain/productListTypes'
import type { OrderFinanceOrderGroup, OrderFinanceTransactionLine } from '../order-finance/types'
import type { OfficialCommissionCalculationResult, OfficialOutboundFeeCalculationResult } from './domain'

export function displayText(value?: string | number | null) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return String(value);
}

export function displayPrice(record: ProductListRowPayload) {
  return record.salePrice || record.referencePrice || record.originalPrice || '-';
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

export function rowSkuId(record: ProductListRowPayload) {
  return record.partnerSku || '';
}

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

export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function defaultHistoryDateRange() {
  const dateTo = new Date();
  const dateFrom = new Date(dateTo);
  dateFrom.setFullYear(dateFrom.getFullYear() - 1);
  return {
    dateFrom: isoDate(dateFrom),
    dateTo: isoDate(dateTo)
  };
}

export function outboundFeeSpecSourceLabel(sourceType?: string) {
  if (sourceType === 'warehouse') {
    return '仓管尺寸';
  }
  if (sourceType === 'ali1688') {
    return '1688尺寸';
  }
  if (sourceType === 'manual') {
    return '手工尺寸';
  }
  if (sourceType === 'noon_official') {
    return 'Noon官方尺寸';
  }
  return '经营生效尺寸';
}

export function taxIncludedOutboundFee(value?: OfficialOutboundFeeCalculationResult) {
  if (value?.status === 'CALCULATED' && typeof value.taxIncludedFeeAmount === 'number' && Number.isFinite(value.taxIncludedFeeAmount)) {
    return value.taxIncludedFeeAmount;
  }
  return undefined;
}

export function taxIncludedCommission(value?: OfficialCommissionCalculationResult) {
  if (
    value?.status === 'CALCULATED'
    && typeof value.taxIncludedCommissionAmount === 'number'
    && Number.isFinite(value.taxIncludedCommissionAmount)
  ) {
    return value.taxIncludedCommissionAmount;
  }
  return undefined;
}


export type ActualOutboundFeeHistoryLine = OrderFinanceTransactionLine & {
  rowKey: string;
  groupOrderNr: string;
};

export type ActualOutboundFeeHistoryPeriod = {
  startDate: string;
  endDate: string;
  amount: number;
  recordCount: number;
  dateCount: number;
  currency?: string;
};

export function flattenHistoryLines(groups: OrderFinanceOrderGroup[]) {
  return groups.flatMap((group, groupIndex) =>
    (group.lines || []).map((line, lineIndex) => ({
      ...line,
      rowKey: `${group.orderNr || groupIndex}-${line.referenceNr || ''}-${line.itemNr || ''}-${line.transactionDate || line.orderDate || ''}-${lineIndex}`,
      groupOrderNr: group.orderNr
    }))
  );
}

export function buildHistoryFeePeriods(lines: ActualOutboundFeeHistoryLine[]) {
  const dateFeeMap = new Map<string, Map<string, { amount: number; count: number; currency?: string }>>();

  lines.forEach((line) => {
    const date = line.transactionDate || line.orderDate;
    if (!date) {
      return;
    }
    const amount = Math.round(Math.abs(line.fulfillmentLogisticsFee || 0) * 100) / 100;
    const amountKey = amount.toFixed(2);
    const feeMap = dateFeeMap.get(date) || new Map<string, { amount: number; count: number; currency?: string }>();
    const current = feeMap.get(amountKey) || {
      amount,
      count: 0,
      currency: line.currency
    };
    current.count += 1;
    current.currency = current.currency || line.currency;
    feeMap.set(amountKey, current);
    dateFeeMap.set(date, feeMap);
  });

  const dailyFees = Array.from(dateFeeMap.entries())
    .map(([date, feeMap]) => {
      const dominantFee = Array.from(feeMap.values()).sort((left, right) => right.count - left.count || right.amount - left.amount)[0];
      return {
        date,
        amount: dominantFee.amount,
        recordCount: dominantFee.count,
        currency: dominantFee.currency
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date));

  return dailyFees.reduce<ActualOutboundFeeHistoryPeriod[]>((periods, dailyFee) => {
    const previous = periods[periods.length - 1];
    if (previous && Math.abs(previous.amount - dailyFee.amount) < 0.01 && previous.currency === dailyFee.currency) {
      previous.endDate = dailyFee.date;
      previous.recordCount += dailyFee.recordCount;
      previous.dateCount += 1;
      return periods;
    }
    periods.push({
      startDate: dailyFee.date,
      endDate: dailyFee.date,
      amount: dailyFee.amount,
      recordCount: dailyFee.recordCount,
      dateCount: 1,
      currency: dailyFee.currency
    });
    return periods;
  }, []);
}

export function buildHistoryCommissionPeriods(lines: ActualOutboundFeeHistoryLine[]) {
  const dateCommissionMap = new Map<string, Map<string, { amount: number; count: number; currency?: string }>>();

  lines.forEach((line) => {
    const date = line.transactionDate || line.orderDate;
    if (!date) {
      return;
    }
    const amount = Math.round(Math.abs(line.referralFee || 0) * 100) / 100;
    if (amount === 0) {
      return;
    }
    const amountKey = amount.toFixed(2);
    const commissionMap = dateCommissionMap.get(date) || new Map<string, { amount: number; count: number; currency?: string }>();
    const current = commissionMap.get(amountKey) || {
      amount,
      count: 0,
      currency: line.currency
    };
    current.count += 1;
    current.currency = current.currency || line.currency;
    commissionMap.set(amountKey, current);
    dateCommissionMap.set(date, commissionMap);
  });

  const dailyCommissions = Array.from(dateCommissionMap.entries())
    .map(([date, commissionMap]) => {
      const dominantCommission = Array.from(commissionMap.values()).sort(
        (left, right) => right.count - left.count || right.amount - left.amount
      )[0];
      return {
        date,
        amount: dominantCommission.amount,
        recordCount: dominantCommission.count,
        currency: dominantCommission.currency
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date));

  return dailyCommissions.reduce<ActualOutboundFeeHistoryPeriod[]>((periods, dailyCommission) => {
    const previous = periods[periods.length - 1];
    if (previous && Math.abs(previous.amount - dailyCommission.amount) < 0.01 && previous.currency === dailyCommission.currency) {
      previous.endDate = dailyCommission.date;
      previous.recordCount += dailyCommission.recordCount;
      previous.dateCount += 1;
      return periods;
    }
    periods.push({
      startDate: dailyCommission.date,
      endDate: dailyCommission.date,
      amount: dailyCommission.amount,
      recordCount: dailyCommission.recordCount,
      dateCount: 1,
      currency: dailyCommission.currency
    });
    return periods;
  }, []);
}

export function historyPeriodLabel(period: ActualOutboundFeeHistoryPeriod) {
  return period.startDate === period.endDate ? period.startDate : `${period.startDate} ~ ${period.endDate}`;
}

