import { useProductGalleryActions } from './useProductGalleryActions';
import { useProductHistoryModalActions } from './useProductHistoryModalActions';
import { useProductSiteCompareModalActions } from './useProductSiteCompareModalActions';
import { useProductWorkspaceState } from './useProductWorkspaceState';
import type {
  ProductListSummaryPayload,
  ProductListUiState,
  ProductMasterSnapshotPayload,
  ProductSummarySurface,
  ProductWorkbenchState
} from '../types';

type ProductWorkspaceState = ReturnType<typeof useProductWorkspaceState>;

type UseProductMediaAndHistoryActionsParams = {
  activeOwnerId?: number;
  applyProductListSummary: (summary?: ProductListSummaryPayload) => void;
  currentProductSkuParent?: string;
  currentProductSummarySurface: ProductSummarySurface | null;
  productImageUrls: string[];
  productListUiStates: Record<string, ProductListUiState>;
  productSnapshotView?: ProductMasterSnapshotPayload;
  productWorkbenchState: ProductWorkbenchState | null;
  selectedInitializationStoreCode?: string;
  sessionDefaultOwnerUserId?: number;
  usingMockProductList: boolean;
  workspaceState: ProductWorkspaceState;
};

export function useProductMediaAndHistoryActions({
  activeOwnerId,
  applyProductListSummary,
  currentProductSkuParent,
  currentProductSummarySurface,
  productImageUrls,
  productListUiStates,
  productSnapshotView,
  productWorkbenchState,
  selectedInitializationStoreCode,
  sessionDefaultOwnerUserId,
  usingMockProductList,
  workspaceState
}: UseProductMediaAndHistoryActionsParams) {
  const galleryActions = useProductGalleryActions({
    activeOwnerId,
    applyProductListSummary,
    currentProductSkuParent,
    currentProductSummarySurface,
    productGalleryImages: workspaceState.productGalleryImages,
    productImageUrls,
    productSnapshotView,
    selectedInitializationStoreCode,
    setProductGalleryOpen: workspaceState.setProductGalleryOpen,
    setProductGalleryImages: workspaceState.setProductGalleryImages,
    setProductGalleryIndex: workspaceState.setProductGalleryIndex,
    setProductGalleryTitle: workspaceState.setProductGalleryTitle,
    setProductGallerySubtitle: workspaceState.setProductGallerySubtitle
  });

  const historyActions = useProductHistoryModalActions({
    activeOwnerId,
    applyProductListSummary,
    currentProductSkuParent,
    currentProductSummarySurface,
    productListUiStates,
    productWorkbenchState,
    selectedInitializationStoreCode,
    sessionDefaultOwnerUserId,
    usingMockProductList,
    setProductHistoryModalTitle: workspaceState.setProductHistoryModalTitle,
    setProductHistoryModalSummary: workspaceState.setProductHistoryModalSummary,
    setProductHistoryModalEntryLabel: workspaceState.setProductHistoryModalEntryLabel,
    setProductHistoryModalEntryColor: workspaceState.setProductHistoryModalEntryColor,
    setProductHistoryModalItems: workspaceState.setProductHistoryModalItems,
    setProductHistoryModalNote: workspaceState.setProductHistoryModalNote,
    setProductHistoryModalHistoryMetaReady: workspaceState.setProductHistoryModalHistoryMetaReady,
    setProductHistoryModalVisibleHistoryCount: workspaceState.setProductHistoryModalVisibleHistoryCount,
    setProductHistoryModalPendingCount: workspaceState.setProductHistoryModalPendingCount,
    setProductHistoryModalPendingVisibleAfter: workspaceState.setProductHistoryModalPendingVisibleAfter,
    setProductHistoryModalOpen: workspaceState.setProductHistoryModalOpen,
    setProductHistoryModalLoading: workspaceState.setProductHistoryModalLoading
  });

  const siteCompareActions = useProductSiteCompareModalActions({
    activeOwnerId,
    selectedInitializationStoreCode,
    usingMockProductList,
    setProductSiteCompareModalState: workspaceState.setProductSiteCompareModalState
  });

  return {
    ...galleryActions,
    ...historyActions,
    ...siteCompareActions
  };
}
