import { readFileSync } from 'node:fs';

function source(file: string) {
  return readFileSync(new URL(file, import.meta.url), 'utf8');
}

export const contractSources = {
  page: source('./WarehouseShippingOrderPage.tsx'),
  list: source('./WarehouseShippingOrderList.tsx'),
  lineTable: source('./WarehouseShippingOrderLineTable.tsx'),
  detailToolbar: source('./WarehouseShippingOrderDetailToolbar.tsx'),
  sharedViews: source('./WarehouseShippingOrderSharedViews.tsx'),
  bulkModal: source('./WarehouseShippingOrderBulkQuoteModal.tsx'),
  quoteState: source('./useShippingOrderQuoteState.ts'),
  quoteActions: source('./useShippingOrderQuoteActions.ts'),
  quoteTransfer: source('./useShippingOrderQuoteTransfer.tsx'),
  submit: source('./useShippingOrderSubmit.ts'),
  orderDomain: source('./warehouseShippingOrderDomain.ts'),
  quoteDomain: source('./warehouseShippingQuoteDomain.ts'),
  baseCss: source('./WarehouseShippingOrderBase.css'),
  detailCss: source('./WarehouseShippingOrderDetail.css'),
  quoteCss: source('./WarehouseShippingOrderQuote.css'),
  purchaseOrderApi: source('../purchase-order/api.ts')
};
