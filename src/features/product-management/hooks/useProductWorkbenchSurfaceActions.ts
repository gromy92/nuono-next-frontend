import { useCallback } from 'react';
import { message } from 'antd';
import type { FormInstance } from 'antd';
import { findMockProductItem } from '../mockData';
import { createMockProductWorkbenchPayload } from '../workspaceHelpers';
import {
  buildProductSummarySurfaceFromSample,
  buildProductSummarySurfaceFromWorkbench,
  buildProductWorkbenchContext,
  buildProductWorkbenchPayloadFromState,
  buildProductWorkbenchState,
  cloneRecordList,
  findProductByIdentity,
  getProductStableIdentityKey,
  nowSyncTime
} from '../utils';
import type {
  ProductListRowPayload,
  ProductListSummaryPayload,
  ProductListUiState,
  ProductWorkbenchContext,
  ProductWorkbenchPayload,
  ProductWorkbenchState,
  ProductWorkbenchSurfaceReadyState,
  ProductWorkbenchSurfaceState
} from '../types';

type UseProductWorkbenchSurfaceActionsParams = {
  applyProductListSummary: (summary?: ProductListSummaryPayload) => void;
  productListItemBySkuParent: Map<string, ProductListRowPayload>;
  productSnapshotForm: FormInstance;
  productWorkbenchSurfaceState: ProductWorkbenchSurfaceState;
  setProductWorkbenchSurfaceState: (state: ProductWorkbenchSurfaceState | ((currentValue: ProductWorkbenchSurfaceState) => ProductWorkbenchSurfaceState)) => void;
  updateProductListUiState: (skuParent: string | undefined, nextState: ProductListUiState) => void;
};

export type ReadyProductWorkbenchSurfaceUpdater = (
  updater: (current: ProductWorkbenchSurfaceReadyState) => {
    workbench: ProductWorkbenchState;
    payloadOverrides?: Partial<ProductWorkbenchPayload>;
    recentActions?: Array<Record<string, unknown>>;
  } | null
) => void;

export function useProductWorkbenchSurfaceActions({
  applyProductListSummary,
  productListItemBySkuParent,
  productSnapshotForm,
  productWorkbenchSurfaceState,
  setProductWorkbenchSurfaceState,
  updateProductListUiState
}: UseProductWorkbenchSurfaceActionsParams) {
  const commitProductWorkbenchSurface = useCallback(
    (payload: ProductWorkbenchPayload, context?: ProductWorkbenchContext) => {
      const nextWorkbenchState = buildProductWorkbenchState(payload);
      const skuParent =
        typeof nextWorkbenchState.draft.identity.skuParent === 'string'
          ? nextWorkbenchState.draft.identity.skuParent
          : context?.skuParent;
      const currentZCode =
        typeof nextWorkbenchState.draft.identity.currentZCode === 'string'
          ? nextWorkbenchState.draft.identity.currentZCode
          : skuParent;
      const partnerSku =
        typeof nextWorkbenchState.draft.identity.partnerSku === 'string'
          ? nextWorkbenchState.draft.identity.partnerSku
          : context?.partnerSku;
      const matchedListItem = findProductByIdentity(productListItemBySkuParent, {
        storeCode: context?.storeCode,
        partnerSku,
        currentZCode,
        skuParent
      });
      const nextSummary = buildProductSummarySurfaceFromWorkbench(nextWorkbenchState, matchedListItem);
      const nextContext =
        context ??
        (productWorkbenchSurfaceState.status === 'idle'
          ? buildProductWorkbenchContext({
              mode: payload.mode === 'mock' ? 'mock' : 'real',
              source: 'unknown',
              storeCode:
                typeof nextWorkbenchState.draft.storeContext.storeCode === 'string'
                  ? nextWorkbenchState.draft.storeContext.storeCode
                  : undefined,
              skuParent,
              currentZCode,
              partnerSku,
              pskuCode:
                typeof nextWorkbenchState.draft.identity.pskuCode === 'string'
                  ? nextWorkbenchState.draft.identity.pskuCode
                  : undefined,
              summaryPreview: nextSummary
            })
          : productWorkbenchSurfaceState.context ?? buildProductWorkbenchContext({ summaryPreview: nextSummary }));

      setProductWorkbenchSurfaceState({
        status: 'ready',
        context: {
          ...nextContext,
          mode: payload.mode === 'mock' ? 'mock' : nextContext.mode,
          summaryPreview: nextSummary ?? nextContext.summaryPreview
        },
        payload,
        workbench: nextWorkbenchState,
        summary: nextSummary,
        recentActions: cloneRecordList(payload.recentActions ?? []),
        loadedAt: nowSyncTime()
      });

      if (payload.listSummary) {
        applyProductListSummary(payload.listSummary);
      } else {
        updateProductListUiState(getProductStableIdentityKey({ storeCode: context?.storeCode, partnerSku, currentZCode, skuParent }), {
          syncStatus: nextWorkbenchState.syncStatus,
          lastSyncedAt: nextWorkbenchState.lastSyncedAt,
          note: nextWorkbenchState.note
        });
      }
      return nextWorkbenchState;
    },
    [
      applyProductListSummary,
      productListItemBySkuParent,
      productWorkbenchSurfaceState,
      setProductWorkbenchSurfaceState,
      updateProductListUiState
    ]
  );

  const updateReadyProductWorkbenchSurface: ReadyProductWorkbenchSurfaceUpdater = useCallback(
    (updater) => {
      setProductWorkbenchSurfaceState((currentValue) => {
        if (currentValue.status !== 'ready') {
          return currentValue;
        }
        const result = updater(currentValue);
        if (!result) {
          return currentValue;
        }
        const nextPayload = buildProductWorkbenchPayloadFromState(
          currentValue.payload,
          result.workbench,
          result.payloadOverrides
        );
        const nextSummary = buildProductSummarySurfaceFromWorkbench(
          result.workbench,
          findProductByIdentity(productListItemBySkuParent, {
            storeCode: currentValue.context.storeCode,
            partnerSku:
              typeof result.workbench.draft.identity.partnerSku === 'string'
                ? result.workbench.draft.identity.partnerSku
                : currentValue.context.partnerSku,
            currentZCode:
              typeof result.workbench.draft.identity.currentZCode === 'string'
                ? result.workbench.draft.identity.currentZCode
                : undefined,
            skuParent:
              typeof result.workbench.draft.identity.skuParent === 'string'
                ? result.workbench.draft.identity.skuParent
                : currentValue.context.skuParent
          })
        );
        return {
          ...currentValue,
          context: {
            ...currentValue.context,
            summaryPreview: nextSummary ?? currentValue.context.summaryPreview
          },
          payload: nextPayload,
          workbench: result.workbench,
          summary: nextSummary,
          recentActions: result.recentActions ?? cloneRecordList(nextPayload.recentActions ?? currentValue.recentActions)
        };
      });
    },
    [productListItemBySkuParent, setProductWorkbenchSurfaceState]
  );

  const applyProductWorkbenchResponse = useCallback(
    (payload: ProductWorkbenchPayload, context?: ProductWorkbenchContext) => {
      return commitProductWorkbenchSurface(payload, context);
    },
    [commitProductWorkbenchSurface]
  );

  const openMockProductWorkbench = useCallback(
    (skuParent?: string) => {
      const mockItem = findMockProductItem(skuParent);
      if (!mockItem) {
        message.error('当前商品不存在。');
        return;
      }

      const payload = createMockProductWorkbenchPayload(mockItem);
      applyProductWorkbenchResponse(
        payload,
        buildProductWorkbenchContext({
          mode: 'mock',
          source: 'quick-open',
          storeCode: mockItem.referenceStoreCode,
          skuParent: mockItem.skuParent,
          currentZCode: mockItem.currentZCode || mockItem.skuParent,
          partnerSku: mockItem.partnerSku,
          pskuCode: mockItem.pskuCode,
          summaryPreview: buildProductSummarySurfaceFromSample(mockItem)
        })
      );
      productSnapshotForm.setFieldsValue({
        storeCode: mockItem.referenceStoreCode,
        skuParent: mockItem.skuParent,
        partnerSku: mockItem.partnerSku,
        pskuCode: mockItem.pskuCode
      });
    },
    [applyProductWorkbenchResponse, productSnapshotForm]
  );

  return {
    commitProductWorkbenchSurface,
    updateReadyProductWorkbenchSurface,
    applyProductWorkbenchResponse,
    openMockProductWorkbench
  };
}
