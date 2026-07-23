import { strict as assert } from 'node:assert';
import { contractSources as sources } from './WarehouseShippingOrderContractSources';
import {
  defaultQuoteBillingUnit,
  quoteUnitDisplayText
} from './warehouseShippingQuoteDomain';

assert.equal(defaultQuoteBillingUnit('AIR'), 'KG');
assert.equal(defaultQuoteBillingUnit('SEA'), 'CBM');
assert.equal(quoteUnitDisplayText('SEA'), 'CNY / CBM');

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
assert.match(sources.quoteState, /selectedChannel\?\.pendingLineCount[\s\S]*Number\(selectedChannel\.pendingLineCount/);
assert.match(sources.quoteState, /activeMaintenanceKey: `\$\{selectedOption\.forwarderCode/);
assert.match(sources.sharedViews, /QuoteChipGroup label="货代"[\s\S]*forwarders\.map/);
assert.match(sources.sharedViews, /QuoteChipGroup label="渠道"[\s\S]*selectedForwarder\?\.channels/);
assert.doesNotMatch(sources.sharedViews, /<Select/);

assert.match(sources.quoteTransfer, /useState\(false\)[\s\S]*exportMissingOnly/);
assert.match(sources.quoteTransfer, /exportShippingOrderLogisticsQuoteReport[\s\S]*missingOnly: exportMissingOnly/);
assert.match(sources.quoteTransfer, /selectedChannel\?\.totalLineCount[\s\S]*selectedChannel\?\.pendingLineCount[\s\S]*selectedChannel\?\.confirmedLineCount/);
assert.match(sources.purchaseOrderApi, /missingOnly\?: boolean[\s\S]*params\.set\('missingOnly', 'true'\)/);
assert.doesNotMatch(sources.detailToolbar, /导出缺报价|生成账单/);
assert.doesNotMatch(sources.lineTable, /title: '币种'|title: '计费单位'/);
assert.match(sources.detailCss, /warehouse-shipping-order-chip--channel \{[\s\S]*max-width: 420px/);
