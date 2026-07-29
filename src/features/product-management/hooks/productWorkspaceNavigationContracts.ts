import type { FormInstance } from 'antd';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { AuthSession } from '../../auth/session';
import type {
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

export type UseProductWorkspaceNavigationParams = {
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
      currentZCode: string;
      partnerSku: string;
      pskuCode: string;
    }>,
    options?: {
      forceReal?: boolean;
      context?: ProductWorkbenchContext;
      discardPersistedDraft?: boolean;
    }
  ) => Promise<void>;
  openMockProductWorkbench: (skuParent?: string) => void;
  syncProductWorkspacePath: () => void;
  usingMockProductList: boolean;
};
