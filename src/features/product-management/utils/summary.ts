import type { ProductListSummaryPayload, ProductSummarySurface, ProductWorkbenchState, StoreInitializationPayload } from '../types';
import { barcodeFromKeyAttributes } from './barcode';
import { mergeGalleryImageUrls, normalizeProductSyncStatus, textInputValue } from './common';

function hasOwnField<T extends object>(value: T, field: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(value, field);
}

export function mergeProductListItemWithSummary(
  current: StoreInitializationPayload['productItems'][number],
  summary: ProductListSummaryPayload
): StoreInitializationPayload['productItems'][number] {
  const nextSiteLabels = summary.siteLabels.length
    ? summary.siteLabels
    : summary.storeCode && !current.siteLabels.length
      ? [summary.storeCode]
      : current.siteLabels;
  const nextLiveStatuses = summary.liveStatuses.length
    ? summary.liveStatuses
    : summary.liveStatus
      ? [summary.liveStatus]
      : current.liveStatuses;

  return {
    ...current,
    referenceStoreCode: summary.storeCode ?? current.referenceStoreCode,
    skuParent: summary.skuParent ?? current.skuParent,
    productSourceType: summary.productSourceType ?? current.productSourceType,
    partnerSku: summary.partnerSku ?? current.partnerSku,
    pskuCode: summary.pskuCode ?? current.pskuCode,
    offerCode: summary.offerCode ?? current.offerCode,
    title: summary.title ?? current.title,
    brand: summary.brand ?? current.brand,
    imageUrl: summary.imageUrl ?? current.imageUrl,
    galleryImages: mergeGalleryImageUrls(summary.galleryImages, current.galleryImages, summary.imageUrl, current.imageUrl),
    barcode: summary.barcode ?? current.barcode,
    referencePrice: summary.referencePrice ?? current.referencePrice,
    originalPrice: summary.originalPrice ?? current.originalPrice,
    salePrice: summary.salePrice ?? current.salePrice,
    productFulltype: summary.productFulltype ?? current.productFulltype,
    skuGroup: hasOwnField(summary, 'skuGroup') ? textInputValue(summary.skuGroup) || undefined : current.skuGroup,
    groupRef: hasOwnField(summary, 'groupRef') ? textInputValue(summary.groupRef) || undefined : current.groupRef,
    groupRefCanonical: hasOwnField(summary, 'groupRefCanonical')
      ? textInputValue(summary.groupRefCanonical) || undefined
      : current.groupRefCanonical,
    liveStatus: summary.liveStatus ?? current.liveStatus,
    statusCode: summary.statusCode ?? current.statusCode,
    isActive: summary.isActive ?? current.isActive,
    listingStartedAt: summary.listingStartedAt ?? current.listingStartedAt,
    listingStartedSource: summary.listingStartedSource ?? current.listingStartedSource,
    syncStatus: normalizeProductSyncStatus(summary.syncStatus) ?? current.syncStatus,
    lastSyncedAt: summary.lastSyncedAt ?? current.lastSyncedAt,
    lastDraftSavedAt: summary.lastDraftSavedAt ?? current.lastDraftSavedAt,
    productVariantSpecStatus: summary.productVariantSpecStatus ?? current.productVariantSpecStatus,
    productVariantSpecTotalCount: summary.productVariantSpecTotalCount ?? current.productVariantSpecTotalCount,
    productVariantSpecReadyCount: summary.productVariantSpecReadyCount ?? current.productVariantSpecReadyCount,
    productVariantSpecMaintainedCount:
      summary.productVariantSpecMaintainedCount ?? current.productVariantSpecMaintainedCount,
    variantCount: summary.variantCount ?? current.variantCount,
    siteOfferCount: summary.siteOfferCount ?? current.siteOfferCount,
    historyMetaReady:
      typeof summary.historyMetaReady === 'boolean' ? summary.historyMetaReady : current.historyMetaReady,
    pendingKeyContentHistoryCount:
      summary.pendingKeyContentHistoryCount ?? current.pendingKeyContentHistoryCount,
    visibleKeyContentHistoryCount:
      summary.visibleKeyContentHistoryCount ?? current.visibleKeyContentHistoryCount,
    pendingKeyContentHistoryVisibleAfter:
      summary.pendingKeyContentHistoryVisibleAfter ?? current.pendingKeyContentHistoryVisibleAfter,
    siteLabels: nextSiteLabels,
    liveStatuses: nextLiveStatuses,
    totalFbnStock: summary.totalFbnStock ?? current.totalFbnStock,
    totalSupermallStock: summary.totalSupermallStock ?? current.totalSupermallStock,
    totalFbpStock: summary.totalFbpStock ?? current.totalFbpStock,
    viewsCount: summary.viewsCount ?? current.viewsCount,
    unitsSold: summary.unitsSold ?? current.unitsSold,
    salesAmount: summary.salesAmount ?? current.salesAmount,
    salesCurrency: summary.salesCurrency ?? current.salesCurrency,
    lastPublishTask: summary.lastPublishTask ?? current.lastPublishTask
  };
}

export function mergeSampleProductWithSummary(
  current: StoreInitializationPayload['sampleProducts'][number],
  summary: ProductListSummaryPayload
): StoreInitializationPayload['sampleProducts'][number] {
  return {
    ...current,
    skuParent: summary.skuParent ?? current.skuParent,
    productSourceType: summary.productSourceType ?? current.productSourceType,
    partnerSku: summary.partnerSku ?? current.partnerSku,
    pskuCode: summary.pskuCode ?? current.pskuCode,
    offerCode: summary.offerCode ?? current.offerCode,
    storeCode: summary.storeCode ?? current.storeCode,
    site: summary.siteLabels[0] ?? current.site,
    title: summary.title ?? current.title,
    brand: summary.brand ?? current.brand,
    imageUrl: summary.imageUrl ?? current.imageUrl,
    galleryImages: mergeGalleryImageUrls(summary.galleryImages, current.galleryImages, summary.imageUrl, current.imageUrl),
    barcode: summary.barcode ?? current.barcode,
    price: summary.referencePrice ?? current.price,
    productFulltype: summary.productFulltype ?? current.productFulltype,
    variantCount: summary.variantCount ?? current.variantCount,
    liveStatus: summary.liveStatus ?? summary.liveStatuses[0] ?? current.liveStatus
  };
}

export function buildProductSummarySurfaceFromListItem(
  item: StoreInitializationPayload['productItems'][number]
): ProductSummarySurface {
  return {
    skuParent: item.skuParent,
    productSourceType: item.productSourceType,
    partnerSku: item.partnerSku,
    pskuCode: item.pskuCode,
    offerCode: item.offerCode,
    storeCode: item.referenceStoreCode,
    title: item.title,
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
    listingStartedAt: item.listingStartedAt,
    listingStartedSource: item.listingStartedSource,
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

export function buildProductSummarySurfaceFromListSummary(
  summary: ProductListSummaryPayload,
  fallback?: StoreInitializationPayload['productItems'][number]
): ProductSummarySurface {
  const fallbackSurface = fallback ? buildProductSummarySurfaceFromListItem(fallback) : null;

  return {
    skuParent: summary.skuParent ?? fallbackSurface?.skuParent ?? '-',
    productSourceType: summary.productSourceType ?? fallbackSurface?.productSourceType,
    partnerSku: summary.partnerSku ?? fallbackSurface?.partnerSku,
    pskuCode: summary.pskuCode ?? fallbackSurface?.pskuCode,
    offerCode: summary.offerCode ?? fallbackSurface?.offerCode,
    storeCode: summary.storeCode ?? fallbackSurface?.storeCode,
    title: summary.title ?? fallbackSurface?.title,
    brand: summary.brand ?? fallbackSurface?.brand,
    imageUrl: summary.imageUrl ?? fallbackSurface?.imageUrl,
    galleryImages: mergeGalleryImageUrls(summary.galleryImages, summary.imageUrl, fallbackSurface?.galleryImages, fallbackSurface?.imageUrl),
    barcode: summary.barcode ?? fallbackSurface?.barcode,
    currency: fallbackSurface?.currency,
    referencePrice: summary.referencePrice ?? fallbackSurface?.referencePrice,
    originalPrice: summary.originalPrice ?? fallbackSurface?.originalPrice,
    salePrice: summary.salePrice ?? fallbackSurface?.salePrice,
    productFulltype: summary.productFulltype ?? fallbackSurface?.productFulltype,
    skuGroup: hasOwnField(summary, 'skuGroup') ? textInputValue(summary.skuGroup) || undefined : fallbackSurface?.skuGroup,
    groupRef: hasOwnField(summary, 'groupRef') ? textInputValue(summary.groupRef) || undefined : fallbackSurface?.groupRef,
    groupRefCanonical: hasOwnField(summary, 'groupRefCanonical')
      ? textInputValue(summary.groupRefCanonical) || undefined
      : fallbackSurface?.groupRefCanonical,
    liveStatus: summary.liveStatus ?? fallbackSurface?.liveStatus,
    statusCode: summary.statusCode ?? fallbackSurface?.statusCode,
    isActive: summary.isActive ?? fallbackSurface?.isActive,
    listingStartedAt: summary.listingStartedAt ?? fallbackSurface?.listingStartedAt,
    listingStartedSource: summary.listingStartedSource ?? fallbackSurface?.listingStartedSource,
    syncStatus: summary.syncStatus ?? fallbackSurface?.syncStatus,
    lastSyncedAt: summary.lastSyncedAt ?? fallbackSurface?.lastSyncedAt,
    lastDraftSavedAt: summary.lastDraftSavedAt ?? fallbackSurface?.lastDraftSavedAt,
    detailBaselineStatus: summary.detailBaselineStatus ?? fallbackSurface?.detailBaselineStatus,
    detailBaselineMessage: summary.detailBaselineMessage ?? fallbackSurface?.detailBaselineMessage,
    detailBaselineSyncedAt: summary.detailBaselineSyncedAt ?? fallbackSurface?.detailBaselineSyncedAt,
    variantCount: summary.variantCount ?? fallbackSurface?.variantCount,
    siteOfferCount: summary.siteOfferCount ?? fallbackSurface?.siteOfferCount,
    siteLabels: summary.siteLabels.length ? summary.siteLabels : fallbackSurface?.siteLabels ?? [],
    liveStatuses: summary.liveStatuses.length
      ? summary.liveStatuses
      : summary.liveStatus
        ? [summary.liveStatus]
        : fallbackSurface?.liveStatuses ?? [],
    totalFbnStock: summary.totalFbnStock ?? fallbackSurface?.totalFbnStock,
    totalSupermallStock: summary.totalSupermallStock ?? fallbackSurface?.totalSupermallStock,
    totalFbpStock: summary.totalFbpStock ?? fallbackSurface?.totalFbpStock,
    viewsCount: summary.viewsCount ?? fallbackSurface?.viewsCount,
    unitsSold: summary.unitsSold ?? fallbackSurface?.unitsSold,
    salesAmount: summary.salesAmount ?? fallbackSurface?.salesAmount,
    salesCurrency: summary.salesCurrency ?? fallbackSurface?.salesCurrency
  };
}

export function buildProductSummarySurfaceFromSample(
  item: StoreInitializationPayload['sampleProducts'][number],
  matchedListItem?: StoreInitializationPayload['productItems'][number]
): ProductSummarySurface {
  if (matchedListItem) {
    const listSurface = buildProductSummarySurfaceFromListItem(matchedListItem);
    return {
      ...listSurface,
      productSourceType: matchedListItem.productSourceType ?? item.productSourceType ?? listSurface.productSourceType,
      partnerSku: matchedListItem.partnerSku ?? item.partnerSku ?? listSurface.partnerSku,
      pskuCode: matchedListItem.pskuCode ?? item.pskuCode ?? listSurface.pskuCode,
      offerCode: matchedListItem.offerCode ?? item.offerCode ?? listSurface.offerCode,
      storeCode: matchedListItem.referenceStoreCode ?? item.storeCode ?? listSurface.storeCode,
      imageUrl: matchedListItem.imageUrl ?? item.imageUrl ?? listSurface.imageUrl,
      galleryImages: mergeGalleryImageUrls(matchedListItem.galleryImages, item.galleryImages, matchedListItem.imageUrl, item.imageUrl),
      barcode: matchedListItem.barcode ?? item.barcode ?? listSurface.barcode,
      siteLabels: listSurface.siteLabels.length ? listSurface.siteLabels : [item.site || item.storeCode || '-']
    };
  }

  return {
    skuParent: item.skuParent,
    productSourceType: item.productSourceType,
    partnerSku: item.partnerSku,
    pskuCode: item.pskuCode,
    offerCode: item.offerCode,
    storeCode: item.storeCode,
    title: item.title,
    brand: item.brand,
    imageUrl: item.imageUrl,
    galleryImages: mergeGalleryImageUrls(item.galleryImages, item.imageUrl),
    barcode: item.barcode,
    currency: item.currency,
    referencePrice: item.price,
    productFulltype: item.productFulltype,
    variantCount: item.variantCount,
    liveStatus: item.liveStatus,
    siteLabels: item.site ? [item.site] : item.storeCode ? [item.storeCode] : [],
    liveStatuses: item.liveStatus ? [item.liveStatus] : []
  };
}

export function buildProductSummarySurfaceFromWorkbench(
  workbenchState: ProductWorkbenchState | null,
  matchedListItem?: StoreInitializationPayload['productItems'][number]
): ProductSummarySurface | null {
  if (matchedListItem) {
    const listSurface = buildProductSummarySurfaceFromListItem(matchedListItem);
    if (!workbenchState) {
      return listSurface;
    }
    return {
      ...listSurface,
      productSourceType: listSurface.productSourceType ?? textInputValue(workbenchState.draft.identity.productSourceType),
      title: listSurface.title ?? textInputValue(workbenchState.draft.content.titleEn),
      titleAr: textInputValue(workbenchState.draft.content.titleAr),
      galleryImages: mergeGalleryImageUrls(
        listSurface.galleryImages,
        workbenchState.draft.content.images,
        listSurface.imageUrl,
        workbenchState.draft.content.mainImageUrl
      ),
      syncStatus: workbenchState.syncStatus ?? listSurface.syncStatus,
      lastSyncedAt: workbenchState.lastSyncedAt ?? listSurface.lastSyncedAt,
      totalFbnStock: listSurface.totalFbnStock,
      totalSupermallStock: listSurface.totalSupermallStock,
      totalFbpStock: listSurface.totalFbpStock
    };
  }

  if (!workbenchState) {
    return null;
  }

  const draft = workbenchState.draft;
  const siteOffers = Array.isArray(draft.siteOffers) ? draft.siteOffers : [];
  const activeSiteLabels = siteOffers
    .map((item) => textInputValue(item.site))
    .filter((item) => item && item !== '-');
  const activeLiveStatuses = siteOffers
    .map((item) => textInputValue(item.liveStatus))
    .filter((item) => item && item !== '-');
  const referenceSiteOffer =
    siteOffers.find((item) => Boolean(item.reference)) ??
    siteOffers.find((item) => textInputValue(item.storeCode) === textInputValue(draft.storeContext.storeCode)) ??
    siteOffers[0];

  return {
    skuParent: textInputValue(draft.identity.skuParent),
    productSourceType: textInputValue(draft.identity.productSourceType) || undefined,
    partnerSku: textInputValue(draft.identity.partnerSku) || undefined,
    pskuCode: textInputValue(draft.identity.pskuCode) || undefined,
    offerCode: textInputValue(draft.identity.offerCode) || undefined,
    storeCode: textInputValue(draft.storeContext.storeCode) || undefined,
    title: textInputValue(draft.content.titleEn) || undefined,
    titleAr: textInputValue(draft.content.titleAr) || undefined,
    brand: textInputValue(draft.identity.brand) || undefined,
    imageUrl: textInputValue(draft.content.mainImageUrl) || undefined,
    galleryImages: mergeGalleryImageUrls(draft.content.images, draft.content.mainImageUrl),
    barcode: barcodeFromKeyAttributes(draft.keyAttributes),
    currency: textInputValue(referenceSiteOffer?.currency) || undefined,
    referencePrice: textInputValue(referenceSiteOffer?.price) || undefined,
    originalPrice: textInputValue(referenceSiteOffer?.price) || undefined,
    salePrice: textInputValue(referenceSiteOffer?.salePrice) || undefined,
    productFulltype: textInputValue(draft.taxonomy.productFulltype) || undefined,
    skuGroup: textInputValue(draft.group.skuGroup) || undefined,
    groupRef: textInputValue(draft.group.groupRef || draft.group.skuGroup) || undefined,
    groupRefCanonical: textInputValue(draft.group.groupRefCanonical) || undefined,
    liveStatus: textInputValue(referenceSiteOffer?.liveStatus) || undefined,
    isActive: typeof referenceSiteOffer?.isActive === 'boolean' ? referenceSiteOffer.isActive : undefined,
    statusCode: textInputValue(referenceSiteOffer?.statusCode) || undefined,
    listingStartedAt: textInputValue(referenceSiteOffer?.listingStartedAt) || undefined,
    listingStartedSource: textInputValue(referenceSiteOffer?.listingStartedSource) || undefined,
    syncStatus: workbenchState.syncStatus,
    lastSyncedAt: workbenchState.lastSyncedAt,
    variantCount: Array.isArray(draft.variants) ? draft.variants.length : undefined,
    siteOfferCount: siteOffers.length,
    siteLabels: activeSiteLabels,
    liveStatuses: activeLiveStatuses,
    totalFbnStock: Number(draft.stock.fbnStock ?? draft.stock.totalFbnStock ?? 0),
    totalSupermallStock: Number(draft.stock.supermallStock ?? draft.stock.totalSupermallStock ?? 0),
    totalFbpStock: Number(draft.stock.fbpStock ?? draft.stock.totalFbpStock ?? 0)
  };
}

export function productSummaryPrimarySite(summary: ProductSummarySurface) {
  return summary.siteLabels[0] || summary.storeCode || '-';
}

export function productSummaryPriceLine(summary: ProductSummarySurface) {
  return summary.referencePrice ? `${summary.currency || ''} ${summary.referencePrice}`.trim() : '-';
}

export function productSummaryTitle(summary: ProductSummarySurface) {
  return summary.title || summary.skuParent;
}

export function productSummaryIdentityLine(summary: ProductSummarySurface) {
  return `${summary.skuParent} · ${summary.partnerSku || '-'} · ${productSummaryPrimarySite(summary)}`;
}
