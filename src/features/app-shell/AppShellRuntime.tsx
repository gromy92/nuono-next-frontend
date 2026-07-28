import { useCallback, useState } from 'react';
import type { InTransitBoxDetailTabRequest } from '../in-transit-goods/types';
import { StoreSyncProvider, useStoreSyncContext } from '../store-sync/StoreSyncContext';
import {
  useWorkspaceOwnedTabsController,
  WorkspaceOwnedTabsProvider
} from '../route-catalog/WorkspaceOwnedTabs';
import { ShellFrame } from './ShellFrame';
import { useShellWorkspaceNavigation } from './useShellWorkspaceNavigation';
import { useShellAccountController } from './useShellAccountController';
import { useShellSessionEffects, useShellSessionState } from './useShellSessionState';

export function AppShellRuntime() {
  const sessionState = useShellSessionState();
  return (
    <StoreSyncProvider
      permissionSession={sessionState.shellSession}
      session={sessionState.session}
    >
      <AppShellRuntimeContent sessionState={sessionState} />
    </StoreSyncProvider>
  );
}

function AppShellRuntimeContent({
  sessionState
}: {
  sessionState: ReturnType<typeof useShellSessionState>;
}) {
  const {
    activeMenuKey,
    setActiveMenuKey,
    setCurrentPathname,
    session,
    setSession,
    sessionAllowedMenuKeys,
    sessionAllowedMenuKeySet,
    shellSession,
    syncWorkspacePathForMenuKey,
    usingProcurementRequirementDemoSession,
    visibleWorkspaceMenuItems
  } = sessionState;
  const [inTransitBoxDetailTabRequest, setInTransitBoxDetailTabRequest] =
    useState<InTransitBoxDetailTabRequest | null>(null);
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
  } = useStoreSyncContext();
  const ownedTabsController = useWorkspaceOwnedTabsController({
    setActiveMenuKey,
    syncWorkspacePathForMenuKey
  });

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
    resetStoreSync,
    session,
    setActiveMenuKey,
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
    openedWorkspaceTabKeys,
    setSidebarOpenKeys,
    setUserRoleActiveTabKey,
    shouldRenderWorkspaceTabs,
    sidebarOpenKeys,
    userRoleActiveTabKey,
    workspaceTabItems
  } = useShellWorkspaceNavigation({
    activeMenuKey,
    hasInTransitBoxDetailTab,
    inTransitBoxDetailTabRequest,
    ownedTabsController,
    requestCloseInTransitBoxDetailTab,
    resolvedInTransitWorkspaceTabKey,
    sessionAllowedMenuKeySet,
    setActiveMenuKey,
    setActiveInTransitWorkspaceTabKey,
    syncWorkspacePathForMenuKey,
    visibleWorkspaceMenuItems
  });

  return (
    <WorkspaceOwnedTabsProvider controller={ownedTabsController}>
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
      inTransitWorkspaceTabKey={resolvedInTransitWorkspaceTabKey}
      loadStoreSync={loadStoreSync}
      loginError={loginError}
      loginForm={loginForm}
      loginSubmitting={loginSubmitting}
      logout={logout}
      logoutConfirmOpen={logoutConfirmOpen}
      noMenuPermission={!usingProcurementRequirementDemoSession && !sessionAllowedMenuKeys.length}
      notifyRoleManagementDataChanged={notifyRoleManagementDataChanged}
      onCloseInTransitBoxDetailTab={requestCloseInTransitBoxDetailTab}
      onOpenInTransitBoxDetailTab={openInTransitBoxDetailTab}
      openedWorkspaceTabKeys={openedWorkspaceTabKeys}
      roleManagementRefreshSignal={roleManagementRefreshSignal}
      setActiveMenuKey={setActiveMenuKey}
      setChangePasswordOpen={setChangePasswordOpen}
      setLoginError={setLoginError}
      setLogoutConfirmOpen={setLogoutConfirmOpen}
      setSidebarOpenKeys={setSidebarOpenKeys}
      setStoreSyncOwnerId={setStoreSyncOwnerId}
      setUserRoleActiveTabKey={setUserRoleActiveTabKey}
      shellSession={shellSession}
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
    </WorkspaceOwnedTabsProvider>
  );
}

export default AppShellRuntime;
