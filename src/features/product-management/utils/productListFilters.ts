import dayjs from 'dayjs';
import { MOCK_PRODUCT_LIST_UI_STATES } from '../mockData';
import type { ProductListFilters, ProductListRowPayload, ProductListUiState, ProductSyncStatus } from '../types';
import { isProductListRowOnline, productListIssueTags } from './status';

type FilterAndSortProductListItemsParams = {
  filters: ProductListFilters;
  sortKey: string;
  sourceItems: ProductListRowPayload[];
  uiStates: Record<string, ProductListUiState>;
  usingMockProductList: boolean;
};

export type ProductListStatusCounts = Record<ProductSyncStatus, number>;

export function resolveProductListRowSyncStatus(
  item: ProductListRowPayload,
  uiStates: Record<string, ProductListUiState>,
  usingMockProductList: boolean
) {
  const rowUiState = usingMockProductList
    ? uiStates[item.skuParent] ?? MOCK_PRODUCT_LIST_UI_STATES[item.skuParent]
    : undefined;

  return rowUiState?.syncStatus ?? item.syncStatus ?? MOCK_PRODUCT_LIST_UI_STATES[item.skuParent]?.syncStatus ?? 'synced';
}

export function filterAndSortProductListItems({
  filters,
  sortKey,
  sourceItems,
  uiStates,
  usingMockProductList
}: FilterAndSortProductListItemsParams) {
  const skuQuery = filters.skuQuery.trim().toLowerCase();
  const titleQuery = filters.titleQuery.trim().toLowerCase();
  const brandQuery = filters.brandQuery.trim().toLowerCase();
  const filteredItems = sourceItems.filter((item) => {
    const rowSyncStatus = resolveProductListRowSyncStatus(item, uiStates, usingMockProductList);
    const matchesSku =
      !skuQuery ||
      [item.skuParent, item.partnerSku, item.pskuCode, item.offerCode, item.barcode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(skuQuery));
    const matchesTitle =
      !titleQuery ||
      [item.title, item.titleCn]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(titleQuery));
    const matchesBrand = !brandQuery || String(item.brand ?? '').toLowerCase().includes(brandQuery);
    const matchesIssue = filters.issueFilter === 'all' || productListIssueTags(item).includes(filters.issueFilter);
    const online = isProductListRowOnline(item);
    const matchesLive =
      filters.liveFilter === 'all' ||
      (filters.liveFilter === 'online' && online) ||
      (filters.liveFilter === 'offline' && !online);
    const matchesSync =
      filters.syncFilter === 'all' ||
      rowSyncStatus === filters.syncFilter ||
      (filters.syncFilter === 'draft' && rowSyncStatus === 'conflict');
    const matchesStock =
      filters.stockFilter === 'all' ||
      (filters.stockFilter === 'fbn' && Number(item.totalFbnStock ?? 0) > 0) ||
      (filters.stockFilter === 'supermall' && Number(item.totalSupermallStock ?? 0) > 0) ||
      (filters.stockFilter === 'fbp' && Number(item.totalFbpStock ?? 0) > 0);

    return matchesSku && matchesTitle && matchesBrand && matchesIssue && matchesLive && matchesSync && matchesStock;
  });

  return [...filteredItems].sort((left, right) => {
    if (sortKey === 'price') {
      return Number(right.referencePrice ?? 0) - Number(left.referencePrice ?? 0);
    }
    if (sortKey === 'stock') {
      const rightStock = Number(right.totalFbnStock ?? 0) + Number(right.totalFbpStock ?? 0);
      const leftStock = Number(left.totalFbnStock ?? 0) + Number(left.totalFbpStock ?? 0);
      return rightStock - leftStock;
    }
    const rightTime = right.lastSyncedAt ? dayjs(right.lastSyncedAt).valueOf() : 0;
    const leftTime = left.lastSyncedAt ? dayjs(left.lastSyncedAt).valueOf() : 0;
    return rightTime - leftTime;
  });
}

export function countProductListStatuses(
  sourceItems: ProductListRowPayload[],
  uiStates: Record<string, ProductListUiState>,
  usingMockProductList: boolean
): ProductListStatusCounts {
  const counts: ProductListStatusCounts = {
    synced: 0,
    draft: 0,
    conflict: 0,
    failed: 0
  };

  sourceItems.forEach((item) => {
    counts[resolveProductListRowSyncStatus(item, uiStates, usingMockProductList)] += 1;
  });

  return counts;
}

export function buildProductListShellHighlights(sourceItems: ProductListRowPayload[], counts: ProductListStatusCounts) {
  const draftCount = counts.draft + counts.conflict;
  return sourceItems.length
    ? [
        { label: '已同步', value: counts.synced, color: 'success' as const, syncFilter: 'synced' },
        { label: '本地草稿', value: draftCount, color: 'processing' as const, syncFilter: 'draft' },
        { label: '发布失败', value: counts.failed, color: 'error' as const, syncFilter: 'failed' }
      ]
    : [];
}
