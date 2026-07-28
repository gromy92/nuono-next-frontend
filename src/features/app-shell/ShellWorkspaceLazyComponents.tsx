import { lazyWorkspace } from '../route-catalog/workspaceMount';
export const InTransitGoodsPage = lazyWorkspace(() =>
  import('../in-transit-goods/InTransitGoodsPage').then((module) => ({ default: module.InTransitGoodsPage }))
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
export const PurchaseOrderPage = lazyWorkspace(() =>
  import('../purchase-order/PurchaseOrderPage').then((module) => ({
    default: module.PurchaseOrderPage
  }))
);
export const ProcurementRequirementConfirmationPage = lazyWorkspace(() =>
  import('../procurement-confirmation/ProcurementRequirementConfirmationPage').then((module) => ({
    default: module.ProcurementRequirementConfirmationPage
  }))
);
