import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { message } from 'antd';
import { fetchProductHistory } from '../api';
import { MOCK_PRODUCT_LIST_UI_STATES } from '../mockData';
import { buildProductHistoryFallback } from '../workspaceHelpers';
import {
  buildProductSummarySurfaceFromListItem,
  buildProductSummarySurfaceFromListSummary,
  getProductCurrentZCode,
  getProductListRowIdentityKey,
  productHistoryEntryMeta,
  productSummaryTitle
} from '../utils';
import type {
  ProductListSummaryPayload,
  ProductListUiState,
  ProductSummarySurface,
  ProductWorkbenchState,
  StoreInitializationPayload
} from '../types';

type UseProductHistoryModalActionsParams = {
  activeOwnerId?: number;
  applyProductListSummary: (summary?: ProductListSummaryPayload) => void;
  currentProductIdentityKey?: string;
  currentProductSkuParent?: string;
  currentProductSummarySurface: ProductSummarySurface | null;
  productListUiStates: Record<string, ProductListUiState>;
  productWorkbenchState: ProductWorkbenchState | null;
  selectedInitializationStoreCode?: string;
  sessionDefaultOwnerUserId?: number;
  usingMockProductList: boolean;
  setProductHistoryModalTitle: Dispatch<SetStateAction<string | undefined>>;
  setProductHistoryModalSummary: Dispatch<SetStateAction<ProductSummarySurface | null>>;
  setProductHistoryModalEntryLabel: Dispatch<SetStateAction<string | undefined>>;
  setProductHistoryModalEntryColor: Dispatch<
    SetStateAction<'success' | 'processing' | 'warning' | 'error' | 'default'>
  >;
  setProductHistoryModalItems: Dispatch<SetStateAction<Array<Record<string, unknown>>>>;
  setProductHistoryModalNote: Dispatch<SetStateAction<string | undefined>>;
  setProductHistoryModalHistoryMetaReady: Dispatch<SetStateAction<boolean>>;
  setProductHistoryModalVisibleHistoryCount: Dispatch<SetStateAction<number>>;
  setProductHistoryModalPendingCount: Dispatch<SetStateAction<number>>;
  setProductHistoryModalPendingVisibleAfter: Dispatch<SetStateAction<string | undefined>>;
  setProductHistoryModalOpen: Dispatch<SetStateAction<boolean>>;
  setProductHistoryModalLoading: Dispatch<SetStateAction<boolean>>;
};

export function useProductHistoryModalActions({
  activeOwnerId,
  applyProductListSummary,
  currentProductIdentityKey,
  currentProductSkuParent,
  currentProductSummarySurface,
  productListUiStates,
  productWorkbenchState,
  selectedInitializationStoreCode,
  sessionDefaultOwnerUserId,
  usingMockProductList,
  setProductHistoryModalTitle,
  setProductHistoryModalSummary,
  setProductHistoryModalEntryLabel,
  setProductHistoryModalEntryColor,
  setProductHistoryModalItems,
  setProductHistoryModalNote,
  setProductHistoryModalHistoryMetaReady,
  setProductHistoryModalVisibleHistoryCount,
  setProductHistoryModalPendingCount,
  setProductHistoryModalPendingVisibleAfter,
  setProductHistoryModalOpen,
  setProductHistoryModalLoading
}: UseProductHistoryModalActionsParams) {
  const openProductHistoryModal = useCallback(
    async (record: StoreInitializationPayload['productItems'][number]) => {
      const rowUiState = usingMockProductList
        ? productListUiStates[getProductListRowIdentityKey(record)] ??
          productListUiStates[record.skuParent] ??
          MOCK_PRODUCT_LIST_UI_STATES[record.skuParent]
        : undefined;
      const currentZCode = getProductCurrentZCode(record);
      const useCurrentWorkbench =
        (currentProductIdentityKey === getProductListRowIdentityKey(record) || currentProductSkuParent === record.skuParent) &&
        productWorkbenchState;
      const useMockFallback = usingMockProductList && !useCurrentWorkbench;
      const historySummary =
        useCurrentWorkbench && currentProductSummarySurface
          ? currentProductSummarySurface
          : buildProductSummarySurfaceFromListItem(record);
      const historyEntry = productHistoryEntryMeta({
        usingMock: useMockFallback,
        isCurrentWorkbench: Boolean(useCurrentWorkbench),
        pendingCount: useCurrentWorkbench
          ? productWorkbenchState.pendingKeyContentHistoryCount
          : record.pendingKeyContentHistoryCount,
        historyCount: useCurrentWorkbench
          ? productWorkbenchState.keyContentHistory.length
          : record.visibleKeyContentHistoryCount,
        historyMetaReady: useCurrentWorkbench ? true : record.historyMetaReady,
        pendingVisibleAfter: useCurrentWorkbench
          ? productWorkbenchState.pendingKeyContentHistoryVisibleAfter
          : record.pendingKeyContentHistoryVisibleAfter
      });

      setProductHistoryModalTitle(productSummaryTitle(historySummary));
      setProductHistoryModalSummary(historySummary);
      setProductHistoryModalEntryLabel(historyEntry.tagLabel);
      setProductHistoryModalEntryColor(historyEntry.tagColor);
      setProductHistoryModalItems(useMockFallback ? buildProductHistoryFallback(record, rowUiState) : []);
      setProductHistoryModalNote(useMockFallback ? '当前是样本态演示历史。' : historyEntry.note);
      setProductHistoryModalHistoryMetaReady(useCurrentWorkbench ? true : Boolean(record.historyMetaReady));
      setProductHistoryModalVisibleHistoryCount(
        useCurrentWorkbench ? productWorkbenchState.keyContentHistory.length : record.visibleKeyContentHistoryCount ?? 0
      );
      setProductHistoryModalPendingCount(
        useCurrentWorkbench ? productWorkbenchState.pendingKeyContentHistoryCount : record.pendingKeyContentHistoryCount ?? 0
      );
      setProductHistoryModalPendingVisibleAfter(
        useCurrentWorkbench
          ? productWorkbenchState.pendingKeyContentHistoryVisibleAfter
          : record.pendingKeyContentHistoryVisibleAfter
      );
      setProductHistoryModalOpen(true);

      if (useMockFallback) {
        return;
      }

      const effectiveOwnerUserId = activeOwnerId ?? sessionDefaultOwnerUserId;
      const effectiveStoreCode = record.referenceStoreCode || selectedInitializationStoreCode;
      if (!effectiveOwnerUserId || !effectiveStoreCode || !(record.partnerSku || currentZCode)) {
        setProductHistoryModalNote('缺少老板上下文或店铺编码，暂时不能读取真实历史明细。');
        return;
      }

      try {
        setProductHistoryModalLoading(true);
        const payload = await fetchProductHistory({
          ownerUserId: effectiveOwnerUserId,
          storeCode: effectiveStoreCode,
          skuParent: currentZCode,
          currentZCode,
          partnerSku: record.partnerSku
        });
        if (payload.listSummary) {
          applyProductListSummary(payload.listSummary);
          const nextSummary = buildProductSummarySurfaceFromListSummary(payload.listSummary, record);
          const modificationHistoryCount =
            payload.historyItems?.filter((item) => item && (item as Record<string, unknown>).historyKind === 'modification')
              .length ?? 0;
          const nextEntry = productHistoryEntryMeta({
            usingMock: false,
            isCurrentWorkbench: false,
            pendingCount: payload.pendingKeyContentHistoryCount,
            historyCount: payload.visibleKeyContentHistoryCount,
            historyMetaReady: true,
            pendingVisibleAfter: payload.pendingKeyContentHistoryVisibleAfter
          });
          setProductHistoryModalTitle(productSummaryTitle(nextSummary));
          setProductHistoryModalSummary(nextSummary);
          if (
            modificationHistoryCount > 0 &&
            !payload.pendingKeyContentHistoryCount &&
            !payload.visibleKeyContentHistoryCount
          ) {
            setProductHistoryModalEntryLabel(`修改历史 ${modificationHistoryCount}`);
            setProductHistoryModalEntryColor('default');
          } else {
            setProductHistoryModalEntryLabel(nextEntry.tagLabel);
            setProductHistoryModalEntryColor(nextEntry.tagColor);
          }
        }
        setProductHistoryModalItems(payload.historyItems ?? []);
        setProductHistoryModalHistoryMetaReady(Boolean(payload.ready));
        setProductHistoryModalVisibleHistoryCount(Number(payload.visibleKeyContentHistoryCount ?? 0));
        setProductHistoryModalPendingCount(Number(payload.pendingKeyContentHistoryCount ?? 0));
        setProductHistoryModalPendingVisibleAfter(payload.pendingKeyContentHistoryVisibleAfter);
        setProductHistoryModalNote(payload.note ?? ((payload.historyItems?.length ?? 0) ? undefined : payload.message));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '商品修改历史暂时不可用';
        setProductHistoryModalNote(errorMessage);
        message.error(errorMessage);
      } finally {
        setProductHistoryModalLoading(false);
      }
    },
    [
      activeOwnerId,
      applyProductListSummary,
      currentProductIdentityKey,
      currentProductSkuParent,
      currentProductSummarySurface,
      productListUiStates,
      productWorkbenchState,
      selectedInitializationStoreCode,
      sessionDefaultOwnerUserId,
      setProductHistoryModalEntryColor,
      setProductHistoryModalEntryLabel,
      setProductHistoryModalHistoryMetaReady,
      setProductHistoryModalItems,
      setProductHistoryModalLoading,
      setProductHistoryModalNote,
      setProductHistoryModalOpen,
      setProductHistoryModalPendingCount,
      setProductHistoryModalPendingVisibleAfter,
      setProductHistoryModalSummary,
      setProductHistoryModalTitle,
      setProductHistoryModalVisibleHistoryCount,
      usingMockProductList
    ]
  );

  return {
    openProductHistoryModal
  };
}
