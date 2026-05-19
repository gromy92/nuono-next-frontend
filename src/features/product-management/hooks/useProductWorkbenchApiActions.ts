import { useCallback, useRef } from 'react';
import { message } from 'antd';
import type { FormInstance } from 'antd';
import { openProductWorkbenchSnapshot } from '../api';
import { findMockProductItem } from '../mockData';
import {
  buildProductSummarySurfaceFromListItem,
  buildProductWorkbenchContext,
  cloneSnapshotPayload
} from '../utils';
import type {
  ProductListRowPayload,
  ProductListUiState,
  ProductMasterSnapshotPayload,
  ProductWorkbenchAction,
  ProductWorkbenchContext,
  ProductWorkbenchPayload,
  ProductWorkbenchState,
  ProductWorkbenchSurfaceState
} from '../types';
import { useProductWorkbenchActionSubmitter } from './useProductWorkbenchActionSubmitter';
import type { ReadyProductWorkbenchSurfaceUpdater } from './useProductWorkbenchSurfaceActions';

type ProductSnapshotRequestValues = Partial<{
  storeCode: string;
  noonUser: string;
  noonPassword: string;
  skuParent: string;
  partnerSku: string;
  pskuCode: string;
}>;

type ProductQuickOpenSample = {
  skuParent: string;
  partnerSku?: string;
  pskuCode?: string;
  storeCode?: string;
  referenceStoreCode?: string;
};

type UseProductWorkbenchApiActionsParams = {
  activeOwnerId?: number;
  activeProductSiteOffer?: Record<string, unknown>;
  applyMockProductAction: (action: ProductWorkbenchAction) => void;
  applyProductWorkbenchResponse: (payload: ProductWorkbenchPayload, context?: ProductWorkbenchContext) => ProductWorkbenchState;
  currentProductSkuParent?: string;
  openMockProductWorkbench: (skuParent?: string) => void;
  productDraftDirty: boolean;
  productListItemBySkuParent: Map<string, ProductListRowPayload>;
  productSnapshotForm: FormInstance;
  productSnapshotView?: ProductMasterSnapshotPayload;
  productWorkbenchState: ProductWorkbenchState | null;
  productWorkbenchSurfaceState: ProductWorkbenchSurfaceState;
  selectedInitializationStoreCode?: string;
  setProductActionSubmitting: (submitting: boolean) => void;
  setProductSnapshotSubmitting: (submitting: boolean) => void;
  setProductWorkbenchSurfaceState: (state: ProductWorkbenchSurfaceState) => void;
  updateProductListUiState: (skuParent: string | undefined, nextState: ProductListUiState) => void;
  updateReadyProductWorkbenchSurface: ReadyProductWorkbenchSurfaceUpdater;
  usingMockProductList: boolean;
};

type SubmitProductSnapshotOptions = {
  forceReal?: boolean;
  context?: ProductWorkbenchContext;
  discardPersistedDraft?: boolean;
};

function discardPersistedDraft(payload: ProductWorkbenchPayload): ProductWorkbenchPayload {
  const baselineSnapshot = cloneSnapshotPayload(payload.baselineSnapshot ?? payload);
  return {
    ...payload,
    ...baselineSnapshot,
    baselineSnapshot: cloneSnapshotPayload(baselineSnapshot),
    draftSnapshot: cloneSnapshotPayload(baselineSnapshot),
    syncStatus: 'synced',
    note: payload.publishTask
      ? payload.note
      : '已按本地商品基线打开；本页未发布的 Group 修改只保留在当前页面。'
  };
}

export function useProductWorkbenchApiActions({
  activeOwnerId,
  activeProductSiteOffer,
  applyMockProductAction,
  applyProductWorkbenchResponse,
  currentProductSkuParent,
  openMockProductWorkbench,
  productDraftDirty,
  productListItemBySkuParent,
  productSnapshotForm,
  productSnapshotView,
  productWorkbenchState,
  productWorkbenchSurfaceState,
  selectedInitializationStoreCode,
  setProductActionSubmitting,
  setProductSnapshotSubmitting,
  setProductWorkbenchSurfaceState,
  updateProductListUiState,
  updateReadyProductWorkbenchSurface,
  usingMockProductList
}: UseProductWorkbenchApiActionsParams) {
  const openSnapshotRequestSeqRef = useRef(0);
  const previewProductAction = useProductWorkbenchActionSubmitter({
    activeOwnerId,
    activeProductSiteOffer,
    applyMockProductAction,
    applyProductWorkbenchResponse,
    currentProductSkuParent,
    productDraftDirty,
    productSnapshotForm,
    productSnapshotView,
    productWorkbenchState,
    selectedInitializationStoreCode,
    setProductActionSubmitting,
    updateProductListUiState,
    updateReadyProductWorkbenchSurface
  });

  const submitProductSnapshot = useCallback(
    async (nextValues?: ProductSnapshotRequestValues, options?: SubmitProductSnapshotOptions) => {
      if (!activeOwnerId) {
        message.error('缺少老板上下文，无法读取商品主档。');
        return;
      }

      const currentValues = productSnapshotForm.getFieldsValue();
      const requestValues = {
        storeCode: nextValues?.storeCode ?? currentValues.storeCode ?? selectedInitializationStoreCode,
        noonUser: nextValues?.noonUser ?? currentValues.noonUser,
        noonPassword: nextValues?.noonPassword ?? currentValues.noonPassword,
        skuParent: nextValues?.skuParent ?? currentValues.skuParent,
        partnerSku: nextValues?.partnerSku ?? currentValues.partnerSku,
        pskuCode: nextValues?.pskuCode ?? currentValues.pskuCode
      };

      if (!requestValues.storeCode || !requestValues.skuParent) {
        message.error('当前商品缺少最小定位信息，暂时不能读取详情。');
        return;
      }

      const requestSeq = openSnapshotRequestSeqRef.current + 1;
      openSnapshotRequestSeqRef.current = requestSeq;

      if (usingMockProductList && !options?.forceReal) {
        openMockProductWorkbench(requestValues.skuParent);
        return;
      }

      const matchedListItem = requestValues.skuParent ? productListItemBySkuParent.get(requestValues.skuParent) : undefined;
      const requestContext =
        options?.context ??
        (productWorkbenchSurfaceState.status === 'idle'
          ? buildProductWorkbenchContext({
              mode: 'real',
              source: 'manual-open',
              storeCode: requestValues.storeCode,
              skuParent: requestValues.skuParent,
              partnerSku: requestValues.partnerSku,
              pskuCode: requestValues.pskuCode,
              summaryPreview: matchedListItem ? buildProductSummarySurfaceFromListItem(matchedListItem) : null
            })
          : productWorkbenchSurfaceState.context ??
            buildProductWorkbenchContext({
              mode: 'real',
              source: 'manual-open',
              storeCode: requestValues.storeCode,
              skuParent: requestValues.skuParent,
              partnerSku: requestValues.partnerSku,
              pskuCode: requestValues.pskuCode,
              summaryPreview: matchedListItem ? buildProductSummarySurfaceFromListItem(matchedListItem) : null
            }));

      try {
        setProductSnapshotSubmitting(true);
        setProductWorkbenchSurfaceState({
          status: 'loading',
          context: requestContext,
          message: '正在重新读取本地商品详情...'
        });
        productSnapshotForm.setFieldsValue(requestValues);

        const payload = await openProductWorkbenchSnapshot({
          ownerUserId: activeOwnerId,
          storeCode: requestValues.storeCode,
          noonUser: requestValues.noonUser,
          noonPassword: requestValues.noonPassword,
          skuParent: requestValues.skuParent,
          partnerSku: requestValues.partnerSku,
          pskuCode: requestValues.pskuCode
        });
        if (openSnapshotRequestSeqRef.current !== requestSeq) {
          return;
        }
        if (!payload.ready) {
          throw new Error(payload.message || '本地商品基线暂时不可用，请先同步商品。');
        }
        applyProductWorkbenchResponse(
          options?.discardPersistedDraft ? discardPersistedDraft(payload) : payload,
          requestContext
        );
      } catch (error) {
        if (openSnapshotRequestSeqRef.current !== requestSeq) {
          return;
        }
        const errorMessage = error instanceof Error ? error.message : '读取商品主档失败';
        setProductWorkbenchSurfaceState({
          status: 'error',
          context: requestContext,
          message: errorMessage
        });
        message.error(errorMessage);
      } finally {
        if (openSnapshotRequestSeqRef.current === requestSeq) {
          setProductSnapshotSubmitting(false);
        }
      }
    },
    [
      activeOwnerId,
      applyProductWorkbenchResponse,
      openMockProductWorkbench,
      productListItemBySkuParent,
      productSnapshotForm,
      productWorkbenchSurfaceState,
      selectedInitializationStoreCode,
      setProductSnapshotSubmitting,
      setProductWorkbenchSurfaceState,
      usingMockProductList
    ]
  );

  const openProductWorkbench = useCallback(
    async (sample: ProductQuickOpenSample) => {
      const requestValues = {
        storeCode: sample.storeCode || sample.referenceStoreCode || selectedInitializationStoreCode,
        skuParent: sample.skuParent,
        partnerSku: sample.partnerSku,
        pskuCode: sample.pskuCode
      };
      const matchedListItem = productListItemBySkuParent.get(sample.skuParent);
      const requestContext = buildProductWorkbenchContext({
        mode: usingMockProductList || Boolean(findMockProductItem(sample.skuParent)) ? 'mock' : 'real',
        source: 'quick-open',
        storeCode: requestValues.storeCode,
        skuParent: requestValues.skuParent,
        partnerSku: requestValues.partnerSku,
        pskuCode: requestValues.pskuCode,
        summaryPreview: matchedListItem ? buildProductSummarySurfaceFromListItem(matchedListItem) : null
      });
      productSnapshotForm.setFieldsValue(requestValues);

      if (usingMockProductList || findMockProductItem(sample.skuParent)) {
        openMockProductWorkbench(sample.skuParent);
        return;
      }

      await submitProductSnapshot(requestValues, { context: requestContext });
    },
    [
      openMockProductWorkbench,
      productListItemBySkuParent,
      productSnapshotForm,
      selectedInitializationStoreCode,
      submitProductSnapshot,
      usingMockProductList
    ]
  );

  return {
    previewProductAction,
    submitProductSnapshot,
    openProductWorkbench
  };
}
