import type {
  OrderLogisticsQuoteChannelLine,
  OrderLogisticsQuoteChannelOption
} from '../../logistics-quote/types';
import { normalizeForwarderEligibilityStatus } from './warehouseForwarderEligibilityDomain';
import type { ShippingOrderLine } from './warehouseShippingOrderTypes';
import { sameCode } from './warehouseShippingQuoteDomain';

export function applySelectedChannelQuoteToLine(
  line: ShippingOrderLine,
  channel?: OrderLogisticsQuoteChannelOption,
  scopeLines: ShippingOrderLine[]
): ShippingOrderLine {
  if (!channel) return line;
  const quote = resolveChannelLineQuote(line, channel.lineQuotes || [], scopeLines);
  if (!quote) return clearSelectedChannelQuote(line);
  return {
    ...line,
    quoteStatus: quote.quoteStatus || 'PENDING_QUOTE',
    unitPrice: quote.unitPrice ?? null,
    currency: quote.currency,
    billingUnit: quote.billingUnit,
    priceSource: quote.priceSource,
    yiteMaterial: quote.yiteMaterial ?? line.yiteMaterial,
    eligibilityStatus: normalizeForwarderEligibilityStatus(quote.eligibilityStatus)
  };
}

export function resolveChannelLineQuote(
  line: ShippingOrderLine,
  quotes: OrderLogisticsQuoteChannelLine[],
  scopeLines: ShippingOrderLine[]
) {
  const shippingLineMatches = quotes.filter((quote) => (
    text(quote.shippingOrderLineId) === text(line.id)
  ));
  if (shippingLineMatches.length) return uniqueConsistent(shippingLineMatches, line);

  const siteMatches = quotes.filter((quote) => (
    !text(quote.shippingOrderLineId)
    && text(quote.purchaseOrderItemSiteId) === text(line.purchaseOrderItemSiteId)
  ));
  if (siteMatches.length) return uniqueConsistent(siteMatches, line);

  if (!hasUniqueScopedPsku(line, scopeLines)) return undefined;
  const pskuMatches = quotes.filter((quote) => (
    !text(quote.shippingOrderLineId)
    && !text(quote.purchaseOrderItemSiteId)
    && sameCode(quote.partnerSku, line.partnerSku)
  ));
  return uniqueConsistent(pskuMatches, line);
}

function uniqueConsistent(quotes: OrderLogisticsQuoteChannelLine[], line: ShippingOrderLine) {
  if (quotes.length !== 1) return undefined;
  const quote = quotes[0];
  if (text(quote.shippingOrderLineId) && text(quote.shippingOrderLineId) !== text(line.id)) return undefined;
  if (text(quote.purchaseOrderItemSiteId)
    && text(quote.purchaseOrderItemSiteId) !== text(line.purchaseOrderItemSiteId)) return undefined;
  if (text(quote.partnerSku) && !sameCode(quote.partnerSku, line.partnerSku)) return undefined;
  return quote;
}

function hasUniqueScopedPsku(line: ShippingOrderLine, scopeLines: ShippingOrderLine[]) {
  if (!text(line.sourceStoreCode) || !text(line.purchaseOrderId)) return false;
  const matches = scopeLines.filter((candidate) => sameCode(candidate.partnerSku, line.partnerSku));
  return matches.length === 1 && matches[0].id === line.id;
}

function clearSelectedChannelQuote(line: ShippingOrderLine): ShippingOrderLine {
  return {
    ...line,
    quoteStatus: 'PENDING_QUOTE',
    unitPrice: null,
    currency: undefined,
    billingUnit: undefined,
    priceSource: undefined,
    eligibilityStatus: 'UNKNOWN'
  };
}

function text(value?: string) {
  return String(value || '').trim();
}
