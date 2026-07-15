import type {
  ProductFieldDomainSurface,
  ProductFieldDomainKey,
  ProductMasterSnapshotPayload,
  ProductSummarySurface
} from '../product-management/types'
import { PRODUCT_DETAILED_ATTRIBUTE_GROUPS } from '../product-management/productDetailedContentConfig'
import { createProductMasterSnapshotPayload } from '../product-management/utils'
import type { ProductCompetitorContentMaterial } from '../product-management/types/competitorContent'
import type {
  ProductImageRoleAssignment,
  ProductImageUsageRole
} from '../product-management/types/productImageRole'
import { normalizeNoonImageAssetMetadata } from '../product-management/utils/noonImageRequirements'
import type { ProductListingDraftPayload } from './types'
import {
  collectProductListingDraftCompletenessIssues,
  productListingDraftProgress,
  type ProductListingDraftCompletenessIssue
} from './productListingDraftCompleteness'

type NumericDraftValue = number | string | null | undefined

const DEFAULT_PRODUCT_LISTING_KEY_ATTRIBUTES = PRODUCT_DETAILED_ATTRIBUTE_GROUPS.flatMap((group) =>
  group.fields.map((field) => ({
    code: field.code,
    label: field.label,
    labelEn: field.label,
    ...(field.labelAr ? { labelAr: field.labelAr } : {}),
    ...(field.labelZh ? { labelZh: field.labelZh } : {}),
    groupName: group.officialGroupNames[0] ?? group.title
  }))
)

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
    imageRoleAssignments: [],
    imageAssetMetadata: [],
    keyAttributes: normalizeProductListingKeyAttributes([]),
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
    imageRoleAssignments: normalizeProductListingImageRoleAssignments(draft.imageUrls, draft.imageRoleAssignments),
    imageAssetMetadata: normalizeNoonImageAssetMetadata(draft.imageUrls, draft.imageAssetMetadata),
    keyAttributes: normalizeProductListingKeyAttributes(draft.keyAttributes, draft.barcode),
    fbp: draft.fbp ?? true,
    isActive: draft.isActive ?? true
  }
}

export function mergeProductListingPrefillDraft(
  currentDraft: ProductListingEditorDraft,
  prefillDraft: Partial<ProductListingEditorDraft>
): Partial<ProductListingEditorDraft> {
  const merged: Record<string, unknown> = { ...currentDraft }
  Object.entries(prefillDraft).forEach(([key, value]) => {
    if (shouldApplyPrefillValue(value, merged[key])) {
      merged[key] = value
    }
  })
  return merged as Partial<ProductListingEditorDraft>
}

export function ensureProductListingEditorDraftPsku(
  draft: Partial<ProductListingEditorDraft>,
  timestamp = Date.now()
): ProductListingEditorDraft {
  const normalized = normalizeProductListingEditorDraft(draft)
  if (normalized.psku) {
    return normalized
  }
  const sourceRef = optionalInteger(normalized.sourceRefId)
  const sourcePart = sourceRef ? String(sourceRef) : 'LISTING'
  const suffix = Math.max(0, Math.trunc(timestamp)).toString(36).toUpperCase()
  return normalizeProductListingEditorDraft({
    ...normalized,
    psku: sanitizeGeneratedPsku(`NUONO-TEST-${sourcePart}-${suffix}`)
  })
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
    sizeEn: optionalText(draft.sizeEn),
    sizeAr: optionalText(draft.sizeAr),
    keyAttributes: normalizeProductListingKeyAttributes(draft.keyAttributes, draft.barcode),
    imageUrls: normalizeStringList(draft.imageUrls),
    imageRoleAssignments: normalizeProductListingImageRoleAssignments(draft.imageUrls, draft.imageRoleAssignments),
    imageAssetMetadata: normalizeNoonImageAssetMetadata(draft.imageUrls, draft.imageAssetMetadata),
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
    barcode: optionalText(draft.barcode),
    competitorMaterials: normalizeProductListingCompetitorMaterials(draft.competitorMaterials)
  }
}

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
    stock: {
      fbp: draft.fbp,
      warehouseId: text(draft.warehouseId),
      warehouseCode: text(draft.warehouseCode),
      quantity: draft.quantity
    },
    siteOffers: [productListingEditorDraftToSiteOffer(draft)]
  })
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
  const completenessIssues = collectProductListingDraftCompletenessIssues(draft)
  const issuesFor = (domainKey: ProductFieldDomainKey) =>
    completenessIssues.filter((item) => item.domainKey === domainKey)

  const domain = (
    key: ProductFieldDomainSurface['key'],
    label: string,
    scopeLabel: string,
    issues: ProductListingDraftCompletenessIssue[],
    metrics: ProductFieldDomainSurface['metrics']
  ): ProductFieldDomainSurface => ({
    key,
    label,
    scopeLabel,
    status: issues.length ? 'attention' : 'draft',
    dirty: true,
    note: issues.length ? '上架前仍需补齐字段。' : '当前字段将进入商品上架草稿。',
    metrics,
    issues: issues.map((item) => item.message),
    blockingIssueCount: issues.filter((item) => item.severity === 'error').length
  })

  return {
    main: domain('main', '商品主档', '新建 PSKU', issuesFor('main'), [
      { label: 'PSKU', value: text(draft.psku) || '-' },
      { label: '品牌', value: text(draft.productBrand) || '-' },
      { label: 'Fulltype', value: text(draft.productFullType) || '-' }
    ]),
    content: domain('content', '图文内容', '新建 PSKU', issuesFor('content'), [
      { label: '图片', value: normalizeStringList(draft.imageUrls).length },
      { label: 'EN 标题', value: text(draft.productTitleEn) ? '已填' : '待补' }
    ]),
    grouping: domain('grouping', 'Group 与变体', '单变体', issuesFor('grouping'), [
      { label: '变体', value: 1 }
    ]),
    attributes: domain('attributes', '关键属性', '官方模板', issuesFor('attributes'), [
      {
        label: '属性项',
        value: normalizeProductListingKeyAttributes(draft.keyAttributes, draft.barcode).filter(hasAttributeValue).length
      }
    ]),
    site: domain('site', '当前站点经营', siteFromStoreCode(draft.storeCode) || '当前站点', issuesFor('site'), [
      { label: '价格', value: valueText(draft.price) || '-' },
      { label: '采购成本', value: valueText(draft.purchasePrice) || '-' },
      { label: '供货证据', value: text(draft.supplyEvidenceType) ? '已填' : '待补' },
      { label: '运营状态', value: draft.isActive === false ? '停用' : '启用' }
    ])
  }
}

export function productListingContentProgress(draft: ProductListingEditorDraft) {
  return productListingDraftProgress(draft)
}

export function updateProductListingKeyAttributeField(
  attributes: unknown,
  code: string,
  field: string,
  value: string
) {
  const normalizedCode = attributeCodeKey(code)
  if (!normalizedCode) {
    return normalizeProductListingKeyAttributes(attributes)
  }
  let updated = false
  const nextAttributes = normalizeProductListingKeyAttributes(attributes).map((attribute) => {
    if (attributeCodeKey(attribute.code) !== normalizedCode) {
      return attribute
    }
    updated = true
    return {
      ...attribute,
      [field]: value
    }
  })
  if (!updated) {
    nextAttributes.push({
      code,
      [field]: value
    })
  }
  return nextAttributes
}

export function normalizeProductListingKeyAttributes(attributes: unknown, barcode?: unknown): Array<Record<string, unknown>> {
  const byCode = new Map<string, Record<string, unknown>>()
  DEFAULT_PRODUCT_LISTING_KEY_ATTRIBUTES.forEach((attribute) => {
    byCode.set(attributeCodeKey(attribute.code), { ...attribute })
  })

  if (Array.isArray(attributes)) {
    attributes.forEach((attribute) => {
      if (!isRecord(attribute)) {
        return
      }
      const code = text(attribute.code)
      const codeKey = attributeCodeKey(code)
      if (!codeKey) {
        return
      }
      byCode.set(codeKey, {
        ...(byCode.get(codeKey) ?? {}),
        ...attribute,
        code
      })
    })
  }

  const barcodeWasExplicitlySet = barcode !== undefined
  const existingBarcode = byCode.get('barcode')
  const barcodeValue = barcodeWasExplicitlySet
    ? text(barcode)
    : text(existingBarcode?.commonValue) || text(existingBarcode?.enValue) || text(existingBarcode?.arValue)

  if (barcodeWasExplicitlySet) {
    byCode.forEach((attribute, code) => {
      if (!isBarcodeAttributeCode(code)) {
        return
      }
      byCode.set(code, {
        ...attribute,
        commonValue: barcodeValue,
        enValue: barcodeValue,
        arValue: ''
      })
    })
  }
  byCode.set('barcode', {
    code: 'barcode',
    label: 'Barcode',
    labelEn: 'Barcode',
    labelAr: text(existingBarcode?.labelAr),
    labelZh: text(existingBarcode?.labelZh),
    groupName: text(existingBarcode?.groupName) || 'barcodes',
    commonValue: barcodeValue,
    enValue: barcodeValue,
    arValue: barcodeWasExplicitlySet ? '' : text(existingBarcode?.arValue)
  })

  return Array.from(byCode.values())
}

function isBarcodeAttributeCode(code: unknown) {
  const normalized = attributeCodeKey(code)
  return ['barcode', 'barcodes', 'ean', 'gtin', 'upc'].some(
    (keyword) => normalized === keyword || normalized.includes(keyword)
  )
}

export function normalizeProductListingImageRoleAssignments(
  imageUrls: unknown,
  assignments: unknown
): ProductImageRoleAssignment[] {
  const images = normalizeStringList(imageUrls)
  const rolesByUrl = new Map<string, ProductImageUsageRole>()
  if (Array.isArray(assignments)) {
    assignments.forEach((assignment) => {
      if (!isRecord(assignment)) {
        return
      }
      const imageUrl = text(assignment.imageUrl)
      const imageRole = normalizeProductImageUsageRole(assignment.imageRole)
      if (imageUrl && imageRole) {
        rolesByUrl.set(imageUrl, imageRole)
      }
    })
  }
  return images.map((imageUrl, index) => {
    const assignedRole = rolesByUrl.get(imageUrl)
    const imageRole = index === 0 ? 'MAIN' : assignedRole === 'MAIN' ? 'DETAIL' : assignedRole ?? 'DETAIL'
    return {
      imageUrl,
      imageRole,
      sortOrder: index
    }
  })
}

function normalizeProductImageUsageRole(value: unknown): ProductImageUsageRole | undefined {
  const normalized = text(value).toUpperCase()
  if (normalized === 'MAIN' || normalized === 'SIZE' || normalized === 'DETAIL' || normalized === 'PACKAGE') {
    return normalized
  }
  return undefined
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => text(item)).filter(Boolean)
  }
  return []
}

function normalizeProductListingCompetitorMaterials(value: unknown): ProductCompetitorContentMaterial[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .filter(isRecord)
    .map((item, index) => ({
      id: text(item.id) || `competitor-${index + 1}`,
      url: optionalText(item.url),
      note: optionalText(item.note),
      sourceHost: optionalText(item.sourceHost),
      externalSku: optionalText(item.externalSku),
      fetchedAt: optionalText(item.fetchedAt),
      categoryName: optionalText(item.categoryName),
      categoryPath: optionalText(item.categoryPath),
      categoryUrl: optionalText(item.categoryUrl),
      categoryLinks: normalizeProductListingCompetitorCategoryLinks(item.categoryLinks),
      titleEn: optionalText(item.titleEn),
      titleAr: optionalText(item.titleAr),
      descriptionEn: optionalText(item.descriptionEn),
      descriptionAr: optionalText(item.descriptionAr),
      sellingPointsEn: normalizeStringList(item.sellingPointsEn),
      sellingPointsAr: normalizeStringList(item.sellingPointsAr)
    }))
    .filter((item) => (
      Boolean(item.titleEn || item.titleAr || item.descriptionEn || item.descriptionAr)
        || Boolean(item.sellingPointsEn?.length || item.sellingPointsAr?.length)
        || Boolean(item.categoryName || item.categoryPath || item.categoryUrl || item.categoryLinks?.length)
    ))
}

function normalizeProductListingCompetitorCategoryLinks(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .filter(isRecord)
    .map((item) => ({
      name: optionalText(item.name),
      path: optionalText(item.path),
      url: optionalText(item.url)
    }))
    .filter((item) => item.name || item.path || item.url)
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

function shouldApplyPrefillValue(value: unknown, currentValue: unknown) {
  if (value === null || value === undefined) {
    return false
  }
  if (typeof value === 'string' && !value.trim()) {
    return !hasFilledDraftValue(currentValue)
  }
  if (Array.isArray(value) && value.length === 0) {
    return !hasFilledDraftValue(currentValue)
  }
  return true
}

function hasFilledDraftValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false
  }
  if (typeof value === 'string') {
    return Boolean(value.trim())
  }
  if (Array.isArray(value)) {
    return value.length > 0
  }
  if (typeof value === 'object') {
    return Object.keys(value).length > 0
  }
  return true
}

function siteFromStoreCode(storeCode?: string) {
  const match = text(storeCode).match(/-N?([A-Z]{2})$/i)
  return match ? match[1].toUpperCase() : ''
}

function sanitizeGeneratedPsku(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

function hasAttributeValue(attribute: Record<string, unknown>) {
  return ['commonValue', 'enValue', 'arValue'].some((field) => text(attribute[field]))
}

function attributeCodeKey(value: unknown) {
  return text(value).toLowerCase()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
