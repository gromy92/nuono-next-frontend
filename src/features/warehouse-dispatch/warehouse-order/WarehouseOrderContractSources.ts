import { readFileSync } from 'node:fs';

function source(file: string) {
  return readFileSync(new URL(file, import.meta.url), 'utf8');
}

export const contractSources = {
  page: source('./WarehouseOrderPanel.tsx'),
  list: source('./WarehouseShippingOrderList.tsx'),
  lineTable: source('./WarehouseShippingOrderLineTable.tsx'),
  detailToolbar: source('./WarehouseShippingOrderDetailToolbar.tsx'),
  sharedViews: source('./WarehouseShippingOrderSharedViews.tsx'),
  publishedPriceCard: source('./WarehouseShippingOrderPublishedPriceCard.tsx'),
  bulkModal: source('./WarehouseShippingOrderBulkQuoteModal.tsx'),
  reassignModal: source('./WarehouseShippingOrderReassignModal.tsx'),
  exportModal: source('./WarehouseShippingQuoteExportModal.tsx'),
  quoteState: source('./useShippingOrderQuoteState.ts'),
  scopedOptions: source('./useShippingOrderScopedOptions.ts'),
  quoteActions: source('./useShippingOrderQuoteActions.ts'),
  orderData: source('./useWarehouseShippingOrderData.ts'),
  interactionController: source('./useShippingOrderInteractionController.ts'),
  interactionScope: source('./shippingOrderInteractionScope.ts'),
  eligibilityApi: source('./warehouseShippingOrderRequests.ts'),
  eligibilityDomain: source('./warehouseForwarderEligibilityDomain.ts'),
  quoteTransfer: source('./useShippingOrderQuoteTransfer.tsx'),
  submit: source('./useShippingOrderSubmit.ts'),
  orderDomain: source('./warehouseShippingOrderDomain.ts'),
  quoteDomain: source('./warehouseShippingQuoteDomain.ts'),
  baseCss: source('./WarehouseShippingOrderBase.css'),
  detailCss: source('./WarehouseShippingOrderDetail.css'),
  lineTableCss: source('./WarehouseShippingOrderLineTable.css'),
  quoteCss: source('./WarehouseShippingOrderQuote.css'),
  warehouseOrderApi: source('./warehouseShippingOrderRequests.ts')
};
