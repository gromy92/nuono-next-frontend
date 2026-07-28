import type { ReactNode } from 'react'
import type { WorkspaceContentKind } from '../route-catalog/RouteCatalog'
import { LazyWorkspaceBoundary } from '../route-catalog/workspaceMount'
import { InTransitGoodsPage } from './ShellWorkspaceLazyComponents'
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
    inTransitBoxDetailTabRequest,
    isInTransitBoxDetailTab,
    onCloseInTransitBoxDetailTab,
    onOpenInTransitBoxDetailTab
  } = context

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
  return { handled: false }
}
