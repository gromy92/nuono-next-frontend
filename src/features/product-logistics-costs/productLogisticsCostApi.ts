import { apiFetch, readApiErrorMessage } from '../../shared/api';
import type {
  CostFilters,
  ProductLogisticsCostRow,
  ProductLogisticsRateCardRow
} from './productLogisticsCostModels';

type CostView = { items: ProductLogisticsCostRow[] };
type RateCardView = { items: ProductLogisticsRateCardRow[] };

export type BatchCategoryAssignmentResult = {
  requestedCount: number;
  updatedCount: number;
  skippedCount: number;
  items: Array<{
    partnerSku?: string | null;
    resolvedPartnerSku?: string | null;
    status: string;
    message?: string | null;
  }>;
};

function buildCostQuery(storeCode: string, filters: CostFilters) {
  const query = new URLSearchParams({ limit: '5000', storeCode });
  if (filters.siteCode) query.set('siteCode', filters.siteCode);
  if (filters.forwarderCode) query.set('forwarderCode', filters.forwarderCode);
  if (filters.transportMode) query.set('transportMode', filters.transportMode);
  return query.toString();
}

export async function fetchCosts(kind: 'current' | 'history', storeCode: string, filters: CostFilters) {
  const response = await apiFetch(`/api/product-logistics-costs/${kind}?${buildCostQuery(storeCode, filters)}`);
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, '读取商品物流价格失败'));
  }
  return (await response.json()) as CostView;
}

export async function fetchRateCards(filters: CostFilters) {
  const query = new URLSearchParams();
  if (filters.siteCode) query.set('siteCode', filters.siteCode);
  if (filters.forwarderCode) query.set('forwarderCode', filters.forwarderCode);
  if (filters.transportMode) query.set('transportMode', filters.transportMode);
  const response = await apiFetch(`/api/product-logistics-costs/rate-cards?${query.toString()}`);
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, '读取线路类别报价失败'));
  }
  return (await response.json()) as RateCardView;
}

export async function saveRouteRateCard(payload: {
  siteCode: string;
  forwarderCode: string;
  forwarderName: string;
  transportMode: string;
  cargoCategoryCode: string;
  cargoCategoryName: string;
  chargeUnit: string;
  unitCostCny: number;
  sourceReference?: string;
}) {
  const response = await apiFetch('/api/product-logistics-costs/rate-cards/manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, '保存线路类别报价失败'));
  }
  return (await response.json()) as ProductLogisticsRateCardRow;
}

export async function saveManualCurrentQuote(payload: {
  storeCode: string;
  partnerSku: string;
  siteCode: string;
  forwarderCode: string;
  forwarderName: string;
  transportMode: string;
  cargoCategoryCode?: string;
  cargoCategoryName?: string;
  chargeUnit: string;
  unitCostCny: number;
  remark?: string;
}) {
  const response = await apiFetch('/api/product-logistics-costs/current/manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, '保存当前报价失败'));
  }
  return (await response.json()) as ProductLogisticsCostRow;
}

export async function saveBatchCategoryAssignment(payload: {
  storeCode: string;
  siteCode: string;
  forwarderCode: string;
  forwarderName: string;
  transportMode: string;
  cargoCategoryCode: string;
  cargoCategoryName: string;
  remark?: string;
  items: Array<{ partnerSku: string }>;
}) {
  const response = await apiFetch('/api/product-logistics-costs/current/categories/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, '批量维护类别失败'));
  }
  return (await response.json()) as BatchCategoryAssignmentResult;
}
