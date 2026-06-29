import { useCallback, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { AuthSession } from '../../auth/session';
import { fetchProductListDataset } from '../api';
import type { ProductListDatasetState } from '../types';

type UseProductListDatasetLoaderParams = {
  activeOwnerId?: number;
  session: AuthSession | null;
  setProductListDatasetState: Dispatch<SetStateAction<ProductListDatasetState>>;
};

export type LoadProductListDatasetOptions = {
  force?: boolean;
};

export function useProductListDatasetLoader({
  activeOwnerId,
  session,
  setProductListDatasetState
}: UseProductListDatasetLoaderParams) {
  const loadedDatasetKeyRef = useRef<string | null>(null);
  const loadingDatasetKeyRef = useRef<string | null>(null);

  const loadProductListDataset = useCallback(
    async (storeCode: string, ownerUserId?: number, options: LoadProductListDatasetOptions = {}) => {
      const effectiveOwnerUserId = ownerUserId ?? activeOwnerId ?? session?.defaultOwnerUserId;
      if (!effectiveOwnerUserId || !storeCode) {
        loadedDatasetKeyRef.current = null;
        loadingDatasetKeyRef.current = null;
        setProductListDatasetState({ status: 'idle' });
        return;
      }

      const datasetKey = `${effectiveOwnerUserId}:${storeCode}`;
      if (!options.force && (loadedDatasetKeyRef.current === datasetKey || loadingDatasetKeyRef.current === datasetKey)) {
        return;
      }
      loadingDatasetKeyRef.current = datasetKey;

      setProductListDatasetState((currentValue) => {
        if (
          currentValue.status === 'success' &&
          currentValue.data.storeCode === storeCode &&
          currentValue.data.ownerUserId === effectiveOwnerUserId
        ) {
          return currentValue;
        }
        return { status: 'loading' };
      });

      try {
        const payload = await fetchProductListDataset({
          ownerUserId: effectiveOwnerUserId,
          storeCode
        });
        loadedDatasetKeyRef.current = datasetKey;
        setProductListDatasetState({ status: 'success', data: payload });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '商品工作台暂时不可用';
        setProductListDatasetState((currentValue) =>
          currentValue.status === 'success' ? currentValue : { status: 'error', message: errorMessage }
        );
      } finally {
        if (loadingDatasetKeyRef.current === datasetKey) {
          loadingDatasetKeyRef.current = null;
        }
      }
    },
    [activeOwnerId, session?.defaultOwnerUserId, setProductListDatasetState]
  );

  return {
    loadProductListDataset
  };
}
