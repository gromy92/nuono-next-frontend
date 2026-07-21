import type { ReactNode } from 'react'
import type { WorkspaceContentKind } from '../route-catalog/RouteCatalog'
import { LazyWorkspaceBoundary } from '../route-catalog/workspaceMount'
import {
  Ali1688CollectionPage,
  Ali1688HistoricalOrdersPage,
  Ali1688SkuPurchaseHistoryPage,
  ImageMatchPage,
  InTransitGoodsPage,
  LogisticsQuoteBoard,
  ManualSelectionPage,
  OfficialWarehouseWorkbenchPage,
  ProcurementRequirementConfirmationPage,
  ProductGroupManagementPage,
  ProductImageProfilePage,
  ProductListingPage,
  ProductLogisticsCostsPage,
  ProductManagementWorkspacePage,
  ProductSpecsPage,
  PurchaseOrderPage,
  WarehouseDispatchWorkbenchPage,
  WarehouseLogisticsBillPage,
  WarehouseShippingOrderPage
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
  if (activeContentKind === 'product-image-profile') {
    return handled(
      <LazyWorkspaceBoundary>
        <ProductImageProfilePage session={shellSession} />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'product-image-match') {
    return handled(
      <LazyWorkspaceBoundary>
        <ImageMatchPage />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'product-manual-selection') {
    return handled(
      <LazyWorkspaceBoundary>
        <ManualSelectionPage
          storeName={shellSession.currentStore?.projectName || shellSession.currentStore?.projectCode || 'xingyao'}
          storeCode={shellSession.currentStore?.storeCode}
          operatorName={shellSession.realName || shellSession.accountNo}
        />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'purchase-ali1688-collection') {
    return handled(
      <LazyWorkspaceBoundary>
        <Ali1688CollectionPage
          storeName={shellSession.currentStore?.projectName || shellSession.currentStore?.projectCode || 'xingyao'}
          storeCode={shellSession.currentStore?.storeCode}
          operatorName={shellSession.realName || shellSession.accountNo}
        />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'purchase-ali1688-historical-orders') {
    return handled(
      <LazyWorkspaceBoundary>
        <Ali1688HistoricalOrdersPage
          storeName={shellSession.currentStore?.projectName || shellSession.currentStore?.projectCode}
          storeCode={shellSession.currentStore?.projectCode || shellSession.currentStore?.storeCode}
          siteCode={shellSession.currentStore?.site}
          ownerUserId={shellSession.defaultOwnerUserId ?? shellSession.userId}
          operatorRoleName={shellSession.roleName}
          availableStores={shellSession.userStores}
        />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'purchase-ali1688-sku-purchase-history') {
    return handled(
      <LazyWorkspaceBoundary>
        <Ali1688SkuPurchaseHistoryPage
          storeCode={shellSession.currentStore?.projectCode || shellSession.currentStore?.storeCode}
          siteCode={shellSession.currentStore?.site}
          availableStores={shellSession.userStores}
        />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'product-listing') {
    return handled(
      <LazyWorkspaceBoundary>
        <ProductListingPage storeCode={shellSession.currentStore?.storeCode} />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'purchase-logistics-quote') {
    return handled(
      <LazyWorkspaceBoundary>
        <LogisticsQuoteBoard />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'purchase-product-logistics-costs') {
    return handled(
      <LazyWorkspaceBoundary>
        <ProductLogisticsCostsPage session={shellSession} />
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
  if (activeContentKind === 'warehouse-shipping-order') {
    return handled(
      <LazyWorkspaceBoundary>
        <WarehouseShippingOrderPage session={shellSession} />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'warehouse-logistics-bill') {
    return handled(
      <LazyWorkspaceBoundary>
        <WarehouseLogisticsBillPage session={shellSession} />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'warehouse-dispatch') {
    return handled(
      <LazyWorkspaceBoundary>
        <WarehouseDispatchWorkbenchPage session={shellSession} />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'official-warehouse') {
    return handled(
      <LazyWorkspaceBoundary>
        <OfficialWarehouseWorkbenchPage session={shellSession} />
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
