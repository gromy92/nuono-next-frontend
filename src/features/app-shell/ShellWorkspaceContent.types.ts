import type { ReactNode } from 'react'
import type { AuthSession } from '../auth/session'
import type { RoleManagementWorkspaceTabKey } from '../master-data/RoleManagementWorkspace'
import type { StoreSyncOverviewState } from '../store-sync/types'
import type { AppMenuKey } from './WorkspaceRouting'
import type { LoadStoreSyncOptions } from '../store-sync/useStoreSyncOverviewController'

export type ShellWorkspaceRenderContext = {
  shellSession: AuthSession
  activeOwnerId?: number
  roleManagementTabKey: RoleManagementWorkspaceTabKey
  canShowStoreManagement: boolean
  roleManagementRefreshSignal: number
  storeSyncState: StoreSyncOverviewState
  storeSyncOwnerId?: number
  canSelectStoreOwner: boolean
  canManageStoreBinding: boolean
  onRoleManagementTabChange: (nextKey: RoleManagementWorkspaceTabKey) => void
  onStoreOwnerChange: (ownerId: number) => void
  onStoreRefresh: (ownerId?: number, options?: LoadStoreSyncOptions) => Promise<void> | void
  onRoleManagementDataChanged: (source?: 'store-management') => void
}

export type ShellWorkspaceContentProps = ShellWorkspaceRenderContext & {
  activeMenuKey: AppMenuKey
  noMenuPermission: boolean
  openedWorkspaceTabKeys: AppMenuKey[]
}

export type LegacyWorkspaceRenderResult =
  | { readonly handled: false }
  | { readonly handled: true; readonly content: ReactNode }
