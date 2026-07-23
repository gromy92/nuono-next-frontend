import type {
  PurchaseOrderLogisticsQuoteChannelOption,
  PurchaseOrderLogisticsQuoteForwarderOption,
  PurchaseOrderLogisticsQuoteOptions,
  ShippingOrderSegment
} from '../purchase-order/types';
import type { QuoteExportSelection } from './warehouseShippingOrderModels';

export function sameCode(left?: string, right?: string) {
  const normalizedLeft = (left || '').trim().toUpperCase();
  const normalizedRight = (right || '').trim().toUpperCase();
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}

export function segmentQuoteOptionChoices(options?: PurchaseOrderLogisticsQuoteOptions | null) {
  return (options?.forwarders || []).flatMap((forwarder) => (
    (forwarder.channels || []).map((channel) => ({ forwarder, channel }))
  ));
}

export function defaultSegmentQuoteSelection(
  options: PurchaseOrderLogisticsQuoteOptions,
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

export function firstAvailableSegmentQuoteSelection(options: PurchaseOrderLogisticsQuoteOptions) {
  const first = segmentQuoteOptionChoices(options)[0];
  return first
    ? { forwarderCode: first.forwarder.forwarderCode, routeCode: first.channel.routeCode }
    : {};
}

export function formatQuoteInputValue(value?: string | number | null) {
  return value === undefined || value === null || value === '' ? '' : String(value);
}

export function defaultQuoteBillingUnit(transportMode?: string) {
  return (transportMode || '').toUpperCase() === 'SEA' ? 'CBM' : 'KG';
}

export function quoteUnitDisplayText(transportMode?: string) {
  return `CNY / ${defaultQuoteBillingUnit(transportMode)}`;
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
  options?: PurchaseOrderLogisticsQuoteOptions | null,
  forwarderCode?: string
) {
  return forwarderCode
    ? options?.forwarders?.find((item) => item.forwarderCode === forwarderCode)
    : undefined;
}

export function findQuoteChannelOption(
  forwarder?: PurchaseOrderLogisticsQuoteForwarderOption,
  routeCode?: string
) {
  return routeCode ? forwarder?.channels?.find((item) => item.routeCode === routeCode) : undefined;
}

export function filterQuoteOptionsWithTemplates(
  options?: PurchaseOrderLogisticsQuoteOptions | null
): PurchaseOrderLogisticsQuoteOptions | null {
  return options
    ? { ...options, forwarders: (options.forwarders || []).filter((item) => Boolean(item.templateType)) }
    : null;
}

export function quoteExportEmptyDescription(options: PurchaseOrderLogisticsQuoteOptions) {
  return Number(options.unsupportedChannelCount || 0) > 0
    ? '当前只有未配置导出模板的货代渠道，不能导出审核单。'
    : '当前仓库单没有已配置模板的可导出渠道。';
}

export function quoteForwarderLabel(forwarder?: PurchaseOrderLogisticsQuoteForwarderOption) {
  const text = `${forwarder?.forwarderName || ''} ${forwarder?.forwarderCode || ''}`.trim();
  if (/义特|YITE|YT/i.test(text)) return '义特';
  if (/易通|\bET\b/i.test(text)) return '易通';
  if (/CHIC|QI ?KE|启客/i.test(text)) return 'CHIC';
  return forwarder?.forwarderName || forwarder?.forwarderCode || '-';
}

export function quoteChannelDisplayName(
  forwarder: PurchaseOrderLogisticsQuoteForwarderOption | undefined,
  channel: PurchaseOrderLogisticsQuoteChannelOption
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
  forwarder: PurchaseOrderLogisticsQuoteForwarderOption | undefined,
  channel: PurchaseOrderLogisticsQuoteChannelOption
) {
  return [quoteForwarderLabel(forwarder), channel.siteCode || channel.routeCode].filter(Boolean).join(' / ');
}

export function buildQuoteForwarderSelectOptions(options?: PurchaseOrderLogisticsQuoteOptions | null) {
  return (options?.forwarders || []).map((forwarder) => ({
    value: forwarder.forwarderCode,
    label: quoteForwarderLabel(forwarder)
  }));
}

export function buildQuoteChannelSelectOptions(forwarder?: PurchaseOrderLogisticsQuoteForwarderOption) {
  return (forwarder?.channels || []).map((channel) => ({
    value: channel.routeCode,
    label: quoteChannelLabel(forwarder, channel)
  }));
}
