import dayjs, { type Dayjs } from 'dayjs'
import { ProductDimensionOptionLabel } from '../product-baseline'
import type { OperationConfigDefaultVersionItem, OperationConfigProductDimensionOption, OperationConfigProductDimensionOptionsView, OperationConfigVersionDetail, OperationConfigVersionRow } from './types'
import { CALENDAR_ITEM_PRESETS, CALENDAR_SCOPE_OPTIONS, type CalendarScopePickerOption, type CalendarScopeType } from './versionLibraryTypes'

export function itemMeta(item: OperationConfigDefaultVersionItem) {
  return [item.valueType, item.defaultValue, calendarScopeText(item.resultShape)].filter(Boolean).join(' / ')
}

export function detailToRow(detail: OperationConfigVersionDetail): OperationConfigVersionRow {
  const { items: _items, ...row } = detail
  return row
}

export function calendarPresetFor(itemName?: string | null) {
  return CALENDAR_ITEM_PRESETS.find((preset) => preset.itemName === itemName)
}

export function isCalendarDateRangeItem(item: OperationConfigDefaultVersionItem) {
  const preset = calendarPresetFor(item.itemName)
  return (preset?.valueType ?? item.valueType) === '日期范围'
}

export function parseDateRangeValue(value?: string | null): [Dayjs, Dayjs] | undefined {
  if (!value) {
    return undefined
  }
  const match = value.match(/(\d{4}-\d{2}-\d{2}).*?(\d{4}-\d{2}-\d{2})/)
  if (!match) {
    return undefined
  }
  const start = dayjs(match[1])
  const end = dayjs(match[2])
  return start.isValid() && end.isValid() ? [start, end] : undefined
}

export function formatDateRangeValue(dates: [Dayjs | null, Dayjs | null] | null) {
  if (!dates?.[0] || !dates[1]) {
    return null
  }
  return `${dates[0].format('YYYY-MM-DD')} ~ ${dates[1].format('YYYY-MM-DD')}`
}

export function calendarDateRangeText(value?: string | null) {
  const dateRange = parseDateRangeValue(value)
  return dateRange ? formatDateRangeValue(dateRange) : null
}

export function calendarFactorValue(value?: string | null) {
  if (!value) {
    return null
  }
  const withoutDateRange = value.replace(/\d{4}-\d{2}-\d{2}.*?\d{4}-\d{2}-\d{2}/, '')
  const matches = withoutDateRange.match(/-?\d+(?:\.\d+)?/g)
  return matches?.[matches.length - 1] ?? null
}

export function composeCalendarDefaultValue(
  dateRange: string | null | undefined,
  factor: string | number | null | undefined
) {
  const normalizedDateRange = dateRange?.trim() || null
  const normalizedFactor = factor === null || factor === undefined ? null : String(factor).trim() || null
  if (normalizedDateRange && normalizedFactor) {
    return `${normalizedDateRange} / ${normalizedFactor}`
  }
  return normalizedDateRange ?? normalizedFactor
}

export function parseCalendarScope(resultShape?: string | null): { type: CalendarScopeType; value: string | null } {
  const raw = resultShape?.trim()
  if (!raw) {
    return { type: 'all_products', value: null }
  }
  const separator = raw.indexOf(':')
  const rawType = separator > 0 ? raw.slice(0, separator).trim().toLowerCase() : raw.toLowerCase()
  const rawValue = separator > 0 ? raw.slice(separator + 1).trim() : null
  if (rawType === 'brand') {
    return { type: 'brand', value: rawValue || null }
  }
  if (rawType === 'product_fulltype' || rawType === 'fulltype') {
    return { type: 'product_fulltype', value: rawValue || null }
  }
  if (rawType === 'category') {
    return { type: 'category', value: rawValue || null }
  }
  return { type: 'all_products', value: null }
}

export function formatCalendarScope(type: CalendarScopeType, value?: string | null) {
  if (type === 'all_products') {
    return 'all_products'
  }
  const normalizedValue = value?.trim()
  return normalizedValue ? `${type}:${normalizedValue}` : type
}

export function calendarScopeLabel(type: CalendarScopeType) {
  return CALENDAR_SCOPE_OPTIONS.find((option) => option.value === type)?.label ?? '全品'
}

export function calendarScopeRequiresValue(type: CalendarScopeType) {
  return Boolean(CALENDAR_SCOPE_OPTIONS.find((option) => option.value === type)?.requiresValue)
}

export function productDimensionSelectOptions(options?: OperationConfigProductDimensionOption[]): CalendarScopePickerOption[] {
  return (options ?? []).map((option) => ({
    value: option.value,
    label: <ProductDimensionOptionLabel label={option.label} value={option.value} usageCount={option.usageCount} />,
    title: option.label || option.value,
    searchText: `${option.label || ''} ${option.value}`
  }))
}

export function calendarScopeSelectOptions(
  type: CalendarScopeType,
  view?: OperationConfigProductDimensionOptionsView
) {
  if (type === 'brand') {
    return productDimensionSelectOptions(view?.brands)
  }
  if (type === 'product_fulltype') {
    return productDimensionSelectOptions(view?.productFulltypes)
  }
  if (type === 'category') {
    return productDimensionSelectOptions(view?.categories)
  }
  return []
}

export function calendarScopeUsesDimensionOptions(type: CalendarScopeType) {
  return type === 'brand' || type === 'product_fulltype' || type === 'category'
}

export function filterCalendarScopePickerOptions(options: CalendarScopePickerOption[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return options
  }
  return options.filter((option) => option.searchText.toLowerCase().includes(normalizedQuery))
}

export function calendarScopeText(resultShape?: string | null) {
  const scope = parseCalendarScope(resultShape)
  if (scope.type === 'all_products') {
    return '范围：全品'
  }
  return scope.value ? `${calendarScopeLabel(scope.type)}：${scope.value}` : `${calendarScopeLabel(scope.type)}：未设置`
}

