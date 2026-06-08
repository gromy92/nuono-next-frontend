import { useCallback, useEffect } from 'react';
import { message } from 'antd';
import { fetchProductPublishTask, syncMissingProductDetailBaselinesRequest } from './api';
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
    setProductActionSubmitting,
    setProductGalleryImages,
    setProductGalleryIndex,
    setProductGalleryOpen,
    setProductGallerySubtitle,
    setProductGalleryTitle,
    setProductDetailBaselineSyncSubmitting,
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

  const syncMissingProductDetailBaselines = useCallback(async () => {
    const ownerUserId = activeOwnerId ?? session?.defaultOwnerUserId;
    const storeCode = selectedInitializationStoreCode;
    if (!ownerUserId || !storeCode) {
      message.warning('缺少老板或店铺上下文，暂时不能补详情基线。');
      return;
    }

    try {
      setProductDetailBaselineSyncSubmitting(true);
      const result = await syncMissingProductDetailBaselinesRequest({
        ownerUserId,
        storeCode,
        maxDetailFetches: 20
      });
      const succeededCount = result.succeededCount ?? 0;
      const failedCount = result.failedCount ?? 0;
      const remainingCount = result.remainingCount ?? 0;
      const attemptedCount = result.attemptedCount ?? 0;
      if (failedCount > 0) {
        message.warning(
          `本次补详情基线：成功 ${succeededCount} 个，失败 ${failedCount} 个，剩余 ${remainingCount} 个。`
        );
      } else if (remainingCount > 0) {
        message.success(`本次补详情基线 ${succeededCount} 个，剩余 ${remainingCount} 个。可以继续点击补下一批。`);
      } else if (attemptedCount > 0 || succeededCount > 0) {
        message.success(`详情基线已补齐，本次完成 ${succeededCount} 个。`);
      } else {
        message.info('当前没有需要补齐的详情基线。');
      }
      void loadProductListDataset(storeCode, ownerUserId);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '补详情基线失败');
    } finally {
      setProductDetailBaselineSyncSubmitting(false);
    }
  }, [
    activeOwnerId,
    loadProductListDataset,
    selectedInitializationStoreCode,
    session?.defaultOwnerUserId,
    setProductDetailBaselineSyncSubmitting
  ]);

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
    if (!enabled) {
      return undefined;
    }
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
  }, [activeOwnerId, applyProductWorkbenchResponse, enabled, productWorkbenchSurfaceState, updateReadyProductWorkbenchSurface]);

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
    syncMissingProductDetailBaselines,
    productListColumns,
    storeInitializationStepColor
  };
}
