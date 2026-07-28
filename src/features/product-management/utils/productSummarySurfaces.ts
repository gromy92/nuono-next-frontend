import type { ProductListSummaryPayload, ProductSummarySurface, ProductWorkbenchState, StoreInitializationPayload } from '../types'
import { buildProductSummarySurfaceFromListItem, mergeGalleryImageUrls } from '../../product-baseline'
import { barcodeFromKeyAttributes } from './barcode'
import { textInputValue } from './common'

function hasOwnField<T extends object>(value: T, field: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(value, field)
}

export function buildProductSummarySurfaceFromListSummary(
  summary: ProductListSummaryPayload,
  fallback?: StoreInitializationPayload['productItems'][number]
): ProductSummarySurface {
  const fallbackSurface = fallback ? buildProductSummarySurfaceFromListItem(fallback) : null

  return {
    skuParent: summary.currentZCode ?? summary.skuParent ?? fallbackSurface?.skuParent ?? '-',
    currentZCode: summary.currentZCode ?? summary.skuParent ?? fallbackSurface?.currentZCode,
    productMasterId: summary.productMasterId ?? fallbackSurface?.productMasterId,
    productVariantId: summary.productVariantId ?? fallbackSurface?.productVariantId,
    productSiteOfferId: summary.productSiteOfferId ?? fallbackSurface?.productSiteOfferId,
    productSourceType: summary.productSourceType ?? fallbackSurface?.productSourceType,
    partnerSku: summary.partnerSku ?? fallbackSurface?.partnerSku,
    pskuCode: summary.pskuCode ?? fallbackSurface?.pskuCode,
    offerCode: summary.offerCode ?? fallbackSurface?.offerCode,
    storeCode: summary.storeCode ?? fallbackSurface?.storeCode,
    title: summary.title ?? fallbackSurface?.title,
    titleCn: summary.titleCn ?? fallbackSurface?.titleCn,
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
    maintenanceEnabled: summary.maintenanceEnabled ?? fallbackSurface?.maintenanceEnabled,
    listingStartedAt: summary.listingStartedAt ?? fallbackSurface?.listingStartedAt,
    listingStartedSource: summary.listingStartedSource ?? fallbackSurface?.listingStartedSource,
    operationStageCode: hasOwnField(summary, 'operationStageCode')
      ? summary.operationStageCode
      : fallbackSurface?.operationStageCode,
    operationStageUpdatedAt: summary.operationStageUpdatedAt ?? fallbackSurface?.operationStageUpdatedAt,
    operationStageUpdatedBy: summary.operationStageUpdatedBy ?? fallbackSurface?.operationStageUpdatedBy,
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
  }
}

export function buildProductSummarySurfaceFromSample(
  item: StoreInitializationPayload['sampleProducts'][number],
  matchedListItem?: StoreInitializationPayload['productItems'][number]
): ProductSummarySurface {
  if (matchedListItem) {
    const listSurface = buildProductSummarySurfaceFromListItem(matchedListItem)
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
      operationStageCode: matchedListItem.operationStageCode ?? item.operationStageCode ?? listSurface.operationStageCode,
      operationStageUpdatedAt:
        matchedListItem.operationStageUpdatedAt ?? item.operationStageUpdatedAt ?? listSurface.operationStageUpdatedAt,
      operationStageUpdatedBy:
        matchedListItem.operationStageUpdatedBy ?? item.operationStageUpdatedBy ?? listSurface.operationStageUpdatedBy,
      siteLabels: listSurface.siteLabels.length ? listSurface.siteLabels : [item.site || item.storeCode || '-']
    }
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
    operationStageCode: item.operationStageCode,
    operationStageUpdatedAt: item.operationStageUpdatedAt,
    operationStageUpdatedBy: item.operationStageUpdatedBy,
    siteLabels: item.site ? [item.site] : item.storeCode ? [item.storeCode] : [],
    liveStatuses: item.liveStatus ? [item.liveStatus] : []
  }
}

export function buildProductSummarySurfaceFromWorkbench(
  workbenchState: ProductWorkbenchState | null,
  matchedListItem?: StoreInitializationPayload['productItems'][number]
): ProductSummarySurface | null {
  if (matchedListItem) {
    const listSurface = buildProductSummarySurfaceFromListItem(matchedListItem)
    if (!workbenchState) return listSurface

    return {
      ...listSurface,
      productSourceType: listSurface.productSourceType ?? textInputValue(workbenchState.draft.identity.productSourceType),
      currentZCode:
        listSurface.currentZCode ||
        textInputValue(workbenchState.draft.identity.currentZCode) ||
        textInputValue(workbenchState.draft.identity.skuParent) ||
        undefined,
      title: listSurface.title ?? textInputValue(workbenchState.draft.content.titleEn),
      titleCn: listSurface.titleCn ?? textInputValue(workbenchState.draft.content.titleCn),
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
    }
  }

  if (!workbenchState) return null

  const draft = workbenchState.draft
  const siteOffers = Array.isArray(draft.siteOffers) ? draft.siteOffers : []
  const activeSiteLabels = siteOffers
    .map((item) => textInputValue(item.site))
    .filter((item) => item && item !== '-')
  const activeLiveStatuses = siteOffers
    .map((item) => textInputValue(item.liveStatus))
    .filter((item) => item && item !== '-')
  const referenceSiteOffer =
    siteOffers.find((item) => Boolean(item.reference)) ??
    siteOffers.find((item) => textInputValue(item.storeCode) === textInputValue(draft.storeContext.storeCode)) ??
    siteOffers[0]

  return {
    skuParent: textInputValue(draft.identity.currentZCode) || textInputValue(draft.identity.skuParent),
    currentZCode: textInputValue(draft.identity.currentZCode) || textInputValue(draft.identity.skuParent) || undefined,
    productSourceType: textInputValue(draft.identity.productSourceType) || undefined,
    partnerSku: textInputValue(draft.identity.partnerSku) || undefined,
    pskuCode: textInputValue(draft.identity.pskuCode) || undefined,
    offerCode: textInputValue(draft.identity.offerCode) || undefined,
    storeCode: textInputValue(draft.storeContext.storeCode) || undefined,
    title: textInputValue(draft.content.titleEn) || undefined,
    titleCn: textInputValue(draft.content.titleCn) || undefined,
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
    maintenanceEnabled:
      typeof referenceSiteOffer?.maintenanceEnabled === 'boolean' ? referenceSiteOffer.maintenanceEnabled : undefined,
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
  }
}
