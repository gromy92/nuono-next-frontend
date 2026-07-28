import type { ProductListRowPayload } from '../product-domain/productListTypes';
import type { ProductSummarySurface } from '../product-domain/productSummaryTypes';
import { getProductCurrentZCode } from '../product-domain/productIdentity';
import { normalizeNoonImageUrl } from './normalizeNoonImageUrl';

function textValue(value: unknown) {
  return value === null || value === undefined ? '' : String(value);
}

function galleryImageDedupeKey(value: string) {
  const normalized = value.trim().toLowerCase();
  const uuidMatch = normalized.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return uuidMatch?.[0].toLowerCase() || normalized.replace(/[?#].*$/, '');
}

export function mergeGalleryImageUrls(...values: unknown[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const candidates = Array.isArray(value) ? value : value ? [value] : [];
    candidates.forEach((item) => {
      const normalized = normalizeNoonImageUrl(item);
      const dedupeKey = normalized ? galleryImageDedupeKey(normalized) : '';
      if (!normalized || seen.has(dedupeKey)) {
        return;
      }
      seen.add(dedupeKey);
      result.push(normalized);
    });
  });

  return result;
}

export function buildProductSummarySurfaceFromListItem(item: ProductListRowPayload): ProductSummarySurface {
  return {
    skuParent: item.skuParent,
    currentZCode: item.currentZCode ?? item.skuParent,
    productMasterId: item.productMasterId,
    productVariantId: item.productVariantId,
    productSiteOfferId: item.productSiteOfferId,
    productSourceType: item.productSourceType,
    partnerSku: item.partnerSku,
    pskuCode: item.pskuCode,
    offerCode: item.offerCode,
    storeCode: item.referenceStoreCode,
    title: item.title,
    titleCn: item.titleCn,
    brand: item.brand,
    imageUrl: item.imageUrl,
    galleryImages: mergeGalleryImageUrls(item.galleryImages, item.imageUrl),
    barcode: item.barcode,
    currency: item.currency,
    referencePrice: item.referencePrice,
    originalPrice: item.originalPrice,
    salePrice: item.salePrice,
    productFulltype: item.productFulltype,
    skuGroup: item.skuGroup,
    groupRef: item.groupRef,
    groupRefCanonical: item.groupRefCanonical,
    liveStatus: item.liveStatus,
    statusCode: item.statusCode,
    isActive: item.isActive,
    maintenanceEnabled: item.maintenanceEnabled,
    listingStartedAt: item.listingStartedAt,
    listingStartedSource: item.listingStartedSource,
    operationStageCode: item.operationStageCode,
    operationStageUpdatedAt: item.operationStageUpdatedAt,
    operationStageUpdatedBy: item.operationStageUpdatedBy,
    syncStatus: item.syncStatus,
    lastSyncedAt: item.lastSyncedAt,
    lastDraftSavedAt: item.lastDraftSavedAt,
    detailBaselineStatus: item.detailBaselineStatus,
    detailBaselineMessage: item.detailBaselineMessage,
    detailBaselineSyncedAt: item.detailBaselineSyncedAt,
    variantCount: item.variantCount,
    siteOfferCount: item.siteOfferCount,
    siteLabels: item.siteLabels,
    liveStatuses: item.liveStatuses,
    totalFbnStock: item.totalFbnStock,
    totalSupermallStock: item.totalSupermallStock,
    totalFbpStock: item.totalFbpStock,
    viewsCount: item.viewsCount,
    unitsSold: item.unitsSold,
    salesAmount: item.salesAmount,
    salesCurrency: item.salesCurrency
  };
}

export function productSummaryPrimarySite(summary: ProductSummarySurface) {
  return summary.siteLabels[0] || summary.storeCode || '-';
}

export function productSummaryTitle(summary: ProductSummarySurface) {
  return summary.title || summary.partnerSku || getProductCurrentZCode(summary);
}

export function productSyncStatusMeta(status: 'synced' | 'draft' | 'conflict' | 'failed') {
  if (status === 'draft' || status === 'conflict') {
    return { label: '本地草稿', color: 'processing' as const };
  }
  if (status === 'failed') {
    return { label: '同步失败', color: 'error' as const };
  }
  return { label: '已同步', color: 'success' as const };
}

export function normalizeProductSourceType(value?: unknown) {
  const text = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return text === 'FOLLOW_SELL' ? 'FOLLOW_SELL' : 'SELF_BUILT';
}

export function productSourceTypeMeta(value?: unknown) {
  const type = normalizeProductSourceType(value);
  return type === 'FOLLOW_SELL'
    ? {
        type,
        label: '跟卖品',
        color: 'gold',
        description: '跟卖品内容来自 Noon 目录，后续只开放 Offer 经营面修改。'
      }
    : {
        type,
        label: '自建品',
        color: 'blue',
        description: '自建品内容和 Offer 经营面都由当前系统管理。'
      };
}

export function productListingStartedSourceLabel(source?: string): string {
  const normalized = textValue(source).trim().toLowerCase();
  if (normalized.startsWith('product_rebuild_inherited')) {
    const inheritedSource = normalized.includes(':') ? normalized.split(':').slice(1).join(':') : '';
    const inheritedLabel = productListingStartedSourceLabel(inheritedSource);
    return inheritedLabel ? `重建继承 · ${inheritedLabel}` : '重建继承';
  }
  const labels: Record<string, string> = {
    not_listed: '未上架',
    data_missing: '数据缺失',
    pv: 'PV',
    inventory: '库存',
    sales: '销量',
    purchase: '采购',
    fallback_current_time: '未上架'
  };
  return labels[normalized] || source || '';
}

export function isProductNotListedSource(source?: string) {
  const normalized = textValue(source).trim().toLowerCase();
  return normalized === 'not_listed' || normalized === 'fallback_current_time';
}

function noonLocaleFromSite(site: string) {
  const normalized = site.trim().toUpperCase();
  if (normalized === 'SA' || normalized === 'KSA' || /(?:^|[-_])N?SA$/.test(normalized)) {
    return 'saudi-en';
  }
  return 'uae-en';
}

function noonSlugFromTitle(title: string) {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'product';
}

export function buildNoonProductUrl(summary: ProductSummarySurface) {
  const skuParent = textValue(summary.skuParent).trim();
  if (!skuParent) {
    return undefined;
  }
  const locale = noonLocaleFromSite(productSummaryPrimarySite(summary));
  const slug = noonSlugFromTitle(productSummaryTitle(summary));
  return `https://www.noon.com/${locale}/${slug}/${encodeURIComponent(skuParent)}/p/`;
}
