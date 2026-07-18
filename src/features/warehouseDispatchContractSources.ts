import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const featuresDir = dirname(fileURLToPath(import.meta.url))
export const shippingOrderPage = readFileSync(
  join(featuresDir, 'warehouse-shipping-order/WarehouseShippingOrderPage.tsx'),
  'utf8'
)
export const packingListPanel = readFileSync(
  join(featuresDir, 'warehouse-dispatch/WarehousePackingListPanel.tsx'),
  'utf8'
)
export const dispatchWorkbench = readFileSync(
  join(featuresDir, 'warehouse-dispatch/WarehouseDispatchWorkbenchPage.tsx'),
  'utf8'
)
export const dispatchWorkbenchCss = readFileSync(
  join(featuresDir, 'warehouse-dispatch/WarehouseDispatchWorkbenchPage.css'),
  'utf8'
)
export const dispatchApi = readFileSync(
  join(featuresDir, 'warehouse-dispatch/api.ts'),
  'utf8'
)
export const warehouseTypes = readFileSync(
  join(featuresDir, 'warehouse-dispatch/types.ts'),
  'utf8'
)
export const confirmDispatchTargetSource = dispatchWorkbench.slice(
  dispatchWorkbench.indexOf('async function confirmDispatchTargetOverride'),
  dispatchWorkbench.indexOf('async function openLogisticsPlanModal')
)
export const readySourceCellSource = dispatchWorkbench.slice(
  dispatchWorkbench.indexOf('function renderReadySourceCell'),
  dispatchWorkbench.indexOf('function renderReadyQuoteCell')
)
