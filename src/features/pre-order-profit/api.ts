import { apiFetch, parseApiResponse, readApiErrorMessage } from '../../shared/api';
import { DEFAULT_TARGET_MARGIN_PCT, PRE_ORDER_PROFIT_SITE_CONFIGS } from './calculator';
import type {
  PreOrderProfitCalculation,
  PreOrderProfitCompetitor,
  PreOrderProfitCostLine,
  PreOrderProfitInput,
  PreOrderProfitPurchaseOrder,
  PreOrderProfitSiteCode,
  PreOrderProfitStatus
} from './types';

const API_BASE = '/api/pre-order-profit';

type BackendSiteCode = 'SA' | 'AE';

type BackendCalculationStatus = PreOrderProfitStatus | string;

type BackendCostLine = {
  key?: string | null;
  label?: string | null;
  amount?: number | null;
  currency?: string | null;
  note?: string | null;
};

type BackendCalculationView = {
  status?: BackendCalculationStatus | null;
  currency?: string | null;
  taxRate?: number | null;
  exchangeRate?: number | null;
  missingFields?: string[] | null;
  missingRules?: string[] | null;
  formulaIssues?: string[] | null;
  purchaseCost?: number | null;
  domesticLogisticsFeeRmb?: number | null;
  domesticLogisticsFee?: number | null;
  volumeWeightKg?: number | null;
  billingWeightKg?: number | null;
  firstLegLogisticsFeeRmb?: number | null;
  firstLegLogisticsFee?: number | null;
  commissionBase?: number | null;
  commissionFeeTaxIncluded?: number | null;
  fulfillmentFeeBase?: number | null;
  fulfillmentFeeTaxIncluded?: number | null;
  totalCost?: number | null;
  estimatedProfit?: number | null;
  estimatedMarginRatePct?: number | null;
  breakEvenSalePrice?: number | null;
  targetMarginSalePrice?: number | null;
  costLines?: BackendCostLine[] | null;
};

type BackendCandidateView = {
  id: number;
  storeCode?: string | null;
  siteCode?: string | null;
  title?: string | null;
  skuHint?: string | null;
  purchaseUrl?: string | null;
  purchasePriceRmb?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  actualWeightKg?: number | null;
  categoryId?: string | null;
  categoryLabel?: string | null;
  logisticsCarrierId?: string | null;
  logisticsCarrierLabel?: string | null;
  salePrice?: number | null;
  targetMarginRate?: number | null;
  candidateStatus?: string | null;
  notes?: string | null;
  latestCalculationStatus?: string | null;
  latestCalculation?: BackendCalculationView | null;
  competitorCount?: number | null;
  purchaseOrderCount?: number | null;
  competitors?: BackendCompetitorView[] | null;
  purchaseOrders?: BackendPurchaseOrderView[] | null;
};

type BackendCompetitorView = {
  id: number;
  candidateId?: number | null;
  storeCode?: string | null;
  title?: string | null;
  url?: string | null;
  platform?: string | null;
  siteCode?: string | null;
  price?: number | null;
  currency?: string | null;
  sellerName?: string | null;
  notes?: string | null;
};

type BackendPurchaseOrderView = {
  id: number;
  storeCode?: string | null;
  siteCode?: string | null;
  name?: string | null;
  notes?: string | null;
  itemCount?: number | null;
};

type BackendPurchaseOrderLinkView = {
  itemId?: number | null;
  purchaseOrderId?: number | null;
  candidateId?: number | null;
  alreadyLinked?: boolean | null;
};

type CandidateCommand = {
  storeCode: string;
  siteCode: PreOrderProfitSiteCode;
  title: string;
  skuHint: string;
  purchaseUrl: string;
  purchasePriceRmb: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  actualWeightKg: number;
  categoryId: string;
  logisticsCarrierId: string;
  salePrice: number;
  targetMarginRate: number;
  candidateStatus: string;
  categoryLabel?: string;
  logisticsCarrierLabel?: string;
  notes?: string;
};

export type PreOrderProfitCandidateListQuery = {
  storeCode: string;
  siteCode?: PreOrderProfitSiteCode | 'ALL';
  keyword?: string;
  status?: PreOrderProfitStatus | 'ALL';
  categoryId?: string;
  logisticsCarrierId?: string;
};

export function isPersistedPreOrderProfitId(id: string | undefined | null) {
  return Boolean(id && /^\d+$/.test(id));
}

export async function loadPreOrderProfitCandidates(query: PreOrderProfitCandidateListQuery) {
  const params = queryParams({
    storeCode: query.storeCode,
    siteCode: query.siteCode === 'ALL' ? undefined : query.siteCode,
    keyword: query.keyword,
    status: query.status === 'ALL' ? undefined : query.status,
    categoryId: query.categoryId === 'ALL' ? undefined : query.categoryId,
    logisticsCarrierId: query.logisticsCarrierId === 'ALL' ? undefined : query.logisticsCarrierId
  });
  const response = await apiFetch(`${API_BASE}/candidates?${params.toString()}`);
  const payload = await parseApiResponse<BackendCandidateView[]>(response, '选品池商品加载失败。');
  return payload.map((candidate) => mapCandidateView(candidate, false));
}

export async function loadPreOrderProfitCandidate(storeCode: string, candidateId: string) {
  const params = queryParams({ storeCode });
  const response = await apiFetch(`${API_BASE}/candidates/${candidateId}?${params.toString()}`);
  const payload = await parseApiResponse<BackendCandidateView>(response, '选品池商品详情加载失败。');
  return mapCandidateView(payload, true);
}

export async function createPreOrderProfitCandidate(candidate: PreOrderProfitInput, storeCode: string) {
  const response = await apiFetch(`${API_BASE}/candidates`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(candidateCommand(candidate, storeCode))
  });
  const payload = await parseApiResponse<BackendCandidateView>(response, '选品池商品创建失败。');
  return mapCandidateView(payload, true);
}

export async function updatePreOrderProfitCandidate(candidate: PreOrderProfitInput, storeCode: string) {
  const response = await apiFetch(`${API_BASE}/candidates/${candidate.id}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(candidateCommand(candidate, storeCode))
  });
  const payload = await parseApiResponse<BackendCandidateView>(response, '选品池商品保存失败。');
  return mapCandidateView(payload, true);
}

export async function deletePreOrderProfitCandidate(storeCode: string, candidateId: string) {
  const params = queryParams({ storeCode });
  const response = await apiFetch(`${API_BASE}/candidates/${candidateId}?${params.toString()}`, {
    method: 'DELETE'
  });
  await ensureOk(response, '选品池商品删除失败。');
}

export async function addPreOrderProfitCompetitor(
  storeCode: string,
  candidateId: string,
  competitor: PreOrderProfitCompetitor
) {
  const response = await apiFetch(`${API_BASE}/candidates/${candidateId}/competitors`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(competitorCommand(storeCode, competitor))
  });
  const payload = await parseApiResponse<BackendCompetitorView>(response, '竞品创建失败。');
  return mapCompetitorView(payload);
}

export async function updatePreOrderProfitCompetitor(
  storeCode: string,
  candidateId: string,
  competitor: PreOrderProfitCompetitor
) {
  const response = await apiFetch(`${API_BASE}/candidates/${candidateId}/competitors/${competitor.id}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(competitorCommand(storeCode, competitor))
  });
  const payload = await parseApiResponse<BackendCompetitorView>(response, '竞品保存失败。');
  return mapCompetitorView(payload);
}

export async function deletePreOrderProfitCompetitor(storeCode: string, candidateId: string, competitorId: string) {
  const params = queryParams({ storeCode });
  const response = await apiFetch(
    `${API_BASE}/candidates/${candidateId}/competitors/${competitorId}?${params.toString()}`,
    { method: 'DELETE' }
  );
  await ensureOk(response, '竞品删除失败。');
}

export async function loadPreOrderProfitPurchaseOrders(storeCode: string, siteCode?: PreOrderProfitSiteCode | 'ALL') {
  const params = queryParams({ storeCode, siteCode: siteCode === 'ALL' ? undefined : siteCode });
  const response = await apiFetch(`${API_BASE}/purchase-orders?${params.toString()}`);
  const payload = await parseApiResponse<BackendPurchaseOrderView[]>(response, '采购单加载失败。');
  return payload.map(mapPurchaseOrderView);
}

export async function createPreOrderProfitPurchaseOrder(
  storeCode: string,
  siteCode: PreOrderProfitSiteCode,
  name: string,
  notes: string
) {
  const response = await apiFetch(`${API_BASE}/purchase-orders`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ storeCode, siteCode, name, notes })
  });
  const payload = await parseApiResponse<BackendPurchaseOrderView>(response, '采购单创建失败。');
  return mapPurchaseOrderView(payload);
}

export async function addPreOrderProfitCandidateToPurchaseOrder(
  storeCode: string,
  candidateId: string,
  purchaseOrderId: string
) {
  const params = queryParams({ storeCode });
  const response = await apiFetch(
    `${API_BASE}/candidates/${candidateId}/purchase-orders/${purchaseOrderId}?${params.toString()}`,
    { method: 'POST' }
  );
  return parseApiResponse<BackendPurchaseOrderLinkView>(response, '加入采购单失败。');
}

function mapCandidateView(view: BackendCandidateView, relationsLoaded: boolean): PreOrderProfitInput {
  const site = normalizeSiteCode(view.siteCode);
  const competitors = (view.competitors ?? []).map(mapCompetitorView);
  const purchaseOrders = (view.purchaseOrders ?? []).map(mapPurchaseOrderView);
  const candidate: PreOrderProfitInput = {
    id: String(view.id),
    storeCode: normalizeText(view.storeCode),
    title: normalizeText(view.title),
    skuHint: normalizeText(view.skuHint),
    purchaseUrl: normalizeText(view.purchaseUrl),
    purchasePriceRmb: numberOrZero(view.purchasePriceRmb),
    lengthCm: numberOrZero(view.lengthCm),
    widthCm: numberOrZero(view.widthCm),
    heightCm: numberOrZero(view.heightCm),
    actualWeightKg: numberOrZero(view.actualWeightKg),
    categoryId: normalizeText(view.categoryId),
    categoryLabel: normalizeText(view.categoryLabel) || undefined,
    site,
    logisticsCarrierId: normalizeText(view.logisticsCarrierId),
    logisticsCarrierLabel: normalizeText(view.logisticsCarrierLabel) || undefined,
    salePrice: numberOrZero(view.salePrice),
    targetMarginPct: numberOrDefault(view.targetMarginRate, DEFAULT_TARGET_MARGIN_PCT / 100) * 100,
    candidateStatus: normalizeText(view.candidateStatus) || 'DRAFT',
    notes: normalizeText(view.notes),
    competitorCount: numberOrDefault(view.competitorCount, competitors.length),
    purchaseOrderCount: numberOrDefault(view.purchaseOrderCount, purchaseOrders.length),
    competitors,
    purchaseOrders,
    relationsLoaded
  };
  candidate.calculation = mapCalculationView(view.latestCalculation, candidate, view.latestCalculationStatus);
  return candidate;
}

function mapCalculationView(
  view: BackendCalculationView | null | undefined,
  candidate: PreOrderProfitInput,
  fallbackStatus?: string | null
): PreOrderProfitCalculation {
  const siteConfig = PRE_ORDER_PROFIT_SITE_CONFIGS[candidate.site];
  const status = normalizeStatus(view?.status || fallbackStatus);
  const currency = normalizeCurrency(view?.currency, siteConfig.currency);
  const taxRate = numberOrDefault(view?.taxRate, siteConfig.taxRate);
  const exchangeRate = numberOrDefault(view?.exchangeRate, siteConfig.exchangeRateRmbPerCurrency);
  const missingFields = uniqueLabels([
    ...(view?.missingFields ?? []).map(fieldLabel),
    ...(view?.missingRules ?? []).map(ruleLabel),
    ...(view?.formulaIssues ?? []).map(formulaIssueLabel)
  ]);

  return {
    status,
    statusText: statusText(status),
    missingFields,
    currency,
    siteLabel: siteConfig.label,
    taxRatePct: round(taxRate * 100),
    exchangeRate,
    actualWeightKg: round(candidate.actualWeightKg, 3),
    volumeWeightKg: numberOrZero(view?.volumeWeightKg),
    chargeableWeightKg: numberOrZero(view?.billingWeightKg),
    procurementCost: numberOrZero(view?.purchaseCost),
    domesticLogisticsCost: numberOrZero(view?.domesticLogisticsFee),
    firstLegLogisticsCost: numberOrZero(view?.firstLegLogisticsFee),
    commissionBase: numberOrZero(view?.commissionBase),
    commissionTaxIncluded: numberOrZero(view?.commissionFeeTaxIncluded),
    outboundBase: numberOrZero(view?.fulfillmentFeeBase),
    outboundTaxIncluded: numberOrZero(view?.fulfillmentFeeTaxIncluded),
    totalCost: numberOrZero(view?.totalCost),
    estimatedProfit: numberOrZero(view?.estimatedProfit),
    estimatedMarginPct: numberOrZero(view?.estimatedMarginRatePct),
    breakEvenPrice: nullableNumber(view?.breakEvenSalePrice),
    targetMarginPrice: nullableNumber(view?.targetMarginSalePrice),
    costLines: (view?.costLines ?? []).map(mapCostLine)
  };
}

function mapCompetitorView(view: BackendCompetitorView): PreOrderProfitCompetitor {
  const site = normalizeSiteCode(view.siteCode);
  return {
    id: String(view.id),
    candidateId: view.candidateId == null ? undefined : String(view.candidateId),
    storeCode: normalizeText(view.storeCode) || undefined,
    title: normalizeText(view.title),
    url: normalizeText(view.url),
    platform: normalizeText(view.platform) || 'Noon',
    site,
    price: numberOrZero(view.price),
    currency: normalizeCurrency(view.currency, PRE_ORDER_PROFIT_SITE_CONFIGS[site].currency),
    sellerName: normalizeText(view.sellerName),
    notes: normalizeText(view.notes)
  };
}

function mapPurchaseOrderView(view: BackendPurchaseOrderView): PreOrderProfitPurchaseOrder {
  return {
    id: String(view.id),
    storeCode: normalizeText(view.storeCode) || undefined,
    site: normalizeSiteCode(view.siteCode),
    name: normalizeText(view.name) || '未命名采购单',
    notes: normalizeText(view.notes),
    itemCount: numberOrDefault(view.itemCount, 0)
  };
}

function mapCostLine(line: BackendCostLine): PreOrderProfitCostLine {
  const key = normalizeText(line.key) || 'cost-line';
  return {
    key,
    label: normalizeText(line.label) || key,
    amount: numberOrZero(line.amount),
    source: costLineSource(key),
    note: normalizeText(line.note)
  };
}

function candidateCommand(candidate: PreOrderProfitInput, fallbackStoreCode: string): CandidateCommand {
  return {
    storeCode: candidate.storeCode || fallbackStoreCode,
    siteCode: candidate.site,
    title: candidate.title.trim(),
    skuHint: candidate.skuHint.trim(),
    purchaseUrl: candidate.purchaseUrl.trim(),
    purchasePriceRmb: candidate.purchasePriceRmb,
    lengthCm: candidate.lengthCm,
    widthCm: candidate.widthCm,
    heightCm: candidate.heightCm,
    actualWeightKg: candidate.actualWeightKg,
    categoryId: candidate.categoryId,
    logisticsCarrierId: candidate.logisticsCarrierId,
    salePrice: candidate.salePrice,
    targetMarginRate: (candidate.targetMarginPct || DEFAULT_TARGET_MARGIN_PCT) / 100,
    candidateStatus: candidate.candidateStatus || 'DRAFT',
    categoryLabel: candidate.categoryLabel,
    logisticsCarrierLabel: candidate.logisticsCarrierLabel,
    notes: candidate.notes
  };
}

function competitorCommand(storeCode: string, competitor: PreOrderProfitCompetitor) {
  return {
    storeCode,
    title: competitor.title.trim(),
    url: competitor.url.trim(),
    platform: competitor.platform.trim(),
    siteCode: competitor.site,
    price: competitor.price,
    currency: competitor.currency,
    sellerName: competitor.sellerName.trim(),
    notes: competitor.notes.trim()
  };
}

function queryParams(entries: Record<string, string | undefined | null>) {
  const params = new URLSearchParams();
  Object.entries(entries).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params;
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json' };
}

async function ensureOk(response: Response, fallback: string) {
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, fallback));
  }
}

function normalizeSiteCode(siteCode: string | null | undefined): PreOrderProfitSiteCode {
  return siteCode === 'AE' ? 'AE' : 'SA';
}

function normalizeStatus(status: string | null | undefined): PreOrderProfitStatus {
  if (status === 'READY' || status === 'MISSING_RULE' || status === 'INVALID_FORMULA') return status;
  return 'INCOMPLETE_INPUT';
}

function normalizeCurrency(currency: string | null | undefined, fallback: 'SAR' | 'AED') {
  return currency === 'AED' ? 'AED' : currency === 'SAR' ? 'SAR' : fallback;
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? '';
}

function numberOrZero(value: number | null | undefined) {
  return numberOrDefault(value, 0);
}

function numberOrDefault(value: number | null | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function nullableNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function fieldLabel(field: string) {
  const labels: Record<string, string> = {
    PURCHASE_URL: '1688 采购链接',
    SITE_CODE: '销售站点',
    PURCHASE_PRICE_RMB: '采购单价',
    LENGTH_CM: '长',
    WIDTH_CM: '宽',
    HEIGHT_CM: '高',
    ACTUAL_WEIGHT_KG: '实际重量',
    CATEGORY_ID: '商品类目',
    LOGISTICS_CARRIER_ID: '物流商',
    SALE_PRICE: '预估售价'
  };
  return labels[field] || field;
}

function ruleLabel(rule: string) {
  const labels: Record<string, string> = {
    CATEGORY_RULE: '类目佣金/出舱规则',
    LOGISTICS_RULE: '物流商规则'
  };
  return labels[rule] || rule;
}

function formulaIssueLabel(issue: string) {
  const labels: Record<string, string> = {
    BREAK_EVEN_DENOMINATOR: '保本售价公式',
    TARGET_MARGIN_DENOMINATOR: '目标毛利率公式'
  };
  return labels[issue] || issue;
}

function uniqueLabels(labels: string[]) {
  return Array.from(new Set(labels.filter(Boolean)));
}

function costLineSource(key: string): PreOrderProfitCostLine['source'] {
  if (key === 'procurement') return 'manual';
  if (key === 'domestic-logistics') return 'fixed';
  return 'rule';
}

function statusText(status: PreOrderProfitStatus) {
  if (status === 'READY') return '可计算';
  if (status === 'MISSING_RULE') return '缺规则';
  if (status === 'INVALID_FORMULA') return '公式无效';
  return '缺输入';
}
