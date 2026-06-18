import type { ReactNode } from 'react';
import { Alert, Card } from 'antd';
import type { AuthSession } from '../auth/session';
import type { InTransitBoxDetailTabRequest } from '../in-transit-goods/types';
import type { RoleManagementWorkspaceTabKey } from '../master-data/RoleManagementWorkspace';
import type { useProductManagementWorkspace } from '../product-management/useProductManagementWorkspace';
import type { OpenProfitCalculatorPrefilled } from '../profit-calculator/useProfitCalculatorWorkspace';
import type { StoreSyncOverviewState } from '../store-sync/types';
import type { AppMenuKey } from './WorkspaceRouting';
import {
  AiFileParseBoard,
  Ali1688CollectionPage,
  Ali1688HistoricalOrdersPage,
  Ali1688SkuPurchaseHistoryPage,
  BusinessCalendarVersionLibraryPage,
  CompetitorAnalysisPage,
  ImageMatchPage,
  InTransitGoodsPage,
  LazyWorkspaceBoundary,
  LifecycleVersionLibraryPage,
  LogisticsQuoteBoard,
  ManualSelectionPage,
  MasterDataBoard,
  NoonCallStoreDataPage,
  NoonDataCompletenessPage,
  NoonDataGapPatrolPage,
  OfficialWarehousePage,
  OperationConfigSuiteVersionPage,
  OrderFinancePage,
  ProcurementRequirementConfirmationPage,
  ProductGroupManagementPage,
  ProductListingPage,
  ProductManagementWorkspacePage,
  ProductSpecsPage,
  PurchaseOrderPage,
  RoleManagementWorkspace,
  SalesAnalyticsPage,
  SalesForecastPage,
  WarehouseDispatchWorkbenchPage
} from './ShellWorkspaceLazyComponents';
import { workspaceMenuContentKind } from './WorkspaceMenuRegistry';
import type { LoadStoreSyncOptions } from './useStoreSyncController';

type ProductManagementWorkspace = ReturnType<typeof useProductManagementWorkspace>;

type ShellWorkspaceContentProps = {
  activeMenuKey: AppMenuKey;
  noMenuPermission: boolean;
  shouldRenderProcurementRequirementConfirmation: boolean;
  shellSession: AuthSession;
  onOpenProfitCalculatorPrefilled: OpenProfitCalculatorPrefilled;
  onOpenInTransitBoxDetailTab: (request: InTransitBoxDetailTabRequest) => void;
  onCloseInTransitBoxDetailTab: () => Promise<void> | void;
  profitBoard: ReactNode;
  productWorkspace: ProductManagementWorkspace;
  activeOwnerId?: number;
  inTransitBoxDetailTabRequest: InTransitBoxDetailTabRequest | null;
  isInTransitBoxDetailTab: boolean;
  isProductDetailTab: boolean;
  roleManagementTabKey: RoleManagementWorkspaceTabKey;
  canShowStoreManagement: boolean;
  roleManagementRefreshSignal: number;
  storeSyncState: StoreSyncOverviewState;
  storeSyncOwnerId?: number;
  canSelectStoreOwner: boolean;
  canManageStoreBinding: boolean;
  onRoleManagementTabChange: (nextKey: RoleManagementWorkspaceTabKey) => void;
  onStoreOwnerChange: (ownerId: number) => void;
  onStoreRefresh: (ownerId?: number, options?: LoadStoreSyncOptions) => Promise<void> | void;
  onRoleManagementDataChanged: (source?: 'store-management') => void;
};

export function ShellWorkspaceContent({
  activeMenuKey,
  noMenuPermission,
  shouldRenderProcurementRequirementConfirmation,
  shellSession,
  onOpenProfitCalculatorPrefilled,
  onOpenInTransitBoxDetailTab,
  onCloseInTransitBoxDetailTab,
  profitBoard,
  productWorkspace,
  activeOwnerId,
  inTransitBoxDetailTabRequest,
  isInTransitBoxDetailTab,
  isProductDetailTab,
  roleManagementTabKey,
  canShowStoreManagement,
  roleManagementRefreshSignal,
  storeSyncState,
  storeSyncOwnerId,
  canSelectStoreOwner,
  canManageStoreBinding,
  onRoleManagementTabChange,
  onStoreOwnerChange,
  onStoreRefresh,
  onRoleManagementDataChanged
}: ShellWorkspaceContentProps) {
  const activeContentKind = workspaceMenuContentKind(activeMenuKey);

  if (noMenuPermission) {
    return (
      <Card variant="borderless" style={{ boxShadow: 'none', background: '#ffffff' }}>
        <Alert
          type="warning"
          showIcon
          message="当前账号未配置菜单权限"
          description="请先在角色管理或菜单维护中给该账号所属角色配置菜单权限；未配置的菜单不会展示在左侧导航。"
        />
      </Card>
    );
  }

  if (activeContentKind === 'purchase-order') {
    return (
      <LazyWorkspaceBoundary>
        {shouldRenderProcurementRequirementConfirmation ? (
          <ProcurementRequirementConfirmationPage embedded session={shellSession} />
        ) : (
          <PurchaseOrderPage session={shellSession} />
        )}
      </LazyWorkspaceBoundary>
    );
  }
  if (activeContentKind === 'product-groups') {
    return (
      <LazyWorkspaceBoundary>
        <ProductGroupManagementPage workspace={productWorkspace} activeOwnerId={activeOwnerId} />
      </LazyWorkspaceBoundary>
    );
  }
  if (activeContentKind === 'product-specs') {
    return (
      <LazyWorkspaceBoundary>
        <ProductSpecsPage session={shellSession} activeOwnerId={activeOwnerId} />
      </LazyWorkspaceBoundary>
    );
  }
  if (activeContentKind === 'product-image-match') {
    return (
      <LazyWorkspaceBoundary>
        <ImageMatchPage />
      </LazyWorkspaceBoundary>
    );
  }
  if (activeContentKind === 'product-manual-selection') {
    return (
      <LazyWorkspaceBoundary>
        <ManualSelectionPage
          storeName={shellSession.currentStore?.projectName || shellSession.currentStore?.projectCode || 'xingyao'}
          storeCode={shellSession.currentStore?.storeCode}
          operatorName={shellSession.realName || shellSession.accountNo}
        />
      </LazyWorkspaceBoundary>
    );
  }
  if (activeContentKind === 'purchase-ali1688-collection') {
    return (
      <LazyWorkspaceBoundary>
        <Ali1688CollectionPage
          storeName={shellSession.currentStore?.projectName || shellSession.currentStore?.projectCode || 'xingyao'}
          storeCode={shellSession.currentStore?.storeCode}
          operatorName={shellSession.realName || shellSession.accountNo}
        />
      </LazyWorkspaceBoundary>
    );
  }
  if (activeContentKind === 'purchase-ali1688-historical-orders') {
    return (
      <LazyWorkspaceBoundary>
        <Ali1688HistoricalOrdersPage
          storeName={shellSession.currentStore?.projectName || shellSession.currentStore?.projectCode}
          storeCode={shellSession.currentStore?.projectCode || shellSession.currentStore?.storeCode}
          siteCode={shellSession.currentStore?.site}
          ownerUserId={shellSession.defaultOwnerUserId ?? shellSession.userId}
          operatorRoleName={shellSession.roleName}
          availableStores={shellSession.userStores}
        />
      </LazyWorkspaceBoundary>
    );
  }
  if (activeContentKind === 'purchase-ali1688-sku-purchase-history') {
    return (
      <LazyWorkspaceBoundary>
        <Ali1688SkuPurchaseHistoryPage
          storeCode={shellSession.currentStore?.projectCode || shellSession.currentStore?.storeCode}
          siteCode={shellSession.currentStore?.site}
          availableStores={shellSession.userStores}
        />
      </LazyWorkspaceBoundary>
    );
  }
  if (activeContentKind === 'product-listing') {
    return (
      <LazyWorkspaceBoundary>
        <ProductListingPage storeCode={shellSession.currentStore?.storeCode} />
      </LazyWorkspaceBoundary>
    );
  }
  if (activeContentKind === 'purchase-logistics-quote') {
    return (
      <LazyWorkspaceBoundary>
        <LogisticsQuoteBoard />
      </LazyWorkspaceBoundary>
    );
  }
  if (activeContentKind === 'purchase-in-transit-goods') {
    return (
      <LazyWorkspaceBoundary>
        <InTransitGoodsPage
          session={shellSession}
          boxDetailRequest={inTransitBoxDetailTabRequest}
          isBoxDetailTab={isInTransitBoxDetailTab}
          onCloseBoxDetailTab={onCloseInTransitBoxDetailTab}
          onOpenBoxDetailTab={onOpenInTransitBoxDetailTab}
        />
      </LazyWorkspaceBoundary>
    );
  }
  if (activeContentKind === 'warehouse-dispatch') {
    return (
      <LazyWorkspaceBoundary>
        <WarehouseDispatchWorkbenchPage session={shellSession} />
      </LazyWorkspaceBoundary>
    );
  }
  if (activeContentKind === 'official-warehouse') {
    return (
      <LazyWorkspaceBoundary>
        <OfficialWarehousePage session={shellSession} />
      </LazyWorkspaceBoundary>
    );
  }
  if (activeContentKind === 'system-file-management') {
    return (
      <LazyWorkspaceBoundary>
        <AiFileParseBoard />
      </LazyWorkspaceBoundary>
    );
  }
  if (activeContentKind === 'noon-call-store-data') {
    return (
      <LazyWorkspaceBoundary>
        <NoonCallStoreDataPage session={shellSession} />
      </LazyWorkspaceBoundary>
    );
  }

  if (activeContentKind === 'system-report-noon-data-completeness') {
    return (
      <LazyWorkspaceBoundary>
        <NoonDataCompletenessPage session={shellSession} />
      </LazyWorkspaceBoundary>
    );
  }

  if (activeContentKind === 'system-report-noon-data-gaps') {
    return (
      <LazyWorkspaceBoundary>
        <NoonDataGapPatrolPage session={shellSession} />
      </LazyWorkspaceBoundary>
    );
  }

  if (activeContentKind === 'sales-analytics') {
    return (
      <LazyWorkspaceBoundary>
        <SalesAnalyticsPage session={shellSession} />
      </LazyWorkspaceBoundary>
    );
  }

  if (activeContentKind === 'order-finance') {
    return (
      <LazyWorkspaceBoundary>
        <OrderFinancePage session={shellSession} />
      </LazyWorkspaceBoundary>
    );
  }

  if (activeContentKind === 'sales-forecast') {
    return (
      <LazyWorkspaceBoundary>
        <SalesForecastPage session={shellSession} />
      </LazyWorkspaceBoundary>
    );
  }

  if (activeContentKind === 'operations-competitor-analysis') {
    return (
      <LazyWorkspaceBoundary>
        <CompetitorAnalysisPage session={shellSession} />
      </LazyWorkspaceBoundary>
    );
  }

  if (activeContentKind === 'operations-business-calendar') {
    return (
      <LazyWorkspaceBoundary>
        <BusinessCalendarVersionLibraryPage session={shellSession} />
      </LazyWorkspaceBoundary>
    );
  }

  if (activeContentKind === 'operations-config-versions') {
    return (
      <LazyWorkspaceBoundary>
        <OperationConfigSuiteVersionPage session={shellSession} />
      </LazyWorkspaceBoundary>
    );
  }

  if (activeContentKind === 'operations-lifecycle-rules') {
    return (
      <LazyWorkspaceBoundary>
        <LifecycleVersionLibraryPage session={shellSession} />
      </LazyWorkspaceBoundary>
    );
  }

  if (activeContentKind === 'purchase-profit') {
    return profitBoard;
  }

  if (activeContentKind === 'user-account') {
    return (
      <LazyWorkspaceBoundary>
        <MasterDataBoard
          mode="user-account"
          operatorUserId={shellSession.userId}
          operatorRoleLevel={shellSession.level}
          operatorStores={shellSession.userStores ?? []}
        />
      </LazyWorkspaceBoundary>
    );
  }

  if (activeContentKind === 'user-role') {
    return (
      <LazyWorkspaceBoundary>
        <RoleManagementWorkspace
          activeKey={roleManagementTabKey}
          operatorUserId={shellSession.userId}
          operatorRoleLevel={shellSession.level}
          operatorStores={shellSession.userStores ?? []}
          canShowStoreManagement={canShowStoreManagement}
          refreshSignal={roleManagementRefreshSignal}
          storeSyncState={storeSyncState}
          activeOwnerId={activeOwnerId}
          selectedOwnerId={storeSyncOwnerId}
          canSelectStoreOwner={canSelectStoreOwner}
          canManageStoreBinding={canManageStoreBinding}
          onOwnerChange={onStoreOwnerChange}
          onStoreRefresh={onStoreRefresh}
          onDataChanged={onRoleManagementDataChanged}
          onActiveKeyChange={onRoleManagementTabChange}
        />
      </LazyWorkspaceBoundary>
    );
  }

  if (activeContentKind === 'system-menu') {
    return (
      <LazyWorkspaceBoundary>
        <MasterDataBoard
          mode="system-menu"
          operatorUserId={shellSession.userId}
          operatorRoleLevel={shellSession.level}
          operatorStores={shellSession.userStores ?? []}
        />
      </LazyWorkspaceBoundary>
    );
  }

  if (activeContentKind === 'system-role') {
    return (
      <LazyWorkspaceBoundary>
        <MasterDataBoard
          mode="system-role"
          operatorUserId={shellSession.userId}
          operatorRoleLevel={shellSession.level}
          operatorStores={shellSession.userStores ?? []}
        />
      </LazyWorkspaceBoundary>
    );
  }

  return (
    <LazyWorkspaceBoundary>
      <ProductManagementWorkspacePage
        workspace={productWorkspace}
        activeOwnerId={activeOwnerId}
        isProductDetailTab={isProductDetailTab}
      />
    </LazyWorkspaceBoundary>
  );
}
