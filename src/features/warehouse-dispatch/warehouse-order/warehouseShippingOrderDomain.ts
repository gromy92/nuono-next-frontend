import type {
  OrderLogisticsQuoteChannelOption,
  OrderLogisticsQuoteForwarderOption,
  OrderLogisticsQuoteImportResult
} from '../../logistics-quote/types';
import type {
  ShippingOrder,
  ShippingOrderLine,
  ShippingOrderSegment
} from './warehouseShippingOrderTypes';
import type {
  WarehouseOrderPurchaseCandidate
} from './warehouseOrderPurchaseCandidateAdapter';
import { sameCode } from './warehouseShippingQuoteDomain';
import type { WarehouseOrderJourney } from './warehouseOrderJourney';
import { warehouseOrderJourneyStatusMeta } from './warehouseOrderJourney';

export type ShippingOrderStatusFilter =
  | 'all'
  | 'QUOTE_PENDING'
  | 'QUOTE_EXPORTED'
  | 'QUOTE_CONFIRMED'
  | 'SHIPPING_SUBMITTED'
  | 'OPTION_SELECTED'
  | 'OUTBOUND_CREATED'
  | 'PACKING'
  | 'PACKED'
  | 'SHIPPED'
  | 'PLANNING';

export const SHIPPING_ORDER_STATUS_FILTER_OPTIONS: Array<{
  label: string;
  value: ShippingOrderStatusFilter;
}> = [
  { label: '全部状态', value: 'all' },
  { label: '报价缺失', value: 'QUOTE_PENDING' },
  { label: '已导出', value: 'QUOTE_EXPORTED' },
  { label: '报价完整', value: 'QUOTE_CONFIRMED' },
  { label: '已提交发货', value: 'SHIPPING_SUBMITTED' },
  { label: '计划中', value: 'PLANNING' },
  { label: '已选物流', value: 'OPTION_SELECTED' },
  { label: '待装箱', value: 'OUTBOUND_CREATED' },
  { label: '装箱中', value: 'PACKING' },
  { label: '待物流交接', value: 'PACKED' },
  { label: '已发运', value: 'SHIPPED' }
];

export function filterShippingOrders(
  orders: ShippingOrder[],
  keyword: string,
  journeysByOrder = new Map<string, WarehouseOrderJourney[]>()
) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return orders;
  return orders.filter((order) => [
    order.shippingOrderNo,
    order.title,
    order.forwarderName,
    order.routeName,
    order.remark,
    ...(journeysByOrder.get(order.id) || []).flatMap((journey) => [
      journey.shippingBatchNo,
      journey.status
    ]),
    ...(order.lines || []).flatMap((line) => [
      line.partnerSku,
      line.skuParent,
      line.productTitle,
      line.sourceStoreName,
      line.sourceStoreCode,
      line.purchaseOrderNo
    ])
  ].filter(Boolean).join(' ').toLowerCase().includes(normalized));
}

export function filterShippingOrdersByStatus(
  orders: ShippingOrder[],
  statusFilter: ShippingOrderStatusFilter,
  journeysByOrder = new Map<string, WarehouseOrderJourney[]>()
) {
  if (statusFilter === 'all') return orders;
  return orders.filter((order) => (
    shippingOrderStatusCode(order, journeysByOrder.get(order.id) || []) === statusFilter
  ));
}

export function filterPurchaseOrders(orders: WarehouseOrderPurchaseCandidate[], keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return orders;
  return orders.filter((order) => [
    order.orderNo,
    order.title,
    order.storeName,
    order.storeCode,
    ...(order.items || []).flatMap((item) => [
      item.partnerSku,
      item.skuParent,
      item.productTitle,
      item.sourceTitle,
      item.sourceTitleCn,
      ...(item.allocations || []).map((allocation) => allocation.pskuCode)
    ])
  ].filter(Boolean).join(' ').toLowerCase().includes(normalized));
}

export function shippingOrderLineImageUrl(line: ShippingOrderLine) {
  return line.productImageUrl || undefined;
}

export function shippingOrderLineTitleCn(line: ShippingOrderLine) {
  return line.productTitleCn || line.productTitle || line.partnerSku || line.pskuCode || '-';
}

export function shippingOrderLineTitleEn(line: ShippingOrderLine) {
  return line.productTitleEn || line.productTitle || line.partnerSku || line.pskuCode || '-';
}

export function isYiteSegment(segment: ShippingOrderSegment) {
  return /义特|YITE|\bYT\b/i.test(`${segment.forwarderCode || ''} ${segment.forwarderName || ''}`.trim());
}

export function isYiteQuoteForwarder(forwarder?: OrderLogisticsQuoteForwarderOption | null) {
  return /义特|YITE|\bYT\b/i.test(`${forwarder?.forwarderCode || ''} ${forwarder?.forwarderName || ''}`.trim());
}

export function isMissingYiteQuoteMaterial(line: ShippingOrderLine) {
  return !line.yiteMaterial?.trim();
}

export function isMissingYiteMaterial(line: ShippingOrderLine, yiteSegmentIds: Set<string>) {
  return Boolean(line.shippingOrderSegmentId
    && yiteSegmentIds.has(line.shippingOrderSegmentId)
    && !line.yiteMaterial?.trim());
}

export function countPurchaseOrderSku(order: WarehouseOrderPurchaseCandidate) {
  return new Set((order.items || [])
    .map((item) => item.partnerSku || item.skuParent || '')
    .filter(Boolean)).size;
}

export function sumPurchaseOrderQuantity(orders: WarehouseOrderPurchaseCandidate[]) {
  return orders.reduce((total, order) => total + (order.items || [])
    .reduce((sum, item) => sum + Number(item.totalQuantity || 0), 0), 0);
}

export function shippingOrderStatusMeta(order: ShippingOrder, journeys: WarehouseOrderJourney[] = []) {
  const status = shippingOrderStatusCode(order, journeys);
  if (status === 'SHIPPING_SUBMITTED') return { label: '已提交发货', color: 'green' };
  if (status === 'QUOTE_CONFIRMED') return { label: '报价完整', color: 'blue' };
  if (status === 'QUOTE_EXPORTED') return { label: '已导出', color: 'cyan' };
  if (status === 'QUOTE_PENDING') return { label: '报价缺失', color: 'gold' };
  return warehouseOrderJourneyStatusMeta(status);
}

export function shippingOrderStatusCode(
  order: ShippingOrder,
  journeys: WarehouseOrderJourney[] = []
): ShippingOrderStatusFilter {
  if (journeys.length) {
    const rank = { OPTION_SELECTED: 1, OUTBOUND_CREATED: 2, PACKING: 3, PACKED: 4, SHIPPED: 5 } as const;
    const current = journeys.reduce((earliest, journey) => (
      (rank[journey.status as keyof typeof rank] || 0) < (rank[earliest.status as keyof typeof rank] || 0)
        ? journey
        : earliest
    ));
    return isKnownJourneyStatus(current.status) ? current.status : 'PLANNING';
  }
  if (order.shippingSubmitStatus === 'SUBMITTED') return 'SHIPPING_SUBMITTED';
  if (order.quoteStatus === 'CONFIRMED') return 'QUOTE_CONFIRMED';
  if (order.quoteStatus === 'EXPORTED') return 'QUOTE_EXPORTED';
  return 'QUOTE_PENDING';
}

function isKnownJourneyStatus(status: string): status is Exclude<
  ShippingOrderStatusFilter,
  'all' | 'QUOTE_PENDING' | 'QUOTE_EXPORTED' | 'QUOTE_CONFIRMED' | 'SHIPPING_SUBMITTED' | 'PLANNING'
> {
  return ['OPTION_SELECTED', 'OUTBOUND_CREATED', 'PACKING', 'PACKED', 'SHIPPED'].includes(status);
}

export function hasLineQuotePrice(line: ShippingOrderLine) {
  const unitPrice = Number(line.unitPrice);
  return line.unitPrice !== null
    && line.unitPrice !== undefined
    && line.unitPrice !== ''
    && Number.isFinite(unitPrice)
    && unitPrice > 0;
}

export function applySelectedChannelQuoteToLine(
  line: ShippingOrderLine,
  channel?: OrderLogisticsQuoteChannelOption
): ShippingOrderLine {
  const quote = channel?.lineQuotes?.find((item) => (
    (item.shippingOrderLineId && item.shippingOrderLineId === line.id)
    || (item.purchaseOrderItemSiteId && item.purchaseOrderItemSiteId === line.purchaseOrderItemSiteId)
    || (item.partnerSku && sameCode(item.partnerSku, line.partnerSku))
  ));
  return quote ? {
    ...line,
    quoteStatus: quote.quoteStatus || 'PENDING_QUOTE',
    unitPrice: quote.unitPrice ?? null,
    currency: quote.currency,
    billingUnit: quote.billingUnit,
    priceSource: quote.priceSource,
    yiteMaterial: quote.yiteMaterial ?? line.yiteMaterial,
    eligibilityStatus: quote.eligibilityStatus || 'SUPPORTED'
  } : line;
}

export function countShippingOrderPendingQuoteLines(order: ShippingOrder) {
  const segments = order.segments || [];
  const segmentById = new Map(segments.map((segment) => [segment.id, segment]));
  if (order.lines?.length) {
    return order.lines.filter((line) => {
      const segment = line.shippingOrderSegmentId ? segmentById.get(line.shippingOrderSegmentId) : undefined;
      return (!segment || !isZdShippingForwarder(segment)) && !hasLineQuotePrice(line);
    }).length;
  }
  if (segments.length) {
    return segments.filter((segment) => !isZdShippingForwarder(segment))
      .reduce((total, segment) => total + Number(segment.pendingQuoteLineCount || 0), 0);
  }
  return order.quoteStatus === 'CONFIRMED' ? 0 : Number(order.lineCount || 0);
}

export function shippingOrderQuoteIssueSummary(order: ShippingOrder) {
  const pendingQuoteCount = countShippingOrderPendingQuoteLines(order);
  if (!order.lines?.length) {
    const missingMaterialCount = Number(order.missingYiteMaterialCount || 0);
    return {
      pendingQuoteCount,
      missingMaterialCount,
      // 列表接口只有两个可能重叠的汇总数，取较大值可避免把同一商品重复计数。
      totalCount: Math.max(pendingQuoteCount, missingMaterialCount)
    };
  }
  const segmentById = new Map((order.segments || []).map((segment) => [segment.id, segment]));
  const yiteSegmentIds = new Set((order.segments || []).filter(isYiteSegment).map((segment) => segment.id));
  const missingMaterialCount = order.lines
    .filter((line) => isMissingYiteMaterial(line, yiteSegmentIds)).length;
  const totalCount = order.lines.filter((line) => {
    const segment = line.shippingOrderSegmentId ? segmentById.get(line.shippingOrderSegmentId) : undefined;
    const quoteIncomplete = (!segment || !isZdShippingForwarder(segment))
      && !hasLineQuotePrice(line);
    return quoteIncomplete || isMissingYiteMaterial(line, yiteSegmentIds);
  }).length;
  return { pendingQuoteCount, missingMaterialCount, totalCount };
}

function isZdShippingForwarder(target: {
  forwarderCode?: string;
  forwarderName?: string;
  routeCode?: string;
  routeName?: string;
}) {
  const routeCode = (target.routeCode || '').trim().toUpperCase();
  const text = `${target.forwarderName || ''} ${target.routeName || ''}`.trim();
  return sameCode(target.forwarderCode, 'ZD')
    || routeCode === 'ZD'
    || routeCode.startsWith('ZD-')
    || /众鸫|众东/.test(text);
}

export function formatQuantity(value: number) {
  return Number(value || 0).toLocaleString('zh-CN');
}

export function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function quoteImportResultTitle(result: OrderLogisticsQuoteImportResult) {
  const updated = Number(result.updatedRows || 0);
  const skipped = Number(result.skippedRows || 0);
  if (updated > 0 && skipped > 0) return `已回传 ${formatQuantity(updated)} 行，跳过 ${formatQuantity(skipped)} 行`;
  if (updated > 0) return `已回传 ${formatQuantity(updated)} 行`;
  return '报价未更新';
}

export function sameStringSet(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}
