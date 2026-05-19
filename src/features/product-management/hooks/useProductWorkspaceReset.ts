import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { defaultProductListFilters } from '../config';
import type {
  ProductDetailTabRequest,
  ProductListDatasetState,
  ProductListFilters,
  ProductListUiState,
  ProductWorkbenchSurfaceState,
  ProductWorkspaceTabKey,
  StoreInitializationState
} from '../types';

type UseProductWorkspaceResetParams = {
  productDetailTabHandledRef: MutableRefObject<string | null>;
  setActiveProductWorkspaceTabKey: Dispatch<SetStateAction<ProductWorkspaceTabKey>>;
  setAutoInitializationStoreCode: Dispatch<SetStateAction<string | undefined>>;
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
};

export function useProductWorkspaceReset({
  productDetailTabHandledRef,
  setActiveProductWorkspaceTabKey,
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
  setStoreInitializationState
}: UseProductWorkspaceResetParams) {
  return useCallback(() => {
    setSelectedInitializationStoreCodeOverride(undefined);
    setStoreInitializationState({ status: 'idle' });
    setProductListDatasetState({ status: 'idle' });
    setAutoInitializationStoreCode(undefined);
    setProductListDraftFilters({ ...defaultProductListFilters });
    setProductListFilters({ ...defaultProductListFilters });
    setSelectedProductRowKeys([]);
    setProductDetailTabRequest(null);
    setActiveProductWorkspaceTabKey('product-manage');
    setProductWorkbenchSurfaceState({ status: 'idle' });
    setProductListUiStates({});
    setProductGalleryOpen(false);
    setProductGalleryImages([]);
    setProductGalleryTitle(undefined);
    setProductGallerySubtitle(undefined);
    productDetailTabHandledRef.current = null;
  }, [
    productDetailTabHandledRef,
    setActiveProductWorkspaceTabKey,
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
    setStoreInitializationState
  ]);
}
