import { useCallback } from 'react';
import { findMockProductItem } from '../mockData';
import { buildProductWorkbenchContext } from '../utils/workbench';
import { findProductByIdentity } from '../../product-domain/productIdentity';
import { buildProductSummarySurfaceFromListItem } from '../../product-baseline';
import type { ProductDetailTabMode } from '../types';
import type { UseProductWorkspaceNavigationParams } from './productWorkspaceNavigationContracts';
import { useProductDetailTabLifecycle } from './useProductDetailTabLifecycle';
import { useProductDetailSwitchConfirm } from './useProductDetailSwitchConfirm';
import { useProductWorkspaceReset } from './useProductWorkspaceReset';
import {
  useProductWorkbenchPageTabOpener,
  type ProductQuickOpenSample
} from './useProductWorkbenchPageTabOpener';
export function useProductWorkspaceNavigation({
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
}: UseProductWorkspaceNavigationParams) {
  const { confirmProductDetailSwitch, productDetailSwitchConfirmModal } = useProductDetailSwitchConfirm();
  const { focusProductDetailTab, openProductWorkbenchInPageTab } = useProductWorkbenchPageTabOpener({
    confirmProductDetailSwitch,
    productDetailTabHandledRef,
    productDetailTabRequest,
    productDraftDirty,
    productListItemBySkuParent,
    productSnapshotForm,
    productWorkbenchRef,
    selectedInitializationStoreCode,
    setActiveProductMenu,
    setActiveProductWorkspaceTabKey,
    setActiveSiteOfferCode,
    setProductDetailTabRequest,
    setProductGalleryImages,
    setProductGalleryOpen,
    setProductGallerySubtitle,
    setProductGalleryTitle,
    setProductWorkbenchSurfaceState,
    syncProductWorkspacePath,
    usingMockProductList
  });
  const openProductWorkbenchInCurrentPage = useCallback(
    async (sample: ProductQuickOpenSample, modeOverride?: ProductDetailTabMode) => {
      const mode =
        modeOverride ??
        (usingMockProductList || findMockProductItem(sample.skuParent) ? 'mock' : 'real');
      const requestValues = {
        storeCode: sample.storeCode || sample.referenceStoreCode || selectedInitializationStoreCode,
        skuParent: sample.skuParent,
        currentZCode: sample.currentZCode || sample.skuParent,
        partnerSku: sample.partnerSku,
        pskuCode: sample.pskuCode
      };
      const matchedListItem = findProductByIdentity(productListItemBySkuParent, requestValues);
      const nextContext = buildProductWorkbenchContext({
        mode,
        source: 'quick-open',
        storeCode: requestValues.storeCode,
        skuParent: requestValues.skuParent,
        currentZCode: requestValues.currentZCode,
        partnerSku: requestValues.partnerSku,
        pskuCode: requestValues.pskuCode,
        summaryPreview: matchedListItem ? buildProductSummarySurfaceFromListItem(matchedListItem) : null
      });

      if (productDraftDirty) {
        const confirmed = await confirmProductDetailSwitch('switch', sample.skuParent);
        if (!confirmed) {
          return false;
        }
      }

      setProductGalleryOpen(false);
      setProductGalleryImages([]);
      setProductGalleryTitle(undefined);
      setProductGallerySubtitle(undefined);
      setActiveSiteOfferCode(undefined);
      productSnapshotForm.setFieldsValue(requestValues);

      if (mode === 'mock') {
        openMockProductWorkbench(requestValues.currentZCode);
        return true;
      }

      if (!activeOwnerId) {
        setProductWorkbenchSurfaceState({
          status: 'error',
          context: nextContext,
          message: '缺少老板上下文，暂时不能打开 Group 工作台。'
        });
        return false;
      }

      if (!requestValues.storeCode) {
        setProductWorkbenchSurfaceState({
          status: 'error',
          context: nextContext,
          message: '当前商品缺少逻辑店铺上下文，暂时不能打开 Group 工作台。'
        });
        return false;
      }

      await submitProductSnapshot(requestValues, {
        forceReal: true,
        context: nextContext,
        discardPersistedDraft: true
      });
      return true;
    },
    [
      activeOwnerId,
      confirmProductDetailSwitch,
      openMockProductWorkbench,
      productDraftDirty,
      productListItemBySkuParent,
      productSnapshotForm,
      selectedInitializationStoreCode,
      setActiveSiteOfferCode,
      setProductGalleryImages,
      setProductGalleryOpen,
      setProductGallerySubtitle,
      setProductGalleryTitle,
      setProductWorkbenchSurfaceState,
      submitProductSnapshot,
      usingMockProductList
    ]
  );

  useProductDetailTabLifecycle({
    activeOwnerId,
    activeProductWorkspaceTabKey,
    enabled,
    openMockProductWorkbench,
    productDetailTabHandledRef,
    productDetailTabRequest,
    selectedInitializationStoreCode,
    session,
    setProductWorkbenchSurfaceState,
    submitProductSnapshot
  });
  const goBackToProductManage = useCallback(() => {
    setActiveProductMenu();
    setActiveProductWorkspaceTabKey('product-manage');
    syncProductWorkspacePath();
  }, [setActiveProductMenu, setActiveProductWorkspaceTabKey, syncProductWorkspacePath]);
  const closeProductDetailTab = useCallback(() => {
    productDetailTabHandledRef.current = null;
    setProductDetailTabRequest(null);
    setProductGalleryOpen(false);
    setProductGalleryImages([]);
    setProductGalleryTitle(undefined);
    setProductGallerySubtitle(undefined);
    setProductWorkbenchSurfaceState({ status: 'idle' });
    setActiveSiteOfferCode(undefined);
    setActiveProductMenu();
    setActiveProductWorkspaceTabKey('product-manage');
    syncProductWorkspacePath();
  }, [
    productDetailTabHandledRef,
    setActiveProductMenu,
    setActiveProductWorkspaceTabKey,
    setActiveSiteOfferCode,
    setProductDetailTabRequest,
    setProductGalleryImages,
    setProductGalleryOpen,
    setProductGallerySubtitle,
    setProductGalleryTitle,
    setProductWorkbenchSurfaceState,
    syncProductWorkspacePath
  ]);

  const requestCloseProductDetailTab = useCallback(async () => {
    if (productDraftDirty) {
      const confirmed = await confirmProductDetailSwitch('close', currentProductSkuParent);
      if (!confirmed) {
        return;
      }
    }

    closeProductDetailTab();
  }, [closeProductDetailTab, confirmProductDetailSwitch, currentProductSkuParent, productDraftDirty]);

  const resetProductWorkspace = useProductWorkspaceReset({
    productDetailTabHandledRef,
    setActiveProductWorkspaceTabKey,
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
    setStoreInitializationState
  });

  return {
    focusProductDetailTab,
    confirmProductDetailSwitch,
    productDetailSwitchConfirmModal,
    openProductWorkbenchInPageTab,
    openProductWorkbenchInCurrentPage,
    goBackToProductManage,
    closeProductDetailTab,
    requestCloseProductDetailTab,
    resetProductWorkspace
  };
}
