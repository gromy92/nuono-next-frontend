import type { ReactNode } from 'react'
import type { WorkspaceContentKind } from '../route-catalog/RouteCatalog'
import { LazyWorkspaceBoundary } from '../route-catalog/workspaceMount'
import { MasterDataBoard, RoleManagementWorkspace } from './ShellWorkspaceLazyComponents'
import type {
  LegacyWorkspaceRenderResult,
  ShellWorkspaceRenderContext
} from './ShellWorkspaceContent.types'

function handled(content: ReactNode): LegacyWorkspaceRenderResult {
  return { handled: true, content }
}

export function renderLegacyAdministrationWorkspace(
  activeContentKind: WorkspaceContentKind,
  context: ShellWorkspaceRenderContext
): LegacyWorkspaceRenderResult {
  const {
    activeOwnerId,
    canManageStoreBinding,
    canSelectStoreOwner,
    canShowStoreManagement,
    onRoleManagementDataChanged,
    onRoleManagementTabChange,
    onStoreOwnerChange,
    onStoreRefresh,
    roleManagementRefreshSignal,
    roleManagementTabKey,
    shellSession,
    storeSyncOwnerId,
    storeSyncState
  } = context

  if (activeContentKind === 'user-account') {
    return handled(
      <LazyWorkspaceBoundary>
        <MasterDataBoard
          mode="user-account"
          operatorUserId={shellSession.userId}
          operatorRoleLevel={shellSession.level}
          operatorStores={shellSession.userStores ?? []}
        />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'user-role') {
    return handled(
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
    )
  }
  if (activeContentKind === 'system-menu' || activeContentKind === 'system-role') {
    return handled(
      <LazyWorkspaceBoundary>
        <MasterDataBoard
          mode={activeContentKind}
          operatorUserId={shellSession.userId}
          operatorRoleLevel={shellSession.level}
          operatorStores={shellSession.userStores ?? []}
        />
      </LazyWorkspaceBoundary>
    )
  }
  return { handled: false }
}
