import type {
  CargoCategoryOption,
  CostFilters,
  ProductLogisticsCostRow,
  ProductLogisticsRateCardRow,
  ProductLogisticsRouteOption
} from './productLogisticsCostModels';
import {
  DEFAULT_FILTERS,
  TRANSPORT_OPTIONS,
  UNCATEGORIZED_CATEGORY_FILTER
} from './productLogisticsCostModels';

const FREIGHT_CATEGORY_OPTIONS: CargoCategoryOption[] = ['A', 'B', 'C', 'D', 'E', 'F'].map((code) => ({
  label: `${code}类别运费`,
  value: code,
  cargoCategoryName: `${code}类别运费`
}));

const CHIC_CATEGORY_OPTIONS_BY_SITE: Record<string, CargoCategoryOption[]> = {
  SA: [
    { label: '沙特-普货', value: 'SA_GENERAL', cargoCategoryName: '沙特-普货' },
    { label: '沙特-化妆品及液体', value: 'SA_COSMETICS_LIQUID', cargoCategoryName: '沙特-化妆品及液体' }
  ],
  AE: [
    { label: '阿联酋-普货', value: 'AE_GENERAL', cargoCategoryName: '阿联酋-普货' },
    { label: '阿联酋-化妆品及液体', value: 'AE_COSMETICS_LIQUID', cargoCategoryName: '阿联酋-化妆品及液体' }
  ]
};

export function normalizeSite(value?: string | null) {
  return value?.trim().toUpperCase() || DEFAULT_FILTERS.siteCode;
}

export function textValue(value?: string | number | null) {
  return value === null || value === undefined ? '' : String(value).trim();
}

export function normalizeCategoryFilterValue(value?: string | null) {
  return textValue(value).toUpperCase();
}

function forwarderLabel(forwarderCode: string, forwarderName?: string | null) {
  const code = textValue(forwarderCode).toUpperCase();
  const name = textValue(forwarderName);
  if (code === 'ZD' && name && name.toUpperCase() !== code) {
    return `ZD · ${name}`;
  }
  return name || code;
}

export function routeOptionsFromRateCards(rows: ProductLogisticsRateCardRow[]) {
  const options = new Map<string, ProductLogisticsRouteOption>();
  rows.forEach((row) => {
    const siteCode = normalizeSite(row.siteCode);
    const forwarderCode = textValue(row.forwarderCode).toUpperCase();
    const transportMode = textValue(row.transportMode).toUpperCase();
    if (!forwarderCode || !transportMode) return;
    const key = `${siteCode}|${forwarderCode}|${transportMode}`;
    options.set(key, {
      siteCode,
      forwarderCode,
      forwarderName: forwarderLabel(forwarderCode, row.forwarderName),
      transportMode
    });
  });
  return Array.from(options.values());
}

export function forwarderOptionsFromRateCards(rows: ProductLogisticsRateCardRow[]) {
  const preferredOrder = new Map(['YITE', 'ET', 'QIKE'].map((code, index) => [code, index]));
  const options = new Map<string, { label: string; value: string }>();
  routeOptionsFromRateCards(rows).forEach((route) => {
    options.set(route.forwarderCode, {
      label: route.forwarderName,
      value: route.forwarderCode
    });
  });
  return Array.from(options.values()).sort((left, right) => {
    const leftOrder = preferredOrder.get(left.value) ?? preferredOrder.size;
    const rightOrder = preferredOrder.get(right.value) ?? preferredOrder.size;
    return leftOrder !== rightOrder
      ? leftOrder - rightOrder
      : left.label.localeCompare(right.label, 'zh-CN');
  });
}

export function transportOptionsForForwarder(
  forwarderCode: string,
  routes: ProductLogisticsRouteOption[]
) {
  const supportedModes = new Set(
    routes
      .filter((route) => route.forwarderCode === forwarderCode)
      .map((route) => route.transportMode)
  );
  const options = TRANSPORT_OPTIONS.filter((option) => supportedModes.has(option.value));
  return options.length ? options : TRANSPORT_OPTIONS;
}

export function normalizeRouteFilters(
  filters: CostFilters,
  routes: ProductLogisticsRouteOption[] = []
): CostFilters {
  const options = transportOptionsForForwarder(filters.forwarderCode, routes);
  const transportMode = options.some((option) => option.value === filters.transportMode)
    ? filters.transportMode
    : options[0]?.value || filters.transportMode;
  return { ...filters, transportMode };
}

export function defaultFiltersForSite(siteCode: string): CostFilters {
  const normalizedSite = normalizeSite(siteCode);
  const route = normalizedSite === 'AE'
    ? { forwarderCode: 'ET', transportMode: 'SEA' }
    : {};
  return normalizeRouteFilters({ ...DEFAULT_FILTERS, ...route, siteCode: normalizedSite });
}

export function categoryOptionsForRoute(filters: Pick<CostFilters, 'siteCode' | 'forwarderCode'>) {
  if (filters.forwarderCode === 'QIKE') {
    return CHIC_CATEGORY_OPTIONS_BY_SITE[normalizeSite(filters.siteCode)] || CHIC_CATEGORY_OPTIONS_BY_SITE.SA;
  }
  return FREIGHT_CATEGORY_OPTIONS;
}

export function categoryNameForValue(options: CargoCategoryOption[], value?: string) {
  return value ? options.find((option) => option.value === value)?.cargoCategoryName || value : undefined;
}

export function formatPrice(value?: number | null) {
  return value === null || value === undefined
    ? '-'
    : value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function categoryFilterLabel(
  label: string,
  count: number,
  rateCard?: ProductLogisticsRateCardRow
) {
  const quote = rateCard
    ? `¥${rateCard.unitCostCny.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}/${rateCard.chargeUnit || '-'}`
    : '未报价';
  return `${label} · ${quote} · ${count}件`;
}

export function formatShortDate(value?: string | null) {
  if (!value) {
    return '-';
  }
  const date = value.replace('T', ' ').slice(0, 10);
  return date.length === 10 ? date.slice(2) : date;
}

export function transportLabel(value?: string | null) {
  return value === 'SEA' ? '海运' : value === 'AIR' ? '空运' : value || '-';
}

function compactCategoryName(value: string) {
  return value
    .replace(/^沙特[-－]/, '')
    .replace(/^阿联酋[-－]/, '')
    .replace(/^SA[_-]/i, '')
    .replace(/^AE[_-]/i, '')
    .replace(/_/g, ' ');
}

export function categoryLabel(row?: ProductLogisticsCostRow) {
  const code = textValue(row?.cargoCategoryCode);
  if (/^[A-Za-z]$/.test(code)) {
    return code.charAt(0).toUpperCase();
  }
  const name = textValue(row?.cargoCategoryName);
  return name ? compactCategoryName(name) : code ? compactCategoryName(code) : '-';
}

export function categoryTitle(row?: ProductLogisticsCostRow) {
  return textValue(row?.cargoCategoryName) || textValue(row?.cargoCategoryCode) || undefined;
}

export function categoryFilterValue(row?: ProductLogisticsCostRow) {
  const code = normalizeCategoryFilterValue(row?.cargoCategoryCode);
  if (code) {
    return code;
  }
  return textValue(row?.cargoCategoryName) || UNCATEGORIZED_CATEGORY_FILTER;
}

export function categoryFilterOptionsFromRows(rows: ProductLogisticsCostRow[]) {
  const options = new Map<string, CargoCategoryOption>();
  rows.forEach((row) => {
    const value = categoryFilterValue(row);
    if (options.has(value)) {
      return;
    }
    const label = value === UNCATEGORIZED_CATEGORY_FILTER ? '未分类' : categoryLabel(row);
    options.set(value, { label, value, cargoCategoryName: categoryTitle(row) || label });
  });
  return Array.from(options.values()).sort((left, right) => {
    if (left.value === UNCATEGORIZED_CATEGORY_FILTER) return 1;
    if (right.value === UNCATEGORIZED_CATEGORY_FILTER) return -1;
    return left.label.localeCompare(right.label, 'zh-CN', { numeric: true });
  });
}

export function rateCardOptionsFromRows(rows: ProductLogisticsRateCardRow[]) {
  return rows.map((row) => {
    const value = normalizeCategoryFilterValue(row.cargoCategoryCode);
    const name = textValue(row.cargoCategoryName) || value;
    const label = /^[A-Za-z]$/.test(value) ? value : compactCategoryName(name);
    return {
      label: `${label} · ${formatPrice(row.unitCostCny)} ${row.chargeUnit || row.currencyCode || '-'}`,
      value,
      cargoCategoryName: name
    };
  }).filter((option) => !!option.value)
    .sort((left, right) => left.value.localeCompare(right.value, 'zh-CN', { numeric: true }));
}

export function rateCardFilterOptionsFromRows(rows: ProductLogisticsRateCardRow[]) {
  return rateCardOptionsFromRows(rows).map((option) => ({
    ...option,
    label: option.label.split(' · ')[0]
  }));
}

export function mergeCategoryOptions(base: CargoCategoryOption[], preferred: CargoCategoryOption[]) {
  const options = new Map(base.map((option) => [option.value, option]));
  preferred.forEach((option) => {
    options.set(option.value, {
      ...option,
      cargoCategoryName: option.cargoCategoryName || options.get(option.value)?.cargoCategoryName || option.value
    });
  });
  return Array.from(options.values());
}

export function rateCardByCategory(rows: ProductLogisticsRateCardRow[]) {
  const result = new Map<string, ProductLogisticsRateCardRow>();
  rows.forEach((row) => {
    const key = normalizeCategoryFilterValue(row.cargoCategoryCode);
    if (key && !result.has(key)) result.set(key, row);
  });
  return result;
}

export function optionLabel(options: Array<{ label: string; value: string }>, value: string) {
  return options.find((option) => option.value === value)?.label || value;
}
