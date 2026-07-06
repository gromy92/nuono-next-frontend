import type {
  ProductFieldDomainSurface,
  ProductMasterSnapshotPayload,
  ProductSummarySurface
} from '../product-management/types'
import type { ProductListingDraftPayload } from './types'

type NumericDraftValue = number | string | null | undefined

export type ProductListingEditorDraft = Omit<
  ProductListingDraftPayload,
  | 'idProductFullType'
  | 'price'
  | 'priceMin'
  | 'priceMax'
  | 'salePrice'
  | 'purchasePrice'
  | 'supplyEvidenceRefId'
  | 'optionalPurchaseOrderId'
  | 'quantity'
  | 'idWarranty'
> & {
  idProductFullType?: NumericDraftValue
  price?: NumericDraftValue
  purchasePrice?: NumericDraftValue
  supplyEvidenceRefId?: NumericDraftValue
  optionalPurchaseOrderId?: NumericDraftValue
  quantity?: NumericDraftValue
  idWarranty?: NumericDraftValue
  productTitleCn?: string
  productDescriptionCn?: string
  productDescriptionEn?: string
  productDescriptionAr?: string
  productHighlightsCn?: string[]
  productHighlightsEn?: string[]
  productHighlightsAr?: string[]
  sizeEn?: string
  sizeAr?: string
  priceMin?: NumericDraftValue
  priceMax?: NumericDraftValue
  salePrice?: NumericDraftValue
  saleStart?: string
  saleEnd?: string
  isActive?: boolean
  offerNote?: string
}

export type ProductListingMetadataFormValues = Pick<
  ProductListingEditorDraft,
  | 'storeCode'
  | 'sourceType'
  | 'sourceRefId'
  | 'psku'
>

export function createProductListingEditorDraft(storeCode?: string): ProductListingEditorDraft {
  return normalizeProductListingEditorDraft({
    storeCode: storeCode || '',
    psku: '',
    imageUrls: [],
    fbp: true,
    isActive: true,
    supplyEvidenceType: undefined
  })
}

export function normalizeProductListingEditorDraft(
  draft: Partial<ProductListingEditorDraft>,
  fallbackStoreCode?: string
): ProductListingEditorDraft {
  return {
    ...draft,
    storeCode: text(draft.storeCode) || text(fallbackStoreCode),
    psku: text(draft.psku),
    imageUrls: normalizeStringList(draft.imageUrls),
    fbp: draft.fbp ?? true,
    isActive: draft.isActive ?? true
  }
}

export function productListingEditorDraftToMetadataValues(
  draft: ProductListingEditorDraft
): ProductListingMetadataFormValues {
  return {
    storeCode: draft.storeCode,
    sourceType: draft.sourceType,
    sourceRefId: draft.sourceRefId,
    psku: draft.psku
  }
}

export function productListingEditorDraftToPayload(
  draft: ProductListingEditorDraft,
  currentDraftId?: number
): ProductListingDraftPayload {
  return {
    draftId: draft.draftId ?? currentDraftId,
    storeCode: text(draft.storeCode),
    sourceType: optionalText(draft.sourceType),
    sourceRefId: optionalInteger(draft.sourceRefId),
    psku: text(draft.psku),
    idProductFullType: optionalInteger(draft.idProductFullType),
    productFullType: optionalText(draft.productFullType),
    family: optionalText(draft.family),
    productType: optionalText(draft.productType),
    productSubType: optionalText(draft.productSubType),
    productBrand: optionalText(draft.productBrand),
    productBrandCode: optionalText(draft.productBrandCode),
    productTitleCn: optionalText(draft.productTitleCn),
    productTitleEn: optionalText(draft.productTitleEn),
    productTitleAr: optionalText(draft.productTitleAr),
    productDescriptionCn: optionalText(draft.productDescriptionCn),
    productDescriptionEn: optionalText(draft.productDescriptionEn),
    productDescriptionAr: optionalText(draft.productDescriptionAr),
    productHighlightsCn: normalizeStringList(draft.productHighlightsCn),
    productHighlightsEn: normalizeStringList(draft.productHighlightsEn),
    productHighlightsAr: normalizeStringList(draft.productHighlightsAr),
    keyAttributes: normalizeRecordList(draft.keyAttributes),
    imageUrls: normalizeStringList(draft.imageUrls),
    price: optionalNumber(draft.price),
    priceMin: optionalNumber(draft.priceMin),
    priceMax: optionalNumber(draft.priceMax),
    salePrice: optionalNumber(draft.salePrice),
    saleStart: optionalText(draft.saleStart),
    saleEnd: optionalText(draft.saleEnd),
    purchasePrice: optionalNumber(draft.purchasePrice),
    supplyEvidenceType: optionalText(draft.supplyEvidenceType),
    supplyEvidenceRefId: optionalInteger(draft.supplyEvidenceRefId),
    optionalPurchaseOrderId: optionalInteger(draft.optionalPurchaseOrderId),
    fbp: draft.fbp,
    warehouseId: optionalText(draft.warehouseId),
    warehouseCode: optionalText(draft.warehouseCode),
    quantity: optionalInteger(draft.quantity),
    idWarranty: optionalInteger(draft.idWarranty),
    isActive: draft.isActive ?? true,
    offerNote: optionalText(draft.offerNote),
    barcode: optionalText(draft.barcode)
  }
}

export function productListingEditorDraftToSnapshot(draft: ProductListingEditorDraft): ProductMasterSnapshotPayload {
  const storeCode = text(draft.storeCode)
  const site = siteFromStoreCode(storeCode)
  const psku = text(draft.psku)
  const titleEn = text(draft.productTitleEn)
  const titleAr = text(draft.productTitleAr)
  const titleCn = text(draft.productTitleCn)
  const images = normalizeStringList(draft.imageUrls)
  const barcode = text(draft.barcode)

  return {
    mode: 'listing-draft',
    ready: true,
    message: '商品上架草稿',
    warnings: [],
    missingCoreTables: [],
    storeContext: {
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
      images
    },
    platformSignals: {},
    keyAttributes: [
      {
        code: 'barcode',
        label: 'Barcode',
        labelEn: 'Barcode',
        commonValue: barcode,
        enValue: barcode
      }
    ],
    group: {
      axes: []
    },
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
    stock: {
      fbp: draft.fbp,
      warehouseId: text(draft.warehouseId),
      warehouseCode: text(draft.warehouseCode),
      quantity: draft.quantity
    },
    siteOffers: [productListingEditorDraftToSiteOffer(draft)]
  }
}

export function productListingEditorDraftToSiteOffer(draft: ProductListingEditorDraft): Record<string, unknown> {
  return {
    storeCode: draft.storeCode,
    site: siteFromStoreCode(draft.storeCode),
    isActive: draft.isActive ?? true,
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
    isActive: draft.isActive ?? true,
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

export function productListingEditorDraftToStockRows(draft: ProductListingEditorDraft): Array<Record<string, unknown>> {
  const warehouseId = text(draft.warehouseId)
  const warehouseCode = text(draft.warehouseCode)
  const quantity = optionalInteger(draft.quantity)
  if (!warehouseId && !warehouseCode && quantity === undefined) {
    return []
  }
  return [
    {
      warehouseCode: warehouseCode || warehouseId,
      stockType: draft.fbp ? 'FBP' : 'Seller',
      stockTransferred: '-',
      stockReserved: '-',
      netStock: quantity ?? '-'
    }
  ]
}

export function productListingEditorDraftDomains(draft: ProductListingEditorDraft) {
  const missingMain = [
    text(draft.productBrand) ? '' : '商品主档缺少品牌。',
    text(draft.productFullType) ? '' : '商品主档缺少 Fulltype。'
  ].filter(Boolean)
  const missingContent = [
    text(draft.productTitleEn) ? '' : '商品图文缺少标题 EN。',
    normalizeStringList(draft.imageUrls).length ? '' : '商品图文至少需要 1 张图片。'
  ].filter(Boolean)
  const missingSite = [
    optionalNumber(draft.price) !== undefined ? '' : '当前站点缺少 Base Price。'
  ].filter(Boolean)

  const domain = (
    key: ProductFieldDomainSurface['key'],
    label: string,
    scopeLabel: string,
    issues: string[],
    metrics: ProductFieldDomainSurface['metrics']
  ): ProductFieldDomainSurface => ({
    key,
    label,
    scopeLabel,
    status: issues.length ? 'attention' : 'draft',
    dirty: true,
    note: issues.length ? '上架前仍需补齐字段。' : '当前字段将进入商品上架草稿。',
    metrics,
    issues,
    blockingIssueCount: 0
  })

  return {
    main: domain('main', '商品主档', '新建 PSKU', missingMain, [
      { label: '品牌', value: text(draft.productBrand) || '-' },
      { label: 'Fulltype', value: text(draft.productFullType) || '-' }
    ]),
    content: domain('content', '图文内容', '新建 PSKU', missingContent, [
      { label: '图片', value: normalizeStringList(draft.imageUrls).length },
      { label: 'EN 标题', value: text(draft.productTitleEn) ? '已填' : '待补' }
    ]),
    grouping: domain('grouping', 'Group 与变体', '单变体', [], [
      { label: '变体', value: 1 }
    ]),
    attributes: domain('attributes', '关键属性', '官方模板', [], [
      { label: 'Barcode', value: text(draft.barcode) ? '已填' : '待补' }
    ]),
    site: domain('site', '当前站点经营', siteFromStoreCode(draft.storeCode) || '当前站点', missingSite, [
      { label: '价格', value: valueText(draft.price) || '-' },
      { label: '运营状态', value: draft.isActive === false ? '停用' : '启用' }
    ])
  }
}

export function productListingContentProgress(draft: ProductListingEditorDraft) {
  const checks = [
    text(draft.productBrand),
    text(draft.productFullType),
    text(draft.productTitleEn),
    text(draft.productTitleAr),
    normalizeStringList(draft.imageUrls).length ? 'images' : ''
  ]
  return {
    done: checks.filter(Boolean).length,
    total: checks.length
  }
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => text(item)).filter(Boolean)
  }
  return []
}

function normalizeRecordList(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item)
    )
  }
  return []
}

function valueText(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).trim()
}

function text(value: unknown) {
  return valueText(value)
}

function optionalText(value: unknown) {
  const normalized = text(value)
  return normalized || undefined
}

function optionalNumber(value: NumericDraftValue) {
  if (value === null || value === undefined || value === '') {
    return undefined
  }
  const parsed = Number(String(value).replace(/,/g, '').trim())
  return Number.isFinite(parsed) ? parsed : undefined
}

function optionalInteger(value: NumericDraftValue) {
  const parsed = optionalNumber(value)
  if (parsed === undefined) {
    return undefined
  }
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined
}

function siteFromStoreCode(storeCode?: string) {
  const match = text(storeCode).match(/-N?([A-Z]{2})$/i)
  return match ? match[1].toUpperCase() : ''
}
