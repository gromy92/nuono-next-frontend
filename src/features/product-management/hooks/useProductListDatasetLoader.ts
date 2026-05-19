import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { AuthSession } from '../../auth/session';
import { fetchProductListDataset } from '../api';
import type { ProductListDatasetState } from '../types';

type UseProductListDatasetLoaderParams = {
  activeOwnerId?: number;
  session: AuthSession | null;
  setProductListDatasetState: Dispatch<SetStateAction<ProductListDatasetState>>;
};

export function useProductListDatasetLoader({
  activeOwnerId,
  session,
  setProductListDatasetState
}: UseProductListDatasetLoaderParams) {
  const loadProductListDataset = useCallback(
    async (storeCode: string, ownerUserId?: number) => {
      const effectiveOwnerUserId = ownerUserId ?? activeOwnerId ?? session?.defaultOwnerUserId;
      if (!effectiveOwnerUserId || !storeCode) {
        setProductListDatasetState({ status: 'idle' });
        return;
      }

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
        setProductListDatasetState({ status: 'success', data: payload });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '商品工作台暂时不可用';
        setProductListDatasetState((currentValue) =>
          currentValue.status === 'success' ? currentValue : { status: 'error', message: errorMessage }
        );
      }
    },
    [activeOwnerId, session?.defaultOwnerUserId, setProductListDatasetState]
  );

  return {
    loadProductListDataset
  };
}
