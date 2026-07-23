import type {
  PurchaseOrder,
  PurchaseOrderLogisticsQuoteChannelOption,
  PurchaseOrderLogisticsQuoteForwarderOption,
  PurchaseOrderLogisticsQuoteImportResult,
  ShippingOrder,
  ShippingOrderLine,
  ShippingOrderSegment
} from '../purchase-order/types';
import { sameCode } from './warehouseShippingQuoteDomain';
import type { WarehouseOrderJourney } from './warehouseOrderJourney';

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

export function filterPurchaseOrders(orders: PurchaseOrder[], keyword: string) {
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

export function isYiteQuoteForwarder(forwarder?: PurchaseOrderLogisticsQuoteForwarderOption | null) {
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

export function countPurchaseOrderSku(order: PurchaseOrder) {
  return new Set((order.items || [])
    .map((item) => item.partnerSku || item.skuParent || '')
    .filter(Boolean)).size;
}

export function sumPurchaseOrderQuantity(orders: PurchaseOrder[]) {
  return orders.reduce((total, order) => total + (order.items || [])
    .reduce((sum, item) => sum + Number(item.totalQuantity || 0), 0), 0);
}

export function shippingOrderStatusMeta(order: ShippingOrder) {
  if (order.shippingSubmitStatus === 'SUBMITTED') return { label: '已提交发货', color: 'green' };
  if (order.quoteStatus === 'CONFIRMED') return { label: '报价已确认', color: 'blue' };
  if (order.quoteStatus === 'EXPORTED') return { label: '已导出', color: 'cyan' };
  return { label: '待报价', color: 'gold' };
}

export function isLineQuoteConfirmed(line: ShippingOrderLine) {
  return line.quoteStatus === 'CONFIRMED';
}

export function applySelectedChannelQuoteToLine(
  line: ShippingOrderLine,
  channel?: PurchaseOrderLogisticsQuoteChannelOption
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
    yiteMaterial: quote.yiteMaterial ?? line.yiteMaterial
  } : line;
}

export function countShippingOrderPendingQuoteLines(order: ShippingOrder) {
  const segments = order.segments || [];
  const segmentById = new Map(segments.map((segment) => [segment.id, segment]));
  if (order.lines?.length) {
    return order.lines.filter((line) => {
      const segment = line.shippingOrderSegmentId ? segmentById.get(line.shippingOrderSegmentId) : undefined;
      return (!segment || !isZdShippingForwarder(segment)) && line.quoteStatus !== 'CONFIRMED';
    }).length;
  }
  if (segments.length) {
    return segments.filter((segment) => !isZdShippingForwarder(segment))
      .reduce((total, segment) => total + Number(segment.pendingQuoteLineCount || 0), 0);
  }
  return order.quoteStatus === 'CONFIRMED' ? 0 : Number(order.lineCount || 0);
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

export function quoteImportResultTitle(result: PurchaseOrderLogisticsQuoteImportResult) {
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
