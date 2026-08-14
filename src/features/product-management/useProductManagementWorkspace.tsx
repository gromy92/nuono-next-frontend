import { useMockProductActions } from './hooks/useMockProductActions';
import { useProductDraftMutations } from './hooks/useProductDraftMutations';
import { useProductListDatasetLoader } from './hooks/useProductListDatasetLoader';
import { useProductListFilters } from './hooks/useProductListFilters';
import { useProductListMutations } from './hooks/useProductListMutations';
import { useProductMediaAndHistoryActions } from './hooks/useProductMediaAndHistoryActions';
import { useProductListOperations } from './hooks/useProductListOperations';
import { useProductListSource } from './hooks/useProductListSource';
import { useProductListingReturnNavigation } from './hooks/useProductListingReturnNavigation';
import { useProductPublishTaskActions } from './hooks/useProductPublishTaskActions';
import { useProductStoreInitialization } from './hooks/useProductStoreInitialization';
import { useProductWorkbenchApiActions } from './hooks/useProductWorkbenchApiActions';
import { useProductWorkbenchDerivedState } from './hooks/useProductWorkbenchDerivedState';
import { useProductWorkbenchSurfaceActions } from './hooks/useProductWorkbenchSurfaceActions';
import { useProductWorkspaceNavigation } from './hooks/useProductWorkspaceNavigation';
import { useProductWorkspaceState } from './hooks/useProductWorkspaceState';
import { useProductPublishTaskPolling } from './hooks/useProductPublishTaskPolling';
import { useProductVariantSpecModalOpener } from './hooks/useProductVariantSpecModalOpener';
import type { UseProductManagementWorkspaceParams } from './workspaceContracts';
import { storeInitializationStepColor } from './workspaceHelpers';
import { createProductManagementWorkspaceSurfaces } from './workspaceSurfaces';

export function useProductManagementWorkspace({
  session, enabled = true, activeOwnerId,
  storeSyncState, storeSyncOwnerId,
  activeProductWorkspaceTabKey, setActiveProductWorkspaceTabKey,
  productDetailTabRequest, setProductDetailTabRequest,
  setActiveProductMenu,
  syncProductWorkspacePath
}: UseProductManagementWorkspaceParams) {
  const workspaceState = useProductWorkspaceState();
  const {
    activeSiteOfferCode, productDetailTabHandledRef,
    productListDatasetState, productListDraftFilters,
    productListFilters, productListSortKey,
    productListUiStates, productSnapshotForm,
    productSnapshotSubmitting, productWorkbenchRef,
    productWorkbenchSurfaceState, selectedInitializationStoreCodeOverride,
    selectedProductRowKeys, setActiveSiteOfferCode,
    setProductActionSubmitting, setProductGalleryImages,
    setProductGalleryOpen,
    setProductGallerySubtitle, setProductGalleryTitle,
    setProductListDatasetState, setProductListDraftFilters,
    setProductListFilters, setProductListUiStates,
    setProductSnapshotSubmitting, setProductVariantSpecModalState,
    setProductWorkbenchSurfaceState, setSelectedInitializationStoreCodeOverride,
    setSelectedProductRowKeys, setStoreInitializationState,
    setStoreInitializationSubmitting, showInitializationDiagnostics,
    storeInitializationState,
    lastInitializationStoreCodeRef
  } = workspaceState;

  const productListDatasetLoader = useProductListDatasetLoader({
    activeOwnerId,
    session,
    setProductListDatasetState
  });
  const { loadProductListDataset } = productListDatasetLoader;
  const storeInitialization = useProductStoreInitialization({
    activeOwnerId,
    enableProductBootDataset: enabled,
    enableProductBootInitStatus: enabled,
    enableProductBootStoreSelection: enabled,
    lastInitializationStoreCodeRef,
    loadProductListDataset,
    selectedInitializationStoreCodeOverride,
    session,
    setProductListDatasetState,
    setSelectedInitializationStoreCodeOverride,
    setSelectedProductRowKeys,
    setStoreInitializationState,
    setStoreInitializationSubmitting,
    storeInitializationState,
    storeSyncOwnerId,
    storeSyncState
  });
  const { selectedInitializationStoreCode } = storeInitialization;
  const listSource = useProductListSource({
    activeOwnerId,
    productListDatasetState,
    selectedInitializationStoreCode,
    storeInitializationState
  });
  const {
    productListAvailable,
    productListDegraded,
    productListInitializationFailed,
    productListItemBySkuParent,
    productListSourceItems,
    usingMockProductList
  } = listSource;
  const workbenchDerived = useProductWorkbenchDerivedState({
    activeSiteOfferCode,
    productDetailTabRequest,
    productListItemBySkuParent,
    productWorkbenchRef,
    productWorkbenchSurfaceState,
    setActiveSiteOfferCode
  });
  const {
    activeProductSiteOffer,
    currentProductIdentityKey,
    currentProductSkuParent,
    currentProductSummarySurface,
    dirtySiteOfferCodes,
    productDraftDirty,
    productImageUrls,
    productSnapshotView,
    productWorkbenchState
  } = workbenchDerived;
  const listFilters = useProductListFilters({
    productListAvailable,
    productListDatasetState,
    productListDegraded,
    productListDraftFilters,
    productListFilters,
    productListInitializationFailed,
    productListSortKey,
    productListSourceItems,
    productListUiStates,
    selectedProductRowKeys,
    setProductListDraftFilters,
    setProductListFilters,
    setSelectedProductRowKeys,
    showInitializationDiagnostics,
    storeInitializationState,
    usingMockProductList
  });
  const listMutations = useProductListMutations({
    setProductListDatasetState,
    setProductListUiStates,
    setStoreInitializationState,
    usingMockProductList
  });
  const { applyProductListSummary, updateProductListLiveStatus, updateProductListUiState } = listMutations;
  const workbenchSurfaceActions = useProductWorkbenchSurfaceActions({
    applyProductListSummary,
    productListItemBySkuParent,
    productSnapshotForm,
    productWorkbenchSurfaceState,
    setProductWorkbenchSurfaceState,
    updateProductListUiState
  });
  const { applyProductWorkbenchResponse, openMockProductWorkbench, updateReadyProductWorkbenchSurface } =
    workbenchSurfaceActions;
  const publishTaskActions = useProductPublishTaskActions({
    activeOwnerId,
    applyProductWorkbenchResponse,
    updateReadyProductWorkbenchSurface
  });
  const mockActions = useMockProductActions({
    activeSiteOfferCode,
    productWorkbenchState,
    updateProductListUiState,
    updateReadyProductWorkbenchSurface
  });
  const { applyMockProductAction } = mockActions;
  const mediaAndHistoryActions = useProductMediaAndHistoryActions({
    activeOwnerId,
    applyProductListSummary,
    currentProductIdentityKey,
    currentProductSkuParent,
    currentProductSummarySurface,
    productImageUrls,
    productListUiStates,
    productSnapshotView,
    productWorkbenchState,
    selectedInitializationStoreCode,
    sessionDefaultOwnerUserId: session?.defaultOwnerUserId,
    usingMockProductList,
    workspaceState
  });
  const { openProductListGallery, openProductHistoryModal, openProductSiteCompareModal } = mediaAndHistoryActions;
  const openProductVariantSpecModal = useProductVariantSpecModalOpener({
    activeOwnerId,
    defaultOwnerUserId: session?.defaultOwnerUserId,
    selectedInitializationStoreCode,
    setProductVariantSpecModalState
  });
  const draftMutations = useProductDraftMutations({
    activeSiteOfferCode,
    dirtySiteOfferCodes,
    updateReadyProductWorkbenchSurface
  });
  const workbenchApiActions = useProductWorkbenchApiActions({
    activeOwnerId,
    activeProductSiteOffer,
    applyMockProductAction,
    applyProductWorkbenchResponse,
    currentProductIdentityKey,
    currentProductSkuParent,
    openMockProductWorkbench,
    productDraftDirty,
    productListItemBySkuParent,
    productSnapshotForm,
    productSnapshotView,
    productWorkbenchState,
    productWorkbenchSurfaceState,
    selectedInitializationStoreCode,
    setProductActionSubmitting,
    setProductSnapshotSubmitting,
    setProductWorkbenchSurfaceState,
    updateProductListUiState,
    updateReadyProductWorkbenchSurface,
    usingMockProductList
  });
  const { submitProductSnapshot } = workbenchApiActions;
  useProductPublishTaskPolling({
    activeOwnerId,
    applyProductWorkbenchResponse,
    enabled,
    productWorkbenchSurfaceState,
    updateReadyProductWorkbenchSurface
  });
  const navigation = useProductWorkspaceNavigation({
    activeOwnerId,
    activeProductWorkspaceTabKey,
    enabled,
    currentProductSkuParent,
    productDetailTabHandledRef,
    productDetailTabRequest,
    productDraftDirty,
    productListItemBySkuParent,
    productSnapshotForm,
    productWorkbenchRef,
    selectedInitializationStoreCode,
    session,
    setActiveProductMenu,
    setActiveProductWorkspaceTabKey,
    setActiveSiteOfferCode,
    setProductDetailTabRequest,
    setProductGalleryImages,
    setProductGalleryOpen,
    setProductGallerySubtitle,
    setProductGalleryTitle,
    setProductListDatasetState,
    setProductListDraftFilters,
    setProductListFilters,
    setProductListUiStates,
    setProductWorkbenchSurfaceState,
    setSelectedInitializationStoreCodeOverride,
    setSelectedProductRowKeys,
    setStoreInitializationState,
    submitProductSnapshot,
    openMockProductWorkbench,
    syncProductWorkspacePath,
    usingMockProductList
  });
  useProductListingReturnNavigation({
    enabled,
    activeOwnerId,
    loadProductListDataset,
    openProductWorkbenchInCurrentPage: navigation.openProductWorkbenchInCurrentPage,
    selectStore: (nextStoreCode) =>
      setSelectedInitializationStoreCodeOverride(nextStoreCode)
  });

  const {
    productListColumns,
    productLocalDeletion,
    productOperationStage
  } = useProductListOperations({
    activeOwnerId,
    closeProductDetailTab: navigation.closeProductDetailTab,
    currentProductIdentityKey,
    loadProductListDataset,
    openProductHistoryModal,
    openProductListGallery,
    openProductSiteCompareModal,
    openProductVariantSpecModal,
    openProductWorkbenchInPageTab: navigation.openProductWorkbenchInPageTab,
    productListUiStates,
    productSnapshotSubmitting,
    selectedInitializationStoreCode,
    setProductListDatasetState,
    updateProductListLiveStatus,
    usingMockProductList
  });

  const runtimeWorkspace = {
    ...workspaceState, ...productListDatasetLoader,
    ...storeInitialization, ...listSource,
    ...workbenchDerived, ...listFilters,
    ...listMutations, ...workbenchSurfaceActions,
    ...mockActions, ...mediaAndHistoryActions,
    ...productLocalDeletion, ...productOperationStage,
    ...draftMutations, ...workbenchApiActions,
    ...publishTaskActions, ...navigation,
    productListColumns,
    storeInitializationStepColor
  };
  return createProductManagementWorkspaceSurfaces(runtimeWorkspace);
}
