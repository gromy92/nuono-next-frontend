import { useCallback, useState } from 'react';
import { message } from 'antd';
import { deleteLocalProduct, rebuildLocalProduct } from '../api';
import type { ProductListDatasetState, ProductListRowPayload } from '../types';
import { getProductCurrentZCode, getProductListRowIdentityKey, normalizeProductSourceType } from '../utils';

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
  const [rebuildingProductKey, setRebuildingProductKey] = useState<string>();

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

  const requestRebuildLocalProduct = useCallback(
    async (record: ProductListRowPayload) => {
      if (normalizeProductSourceType(record.productSourceType) !== 'SELF_BUILT') {
        message.warning('商品重建当前只支持自建品。');
        return;
      }
      const storeCode = record.referenceStoreCode || selectedInitializationStoreCode;
      const currentZCode = getProductCurrentZCode(record);
      if (!activeOwnerId || !storeCode || !(record.partnerSku || currentZCode)) {
        message.warning('缺少老板、店铺或商品上下文，暂时不能重建。');
        return;
      }

      setRebuildingProductKey(getProductListRowIdentityKey(record));
      try {
        const payload = await rebuildLocalProduct({
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
        message.success(payload.message || '商品重建已提交后台处理。');
      } catch (error) {
        message.error(error instanceof Error ? error.message : '重建商品失败');
      } finally {
        setRebuildingProductKey(undefined);
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
    rebuildingProductKey,
    productLocalDeletionConfirmModal: null,
    requestDeleteLocalProduct,
    requestRebuildLocalProduct
  };
}
