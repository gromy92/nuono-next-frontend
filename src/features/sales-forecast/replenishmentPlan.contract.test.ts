import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const salesForecastDir = dirname(fileURLToPath(import.meta.url))
const featuresDir = join(salesForecastDir, '..')
const replenishmentDir = join(featuresDir, 'replenishment-plan')
const purchaseOrderDir = join(featuresDir, 'purchase-order')
const appShellDir = join(featuresDir, 'app-shell')

const salesForecastPagePath = join(salesForecastDir, 'SalesForecastPage.tsx')
const salesForecastPageSource = existsSync(salesForecastPagePath)
  ? readFileSync(salesForecastPagePath, 'utf8')
  : ''
const purchaseOrderPageSource = readFileSync(join(purchaseOrderDir, 'PurchaseOrderPage.tsx'), 'utf8')
const workspaceMenuRegistrySource = readFileSync(join(appShellDir, 'WorkspaceMenuRegistry.ts'), 'utf8')

const requiredReplenishmentFiles = [
  'api.ts',
  'types.ts',
  'purchaseProgress.ts',
  'purchaseDrafts.ts',
  'purchaseDuplicateNotice.ts',
  'ReplenishmentPlanTab.tsx',
  'ReplenishmentPlanTab.css'
]

for (const file of requiredReplenishmentFiles) {
  assert.ok(
    existsSync(join(replenishmentDir, file)),
    `replenishment plan must live in neutral feature module: ${file}`
  )
}

const apiSource = readFileSync(join(replenishmentDir, 'api.ts'), 'utf8')
const typesSource = readFileSync(join(replenishmentDir, 'types.ts'), 'utf8')
const purchaseProgressSource = readFileSync(join(replenishmentDir, 'purchaseProgress.ts'), 'utf8')
const purchaseDraftsSource = readFileSync(join(replenishmentDir, 'purchaseDrafts.ts'), 'utf8')
const purchaseDuplicateNoticeSource = readFileSync(join(replenishmentDir, 'purchaseDuplicateNotice.ts'), 'utf8')
const tabSource = readFileSync(join(replenishmentDir, 'ReplenishmentPlanTab.tsx'), 'utf8')
const cssSource = readFileSync(join(replenishmentDir, 'ReplenishmentPlanTab.css'), 'utf8')
const inTransitBatchListSource = readFileSync(join(featuresDir, 'in-transit-goods', 'useInTransitBatchList.ts'), 'utf8')
const purchaseOrderMenuBlock = workspaceMenuRegistrySource.match(/'purchase-order': \{[\s\S]*?\n  \},/)?.[0] || ''

function typeBlock(typeName: string) {
  const match = typesSource.match(new RegExp(`export type ${typeName} = \\{([\\s\\S]*?)\\n\\}`))
  assert.ok(match, `${typeName} must be declared as an exported object type`)
  return match[1]
}

function assertTypeHasFields(typeName: string, fields: string[]) {
  const block = typeBlock(typeName)
  for (const field of fields) {
    assert.match(block, new RegExp(`\\b${field}\\??:`), `${typeName} must define ${field}`)
  }
}

assert.doesNotMatch(
  salesForecastPageSource,
  /fetchReplenishmentPlanOverview|ReplenishmentPlanDrawer|replenishmentByPartnerSku|补货计划加载失败|ReplenishmentPlanCompactCell/,
  'SalesForecastPage.tsx must not host replenishment plan UI or loading state'
)

assert.match(
  purchaseOrderPageSource,
  /import\s+\{\s*ReplenishmentPlanTab\s*\}\s+from ['"]\.\.\/replenishment-plan\/ReplenishmentPlanTab['"]/,
  'PurchaseOrderPage.tsx must import the replenishment tab from the neutral module'
)
assert.match(purchaseOrderPageSource, /\bTabs\b/, 'PurchaseOrderPage.tsx must use a top-level Tabs control')
assert.match(purchaseOrderMenuBlock, /label:\s*['"]补货采购['"]/, 'workspace menu must rename the combined purchase entry to 补货采购')
assert.match(purchaseOrderMenuBlock, /pathLabel:\s*['"]采购 \/ 补货采购['"]/, 'workspace path label must use 补货采购')
assert.match(purchaseOrderMenuBlock, /tabLabel:\s*['"]补货采购['"]/, 'workspace tab label must use 补货采购')
assert.doesNotMatch(purchaseOrderMenuBlock, /label:\s*['"]采购单['"]|pathLabel:\s*['"]采购 \/ 采购单['"]|tabLabel:\s*['"]采购单['"]/, 'workspace menu must not keep the old standalone 采购单 label')
assert.match(purchaseOrderPageSource, /PURCHASE_ORDER_TAB_QUERY_KEY/, 'purchase order tabs must be URL-addressable')
assert.match(purchaseOrderPageSource, /key:\s*['"]purchase-orders['"]/, 'purchase order tab must keep the existing workbench')
assert.match(purchaseOrderPageSource, /key:\s*['"]replenishment-plan['"]/, 'purchase order page must expose a replenishment tab key')
assert.match(purchaseOrderPageSource, /label:\s*['"]补货计划['"]/, 'purchase order page must label the new tab as 补货计划')
assert.match(
  purchaseOrderPageSource,
  /items=\{\[\s*\{\s*key:\s*['"]replenishment-plan['"][\s\S]*?label:\s*['"]补货计划['"][\s\S]*?\},\s*\{\s*key:\s*['"]purchase-orders['"][\s\S]*?label:\s*['"]采购单['"]/,
  'PurchaseOrderPage tabs must show 补货计划 before 采购单'
)
assert.match(
  purchaseOrderPageSource,
  /if \(typeof window === ['"]undefined['"]\) \{\s*return ['"]replenishment-plan['"]\s*\}/,
  'PurchaseOrderPage must default to the first replenishment-plan tab'
)
assert.match(
  purchaseOrderPageSource,
  /const requestedTab = new URLSearchParams\(window\.location\.search\)\.get\(PURCHASE_ORDER_TAB_QUERY_KEY\)[\s\S]*return requestedTab === ['"]purchase-orders['"]\s*\?\s*['"]purchase-orders['"]\s*:\s*['"]replenishment-plan['"]/,
  'PurchaseOrderPage must keep 采购单 reachable with tab=purchase-orders and otherwise default to 补货计划'
)
assert.match(
  purchaseOrderPageSource,
  /if \(activeTab === ['"]purchase-orders['"]\) \{\s*params\.set\(PURCHASE_ORDER_TAB_QUERY_KEY,\s*['"]purchase-orders['"]\)[\s\S]*\} else \{\s*params\.delete\(PURCHASE_ORDER_TAB_QUERY_KEY\)/,
  'PurchaseOrderPage URL sync must only write tab=purchase-orders for the non-default tab'
)
assert.match(purchaseOrderPageSource, /<ReplenishmentPlanTab[\s\S]*session=\{session \|\| null\}/, 'purchase order page must pass the session into ReplenishmentPlanTab')
assert.match(purchaseOrderPageSource, /const \[purchaseOrdersRevision,\s*setPurchaseOrdersRevision\] = useState\(0\)/, 'purchase order page must track purchase-order mutations for the replenishment tab')
assert.match(purchaseOrderPageSource, /function notifyPurchaseOrdersChanged\(\)[\s\S]*setPurchaseOrdersRevision\(\(current\) => current \+ 1\)/, 'purchase-order mutations must bump a revision so replenishment added status can refresh')
assert.match(purchaseOrderPageSource, /await deletePurchaseOrder\(targetId\)[\s\S]*notifyPurchaseOrdersChanged\(\)/, 'deleting a purchase order must notify replenishment plan to refresh added status')
assert.match(purchaseOrderPageSource, /await deletePurchaseOrderItem\(order\.id,\s*item\.id\)[\s\S]*notifyPurchaseOrdersChanged\(\)/, 'deleting a purchase order item must notify replenishment plan to refresh added status')
assert.match(purchaseOrderPageSource, /<ReplenishmentPlanTab[\s\S]*purchaseOrdersRevision=\{purchaseOrdersRevision\}/, 'purchase order page must pass purchase order revision into ReplenishmentPlanTab')

assert.match(apiSource, /export (?:async )?function fetchReplenishmentPlanOverview\(query: ReplenishmentPlanQuery\)/, 'neutral API must export fetchReplenishmentPlanOverview(query)')
assert.match(apiSource, /\/api\/replenishment-plan\/overview/, 'neutral API must call the replenishment overview endpoint')
assert.match(apiSource, /storeCode: query\.storeCode/, 'overview API must serialize storeCode')
assert.match(apiSource, /siteCode: query\.siteCode/, 'overview API must serialize siteCode')

assert.match(typesSource, /export type ReplenishmentQuantity = number \| string/, 'types must expose number-or-string quantities')
assertTypeHasFields('ReplenishmentPlanOverview', [
  'state',
  'storeCode',
  'siteCode',
  'calculationVersion',
  'configSnapshot',
  'anchorDate',
  'rows'
])
assertTypeHasFields('ReplenishmentPlanItem', [
  'partnerSku',
  'sku',
  'productTitle',
  'imageUrl',
  'listingAt',
  'latestFactDate',
  'observedDays',
  'historyUnits7',
  'historyUnits30',
  'historyUnits60',
  'historyUnits90',
  'adjustedHistoryUnits7',
  'adjustedHistoryUnits30',
  'adjustedHistoryUnits60',
  'adjustedHistoryUnits90',
  'forecastUnits30',
  'forecastUnits60',
  'forecastUnits90',
  'forecastUnits100',
  'confidenceLabel',
  'shortReason',
  'currentStockUnits',
  'fbnStockUnits',
  'supermallStockUnits',
  'knownInboundUnits',
  'inboundBatches',
  'nearestInboundEtaDate',
  'missingEtaInboundQty',
  'missingEtaBatchCount',
  'missingEtaBatches',
  'firstStockoutDay',
  'airWindowForecastUnits',
  'airCalculatedUnits',
  'airSuggestedUnits',
  'seaWindowForecastUnits',
  'seaCalculatedUnits',
  'seaSuggestedUnits',
  'calculationBlocked',
  'warnings'
])
assertTypeHasFields('ReplenishmentPlanInboundBatch', [
  'batchId',
  'batchReferenceNo',
  'transportMode',
  'batchStatus',
  'etaDate',
  'remainingQuantity',
  'coverageIncluded',
  'etaReviewRequired'
])
assertTypeHasFields('ReplenishmentPlanMissingEtaBatch', [
  'batchId',
  'batchReferenceNo',
  'transportMode',
  'batchStatus',
  'remainingQuantity'
])

assert.match(tabSource, /loadPurchaseOrders/, 'ReplenishmentPlanTab must load existing purchase orders')
assert.match(tabSource, /addPurchaseOrderItems/, 'ReplenishmentPlanTab must reuse the existing add-items API')
assert.match(tabSource, /批量加入采购/, 'ReplenishmentPlanTab must support batch add to purchase order')
assert.match(tabSource, /加入采购/, 'ReplenishmentPlanTab must support single-row add to purchase order')
assert.match(tabSource, /InputNumber/, 'ReplenishmentPlanTab must allow manual quantity edits')
assert.match(tabSource, /Select/, 'ReplenishmentPlanTab must allow selecting an existing purchase order')
assert.match(tabSource, /dataIndex:\s*['"]partnerSku['"][\s\S]*width:\s*['"]22%['"]/, 'product column must stay compact after removing PSKU/SKU labels')
assert.match(tabSource, /suggestionFilter/, 'ReplenishmentPlanTab must expose a replenishment suggestion filter')
assert.doesNotMatch(tabSource, /需要补空运|需要补海运|全部建议/, 'ReplenishmentPlanTab must not keep the old standalone replenishment filter select')
assert.match(tabSource, /renderSuggestionFilterButton/, 'ReplenishmentPlanTab must use summary chips as replenishment filters')
assert.match(tabSource, /renderSuggestionFilterButton\(['"]all['"],\s*['"]全部['"],\s*suggestionSummary\.totalSkuCount,\s*['"]SKU['"]\)/, 'all summary chip must include products that do not need replenishment')
assert.match(tabSource, /renderSuggestionFilterButton\(['"]needed['"],\s*['"]需要补货['"],\s*suggestionSummary\.replenishmentSkuCount,\s*['"]SKU['"]\)/, 'needed summary chip must filter products that need replenishment')
assert.match(tabSource, /renderSuggestionFilterButton\(['"]air['"],\s*['"]空运['"],\s*suggestionSummary\.airSkuCount\)/, 'air summary chip must filter rows that need air replenishment')
assert.match(tabSource, /renderSuggestionFilterButton\(['"]sea['"],\s*['"]海运['"],\s*suggestionSummary\.seaSkuCount\)/, 'sea summary chip must filter rows that need sea replenishment')
assert.match(tabSource, /SEA_ETA_UNCERTAIN_AIR_WINDOW_WARNING\s*=\s*['"]sea_eta_uncertain_air_window_coverage['"]/, 'replenishment tab must read the backend sea ETA uncertainty warning')
assert.match(tabSource, /SEA_ETA_UNCERTAIN_AIR_WINDOW_TOOLTIP\s*=\s*['"]海运到货时间具有不确定性 谨慎评判['"]/, 'sea ETA uncertainty warning must use the agreed hover copy')
assert.match(tabSource, /const seaEtaRisk = isAir && hasSeaEtaRiskWarning\(item\)/, 'only the air suggestion tag should be marked risky when sea ETA affects air coverage')
assert.match(tabSource, /tagColor = seaEtaRisk \? ['"]red['"]/, 'sea ETA uncertainty must render the affected air suggestion tag in red')
assert.match(cssSource, /\.replenishment-plan-suggestion-tag\.is-sea-eta-risk/, 'sea ETA uncertainty tag styling must be durable in CSS')
assert.match(tabSource, /onClick=\{\(\) => setSuggestionFilter\(filter\)\}/, 'summary filter chips must update the active suggestion filter when clicked')
assert.match(tabSource, /aria-pressed=\{suggestionFilter === filter\}/, 'summary filter chips must expose active state')
assert.match(tabSource, /replenishment-plan-toolbar-actions[\s\S]*<Button[\s\S]*ReloadOutlined[\s\S]*刷新[\s\S]*批量加入采购/, 'refresh button must live in the right toolbar action area')
assert.match(tabSource, /summarizeSuggestions/, 'ReplenishmentPlanTab must summarize replenishment suggestions from the current list')
assert.match(tabSource, /const totalSkuCount = rows\.length/, 'suggestion summary total count must include non-replenishment rows')
assert.match(tabSource, /if \(suggestionFilter === ['"]needed['"]\)/, 'needed filter must be distinct from all rows')
assert.match(tabSource, /if \(suggestionFilter === ['"]all['"]\)[\s\S]*return true/, 'all filter must show every searched row')
assert.match(tabSource, /buildPurchaseDrafts/, 'ReplenishmentPlanTab must build purchase drafts from replenishment suggestions')
assert.match(tabSource, /const \[openingPurchaseKey,\s*setOpeningPurchaseKey\] = useState<string>\(\)/, 'single-row add must track loading by the clicked product row instead of a global boolean')
assert.match(tabSource, /purchaseOrdersRevision\?: number/, 'ReplenishmentPlanTab must accept purchase-order revision changes from the parent page')
assert.match(tabSource, /useEffect\(\(\) => \{\s*void loadEditablePurchaseOrders\(\)\s*\}, \[loadEditablePurchaseOrders,\s*purchaseOrdersRevision\]\)/, 'ReplenishmentPlanTab must reload purchase orders when the parent purchase-order revision changes')
assert.match(tabSource, /const openingKey = purchaseOpeningKey\(targetRows\)[\s\S]*setOpeningPurchaseKey\(openingKey\)[\s\S]*finally\s*\{\s*setOpeningPurchaseKey\(undefined\)\s*\}/, 'opening purchase modal must set and clear the row-specific loading key')
assert.match(tabSource, /function purchaseOpeningKey\(targetRows: ReplenishmentPlanItem\[\]\)[\s\S]*BATCH_PURCHASE_OPENING_KEY[\s\S]*targetRows\[0\]\?\.partnerSku/, 'single-row and batch loading keys must be distinct')
assert.match(tabSource, /onClick=\{\(\) => void openPurchaseModal\(\[item\]\)\}[\s\S]*loading=\{openingPurchaseKey === purchaseOpeningKey\(\[item\]\)\}/, 'single-row add button must only show loading for the clicked product')
assert.match(tabSource, /loading=\{openingPurchaseKey === BATCH_PURCHASE_OPENING_KEY\}[\s\S]*批量加入采购/, 'batch add button must use a separate loading key')
assert.match(tabSource, /const \[selectedPurchaseRows,\s*setSelectedPurchaseRows\] = useState<ReplenishmentPlanItem\[\]>\(\[\]\)/, 'batch add must store the actual selected row snapshot from the table selection callback')
assert.match(tabSource, /function handleSelectedRowsChange\(keys: Key\[\],\s*rows: ReplenishmentPlanItem\[\]\)[\s\S]*setSelectedRowKeys\(keys\)[\s\S]*setSelectedPurchaseRows\(rows\)/, 'table selection must keep selected keys and selected row snapshots together')
assert.match(tabSource, /disabled=\{!selectedPurchaseRows\.length\}[\s\S]*onClick=\{\(\) => void openPurchaseModal\(selectedPurchaseRows,\s*['"]batch['"]\)\}/, 'batch add button must open the modal from the selected row snapshot with batch filtering, not rows re-derived from the current filtered list')
assert.doesNotMatch(tabSource, /const selectedRows = selectedRowKeys[\s\S]*filteredRows\.find/, 'batch add must not reconstruct selected rows from filteredRows because pagination or refreshed filters can show the wrong products')
assert.match(tabSource, /const \[purchaseDuplicateNotice,\s*setPurchaseDuplicateNotice\] = useState\(['"]['"]\)/, 'duplicate purchase transport warning must use inline modal state so repeated add can warn without blocking')
assert.doesNotMatch(tabSource, /duplicateTransportWarning|setDuplicateTransportWarning|没有可新增的运输方式/, 'duplicate purchase feedback must no longer block the add flow with a separate modal')
assert.match(tabSource, /replenishment-plan-purchase-duplicate-alert[\s\S]*type=['"]error['"][\s\S]*purchaseDuplicateNotice/, 'duplicate purchase feedback must render as a red alert at the top of the add-purchase modal')
assert.doesNotMatch(tabSource, /Modal\.warning/, 'duplicate transport feedback must not use AntD static Modal.warning because it can fail to render in this app context')
assert.match(tabSource, /import \{ formatPurchaseDuplicateNotice \} from ['"]\.\/purchaseDuplicateNotice['"]/, 'ReplenishmentPlanTab must use the shared duplicate purchase notice helper')
assert.match(purchaseDuplicateNoticeSource, /function formatPurchaseDuplicateNotice\(drafts: PurchaseDraftRow\[\],\s*orders: PurchaseOrder\[\]\)[\s\S]*已加入采购单[\s\S]*可继续重复加入/, 'duplicate notice must explain where the product was already added while explicitly allowing repeated add')
assert.match(purchaseDuplicateNoticeSource, /formatPurchaseDuplicateNotice[\s\S]*formatPurchaseTransportSource\(source\)/, 'duplicate notice must include purchase order title, number, status, and quantity source text')
assert.match(purchaseDuplicateNoticeSource, /purchaseDraftNoticeLines\(drafts\)/, 'duplicate notice must inspect draft transports independently from positive submit quantities')
assert.doesNotMatch(purchaseDuplicateNoticeSource, /purchaseDraftNoticeLines[\s\S]*\.filter\(\(quantityDraft\) => quantityDraft\.quantity > 0\)/, 'duplicate notice must still show existing purchase facts when the current suggested quantity is zero')
assert.doesNotMatch(tabSource, /duplicatePurchaseTransportMessage|hasPositivePurchaseDraftQuantity/, 'blocking duplicate helper functions must be removed from the replenishment tab')
assert.match(purchaseDraftsSource, /air:\s*buildPurchaseDraftQuantity\(['"]AIR['"]/, 'single-row add must expose an AIR quantity in the product draft row')
assert.match(purchaseDraftsSource, /sea:\s*buildPurchaseDraftQuantity\(['"]SEA['"]/, 'single-row add must expose a SEA quantity in the product draft row')
assert.match(purchaseDraftsSource, /airSuggestedUnits/, 'AIR draft quantity must default from the air suggestion')
assert.match(purchaseDraftsSource, /airCalculatedUnits/, 'AIR draft must preserve the raw calculated air quantity for display')
assert.match(purchaseDraftsSource, /seaSuggestedUnits/, 'SEA draft quantity must default from the sea suggestion')
assert.match(purchaseDraftsSource, /seaCalculatedUnits/, 'SEA draft must preserve the calculated sea quantity for display')
assert.match(purchaseDraftsSource, /export function filterBatchPurchaseDrafts[\s\S]*draft\.air\.quantity > 0 \|\| draft\.sea\.quantity > 0/, 'batch purchase drafts must hide product rows whose air and sea suggestions are both zero')
assert.match(tabSource, /const calculableRows = targetRows\.filter\(\(item\) => !item\.calculationBlocked\)[\s\S]*const allDrafts = calculableRows\.flatMap\(\(item\) => buildPurchaseDrafts\(item,\s*query\.siteCode\)\)[\s\S]*const drafts = source === ['"]batch['"] \? filterBatchPurchaseDrafts\(allDrafts\) : allDrafts/, 'batch purchase modal must reject blocked rows and filter zero-suggestion products before rendering')
assert.doesNotMatch(tabSource, /dedupePurchaseDrafts\(drafts|dedupedDrafts|usedTransportKeys/, 'opening the purchase modal must not clear already-planned quantities because repeated add is allowed')
assert.match(tabSource, /const nextOrders = await loadEditablePurchaseOrders\(\)[\s\S]*setPurchaseDuplicateNotice\(formatPurchaseDuplicateNotice\(drafts,\s*purchasePlanningScopeOrders\(nextOrders\)\)\)[\s\S]*setPurchaseDrafts\(drafts\)[\s\S]*setPurchaseModalOpen\(true\)/, 'opening the purchase modal must warn about existing purchase lines while still rendering the original draft quantities')
assert.match(tabSource, /title:\s*['"]空运['"][\s\S]*renderDraftQuantityEditor\(draft,\s*['"]air['"]\)[\s\S]*title:\s*['"]海运['"][\s\S]*renderDraftQuantityEditor\(draft,\s*['"]sea['"]\)/, 'purchase modal must show air and sea quantities in the same product row')
assert.match(tabSource, /计算[\s\S]*quantityDraft\.calculatedQuantity[\s\S]*\/ 建议[\s\S]*<InputNumber/, 'purchase modal must show calculation text before the editable suggested quantity input')
assert.doesNotMatch(tabSource, /计算[\s\S]*quantityDraft\.calculatedQuantity[\s\S]*建议 \{formatQuantity\(quantityDraft\.suggestedQuantity\)\}/, 'purchase modal must not render suggested quantity as static text outside the input')
assert.match(cssSource, /replenishment-plan-draft-transport-cell \{[\s\S]*flex-direction:\s*row/, 'purchase modal calculation text and suggested input must sit on one line')
assert.doesNotMatch(tabSource, /flatMap\(\(item\) => buildPurchaseDrafts\(item, query\.siteCode\)\)\s*\.filter/, 'opening the purchase modal must not hide zero-quantity air or sea rows')
assert.match(tabSource, /validDrafts = purchaseDraftLines\(purchaseDrafts\)/, 'submitting must include all positive air and sea quantities in one purchase order request')
assert.match(tabSource, /addPurchaseOrderItems\(latestSelectedPurchaseOrder\.id,\s*\{\s*items\s*\}\)/, 'positive air and sea drafts must submit together to the latest verified selected purchase order')
assert.doesNotMatch(tabSource, /order\.storeCode\s*===\s*query\?\.storeCode/, 'purchase modal must not hide same logical-store purchase orders from another site storeCode')
assert.match(tabSource, /function editablePurchaseOrders[\s\S]*order\.status !== ['"]submitted['"][\s\S]*order\.status !== ['"]done['"][\s\S]*!isHistoricalPurchaseOrder\(order\)/, 'purchase order selector must only expose editable non-historical orders')
assert.match(tabSource, /function purchasePlanningScopeOrders[\s\S]*order\.status !== ['"]deleted['"][\s\S]*order\.status !== ['"]done['"][\s\S]*!isHistoricalPurchaseOrder\(order\)/, 'replenishment add/dedupe scope must ignore deleted, completed, and imported historical orders so deleting from the current purchase order allows adding again')
const planningScopeBlock = tabSource.match(/function purchasePlanningScopeOrders[\s\S]*?\n\}/)?.[0] || ''
assert.doesNotMatch(planningScopeBlock, /submitted/, 'current purchase-order duplicate scope must include submitted orders that are still part of the procurement flow')
assert.match(tabSource, /function isHistoricalPurchaseOrder\(order: PurchaseOrder\)[\s\S]*order\.orderNo[\s\S]*startsWith\(['"]PO-HIST-['"]\)/, 'replenishment add/dedupe scope must identify historical backfill purchase orders by PO-HIST order number')
assert.doesNotMatch(tabSource, /REPLENISHMENT_PLAN_PURCHASE_CACHE_KEY|localPurchaseTransportKeys|loadLocalPurchaseTransportKeys|markLocalPurchaseDraftLines|reconcileLocalPurchaseTransportKeys/, 'added purchase status must not rely on local cache; it must be derived from current purchase orders')
assert.match(purchaseProgressSource, /export function summarizePurchasePlanProgress/, 'replenishment plan must expose a pure current-plan purchase progress summary')
assert.match(purchaseProgressSource, /totalReplenishmentSkuCount[\s\S]*addedSkuCount[\s\S]*partialSkuCount[\s\S]*remainingSkuCount[\s\S]*airSkuCount[\s\S]*airQuantity[\s\S]*seaSkuCount[\s\S]*seaQuantity[\s\S]*orderLabels/, 'purchase progress summary must include complete, partial, and transport quantity coverage')
assert.match(purchaseProgressSource, /normalizeText\(allocation\.site\) !== normalizedSiteCode/, 'purchase progress summary must count current-site allocations without filtering by the order anchor store code')
assert.doesNotMatch(purchaseProgressSource, /order\.storeCode\s*===|anchorStoreCode/, 'purchase progress summary must not site-isolate same logical-store purchase orders by order storeCode')
assert.match(tabSource, /summarizePurchasePlanProgress\(searchMatchedRows,\s*purchasePlanningOrders,\s*query\?\.siteCode\)/, 'top current-plan summary must be derived from the current rows and current purchase-order facts')
assert.match(tabSource, /replenishment-plan-progress-summary[\s\S]*当前计划[\s\S]*已加入[\s\S]*还剩/, 'ReplenishmentPlanTab must show a top current-plan summary with joined orders and remaining products')
assert.match(tabSource, /const purchaseTransportQuantities = useMemo\(\s*\(\) => purchaseOrderTransportQuantities\(purchasePlanningOrders\),\s*\[purchasePlanningOrders\]\s*\)/, 'list coverage status must be derived from current purchase-order quantities')
assert.match(tabSource, /type PurchaseTransportSource = \{[\s\S]*orderTitle\?: string[\s\S]*orderNo\?: string[\s\S]*orderStatus\?: string[\s\S]*quantity\?: number/, 'added purchase status must keep the source purchase order title, number, status, and quantity for explanation')
assert.match(tabSource, /const purchaseTransportSources = useMemo\(\s*\(\) => purchaseOrderTransportSources\(purchasePlanningOrders\),\s*\[purchasePlanningOrders\]\s*\)/, 'list added status must derive an explanatory source map from current purchase-order facts')
assert.match(tabSource, /function purchaseOrderTransportSources\(orders: PurchaseOrder\[\]\)[\s\S]*pskuSiteTransportKey\(item\.partnerSku,\s*allocation\.site,\s*allocation\.transportMode\)[\s\S]*orderTitle:\s*order\.title[\s\S]*orderNo:\s*order\.orderNo[\s\S]*orderStatus:\s*order\.status/, 'purchase order source map must preserve the exact current order that made a transport mode already added')
assert.match(tabSource, /const tooltipLines = \[[\s\S]*formatPurchaseTransportSource\(source\)[\s\S]*<Tooltip title=\{tooltipLines\.join\(['"]\\n['"]\)\}[\s\S]*\{tag\}/, 'added suggestion tags must show the source purchase order in a tooltip')
assert.match(tabSource, /renderSuggestionTransportTag\(item,\s*['"]AIR['"]\)[\s\S]*renderSuggestionTransportTag\(item,\s*['"]SEA['"]\)/, 'suggestion column must show add status for both air and sea transports')
assert.match(tabSource, /dataIndex:\s*['"]seaSuggestedUnits['"][\s\S]*width:\s*['"]17%['"]/, 'suggestion column must be wider enough for calculation, suggestion, and add-status labels')
assert.match(tabSource, /已加[\s\S]*部分[\s\S]*待加|待加[\s\S]*无需/, 'suggestion status labels must distinguish complete, partial, pending, and no-suggestion transports')
assert.match(tabSource, /const tagColor = seaEtaRisk \? ['"]red['"][\s\S]*status === ['"]部分['"] \? ['"]orange['"][\s\S]*<Tag color=\{tagColor\}/, 'suggestion tags must preserve red sea-risk priority and mark partial purchase coverage')
assert.match(cssSource, /replenishment-plan-suggestion-status\.is-added \{[\s\S]*background:\s*#f3f4f6;[\s\S]*color:\s*#4b5563;/, 'added suggestion status badge must be gray, not a green success state')
assert.doesNotMatch(tabSource, /purchaseOrderTransportKeys\(purchasePlanningScopeOrders\(nextOrders\)\)[\s\S]*dedupePurchaseDrafts/, 'opening purchase modal must not remove already-planned PSKU/site/transport quantities from current purchase orders')
assert.match(tabSource, /const latestOrders = await loadEditablePurchaseOrders\(\)[\s\S]*const latestEditableOrders = editablePurchaseOrders\(latestOrders\)[\s\S]*const latestSelectedPurchaseOrder = latestEditableOrders\.find[\s\S]*addPurchaseOrderItems\(latestSelectedPurchaseOrder\.id,\s*\{\s*items\s*\}\)/, 'submitting replenishment purchase drafts must re-check that the target order is still editable, then add items without duplicate blocking')
assert.doesNotMatch(tabSource, /duplicatePskuSiteTransportMessage\(validDrafts,\s*latestPurchasePlanningOrders\)|const latestPurchasePlanningOrders = purchasePlanningScopeOrders\(latestOrders\)/, 'submitting replenishment purchase drafts must not block repeated add by existing current purchase-order lines')
assert.doesNotMatch(tabSource, /duplicatePskuSiteMessage\(validDrafts,\s*selectedPurchaseOrder\)/, 'submitting must not rely on the stale selected purchase-order snapshot for duplicate checks')
assert.match(tabSource, /function purchaseOrderTransportQuantities[\s\S]*pskuSiteTransportKey\(item\.partnerSku,\s*allocation\.site,\s*allocation\.transportMode\)[\s\S]*numericQuantity\(allocation\.quantity\)/, 'purchase coverage must aggregate quantities by PSKU, site, and transport mode')
assert.doesNotMatch(purchaseDraftsSource, /dedupePurchaseDrafts|hasUnplannedDraftTransport/, 'purchase draft helpers must not retain old duplicate-clearing logic because repeated add is allowed')
assert.doesNotMatch(tabSource, /title:\s*['"]已加入['"]|title:\s*['"]剩余['"]/, 'ReplenishmentPlanTab must not display already-added or remaining-copy as purchase modal table columns')
assert.doesNotMatch(tabSource, /title:\s*['"]加入采购数量['"]/, 'ReplenishmentPlanTab must not show purchase quantity as a list column')
assert.doesNotMatch(tabSource, /title:\s*['"]操作['"]/, 'ReplenishmentPlanTab must not spend a separate table column on row actions')
assert.doesNotMatch(tabSource, /title:\s*['"]销量依据['"]/, 'ReplenishmentPlanTab must split sales evidence into history and forecast columns')
assert.match(tabSource, /Tooltip[\s\S]*校正历史[\s\S]*ExclamationCircleOutlined[\s\S]*历史数据说明/, 'history table title must expose a small exclamation tooltip with detailed explanation')
assert.match(tabSource, /title:\s*\([\s\S]*历史数据[\s\S]*Tooltip[\s\S]*dataIndex:\s*['"]historyUnits7['"]/, 'ReplenishmentPlanTab must show historical evidence in its own column')
assert.match(tabSource, /dataIndex:\s*['"]historyUnits7['"][\s\S]*width:\s*['"]20%['"]/, 'history evidence column must be narrower after shortening the segmented history header')
assert.match(tabSource, /title:\s*['"]预测数据['"][\s\S]*dataIndex:\s*['"]forecastUnits100['"]/, 'ReplenishmentPlanTab must show forecast evidence in its own column')
assert.match(tabSource, /dataIndex:\s*['"]forecastUnits100['"][\s\S]*width:\s*['"]18%['"]/, 'forecast evidence column must be wider for aligned prediction rows')
assert.match(tabSource, /dataIndex:\s*['"]knownInboundUnits['"][\s\S]*width:\s*['"]23%['"]/, 'inbound evidence column must be wider for aligned batch rows')
assert.doesNotMatch(tabSource, /scroll=\{\{\s*x:/, 'ReplenishmentPlanTab must not require horizontal table scrolling')
assert.doesNotMatch(tabSource, /title:\s*['"]库存依据['"]/, 'ReplenishmentPlanTab must not show inventory evidence as a separate table column')
assert.match(tabSource, /replenishment-plan-product-stock/, 'ReplenishmentPlanTab must show inventory evidence under product information')
assert.match(tabSource, /FBN\s*\{formatQuantity\(item\.fbnStockUnits\)\}/, 'ReplenishmentPlanTab inventory evidence must show FBN stock')
assert.match(tabSource, /Supermall\s*\{formatQuantity\(item\.supermallStockUnits\)\}/, 'ReplenishmentPlanTab inventory evidence must display Supermall stock')
assert.doesNotMatch(tabSource, /Supermall[\s\S]*不计入/, 'ReplenishmentPlanTab must not show the Supermall exclusion copy in the compact product cell')
assert.doesNotMatch(tabSource, /合计\s*\{formatQuantity\(item\.currentStockUnits\)\}/, 'ReplenishmentPlanTab inventory evidence must not show FBN+Supermall totals')
assert.match(tabSource, /上架[\s\S]*formatDate\(item\.listingAt\)[\s\S]*formatListingAgeDays\(item\.listingAt,\s*planDate\)/, 'ReplenishmentPlanTab must show listing date and age days under product information')
assert.match(tabSource, /function formatListingAgeDays/, 'ReplenishmentPlanTab must calculate listing age days locally from the plan date')
assert.match(tabSource, /onImageClick=\{item\.imageUrl \? \(\) => setPreviewImage/, 'ReplenishmentPlanTab product image must be clickable for full-size preview')
assert.match(tabSource, /<Modal[\s\S]*open=\{Boolean\(previewImage\)\}[\s\S]*<img[\s\S]*src=\{previewImage\.url\}/, 'ReplenishmentPlanTab must render a full-size image preview modal')
assert.match(tabSource, /formatMonthDay/, 'ReplenishmentPlanTab must show inbound ETA as month-day in list rows')
assert.match(tabSource, /SEA|AIR/, 'ReplenishmentPlanTab must map sea and air suggestions to transport modes')
assert.match(tabSource, /未来100天/, 'ReplenishmentPlanTab must label the forecast evidence as future 100 days')
assert.match(tabSource, /forecastUnits100/, 'ReplenishmentPlanTab must show the future 100-day forecast evidence in the list')
assert.doesNotMatch(tabSource, /\{item\.forecastUnits30\}\s*\/\s*\{item\.forecastUnits60\}\s*\/\s*\{item\.forecastUnits90\}/, 'ReplenishmentPlanTab must not show the old 30/60/90 forecast summary as the main replenishment forecast evidence')
assert.match(tabSource, /summarizeMissingEta/, 'ReplenishmentPlanTab must summarize missing ETA logistics facts')
assert.match(tabSource, /replenishment-plan-missing-eta-alert/, 'ReplenishmentPlanTab must show the missing ETA maintenance alert')
assert.match(tabSource, /openMissingEtaOverviewMaintenance/, 'missing ETA alert must navigate to in-transit maintenance')
assert.match(tabSource, /calculationBlocked/, 'ReplenishmentPlanTab must render and enforce the backend calculation blocked state')
assert.match(tabSource, /getCheckboxProps/, 'blocked rows must not be selectable for batch purchase')
assert.doesNotMatch(tabSource, /title:\s*['"]数据依据['"]/, 'ReplenishmentPlanTab must not restore the old 数据依据 column label')
assert.match(tabSource, /实际历史[\s\S]*item\.observedDays[\s\S]*item\.confidenceLabel[\s\S]*稳定[\s\S]*formatMonthlyStabilityFactor\(item\)/, 'ReplenishmentPlanTab must show monthly stability after observed days and confidence')
assert.match(tabSource, /replenishment-plan-history-row/, 'historical evidence rows must use a dedicated aligned row class')
const historyRowCssBlock = cssSource.match(/\.replenishment-plan-history-row \{[\s\S]*?\}/)?.[0] || ''
assert.match(historyRowCssBlock, /display:\s*grid/, 'historical evidence rows must use grid alignment')
assert.match(historyRowCssBlock, /grid-template-columns:\s*64px\s+minmax\(0,\s*1fr\)/, 'historical evidence labels and values must share fixed aligned columns')
assert.match(tabSource, /历史时间[\s\S]*7 \/ 30 \/ 30-60 \/ 60-90天/, 'ReplenishmentPlanTab must use a compact historical window label')
assert.match(tabSource, /校正历史[\s\S]*formatAdjustedHistoryBuckets\(item\)/, 'ReplenishmentPlanTab must show adjusted history as recent and segmented buckets')
assert.doesNotMatch(tabSource, /补全历史/, 'ReplenishmentPlanTab must not call calendar-adjusted history 补全历史')
assert.match(tabSource, /原始历史[\s\S]*formatRawHistoryBuckets\(item\)/, 'ReplenishmentPlanTab must keep raw history as recent and segmented comparison evidence')
assert.match(tabSource, /function formatWholeQuantity[\s\S]*Math\.round/, 'ReplenishmentPlanTab must round imputed history evidence to integer units')
assert.match(tabSource, /function formatAdjustedHistoryBuckets[\s\S]*historyBuckets\([\s\S]*adjustedHistoryUnits7[\s\S]*adjustedHistoryUnits30[\s\S]*adjustedHistoryUnits60[\s\S]*adjustedHistoryUnits90/, 'adjusted history buckets must derive from 7/30/60/90 adjusted histories')
assert.match(tabSource, /function formatRawHistoryBuckets[\s\S]*historyBuckets\([\s\S]*historyUnits7[\s\S]*historyUnits30[\s\S]*historyUnits60[\s\S]*historyUnits90/, 'raw history buckets must derive from 7/30/60/90 raw histories')
assert.match(tabSource, /function historyBuckets[\s\S]*history60 - history30[\s\S]*history90 - history60/, 'history buckets must split 30-60 and 60-90 instead of showing cumulative 60/90')
assert.doesNotMatch(tabSource, /formatWholeQuantity\(item\.adjustedHistoryUnits60\)[\s\S]*formatWholeQuantity\(item\.adjustedHistoryUnits90\)/, 'adjusted history display must not show cumulative 60/90 quantities')
assert.doesNotMatch(tabSource, /月稳定/, 'monthly stability must not take a separate historical evidence row')
assert.doesNotMatch(tabSource, /近3月/, 'monthly stability buckets must not be displayed as a separate row')
assert.doesNotMatch(tabSource, /formatMonthlySalesBuckets/, 'monthly stability buckets must not keep a display formatter when the row is hidden')
assert.match(tabSource, /function monthlySalesBuckets[\s\S]*adjustedHistoryUnits30[\s\S]*adjustedHistoryUnits60[\s\S]*adjustedHistoryUnits90/, 'monthly stability must derive from the latest three 30-day adjusted sales windows')
assert.match(tabSource, /function monthlyStabilityFactor[\s\S]*Math\.sqrt[\s\S]*average/, 'monthly stability factor must measure variance against the three-month average')
assert.match(tabSource, /function formatMonthlyStabilityFactor[\s\S]*factor\.toFixed\(2\)/, 'monthly stability factor must be displayed as a decimal such as 0.49')
assert.doesNotMatch(tabSource, /\$\{factor\}%/, 'monthly stability factor must not be displayed as a percentage')
assert.match(tabSource, /Math\.min\(1[\s\S]*1 - coefficientOfVariation/, 'monthly stability factor must be normalized to a 0-1 decimal')
assert.doesNotMatch(tabSource, /\*\s*100/, 'monthly stability factor must not multiply the normalized value into a percentage')
const historyWindowLabelIndex = tabSource.indexOf('7 / 30 / 30-60 / 60-90天')
const historyQuantityLabelIndex = tabSource.indexOf('formatRawHistoryBuckets(item)')
assert.ok(historyQuantityLabelIndex >= 0, 'ReplenishmentPlanTab must show historical sales quantities with 件')
assert.ok(
  historyWindowLabelIndex >= 0 && historyWindowLabelIndex < historyQuantityLabelIndex,
  'historical sales window label must render before quantity label'
)
assert.match(tabSource, /replenishment-plan-window-mode[\s\S]*空运[\s\S]*replenishment-plan-window-days[\s\S]*item\.airWindowStartDay[\s\S]*item\.airWindowEndDay[\s\S]*replenishment-plan-window-value[\s\S]*item\.airWindowForecastUnits/, 'air forecast window must split mode, days, and value into aligned cells')
assert.match(tabSource, /replenishment-plan-window-mode[\s\S]*海运[\s\S]*replenishment-plan-window-days[\s\S]*item\.seaWindowStartDay[\s\S]*item\.seaWindowEndDay[\s\S]*replenishment-plan-window-value[\s\S]*item\.seaWindowForecastUnits/, 'sea forecast window must split mode, days, and value into aligned cells')
assert.doesNotMatch(tabSource, /空运\s*\{item\.airWindowStartDay\}-\{item\.airWindowEndDay\}\s*天\s*预测/, 'air forecast window must not be rendered as one natural text sentence')
const forecastWindowCssBlock = cssSource.match(/\.replenishment-plan-window-line \{[\s\S]*?\}/)?.[0] || ''
assert.match(forecastWindowCssBlock, /display:\s*grid/, 'forecast window rows must use grid alignment')
assert.match(forecastWindowCssBlock, /grid-template-columns:\s*32px\s+84px\s+32px\s+max-content/, 'forecast window rows must align mode, days, label, and value columns')
assert.match(tabSource, /airWindowForecastUnits/, 'ReplenishmentPlanTab must show backend-provided air-window forecast units')
assert.match(tabSource, /seaWindowForecastUnits/, 'ReplenishmentPlanTab must show backend-provided sea-window forecast units')
assert.match(tabSource, /const label = isAir \? ['"]空运['"] : ['"]海运['"][\s\S]*const calculatedUnits = isAir \? item\.airCalculatedUnits : item\.seaCalculatedUnits[\s\S]*const suggestedUnits = isAir \? item\.airSuggestedUnits : item\.seaSuggestedUnits[\s\S]*计算 \{formatQuantity\(calculatedUnits\)\} \/ 建议 \{formatQuantity\(suggestedUnits\)\}/, 'ReplenishmentPlanTab must show both raw calculation and final suggestion for air and sea')
assert.doesNotMatch(tabSource, /预测销量/, 'ReplenishmentPlanTab must use concise 预测 wording for replenishment window forecasts')
assert.match(tabSource, /firstStockoutDay[\s\S]*第 \{item\.firstStockoutDay\} 天缺货/, 'ReplenishmentPlanTab must show stockout day in forecast evidence')
assert.match(tabSource, /etaReviewRequired/, 'ReplenishmentPlanTab must highlight recent past ETA batches that need review')
assert.match(tabSource, /待判断/, 'ReplenishmentPlanTab must label recent past ETA rows as needing manual judgment')
assert.match(tabSource, /item\.inboundBatches/, 'ReplenishmentPlanTab must render known ETA inbound batch list from API data')
assert.match(tabSource, /item\.missingEtaBatches/, 'ReplenishmentPlanTab must render missing ETA batch list from API data')
assert.match(tabSource, /replenishment-plan-inbound-summary/, 'inbound summary row must use the same aligned column system')
assert.match(tabSource, /renderInboundBatchGroup\(item\.inboundBatches,\s*['"]known['"],\s*planDate\)/, 'known inbound rows must use the page plan date for ETA distance')
assert.match(tabSource, /formatEtaDistanceDays\(etaDate,\s*planDate\)/, 'inbound ETA rows must show distance from today after the date')
assert.match(tabSource, /replenishment-plan-inbound-eta/, 'inbound ETA date should have a dedicated emphasis class')
assert.match(tabSource, /replenishment-plan-inbound-quantity/, 'inbound quantity should have a weak display class')
const inboundBatchCssBlock = cssSource.match(/\.replenishment-plan-inbound-batch \{[\s\S]*?\}/)?.[0] || ''
assert.match(inboundBatchCssBlock, /width:\s*100%/, 'inbound batch rows should fill the cell so columns line up across rows')
assert.match(inboundBatchCssBlock, /grid-template-columns:\s*minmax\(118px,\s*1fr\)\s+44px\s+minmax\(92px,\s*max-content\)/, 'inbound batch rows must align batch reference, quantity, and ETA columns')
assert.match(inboundBatchCssBlock, /column-gap:\s*10px/, 'inbound batch rows should keep consistent column spacing')
const inboundRefCssBlock = cssSource.match(/\.replenishment-plan-inbound-ref \{[\s\S]*?\}/)?.[0] || ''
assert.match(inboundRefCssBlock, /max-width:\s*132px/, 'inbound batch reference should truncate before pushing quantity too far away')
assert.match(inboundRefCssBlock, /color:\s*#6b7280/, 'inbound batch reference should be visually weaker than ETA')
const inboundEtaCssBlock = cssSource.match(/\.replenishment-plan-inbound-eta \{[\s\S]*?\}/)?.[0] || ''
assert.match(inboundEtaCssBlock, /font-weight:\s*600/, 'inbound ETA date should be emphasized')
assert.doesNotMatch(tabSource, /item\.shortReason/, 'ReplenishmentPlanTab must not render the long persisted shortReason in list cells')
assert.match(tabSource, /imageUrl=\{item\.imageUrl\}/, 'ReplenishmentPlanTab must pass product image into the shared product identity component')
assert.match(tabSource, /imageWidth=\{72\}/, 'ReplenishmentPlanTab product image should be large enough for row scanning')
assert.match(tabSource, /replenishment-plan-product-codes/, 'ReplenishmentPlanTab must stack product codes in the product cell')
assert.match(tabSource, /copyable=\{\{ text: item\.partnerSku \}\}>\{item\.partnerSku\}<\/Text>/, 'product cell must show partner SKU value without a PSKU prefix')
assert.match(tabSource, /copyable=\{\{ text: item\.sku \}\}>\{item\.sku\}<\/Text>/, 'product cell must show SKU value without a SKU prefix')
assert.doesNotMatch(tabSource, />PSKU\s*\{item\.partnerSku\}/, 'product cell must not show the PSKU label prefix')
assert.doesNotMatch(tabSource, />SKU\s*\{item\.sku\}/, 'product cell must not show the SKU label prefix')
assert.match(tabSource, /replenishment-plan-product-meta[\s\S]*replenishment-plan-product-codes[\s\S]*replenishment-plan-product-stock/, 'product inventory must render under product codes')
const productCellCssBlock = cssSource.match(/\.replenishment-plan-product-cell \{[\s\S]*?\}/)?.[0] || ''
assert.doesNotMatch(productCellCssBlock, /grid-template-columns/, 'product cell must not reserve a right-side inventory block')
assert.doesNotMatch(tabSource, /showImage=\{false\}/, 'ReplenishmentPlanTab product column must show images like other product lists')
assert.doesNotMatch(tabSource, /Drawer/, 'ReplenishmentPlanTab must keep evidence in the list instead of a details drawer')
assert.doesNotMatch(tabSource, /fetchSalesForecastOverview|sales-data\/analytics|DailySalesFact/, 'ReplenishmentPlanTab must not re-run or fetch sales analytics evidence')

const inboundBatchGroupBlock = tabSource.match(/function renderInboundBatchGroup[\s\S]*?\n\}/)?.[0] || ''
assert.doesNotMatch(inboundBatchGroupBlock, /<Button|维护 ETA/, 'ReplenishmentPlanTab must not keep row-level ETA maintenance buttons')
assert.doesNotMatch(tabSource, /有 ETA 批次|缺 ETA 批次/, 'ReplenishmentPlanTab must not show inbound batch group labels in rows')

assert.match(inTransitBatchListSource, /statusScope/, 'in-transit list must support statusScope query param')
assert.match(inTransitBatchListSource, /skuKeyword/, 'in-transit list must support skuKeyword query param')
