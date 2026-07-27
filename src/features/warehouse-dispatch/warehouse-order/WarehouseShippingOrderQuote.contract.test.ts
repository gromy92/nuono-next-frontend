import { strict as assert } from 'node:assert';
import { contractSources as sources } from './WarehouseOrderContractSources';
import {
  defaultQuoteBillingUnit,
  formatPublishedQuotePrice,
  quotePriceSourceLabel,
  quoteUnitDisplayText,
  warehouseQuoteConfirmationState
} from './warehouseShippingQuoteDomain';

assert.equal(defaultQuoteBillingUnit('AIR'), 'KG');
assert.equal(defaultQuoteBillingUnit('SEA'), 'CBM');
assert.equal(quoteUnitDisplayText('SEA'), 'CNY / CBM');
assert.equal(quotePriceSourceLabel('SHIPPING_ORDER_SNAPSHOT'), '本单已确认');
assert.equal(quotePriceSourceLabel('PRODUCT_CURRENT'), '商品当前价 · 待确认');
assert.equal(quotePriceSourceLabel('LEGACY_CHANNEL_QUOTE'), '历史渠道价 · 待确认');
assert.equal(warehouseQuoteConfirmationState({ quoteStatus: 'CONFIRMED', unitPrice: 65 }), 'CONFIRMED');
assert.equal(warehouseQuoteConfirmationState({ quoteStatus: 'PENDING_QUOTE', unitPrice: 65 }), 'SUGGESTED_PRICE');
assert.equal(warehouseQuoteConfirmationState({ quoteStatus: 'PENDING_QUOTE', unitPrice: null }), 'MISSING_PRICE');
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
  formatPublishedQuotePrice({ priceStatus: 'INQUIRY', unitPrice: null, billingUnit: 'KG' }),
  '需询价'
);

assert.match(
  sources.quoteActions,
  /handleSaveLineQuote[\s\S]*updateShippingOrderLineQuote[\s\S]*quote\.selectedOption[\s\S]*currency: 'CNY'[\s\S]*defaultQuoteBillingUnit/
);
assert.match(
  sources.quoteActions,
  /handleSaveBulkLineQuotes[\s\S]*updateShippingOrderLineQuotes[\s\S]*lineIds: selectedIds[\s\S]*unitPrice[\s\S]*yiteMaterial: quote\.showYiteFields/
);
assert.doesNotMatch(
  sources.quoteActions,
  /quote\.showYiteFields && !quote\.bulkQuoteYiteMaterial\?\.trim/
);
assert.doesNotMatch(sources.bulkModal, /label="义特材质" required/);
assert.match(
  sources.bulkModal,
  /title="批量添加报价"[\s\S]*label="货代渠道"[\s\S]*quote\.forwarderSelectOptions[\s\S]*label="渠道"[\s\S]*quote\.channelSelectOptions/
);
assert.match(sources.purchaseOrderApi, /export function updateShippingOrderLineQuotes[\s\S]*shipping-orders\/.*lines\/quotes/);
assert.match(sources.purchaseOrderApi, /shipping-orders\/.*lines\/.*quote/);

assert.match(
  sources.quoteState,
  /selectedChannel[\s\S]*findQuoteChannelOption\(selectedForwarder, selectedOption\.routeCode\)/
);
assert.match(
  sources.quoteState,
  /linesWithSelectedQuote[\s\S]*applySelectedChannelQuoteToLine\(line, selectedChannel\)/
);
assert.match(sources.orderDomain, /priceSource: quote\.priceSource/);
assert.match(sources.quoteState, /selectedChannel\?\.pendingLineCount[\s\S]*Number\(selectedChannel\.pendingLineCount/);
assert.match(sources.quoteState, /pendingConfirmationCount[\s\S]*warehouseQuoteConfirmationState/);
assert.match(sources.quoteState, /missingPriceCount[\s\S]*warehouseQuoteConfirmationState/);
assert.match(sources.quoteState, /activeMaintenanceKey: `\$\{selectedOption\.forwarderCode/);
assert.match(sources.sharedViews, /QuoteChipGroup label="货代"[\s\S]*forwarders\.map/);
assert.doesNotMatch(sources.sharedViews, /QuoteChipGroup label="渠道"/);
assert.match(sources.sharedViews, /selectedForwarder\?\.channels \|\| \[\]\)\.length > 1[\s\S]*<Select/);
assert.match(sources.sharedViews, /WarehouseShippingOrderPublishedPriceCard channel=\{selectedChannel\}/);
assert.match(sources.publishedPriceCard, /线上报价[\s\S]*暂无线上报价/);
assert.match(sources.publishedPriceCard, /quoteVersionCode[\s\S]*展开海运报价/);
assert.match(sources.publishedPriceCard, /收起海运报价/);
assert.match(sources.publishedPriceCard, /transportMode[\s\S]*SEA[\s\S]*seaPricesExpanded/);
assert.doesNotMatch(sources.publishedPriceCard, /surcharges|triggerCondition|published-price-constraints/);

assert.match(sources.quoteTransfer, /useState\(false\)[\s\S]*exportMissingOnly/);
assert.match(sources.quoteTransfer, /exportShippingOrderLogisticsQuoteReport[\s\S]*missingOnly: exportMissingOnly/);
assert.match(sources.quoteTransfer, /selectedChannel\?\.totalLineCount[\s\S]*selectedChannel\?\.pendingLineCount[\s\S]*selectedChannel\?\.confirmedLineCount/);
assert.match(sources.purchaseOrderApi, /missingOnly\?: boolean[\s\S]*params\.set\('missingOnly', 'true'\)/);
assert.doesNotMatch(sources.detailToolbar, /导出缺报价|生成账单/);
assert.match(sources.detailToolbar, /label="待确认"[\s\S]*label="无价格"/);
assert.doesNotMatch(sources.lineTable, /title: '币种'|title: '计费单位'/);
assert.match(sources.lineTable, /pagination=\{\{ pageSize: 20, showSizeChanger: false \}\}/);
assert.match(
  sources.lineTable,
  /warehouse-shipping-order-product-title-cn[\s\S]*warehouse-shipping-order-product-identity-label">PSKU:[\s\S]*warehouse-shipping-order-product-identity-label">Barcode:/
);
assert.match(
  sources.lineTable,
  /warehouse-shipping-order-price-entry[\s\S]*warehouse-shipping-order-quote-field[\s\S]*warehouse-shipping-order-price-unit[\s\S]*quoteUnitDisplayText/
);
assert.match(
  sources.lineTable,
  /quotePriceSourceLabel\(line\.priceSource\)[\s\S]*warehouse-shipping-order-price-source/
);
assert.match(sources.detailCss, /warehouse-shipping-order-published-price-card \{[\s\S]*background: #f7fbff/);
