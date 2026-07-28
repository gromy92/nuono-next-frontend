import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { FormInstance } from 'antd';
import { findMockProductItem } from '../mockData';
import { isSameProductDetailRequest } from '../workspaceHelpers';
import { buildProductWorkbenchContext } from '../utils/workbench';
import { findProductByIdentity } from '../../product-domain/productIdentity';
import { buildProductSummarySurfaceFromListItem } from '../../product-baseline';
import type {
  ProductDetailTabMode,
  ProductDetailTabRequest,
  ProductListRowPayload,
  ProductWorkbenchSurfaceState,
  ProductWorkspaceTabKey
} from '../types';

export type ProductQuickOpenSample = {
  skuParent: string;
  currentZCode?: string;
  partnerSku?: string;
  pskuCode?: string;
  storeCode?: string;
  referenceStoreCode?: string;
};

type ProductWorkbenchPageTabOpenerParams = {
  confirmProductDetailSwitch: (action: 'switch' | 'close', skuParent?: string) => Promise<boolean>;
  productDetailTabHandledRef: MutableRefObject<string | null>;
  productDetailTabRequest: ProductDetailTabRequest | null;
  productDraftDirty: boolean;
  productListItemBySkuParent: Map<string, ProductListRowPayload>;
  productSnapshotForm: FormInstance;
  productWorkbenchRef: MutableRefObject<HTMLDivElement | null>;
  selectedInitializationStoreCode?: string;
  setActiveProductMenu: () => void;
  setActiveProductWorkspaceTabKey: Dispatch<SetStateAction<ProductWorkspaceTabKey>>;
  setActiveSiteOfferCode: Dispatch<SetStateAction<string | undefined>>;
  setProductDetailTabRequest: Dispatch<SetStateAction<ProductDetailTabRequest | null>>;
  setProductGalleryImages: Dispatch<SetStateAction<string[]>>;
  setProductGalleryOpen: Dispatch<SetStateAction<boolean>>;
  setProductGallerySubtitle: Dispatch<SetStateAction<string | undefined>>;
  setProductGalleryTitle: Dispatch<SetStateAction<string | undefined>>;
  setProductWorkbenchSurfaceState: Dispatch<SetStateAction<ProductWorkbenchSurfaceState>>;
  syncProductWorkspacePath: () => void;
  usingMockProductList: boolean;
};

export function useProductWorkbenchPageTabOpener(params: ProductWorkbenchPageTabOpenerParams) {
  const {
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
  } = params;

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

  const openProductWorkbenchInPageTab = useCallback(
    async (sample: ProductQuickOpenSample, modeOverride?: ProductDetailTabMode) => {
      const mode = modeOverride ?? (usingMockProductList || findMockProductItem(sample.skuParent) ? 'mock' : 'real');
      const nextRequest = {
        skuParent: sample.skuParent,
        currentZCode: sample.currentZCode || sample.skuParent,
        partnerSku: sample.partnerSku,
        pskuCode: sample.pskuCode,
        storeCode: sample.storeCode || sample.referenceStoreCode || selectedInitializationStoreCode,
        mode
      } satisfies ProductDetailTabRequest;
      const matchedListItem = findProductByIdentity(productListItemBySkuParent, nextRequest);
      const nextContext = buildProductWorkbenchContext({
        mode,
        source: 'list-row',
        storeCode: nextRequest.storeCode,
        skuParent: nextRequest.skuParent,
        currentZCode: nextRequest.currentZCode,
        partnerSku: nextRequest.partnerSku,
        pskuCode: nextRequest.pskuCode,
        summaryPreview: matchedListItem ? buildProductSummarySurfaceFromListItem(matchedListItem) : null
      });

      if (isSameProductDetailRequest(productDetailTabRequest, nextRequest)) {
        if ((productDetailTabRequest ? JSON.stringify(productDetailTabRequest) : '') !== JSON.stringify(nextRequest)) {
          productDetailTabHandledRef.current = null;
          setProductWorkbenchSurfaceState({ status: 'loading', context: nextContext, message: '正在读取本地商品详情...' });
          productSnapshotForm.setFieldsValue(nextRequest);
          setProductDetailTabRequest(nextRequest);
        }
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
      setProductWorkbenchSurfaceState(
        mode === 'real' && !nextRequest.storeCode
          ? { status: 'error', context: nextContext, message: '当前商品缺少逻辑店铺上下文，暂时不能打开详情工作台。' }
          : { status: 'loading', context: nextContext, message: '正在读取本地商品详情...' }
      );
      setActiveSiteOfferCode(undefined);
      productSnapshotForm.setFieldsValue(nextRequest);
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

  return { focusProductDetailTab, openProductWorkbenchInPageTab };
}
