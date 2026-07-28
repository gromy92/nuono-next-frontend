import { createProductMasterSnapshotPayload, type ProductMasterSnapshotPayload } from '../product-domain/productMasterSnapshot'
import type { ProductSummarySurface } from '../product-domain/productSummaryTypes'
import { normalizeNoonImageAssetMetadata } from '../product-image-profile/noonListingImageRequirements'
import type { ProductListingEditorDraft } from './productDetailAdapterTypes'
import {
  normalizeProductListingKeyAttributes,
  normalizeStringList,
  siteFromStoreCode,
  text,
  valueText
} from './productDetailAdapterNormalization'

export function productListingEditorDraftToSnapshot(
  draft: ProductListingEditorDraft,
  ownerUserId?: number
): ProductMasterSnapshotPayload {
  const storeCode = text(draft.storeCode)
  const site = siteFromStoreCode(storeCode)
  const psku = text(draft.psku)
  const titleEn = text(draft.productTitleEn)
  const titleAr = text(draft.productTitleAr)
  const titleCn = text(draft.productTitleCn)
  const images = normalizeStringList(draft.imageUrls)
  const barcode = text(draft.barcode)

  return createProductMasterSnapshotPayload({
    mode: 'listing-draft',
    message: '商品上架草稿',
    storeContext: {
      ...(ownerUserId ? { ownerUserId } : {}),
      storeCode,
      site,
      source: 'product-listing'
    },
    identity: {
      skuParent: psku || 'NEW-LISTING',
      partnerSku: psku,
      pskuCode: '',
      productSourceType: 'SELF_BUILT',
      brand: text(draft.productBrand),
      brandCode: text(draft.productBrandCode),
      barcode,
      barcodes: barcode ? [barcode] : []
    },
    taxonomy: {
      idProductFullType: draft.idProductFullType,
      productFulltype: text(draft.productFullType),
      family: text(draft.family),
      productType: text(draft.productType),
      productSubtype: text(draft.productSubType)
    },
    content: {
      titleCn,
      titleEn,
      titleAr,
      descriptionCn: text(draft.productDescriptionCn),
      descriptionEn: text(draft.productDescriptionEn),
      descriptionAr: text(draft.productDescriptionAr),
      highlightsZh: normalizeStringList(draft.productHighlightsCn),
      highlightsEn: normalizeStringList(draft.productHighlightsEn),
      highlightsAr: normalizeStringList(draft.productHighlightsAr),
      images,
      imageAssetMetadata: normalizeNoonImageAssetMetadata(images, draft.imageAssetMetadata)
    },
    keyAttributes: normalizeProductListingKeyAttributes(draft.keyAttributes, barcode),
    variants: [
      {
        partnerSku: psku,
        childSku: '',
        sizeEn: text(draft.sizeEn) || 'Default',
        sizeAr: text(draft.sizeAr),
        displaySize: text(draft.sizeEn) || 'Default'
      }
    ],
    pricing: {
      price: draft.price,
      purchasePrice: draft.purchasePrice,
      idWarranty: draft.idWarranty,
      barcode
    },
    stock: {},
    siteOffers: [productListingEditorDraftToSiteOffer(draft)]
  })
}

export function productListingEditorDraftToSiteOffer(draft: ProductListingEditorDraft): Record<string, unknown> {
  return {
    storeCode: draft.storeCode,
    site: siteFromStoreCode(draft.storeCode),
    isActive: true,
    liveStatus: 'not_live',
    price: valueText(draft.price),
    priceMin: valueText(draft.priceMin),
    priceMax: valueText(draft.priceMax),
    salePrice: valueText(draft.salePrice),
    saleStart: text(draft.saleStart),
    saleEnd: text(draft.saleEnd),
    idWarranty: valueText(draft.idWarranty ?? 0),
    offerNote: text(draft.offerNote)
  }
}

export function productListingEditorDraftToSummary(draft: ProductListingEditorDraft): ProductSummarySurface {
  const images = normalizeStringList(draft.imageUrls)
  return {
    skuParent: text(draft.psku) || 'NEW-LISTING',
    productSourceType: 'SELF_BUILT',
    partnerSku: text(draft.psku),
    pskuCode: '',
    storeCode: text(draft.storeCode),
    title: text(draft.productTitleEn),
    titleAr: text(draft.productTitleAr),
    brand: text(draft.productBrand),
    imageUrl: images[0],
    galleryImages: images,
    barcode: text(draft.barcode),
    referencePrice: valueText(draft.price),
    productFulltype: text(draft.productFullType),
    isActive: true,
    listingStartedSource: 'not_listed',
    liveStatus: 'not_live',
    syncStatus: 'draft',
    detailBaselineStatus: 'ready',
    variantCount: 1,
    siteOfferCount: 1,
    siteLabels: [siteFromStoreCode(draft.storeCode)].filter(Boolean),
    liveStatuses: ['not_live']
  }
}

