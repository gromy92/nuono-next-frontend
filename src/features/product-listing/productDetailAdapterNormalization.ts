import { PRODUCT_DETAILED_ATTRIBUTE_GROUPS } from '../product-domain/productDetailedAttributeCatalog'
import type { ProductCompetitorContentMaterial } from '../product-domain/productCompetitorContent'
import type { ProductImageRoleAssignment, ProductImageUsageRole } from '../product-image-profile/productImageRole'
import type { NumericDraftValue } from './productDetailAdapterTypes'

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

export function normalizeKeywordSuggestions(value: unknown) {
  const seen = new Set<string>()
  return normalizeStringList(value).filter((keyword) => {
    const key = keyword.normalize('NFKC').toLocaleLowerCase()
    if (!key || seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  }).slice(0, 6)
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

export function isBarcodeAttributeCode(code: unknown) {
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

export function normalizeProductImageUsageRole(value: unknown): ProductImageUsageRole | undefined {
  const normalized = text(value).toUpperCase()
  if (
    normalized === 'MAIN' ||
    normalized === 'SIZE' ||
    normalized === 'DETAIL' ||
    normalized === 'SCENE' ||
    normalized === 'PACKAGE'
  ) {
    return normalized
  }
  return undefined
}

export function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => text(item)).filter(Boolean)
  }
  return []
}

export function normalizeProductListingCompetitorMaterials(value: unknown): ProductCompetitorContentMaterial[] {
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

export function normalizeProductListingCompetitorCategoryLinks(value: unknown) {
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

export function valueText(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).trim()
}

export function text(value: unknown) {
  return valueText(value)
}

export function optionalText(value: unknown) {
  const normalized = text(value)
  return normalized || undefined
}

export function optionalNumber(value: NumericDraftValue) {
  if (value === null || value === undefined || value === '') {
    return undefined
  }
  const parsed = Number(String(value).replace(/,/g, '').trim())
  return Number.isFinite(parsed) ? parsed : undefined
}

export function optionalInteger(value: NumericDraftValue) {
  const parsed = optionalNumber(value)
  if (parsed === undefined) {
    return undefined
  }
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined
}

export function shouldApplyPrefillValue(value: unknown, currentValue: unknown) {
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

export function hasFilledDraftValue(value: unknown): boolean {
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

export function siteFromStoreCode(storeCode?: string) {
  const match = text(storeCode).match(/-N?([A-Z]{2})$/i)
  return match ? match[1].toUpperCase() : ''
}

export function hasAttributeValue(attribute: Record<string, unknown>) {
  return ['commonValue', 'enValue', 'arValue'].some((field) => text(attribute[field]))
}

export function attributeCodeKey(value: unknown) {
  return text(value).toLowerCase()
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
