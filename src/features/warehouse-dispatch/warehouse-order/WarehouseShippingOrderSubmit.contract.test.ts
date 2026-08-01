import { strict as assert } from 'node:assert';
import type { ShippingOrder } from './warehouseShippingOrderTypes';
import { contractSources as sources } from './WarehouseOrderContractSources';
import {
  countShippingOrderPendingQuoteLines,
  isExactlyNotSubmitted,
  shippingOrderQuoteIssueSummary
} from './warehouseShippingOrderDomain';

assert.equal(isExactlyNotSubmitted('NOT_SUBMITTED'), true);
assert.equal(isExactlyNotSubmitted(' not_submitted '), true);
for (const status of [undefined, null, '', 'SUBMITTED', 'UNKNOWN', 'FUTURE_STATUS']) {
  assert.equal(isExactlyNotSubmitted(status), false, `${status ?? 'blank'} 必须 fail-closed`);
}

const order = {
  quoteStatus: 'PENDING_QUOTE',
  segments: [
    { id: 'zd', forwarderCode: 'ZD', pendingQuoteLineCount: 3 },
    { id: 'et', forwarderCode: 'ET', pendingQuoteLineCount: 2 }
  ],
  lines: [
    { id: '1', shippingOrderSegmentId: 'zd', quoteStatus: 'PENDING_QUOTE', eligibilityStatus: 'SUPPORTED' },
    { id: '2', shippingOrderSegmentId: 'et', quoteStatus: 'PENDING_QUOTE', eligibilityStatus: 'SUPPORTED' },
    { id: '3', shippingOrderSegmentId: 'et', quoteStatus: 'PENDING_QUOTE', unitPrice: 65,
      eligibilityStatus: 'SUPPORTED' }
  ]
} as ShippingOrder;
assert.equal(countShippingOrderPendingQuoteLines(order), 1, 'ZD 缺价不应阻塞整单提交');

const nameOnlyZd = {
  segments: [{
    id: 'name-only-zd',
    forwarderCode: 'CHIC',
    forwarderName: '众鸫供应链',
    routeCode: 'CHIC-SA-AIR',
    routeName: '众东物流专线'
  }],
  lines: [{
    id: 'name-only-line',
    shippingOrderSegmentId: 'name-only-zd',
    quoteStatus: 'PENDING_QUOTE',
    eligibilityStatus: 'SUPPORTED'
  }]
} as ShippingOrder;
assert.equal(
  countShippingOrderPendingQuoteLines(nameOnlyZd),
  1,
  '展示名称不能冒充 ZD 机器身份并绕过缺价门禁'
);

const routeIdentifiedZd = {
  segments: [{ id: 'route-zd', forwarderCode: 'CHIC', routeCode: 'ZD-SA-AIR' }],
  lines: [{
    id: 'route-zd-line',
    shippingOrderSegmentId: 'route-zd',
    quoteStatus: 'PENDING_QUOTE',
    eligibilityStatus: 'SUPPORTED'
  }]
} as ShippingOrder;
assert.equal(countShippingOrderPendingQuoteLines(routeIdentifiedZd), 0, 'ZD 线路机器码应保留无价豁免');

const overlappingIssues = {
  segments: [{ id: 'yt', forwarderCode: 'YT' }],
  lines: [
    { id: '1', shippingOrderSegmentId: 'yt', quoteStatus: 'PENDING_QUOTE', yiteMaterial: '',
      eligibilityStatus: 'SUPPORTED' },
    { id: '2', shippingOrderSegmentId: 'yt', quoteStatus: 'PENDING_QUOTE', unitPrice: 65, yiteMaterial: '',
      eligibilityStatus: 'SUPPORTED' }
  ]
} as ShippingOrder;
assert.deepEqual(shippingOrderQuoteIssueSummary(overlappingIssues), {
  pendingQuoteCount: 1,
  missingMaterialCount: 2,
  unsupportedCount: 0,
  inquiryRequiredCount: 0,
  unknownEligibilityCount: 0,
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
  unknownEligibilityCount: 0,
  totalCount: 2
}, '旧价格不能绕过不接或需询价承运门禁');

const unknownEligibilityBlocks = {
  segments: [{ id: 'et', forwarderCode: 'ET' }],
  lines: [
    { id: 'blank', shippingOrderSegmentId: 'et', unitPrice: 65, eligibilityStatus: '' },
    { id: 'future', shippingOrderSegmentId: 'et', unitPrice: 66, eligibilityStatus: 'FUTURE_STATUS' }
  ]
} as ShippingOrder;
assert.deepEqual(shippingOrderQuoteIssueSummary(unknownEligibilityBlocks), {
  pendingQuoteCount: 0,
  missingMaterialCount: 0,
  unsupportedCount: 0,
  inquiryRequiredCount: 0,
  unknownEligibilityCount: 2,
  totalCount: 2
}, '空白和未来承运状态必须 fail-closed');

assert.match(
  sources.submit,
  /handleSubmit[\s\S]*shippingOrderQuoteIssueSummary\(order\)[\s\S]*if \(quoteIssue\.totalCount > 0\)[\s\S]*title: '暂不能提交发货'[\s\S]*submitShippingOrder\(order\.id\)/
);
assert.match(sources.submit, /import \{ App \} from 'antd'/);
assert.match(sources.submit, /const \{ modal, message \} = App\.useApp\(\)/);
assert.match(
  sources.submit,
  /当前货代不接[\s\S]*需询价确认[\s\S]*承运状态待确认[\s\S]*商品缺单价[\s\S]*缺少材质[\s\S]*title: '暂不能提交发货'[\s\S]*modal\.success\(\{[\s\S]*message\.error\(/
);
assert.doesNotMatch(sources.submit, /已确认|PENDING_CONFIRMATION/);
assert.doesNotMatch(sources.submit, /title: '义特材质缺失'/);
assert.doesNotMatch(
  sources.submit,
  /\bModal\.(?:warning|success)\(/,
  '提交反馈必须使用 App 上下文实例，避免静态 Modal 在 React 19 页面中不显示'
);
assert.match(sources.orderDomain, /isZdShippingForwarder[\s\S]*sameCode\(target\.forwarderCode, 'ZD'\)[\s\S]*众鸫/);
assert.match(
  sources.detailToolbar,
  /submitDisabled = !quote\.warehouseOrderMutable \|\| !quote\.detailLines\.length[\s\S]*icon=\{<SendOutlined \/>\}[\s\S]*submit\.handleSubmit\(order\)/
);
assert.match(sources.submit, /mutableStatuses[\s\S]*every\(isExactlyNotSubmitted\)[\s\S]*当前状态不可提交/);
assert.match(
  sources.submit,
  /submitShippingOrder\(order\.id\)[\s\S]*acceptCurrentInteractionResponse\(action\.request, result\.shippingOrderId\)[\s\S]*result\.submittedLineCount/
);
assert.match(sources.sharedViews, /DetailSegmentChips[\s\S]*disabled\?: boolean[\s\S]*disabled=\{disabled\}/);
assert.match(sources.detailToolbar, /DetailSegmentChips[\s\S]*disabled=\{Boolean\(data\.actionKey\)\}/);
assert.match(sources.quoteState, /firstOpen[\s\S]*isExactlyNotSubmitted[\s\S]*detailMutationAllowed/);
assert.doesNotMatch(
  sources.quoteState + sources.lineTable + sources.reassignModal + sources.submit,
  /shippingSubmitStatus\s*!==\s*'SUBMITTED'|shippingSubmitStatus\s*===\s*'SUBMITTED'/,
  '可变性判断不得把空白或未来状态当成未提交'
);
assert.doesNotMatch(sources.page + sources.detailToolbar + sources.submit, /部分提交|PARTIAL_SUBMITTED/);
assert.match(
  sources.warehouseOrderApi,
  /export function submitShippingOrder\(shippingOrderId: string\)[\s\S]*'POST',[\s\S]*\{\}/
);
