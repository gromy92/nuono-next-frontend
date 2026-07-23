import { strict as assert } from 'node:assert';
import type { ShippingOrder } from '../purchase-order/types';
import { contractSources as sources } from './WarehouseShippingOrderContractSources';
import { countShippingOrderPendingQuoteLines } from './warehouseShippingOrderDomain';

const order = {
  quoteStatus: 'PENDING_QUOTE',
  segments: [
    { id: 'zd', forwarderCode: 'ZD', pendingQuoteLineCount: 3 },
    { id: 'et', forwarderCode: 'ET', pendingQuoteLineCount: 2 }
  ],
  lines: [
    { id: '1', shippingOrderSegmentId: 'zd', quoteStatus: 'PENDING_QUOTE' },
    { id: '2', shippingOrderSegmentId: 'et', quoteStatus: 'PENDING_QUOTE' },
    { id: '3', shippingOrderSegmentId: 'et', quoteStatus: 'CONFIRMED' }
  ]
} as ShippingOrder;
assert.equal(countShippingOrderPendingQuoteLines(order), 1, 'ZD 缺价不应阻塞整单提交');

assert.match(
  sources.submit,
  /handleSubmit[\s\S]*countShippingOrderPendingQuoteLines\(order\)[\s\S]*if \(pendingQuoteCount > 0\)[\s\S]*title: '报价缺失'[\s\S]*submitShippingOrder\(order\.id\)/
);
assert.match(sources.orderDomain, /isZdShippingForwarder[\s\S]*sameCode\(target\.forwarderCode, 'ZD'\)[\s\S]*众鸫/);
assert.match(
  sources.detailToolbar,
  /submitDisabled = quote\.warehouseOrderSubmitted \|\| !quote\.detailLines\.length[\s\S]*icon=\{<SendOutlined \/>\}[\s\S]*submit\.handleSubmit\(order\)/
);
assert.doesNotMatch(sources.page + sources.detailToolbar + sources.submit, /部分提交|PARTIAL_SUBMITTED/);
assert.match(
  sources.purchaseOrderApi,
  /export function submitShippingOrder\(shippingOrderId: string\)[\s\S]*'POST',[\s\S]*\{\}/
);
