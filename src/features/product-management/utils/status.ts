import type {
  ProductFieldDomainStatus,
  ProductListDatasetState,
  ProductListRowPayload,
  ProductSummarySurface,
  StoreInitializationPayload,
  StoreInitializationState
} from '../types';

type StoreInitializationStatus = StoreInitializationPayload['status'];

export function normalizeStoreInitializationStatus(status?: string): StoreInitializationStatus | undefined {
  if (
    status === 'BLOCKED' ||
    status === 'IDLE' ||
    status === 'RUNNING' ||
    status === 'READY' ||
    status === 'FAILED'
  ) {
    return status;
  }
  return undefined;
}

export function isProductListDatasetReady(productListDatasetState: ProductListDatasetState) {
  return productListDatasetState.status === 'success' && productListDatasetState.data.ready;
}

export function resolveProductInitializationStatus(
  productListDatasetState: ProductListDatasetState,
  storeInitializationState: StoreInitializationState
): StoreInitializationStatus | undefined {
  if (isProductListDatasetReady(productListDatasetState)) {
    return 'READY';
  }

  if (storeInitializationState.status === 'success' && storeInitializationState.data.status === 'READY') {
    return 'READY';
  }

  if (productListDatasetState.status === 'success') {
    const datasetStatus = normalizeStoreInitializationStatus(productListDatasetState.data.initializationStatus);
    if (datasetStatus) {
      return datasetStatus;
    }
  }

  return storeInitializationState.status === 'success' ? storeInitializationState.data.status : undefined;
}

export function isProductInitializationFailureStatus(status?: StoreInitializationStatus) {
  return status === 'FAILED' || status === 'BLOCKED';
}

export function resolveProductInitializationMessage(
  productListDatasetState: ProductListDatasetState,
  storeInitializationState: StoreInitializationState
) {
  if (productListDatasetState.status === 'success') {
    return productListDatasetState.data.initializationMessage ?? productListDatasetState.data.message;
  }

  if (productListDatasetState.status === 'error') {
    return productListDatasetState.message;
  }

  if (storeInitializationState.status === 'success') {
    return storeInitializationState.data.message;
  }

  if (storeInitializationState.status === 'error') {
    return storeInitializationState.message;
  }

  return undefined;
}

export function productSyncStatusMeta(status: 'synced' | 'draft' | 'conflict' | 'failed') {
  if (status === 'draft') {
    return { label: '本地草稿', color: 'processing' as const };
  }
  if (status === 'conflict') {
    return { label: '本地草稿', color: 'processing' as const };
  }
  if (status === 'failed') {
    return { label: '同步失败', color: 'error' as const };
  }
  return { label: '已同步', color: 'success' as const };
}

export function productDetailBaselineStatusMeta(status: unknown) {
  const normalized = String(status ?? '').trim().toLowerCase();
  if (normalized === 'ready') {
    return { label: '详情已准备', color: 'success' as const };
  }
  if (normalized === 'preparing' || normalized === 'queued' || normalized === 'running') {
    return { label: '详情准备中', color: 'processing' as const };
  }
  if (normalized === 'failed') {
    return { label: '详情失败', color: 'error' as const };
  }
  return { label: '缺详情基线', color: 'warning' as const };
}

export function isLiveStatusActive(status: unknown) {
  if (status === true) {
    return true;
  }
  const normalized = String(status ?? '').trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'live' || normalized === 'active';
}

export function productLiveStatusLabel(status: unknown) {
  const normalized = String(status ?? '').trim().toLowerCase();
  if (status === true || normalized === 'true' || normalized === '1' || normalized === 'live' || normalized === 'active') {
    return '在线';
  }
  if (
    status === false ||
    normalized === 'false' ||
    normalized === '0' ||
    normalized === 'not_live' ||
    normalized === 'inactive'
  ) {
    return '不在线';
  }
  return normalized ? '不在线' : '-';
}

export function isProductListRowOnline(record: ProductListRowPayload) {
  if (record.liveStatus !== undefined && record.liveStatus !== null && String(record.liveStatus).trim()) {
    return isLiveStatusActive(record.liveStatus);
  }
  if (typeof record.isActive === 'boolean') {
    return record.isActive;
  }
  return record.liveStatuses.some((status) => isLiveStatusActive(status));
}

export function productSummaryPrimaryLiveStatus(summary: ProductSummarySurface) {
  if (summary.liveStatus) {
    return summary.liveStatus;
  }
  if (summary.isActive === true) {
    return 'true';
  }
  if (summary.isActive === false) {
    return 'false';
  }
  return summary.liveStatuses[0];
}

export function productIssueTagLabel(issue: unknown) {
  const normalized = String(issue ?? '').trim();
  const issueLabels: Record<string, string> = {
    no_offer: '缺少 Offer',
    offer_gated: 'Offer 受限',
    price_in_min_max_range: '价格范围待核对',
    product_active: '商品启用待核对',
    psku_price_range: 'PSKU 价格范围待核对',
    stock_check: '库存待核对',
    valid_price: '价格待核对',
    title_missing: '标题待补齐',
    '待确认质保': '待确认质保',
    '类目待复核': '类目待复核'
  };
  return issueLabels[normalized] ?? (normalized || '-');
}

function addIssueTag(target: string[], issueTag: string) {
  if (!target.includes(issueTag)) {
    target.push(issueTag);
  }
}

function numericValue(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function hasOfferSignal(record: ProductListRowPayload) {
  return (
    Boolean(String(record.offerCode ?? '').trim()) ||
    Boolean(String(record.pskuCode ?? '').trim()) ||
    numericValue(record.siteOfferCount) > 0
  );
}

function hasStockSignal(record: ProductListRowPayload) {
  return numericValue(record.totalFbnStock) + numericValue(record.totalSupermallStock) + numericValue(record.totalFbpStock) > 0;
}

function hasPriceSignal(record: ProductListRowPayload) {
  return numericValue(record.referencePrice) > 0;
}

function shouldSuppressContradictedIssue(record: ProductListRowPayload, issue: string) {
  const normalized = issue.trim().toLowerCase();
  if (normalized === 'no_offer' && hasOfferSignal(record)) {
    return true;
  }
  if (normalized === 'stock_check' && hasStockSignal(record)) {
    return true;
  }
  if (normalized === 'valid_price' && hasPriceSignal(record)) {
    return true;
  }
  return false;
}

export function productListIssueTags(record: ProductListRowPayload) {
  const issues: string[] = [];
  (record.issueTags ?? []).forEach((issue) => {
    const normalized = String(issue ?? '').trim();
    if (normalized && !shouldSuppressContradictedIssue(record, normalized)) {
      addIssueTag(issues, normalized);
    }
  });

  if (!hasOfferSignal(record)) {
    addIssueTag(issues, 'no_offer');
  }
  if (!String(record.referencePrice ?? '').trim() || numericValue(record.referencePrice) <= 0) {
    addIssueTag(issues, 'valid_price');
  }
  if (!hasStockSignal(record)) {
    addIssueTag(issues, 'stock_check');
  }
  if (!String(record.title ?? '').trim()) {
    addIssueTag(issues, 'title_missing');
  }
  if (!String(record.productFulltype ?? '').trim()) {
    addIssueTag(issues, '类目待复核');
  }

  return issues;
}

export function isProductIssueBlocking(issue: unknown) {
  const normalized = String(issue ?? '').trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return (
    normalized.includes('fatal') ||
    normalized.includes('reject') ||
    normalized.includes('rejection') ||
    normalized.includes('blocked') ||
    normalized.includes('qc_failed') ||
    normalized.includes('not_approved') ||
    normalized.includes('不通过') ||
    normalized.includes('驳回')
  );
}

export function hasProductBlockingIssues(issues: unknown[]) {
  return issues.some(isProductIssueBlocking);
}

export function productFieldDomainStatusMeta(status: ProductFieldDomainStatus) {
  switch (status) {
    case 'draft':
      return {
        color: 'processing' as const,
        label: '本地已改'
      };
    case 'attention':
      return {
        color: 'warning' as const,
        label: '仍需补齐'
      };
    case 'blocked':
      return {
        color: 'error' as const,
        label: '当前不可发布'
      };
    case 'synced':
    default:
      return {
        color: 'success' as const,
        label: '已跟随基线'
      };
  }
}
