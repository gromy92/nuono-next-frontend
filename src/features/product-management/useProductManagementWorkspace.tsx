import { useCallback, useEffect } from 'react';
import { message } from 'antd';
import { fetchProductPublishTask } from './api';
import { createProductListColumns } from './productListColumns';
import { useMockProductActions } from './hooks/useMockProductActions';
import { useProductDraftMutations } from './hooks/useProductDraftMutations';
import { useProductListDatasetLoader } from './hooks/useProductListDatasetLoader';
import { useProductListFilters } from './hooks/useProductListFilters';
import { useProductListMutations } from './hooks/useProductListMutations';
import { useProductMediaAndHistoryActions } from './hooks/useProductMediaAndHistoryActions';
import { useProductLocalDeletion } from './hooks/useProductLocalDeletion';
import { useProductListSource } from './hooks/useProductListSource';
import { useProductPublishTaskActions } from './hooks/useProductPublishTaskActions';
import { useProductStoreInitialization } from './hooks/useProductStoreInitialization';
import { useProductWorkbenchApiActions } from './hooks/useProductWorkbenchApiActions';
import { useProductWorkbenchDerivedState } from './hooks/useProductWorkbenchDerivedState';
import { useProductWorkbenchSurfaceActions } from './hooks/useProductWorkbenchSurfaceActions';
import { useProductWorkspaceNavigation } from './hooks/useProductWorkspaceNavigation';
import { useProductWorkspaceState } from './hooks/useProductWorkspaceState';
import type { ProductListRowPayload } from './types';
import type { UseProductManagementWorkspaceParams } from './workspaceContracts';
import { storeInitializationStepColor } from './workspaceHelpers';
import { isProductPublishTaskActive } from './utils';

export function useProductManagementWorkspace({
  session,
  enabled = true,
  activeOwnerId,
  storeSyncState,
  storeSyncOwnerId,
  activeProductWorkspaceTabKey,
  setActiveProductWorkspaceTabKey,
  productDetailTabRequest,
  setProductDetailTabRequest,
  setActiveProductMenu,
  syncProductWorkspacePath
}: UseProductManagementWorkspaceParams) {
  const workspaceState = useProductWorkspaceState();
  const {
    activeSiteOfferCode,
    autoInitializationStoreCode,
    productDetailTabHandledRef,
    productListDatasetState,
    productListDraftFilters,
    productListFilters,
    productListSortKey,
    productListUiStates,
    productSnapshotForm,
    productSnapshotSubmitting,
    productWorkbenchRef,
    productWorkbenchSurfaceState,
    selectedInitializationStoreCodeOverride,
    selectedProductRowKeys,
    setActiveSiteOfferCode,
    setAutoInitializationStoreCode,
    setProductActionSubmitting,
    setProductGalleryImages,
    setProductGalleryIndex,
    setProductGalleryOpen,
    setProductGallerySubtitle,
    setProductGalleryTitle,
    setProductListDatasetState,
    setProductListDraftFilters,
    setProductListFilters,
    setProductListUiStates,
    setProductSnapshotSubmitting,
    setProductVariantSpecModalState,
    setProductWorkbenchSurfaceState,
    setSelectedInitializationStoreCodeOverride,
    setSelectedProductRowKeys,
    setStoreInitializationState,
    setStoreInitializationSubmitting,
    showInitializationDiagnostics,
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
    autoInitializationStoreCode,
    enableProductBootAutoInit: enabled,
    enableProductBootDataset: enabled,
    enableProductBootInitStatus: enabled,
    enableProductBootStoreSelection: enabled,
    lastInitializationStoreCodeRef,
    loadProductListDataset,
    selectedInitializationStoreCodeOverride,
    session,
    setAutoInitializationStoreCode,
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

  const openProductVariantSpecModal = useCallback(
    (record: ProductListRowPayload) => {
      const ownerUserId = activeOwnerId ?? session?.defaultOwnerUserId;
      const storeCode = selectedInitializationStoreCode ?? record.referenceStoreCode;
      const skuParent = record.skuParent;

      if (!ownerUserId || !storeCode || !skuParent) {
        message.warning('缺少老板、店铺或商品 SKU 上下文，暂时不能维护规格。');
        return;
      }

      setProductVariantSpecModalState({
        open: true,
        ownerUserId,
        storeCode,
        skuParent,
        title: record.title || record.partnerSku || skuParent,
        partnerSku: record.partnerSku,
        imageUrl: record.imageUrl
      });
    },
    [activeOwnerId, selectedInitializationStoreCode, session?.defaultOwnerUserId, setProductVariantSpecModalState]
  );

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

  useEffect(() => {
    if (productWorkbenchSurfaceState.status !== 'ready') {
      return undefined;
    }
    const publishTask = productWorkbenchSurfaceState.payload.publishTask;
    const taskId = publishTask?.taskId;
    if (!taskId || !activeOwnerId || !isProductPublishTaskActive(publishTask)) {
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void fetchProductPublishTask(taskId, activeOwnerId)
        .then((nextTask) => {
          if (cancelled) {
            return;
          }
          if (nextTask.workbench) {
            applyProductWorkbenchResponse(nextTask.workbench);
            if (!isProductPublishTaskActive(nextTask)) {
              message.info(nextTask.message || '发布任务状态已更新。');
            }
            return;
          }
          updateReadyProductWorkbenchSurface((currentValue) => ({
            workbench: currentValue.workbench,
            payloadOverrides: {
              publishTask: nextTask
            }
          }));
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }
          message.warning(error instanceof Error ? error.message : '发布任务状态读取失败。');
        });
    }, Math.max(1500, publishTask.pollAfterMillis ?? 2000));

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeOwnerId, applyProductWorkbenchResponse, productWorkbenchSurfaceState, updateReadyProductWorkbenchSurface]);

  const navigation = useProductWorkspaceNavigation({
    activeOwnerId,
    activeProductWorkspaceTabKey,
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
    setAutoInitializationStoreCode,
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

  const productLocalDeletion = useProductLocalDeletion({
    activeOwnerId,
    closeProductDetailTab: navigation.closeProductDetailTab,
    currentProductSkuParent,
    selectedInitializationStoreCode,
    setProductListDatasetState
  });

  const productListColumns = createProductListColumns({
    deletingProductSkuParent: productLocalDeletion.deletingProductSkuParent,
    productSnapshotSubmitting,
    usingMockProductList,
    productListUiStates,
    openProductListGallery,
    openProductWorkbenchInPageTab: navigation.openProductWorkbenchInPageTab,
    openProductHistoryModal,
    openProductVariantSpecModal,
    openProductSiteCompareModal,
    requestDeleteLocalProduct: productLocalDeletion.requestDeleteLocalProduct,
    updateProductListLiveStatus
  });

  return {
    ...workspaceState,
    ...productListDatasetLoader,
    ...storeInitialization,
    ...listSource,
    ...workbenchDerived,
    ...listFilters,
    ...listMutations,
    ...workbenchSurfaceActions,
    ...mockActions,
    ...mediaAndHistoryActions,
    ...productLocalDeletion,
    ...draftMutations,
    ...workbenchApiActions,
    ...publishTaskActions,
    ...navigation,
    productListColumns,
    storeInitializationStepColor
  };
}
