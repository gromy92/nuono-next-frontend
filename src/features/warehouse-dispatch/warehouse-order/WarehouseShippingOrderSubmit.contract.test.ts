import { strict as assert } from 'node:assert';
import type { ShippingOrder } from './warehouseShippingOrderTypes';
import { contractSources as sources } from './WarehouseOrderContractSources';
import {
  countShippingOrderPendingQuoteLines,
  shippingOrderQuoteIssueSummary
} from './warehouseShippingOrderDomain';

const order = {
  quoteStatus: 'PENDING_QUOTE',
  segments: [
    { id: 'zd', forwarderCode: 'ZD', pendingQuoteLineCount: 3 },
    { id: 'et', forwarderCode: 'ET', pendingQuoteLineCount: 2 }
  ],
  lines: [
    { id: '1', shippingOrderSegmentId: 'zd', quoteStatus: 'PENDING_QUOTE' },
    { id: '2', shippingOrderSegmentId: 'et', quoteStatus: 'PENDING_QUOTE' },
    { id: '3', shippingOrderSegmentId: 'et', quoteStatus: 'PENDING_QUOTE', unitPrice: 65 }
  ]
} as ShippingOrder;
assert.equal(countShippingOrderPendingQuoteLines(order), 1, 'ZD 缺价不应阻塞整单提交');

const overlappingIssues = {
  segments: [{ id: 'yt', forwarderCode: 'YT' }],
  lines: [
    { id: '1', shippingOrderSegmentId: 'yt', quoteStatus: 'PENDING_QUOTE', yiteMaterial: '' },
    { id: '2', shippingOrderSegmentId: 'yt', quoteStatus: 'PENDING_QUOTE', unitPrice: 65, yiteMaterial: '' }
  ]
} as ShippingOrder;
assert.deepEqual(shippingOrderQuoteIssueSummary(overlappingIssues), {
  pendingQuoteCount: 1,
  missingMaterialCount: 2,
  unsupportedCount: 0,
  inquiryRequiredCount: 0,
  totalCount: 2
}, '报价状态和义特材质问题必须按商品行取并集，不能重复计数');

const pricedEligibilityBlocks = {
  segments: [{ id: 'et', forwarderCode: 'ET' }],
  lines: [
    {
      id: 'unsupported',
      shippingOrderSegmentId: 'et',
      unitPrice: 65,
      eligibilityStatus: 'UNSUPPORTED'
    },
    {
      id: 'inquiry',
      shippingOrderSegmentId: 'et',
      unitPrice: 66,
      eligibilityStatus: 'INQUIRY_REQUIRED'
    }
  ]
} as ShippingOrder;
assert.deepEqual(shippingOrderQuoteIssueSummary(pricedEligibilityBlocks), {
  pendingQuoteCount: 0,
  missingMaterialCount: 0,
  unsupportedCount: 1,
  inquiryRequiredCount: 1,
  totalCount: 2
}, '旧价格不能绕过不接或需询价承运门禁');

assert.match(
  sources.submit,
  /handleSubmit[\s\S]*shippingOrderQuoteIssueSummary\(order\)[\s\S]*if \(quoteIssue\.totalCount > 0\)[\s\S]*title: '暂不能提交发货'[\s\S]*submitShippingOrder\(order\.id\)/
);
assert.match(sources.submit, /import \{ App \} from 'antd'/);
assert.match(sources.submit, /const \{ modal, message \} = App\.useApp\(\)/);
assert.match(
  sources.submit,
  /当前货代不接[\s\S]*需询价确认[\s\S]*商品缺单价[\s\S]*缺少材质[\s\S]*title: '暂不能提交发货'[\s\S]*modal\.success\(\{[\s\S]*message\.error\(/
);
assert.doesNotMatch(sources.submit, /待确认|已确认/);
assert.doesNotMatch(sources.submit, /title: '义特材质缺失'/);
assert.doesNotMatch(
  sources.submit,
  /\bModal\.(?:warning|success)\(/,
  '提交反馈必须使用 App 上下文实例，避免静态 Modal 在 React 19 页面中不显示'
);
assert.match(sources.orderDomain, /isZdShippingForwarder[\s\S]*sameCode\(target\.forwarderCode, 'ZD'\)[\s\S]*众鸫/);
assert.match(
  sources.detailToolbar,
  /submitDisabled = quote\.warehouseOrderSubmitted \|\| !quote\.detailLines\.length[\s\S]*icon=\{<SendOutlined \/>\}[\s\S]*submit\.handleSubmit\(order\)/
);
assert.doesNotMatch(sources.page + sources.detailToolbar + sources.submit, /部分提交|PARTIAL_SUBMITTED/);
assert.match(
  sources.warehouseOrderApi,
  /export function submitShippingOrder\(shippingOrderId: string\)[\s\S]*'POST',[\s\S]*\{\}/
);
