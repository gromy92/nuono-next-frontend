import { useCallback, useState } from 'react';
import { message } from 'antd';
import { updateProductOperationStage } from '../api';
import type { ProductListDatasetState, ProductListRowPayload, ProductOperationStageCode } from '../types';
import { getProductCurrentZCode, getProductListRowIdentityKey } from '../utils';
import { normalizeProductOperationStageCode, productOperationStageMeta } from '../utils/operationStage';

type UseProductOperationStageParams = {
  activeOwnerId?: number;
  selectedInitializationStoreCode?: string;
  setProductListDatasetState: (
    state: ProductListDatasetState | ((current: ProductListDatasetState) => ProductListDatasetState)
  ) => void;
};

export function useProductOperationStage({
  activeOwnerId,
  selectedInitializationStoreCode,
  setProductListDatasetState
}: UseProductOperationStageParams) {
  const [updatingOperationStageKey, setUpdatingOperationStageKey] = useState<string>();

  const requestUpdateProductOperationStage = useCallback(
    async (record: ProductListRowPayload, nextStageCode?: ProductOperationStageCode | string) => {
      const storeCode = record.referenceStoreCode || selectedInitializationStoreCode;
      const currentZCode = getProductCurrentZCode(record);
      const operationStageCode = normalizeProductOperationStageCode(nextStageCode);

      if (!activeOwnerId || !storeCode || !record.partnerSku) {
        message.warning('缺少老板、店铺或商品 PSKU，暂时不能修改运营阶段。');
        return;
      }

      setUpdatingOperationStageKey(getProductListRowIdentityKey(record));
      try {
        const payload = await updateProductOperationStage({
          ownerUserId: activeOwnerId,
          storeCode,
          skuParent: currentZCode,
          currentZCode,
          partnerSku: record.partnerSku,
          pskuCode: record.pskuCode,
          operationStageCode
        });
        setProductListDatasetState({ status: 'success', data: payload });
        message.success(payload.message || `商品运营阶段已更新为${productOperationStageMeta(operationStageCode).label}。`);
      } catch (error) {
        message.error(error instanceof Error ? error.message : '修改商品运营阶段失败');
      } finally {
        setUpdatingOperationStageKey(undefined);
      }
    },
    [activeOwnerId, selectedInitializationStoreCode, setProductListDatasetState]
  );

  return {
    updatingOperationStageKey,
    requestUpdateProductOperationStage
  };
}
