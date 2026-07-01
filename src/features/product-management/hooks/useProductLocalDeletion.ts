import { useCallback, useState } from 'react';
import { message } from 'antd';
import { deleteLocalProduct } from '../api';
import type { ProductListDatasetState, ProductListRowPayload } from '../types';
import { getProductCurrentZCode, getProductListRowIdentityKey } from '../utils';

type UseProductLocalDeletionParams = {
  activeOwnerId?: number;
  closeProductDetailTab: () => void;
  currentProductIdentityKey?: string;
  selectedInitializationStoreCode?: string;
  setProductListDatasetState: (state: ProductListDatasetState | ((current: ProductListDatasetState) => ProductListDatasetState)) => void;
};

export function useProductLocalDeletion({
  activeOwnerId,
  closeProductDetailTab,
  currentProductIdentityKey,
  selectedInitializationStoreCode,
  setProductListDatasetState
}: UseProductLocalDeletionParams) {
  const [deletingProductKey, setDeletingProductKey] = useState<string>();

  const requestDeleteLocalProduct = useCallback(
    async (record: ProductListRowPayload) => {
      const storeCode = record.referenceStoreCode || selectedInitializationStoreCode;
      const currentZCode = getProductCurrentZCode(record);
      if (!activeOwnerId || !storeCode || !(record.partnerSku || currentZCode)) {
        message.warning('缺少老板、店铺或商品上下文，暂时不能删除。');
        return;
      }

      setDeletingProductKey(getProductListRowIdentityKey(record));
      try {
        const payload = await deleteLocalProduct({
          ownerUserId: activeOwnerId,
          storeCode,
          skuParent: currentZCode,
          currentZCode,
          partnerSku: record.partnerSku,
          pskuCode: record.pskuCode
        });
        setProductListDatasetState({ status: 'success', data: payload });
        if (currentProductIdentityKey === getProductListRowIdentityKey(record)) {
          closeProductDetailTab();
        }
        message.success(payload.message || '商品删除已提交后台处理，请在发布状态和历史中查看进度。');
      } catch (error) {
        message.error(error instanceof Error ? error.message : '删除商品失败');
      } finally {
        setDeletingProductKey(undefined);
      }
    },
    [
      activeOwnerId,
      closeProductDetailTab,
      currentProductIdentityKey,
      selectedInitializationStoreCode,
      setProductListDatasetState
    ]
  );

  return {
    deletingProductKey,
    productLocalDeletionConfirmModal: null,
    requestDeleteLocalProduct
  };
}
