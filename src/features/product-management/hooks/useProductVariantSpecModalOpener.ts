import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { message } from 'antd';
import type { ProductListRowPayload, ProductVariantSpecModalState } from '../types';

export function useProductVariantSpecModalOpener({
  activeOwnerId,
  defaultOwnerUserId,
  selectedInitializationStoreCode,
  setProductVariantSpecModalState
}: {
  activeOwnerId?: number;
  defaultOwnerUserId?: number;
  selectedInitializationStoreCode?: string;
  setProductVariantSpecModalState: Dispatch<SetStateAction<ProductVariantSpecModalState>>;
}) {
  return useCallback(
    (record: ProductListRowPayload) => {
      const ownerUserId = activeOwnerId ?? defaultOwnerUserId;
      const storeCode = selectedInitializationStoreCode ?? record.referenceStoreCode;
      const skuParent = record.currentZCode || record.skuParent;

      if (!ownerUserId || !storeCode || !(record.partnerSku || skuParent)) {
        message.warning('缺少老板、店铺或商品上下文，暂时不能维护规格。');
        return;
      }

      setProductVariantSpecModalState({
        open: true,
        ownerUserId,
        storeCode,
        skuParent,
        currentZCode: skuParent,
        title: record.title || record.partnerSku || skuParent,
        partnerSku: record.partnerSku,
        variantId: record.productVariantId,
        imageUrl: record.imageUrl
      });
    },
    [activeOwnerId, defaultOwnerUserId, selectedInitializationStoreCode, setProductVariantSpecModalState]
  );
}
