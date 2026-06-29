import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { FormInstance } from 'antd';
import { findMockProductItem } from '../mockData';
import { isSameProductDetailRequest } from '../workspaceHelpers';
import { buildProductSummarySurfaceFromListItem, buildProductWorkbenchContext } from '../utils';
import type {
  ProductDetailTabMode,
  ProductDetailTabRequest,
  ProductListDatasetState,
  ProductListFilters,
  ProductListRowPayload,
  ProductListUiState,
  ProductWorkbenchContext,
  ProductWorkbenchSurfaceState,
  ProductWorkspaceTabKey,
  StoreInitializationState
} from '../types';
import type { AuthSession } from '../../auth/session';
import { useProductDetailTabLifecycle } from './useProductDetailTabLifecycle';
import { useProductDetailSwitchConfirm } from './useProductDetailSwitchConfirm';
import { useProductWorkspaceReset } from './useProductWorkspaceReset';

type ProductQuickOpenSample = {
  skuParent: string;
  partnerSku?: string;
  pskuCode?: string;
  storeCode?: string;
  referenceStoreCode?: string;
};

type UseProductWorkspaceNavigationParams = {
  activeOwnerId?: number;
  activeProductWorkspaceTabKey: ProductWorkspaceTabKey;
  enabled: boolean;
  currentProductSkuParent?: string;
  productDetailTabHandledRef: MutableRefObject<string | null>;
  productDetailTabRequest: ProductDetailTabRequest | null;
  productDraftDirty: boolean;
  productListItemBySkuParent: Map<string, ProductListRowPayload>;
  productSnapshotForm: FormInstance;
  productWorkbenchRef: MutableRefObject<HTMLDivElement | null>;
  selectedInitializationStoreCode?: string;
  session: AuthSession | null;
  setActiveProductMenu: () => void;
  setActiveProductWorkspaceTabKey: Dispatch<SetStateAction<ProductWorkspaceTabKey>>;
  setActiveSiteOfferCode: Dispatch<SetStateAction<string | undefined>>;
  setProductDetailTabRequest: Dispatch<SetStateAction<ProductDetailTabRequest | null>>;
  setProductGalleryImages: Dispatch<SetStateAction<string[]>>;
  setProductGalleryOpen: Dispatch<SetStateAction<boolean>>;
  setProductGallerySubtitle: Dispatch<SetStateAction<string | undefined>>;
  setProductGalleryTitle: Dispatch<SetStateAction<string | undefined>>;
  setProductListDatasetState: Dispatch<SetStateAction<ProductListDatasetState>>;
  setProductListDraftFilters: Dispatch<SetStateAction<ProductListFilters>>;
  setProductListFilters: Dispatch<SetStateAction<ProductListFilters>>;
  setProductListUiStates: Dispatch<SetStateAction<Record<string, ProductListUiState>>>;
  setProductWorkbenchSurfaceState: Dispatch<SetStateAction<ProductWorkbenchSurfaceState>>;
  setSelectedInitializationStoreCodeOverride: Dispatch<SetStateAction<string | undefined>>;
  setSelectedProductRowKeys: Dispatch<SetStateAction<string[]>>;
  setStoreInitializationState: Dispatch<SetStateAction<StoreInitializationState>>;
  submitProductSnapshot: (
    nextValues?: Partial<{
      storeCode: string;
      noonUser: string;
      noonPassword: string;
      skuParent: string;
      partnerSku: string;
      pskuCode: string;
    }>,
    options?: { forceReal?: boolean; context?: ProductWorkbenchContext; discardPersistedDraft?: boolean }
  ) => Promise<void>;
  openMockProductWorkbench: (skuParent?: string) => void;
  syncProductWorkspacePath: () => void;
  usingMockProductList: boolean;
};

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
  const focusProductDetailTab = useCallback(() => {
    setActiveProductMenu();
    setActiveProductWorkspaceTabKey('product-detail');
    syncProductWorkspacePath();
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        productWorkbenchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [productWorkbenchRef, setActiveProductMenu, setActiveProductWorkspaceTabKey, syncProductWorkspacePath]);

  const { confirmProductDetailSwitch, productDetailSwitchConfirmModal } = useProductDetailSwitchConfirm();

  const openProductWorkbenchInPageTab = useCallback(
    async (sample: ProductQuickOpenSample, modeOverride?: ProductDetailTabMode) => {
      const mode =
        modeOverride ??
        (usingMockProductList || findMockProductItem(sample.skuParent) ? 'mock' : 'real');

      const nextRequest = {
        skuParent: sample.skuParent,
        partnerSku: sample.partnerSku,
        pskuCode: sample.pskuCode,
        storeCode: sample.storeCode || sample.referenceStoreCode || selectedInitializationStoreCode,
        mode
      } satisfies ProductDetailTabRequest;
      const matchedListItem = productListItemBySkuParent.get(sample.skuParent);
      const nextContext = buildProductWorkbenchContext({
        mode,
        source: 'list-row',
        storeCode: nextRequest.storeCode,
        skuParent: nextRequest.skuParent,
        partnerSku: nextRequest.partnerSku,
        pskuCode: nextRequest.pskuCode,
        summaryPreview: matchedListItem ? buildProductSummarySurfaceFromListItem(matchedListItem) : null
      });

      if (isSameProductDetailRequest(productDetailTabRequest, nextRequest)) {
        focusProductDetailTab();
        return;
      }

      if (productDraftDirty) {
        const confirmed = await confirmProductDetailSwitch('switch', sample.skuParent);
        if (!confirmed) {
          focusProductDetailTab();
          return;
        }
      }

      productDetailTabHandledRef.current = null;
      setProductGalleryOpen(false);
      setProductGalleryImages([]);
      setProductGalleryTitle(undefined);
      setProductGallerySubtitle(undefined);
      if (mode === 'real' && !nextRequest.storeCode) {
        setProductWorkbenchSurfaceState({
          status: 'error',
          context: nextContext,
          message: '当前商品缺少逻辑店铺上下文，暂时不能打开详情工作台。'
        });
      } else {
        setProductWorkbenchSurfaceState({
          status: 'loading',
          context: nextContext,
          message: '正在读取本地商品详情...'
        });
      }
      setActiveSiteOfferCode(undefined);
      productSnapshotForm.setFieldsValue({
        storeCode: nextRequest.storeCode,
        skuParent: nextRequest.skuParent,
        partnerSku: nextRequest.partnerSku,
        pskuCode: nextRequest.pskuCode
      });
      setProductDetailTabRequest(nextRequest);
      setActiveProductMenu();
      setActiveProductWorkspaceTabKey('product-detail');
      syncProductWorkspacePath();
    },
    [
      confirmProductDetailSwitch,
      focusProductDetailTab,
      productDetailTabHandledRef,
      productDetailTabRequest,
      productDraftDirty,
      productListItemBySkuParent,
      productSnapshotForm,
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
    ]
  );

  const openProductWorkbenchInCurrentPage = useCallback(
    async (sample: ProductQuickOpenSample, modeOverride?: ProductDetailTabMode) => {
      const mode =
        modeOverride ??
        (usingMockProductList || findMockProductItem(sample.skuParent) ? 'mock' : 'real');
      const requestValues = {
        storeCode: sample.storeCode || sample.referenceStoreCode || selectedInitializationStoreCode,
        skuParent: sample.skuParent,
        partnerSku: sample.partnerSku,
        pskuCode: sample.pskuCode
      };
      const matchedListItem = productListItemBySkuParent.get(sample.skuParent);
      const nextContext = buildProductWorkbenchContext({
        mode,
        source: 'quick-open',
        storeCode: requestValues.storeCode,
        skuParent: requestValues.skuParent,
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
        openMockProductWorkbench(sample.skuParent);
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
