import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { workspaceMenuDefinition } from '../route-catalog/RouteCatalog'
import {
  procurementWorkspaceSource,
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
  procurementWorkspaceSource,
  /import\s+\{\s*ReplenishmentPlanTab\s*\}\s+from ['"]\.\.\/replenishment-plan\/ReplenishmentPlanTab['"]/,
  'ProcurementWorkspace.tsx must import the replenishment tab from the neutral module'
)
assert.match(
  procurementWorkspaceSource,
  /import\s+\{\s*PurchaseOrderPage\s*\}\s+from ['"]\.\.\/purchase-order\/PurchaseOrderPage['"]/,
  'ProcurementWorkspace.tsx must compose the purchase-order page'
)
assert.match(
  procurementWorkspaceSource,
  /\bTabs\b/,
  'ProcurementWorkspace.tsx must use a top-level Tabs control'
)
assert.doesNotMatch(
  purchaseOrderPageSource,
  /ReplenishmentPlanTab|\bTabs\b/,
  'PurchaseOrderPage.tsx must stay independent from the replenishment workspace shell'
)

const purchaseOrderMenu = workspaceMenuDefinition('purchase-order')
assert.equal(purchaseOrderMenu.label, '补货采购')
assert.equal(purchaseOrderMenu.pathLabel, '采购 / 补货采购')
assert.equal(purchaseOrderMenu.tabLabel, '补货采购')

assert.match(
  procurementWorkspaceSource,
  /PURCHASE_ORDER_TAB_QUERY_KEY/,
  'procurement tabs must be URL-addressable'
)
assert.match(
  procurementWorkspaceSource,
  /key:\s*['"]purchase-orders['"]/,
  'purchase order tab must keep the existing workbench'
)
assert.match(
  procurementWorkspaceSource,
  /key:\s*['"]replenishment-plan['"]/,
  'procurement workspace must expose a replenishment tab key'
)
assert.match(
  procurementWorkspaceSource,
  /label:\s*['"]补货计划['"]/,
  'procurement workspace must label the new tab as 补货计划'
)
assert.match(
  procurementWorkspaceSource,
  /items=\{\[\s*\{\s*key:\s*['"]replenishment-plan['"][\s\S]*?label:\s*['"]补货计划['"][\s\S]*?\},\s*\{\s*key:\s*['"]purchase-orders['"][\s\S]*?label:\s*['"]采购单['"]/,
  'ProcurementWorkspace tabs must show 补货计划 before 采购单'
)
assert.match(
  procurementWorkspaceSource,
  /if \(typeof window === ['"]undefined['"]\) return ['"]replenishment-plan['"]/,
  'ProcurementWorkspace must default to the first replenishment-plan tab'
)
assert.match(
  procurementWorkspaceSource,
  /const requestedTab = new URLSearchParams\(window\.location\.search\)\.get\([\s\S]*?PURCHASE_ORDER_TAB_QUERY_KEY[\s\S]*?return requestedTab === ['"]purchase-orders['"]\s*\?\s*['"]purchase-orders['"]\s*:\s*['"]replenishment-plan['"]/,
  'ProcurementWorkspace must keep 采购单 reachable with tab=purchase-orders and otherwise default to 补货计划'
)
assert.match(
  procurementWorkspaceSource,
  /if \(activeTab === ['"]purchase-orders['"]\) \{\s*params\.set\(PURCHASE_ORDER_TAB_QUERY_KEY,\s*['"]purchase-orders['"]\)[\s\S]*\} else \{\s*params\.delete\(PURCHASE_ORDER_TAB_QUERY_KEY\)/,
  'ProcurementWorkspace URL sync must only write tab=purchase-orders for the non-default tab'
)
assert.match(
  procurementWorkspaceSource,
  /<ReplenishmentPlanTab[\s\S]*session=\{session\}/,
  'procurement workspace must pass the session into ReplenishmentPlanTab'
)
assert.match(
  procurementWorkspaceSource,
  /const \[purchaseOrdersRevision,\s*setPurchaseOrdersRevision\] = useState\(0\)/,
  'procurement workspace must track replenishment-originated purchase-order changes'
)
assert.match(
  procurementWorkspaceSource,
  /const \[replenishmentOrdersRevision,\s*setReplenishmentOrdersRevision\][\s\S]*useState\(0\)/,
  'procurement workspace must track purchase-workbench changes separately'
)
assert.match(
  procurementWorkspaceSource,
  /<ReplenishmentPlanTab[\s\S]*purchaseOrdersRevision=\{replenishmentOrdersRevision\}[\s\S]*onPurchaseOrdersChanged=\{\(\) =>\s*setPurchaseOrdersRevision\(\(current\) => current \+ 1\)/,
  'replenishment mutations must refresh the purchase-order workbench'
)
assert.match(
  procurementWorkspaceSource,
  /<PurchaseOrderPage[\s\S]*purchaseOrdersRevision=\{purchaseOrdersRevision\}[\s\S]*onPurchaseOrdersChanged=\{\(\) =>\s*setReplenishmentOrdersRevision\(\(current\) => current \+ 1\)/,
  'purchase-order mutations must refresh replenishment added status'
)
