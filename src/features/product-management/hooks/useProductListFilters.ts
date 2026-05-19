import { useCallback, useEffect, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Key } from 'antd/es/table/interface';
import { defaultProductListFilters } from '../config';
import {
  isProductInitializationFailureStatus,
  isProductListDatasetReady,
  productIssueTagLabel,
  productListIssueTags,
  resolveProductInitializationMessage,
  resolveProductInitializationStatus
} from '../utils';
import {
  buildProductListShellHighlights,
  countProductListStatuses,
  filterAndSortProductListItems
} from '../utils/productListFilters';
import type {
  ProductListDatasetState,
  ProductListFilters,
  ProductListRowPayload,
  ProductListUiState,
  StoreInitializationState
} from '../types';

type UseProductListFiltersParams = {
  productListAvailable: boolean;
  productListDatasetState: ProductListDatasetState;
  productListDegraded: boolean;
  productListDraftFilters: ProductListFilters;
  productListFilters: ProductListFilters;
  productListInitializationFailed: boolean;
  productListSortKey: string;
  productListSourceItems: ProductListRowPayload[];
  productListUiStates: Record<string, ProductListUiState>;
  selectedProductRowKeys: string[];
  setProductListDraftFilters: Dispatch<SetStateAction<ProductListFilters>>;
  setProductListFilters: Dispatch<SetStateAction<ProductListFilters>>;
  setSelectedProductRowKeys: Dispatch<SetStateAction<string[]>>;
  showInitializationDiagnostics: boolean;
  storeInitializationState: StoreInitializationState;
  usingMockProductList: boolean;
};

export function useProductListFilters({
  productListAvailable,
  productListDatasetState,
  productListDegraded,
  productListDraftFilters,
  productListFilters,
  productListInitializationFailed,
  productListSortKey,
  productListSourceItems,
  productListUiStates,
  selectedProductRowKeys,
  setProductListDraftFilters,
  setProductListFilters,
  setSelectedProductRowKeys,
  showInitializationDiagnostics,
  storeInitializationState,
  usingMockProductList
}: UseProductListFiltersParams) {
  const productListIssueOptions = useMemo(() => {
    const labels = new Set<string>();
    productListSourceItems.forEach((item) => {
      productListIssueTags(item).forEach((issue) => {
        if (issue) {
          labels.add(issue);
        }
      });
    });

    return Array.from(labels).sort().map((issue) => ({
      label: productIssueTagLabel(issue),
      value: issue
    }));
  }, [productListSourceItems]);

  const filteredProductListItems = useMemo(
    () =>
      filterAndSortProductListItems({
        filters: productListFilters,
        sortKey: productListSortKey,
        sourceItems: productListSourceItems,
        uiStates: productListUiStates,
        usingMockProductList
      }),
    [productListFilters, productListSortKey, productListSourceItems, productListUiStates, usingMockProductList]
  );

  useEffect(() => {
    setSelectedProductRowKeys((currentValue) => {
      const nextValue = currentValue.filter((key) => filteredProductListItems.some((item) => item.skuParent === key));
      if (nextValue.length === currentValue.length && nextValue.every((key, index) => key === currentValue[index])) {
        return currentValue;
      }
      return nextValue;
    });
  }, [filteredProductListItems, setSelectedProductRowKeys]);

  const applyProductListFilters = useCallback(() => {
    setProductListFilters({ ...productListDraftFilters });
  }, [productListDraftFilters, setProductListFilters]);

  const resetProductListFilters = useCallback(() => {
    setProductListDraftFilters({ ...defaultProductListFilters });
    setProductListFilters({ ...defaultProductListFilters });
  }, [setProductListDraftFilters, setProductListFilters]);

  const productRowSelection = useMemo(
    () => ({
      selectedRowKeys: selectedProductRowKeys,
      onChange: (nextSelectedRowKeys: Key[]) => {
        setSelectedProductRowKeys(nextSelectedRowKeys as string[]);
      }
    }),
    [selectedProductRowKeys, setSelectedProductRowKeys]
  );

  const productListDatasetReady = !usingMockProductList && isProductListDatasetReady(productListDatasetState);
  const effectiveInitializationStatus = usingMockProductList
    ? undefined
    : resolveProductInitializationStatus(productListDatasetState, storeInitializationState);
  const effectiveInitializationMessage = resolveProductInitializationMessage(
    productListDatasetState,
    storeInitializationState
  );

  const productListStatusCounts = useMemo(() => {
    if (!usingMockProductList && productListDatasetState.status === 'success') {
      return {
        synced: Number(productListDatasetState.data.syncedCount ?? 0),
        draft: Number(productListDatasetState.data.draftCount ?? 0),
        conflict: Number(productListDatasetState.data.conflictCount ?? 0),
        failed: Number(productListDatasetState.data.failedCount ?? 0)
      };
    }

    return countProductListStatuses(productListSourceItems, productListUiStates, usingMockProductList);
  }, [productListDatasetState, productListSourceItems, productListUiStates, usingMockProductList]);

  const productListShellHighlights = useMemo(
    () => buildProductListShellHighlights(productListSourceItems, productListStatusCounts),
    [productListSourceItems, productListStatusCounts]
  );

  const productListShellMeta = useMemo(() => {
    if (!usingMockProductList && productListDatasetState.status === 'success' && productListAvailable) {
      if (productListDatasetState.data.source === 'projection-primary') {
        return {
          label:
            effectiveInitializationStatus === 'RUNNING'
              ? '同步中，先看商品摘要'
              : '商品摘要已就绪',
          color:
            effectiveInitializationStatus === 'RUNNING'
              ? ('processing' as const)
              : ('success' as const),
          description:
            productListDatasetState.data.message ??
            '当前页面展示本地商品摘要；未发布草稿只在详情工作台中生效。'
        };
      }
      return {
        label: '先看初始化摘要',
        color: 'warning' as const,
        description:
          productListDatasetState.data.message ??
          '本地商品投影仍在补齐，当前先回退到初始化摘要。'
      };
    }

    if (!usingMockProductList && productListDatasetState.status === 'error') {
      return {
        label: '商品工作台暂时不可用',
        color: 'warning' as const,
        description: productListDatasetState.message
      };
    }

    if (productListDegraded) {
      return {
        label: '先看已拉回摘要',
        color: 'warning' as const,
        description: '当前先继续使用已拉回的商品摘要；草稿和发布状态仍按摘要行回看，不会提前把草稿内容写进列表。'
      };
    }

    if (effectiveInitializationStatus === 'RUNNING') {
      return {
        label: productListAvailable ? '同步中，先看最近一次摘要' : '正在准备商品摘要',
        color: 'processing' as const,
        description:
          effectiveInitializationMessage ?? '正在后台读取 Noon 商品索引和摘要；当前页面会先保留最近一次已知摘要。'
      };
    }

    if (productListAvailable) {
      return {
        label: '当前显示商品摘要',
        color: 'success' as const,
        description: '列表显示的是当前已知商品摘要；草稿只通过草稿状态暴露，不会提前把未发布内容改进列表摘要。'
      };
    }

    if (productListInitializationFailed) {
      return {
        label: '商品摘要暂未就绪',
        color: 'warning' as const,
        description: effectiveInitializationMessage ?? '请先重新初始化当前店铺。'
      };
    }

    if (storeInitializationState.status === 'loading') {
      return {
        label: '正在准备商品摘要',
        color: 'processing' as const,
        description: '正在读取当前店铺的 Noon 商品索引和摘要。'
      };
    }

    if (storeInitializationState.status === 'error') {
      return {
        label: '商品摘要暂时不可用',
        color: 'warning' as const,
        description: storeInitializationState.message
      };
    }

    return {
      label: '商品摘要待初始化',
      color: 'default' as const,
      description: effectiveInitializationMessage ?? '先选择店铺并完成初始化。'
    };
  }, [
    effectiveInitializationMessage,
    effectiveInitializationStatus,
    productListAvailable,
    productListDatasetState,
    productListDegraded,
    productListInitializationFailed,
    storeInitializationState,
    usingMockProductList
  ]);

  const forceShowInitializationDiagnostics =
    !productListAvailable ||
    (!usingMockProductList &&
      !productListDatasetReady &&
      (storeInitializationState.status === 'loading' ||
        storeInitializationState.status === 'error' ||
        effectiveInitializationStatus === 'RUNNING' ||
        isProductInitializationFailureStatus(effectiveInitializationStatus)));

  const initializationDiagnosticsExpanded = forceShowInitializationDiagnostics || showInitializationDiagnostics;

  return {
    productListIssueOptions,
    filteredProductListItems,
    applyProductListFilters,
    resetProductListFilters,
    productRowSelection,
    productListStatusCounts,
    productListShellHighlights,
    productListShellMeta,
    forceShowInitializationDiagnostics,
    initializationDiagnosticsExpanded
  };
}
