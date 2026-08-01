import type {
  OrderLogisticsQuoteChannelOption,
  OrderLogisticsQuoteForwarderOption,
  OrderLogisticsQuoteOptions,
  OrderLogisticsQuotePublishedPrice
} from '../../logistics-quote/types';
import type { ShippingOrderSegment } from './warehouseShippingOrderTypes';
import type { QuoteBillingUnit, QuoteExportSelection } from './warehouseShippingOrderModels';
import { normalizeForwarderEligibilityStatus } from './warehouseForwarderEligibilityDomain';

export function sameCode(left?: string, right?: string) {
  const normalizedLeft = (left || '').trim().toUpperCase();
  const normalizedRight = (right || '').trim().toUpperCase();
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}

export function segmentQuoteOptionChoices(options?: OrderLogisticsQuoteOptions | null) {
  return (options?.forwarders || []).flatMap((forwarder) => (
    (forwarder.channels || []).map((channel) => ({ forwarder, channel }))
  ));
}

export function defaultSegmentQuoteSelection(
  options: OrderLogisticsQuoteOptions,
  segment?: ShippingOrderSegment
): QuoteExportSelection {
  const choices = segmentQuoteOptionChoices(options);
  const current = choices.find(({ forwarder, channel }) => (
    sameCode(forwarder.forwarderCode, segment?.forwarderCode)
    && sameCode(channel.routeCode, segment?.routeCode)
  ));
  if (current) {
    return { forwarderCode: current.forwarder.forwarderCode, routeCode: current.channel.routeCode };
  }
  return choices.length === 1
    ? { forwarderCode: choices[0].forwarder.forwarderCode, routeCode: choices[0].channel.routeCode }
    : {};
}

export function firstAvailableSegmentQuoteSelection(options: OrderLogisticsQuoteOptions) {
  const first = segmentQuoteOptionChoices(options)[0];
  return first
    ? { forwarderCode: first.forwarder.forwarderCode, routeCode: first.channel.routeCode }
    : {};
}

export function formatQuoteInputValue(value?: string | number | null) {
  return value === undefined || value === null || value === '' ? '' : String(value);
}

export function defaultQuoteBillingUnit(transportMode?: string) {
  return ((transportMode || '').toUpperCase() === 'SEA' ? 'CBM' : 'KG') as QuoteBillingUnit;
}

export function resolveQuoteBillingUnit(
  billingUnit?: string | null,
  transportMode?: string
): QuoteBillingUnit {
  const normalized = (billingUnit || '').trim().toUpperCase();
  return normalized === 'KG' || normalized === 'CBM'
    ? normalized
    : defaultQuoteBillingUnit(transportMode);
}

export function quoteUnitPriceFilterValue(
  value?: string | number | null,
  billingUnit?: string | null,
  transportMode?: string
) {
  if (value === undefined || value === null || String(value).trim() === '') return undefined;
  const amount = Number(value);
  const unit = resolveQuoteBillingUnit(billingUnit, transportMode);
  return Number.isFinite(amount) ? `PRICE:${amount}:${unit}` as const : undefined;
}

export function buildQuoteUnitPriceFilterOptions(
  lines: Array<{
    unitPrice?: string | number | null;
    billingUnit?: string | null;
    eligibilityStatus?: string;
  }>,
  transportMode?: string
) {
  const counts = new Map<string, number>();
  lines.filter((line) => (
    normalizeForwarderEligibilityStatus(line.eligibilityStatus) === 'SUPPORTED'
  )).forEach((line) => {
    const value = quoteUnitPriceFilterValue(line.unitPrice, line.billingUnit, transportMode);
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [
    { value: 'ALL' as const, label: `全部单价（${lines.length}）` },
    ...[...counts.entries()]
      .sort(([left], [right]) => {
        const [leftAmount, leftUnit] = left.slice(6).split(':');
        const [rightAmount, rightUnit] = right.slice(6).split(':');
        return Number(leftAmount) - Number(rightAmount) || leftUnit.localeCompare(rightUnit);
      })
      .map(([value, count]) => {
        const [amount, unit] = value.slice(6).split(':');
        return { value, label: `${formatPublishedNumber(Number(amount))} CNY / ${unit}（${count}）` };
      })
  ];
}

export function matchesQuoteUnitPriceFilter(
  value: string | number | null | undefined,
  billingUnit: string | null | undefined,
  filter: string,
  transportMode?: string
) {
  return filter === 'ALL' || quoteUnitPriceFilterValue(value, billingUnit, transportMode) === filter;
}

export function quotePriceSourceLabel(source?: string) {
  switch (source) {
    case 'SHIPPING_ORDER_SNAPSHOT': return '本单报价';
    case 'PRODUCT_CURRENT': return '';
    case 'LEGACY_CHANNEL_QUOTE': return '历史渠道价';
    default: return '';
  }
}

export type WarehouseQuotePriceState = 'PRICED' | 'MISSING_PRICE';

export function warehouseQuotePriceState(line: {
  unitPrice?: string | number | null;
}): WarehouseQuotePriceState {
  const unitPrice = Number(line.unitPrice);
  return line.unitPrice === null || line.unitPrice === undefined || line.unitPrice === '' ||
    !Number.isFinite(unitPrice) || unitPrice <= 0 ? 'MISSING_PRICE' : 'PRICED';
}

export function transportModeLabel(value?: string) {
  switch ((value || '').toUpperCase()) {
    case 'SEA': return '海运';
    case 'AIR': return '空运';
    case 'EXPRESS': return '快递';
    default: return value || '-';
  }
}

export function shippingOrderSegmentTabLabel(segment: ShippingOrderSegment) {
  return [segment.siteCode || '-', transportModeLabel(segment.transportMode)].join('-');
}

export function sortShippingOrderSegments(segments: ShippingOrderSegment[]) {
  return [...segments].sort((left, right) => {
    const siteDiff = segmentSiteRank(left.siteCode) - segmentSiteRank(right.siteCode);
    if (siteDiff !== 0) return siteDiff;
    const modeDiff = segmentTransportRank(left.transportMode) - segmentTransportRank(right.transportMode);
    return modeDiff !== 0
      ? modeDiff
      : String(left.segmentNo || '').localeCompare(String(right.segmentNo || ''));
  });
}

function segmentSiteRank(siteCode?: string) {
  if ((siteCode || '').toUpperCase() === 'SA') return 1;
  if ((siteCode || '').toUpperCase() === 'AE') return 2;
  return 10;
}

function segmentTransportRank(transportMode?: string) {
  switch ((transportMode || '').toUpperCase()) {
    case 'AIR': return 1;
    case 'SEA': return 2;
    case 'EXPRESS': return 3;
    default: return 10;
  }
}

export function shippingSubmitLabel(value?: string) {
  return (value || '').toUpperCase() === 'SUBMITTED' ? '已提交' : '未提交';
}

export function findQuoteForwarderOption(
  options?: OrderLogisticsQuoteOptions | null,
  forwarderCode?: string
) {
  return forwarderCode
    ? options?.forwarders?.find((item) => item.forwarderCode === forwarderCode)
    : undefined;
}

export function findQuoteChannelOption(
  forwarder?: OrderLogisticsQuoteForwarderOption,
  routeCode?: string
) {
  return routeCode ? forwarder?.channels?.find((item) => item.routeCode === routeCode) : undefined;
}

export function quoteExportEmptyDescription(_options: OrderLogisticsQuoteOptions) {
  return '当前站点/运输方式没有可导出的货代渠道。';
}

export function quoteForwarderLabel(forwarder?: OrderLogisticsQuoteForwarderOption) {
  const text = `${forwarder?.forwarderName || ''} ${forwarder?.forwarderCode || ''}`.trim();
  if (/义特|YITE|YT/i.test(text)) return '义特';
  if (/易通|\bET\b/i.test(text)) return '易通';
  if (/CHIC|QI ?KE|启客/i.test(text)) return 'CHIC';
  return forwarder?.forwarderName || forwarder?.forwarderCode || '-';
}

export function quoteChannelDisplayName(
  forwarder: OrderLogisticsQuoteForwarderOption | undefined,
  channel: OrderLogisticsQuoteChannelOption
) {
  const rawName = (channel.routeName || channel.routeCode || '-').trim();
  const candidates = [
    quoteForwarderLabel(forwarder),
    forwarder?.forwarderName,
    forwarder?.forwarderName?.replace(/(物流|供应链)$/u, '').trim(),
    forwarder?.forwarderCode
  ].filter((value): value is string => Boolean(value?.trim()));
  for (const candidate of candidates) {
    if (rawName.toUpperCase().startsWith(candidate.toUpperCase())) {
      return rawName.slice(candidate.length).replace(/^[\s/｜|:：-]+/, '').trim() || rawName;
    }
  }
  return rawName;
}

export function quoteChannelLabel(
  forwarder: OrderLogisticsQuoteForwarderOption | undefined,
  channel: OrderLogisticsQuoteChannelOption
) {
  return [quoteForwarderLabel(forwarder), channel.siteCode || channel.routeCode].filter(Boolean).join(' / ');
}

export function buildQuoteForwarderSelectOptions(options?: OrderLogisticsQuoteOptions | null) {
  return (options?.forwarders || []).map((forwarder) => ({
    value: forwarder.forwarderCode,
    label: quoteForwarderLabel(forwarder)
  }));
}

export function buildQuoteChannelSelectOptions(forwarder?: OrderLogisticsQuoteForwarderOption) {
  return (forwarder?.channels || []).map((channel) => ({
    value: channel.routeCode,
    label: quoteChannelLabel(forwarder, channel)
  }));
}

export function formatPublishedQuotePrice(price: OrderLogisticsQuotePublishedPrice) {
  const status = (price.priceStatus || '').toUpperCase();
  if ((status && status !== 'NORMAL') || price.unitPrice === null || price.unitPrice === undefined) {
    return '需询价';
  }
  return formatPublishedAmount(price.currency, price.unitPrice, price.billingUnit);
}

function formatPublishedAmount(currency: string | undefined, value: string | number, billingUnit?: string) {
  const amount = [currency || '', formatPublishedPriceNumber(value)].filter(Boolean).join(' ');
  return billingUnit ? `${amount}/${billingUnit}` : amount;
}

function formatPublishedPriceNumber(value: string | number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return number.toLocaleString('zh-CN', { maximumFractionDigits: 4, useGrouping: false });
}

function formatPublishedNumber(value: string | number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return number.toLocaleString('zh-CN', { maximumFractionDigits: 4 });
}
