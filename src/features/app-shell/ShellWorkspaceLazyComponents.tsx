import { lazyWorkspace } from '../route-catalog/workspaceMount';
export const LogisticsQuoteBoard = lazyWorkspace(() =>
  import('../logistics-quote/LogisticsQuoteBoard').then((module) => ({ default: module.LogisticsQuoteBoard }))
);
export const ProductLogisticsCostsPage = lazyWorkspace(() =>
  import('../product-logistics-costs/ProductLogisticsCostsPage').then((module) => ({
    default: module.ProductLogisticsCostsPage
  }))
);
export const InTransitGoodsPage = lazyWorkspace(() =>
  import('../in-transit-goods/InTransitGoodsPage').then((module) => ({ default: module.InTransitGoodsPage }))
);
export const ManualSelectionPage = lazyWorkspace(() =>
  import('../manual-selection/ManualSelectionPage').then((module) => ({ default: module.ManualSelectionPage }))
);
export const ProductListingPage = lazyWorkspace(() =>
  import('../product-listing/ProductListingPage').then((module) => ({
    default: module.ProductListingPage
  }))
);
export const Ali1688CollectionPage = lazyWorkspace(() =>
  import('../ali1688-collection/Ali1688CollectionPage').then((module) => ({
    default: module.Ali1688CollectionPage
  }))
);
export const Ali1688HistoricalOrdersPage = lazyWorkspace(() =>
  import('../ali1688-historical-orders/Ali1688HistoricalOrdersPage').then((module) => ({
    default: module.Ali1688HistoricalOrdersPage
  }))
);
export const Ali1688SkuPurchaseHistoryPage = lazyWorkspace(() =>
  import('../ali1688-sku-purchase-history/Ali1688SkuPurchaseHistoryPage').then((module) => ({
    default: module.Ali1688SkuPurchaseHistoryPage
  }))
);
export const MasterDataBoard = lazyWorkspace(() =>
  import('../master-data/MasterDataBoard').then((module) => ({ default: module.MasterDataBoard }))
);
export const RoleManagementWorkspace = lazyWorkspace(() =>
  import('../master-data/RoleManagementWorkspace').then((module) => ({ default: module.RoleManagementWorkspace }))
);
export const ProductManagementWorkspacePage = lazyWorkspace(() =>
  import('../product-management/ProductManagementWorkspacePage').then((module) => ({
    default: module.ProductManagementWorkspacePage
  }))
);
export const ProductGroupManagementPage = lazyWorkspace(() =>
  import('../product-management/groups/ProductGroupManagementPage').then((module) => ({
    default: module.ProductGroupManagementPage
  }))
);
export const ProductSpecsPage = lazyWorkspace(() =>
  import('../product-specs/ProductSpecsPage').then((module) => ({
    default: module.ProductSpecsPage
  }))
);
export const ProductImageProfilePage = lazyWorkspace(() =>
  import('../product-image-profile/ProductImageProfilePage').then((module) => ({
    default: module.ProductImageProfilePage
  }))
);
export const ImageMatchPage = lazyWorkspace(() =>
  import('../image-match/ImageMatchPage').then((module) => ({
    default: module.ImageMatchPage
  }))
);
export const PurchaseOrderPage = lazyWorkspace(() =>
  import('../purchase-order/PurchaseOrderPage').then((module) => ({
    default: module.PurchaseOrderPage
  }))
);
export const WarehouseDispatchWorkbenchPage = lazyWorkspace(() =>
  import('../warehouse-dispatch/WarehouseDispatchWorkbenchPage').then((module) => ({
    default: module.WarehouseDispatchWorkbenchPage
  }))
);
export const WarehouseLogisticsBillPage = lazyWorkspace(() =>
  import('../warehouse-logistics-bill/WarehouseLogisticsBillPage').then((module) => ({
    default: module.WarehouseLogisticsBillPage
  }))
);
export const OfficialWarehouseWorkbenchPage = lazyWorkspace(() =>
  import('../official-warehouse/OfficialWarehouseWorkbenchPage').then((module) => ({
    default: module.OfficialWarehouseWorkbenchPage
  }))
);
export const ProcurementRequirementConfirmationPage = lazyWorkspace(() =>
  import('../procurement-confirmation/ProcurementRequirementConfirmationPage').then((module) => ({
    default: module.ProcurementRequirementConfirmationPage
  }))
);
