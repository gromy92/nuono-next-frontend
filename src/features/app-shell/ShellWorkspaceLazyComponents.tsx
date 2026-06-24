import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Card, Spin } from 'antd';

const DYNAMIC_IMPORT_RELOAD_KEY = 'nuono:dynamic-import-reload';

function isDynamicImportLoadFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  return message.includes('Failed to fetch dynamically imported module') || message.includes('Importing a module script failed');
}

function lazyWorkspace<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>
) {
  return lazy(() =>
    loader()
      .then((module) => {
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(DYNAMIC_IMPORT_RELOAD_KEY);
        }
        return module;
      })
      .catch((error) => {
        if (
          isDynamicImportLoadFailure(error) &&
          typeof window !== 'undefined' &&
          window.sessionStorage.getItem(DYNAMIC_IMPORT_RELOAD_KEY) !== '1'
        ) {
          window.sessionStorage.setItem(DYNAMIC_IMPORT_RELOAD_KEY, '1');
          window.location.reload();
        }
        throw error;
      })
  );
}

export const AiFileParseBoard = lazyWorkspace(() =>
  import('../ai-file-parse/AiFileParseBoard').then((module) => ({ default: module.AiFileParseBoard }))
);
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
export const ProductListingPage = lazyWorkspace(() =>
  import('../product-listing/ProductListingPage').then((module) => ({
    default: module.ProductListingPage
  }))
);
export const PreOrderProfitPage = lazyWorkspace(() =>
  import('../pre-order-profit/PreOrderProfitPage').then((module) => ({ default: module.PreOrderProfitPage }))
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
export const WarehouseShippingOrderPage = lazyWorkspace(() =>
  import('../warehouse-shipping-order/WarehouseShippingOrderPage').then((module) => ({
    default: module.WarehouseShippingOrderPage
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
export const NoonCallStoreDataPage = lazyWorkspace(() =>
  import('../system-reports/NoonCallStoreDataPage').then((module) => ({
    default: module.NoonCallStoreDataPage
  }))
);
export const NoonDataCompletenessPage = lazyWorkspace(() =>
  import('../system-reports/NoonDataCompletenessPage').then((module) => ({
    default: module.NoonDataCompletenessPage
  }))
);
export const NoonDataGapPatrolPage = lazyWorkspace(() =>
  import('../system-reports/NoonDataGapPatrolPage').then((module) => ({
    default: module.NoonDataGapPatrolPage
  }))
);
export const SalesAnalyticsPage = lazyWorkspace(() =>
  import('../sales-analytics/SalesAnalyticsPage').then((module) => ({ default: module.SalesAnalyticsPage }))
);
export const OrderFinancePage = lazyWorkspace(() =>
  import('../order-finance/OrderFinancePage').then((module) => ({ default: module.OrderFinancePage }))
);
export const SalesForecastPage = lazyWorkspace(() =>
  import('../sales-forecast/SalesForecastPage').then((module) => ({ default: module.SalesForecastPage }))
);
export const CompetitorAnalysisPage = lazyWorkspace(() =>
  import('../competitor-analysis/CompetitorAnalysisPage').then((module) => ({
    default: module.CompetitorAnalysisPage
  }))
);
export const OperationsSkinManagementPage = lazyWorkspace(() =>
  import('../operations-skin-management/OperationsSkinManagementPage').then((module) => ({
    default: module.OperationsSkinManagementPage
  }))
);
export const NoonAdvertisingPage = lazyWorkspace(() =>
  import('../noon-ads/NoonAdvertisingPage').then((module) => ({
    default: module.NoonAdvertisingPage
  }))
);
export const OperationConfigSuiteVersionPage = lazyWorkspace(() =>
  import('../operations-config/OperationConfigSuiteVersionPage').then((module) => ({
    default: module.OperationConfigSuiteVersionPage
  }))
);
export const BusinessCalendarVersionLibraryPage = lazyWorkspace(() =>
  import('../operations-config/OperationConfigSuiteVersionPage').then((module) => ({
    default: module.BusinessCalendarVersionLibraryPage
  }))
);
export const LifecycleVersionLibraryPage = lazyWorkspace(() =>
  import('../operations-config/OperationConfigSuiteVersionPage').then((module) => ({
    default: module.LifecycleVersionLibraryPage
  }))
);

function WorkspaceLoadingFallback() {
  return (
    <Card variant="borderless" style={{ boxShadow: 'none', background: '#ffffff' }}>
      <Spin size="small" />
    </Card>
  );
}

export function LazyWorkspaceBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<WorkspaceLoadingFallback />}>{children}</Suspense>;
}
