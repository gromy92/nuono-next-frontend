import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { buildYiteMaterialCellModel } from './WarehouseShippingOrderPage.models'

const editableModel = buildYiteMaterialCellModel({
  yiteMaterial: '塑料',
  shippingSubmitStatus: 'SUBMITTED',
  unitPrice: 1390,
  currency: 'CNY',
  billingUnit: 'CBM'
})

assert.equal(editableModel.value, '塑料')
assert.equal(editableModel.editable, true)
assert.equal(editableModel.priceText, 'CNY 1390 / CBM')

const emptyPriceModel = buildYiteMaterialCellModel({
  yiteMaterial: undefined,
  shippingSubmitStatus: 'NOT_SUBMITTED'
})

assert.equal(emptyPriceModel.value, undefined)
assert.equal(emptyPriceModel.editable, true)
assert.equal(emptyPriceModel.priceText, '-')

const pageSource = readFileSync(new URL('./WarehouseShippingOrderPage.tsx', import.meta.url), 'utf8')
const purchaseOrderApiSource = readFileSync(new URL('../purchase-order/api.ts', import.meta.url), 'utf8')
const cssSource = readFileSync(new URL('./WarehouseShippingOrderPage.css', import.meta.url), 'utf8')
const detailTableSource = pageSource.slice(
  pageSource.indexOf('<Table<ShippingOrderLine>'),
  pageSource.indexOf('dataSource={visibleDetailLines}')
)

assert.equal(detailTableSource.includes("dataIndex: 'sourceStoreName'"), false)
assert.equal(detailTableSource.includes("dataIndex: 'siteCode'"), false)

assert.match(
  detailTableSource,
  /title: '来源\/数量'[\s\S]*className="warehouse-shipping-order-line-meta-cell"[\s\S]*line\.barcode[\s\S]*line\.purchaseOrderTitle \|\| line\.purchaseOrderNo[\s\S]*formatQuantity\(Number\(line\.quantity \|\| 0\)\)/,
  'warehouse-order detail table must combine barcode, source purchase order, and quantity into one compact column'
)

assert.doesNotMatch(
  detailTableSource,
  /title: 'Barcode'|title: '来源采购单'|title: '数量'/,
  'warehouse-order detail table must not keep barcode, source purchase order, and quantity as separate columns'
)

assert.match(
  detailTableSource,
  /scroll=\{\{ x: showYiteQuoteFields \? 1120 : 860 \}\}/,
  'warehouse-order detail table must reduce horizontal width after combining line meta columns'
)

assert.match(
  pageSource,
  /embedded \? null : \([\s\S]*<Title level=\{4\}>发货单<\/Title>/,
  'embedded warehouse-order tab must hide the standalone title and description'
)

assert.match(
  pageSource,
  /embedded \? null : \([\s\S]*新增仓库单/,
  'embedded warehouse-order tab must hide the standalone create button'
)

assert.match(
  pageSource,
  /title: '问题'[\s\S]*renderWarehouseOrderIssueTags\(order\)/,
  'warehouse-order list must expose a dedicated issue column for missing material and quote gaps'
)

assert.doesNotMatch(
  pageSource,
  /Promise\.all\(\[\s*loadShippingOrders\(\),\s*loadPurchaseOrders/,
  'warehouse-order page must not hide the warehouse order list when purchase-order source candidates fail'
)

assert.match(
  pageSource,
  /className="warehouse-shipping-order-detail-toolbar"[\s\S]*className="warehouse-shipping-order-detail-route-row"[\s\S]*renderDetailSegmentChips\(\s*sortedDetailSegments[\s\S]*className="warehouse-shipping-order-detail-status-row"[\s\S]*renderActiveSegmentQuoteControls/,
  'warehouse-order detail quote maintenance header must be compressed into a two-row chip toolbar'
)

assert.doesNotMatch(
  pageSource,
  /renderAllLogisticsQuoteSegments\([\s\S]*sortedDetailSegments/,
  'warehouse-order detail must not show the all-logistics-quote card grid by default'
)

assert.match(
  pageSource,
  /type DetailLineFilter = 'ALL' \| 'MISSING_MATERIAL' \| 'PENDING_QUOTE'/,
  'warehouse-order detail must use one combined line filter state for material and quote filters'
)

assert.doesNotMatch(
  pageSource,
  /detailMaterialFilter|detailQuoteFilter/,
  'warehouse-order detail must not keep separate material and quote segmented filters'
)

assert.match(
  pageSource,
  /value=\{detailLineFilter\}[\s\S]*全部 \$\{activeDetailLines\.length\}[\s\S]*renderDetailLineFilterLabel\('材料缺失', activeDetailMissingMaterialCount\)[\s\S]*renderDetailLineFilterLabel\('缺报价', activeDetailPendingQuoteCount\)/,
  'warehouse-order detail must merge all/material-missing/quote-missing choices into one segmented filter'
)

assert.match(
  pageSource,
  /renderDetailLineFilterLabel\('材料缺失', activeDetailMissingMaterialCount\)[\s\S]*renderDetailLineFilterLabel\('缺报价', activeDetailPendingQuoteCount\)/,
  'warehouse-order detail must render missing material and quote filter labels through the warning label helper'
)

assert.match(
  pageSource,
  /function renderDetailLineFilterLabel[\s\S]*className=\{countValue > 0 \? 'warehouse-shipping-order-detail-filter-danger' : undefined\}/,
  'warehouse-order detail missing filter label helper must mark positive missing counts with a danger class'
)

assert.match(
  cssSource,
  /\.warehouse-shipping-order-detail-filter-danger \{[\s\S]*color: #ff4d4f;/,
  'warehouse-order detail missing filter danger class must render red text'
)

assert.match(
  pageSource,
  /<Tag color=\{activeDetailPendingQuoteCount > 0 \? 'red' : 'green'\}>[\s\S]*activeDetailPendingQuoteCount > 0 \? '待报价' : '已报价'/,
  'warehouse-order detail quote status tag must be red when quotes are missing and green when complete'
)

assert.match(
  pageSource,
  /handleSaveLineQuote[\s\S]*updateShippingOrderLineQuote[\s\S]*selectedSegmentQuoteOption/,
  'warehouse-order detail must persist per-line quote editing against the selected forwarder channel'
)

assert.match(
  pageSource,
  /selectedQuoteLineIds[\s\S]*setSelectedQuoteLineIds/,
  'warehouse-order detail must keep selected quote line ids for batch quote editing'
)

assert.match(
  pageSource,
  /function handleSaveBulkLineQuotes[\s\S]*updateShippingOrderLineQuotes\([\s\S]*lineIds: selectedQuoteLineIds[\s\S]*unitPrice[\s\S]*yiteMaterial: showYiteQuoteFields \? bulkQuoteYiteMaterial/,
  'warehouse-order detail must persist selected rows through the batch quote API'
)

const saveBulkLineQuotesSource = pageSource.slice(
  pageSource.indexOf('async function handleSaveBulkLineQuotes'),
  pageSource.indexOf('function handleSelectSegmentQuoteOption')
)

assert.doesNotMatch(
  saveBulkLineQuotesSource,
  /if \(showYiteQuoteFields && !bulkQuoteYiteMaterial\?\.trim\(\)\)/,
  'warehouse-order batch quote save must allow Yite material to be omitted'
)

assert.doesNotMatch(
  pageSource,
  /<Form\.Item label="义特材质" required>/,
  'warehouse-order batch quote modal must present Yite material as optional'
)

assert.match(
  detailTableSource,
  /rowSelection=\{\{[\s\S]*selectedRowKeys: selectedQuoteLineIds[\s\S]*onChange: \(selectedRowKeys\) => setSelectedQuoteLineIds\(selectedRowKeys\.map\(String\)\)[\s\S]*getCheckboxProps: \(line\) => \(\{[\s\S]*disabled: line\.shippingSubmitStatus === 'SUBMITTED'/,
  'warehouse-order detail table must allow selecting unsubmitted rows for batch quote editing'
)

assert.match(
  readFileSync(new URL('../purchase-order/api.ts', import.meta.url), 'utf8'),
  /export function updateShippingOrderLineQuotes\([\s\S]*shipping-orders\/.*lines\/quotes/,
  'warehouse-order batch quote save must call the backend batch quote endpoint'
)

assert.match(
  pageSource,
  /<Button[\s\S]*onClick=\{openBulkQuoteModal\}[\s\S]*批量添加报价/,
  'warehouse-order detail actions must expose a batch quote button'
)

const openBulkQuoteModalSource = pageSource.slice(
  pageSource.indexOf('function openBulkQuoteModal'),
  pageSource.indexOf('function closeBulkQuoteModal')
)

assert.doesNotMatch(
  openBulkQuoteModalSource,
  /请先选择上方货代渠道/,
  'batch quote button must open the batch modal even when the detail header has no selected channel'
)

assert.match(
  pageSource,
  /title="批量添加报价"[\s\S]*label="货代渠道"[\s\S]*Select[\s\S]*activeSegmentQuoteForwarderSelectOptions[\s\S]*label="渠道"[\s\S]*activeSegmentQuoteChannelSelectOptions/,
  'batch quote modal must provide forwarder and channel selectors so users can complete the missing quote scope in the same popup'
)

assert.match(
  readFileSync(new URL('../purchase-order/api.ts', import.meta.url), 'utf8'),
  /shipping-orders\/.*lines\/.*quote/,
  'warehouse-order line quote save must call the backend line quote endpoint'
)

assert.match(
  pageSource,
  /const \[quoteExportMissingOnly, setQuoteExportMissingOnly\] = useState\(false\)/,
  'warehouse-order quote export modal must default to exporting all selected-channel lines'
)

assert.match(
  pageSource,
  /exportShippingOrderLogisticsQuoteReport[\s\S]*missingOnly: quoteExportMissingOnly/,
  'warehouse-order quote export must pass the missing-only choice to the backend export endpoint'
)

assert.match(
  pageSource,
  /const quoteExportTotalCount = Number\(quoteSelectedChannel\?\.totalLineCount[\s\S]*const quoteExportPendingCount = Number\(quoteSelectedChannel\?\.pendingLineCount[\s\S]*const quoteExportConfirmedCount = Number\(quoteSelectedChannel\?\.confirmedLineCount/,
  'warehouse-order quote export modal counts must use the selected forwarder channel quote coverage instead of raw order line quote status'
)

assert.match(
  pageSource,
  /<Checkbox[\s\S]*checked=\{quoteExportMissingOnly\}[\s\S]*onChange=\{\(event\) => setQuoteExportMissingOnly\(event\.target\.checked\)\}[\s\S]*只导出报价缺失/,
  'warehouse-order quote export modal must expose a checkbox for exporting only missing quote rows'
)

assert.match(
  pageSource,
  /quoteExportMissingOnly[\s\S]*将导出报价缺失 \$\{quoteExportPendingCount\} 行[\s\S]*将导出全部 \$\{quoteExportTotalCount\} 行/,
  'warehouse-order quote export modal must describe whether it will export missing-only or all rows'
)

assert.match(
  readFileSync(new URL('../purchase-order/api.ts', import.meta.url), 'utf8'),
  /missingOnly\?: boolean[\s\S]*if \(selection\.missingOnly\) \{[\s\S]*params\.set\('missingOnly', 'true'\)/,
  'warehouse-order quote export API must send missingOnly=true only when the option is selected'
)

assert.doesNotMatch(
  pageSource,
  /handleExportMissingQuoteLines|buildMissingQuoteWorkbookBlob|导出缺报价|FileExcelOutlined/,
  'warehouse-order detail must not expose a separate missing-quote export flow in the popup'
)

assert.doesNotMatch(
  pageSource,
  /生成账单|handleGenerateExpectedBill|generateShippingOrderExpectedBill|FileDoneOutlined/,
  'warehouse-order detail must remove the expected bill generation entry from the popup'
)

assert.match(
  pageSource,
  /activeSegmentQuoteOptions[\s\S]*loadShippingOrderLogisticsQuoteOptionsForScope/,
  'warehouse-order detail must load forwarder/channel options after selecting a segment'
)

assert.match(
  pageSource,
  /renderActiveSegmentQuoteControls\([\s\S]*activeSegmentQuoteOptions[\s\S]*handleSelectSegmentQuoteOption/,
  'warehouse-order detail must render linked forwarder/channel chips for the selected segment'
)

const detailToolbarSource = pageSource.slice(
  pageSource.indexOf('className="warehouse-shipping-order-detail-toolbar"'),
  pageSource.indexOf('{visibleQuoteImportResult ?')
)

assert.doesNotMatch(
  detailToolbarSource,
  /<Select/,
  'warehouse-order detail toolbar must use compact chips instead of large select boxes'
)

const quoteControlSource = pageSource.slice(
  pageSource.indexOf('function renderActiveSegmentQuoteControls'),
  pageSource.indexOf('function segmentQuoteOptionChoices')
)

assert.match(
  quoteControlSource,
  /className="warehouse-shipping-order-chip-group"[\s\S]*货代[\s\S]*forwarders\.map/,
  'warehouse-order quote controls must render forwarders as compact chips'
)

assert.match(
  quoteControlSource,
  /className="warehouse-shipping-order-chip-group warehouse-shipping-order-chip-group--channel"[\s\S]*渠道[\s\S]*selectedForwarder\?\.channels/,
  'warehouse-order quote controls must render selected-forwarder channels as compact chips'
)

assert.match(
  quoteControlSource,
  /warehouse-shipping-order-chip--active[\s\S]*selectedChannel\?\.routeCode === channel\.routeCode/,
  'warehouse-order quote controls must mark the active forwarder channel chip'
)

assert.doesNotMatch(
  quoteControlSource,
  /<Select/,
  'warehouse-order quote controls must not render select boxes in the compact popup header'
)

assert.match(
  pageSource,
  /function renderDetailSegmentChips[\s\S]*shippingOrderSegmentTabLabel\(segment\)[\s\S]*warehouse-shipping-order-chip--active/,
  'warehouse-order route segment choices must be rendered as active-state chips'
)

assert.match(
  pageSource,
  /selectedSegmentQuoteChannel[\s\S]*findQuoteChannelOption\(activeSegmentQuoteForwarder, selectedSegmentQuoteOption\.routeCode\)/,
  'warehouse-order detail must resolve the selected forwarder channel as the quote maintenance source'
)

assert.match(
  pageSource,
  /activeDetailLinesWithSelectedQuote[\s\S]*applySelectedChannelQuoteToLine\(line, selectedSegmentQuoteChannel\)/,
  'warehouse-order detail must refresh visible rows from selected channel quote coverage'
)

assert.match(
  pageSource,
  /selectedSegmentQuoteChannel\?\.pendingLineCount[\s\S]*Number\(selectedSegmentQuoteChannel\.pendingLineCount/,
  'warehouse-order quote count must come from the selected channel coverage instead of stale line state'
)

assert.match(
  pageSource,
  /const activeQuoteMaintenanceKey[\s\S]*selectedSegmentQuoteOption\.forwarderCode[\s\S]*selectedSegmentQuoteOption\.routeCode/,
  'warehouse-order detail must derive a quote-maintenance key from the selected forwarder and channel'
)

assert.match(
  pageSource,
  /async function handleSubmitShipping\(order: ShippingOrder\)[\s\S]*const pendingQuoteCount = countShippingOrderPendingQuoteLines\(order\)[\s\S]*if \(pendingQuoteCount > 0\) \{[\s\S]*title: '报价缺失'[\s\S]*还有 \$\{pendingQuoteCount\} 个商品缺少物流报价[\s\S]*submitShippingOrder\(order\.id\)/,
  'warehouse-order submit must validate and submit the whole order without a child segment scope'
)

assert.match(
  pageSource,
  /function countShippingOrderPendingQuoteLines\(order: ShippingOrder\)[\s\S]*countShippingOrderPendingQuoteLinesForScope\(order, order\.segments \|\| \[\]\)/,
  'warehouse-order submit quote blocker must count the complete parent order scope'
)

assert.match(
  pageSource,
  /function isZdShippingForwarder[\s\S]*forwarderCode[\s\S]*sameCode\(target\.forwarderCode, 'ZD'\)[\s\S]*众鸫/,
  'warehouse-order submit quote blocker must recognize ZD channels as non-blocking for missing price'
)

assert.match(
  pageSource,
  /const warehouseOrderSubmitDisabled = warehouseOrderSubmitted \|\| !detailLines\.length[\s\S]*<Button[\s\S]*icon=\{<SendOutlined \/>\}[\s\S]*disabled=\{warehouseOrderSubmitDisabled\}[\s\S]*onClick=\{\(\) => detailShippingOrderTarget && void handleSubmitShipping\(detailShippingOrderTarget\)\}/,
  'warehouse-order submit button must submit the whole parent order and disable only from parent-order state'
)

assert.doesNotMatch(
  pageSource,
  /部分提交|PARTIAL_SUBMITTED/,
  'warehouse-order UI must not expose partial submission state'
)

assert.match(
  purchaseOrderApiSource,
  /export function submitShippingOrder\(shippingOrderId: string\)[\s\S]*'POST',[\s\S]*\{\}/,
  'warehouse-order submit API must not send a child segment scope'
)

assert.match(
  detailTableSource,
  /key=\{activeQuoteMaintenanceKey\}[\s\S]*rowKey="id"/,
  'warehouse-order quote table rows must remount when the selected forwarder/channel changes'
)

assert.match(
  pageSource,
  /function applySelectedChannelQuoteToLine[\s\S]*channel\?\.lineQuotes[\s\S]*item\.partnerSku[\s\S]*sameCode\(item\.partnerSku, line\.partnerSku\)[\s\S]*quoteStatus: quote\.quoteStatus[\s\S]*unitPrice: quote\.unitPrice/,
  'warehouse-order detail must apply selected channel line quote status and unit price instead of stale global line values'
)

assert.match(
  pageSource,
  /showYiteQuoteFields[\s\S]*title: '义特材质'[\s\S]*updateLineQuoteDraft\(line\.id, \{ yiteMaterial/,
  'warehouse-order detail must show and edit Yite material only inside the selected Yite quote maintenance table'
)

assert.doesNotMatch(
  detailTableSource,
  /handleUpdateLineYiteMaterial/,
  'Yite material must not auto-save from a standalone column change; it is saved with the row quote action'
)

assert.match(
  pageSource,
  /handleSaveLineQuote[\s\S]*yiteMaterial: showYiteQuoteFields \? draft\.yiteMaterial[\s\S]*updateShippingOrderLineQuote/,
  'Yite material must be submitted through the row quote save payload when Yite is selected'
)

assert.doesNotMatch(
  pageSource,
  /QUOTE_CURRENCY_OPTIONS|QUOTE_BILLING_UNIT_OPTIONS|title: '币种'|title: '计费单位'/,
  'currency and billing unit must not occupy separate editable columns in quote maintenance'
)

assert.match(
  pageSource,
  /function defaultQuoteBillingUnit[\s\S]*case 'AIR'[\s\S]*return 'KG'[\s\S]*case 'SEA'[\s\S]*return 'CBM'/,
  'quote maintenance must derive billing unit from transport mode: air KG, sea CBM'
)

assert.match(
  pageSource,
  /const quoteBillingUnit = defaultQuoteBillingUnit\(activeDetailSegment\?\.transportMode \|\| line\.plannedTransportMode\)[\s\S]*currency: 'CNY'[\s\S]*billingUnit: quoteBillingUnit/,
  'row quote save must submit fixed CNY and route-derived billing unit'
)

assert.match(
  pageSource,
  /title: '报价单价'[\s\S]*value=\{draft\.unitPrice\}[\s\S]*quoteUnitDisplayText\(activeDetailSegment\?\.transportMode \|\| line\.plannedTransportMode\)/,
  'quote unit text must live under the unit price input while keeping existing quoted prices prefilled'
)

assert.doesNotMatch(
  pageSource,
  /handleSaveLineQuote[\s\S]*updateShippingOrderLineYiteMaterial/,
  'row quote save must not issue a separate Yite material request'
)

assert.match(
  pageSource,
  /quoteExportableOptions[\s\S]*filterQuoteOptionsWithTemplates\(quoteExportOptions\)/,
  'warehouse-order export modal must filter channels without export templates'
)

assert.match(
  pageSource,
  /buildQuoteForwarderSelectOptions\(quoteExportableOptions\)/,
  'warehouse-order export forwarder dropdown must use exportable channels only'
)

assert.doesNotMatch(
  pageSource,
  /shippingOrderSegmentForwarderLabel|warehouse-shipping-order-segment-tab-forwarder/,
  'warehouse-order segment tabs must stay at site + transport level, not bind to a forwarder label'
)

assert.doesNotMatch(
  cssSource,
  /warehouse-shipping-order-segment-tab-forwarder/,
  'warehouse-order segment tabs must not reserve a forwarder row in CSS'
)

assert.match(
  cssSource,
  /\.warehouse-shipping-order-chip--channel \{[\s\S]*max-width: 420px;/,
  'selected channel chips must clip long route names without a duplicate status tag'
)

assert.doesNotMatch(
  quoteControlSource,
  /warehouse-shipping-order-channel-status-tag|warehouse-shipping-order-quote-control-status/,
  'selected channel must not be repeated as a separate status strip'
)

assert.doesNotMatch(
  quoteControlSource,
  /待报价 \{formatQuantity|已报价 \{formatQuantity/,
  'selected channel status strip must not repeat pending and confirmed quote counts'
)

assert.doesNotMatch(
  pageSource,
  /warehouse-shipping-order-quote-counts/,
  'warehouse-order detail must not render duplicate quote count tags next to the quote filter'
)

assert.doesNotMatch(
  pageSource,
  /<Tag color="processing">\{activeDetailSegment\.segmentNo\}<\/Tag>/,
  'warehouse-order segment summary must not repeat the internal child shipping-order number'
)

assert.match(
  cssSource,
  /\.warehouse-shipping-order-detail-toolbar \{[\s\S]*grid-template-rows: auto auto;/,
  'warehouse-order detail toolbar must reserve exactly two compact header rows'
)

assert.match(
  cssSource,
  /\.warehouse-shipping-order-detail-route-row \{[\s\S]*display: flex;[\s\S]*justify-content: space-between;/,
  'warehouse-order detail first header row must place route chips and actions on one row'
)

assert.match(
  cssSource,
  /\.warehouse-shipping-order-detail-status-row \{[\s\S]*display: flex;[\s\S]*justify-content: space-between;/,
  'warehouse-order detail second header row must place quote chips and status filters on one row'
)

assert.match(
  cssSource,
  /\.warehouse-shipping-order-chip \{[\s\S]*border-radius: 6px;[\s\S]*font-size: 12px;/,
  'warehouse-order detail header chips must use compact tag styling'
)

assert.match(
  cssSource,
  /\.warehouse-shipping-order-chip--active \{[\s\S]*background: #1677ff;/,
  'warehouse-order detail header chips must show the selected route or channel'
)

assert.match(
  cssSource,
  /\.warehouse-shipping-order-line-meta-cell \{[\s\S]*display: grid;[\s\S]*gap: 2px;/,
  'combined barcode/source/quantity cell must use compact stacked metadata'
)

assert.match(
  cssSource,
  /warehouse-shipping-order-page--embedded[\s\S]*warehouse-shipping-order-toolbar-actions[\s\S]*flex-wrap: nowrap/,
  'embedded warehouse-order toolbar must keep search and refresh on one row'
)
