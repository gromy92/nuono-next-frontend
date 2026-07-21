import type { ReactNode } from 'react'
import type { AuthSession } from '../auth/session'
import type { InTransitBoxDetailTabRequest } from '../in-transit-goods/types'
import type { RoleManagementWorkspaceTabKey } from '../master-data/RoleManagementWorkspace'
import type { ProductWorkspaceTabKey } from '../product-management/types'
import type { useProductManagementWorkspace } from '../product-management/useProductManagementWorkspace'
import type { OpenProfitCalculatorPrefilled } from '../profit-calculator/useProfitCalculatorWorkspace'
import type { StoreSyncOverviewState } from '../store-sync/types'
import type { AppMenuKey } from './WorkspaceRouting'
import type { LoadStoreSyncOptions } from './useStoreSyncController'

type ProductManagementWorkspace = ReturnType<typeof useProductManagementWorkspace>

export type ShellWorkspaceRenderContext = {
  shouldRenderProcurementRequirementConfirmation: boolean
  shellSession: AuthSession
  onOpenProfitCalculatorPrefilled: OpenProfitCalculatorPrefilled
  onOpenInTransitBoxDetailTab: (request: InTransitBoxDetailTabRequest) => void
  onCloseInTransitBoxDetailTab: () => Promise<void> | void
  profitBoard: ReactNode
  productWorkspace: ProductManagementWorkspace
  activeOwnerId?: number
  inTransitBoxDetailTabRequest: InTransitBoxDetailTabRequest | null
  isInTransitBoxDetailTab: boolean
  isProductDetailTab: boolean
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
  productWorkspaceTabKey: ProductWorkspaceTabKey
  inTransitWorkspaceTabKey: 'purchase-in-transit-goods' | 'in-transit-box-detail'
}

export type LegacyWorkspaceRenderResult =
  | { readonly handled: false }
  | { readonly handled: true; readonly content: ReactNode }
