import type { ReactNode } from 'react'
import type { WorkspaceContentKind } from '../route-catalog/RouteCatalog'
import { LazyWorkspaceBoundary } from '../route-catalog/workspaceMount'
import {
  InTransitGoodsPage,
  ProcurementRequirementConfirmationPage,
  ProductGroupManagementPage,
  ProductManagementWorkspacePage,
  ProductSpecsPage,
  PurchaseOrderPage
} from './ShellWorkspaceLazyComponents'
import type {
  LegacyWorkspaceRenderResult,
  ShellWorkspaceRenderContext
} from './ShellWorkspaceContent.types'

function handled(content: ReactNode): LegacyWorkspaceRenderResult {
  return { handled: true, content }
}

export function renderLegacyCommerceWorkspace(
  activeContentKind: WorkspaceContentKind,
  context: ShellWorkspaceRenderContext
): LegacyWorkspaceRenderResult {
  const {
    activeOwnerId,
    inTransitBoxDetailTabRequest,
    isInTransitBoxDetailTab,
    isProductDetailTab,
    onCloseInTransitBoxDetailTab,
    onOpenInTransitBoxDetailTab,
    productWorkspace,
    profitBoard,
    shellSession,
    shouldRenderProcurementRequirementConfirmation
  } = context

  if (activeContentKind === 'purchase-order') {
    return handled(
      <LazyWorkspaceBoundary>
        {shouldRenderProcurementRequirementConfirmation ? (
          <ProcurementRequirementConfirmationPage embedded session={shellSession} />
        ) : (
          <PurchaseOrderPage session={shellSession} />
        )}
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'product-groups') {
    return handled(
      <LazyWorkspaceBoundary>
        <ProductGroupManagementPage workspace={productWorkspace} activeOwnerId={activeOwnerId} />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'product-specs') {
    return handled(
      <LazyWorkspaceBoundary>
        <ProductSpecsPage session={shellSession} activeOwnerId={activeOwnerId} />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'purchase-in-transit-goods') {
    return handled(
      <LazyWorkspaceBoundary>
        <InTransitGoodsPage
          boxDetailRequest={inTransitBoxDetailTabRequest}
          isBoxDetailTab={isInTransitBoxDetailTab}
          onCloseBoxDetailTab={onCloseInTransitBoxDetailTab}
          onOpenBoxDetailTab={onOpenInTransitBoxDetailTab}
        />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'purchase-profit') {
    return handled(profitBoard)
  }
  if (activeContentKind === 'product-management') {
    return handled(
      <LazyWorkspaceBoundary>
        <ProductManagementWorkspacePage
          workspace={productWorkspace}
          activeOwnerId={activeOwnerId}
          isProductDetailTab={isProductDetailTab}
        />
      </LazyWorkspaceBoundary>
    )
  }
  return { handled: false }
}
