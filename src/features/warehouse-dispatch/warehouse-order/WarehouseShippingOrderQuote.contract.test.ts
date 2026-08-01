import { strict as assert } from 'node:assert';
import { contractSources as sources } from './WarehouseOrderContractSources';
import { applySelectedChannelQuoteToLine } from './warehouseShippingQuoteLineMatching';
import type { ShippingOrderLine } from './warehouseShippingOrderTypes';
import {
  buildQuoteUnitPriceFilterOptions,
  defaultQuoteBillingUnit,
  formatPublishedQuotePrice,
  matchesQuoteUnitPriceFilter,
  quotePriceSourceLabel,
  resolveQuoteBillingUnit,
  warehouseQuotePriceState
} from './warehouseShippingQuoteDomain';

assert.equal(defaultQuoteBillingUnit('AIR'), 'KG');
assert.equal(defaultQuoteBillingUnit('SEA'), 'CBM');
assert.equal(resolveQuoteBillingUnit('KG', 'SEA'), 'KG');
assert.equal(resolveQuoteBillingUnit('CBM', 'SEA'), 'CBM');
assert.equal(resolveQuoteBillingUnit(undefined, 'SEA'), 'CBM');
assert.deepEqual(
  buildQuoteUnitPriceFilterOptions(
    [
      { unitPrice: 32, billingUnit: 'KG', eligibilityStatus: 'SUPPORTED' },
      { unitPrice: '32.00', billingUnit: 'CBM', eligibilityStatus: 'SUPPORTED' },
      { unitPrice: 32, billingUnit: 'KG', eligibilityStatus: 'SUPPORTED' },
      { unitPrice: null, billingUnit: 'CBM', eligibilityStatus: 'SUPPORTED' }
    ],
    'SEA'
  ),
  [
    { value: 'ALL', label: '全部单价（4）' },
    { value: 'PRICE:32:CBM', label: '32 CNY / CBM（1）' },
    { value: 'PRICE:32:KG', label: '32 CNY / KG（2）' }
  ]
);
assert.deepEqual(
  buildQuoteUnitPriceFilterOptions([
    { unitPrice: 65, billingUnit: 'KG', eligibilityStatus: 'UNKNOWN' },
    { unitPrice: 66, billingUnit: 'KG', eligibilityStatus: 'FUTURE_STATUS' },
    { unitPrice: 67, billingUnit: 'KG', eligibilityStatus: 'SUPPORTED' }
  ]),
  [
    { value: 'ALL', label: '全部单价（3）' },
    { value: 'PRICE:67:KG', label: '67 CNY / KG（1）' }
  ],
  '只有显式 SUPPORTED 的商品价可进入单价筛选'
);
assert.equal(matchesQuoteUnitPriceFilter('32.00', 'KG', 'PRICE:32:KG', 'SEA'), true);
assert.equal(matchesQuoteUnitPriceFilter(32, 'CBM', 'PRICE:32:KG', 'SEA'), false);
assert.equal(quotePriceSourceLabel('SHIPPING_ORDER_SNAPSHOT'), '本单报价');
assert.equal(quotePriceSourceLabel('PRODUCT_CURRENT'), '');
assert.equal(quotePriceSourceLabel('LEGACY_CHANNEL_QUOTE'), '历史渠道价');
assert.equal(warehouseQuotePriceState({ unitPrice: 65 }), 'PRICED');
assert.equal(warehouseQuotePriceState({ unitPrice: 0 }), 'MISSING_PRICE');
assert.equal(warehouseQuotePriceState({ unitPrice: null }), 'MISSING_PRICE');
assert.equal(
  formatPublishedQuotePrice({
    cargoCategoryName: '沙特空运（普货）',
    priceStatus: 'NORMAL',
    currency: 'RMB',
    unitPrice: 67,
    billingUnit: 'KG'
  }),
  'RMB 67/KG'
);
assert.equal(
  formatPublishedQuotePrice({ currency: 'RMB', unitPrice: 67, billingUnit: 'KG' }),
  'RMB 67/KG'
);
assert.equal(
  formatPublishedQuotePrice({ currency: 'RMB', unitPrice: 1550, billingUnit: 'CBM' }),
  'RMB 1550/CBM'
);
assert.equal(
  formatPublishedQuotePrice({ priceStatus: 'INQUIRY', unitPrice: null, billingUnit: 'KG' }),
  '需询价'
);

const quoteLine = (
  id: string,
  purchaseOrderItemSiteId: string,
  sourceStoreCode: string,
  purchaseOrderId: string
): ShippingOrderLine => ({
  id,
  purchaseOrderId,
  purchaseOrderItemId: `item-${id}`,
  purchaseOrderItemSiteId,
  partnerSku: 'PSKU-SHARED',
  sourceStoreCode,
  quantity: 1,
  unitPrice: 11,
  eligibilityStatus: 'SUPPORTED'
});
const lineA = quoteLine('line-a', 'site-a', 'STORE-A', 'order-a');
const lineB = quoteLine('line-b', 'site-b', 'STORE-B', 'order-b');
const conflictingStrongIdentity = applySelectedChannelQuoteToLine(lineA, {
  routeCode: 'ET-AIR', pendingLineCount: 0, newProductLineCount: 0,
  lineQuotes: [{
    shippingOrderLineId: 'line-b',
    purchaseOrderItemSiteId: 'site-a',
    partnerSku: 'PSKU-SHARED',
    unitPrice: 99,
    eligibilityStatus: 'SUPPORTED'
  }]
}, [lineA]);
assert.notEqual(conflictingStrongIdentity.unitPrice, 99, '强 shippingOrderLineId 冲突不能降级按 site 命中');
const ambiguousPskuFallback = applySelectedChannelQuoteToLine(lineA, {
  routeCode: 'ET-AIR', pendingLineCount: 0, newProductLineCount: 0,
  lineQuotes: [{ partnerSku: 'PSKU-SHARED', unitPrice: 88, eligibilityStatus: 'SUPPORTED' }]
}, [lineA, lineB]);
assert.notEqual(ambiguousPskuFallback.unitPrice, 88, '跨店/采购单同 PSKU 不能弱身份串价');
const uniquePskuFallback = applySelectedChannelQuoteToLine(lineA, {
  routeCode: 'ET-AIR', pendingLineCount: 0, newProductLineCount: 0,
  lineQuotes: [{ partnerSku: 'PSKU-SHARED', unitPrice: 66, eligibilityStatus: 'SUPPORTED' }]
}, [lineA]);
assert.equal(uniquePskuFallback.unitPrice, 66);
const blankEligibility = applySelectedChannelQuoteToLine(lineA, {
  routeCode: 'ET-AIR', pendingLineCount: 0, newProductLineCount: 0,
  lineQuotes: [{ shippingOrderLineId: 'line-a', unitPrice: 65 }]
}, [lineA]);
assert.equal(blankEligibility.eligibilityStatus, 'UNKNOWN', '缺失承运状态不得默认可发');

assert.match(
  sources.quoteActions,
  /handleSaveLineQuote[\s\S]*updateShippingOrderLineQuote[\s\S]*quote\.selectedOption[\s\S]*currency: 'CNY'[\s\S]*billingUnit: resolveQuoteBillingUnit\([\s\S]*draft\.billingUnit/
);
assert.match(
  sources.quoteActions,
  /handleSaveBulkLineQuotes[\s\S]*updateShippingOrderLineQuotes[\s\S]*lineIds: selectedIds[\s\S]*unitPrice[\s\S]*billingUnit: quote\.bulkQuoteBillingUnit[\s\S]*yiteMaterial: quote\.showYiteFields/
);
assert.match(
  sources.interactionController,
  /createShippingOrderInteractionScope[\s\S]*activateDetailInteractionScope[\s\S]*beginDetailRequest[\s\S]*isCurrentDetailRequest[\s\S]*acceptCurrentInteractionResponse/
);
assert.match(
  sources.interactionScope,
  /ShippingOrderInteractionTicket[\s\S]*scope: ShippingOrderInteractionScope[\s\S]*requireShippingOrderResponseOrderId[\s\S]*rawActualOrderId !== rawExpectedOrderId/
);
assert.match(
  sources.scopedOptions,
  /activateDetailInteractionScope\(orderId, activeSegmentIds\)[\s\S]*beginDetailRequest\('options'[\s\S]*acceptCurrentInteractionResponse\(request, nextOptions\.purchaseOrderId\)/
);
assert.match(
  sources.quoteActions,
  /refreshOptions[\s\S]*beginDetailRequest\('options'[\s\S]*acceptCurrentInteractionResponse\(request, options\.purchaseOrderId\)[\s\S]*beginDetailAction[\s\S]*isCurrentDetailAction[\s\S]*finishDetailAction/
);
assert.match(
  sources.quoteTransfer,
  /handleImport[\s\S]*beginDetailAction[\s\S]*isCurrentDetailAction[\s\S]*refreshDetail\(order\.id\)[\s\S]*finishDetailAction/
);
assert.doesNotMatch(sources.quoteActions, /billingUnit: defaultQuoteBillingUnit/);
assert.doesNotMatch(
  sources.quoteActions,
  /quote\.showYiteFields && !quote\.bulkQuoteYiteMaterial\?\.trim/
);
assert.doesNotMatch(sources.bulkModal, /label="义特材质" required/);
assert.match(
  sources.bulkModal,
  /title="批量添加报价"[\s\S]*label="货代渠道"[\s\S]*quote\.forwarderSelectOptions[\s\S]*label="渠道"[\s\S]*quote\.channelSelectOptions/
);
assert.match(sources.warehouseOrderApi, /export function updateShippingOrderLineQuotes[\s\S]*shipping-orders\/.*lines\/quotes/);
assert.match(sources.warehouseOrderApi, /shipping-orders\/.*lines\/.*quote/);
assert.match(
  sources.eligibilityApi,
  /updateShippingOrderLineEligibility[\s\S]*lineId[\s\S]*lines\/\$\{encodeURIComponent\(lineId\)\}\/eligibility/
);
assert.match(sources.eligibilityApi, /reassignShippingOrderLines[\s\S]*lines\/reassign/);
assert.match(
  sources.quoteActions + sources.eligibilityDomain,
  /isUnsupportedForwarderEligibility[\s\S]*不能保存报价/
);
assert.match(sources.eligibilityDomain, /normalized === 'SUPPORTED'[\s\S]*UNKNOWN/);
assert.match(
  sources.reassignModal,
  /AIR[\s\S]*SEA[\s\S]*label: `新建 \$\{/
);
assert.match(
  sources.lineTable,
  /title: '承运状态'[\s\S]*<Select[\s\S]*ELIGIBILITY_OPTIONS[\s\S]*handleSaveEligibility\(line, status\)/
);
assert.match(sources.detailToolbar, /调整运输方案[\s\S]*label="需询价"[\s\S]*label="不接"/);

assert.match(
  sources.quoteState,
  /selectedChannel[\s\S]*findQuoteChannelOption\(selectedForwarder, selectedOption\.routeCode\)/
);
assert.match(
  sources.quoteState,
  /linesWithSelectedQuote[\s\S]*applySelectedChannelQuoteToLine\(line, selectedChannel, activeLines\)/
);
assert.doesNotMatch(sources.quoteState, /pendingConfirmationCount|warehouseQuoteConfirmationState/);
assert.match(sources.quoteState, /missingPriceCount[\s\S]*warehouseQuotePriceState/);
assert.match(
  sources.quoteState,
  /unitPriceFilterOptions[\s\S]*buildQuoteUnitPriceFilterOptions[\s\S]*matchesQuoteUnitPriceFilter/
);
assert.match(
  sources.quoteState,
  /readLineDraft[\s\S]*billingUnit:[\s\S]*resolveQuoteBillingUnit\(\s*lineQuoteDrafts\[line\.id\]\?\.billingUnit\s*\?\? \(hasLineQuotePrice\(line\) \? line\.billingUnit : undefined\)/
);
assert.match(sources.quoteState, /activeMaintenanceKey: `\$\{selectedOption\.forwarderCode/);
assert.match(sources.sharedViews, /QuoteChipGroup label="货代"[\s\S]*forwarders\.map/);
assert.doesNotMatch(sources.sharedViews, /QuoteChipGroup label="渠道"/);
assert.match(sources.sharedViews, /selectedForwarder\?\.channels \|\| \[\]\)\.length > 1[\s\S]*<Select/);
assert.match(sources.sharedViews, /WarehouseShippingOrderPublishedPriceCard channel=\{selectedChannel\}/);
assert.doesNotMatch(sources.sharedViews, /报价缺失 \{formatQuantity\(quoteIssue\.totalCount\)\}/);
assert.match(
  sources.sharedViews,
  /缺单价[\s\S]*缺义特材质[\s\S]*需询价[\s\S]*不接[\s\S]*承运状态待确认/
);
assert.match(sources.publishedPriceCard, /线上报价[\s\S]*暂无线上报价/);
assert.match(sources.publishedPriceCard, /quoteVersionCode[\s\S]*展开海运报价/);
assert.match(
  sources.publishedPriceCard,
  /基础报价版本[\s\S]*quoteEffectiveFrom[\s\S]*基础价生效[\s\S]*quoteRecordedAt[\s\S]*基础价录入[\s\S]*latestProductQuoteAt[\s\S]*商品报价最近更新/
);
assert.match(sources.publishedPriceCard, /cargoCategoryDescription[\s\S]*warehouse-shipping-order-published-price-description/);
assert.match(sources.publishedPriceCard, /收起海运报价/);
assert.match(sources.publishedPriceCard, /transportMode[\s\S]*SEA[\s\S]*seaPricesExpanded/);
assert.doesNotMatch(sources.publishedPriceCard, /surcharges|triggerCondition|published-price-constraints/);

assert.match(sources.quoteTransfer, /useState\(false\)[\s\S]*exportMissingOnly/);
assert.match(sources.quoteTransfer, /App as AntdApp[\s\S]*AntdApp\.useApp\(\)/);
assert.match(
  sources.quoteTransfer,
  /createLatestRequestGate[\s\S]*exportRequestGateRef[\s\S]*exportRequestScopeRef/
);
assert.match(
  sources.quoteTransfer,
  /closeExportModal[\s\S]*exportRequestGateRef\.current\.invalidate\(\)[\s\S]*exportRequestScopeRef\.current = undefined/
);
assert.match(
  sources.quoteTransfer,
  /openExportModal[\s\S]*requestIdentity[\s\S]*isCurrentRequest[\s\S]*if \(!isCurrentRequest\(\)\) return[\s\S]*setExportOptions\(options\)[\s\S]*catch[\s\S]*if \(!isCurrentRequest\(\)\) return[\s\S]*finally[\s\S]*isCurrentRequest\(\)[\s\S]*setExportLoading\(false\)/
);
assert.match(
  sources.quoteTransfer,
  /missingOnly: exportMissingOnly[\s\S]*closeExportModal\(\)[\s\S]*notification\.success\(\{[\s\S]*message: '已提交导出'/
);
assert.doesNotMatch(sources.quoteTransfer + sources.quoteDomain, /filterQuoteOptionsWithTemplates/);
assert.match(sources.quoteTransfer, /selectedChannel\?\.totalLineCount[\s\S]*selectedChannel\?\.pendingLineCount[\s\S]*selectedChannel\?\.confirmedLineCount/);
assert.match(sources.warehouseOrderApi, /missingOnly\?: boolean[\s\S]*params\.set\('missingOnly', 'true'\)/);
assert.doesNotMatch(sources.detailToolbar, /导出缺报价|生成账单/);
assert.match(sources.detailToolbar, /label="缺义特材质"[\s\S]*label="缺单价"/);
assert.doesNotMatch(sources.detailToolbar, /PENDING_CONFIRMATION/);
assert.match(sources.detailToolbar, /报价单价[\s\S]*detailUnitPriceFilter[\s\S]*unitPriceFilterOptions/);
assert.doesNotMatch(sources.sharedViews, />材料缺失 /);
assert.doesNotMatch(sources.lineTable, /title: '币种'|title: '计费单位'/);
assert.match(sources.lineTable, /pagination=\{\{ pageSize: 20, showSizeChanger: false \}\}/);
assert.match(
  sources.lineTable,
  /warehouse-shipping-order-product-title-cn[\s\S]*warehouse-shipping-order-product-identity-label">PSKU:[\s\S]*warehouse-shipping-order-product-identity-label">Barcode:/
);
assert.match(
  sources.lineTable,
  /warehouse-shipping-order-price-entry[\s\S]*warehouse-shipping-order-quote-field[\s\S]*warehouse-shipping-order-billing-unit-select[\s\S]*QUOTE_BILLING_UNIT_OPTIONS/
);
assert.match(sources.bulkModal, /bulkQuoteBillingUnit[\s\S]*QUOTE_BILLING_UNIT_OPTIONS/);
assert.match(
  sources.lineTable,
  /quotePriceSourceLabel\(line\.priceSource\)[\s\S]*warehouse-shipping-order-price-source/
);
assert.match(sources.detailCss, /warehouse-shipping-order-published-price-card \{[\s\S]*background: #f7fbff/);
