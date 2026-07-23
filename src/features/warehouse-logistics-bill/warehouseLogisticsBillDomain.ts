import type { LogisticsBill } from '../purchase-order/types';

export function filterBills(bills: LogisticsBill[], keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return bills;
  return bills.filter((bill) => [
    bill.expectedBillNo,
    bill.shippingOrderNo,
    bill.shippingOrderTitle,
    bill.forwarderName,
    bill.routeName,
    bill.serviceName,
    ...(bill.components || []).flatMap((component) => [component.barcode, component.pskuCode])
  ].some((value) => String(value || '').toLowerCase().includes(normalized)));
}

export function reconciliationStatusLabel(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === 'PENDING_ACTUAL_BILL') return '待实际账单';
  if (normalized === 'MATCHED') return '已匹配';
  if (normalized === 'DIFF_FOUND') return '有差异';
  if (normalized === 'CONFIRMED') return '已确认';
  if (normalized === 'REJECTED') return '已驳回';
  return status || '待核对';
}

export function reconciliationStatusColor(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === 'CONFIRMED') return 'green';
  if (normalized === 'DIFF_FOUND' || normalized === 'REJECTED') return 'red';
  if (normalized === 'MATCHED') return 'blue';
  return 'gold';
}

export function feeTypeLabel(value: string) {
  if (value === 'HEADHAUL') return '头程';
  if (value === 'DELIVERY') return '派送';
  if (value === 'CUSTOMS') return '清关';
  if (value === 'SURCHARGE') return '附加费';
  if (value === 'WAREHOUSE_PROCESSING') return '仓处理';
  return value || '-';
}

export function formatMoney(value?: number | string | null, currency?: string) {
  if (value === null || value === undefined || value === '') return '-';
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return '-';
  return `${currency || ''} ${numberValue.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`.trim();
}

export function formatNumber(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return '-';
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
    : '-';
}

export function formatDate(value: string) {
  return value ? value.replace(/-/g, '/') : '-';
}
