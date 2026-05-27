import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Alert, Card, Spin } from 'antd';
import type { AuthSession } from '../auth/session';
import type { RoleManagementWorkspaceTabKey } from '../master-data/RoleManagementWorkspace';
import type { useProductManagementWorkspace } from '../product-management/useProductManagementWorkspace';
import type { OpenProfitCalculatorPrefilled } from '../profit-calculator/useProfitCalculatorWorkspace';
import type { StoreSyncOverviewState } from '../store-sync/types';
import type { AppMenuKey } from './WorkspaceRouting';
import { workspaceMenuContentKind } from './WorkspaceMenuRegistry';

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

const AiFileParseBoard = lazyWorkspace(() =>
  import('../ai-file-parse/AiFileParseBoard').then((module) => ({ default: module.AiFileParseBoard }))
);
const LogisticsQuoteBoard = lazyWorkspace(() =>
  import('../logistics-quote/LogisticsQuoteBoard').then((module) => ({ default: module.LogisticsQuoteBoard }))
);
const ManualSelectionPage = lazyWorkspace(() =>
  import('../manual-selection/ManualSelectionPage').then((module) => ({ default: module.ManualSelectionPage }))
);
const Ali1688CollectionPage = lazyWorkspace(() =>
  import('../ali1688-collection/Ali1688CollectionPage').then((module) => ({
    default: module.Ali1688CollectionPage
  }))
);
const MasterDataBoard = lazyWorkspace(() =>
  import('../master-data/MasterDataBoard').then((module) => ({ default: module.MasterDataBoard }))
);
const RoleManagementWorkspace = lazyWorkspace(() =>
  import('../master-data/RoleManagementWorkspace').then((module) => ({ default: module.RoleManagementWorkspace }))
);
const ProductManagementWorkspacePage = lazyWorkspace(() =>
  import('../product-management/ProductManagementWorkspacePage').then((module) => ({
    default: module.ProductManagementWorkspacePage
  }))
);
const ProductGroupManagementPage = lazyWorkspace(() =>
  import('../product-management/groups/ProductGroupManagementPage').then((module) => ({
    default: module.ProductGroupManagementPage
  }))
);
const ProcurementWorkspace = lazyWorkspace(() =>
  import('../procurement/ProcurementWorkspace').then((module) => ({ default: module.ProcurementWorkspace }))
);
const ProcurementRequirementConfirmationPage = lazyWorkspace(() =>
  import('../procurement-confirmation/ProcurementRequirementConfirmationPage').then((module) => ({
    default: module.ProcurementRequirementConfirmationPage
  }))
);
const NoonCallStoreDataPage = lazyWorkspace(() =>
  import('../system-reports/NoonCallStoreDataPage').then((module) => ({
    default: module.NoonCallStoreDataPage
  }))
);
const NoonDataCompletenessPage = lazyWorkspace(() =>
  import('../system-reports/NoonDataCompletenessPage').then((module) => ({
    default: module.NoonDataCompletenessPage
  }))
);
const NoonDataGapPatrolPage = lazyWorkspace(() =>
  import('../system-reports/NoonDataGapPatrolPage').then((module) => ({
    default: module.NoonDataGapPatrolPage
  }))
);
const SalesAnalyticsPage = lazyWorkspace(() =>
  import('../sales-analytics/SalesAnalyticsPage').then((module) => ({ default: module.SalesAnalyticsPage }))
);
const SalesForecastPage = lazyWorkspace(() =>
  import('../sales-forecast/SalesForecastPage').then((module) => ({ default: module.SalesForecastPage }))
);
const OperationConfigSuiteVersionPage = lazyWorkspace(() =>
  import('../operations-config/OperationConfigSuiteVersionPage').then((module) => ({
    default: module.OperationConfigSuiteVersionPage
  }))
);
const BusinessCalendarVersionLibraryPage = lazyWorkspace(() =>
  import('../operations-config/OperationConfigSuiteVersionPage').then((module) => ({
    default: module.BusinessCalendarVersionLibraryPage
  }))
);
const LifecycleVersionLibraryPage = lazyWorkspace(() =>
  import('../operations-config/OperationConfigSuiteVersionPage').then((module) => ({
    default: module.LifecycleVersionLibraryPage
  }))
);

type ProductManagementWorkspace = ReturnType<typeof useProductManagementWorkspace>;

type ShellWorkspaceContentProps = {
  activeMenuKey: AppMenuKey;
  noMenuPermission: boolean;
  shouldRenderProcurementRequirementConfirmation: boolean;
  shellSession: AuthSession;
  onOpenProfitCalculatorPrefilled: OpenProfitCalculatorPrefilled;
  profitBoard: ReactNode;
  productWorkspace: ProductManagementWorkspace;
  activeOwnerId?: number;
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
  onStoreRefresh: (ownerId?: number, options?: { preserveConnectionFeedback?: boolean }) => Promise<void> | void;
  onRoleManagementDataChanged: (source?: 'store-management') => void;
};

function WorkspaceLoadingFallback() {
  return (
    <Card variant="borderless" style={{ boxShadow: 'none', background: '#ffffff' }}>
      <Spin size="small" />
    </Card>
  );
}

function LazyWorkspaceBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<WorkspaceLoadingFallback />}>{children}</Suspense>;
}

export function ShellWorkspaceContent({
  activeMenuKey,
  noMenuPermission,
  shouldRenderProcurementRequirementConfirmation,
  shellSession,
  onOpenProfitCalculatorPrefilled,
  profitBoard,
  productWorkspace,
  activeOwnerId,
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
          <ProcurementWorkspace
            session={shellSession}
            activeOwnerId={activeOwnerId}
            onOpenProfitCalculatorPrefilled={onOpenProfitCalculatorPrefilled}
          />
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

  if (activeContentKind === 'purchase-logistics-quote') {
    return (
      <LazyWorkspaceBoundary>
        <LogisticsQuoteBoard />
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

  if (activeContentKind === 'sales-forecast') {
    return (
      <LazyWorkspaceBoundary>
        <SalesForecastPage session={shellSession} />
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
