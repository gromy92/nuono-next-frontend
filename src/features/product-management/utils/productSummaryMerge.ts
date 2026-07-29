import type { ProductListSummaryPayload, StoreInitializationPayload } from '../types'
import { mergeGalleryImageUrls } from '../../product-baseline'
import { normalizeProductSyncStatus, textInputValue } from './common'

function hasOwnField<T extends object>(value: T, field: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(value, field)
}

export function mergeProductListItemWithSummary(
  current: StoreInitializationPayload['productItems'][number],
  summary: ProductListSummaryPayload
): StoreInitializationPayload['productItems'][number] {
  const nextSiteLabels = summary.siteLabels.length
    ? summary.siteLabels
    : summary.storeCode && !current.siteLabels.length
      ? [summary.storeCode]
      : current.siteLabels
  const nextLiveStatuses = summary.liveStatuses.length
    ? summary.liveStatuses
    : summary.liveStatus
      ? [summary.liveStatus]
      : current.liveStatuses

  return {
    ...current,
    referenceStoreCode: summary.storeCode ?? current.referenceStoreCode,
    skuParent: summary.currentZCode ?? summary.skuParent ?? current.skuParent,
    currentZCode: summary.currentZCode ?? summary.skuParent ?? current.currentZCode,
    productMasterId: summary.productMasterId ?? current.productMasterId,
    productVariantId: summary.productVariantId ?? current.productVariantId,
    productSiteOfferId: summary.productSiteOfferId ?? current.productSiteOfferId,
    productSourceType: summary.productSourceType ?? current.productSourceType,
    partnerSku: summary.partnerSku ?? current.partnerSku,
    pskuCode: summary.pskuCode ?? current.pskuCode,
    offerCode: summary.offerCode ?? current.offerCode,
    title: summary.title ?? current.title,
    titleCn: summary.titleCn ?? current.titleCn,
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
    maintenanceEnabled: summary.maintenanceEnabled ?? current.maintenanceEnabled,
    listingStartedAt: summary.listingStartedAt ?? current.listingStartedAt,
    listingStartedSource: summary.listingStartedSource ?? current.listingStartedSource,
    operationStageCode: hasOwnField(summary, 'operationStageCode')
      ? summary.operationStageCode
      : current.operationStageCode,
    operationStageUpdatedAt: summary.operationStageUpdatedAt ?? current.operationStageUpdatedAt,
    operationStageUpdatedBy: summary.operationStageUpdatedBy ?? current.operationStageUpdatedBy,
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
    lastPublishTask: summary.lastPublishTask ?? current.lastPublishTask,
    listingPublishTask: summary.listingPublishTask ?? current.listingPublishTask
  }
}

export function mergeSampleProductWithSummary(
  current: StoreInitializationPayload['sampleProducts'][number],
  summary: ProductListSummaryPayload
): StoreInitializationPayload['sampleProducts'][number] {
  return {
    ...current,
    skuParent: summary.currentZCode ?? summary.skuParent ?? current.skuParent,
    currentZCode: summary.currentZCode ?? summary.skuParent ?? current.currentZCode,
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
    liveStatus: summary.liveStatus ?? summary.liveStatuses[0] ?? current.liveStatus,
    operationStageCode: hasOwnField(summary, 'operationStageCode')
      ? summary.operationStageCode
      : current.operationStageCode,
    operationStageUpdatedAt: summary.operationStageUpdatedAt ?? current.operationStageUpdatedAt,
    operationStageUpdatedBy: summary.operationStageUpdatedBy ?? current.operationStageUpdatedBy
  }
}
