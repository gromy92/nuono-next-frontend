import type { ProductListingDraftPayload } from './types'

export type ProductListingChangeSummaryItem = {
  fieldKey: string
  label: string
  before: string
  after: string
}

type ProductListingChangeField = {
  fieldKey: keyof ProductListingDraftPayload
  label: string
}

type ProductListingChangeSource = Partial<Record<keyof ProductListingDraftPayload, unknown>>

const CHANGE_FIELDS: ProductListingChangeField[] = [
  { fieldKey: 'storeCode', label: '店铺站点' },
  { fieldKey: 'psku', label: 'PSKU' },
  { fieldKey: 'productFullType', label: 'Fulltype' },
  { fieldKey: 'family', label: 'Family' },
  { fieldKey: 'productType', label: 'Product Type' },
  { fieldKey: 'productSubType', label: 'Product Subtype' },
  { fieldKey: 'productBrand', label: '品牌' },
  { fieldKey: 'productBrandCode', label: '品牌编码' },
  { fieldKey: 'productTitleCn', label: '中文标题' },
  { fieldKey: 'productTitleEn', label: '英文标题' },
  { fieldKey: 'productTitleAr', label: '阿文标题' },
  { fieldKey: 'productDescriptionCn', label: '中文描述' },
  { fieldKey: 'productDescriptionEn', label: '英文描述' },
  { fieldKey: 'productDescriptionAr', label: '阿文描述' },
  { fieldKey: 'productHighlightsCn', label: '中文卖点' },
  { fieldKey: 'productHighlightsEn', label: '英文卖点' },
  { fieldKey: 'productHighlightsAr', label: '阿文卖点' },
  { fieldKey: 'sizeEn', label: '英文尺码' },
  { fieldKey: 'sizeAr', label: '阿文尺码' },
  { fieldKey: 'keyAttributes', label: '关键属性' },
  { fieldKey: 'imageUrls', label: '商品图片' },
  { fieldKey: 'price', label: '基础价格' },
  { fieldKey: 'priceMin', label: '最低价' },
  { fieldKey: 'priceMax', label: '最高价' },
  { fieldKey: 'salePrice', label: '活动价' },
  { fieldKey: 'saleStart', label: '活动开始' },
  { fieldKey: 'saleEnd', label: '活动结束' },
  { fieldKey: 'purchasePrice', label: '采购成本' },
  { fieldKey: 'supplyEvidenceType', label: '供货证据' },
  { fieldKey: 'supplyEvidenceRefId', label: '供货证据编号' },
  { fieldKey: 'optionalPurchaseOrderId', label: '采购单' },
  { fieldKey: 'fbp', label: '履约模式' },
  { fieldKey: 'warehouseId', label: '仓库 ID' },
  { fieldKey: 'warehouseCode', label: '仓库编码' },
  { fieldKey: 'quantity', label: '库存数量' },
  { fieldKey: 'idWarranty', label: '质保 ID' },
  { fieldKey: 'isActive', label: '上架状态' },
  { fieldKey: 'offerNote', label: 'Offer Note' },
  { fieldKey: 'barcode', label: 'Barcode' }
]

export function buildProductListingChangeSummary(
  current: ProductListingChangeSource,
  baseline?: ProductListingChangeSource
): ProductListingChangeSummaryItem[] {
  return CHANGE_FIELDS.flatMap((field) => {
    const before = baseline ? formatFieldValue(field.fieldKey, baseline[field.fieldKey]) : '-'
    const after = formatFieldValue(field.fieldKey, current[field.fieldKey])
    if (baseline) {
      if (isDefaultOnlyChange(field.fieldKey, baseline[field.fieldKey], current[field.fieldKey])) {
        return []
      }
      if (before === after) {
        return []
      }
    } else if (!isMeaningfulFirstSubmitValue(field.fieldKey, current[field.fieldKey], after)) {
      return []
    }
    return [{
      fieldKey: field.fieldKey,
      label: field.label,
      before,
      after
    }]
  })
}

function isMeaningfulFirstSubmitValue(
  fieldKey: keyof ProductListingDraftPayload,
  rawValue: unknown,
  displayValue: string
) {
  if (displayValue === '-') {
    return false
  }
  if ((fieldKey === 'fbp' || fieldKey === 'isActive') && rawValue === true) {
    return false
  }
  return true
}

function isDefaultOnlyChange(
  fieldKey: keyof ProductListingDraftPayload,
  beforeValue: unknown,
  afterValue: unknown
) {
  if ((fieldKey === 'fbp' || fieldKey === 'isActive') && (beforeValue === undefined || beforeValue === null)) {
    return afterValue === true
  }
  return false
}

function formatFieldValue(fieldKey: keyof ProductListingDraftPayload, value: unknown): string {
  if (fieldKey === 'imageUrls') {
    return formatCountedList(value, '张')
  }
  if (
    fieldKey === 'productHighlightsCn'
    || fieldKey === 'productHighlightsEn'
    || fieldKey === 'productHighlightsAr'
  ) {
    return formatTextList(value)
  }
  if (fieldKey === 'keyAttributes') {
    return formatKeyAttributes(value)
  }
  if (fieldKey === 'fbp') {
    if (value === true) {
      return 'FBP'
    }
    if (value === false) {
      return '非 FBP'
    }
    return '-'
  }
  if (fieldKey === 'isActive') {
    if (value === true) {
      return '启用'
    }
    if (value === false) {
      return '停用'
    }
    return '-'
  }
  return text(value) || '-'
}

function formatKeyAttributes(value: unknown) {
  const count = countFilledKeyAttributes(value)
  return count ? `${count} 个` : '-'
}

function formatCountedList(value: unknown, unit: string) {
  const items = normalizeList(value)
  return items.length ? `${items.length} ${unit}` : '-'
}

function formatTextList(value: unknown) {
  const items = normalizeList(value)
  if (!items.length) {
    return '-'
  }
  const preview = items.slice(0, 2).join('；')
  return items.length > 2 ? `${items.length} 条：${preview}...` : `${items.length} 条：${preview}`
}

function normalizeList(value: unknown) {
  return Array.isArray(value) ? value.map((item) => text(item)).filter(Boolean) : []
}

function countFilledKeyAttributes(value: unknown) {
  if (!Array.isArray(value)) {
    return 0
  }
  return value.filter((item) => isFilledNonBarcodeAttribute(item)).length
}

function isFilledNonBarcodeAttribute(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  const attribute = value as Record<string, unknown>
  const code = text(attribute.code).toLowerCase()
  if (code.includes('barcode')) {
    return false
  }
  return ['commonValue', 'enValue', 'arValue'].some((field) => text(attribute[field]))
}

function text(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).trim()
}
