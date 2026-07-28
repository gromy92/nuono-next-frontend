import type { ReactNode } from 'react'
import type { AuthSession } from '../auth/session'
import type { InTransitBoxDetailTabRequest } from '../in-transit-goods/types'
import type { RoleManagementWorkspaceTabKey } from '../master-data/RoleManagementWorkspace'
import type { StoreSyncOverviewState } from '../store-sync/types'
import type { AppMenuKey } from './WorkspaceRouting'
import type { LoadStoreSyncOptions } from '../store-sync/useStoreSyncOverviewController'

export type ShellWorkspaceRenderContext = {
  shellSession: AuthSession
  onOpenInTransitBoxDetailTab: (request: InTransitBoxDetailTabRequest) => void
  onCloseInTransitBoxDetailTab: () => Promise<void> | void
  activeOwnerId?: number
  inTransitBoxDetailTabRequest: InTransitBoxDetailTabRequest | null
  isInTransitBoxDetailTab: boolean
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
  inTransitWorkspaceTabKey: 'purchase-in-transit-goods' | 'in-transit-box-detail'
}

export type LegacyWorkspaceRenderResult =
  | { readonly handled: false }
  | { readonly handled: true; readonly content: ReactNode }
