import { useCallback, useState } from 'react';
import { useProfitCalculatorWorkspace } from '../profit-calculator/useProfitCalculatorWorkspace';
import { useProductManagementWorkspace } from '../product-management/useProductManagementWorkspace';
import type { ProductDetailTabRequest, ProductWorkspaceTabKey } from '../product-management/types';
import type { InTransitBoxDetailTabRequest } from '../in-transit-goods/types';
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
  const [inTransitBoxDetailTabRequest, setInTransitBoxDetailTabRequest] =
    useState<InTransitBoxDetailTabRequest | null>(null);
  const [activeProductWorkspaceTabKey, setActiveProductWorkspaceTabKey] =
    useState<ProductWorkspaceTabKey>('product-manage');
  const [activeInTransitWorkspaceTabKey, setActiveInTransitWorkspaceTabKey] =
    useState<'purchase-in-transit-goods' | 'in-transit-box-detail'>('purchase-in-transit-goods');
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
    loginCodeCooldownSeconds,
    loginCodeRequesting,
    loginError,
    loginForm,
    loginSubmitting,
    logout,
    logoutConfirmOpen,
    requestLoginCode,
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
  const hasInTransitBoxDetailTab = Boolean(inTransitBoxDetailTabRequest);
  const resolvedInTransitWorkspaceTabKey =
    activeInTransitWorkspaceTabKey === 'in-transit-box-detail' && hasInTransitBoxDetailTab
      ? 'in-transit-box-detail'
      : 'purchase-in-transit-goods';
  const isInTransitBoxDetailTab =
    activeMenuKey === 'purchase-in-transit-goods' && resolvedInTransitWorkspaceTabKey === 'in-transit-box-detail';

  const openInTransitBoxDetailTab = useCallback(
    (request: InTransitBoxDetailTabRequest) => {
      setInTransitBoxDetailTabRequest(request);
      setActiveMenuKey('purchase-in-transit-goods');
      setActiveInTransitWorkspaceTabKey('in-transit-box-detail');
      syncWorkspacePathForMenuKey('purchase-in-transit-goods');
    },
    [setActiveMenuKey, syncWorkspacePathForMenuKey]
  );

  const requestCloseInTransitBoxDetailTab = useCallback(() => {
    setInTransitBoxDetailTabRequest(null);
    setActiveInTransitWorkspaceTabKey('purchase-in-transit-goods');
    if (activeMenuKey === 'purchase-in-transit-goods') {
      syncWorkspacePathForMenuKey('purchase-in-transit-goods');
    }
  }, [activeMenuKey, syncWorkspacePathForMenuKey]);

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
    hasInTransitBoxDetailTab,
    inTransitBoxDetailTabRequest,
    productDetailSummarySurface,
    productDetailTabRequest,
    requestCloseInTransitBoxDetailTab,
    requestCloseProductDetailTab,
    resolvedInTransitWorkspaceTabKey,
    resolvedProductWorkspaceTabKey,
    sessionAllowedMenuKeySet,
    setActiveMenuKey,
    setActiveInTransitWorkspaceTabKey,
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
      inTransitBoxDetailTabRequest={inTransitBoxDetailTabRequest}
      isInTransitBoxDetailTab={isInTransitBoxDetailTab}
      isProductDetailTab={isProductDetailTab}
      loadStoreSync={loadStoreSync}
      loginCodeCooldownSeconds={loginCodeCooldownSeconds}
      loginCodeRequesting={loginCodeRequesting}
      loginError={loginError}
      loginForm={loginForm}
      loginSubmitting={loginSubmitting}
      logout={logout}
      logoutConfirmOpen={logoutConfirmOpen}
      noMenuPermission={!usingProcurementRequirementDemoSession && !sessionAllowedMenuKeys.length}
      notifyRoleManagementDataChanged={notifyRoleManagementDataChanged}
      onCloseInTransitBoxDetailTab={requestCloseInTransitBoxDetailTab}
      onOpenInTransitBoxDetailTab={openInTransitBoxDetailTab}
      onOpenProfitCalculatorPrefilled={openProfitCalculatorPrefilled}
      productWorkspace={productWorkspace}
      profitBoard={profitBoard}
      roleManagementRefreshSignal={roleManagementRefreshSignal}
      requestLoginCode={requestLoginCode}
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
