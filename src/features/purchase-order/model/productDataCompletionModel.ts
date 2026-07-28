import type { AuthSession } from '../../auth/session'
import type {
  ProductLogisticsProfilePayload,
  ProductVariantSpecDetailPayload,
  ProductVariantSpecPayload,
  ProductVariantSpecSourcePayload
} from '../../product-specs/types'
import type {
  PurchaseOrder,
  PurchaseOrderItem
} from '../types'
import {
  PRODUCT_DATA_LOGISTICS_FIELDS,
  PRODUCT_DATA_PRODUCT_SPEC_FIELDS,
  PRODUCT_DATA_SPEC_FIELDS
} from './purchaseOrderUiMeta'
import type { ProductDataCompletionFormValues } from './purchaseOrderViewTypes'

export function createDefaultProductDataCompletionValues(): ProductDataCompletionFormValues {
  return {
    batteryType: 'unknown',
    electricType: 'unknown',
    magneticType: 'unknown',
    liquidType: 'unknown',
    powderType: 'unknown',
    woodenMaterialType: 'unknown',
    bladeWeaponType: 'unknown'
  }
}

export function productDataSourcingValuesFromItem(item: PurchaseOrderItem): Partial<ProductDataCompletionFormValues> {
  return {
    sourcingSpec: item.sourcingSpec,
    sourcingSize: item.sourcingSize,
    sourcingColor: item.sourcingColor
  }
}

export function buildProductDataCompletionContext(
  order: PurchaseOrder,
  item: PurchaseOrderItem,
  session?: AuthSession | null
) {
  const currentZCode = item.skuParent || undefined
  return {
    ownerUserId: session?.defaultOwnerUserId,
    storeCode: order.storeCode || session?.currentStore?.storeCode || '',
    variantId: parseOptionalNumber(item.variantId),
    partnerSku: item.partnerSku,
    currentZCode,
    skuParent: currentZCode
  }
}

export function productDataSpecValuesFromDetail(detail: ProductVariantSpecDetailPayload): Partial<ProductDataCompletionFormValues> {
  const source = findProductDataSpecSource(detail.sources, 'ali1688')
  return productDataSpecValuesFromSource(source)
}

export function productDataSpecValuesFromSource(
  source?: ProductVariantSpecSourcePayload | ProductVariantSpecPayload
): Partial<ProductDataCompletionFormValues> {
  if (!source) {
    return {}
  }
  return {
    productLengthCm: source.productLengthCm ?? undefined,
    productWidthCm: source.productWidthCm ?? undefined,
    productHeightCm: source.productHeightCm ?? undefined,
    productWeightG: source.productWeightG ?? undefined,
    cartonLengthCm: source.cartonLengthCm ?? undefined,
    cartonWidthCm: source.cartonWidthCm ?? undefined,
    cartonHeightCm: source.cartonHeightCm ?? undefined,
    cartonWeightKg: source.cartonWeightKg ?? undefined,
    cartonQuantity: source.cartonQuantity ?? undefined
  }
}

export function findProductDataSpecSource(
  sources: ProductVariantSpecSourcePayload[] | undefined,
  sourceType: string
) {
  return (sources || []).find((source) => source.sourceType === sourceType)
}

export function productDataLogisticsValuesFromProfile(profile?: ProductLogisticsProfilePayload): Partial<ProductDataCompletionFormValues> {
  if (!profile) {
    return {}
  }
  return PRODUCT_DATA_LOGISTICS_FIELDS.reduce<Partial<ProductDataCompletionFormValues>>((values, field) => {
    values[field.key] = String(profile[field.key] || 'unknown')
    return values
  }, {})
}

export function createProductDataLogisticsProfilePayload(
  order: PurchaseOrder,
  item: PurchaseOrderItem,
  values: ProductDataCompletionFormValues
): ProductLogisticsProfilePayload {
  const profileConfirmed = productDataHasCompleteLogisticsValues(values)
  return {
    storeCode: order.storeCode,
    skuParent: item.skuParent,
    currentZCode: item.skuParent,
    title: item.productTitle || item.sourceTitle,
    imageUrl: item.productImageUrl || item.sourceImageUrl,
    variantId: parseOptionalNumber(item.variantId),
    partnerSku: item.partnerSku,
    profileStatus: profileConfirmed ? 'confirmed' : 'needs_review',
    manualConfirmRequired: !profileConfirmed,
    batteryType: values.batteryType || 'unknown',
    electricType: values.electricType || 'unknown',
    magneticType: values.magneticType || 'unknown',
    liquidType: values.liquidType || 'unknown',
    powderType: values.powderType || 'unknown',
    woodenMaterialType: values.woodenMaterialType || 'unknown',
    bladeWeaponType: values.bladeWeaponType || 'unknown'
  }
}

export function validateProductDataNumberField(label: string, value: unknown, min: number, required: boolean) {
  if (value === undefined || value === null || value === '') {
    return required ? Promise.reject(new Error(`请填写${label}`)) : Promise.resolve()
  }
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue) || numberValue < min) {
    return Promise.reject(new Error(`${label}必须大于 0`))
  }
  return Promise.resolve()
}

export function validateProductDataAttributeField(label: string, value: unknown, required: boolean) {
  if (!required) {
    return Promise.resolve()
  }
  return isConfirmedProductDataAttribute(value)
    ? Promise.resolve()
    : Promise.reject(new Error(`请选择${label}`))
}

export function shouldSaveProductDataSourcing(item: PurchaseOrderItem, values: ProductDataCompletionFormValues) {
  return (
    normalizeOptionalText(values.sourcingSpec) !== normalizeOptionalText(item.sourcingSpec) ||
    normalizeOptionalText(values.sourcingSize) !== normalizeOptionalText(item.sourcingSize) ||
    normalizeOptionalText(values.sourcingColor) !== normalizeOptionalText(item.sourcingColor)
  )
}

export function shouldSaveProductDataSpec(values: ProductDataCompletionFormValues) {
  return productDataHasAnySpecValue(values)
}

export function shouldSaveProductDataLogistics(item: PurchaseOrderItem, values: ProductDataCompletionFormValues) {
  return item.logisticsAttributeComplete === false || productDataHasCompleteLogisticsValues(values)
}

export function productDataHasAnySpecValue(values: ProductDataCompletionFormValues) {
  return PRODUCT_DATA_SPEC_FIELDS.some((field) => values[field.key] !== undefined && values[field.key] !== null)
}

export function productDataHasAnyProductSpecValue(values: ProductDataCompletionFormValues) {
  return PRODUCT_DATA_PRODUCT_SPEC_FIELDS.some((field) => values[field.key] !== undefined && values[field.key] !== null)
}

export function productDataHasCompleteProductSpecValues(values: ProductDataCompletionFormValues) {
  return PRODUCT_DATA_PRODUCT_SPEC_FIELDS.every((field) => isPositiveProductDataNumber(values[field.key]))
}

export function productDataHasAnyConfirmedLogisticsValue(values: ProductDataCompletionFormValues) {
  return PRODUCT_DATA_LOGISTICS_FIELDS.some((field) => isConfirmedProductDataAttribute(values[field.key]))
}

export function productDataHasCompleteLogisticsValues(values: ProductDataCompletionFormValues) {
  return PRODUCT_DATA_LOGISTICS_FIELDS.every((field) => isConfirmedProductDataAttribute(values[field.key]))
}

export function isConfirmedProductDataAttribute(value: unknown) {
  return Boolean(value && String(value) !== 'unknown')
}

export function normalizeOptionalText(value: unknown) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || undefined
}

export function isPositiveProductDataNumber(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0
}

export function parseOptionalNumber(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : undefined
}

export function hasAnyText(...values: Array<string | undefined>) {
  return values.some((value) => Boolean(value?.trim()))
}
