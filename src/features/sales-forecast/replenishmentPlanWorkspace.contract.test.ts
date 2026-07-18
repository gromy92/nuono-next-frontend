import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { workspaceMenuDefinition } from '../route-catalog/RouteCatalog'
import {
  purchaseOrderPageSource,
  replenishmentDir,
  salesForecastPageSource
} from './replenishmentPlanContractSources'

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
const purchaseOrderMenu = workspaceMenuDefinition('purchase-order')
assert.equal(purchaseOrderMenu.label, '补货采购')
assert.equal(purchaseOrderMenu.pathLabel, '采购 / 补货采购')
assert.equal(purchaseOrderMenu.tabLabel, '补货采购')
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
