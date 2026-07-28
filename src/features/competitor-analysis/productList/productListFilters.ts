export const ZERO_COUNT_FILTER_OPTIONS = [
  { label: '监控为0', value: 'monitorZero' },
  { label: '候选为0', value: 'candidateZero' }
] as const

export const PRODUCT_SORT_OPTIONS = [
  { label: '候选数↓', value: 'candidateCountDesc' },
  { label: '候选数↑', value: 'candidateCountAsc' },
  { label: '监控数↓', value: 'monitoredCountDesc' },
  { label: '监控数↑', value: 'monitoredCountAsc' },
  { label: '7日变化次数↓', value: 'recent7dChangeCountDesc' },
  { label: '7日变化次数↑', value: 'recent7dChangeCountAsc' }
] as const

export type ProductSortValue = (typeof PRODUCT_SORT_OPTIONS)[number]['value']
export type ProductFilterValue =
  | (typeof ZERO_COUNT_FILTER_OPTIONS)[number]['value']
  | ProductSortValue

export const DEFAULT_PRODUCT_SORT_BY: ProductSortValue = 'candidateCountDesc'

const PRODUCT_SORT_VALUE_SET = new Set<string>(
  PRODUCT_SORT_OPTIONS.map((option) => option.value)
)

export function productFilterValues(
  monitorZeroOnly: boolean,
  candidateZeroOnly: boolean,
  sortBy: ProductSortValue
): ProductFilterValue[] {
  return [
    ...(monitorZeroOnly ? (['monitorZero'] as const) : []),
    ...(candidateZeroOnly ? (['candidateZero'] as const) : []),
    sortBy
  ]
}

export function parseProductFilterValues(values: ProductFilterValue[]) {
  const valueSet = new Set(values)
  const selectedSortValues = values.filter(isProductSortValue)
  return {
    monitorZeroOnly: valueSet.has('monitorZero'),
    candidateZeroOnly: valueSet.has('candidateZero'),
    sortBy:
      selectedSortValues[selectedSortValues.length - 1] ||
      DEFAULT_PRODUCT_SORT_BY
  }
}

function isProductSortValue(value: string): value is ProductSortValue {
  return PRODUCT_SORT_VALUE_SET.has(value)
}
