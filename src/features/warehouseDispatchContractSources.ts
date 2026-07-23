import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const featuresDir = dirname(fileURLToPath(import.meta.url));

function source(path: string) {
  return readFileSync(join(featuresDir, path), 'utf8');
}

export const dispatchContractSources = {
  menu: source('route-catalog/fulfillmentRoutes.ts'),
  shippingOrderPage: source('warehouse-shipping-order/WarehouseShippingOrderPage.tsx'),
  workbench: source('warehouse-dispatch/WarehouseDispatchWorkbenchPage.tsx'),
  models: source('warehouse-dispatch/workbenchModels.ts'),
  receiptPanel: source('warehouse-dispatch/WarehouseReceiptPanel.tsx'),
  receiptDomain: source('warehouse-dispatch/receiptDomain.ts'),
  readyPanel: source('warehouse-dispatch/WarehouseReadyPanel.tsx'),
  readyCells: source('warehouse-dispatch/WarehouseReadyCells.tsx'),
  readyWorkspace: source('warehouse-dispatch/useReadyWorkspace.ts'),
  planPanel: source('warehouse-dispatch/WarehouseDispatchPlanPanel.tsx'),
  planDetail: source('warehouse-dispatch/WarehouseDispatchPlanDetail.tsx'),
  planDomain: source('warehouse-dispatch/dispatchPlanDomain.ts'),
  shippingWorkspace: source('warehouse-dispatch/useShippingPlanWorkspace.ts'),
  costDrawer: source('warehouse-dispatch/WarehouseShippingCostDrawer.tsx'),
  costComparison: source('warehouse-dispatch/ShippingOptionComparison.tsx'),
  costBreakdown: source('warehouse-dispatch/ShippingCostBreakdown.tsx'),
  forwarderBreakdown: source('warehouse-dispatch/ShippingForwarderBreakdown.tsx'),
  costDomain: source('warehouse-dispatch/shippingCostDomain.ts'),
  packingPanel: source('warehouse-dispatch/WarehousePackingListPanel.tsx'),
  packingExportModal: source('warehouse-dispatch/WarehousePackingExportModal.tsx'),
  packingExportDomain: source('warehouse-dispatch/packingExportDomain.ts'),
  packingSubmissionDrawer: source('warehouse-dispatch/WarehousePackingSubmissionDrawer.tsx'),
  dispatchApi: [
    source('warehouse-dispatch/api.ts'),
    source('warehouse-dispatch/dispatchApiTypes.ts'),
    source('warehouse-dispatch/shippingApiTypes.ts'),
    source('warehouse-dispatch/dispatchApiMappers.ts'),
    source('warehouse-dispatch/shippingApiMappers.ts')
  ].join('\n'),
  types: [
    source('warehouse-dispatch/types.ts'),
    source('warehouse-dispatch/warehouseCoreTypes.ts'),
    source('warehouse-dispatch/shippingTypes.ts')
  ].join('\n'),
  css: [
    source('warehouse-dispatch/WarehouseDispatchBase.css'),
    source('warehouse-dispatch/WarehouseDispatchReceipt.css'),
    source('warehouse-dispatch/WarehouseDispatchReady.css'),
    source('warehouse-dispatch/WarehouseDispatchPlan.css'),
    source('warehouse-dispatch/WarehouseDispatchCost.css')
  ].join('\n')
};

// Compatibility exports for contracts that predate the workbench split.
export const shippingOrderPage = dispatchContractSources.shippingOrderPage;
export const packingListPanel = dispatchContractSources.packingPanel;
export const dispatchApi = dispatchContractSources.dispatchApi;
export const warehouseTypes = dispatchContractSources.types;
export const dispatchWorkbenchCss = dispatchContractSources.css;
export const dispatchWorkbench = Object.values(dispatchContractSources).join('\n');
export const confirmDispatchTargetSource = dispatchWorkbench;
export const readySourceCellSource = dispatchContractSources.readyCells;
