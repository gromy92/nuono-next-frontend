import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const salesForecastDir = dirname(fileURLToPath(import.meta.url))
export const featuresDir = join(salesForecastDir, '..')
export const replenishmentDir = join(featuresDir, 'replenishment-plan')
export const purchaseOrderDir = join(featuresDir, 'purchase-order')
export const procurementWorkspaceDir = join(featuresDir, 'procurement-workspace')

const salesForecastPagePath = join(salesForecastDir, 'SalesForecastPage.tsx')
export const salesForecastPageSource = existsSync(salesForecastPagePath)
  ? readFileSync(salesForecastPagePath, 'utf8')
  : ''
export const purchaseOrderPageSource = readFileSync(join(purchaseOrderDir, 'PurchaseOrderPage.tsx'), 'utf8')
export const procurementWorkspaceSource = readFileSync(
  join(procurementWorkspaceDir, 'ProcurementWorkspace.tsx'),
  'utf8'
)
export const apiSource = readFileSync(join(replenishmentDir, 'api.ts'), 'utf8')
export const typesSource = readFileSync(join(replenishmentDir, 'types.ts'), 'utf8')
export const purchaseProgressSource = readFileSync(join(replenishmentDir, 'purchaseProgress.ts'), 'utf8')
export const purchaseDraftsSource = readFileSync(join(replenishmentDir, 'purchaseDrafts.ts'), 'utf8')
export const purchaseDuplicateNoticeSource = readFileSync(
  join(replenishmentDir, 'purchaseDuplicateNotice.ts'),
  'utf8'
)
export const tabSource = readFileSync(join(replenishmentDir, 'ReplenishmentPlanTab.tsx'), 'utf8')
export const cssSource = [
  'ReplenishmentPlanTab.css',
  'ReplenishmentPlanTab.styles/01.css',
  'ReplenishmentPlanTab.styles/02.css',
  'ReplenishmentPlanTab.styles/03.css'
].map((fileName) => readFileSync(join(replenishmentDir, fileName), 'utf8')).join('\n')
export const inTransitBatchListSource = readFileSync(
  join(featuresDir, 'in-transit-goods', 'useInTransitBatchList.ts'),
  'utf8'
)
