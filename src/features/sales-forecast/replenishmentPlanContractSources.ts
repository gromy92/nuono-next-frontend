import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const salesForecastDir = dirname(fileURLToPath(import.meta.url))
export const featuresDir = join(salesForecastDir, '..')
export const replenishmentDir = join(featuresDir, 'replenishment-plan')
export const purchaseOrderDir = join(featuresDir, 'purchase-order')

const salesForecastPagePath = join(salesForecastDir, 'SalesForecastPage.tsx')
export const salesForecastPageSource = existsSync(salesForecastPagePath)
  ? readFileSync(salesForecastPagePath, 'utf8')
  : ''
export const purchaseOrderPageSource = readFileSync(join(purchaseOrderDir, 'PurchaseOrderPage.tsx'), 'utf8')
export const apiSource = readFileSync(join(replenishmentDir, 'api.ts'), 'utf8')
export const typesSource = readFileSync(join(replenishmentDir, 'types.ts'), 'utf8')
export const purchaseProgressSource = readFileSync(join(replenishmentDir, 'purchaseProgress.ts'), 'utf8')
export const purchaseDraftsSource = readFileSync(join(replenishmentDir, 'purchaseDrafts.ts'), 'utf8')
export const purchaseDuplicateNoticeSource = readFileSync(
  join(replenishmentDir, 'purchaseDuplicateNotice.ts'),
  'utf8'
)
export const tabSource = readFileSync(join(replenishmentDir, 'ReplenishmentPlanTab.tsx'), 'utf8')
export const cssSource = readFileSync(join(replenishmentDir, 'ReplenishmentPlanTab.css'), 'utf8')
export const inTransitBatchListSource = readFileSync(
  join(featuresDir, 'in-transit-goods', 'useInTransitBatchList.ts'),
  'utf8'
)
