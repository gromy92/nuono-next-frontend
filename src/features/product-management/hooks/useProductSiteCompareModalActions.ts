import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { openProductWorkbenchSnapshot } from '../api';
import { createMockProductWorkbenchPayload } from '../workspaceHelpers';
import {
  buildProductSiteCompareModalFromRecord,
  buildProductSiteCompareModalFromWorkbench,
  getProductCurrentZCode
} from '../utils';
import type { ProductListRowPayload, ProductSiteCompareModalState } from '../types';

type UseProductSiteCompareModalActionsParams = {
  activeOwnerId?: number;
  selectedInitializationStoreCode?: string;
  usingMockProductList: boolean;
  setProductSiteCompareModalState: Dispatch<SetStateAction<ProductSiteCompareModalState>>;
};

export function useProductSiteCompareModalActions({
  activeOwnerId,
  selectedInitializationStoreCode,
  usingMockProductList,
  setProductSiteCompareModalState
}: UseProductSiteCompareModalActionsParams) {
  const openProductSiteCompareModal = useCallback(
    async (record: ProductListRowPayload) => {
      setProductSiteCompareModalState(buildProductSiteCompareModalFromRecord(record, { loading: true }));

      if (usingMockProductList) {
        setProductSiteCompareModalState(buildProductSiteCompareModalFromWorkbench(
          createMockProductWorkbenchPayload(record),
          record
        ));
        return;
      }

      const effectiveStoreCode = record.referenceStoreCode || selectedInitializationStoreCode;
      const currentZCode = getProductCurrentZCode(record);
      if (!activeOwnerId || !effectiveStoreCode || !(record.partnerSku || currentZCode)) {
        setProductSiteCompareModalState(buildProductSiteCompareModalFromRecord(record, {
          loading: false,
          note: '当前商品缺少老板、店铺或 SKU 上下文，暂时只能展示列表聚合数据。'
        }));
        return;
      }

      try {
        const payload = await openProductWorkbenchSnapshot({
          ownerUserId: activeOwnerId,
          storeCode: effectiveStoreCode,
          skuParent: currentZCode,
          currentZCode,
          partnerSku: record.partnerSku,
          pskuCode: record.pskuCode
        });
        if (!payload.ready) {
          throw new Error(payload.message || '站点经营面暂时不可用。');
        }
        setProductSiteCompareModalState(buildProductSiteCompareModalFromWorkbench(payload, record));
      } catch (error) {
        setProductSiteCompareModalState(buildProductSiteCompareModalFromRecord(record, {
          loading: false,
          note: error instanceof Error ? error.message : '站点经营面暂时不可用。'
        }));
      }
    },
    [activeOwnerId, selectedInitializationStoreCode, setProductSiteCompareModalState, usingMockProductList]
  );

  return {
    openProductSiteCompareModal
  };
}
