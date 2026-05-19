import { useCallback, useState } from 'react';
import { message } from 'antd';
import { deleteLocalProduct } from '../api';
import type { ProductListDatasetState, ProductListRowPayload } from '../types';

type UseProductLocalDeletionParams = {
  activeOwnerId?: number;
  closeProductDetailTab: () => void;
  currentProductSkuParent?: string;
  selectedInitializationStoreCode?: string;
  setProductListDatasetState: (state: ProductListDatasetState | ((current: ProductListDatasetState) => ProductListDatasetState)) => void;
};

export function useProductLocalDeletion({
  activeOwnerId,
  closeProductDetailTab,
  currentProductSkuParent,
  selectedInitializationStoreCode,
  setProductListDatasetState
}: UseProductLocalDeletionParams) {
  const [deletingProductSkuParent, setDeletingProductSkuParent] = useState<string>();

  const requestDeleteLocalProduct = useCallback(
    async (record: ProductListRowPayload) => {
      const storeCode = record.referenceStoreCode || selectedInitializationStoreCode;
      if (!activeOwnerId || !storeCode || !record.skuParent) {
        message.warning('缺少老板、店铺或商品上下文，暂时不能删除。');
        return;
      }

      setDeletingProductSkuParent(record.skuParent);
      try {
        const payload = await deleteLocalProduct({
          ownerUserId: activeOwnerId,
          storeCode,
          skuParent: record.skuParent,
          partnerSku: record.partnerSku,
          pskuCode: record.pskuCode
        });
        setProductListDatasetState({ status: 'success', data: payload });
        if (currentProductSkuParent === record.skuParent) {
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
