import { strict as assert } from 'node:assert';
import { buildYiteMaterialCellModel } from './WarehouseOrderPanel.models';
import { contractSources as sources } from './WarehouseOrderContractSources';

const editableModel = buildYiteMaterialCellModel({
  yiteMaterial: '塑料',
  shippingSubmitStatus: 'SUBMITTED',
  unitPrice: 1390,
  currency: 'CNY',
  billingUnit: 'CBM'
});
assert.equal(editableModel.value, '塑料');
assert.equal(editableModel.editable, true);
assert.equal(editableModel.priceText, 'CNY 1390 / CBM');

const emptyPriceModel = buildYiteMaterialCellModel({
  yiteMaterial: undefined,
  shippingSubmitStatus: 'NOT_SUBMITTED'
});
assert.equal(emptyPriceModel.value, undefined);
assert.equal(emptyPriceModel.editable, true);
assert.equal(emptyPriceModel.priceText, '-');

assert.match(
  sources.lineTable,
  /title: '商品'[\s\S]*PSKU[\s\S]*line\.partnerSku \|\| line\.pskuCode[\s\S]*Barcode[\s\S]*line\.barcode[\s\S]*title: '来源\/数量'[\s\S]*warehouse-shipping-order-line-meta-cell[\s\S]*line\.purchaseOrderTitle \|\| line\.purchaseOrderNo[\s\S]*line\.quantity/,
  '商品标题下应显示 PSKU、条码，来源采购单和数量应收在相邻列'
);
assert.doesNotMatch(sources.lineTable, /title: 'Barcode'|title: '来源采购单'|title: '数量'/);
assert.doesNotMatch(sources.lineTable, /shippingOrderLineTitleEn|warehouse-shipping-order-product-title-en/);
assert.match(sources.lineTable, /scroll=\{\{ x: quote\.showYiteFields \? 1120 : 860 \}\}/);
assert.match(sources.lineTable, /key=\{quote\.activeMaintenanceKey\}[\s\S]*rowKey="id"/);

assert.match(sources.list, /embedded \? null : \([\s\S]*<Title level=\{4\}>发货单/);
assert.match(sources.list, /embedded \? null : \([\s\S]*新增仓库单/);
assert.match(sources.list, /title: '问题'[\s\S]*<WarehouseOrderIssueTags order=\{order\}/);
assert.doesNotMatch(sources.page, /部分提交|PARTIAL_SUBMITTED/);

assert.match(
  sources.detailToolbar,
  /warehouse-shipping-order-detail-toolbar[\s\S]*warehouse-shipping-order-detail-route-row[\s\S]*DetailSegmentChips[\s\S]*warehouse-shipping-order-detail-status-row[\s\S]*ActiveSegmentQuoteControls/
);
assert.doesNotMatch(sources.detailToolbar, /<Select/);
assert.match(sources.sharedViews, /DetailLineFilterLabel[\s\S]*warehouse-shipping-order-detail-filter-danger/);
assert.match(sources.detailCss, /warehouse-shipping-order-detail-filter-danger \{[\s\S]*color: #ff4d4f/);
assert.match(sources.detailCss, /warehouse-shipping-order-detail-toolbar \{[\s\S]*grid-template-rows: auto auto/);
assert.match(sources.detailCss, /warehouse-shipping-order-detail-route-row \{[\s\S]*justify-content: space-between/);
assert.match(sources.detailCss, /warehouse-shipping-order-detail-status-row \{[\s\S]*justify-content: space-between/);
assert.match(sources.detailCss, /warehouse-shipping-order-chip \{[\s\S]*border-radius: 6px[\s\S]*font-size: 12px/);
assert.match(sources.detailCss, /warehouse-shipping-order-chip--active \{[\s\S]*background: #1677ff/);
assert.match(sources.detailCss, /warehouse-shipping-order-line-meta-cell \{[\s\S]*display: flex[\s\S]*gap: 10px/);
assert.match(sources.detailCss, /warehouse-shipping-order-line-meta-source \{[\s\S]*flex: 1 1 auto/);
assert.match(sources.quoteCss, /warehouse-shipping-order-quote-field \{[\s\S]*flex: 0 0 72px[\s\S]*width: 72px/);
assert.match(sources.quoteCss, /warehouse-shipping-order-price-entry \{[\s\S]*display: flex[\s\S]*align-items: center/);
assert.match(sources.baseCss, /warehouse-shipping-order-page--embedded[\s\S]*warehouse-shipping-order-toolbar-actions[\s\S]*flex-wrap: nowrap/);
