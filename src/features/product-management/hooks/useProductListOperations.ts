import { createProductListColumns } from '../productListColumns';
import type { Dispatch, SetStateAction } from 'react';
import type {
  ProductListDatasetState,
  ProductListRowPayload,
  ProductListUiState
} from '../types';
import { useProductLocalDeletion } from './useProductLocalDeletion';
import { useProductOperationStage } from './useProductOperationStage';

type DatasetSetter = Dispatch<SetStateAction<ProductListDatasetState>>;
type ProductListColumnParams = Parameters<typeof createProductListColumns>[0];

export function useProductListOperations({
  activeOwnerId,
  closeProductDetailTab,
  currentProductIdentityKey,
  openProductHistoryModal,
  openProductListGallery,
  openProductSiteCompareModal,
  openProductVariantSpecModal,
  openProductWorkbenchInPageTab,
  productListUiStates,
  productSnapshotSubmitting,
  selectedInitializationStoreCode,
  setProductListDatasetState,
  updateProductListLiveStatus,
  usingMockProductList
}: {
  activeOwnerId?: number;
  closeProductDetailTab: () => void;
  currentProductIdentityKey?: string;
  openProductHistoryModal: ProductListColumnParams['openProductHistoryModal'];
  openProductListGallery: ProductListColumnParams['openProductListGallery'];
  openProductSiteCompareModal: ProductListColumnParams['openProductSiteCompareModal'];
  openProductVariantSpecModal: (record: ProductListRowPayload) => void;
  openProductWorkbenchInPageTab: ProductListColumnParams['openProductWorkbenchInPageTab'];
  productListUiStates: Record<string, ProductListUiState>;
  productSnapshotSubmitting: boolean;
  selectedInitializationStoreCode?: string;
  setProductListDatasetState: DatasetSetter;
  updateProductListLiveStatus: (skuParent: string | undefined, liveActive: boolean) => void;
  usingMockProductList: boolean;
}) {
  const productLocalDeletion = useProductLocalDeletion({
    activeOwnerId,
    closeProductDetailTab,
    currentProductIdentityKey,
    selectedInitializationStoreCode,
    setProductListDatasetState
  });
  const productOperationStage = useProductOperationStage({
    activeOwnerId,
    selectedInitializationStoreCode,
    setProductListDatasetState
  });
  const productListColumns = createProductListColumns({
    deletingProductKey: productLocalDeletion.deletingProductKey,
    rebuildingProductKey: productLocalDeletion.rebuildingProductKey,
    updatingOperationStageKey: productOperationStage.updatingOperationStageKey,
    productSnapshotSubmitting,
    usingMockProductList,
    productListUiStates,
    openProductListGallery,
    openProductWorkbenchInPageTab,
    openProductHistoryModal,
    openProductVariantSpecModal,
    openProductSiteCompareModal,
    requestDeleteLocalProduct: productLocalDeletion.requestDeleteLocalProduct,
    requestRebuildLocalProduct: productLocalDeletion.requestRebuildLocalProduct,
    requestUpdateProductOperationStage: productOperationStage.requestUpdateProductOperationStage,
    updateProductListLiveStatus
  });

  return { productListColumns, productLocalDeletion, productOperationStage };
}
