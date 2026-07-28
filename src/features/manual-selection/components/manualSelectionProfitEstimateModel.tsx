import { PROFIT_FORM_DEFAULTS } from '../../profit-calculator/domain'
import { loadManualSelectionSystemCategories } from '../api'
import {
  systemCategoryDisplayLabel,
  systemCategoryOptionSearchText,
  systemCategorySearchTerms,
  type ManualSelectionSystemCategoryOption
} from '../profitCategoryMatching'
import type { LogisticsQuoteOption } from '../profitEstimateLogisticsOptions'
import type { ManualSelectionGroupProfitEstimateSnapshot } from '../../selection-analysis/types'
import type { ManualSelectionProfitEstimateSeed } from '../types'

const SYSTEM_CATEGORY_SELECT_LIMIT = 5000

export type ProfitEstimateFormValues = {
  ali1688Url?: string
  title?: string
  site: 'SA' | 'AE'
  salePrice?: number
  purchasePrice?: number
  lengthCm: number
  widthCm: number
  heightCm: number
  grossWeightKg: number
  categoryKey: string
  airProviderKey?: string
  seaProviderKey?: string
  /** Legacy v1/v2 snapshot field. */
  logisticsProviderKey?: string
  airQuoteKey?: string
  seaQuoteKey?: string
}

export type ManualSelectionProfitEstimateModalProps = {
  open: boolean
  seed?: ManualSelectionProfitEstimateSeed | null
  siteCode?: string
  storeCode?: string
  onCancel: () => void
  onSaved?: (snapshot: ManualSelectionGroupProfitEstimateSnapshot) => void
}

export const DEFAULT_CATEGORY_COMMISSION_RATE = PROFIT_FORM_DEFAULTS.fbnCommissionRate

export type SaveFeedback = {
  type: 'success' | 'warning' | 'error'
  message: string
}

export type PersistedProfitFormState = {
  schemaVersion: number
  formValues: Partial<ProfitEstimateFormValues>
}

export function initialValues(
  seed: ManualSelectionProfitEstimateSeed | null | undefined,
  siteCode: 'SA' | 'AE',
  categoryKey = ''
): ProfitEstimateFormValues {
  return {
    ali1688Url: seed?.ali1688Url || '',
    title: seed?.title || '',
    site: siteCode,
    salePrice: seed?.salePrice,
    purchasePrice: seed?.purchasePrice,
    lengthCm: PROFIT_FORM_DEFAULTS.lengthCm,
    widthCm: PROFIT_FORM_DEFAULTS.widthCm,
    heightCm: PROFIT_FORM_DEFAULTS.heightCm,
    grossWeightKg: Number((PROFIT_FORM_DEFAULTS.weightGrams / 1000).toFixed(3)),
    categoryKey,
    airProviderKey: undefined,
    airQuoteKey: undefined,
    seaProviderKey: undefined,
    seaQuoteKey: undefined
  }
}

export function normalizeSiteCode(value?: string): 'SA' | 'AE' {
  const normalized = (value || '').trim().toUpperCase()
  if (normalized === 'AE' || normalized === 'ARE' || normalized === 'UAE' || normalized.includes('NAE')) {
    return 'AE'
  }
  return 'SA'
}

export function siteLabel(site: 'SA' | 'AE') {
  return site === 'AE' ? '阿联酋 AE' : '沙特 SA'
}

export function siteVatRate(site?: string) {
  return site === 'AE' ? 0.05 : 0.15
}

export function domesticShippingFee(grossWeightKg?: number) {
  if (typeof grossWeightKg !== 'number' || !Number.isFinite(grossWeightKg)) {
    return 0
  }
  return Number((grossWeightKg * 2).toFixed(2))
}

export function requiredValuesReady(values?: Partial<ProfitEstimateFormValues>) {
  return Boolean(
    values?.site
    && values.salePrice
    && values.purchasePrice
    && values.lengthCm
    && values.widthCm
    && values.heightCm
    && values.grossWeightKg
    && values.categoryKey
  )
}

export function snapshotObject(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }
  return value as Record<string, unknown>
}

export function savedFormValues(snapshot?: ManualSelectionGroupProfitEstimateSnapshot | null) {
  return snapshotObject(snapshot?.snapshot?.formValues) as Partial<ProfitEstimateFormValues> | undefined
}

export function savedSnapshotVersion(snapshot?: ManualSelectionGroupProfitEstimateSnapshot | null) {
  return Number(snapshotObject(snapshot?.snapshot)?.schemaVersion || 1)
}

export function categorySelectLabel(option: ManualSelectionSystemCategoryOption) {
  const label = systemCategoryDisplayLabel(option)
  const detail = [
    option.family,
    option.productType,
    option.productSubtype
  ].filter(Boolean).join(' / ')
  if (!detail || detail === label) {
    return label
  }
  return `${label} · ${detail}`
}

export function categorySelectOptionLabel(option: ManualSelectionSystemCategoryOption) {
  const name = systemCategoryDisplayLabel(option)
  const pathLabel = [
    option.family,
    option.productType,
    option.productSubtype
  ].filter(Boolean).join(' / ')
  const fullLabel = categorySelectLabel(option)
  return (
    <span className="manual-selection-profit-category-option" title={fullLabel}>
      <span className="manual-selection-profit-category-option-name">{name}</span>
      {pathLabel && pathLabel !== name ? (
        <span className="manual-selection-profit-category-option-path">{pathLabel}</span>
      ) : null}
    </span>
  )
}

export function uniqueCategoryOptions(groups: ManualSelectionSystemCategoryOption[][]) {
  const seen = new Set<string>()
  const merged: ManualSelectionSystemCategoryOption[] = []
  groups.flat().forEach((item) => {
    if (!item.value || seen.has(item.value)) {
      return
    }
    seen.add(item.value)
    merged.push(item)
  })
  return merged
}

export async function fetchSystemCategoryOptions(storeCode: string | undefined, seed?: ManualSelectionProfitEstimateSeed | null) {
  if (!storeCode) {
    return []
  }
  const options = await loadManualSelectionSystemCategories(storeCode, {
    query: '',
    limit: SYSTEM_CATEGORY_SELECT_LIMIT,
    includeGlobalFulltypes: true
  })
  const searchTerms = systemCategorySearchTerms(seed).slice(0, 8)
  const matchedOptions = options.filter((option) => {
    const searchText = systemCategoryOptionSearchText(option)
    return searchTerms.some((term) => searchText.includes(term.toLowerCase()))
  })
  return uniqueCategoryOptions([matchedOptions, options])
}

export function buildProfitRequest(
  values: ProfitEstimateFormValues,
  airQuote: LogisticsQuoteOption,
  seaQuote: LogisticsQuoteOption
) {
  return {
    title: values.title || values.ali1688Url || '',
    site: values.site,
    salePrice: values.salePrice,
    purchasePrice: values.purchasePrice,
    lengthCm: values.lengthCm,
    widthCm: values.widthCm,
    heightCm: values.heightCm,
    weightGrams: Number((values.grossWeightKg * 1000).toFixed(2)),
    vatRate: siteVatRate(values.site),
    exchangeRate: values.site === 'AE' ? 1.96 : PROFIT_FORM_DEFAULTS.exchangeRate,
    domesticShippingFee: domesticShippingFee(values.grossWeightKg),
    warehouseDeliveryUnitPrice: PROFIT_FORM_DEFAULTS.warehouseDeliveryUnitPrice,
    airFreightUnitPrice: airQuote.unitPrice,
    oceanFreightUnitPrice: seaQuote.unitPrice,
    airFreightDimFactor: PROFIT_FORM_DEFAULTS.airFreightDimFactor,
    fbnCommissionRate: DEFAULT_CATEGORY_COMMISSION_RATE,
    fbpCommissionRate: DEFAULT_CATEGORY_COMMISSION_RATE,
    fbnOutboundFee: PROFIT_FORM_DEFAULTS.fbnOutboundFee,
    manualFbnOutboundFeeOverride: true,
    fbpDirectShipFee: PROFIT_FORM_DEFAULTS.fbpDirectShipFee,
    fulfillmentFee: PROFIT_FORM_DEFAULTS.fulfillmentFee
  }
}
