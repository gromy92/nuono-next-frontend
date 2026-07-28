import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'

const purchasePageSource = readFileSync(
  'src/features/purchase-order/PurchaseOrderPage.tsx',
  'utf8'
)
const workspaceSource = readFileSync(
  'src/features/procurement-workspace/ProcurementWorkspace.tsx',
  'utf8'
)
const mountSource = readFileSync(
  'src/features/procurement-workspace/ProcurementWorkspaceMount.tsx',
  'utf8'
)
const routeSource = readFileSync(
  'src/features/route-catalog/procurementRoutes.ts',
  'utf8'
)

assert.doesNotMatch(purchasePageSource, /replenishment-plan/)
assert.doesNotMatch(purchasePageSource, /ReplenishmentPlanTab/)
assert.match(workspaceSource, /key: 'replenishment-plan'/)
assert.match(workspaceSource, /key: 'purchase-orders'/)
assert.ok(
  workspaceSource.indexOf("key: 'replenishment-plan'") <
    workspaceSource.indexOf("key: 'purchase-orders'")
)
assert.match(
  mountSource,
  /isProcurementRequirementConfirmationPath\(currentAppPathname\(\)\)/
)
assert.match(mountSource, /<ProcurementWorkspace session=\{session\}/)
assert.match(
  routeSource,
  /procurement-workspace\/ProcurementWorkspaceMount/
)
