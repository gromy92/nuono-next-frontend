import { useCallback, useState } from 'react';
import { message } from 'antd';
import { deleteLocalProduct } from '../api';
import type { ProductListDatasetState, ProductListRowPayload } from '../types';
import { getProductCurrentZCode, getProductListRowIdentityKey } from '../utils';

type UseProductLocalDeletionParams = {
  activeOwnerId?: number;
  closeProductDetailTab: () => void;
  currentProductSkuParent?: string;
  currentProductIdentityKey?: string;
  selectedInitializationStoreCode?: string;
  setProductListDatasetState: (state: ProductListDatasetState | ((current: ProductListDatasetState) => ProductListDatasetState)) => void;
};

export function useProductLocalDeletion({
  activeOwnerId,
  closeProductDetailTab,
  currentProductSkuParent,
  currentProductIdentityKey,
  selectedInitializationStoreCode,
  setProductListDatasetState
}: UseProductLocalDeletionParams) {
  const [deletingProductSkuParent, setDeletingProductSkuParent] = useState<string>();

  const requestDeleteLocalProduct = useCallback(
    async (record: ProductListRowPayload) => {
      const storeCode = record.referenceStoreCode || selectedInitializationStoreCode;
      const currentZCode = getProductCurrentZCode(record);
      if (!activeOwnerId || !storeCode || !(record.partnerSku || currentZCode)) {
        message.warning('缺少老板、店铺或商品上下文，暂时不能删除。');
        return;
      }

      setDeletingProductSkuParent(getProductListRowIdentityKey(record));
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
        if (currentProductIdentityKey === getProductListRowIdentityKey(record) || currentProductSkuParent === record.skuParent) {
          closeProductDetailTab();
        }
        message.success('商品已从本地商品目录删除。');
      } catch (error) {
        message.error(error instanceof Error ? error.message : '删除商品失败');
      } finally {
        setDeletingProductSkuParent(undefined);
      }
    },
    [
      activeOwnerId,
      closeProductDetailTab,
      currentProductIdentityKey,
      currentProductSkuParent,
      selectedInitializationStoreCode,
      setProductListDatasetState
    ]
  );

  return {
    deletingProductSkuParent,
    productLocalDeletionConfirmModal: null,
    requestDeleteLocalProduct
  };
}
