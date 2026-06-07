import { useEffect } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { AuthSession } from '../../auth/session';
import type {
  ProductDetailTabRequest,
  ProductWorkbenchContext,
  ProductWorkbenchSurfaceState,
  ProductWorkspaceTabKey
} from '../types';

type UseProductDetailTabLifecycleParams = {
  activeOwnerId?: number;
  activeProductWorkspaceTabKey: ProductWorkspaceTabKey;
  enabled: boolean;
  openMockProductWorkbench: (skuParent?: string) => void;
  productDetailTabHandledRef: MutableRefObject<string | null>;
  productDetailTabRequest: ProductDetailTabRequest | null;
  selectedInitializationStoreCode?: string;
  session: AuthSession | null;
  setProductWorkbenchSurfaceState: Dispatch<SetStateAction<ProductWorkbenchSurfaceState>>;
  submitProductSnapshot: (
    nextValues?: Partial<{
      storeCode: string;
      noonUser: string;
      noonPassword: string;
      skuParent: string;
      partnerSku: string;
      pskuCode: string;
    }>,
    options?: { forceReal?: boolean; context?: ProductWorkbenchContext }
  ) => Promise<void>;
};

export function useProductDetailTabLifecycle({
  activeOwnerId,
  activeProductWorkspaceTabKey,
  enabled,
  openMockProductWorkbench,
  productDetailTabHandledRef,
  productDetailTabRequest,
  selectedInitializationStoreCode,
  session,
  setProductWorkbenchSurfaceState,
  submitProductSnapshot
}: UseProductDetailTabLifecycleParams) {
  useEffect(() => {
    if (!enabled || !session || !productDetailTabRequest || activeProductWorkspaceTabKey !== 'product-detail') {
      return;
    }

    const requestKey = JSON.stringify(productDetailTabRequest);
    if (productDetailTabHandledRef.current === requestKey) {
      return;
    }

    if (productDetailTabRequest.mode === 'mock') {
      productDetailTabHandledRef.current = requestKey;
      openMockProductWorkbench(productDetailTabRequest.skuParent);
      return;
    }

    if (!activeOwnerId) {
      return;
    }

    const storeCode = productDetailTabRequest.storeCode || selectedInitializationStoreCode;
    if (!storeCode) {
      productDetailTabHandledRef.current = requestKey;
      setProductWorkbenchSurfaceState((currentValue) => ({
        status: 'error',
        context: currentValue.status === 'idle' ? undefined : currentValue.context,
        message: '当前商品缺少逻辑店铺上下文，暂时不能读取详情。'
      }));
      return;
    }

    productDetailTabHandledRef.current = requestKey;
    void submitProductSnapshot(
      {
        storeCode,
        skuParent: productDetailTabRequest.skuParent,
        partnerSku: productDetailTabRequest.partnerSku,
        pskuCode: productDetailTabRequest.pskuCode
      },
      { forceReal: true }
    );
  }, [
    activeOwnerId,
    activeProductWorkspaceTabKey,
    enabled,
    openMockProductWorkbench,
    productDetailTabHandledRef,
    productDetailTabRequest,
    selectedInitializationStoreCode,
    session,
    setProductWorkbenchSurfaceState,
    submitProductSnapshot
  ]);
}
