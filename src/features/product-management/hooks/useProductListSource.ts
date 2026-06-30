import { useMemo } from 'react';
import { EMPTY_PRODUCT_ITEMS, MOCK_PRODUCT_ITEMS, mockSampleProducts } from '../mockData';
import { shouldEnableProductMockFallback, storeInitializationStatusMeta } from '../workspaceHelpers';
import {
  buildProductSummarySurfaceFromListItem,
  buildProductSummarySurfaceFromSample,
  isProductInitializationFailureStatus,
  isProductListDatasetReady,
  resolveProductInitializationStatus
} from '../utils';
import type { ProductListDatasetState, StoreInitializationState } from '../types';

type UseProductListSourceParams = {
  activeOwnerId?: number;
  productListDatasetState: ProductListDatasetState;
  selectedInitializationStoreCode?: string;
  storeInitializationState: StoreInitializationState;
};

export function useProductListSource({
  activeOwnerId,
  productListDatasetState,
  selectedInitializationStoreCode,
  storeInitializationState
}: UseProductListSourceParams) {
  const productListDataset =
    productListDatasetState.status === 'success' ? productListDatasetState.data : null;
  const productWorkspaceHasRealContext = Boolean(selectedInitializationStoreCode && activeOwnerId);
  const realProductListItems = productListDataset?.items ?? EMPTY_PRODUCT_ITEMS;
  const productMockFallbackEnabled = shouldEnableProductMockFallback();
  const usingMockProductList =
    productMockFallbackEnabled &&
    realProductListItems.length === 0 &&
    (!productWorkspaceHasRealContext || productListDatasetState.status === 'error');
  const productListSourceItems = usingMockProductList ? MOCK_PRODUCT_ITEMS : realProductListItems;
  const productListDatasetReady = !usingMockProductList && isProductListDatasetReady(productListDatasetState);
  const effectiveInitializationStatus = usingMockProductList
    ? undefined
    : resolveProductInitializationStatus(productListDatasetState, storeInitializationState);
  const productListItemBySkuParent = useMemo(
    () => {
      const itemsByKey = new Map<string, (typeof productListSourceItems)[number]>();
      productListSourceItems.forEach((item) => {
        if (item.partnerSku) {
          itemsByKey.set(item.partnerSku, item);
        }
        if (item.skuParent) {
          itemsByKey.set(item.skuParent, item);
        }
      });
      return itemsByKey;
    },
    [productListSourceItems]
  );
  const initializationSummaryItems = useMemo(
    () => (usingMockProductList ? [] : productListSourceItems.slice(0, 8).map((item) => buildProductSummarySurfaceFromListItem(item))),
    [productListSourceItems, usingMockProductList]
  );
  const quickOpenSummaryItems = useMemo(
    () =>
      usingMockProductList
        ? mockSampleProducts().slice(0, 5).map((item) => buildProductSummarySurfaceFromSample(item))
        : productListSourceItems.slice(0, 5).map((item) => buildProductSummarySurfaceFromListItem(item)),
    [productListSourceItems, usingMockProductList]
  );

  const initializationStatusMeta = usingMockProductList
    ? { label: '已载入', color: 'processing' as const }
    : storeInitializationStatusMeta(effectiveInitializationStatus ?? 'IDLE');

  const productListAvailable = productListSourceItems.length > 0;

  const productListDegraded =
    !usingMockProductList &&
    productListDatasetState.status === 'success' &&
    productListAvailable &&
    (productListDatasetState.data.source === 'init-snapshot-fallback' ||
      effectiveInitializationStatus === 'RUNNING');

  const productListInitializationFailed =
    !usingMockProductList &&
    !productListDatasetReady &&
    !productListAvailable &&
    isProductInitializationFailureStatus(effectiveInitializationStatus);

  const productListLastSyncedAt =
    productListDatasetState.status === 'success'
      ? productListDatasetState.data.lastDatasetSyncedAt ?? productListDatasetState.data.lastInitializedAt
      : storeInitializationState.status === 'success'
        ? storeInitializationState.data.lastInitializedAt
        : undefined;

  return {
    productListDataset,
    productWorkspaceHasRealContext,
    realProductListItems,
    productMockFallbackEnabled,
    usingMockProductList,
    productListSourceItems,
    productListItemBySkuParent,
    initializationSummaryItems,
    quickOpenSummaryItems,
    initializationStatusMeta,
    productListDatasetReady,
    effectiveInitializationStatus,
    productListAvailable,
    productListDegraded,
    productListInitializationFailed,
    productListLastSyncedAt
  };
}
