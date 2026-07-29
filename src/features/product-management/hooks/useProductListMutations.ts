import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { isProductListRowOnline } from '../utils/status';
import { getProductListRowIdentityKey } from '../../product-domain/productIdentity';
import type {
  ProductListDatasetState,
  ProductListUiState,
  StoreInitializationState
} from '../types';
import { useApplyProductListSummary } from './useApplyProductListSummary';

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

  const applyProductListSummary = useApplyProductListSummary({
    setProductListDatasetState,
    setStoreInitializationState,
    usingMockProductList
  });

  return {
    updateProductListUiState,
    applyProductListSummary,
    updateProductListLiveStatus
  };
}
