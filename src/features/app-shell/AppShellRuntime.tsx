import { useCallback, useState } from 'react';
import { useProfitCalculatorWorkspace } from '../profit-calculator/useProfitCalculatorWorkspace';
import { useProductManagementWorkspace } from '../product-management/useProductManagementWorkspace';
import type { ProductDetailTabRequest, ProductWorkspaceTabKey } from '../product-management/types';
import { ShellFrame } from './ShellFrame';
import { useStoreSyncController } from './useStoreSyncController';
import { useShellWorkspaceNavigation } from './useShellWorkspaceNavigation';
import { useShellAccountController } from './useShellAccountController';
import { useShellSessionEffects, useShellSessionState } from './useShellSessionState';
import { isProductWorkspaceMenu } from './WorkspaceMenuRegistry';

export function AppShellRuntime() {
  const {
    activeMenuKey,
    setActiveMenuKey,
    setCurrentPathname,
    session,
    setSession,
    sessionAllowedMenuKeys,
    sessionAllowedMenuKeySet,
    shellSession,
    shouldRenderProcurementRequirementConfirmation,
    syncWorkspacePathForMenuKey,
    usingProcurementRequirementDemoSession,
    visibleWorkspaceMenuItems
  } = useShellSessionState();
  const [productDetailTabRequest, setProductDetailTabRequest] = useState<ProductDetailTabRequest | null>(null);
  const [activeProductWorkspaceTabKey, setActiveProductWorkspaceTabKey] =
    useState<ProductWorkspaceTabKey>('product-manage');
  const {
    activeOwnerId,
    canManageStoreBinding,
    canSelectStoreOwner,
    loadStoreSync,
    notifyRoleManagementDataChanged,
    resetStoreSync,
    roleManagementRefreshSignal,
    setStoreSyncOwnerId,
    storeSyncOwnerId,
    storeSyncState
  } = useStoreSyncController(session, shellSession);

  const openProfitWorkspace = useCallback(() => {
    setActiveMenuKey('purchase-profit');
  }, []);

  const { profitBoard, openProfitCalculatorPrefilled } = useProfitCalculatorWorkspace(openProfitWorkspace, shellSession, {
    enabled: activeMenuKey === 'purchase-profit'
  });
  const productWorkspace = useProductManagementWorkspace({
    session,
    enabled: isProductWorkspaceMenu(activeMenuKey),
    activeOwnerId,
    storeSyncState,
    storeSyncOwnerId,
    activeProductWorkspaceTabKey,
    setActiveProductWorkspaceTabKey,
    productDetailTabRequest,
    setProductDetailTabRequest,
    setActiveProductMenu: () => setActiveMenuKey('product-manage'),
    syncProductWorkspacePath: () => syncWorkspacePathForMenuKey('product-manage')
  });

  const {
    setSelectedInitializationStoreCodeOverride,
    productDetailSummarySurface,
    goBackToProductManage,
    requestCloseProductDetailTab,
    resetProductWorkspace
  } = productWorkspace;

  const {
    changePasswordForm,
    changePasswordOpen,
    changePasswordSubmitting,
    handleRoleViewChange,
    handleSessionStoreChange,
    handleUserDropdownClick,
    loginError,
    loginForm,
    loginSubmitting,
    logout,
    logoutConfirmOpen,
    setChangePasswordOpen,
    setLoginError,
    setLogoutConfirmOpen,
    submitChangePassword,
    submitLogin,
    userDropdownItems
  } = useShellAccountController({
    activeMenuKey,
    resetProductWorkspace,
    resetStoreSync,
    session,
    setActiveMenuKey,
    setActiveProductWorkspaceTabKey,
    setSelectedInitializationStoreCodeOverride,
    setSession,
    setStoreSyncOwnerId,
    syncWorkspacePathForMenuKey
  });

  useShellSessionEffects({
    activeMenuKey,
    resetStoreSync,
    session,
    sessionAllowedMenuKeys,
    sessionAllowedMenuKeySet,
    setActiveMenuKey,
    setChangePasswordOpen,
    setCurrentPathname,
    setLoginError,
    setLogoutConfirmOpen,
    setSession
  });

  const hasProductDetailTab = Boolean(productDetailTabRequest);
  const resolvedProductWorkspaceTabKey: ProductWorkspaceTabKey =
    activeProductWorkspaceTabKey === 'product-detail' && hasProductDetailTab ? 'product-detail' : 'product-manage';
  const isProductDetailTab =
    activeMenuKey === 'product-manage' && resolvedProductWorkspaceTabKey === 'product-detail';

  const {
    activeMenuPathLabel,
    activeSidebarOpenKeys,
    activeSidebarRootKey,
    activeWorkspaceTabKey,
    handleSidebarMenuClick,
    handleWorkspaceTabChange,
    handleWorkspaceTabEdit,
    setSidebarOpenKeys,
    setUserRoleActiveTabKey,
    shouldRenderWorkspaceTabs,
    sidebarOpenKeys,
    userRoleActiveTabKey,
    workspaceTabItems
  } = useShellWorkspaceNavigation({
    activeMenuKey,
    goBackToProductManage,
    hasProductDetailTab,
    productDetailSummarySurface,
    productDetailTabRequest,
    requestCloseProductDetailTab,
    resolvedProductWorkspaceTabKey,
    sessionAllowedMenuKeySet,
    setActiveMenuKey,
    setActiveProductWorkspaceTabKey,
    shouldRenderProcurementRequirementConfirmation,
    syncWorkspacePathForMenuKey,
    visibleWorkspaceMenuItems
  });

  return (
    <ShellFrame
      activeMenuKey={activeMenuKey}
      activeMenuPathLabel={activeMenuPathLabel}
      activeOwnerId={activeOwnerId}
      activeSidebarOpenKeys={activeSidebarOpenKeys}
      activeSidebarRootKey={activeSidebarRootKey}
      activeWorkspaceTabKey={activeWorkspaceTabKey}
      canManageStoreBinding={canManageStoreBinding}
      canSelectStoreOwner={canSelectStoreOwner}
      canShowStoreManagement={sessionAllowedMenuKeySet.has('user-store-noon')}
      changePasswordForm={changePasswordForm}
      changePasswordOpen={changePasswordOpen}
      changePasswordSubmitting={changePasswordSubmitting}
      handleRoleViewChange={handleRoleViewChange}
      handleSessionStoreChange={handleSessionStoreChange}
      handleSidebarMenuClick={handleSidebarMenuClick}
      handleUserDropdownClick={handleUserDropdownClick}
      handleWorkspaceTabChange={handleWorkspaceTabChange}
      handleWorkspaceTabEdit={handleWorkspaceTabEdit}
      isProductDetailTab={isProductDetailTab}
      loadStoreSync={loadStoreSync}
      loginError={loginError}
      loginForm={loginForm}
      loginSubmitting={loginSubmitting}
      logout={logout}
      logoutConfirmOpen={logoutConfirmOpen}
      noMenuPermission={!usingProcurementRequirementDemoSession && !sessionAllowedMenuKeys.length}
      notifyRoleManagementDataChanged={notifyRoleManagementDataChanged}
      onOpenProfitCalculatorPrefilled={openProfitCalculatorPrefilled}
      productWorkspace={productWorkspace}
      profitBoard={profitBoard}
      roleManagementRefreshSignal={roleManagementRefreshSignal}
      setActiveMenuKey={setActiveMenuKey}
      setChangePasswordOpen={setChangePasswordOpen}
      setLoginError={setLoginError}
      setLogoutConfirmOpen={setLogoutConfirmOpen}
      setSidebarOpenKeys={setSidebarOpenKeys}
      setStoreSyncOwnerId={setStoreSyncOwnerId}
      setUserRoleActiveTabKey={setUserRoleActiveTabKey}
      shellSession={shellSession}
      shouldRenderProcurementRequirementConfirmation={shouldRenderProcurementRequirementConfirmation}
      shouldRenderWorkspaceTabs={shouldRenderWorkspaceTabs}
      sidebarOpenKeys={sidebarOpenKeys}
      storeSyncOwnerId={storeSyncOwnerId}
      storeSyncState={storeSyncState}
      submitChangePassword={submitChangePassword}
      submitLogin={submitLogin}
      syncWorkspacePathForMenuKey={syncWorkspacePathForMenuKey}
      userDropdownItems={userDropdownItems}
      userRoleActiveTabKey={userRoleActiveTabKey}
      visibleWorkspaceMenuItems={visibleWorkspaceMenuItems}
      workspaceTabItems={workspaceTabItems}
    />
  );
}

export default AppShellRuntime;
