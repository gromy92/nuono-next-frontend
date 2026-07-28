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
    ownedTabsController,
    sessionAllowedMenuKeySet,
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
      loadStoreSync={loadStoreSync}
      loginError={loginError}
      loginForm={loginForm}
      loginSubmitting={loginSubmitting}
      logout={logout}
      logoutConfirmOpen={logoutConfirmOpen}
      noMenuPermission={!usingProcurementRequirementDemoSession && !sessionAllowedMenuKeys.length}
      notifyRoleManagementDataChanged={notifyRoleManagementDataChanged}
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
