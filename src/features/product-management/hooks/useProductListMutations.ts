import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  isProductListRowOnline,
  getProductListRowIdentityKey,
  mergeProductListItemWithSummary,
  mergeSampleProductWithSummary,
  normalizeProductSyncStatus,
  productListSummaryAppliesToItem,
  textInputValue
} from '../utils';
import type {
  ProductListDatasetState,
  ProductListRowPayload,
  ProductListSummaryPayload,
  ProductListUiState,
  StoreInitializationPayload,
  StoreInitializationState
} from '../types';

type UseProductListMutationsParams = {
  setProductListDatasetState: Dispatch<SetStateAction<ProductListDatasetState>>;
  setProductListUiStates: Dispatch<SetStateAction<Record<string, ProductListUiState>>>;
  setStoreInitializationState: Dispatch<SetStateAction<StoreInitializationState>>;
  usingMockProductList: boolean;
};

function liveStatusValue(liveActive: boolean) {
  return liveActive ? 'LIVE' : 'NOT LIVE';
}

function replaceLiveStatuses(currentStatuses: string[] | undefined, liveActive: boolean) {
  const nextStatus = liveStatusValue(liveActive);
  return currentStatuses?.length ? currentStatuses.map(() => nextStatus) : [nextStatus];
}

function storeCodeMatches(summaryStoreCode?: string, targetStoreCode?: string) {
  const summaryStore = textInputValue(summaryStoreCode);
  const targetStore = textInputValue(targetStoreCode);
  return !summaryStore || !targetStore || summaryStore === targetStore;
}

function summaryAppliesToListStore(summary: ProductListSummaryPayload, listStoreCode?: string) {
  return storeCodeMatches(summary.storeCode, listStoreCode);
}

function summaryAppliesToListItem(item: ProductListRowPayload, summary: ProductListSummaryPayload) {
  return productListSummaryAppliesToItem(item, summary) && storeCodeMatches(summary.storeCode, item.referenceStoreCode);
}

function summaryAppliesToSampleProduct(
  item: StoreInitializationPayload['sampleProducts'][number],
  summary: ProductListSummaryPayload
) {
  return productListSummaryAppliesToItem(item, summary) && storeCodeMatches(summary.storeCode, item.storeCode);
}

export function useProductListMutations({
  setProductListDatasetState,
  setProductListUiStates,
  setStoreInitializationState,
  usingMockProductList
}: UseProductListMutationsParams) {
  const updateProductListUiState = useCallback(
    (identityKey: string | undefined, nextState: ProductListUiState) => {
      if (!identityKey || !usingMockProductList) {
        return;
      }

      setProductListUiStates((currentValue) => ({
        ...currentValue,
        [identityKey]: {
          ...currentValue[identityKey],
          ...nextState
        }
      }));
    },
    [setProductListUiStates, usingMockProductList]
  );

  const updateProductListLiveStatus = useCallback(
    (identityKey: string | undefined, liveActive: boolean) => {
      if (!identityKey || !usingMockProductList) {
        return;
      }

      setProductListDatasetState((currentValue) => {
        if (currentValue.status !== 'success') {
          return currentValue;
        }

        let changed = false;
        const nextItems = currentValue.data.items.map((item) => {
          if (getProductListRowIdentityKey(item) !== identityKey) {
            return item;
          }
          changed = true;
          return {
            ...item,
            liveStatus: liveStatusValue(liveActive),
            isActive: liveActive,
            liveStatuses: replaceLiveStatuses(item.liveStatuses, liveActive)
          };
        });

        if (!changed) {
          return currentValue;
        }

        return {
          status: 'success',
          data: {
            ...currentValue.data,
            items: nextItems,
            liveCount: nextItems.filter(isProductListRowOnline).length
          }
        };
      });

      setStoreInitializationState((currentValue) => {
        if (currentValue.status !== 'success') {
          return currentValue;
        }

        let productItemChanged = false;
        const nextProductItems = currentValue.data.productItems.map((item) => {
          if (getProductListRowIdentityKey(item) !== identityKey) {
            return item;
          }
          productItemChanged = true;
          return {
            ...item,
            liveStatus: liveStatusValue(liveActive),
            isActive: liveActive,
            liveStatuses: replaceLiveStatuses(item.liveStatuses, liveActive)
          };
        });

        let sampleProductChanged = false;
        const nextSampleProducts = currentValue.data.sampleProducts.map((item) => {
          if (getProductListRowIdentityKey(item) !== identityKey) {
            return item;
          }
          sampleProductChanged = true;
          return {
            ...item,
            liveStatus: liveStatusValue(liveActive)
          };
        });

        if (!productItemChanged && !sampleProductChanged) {
          return currentValue;
        }

        return {
          status: 'success',
          data: {
            ...currentValue.data,
            productItems: nextProductItems,
            sampleProducts: nextSampleProducts
          }
        };
      });
    },
    [setProductListDatasetState, setStoreInitializationState, usingMockProductList]
  );

  const applyProductListSummary = useCallback(
    (summary?: ProductListSummaryPayload) => {
      if (!(summary?.partnerSku || summary?.currentZCode || summary?.skuParent) || usingMockProductList) {
        return;
      }

      setProductListDatasetState((currentValue) => {
        if (currentValue.status !== 'success') {
          return currentValue;
        }
        if (!summaryAppliesToListStore(summary, currentValue.data.storeCode)) {
          return currentValue;
        }

        let itemChanged = false;
        const nextItems = currentValue.data.items.map((item) => {
          if (!summaryAppliesToListItem(item, summary)) {
            return item;
          }
          itemChanged = true;
          return mergeProductListItemWithSummary(item, summary);
        });

        if (!itemChanged) {
          nextItems.unshift(
            mergeProductListItemWithSummary(
              {
                skuParent: summary.currentZCode || summary.skuParent || '',
                currentZCode: summary.currentZCode || summary.skuParent,
                productMasterId: summary.productMasterId,
                productVariantId: summary.productVariantId,
                productSiteOfferId: summary.productSiteOfferId,
                partnerSku: summary.partnerSku,
                pskuCode: summary.pskuCode,
                offerCode: summary.offerCode,
                referenceStoreCode: summary.storeCode,
                title: summary.title,
                brand: summary.brand,
                imageUrl: summary.imageUrl,
                referencePrice: summary.referencePrice,
                originalPrice: summary.originalPrice,
                salePrice: summary.salePrice,
                productFulltype: summary.productFulltype,
                skuGroup: textInputValue(summary.skuGroup) || undefined,
                groupRef: textInputValue(summary.groupRef) || undefined,
                groupRefCanonical: textInputValue(summary.groupRefCanonical) || undefined,
                isActive: summary.isActive,
                maintenanceEnabled: summary.maintenanceEnabled,
                syncStatus: summary.syncStatus,
                listingStartedAt: summary.listingStartedAt,
                listingStartedSource: summary.listingStartedSource,
                lastSyncedAt: summary.lastSyncedAt,
                lastDraftSavedAt: summary.lastDraftSavedAt,
                variantCount: summary.variantCount,
                siteOfferCount: summary.siteOfferCount,
                historyMetaReady: summary.historyMetaReady,
                pendingKeyContentHistoryCount: summary.pendingKeyContentHistoryCount,
                visibleKeyContentHistoryCount: summary.visibleKeyContentHistoryCount,
                pendingKeyContentHistoryVisibleAfter: summary.pendingKeyContentHistoryVisibleAfter,
                siteLabels: summary.siteLabels ?? [],
                liveStatuses: summary.liveStatuses ?? [],
                issueTags: [],
                totalFbnStock: summary.totalFbnStock,
                totalSupermallStock: summary.totalSupermallStock,
                totalFbpStock: summary.totalFbpStock
              },
              summary
            )
          );
        }

        const nextCounts = nextItems.reduce(
          (accumulator, item) => {
            const syncStatus = normalizeProductSyncStatus(item.syncStatus) ?? 'synced';
            accumulator[syncStatus] += 1;
            if (isProductListRowOnline(item)) {
              accumulator.liveCount += 1;
            }
            if (item.skuGroup || item.groupRef || item.groupRefCanonical) {
              accumulator.groupedCount += 1;
            }
            if (!item.referencePrice) {
              accumulator.pendingPriceCount += 1;
            }
            if (item.historyMetaReady) {
              accumulator.historyReadyCount += 1;
            }
            return accumulator;
          },
          {
            synced: 0,
            draft: 0,
            conflict: 0,
            failed: 0,
            liveCount: 0,
            groupedCount: 0,
            pendingPriceCount: 0,
            historyReadyCount: 0
          }
        );

        return {
          status: 'success',
          data: {
            ...currentValue.data,
            items: nextItems,
            totalItems: nextItems.length,
            syncedCount: nextCounts.synced,
            draftCount: nextCounts.draft,
            conflictCount: nextCounts.conflict,
            failedCount: nextCounts.failed,
            liveCount: nextCounts.liveCount,
            groupedCount: nextCounts.groupedCount,
            pendingPriceCount: nextCounts.pendingPriceCount,
            historyReadyCount: nextCounts.historyReadyCount,
            lastDatasetSyncedAt: summary.lastSyncedAt ?? currentValue.data.lastDatasetSyncedAt
          }
        };
      });

      setStoreInitializationState((currentValue) => {
        if (currentValue.status !== 'success') {
          return currentValue;
        }
        if (!summaryAppliesToListStore(summary, currentValue.data.storeCode)) {
          return currentValue;
        }

        let productItemChanged = false;
        const nextProductItems = currentValue.data.productItems.map((item) => {
          if (!summaryAppliesToListItem(item, summary)) {
            return item;
          }
          productItemChanged = true;
          return mergeProductListItemWithSummary(item, summary);
        });

        let sampleProductChanged = false;
        const nextSampleProducts = currentValue.data.sampleProducts.map((item) => {
          if (!summaryAppliesToSampleProduct(item, summary)) {
            return item;
          }
          sampleProductChanged = true;
          return mergeSampleProductWithSummary(item, summary);
        });

        if (!productItemChanged && !sampleProductChanged) {
          return currentValue;
        }

        return {
          status: 'success',
          data: {
            ...currentValue.data,
            productItems: nextProductItems,
            sampleProducts: nextSampleProducts
          }
        };
      });
    },
    [setProductListDatasetState, setStoreInitializationState, usingMockProductList]
  );

  return {
    updateProductListUiState,
    applyProductListSummary,
    updateProductListLiveStatus
  };
}
