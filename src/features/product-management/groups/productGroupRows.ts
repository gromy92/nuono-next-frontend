import type { ProductListRowPayload, ProductListUiState, ProductSyncStatus } from '../types';
import { resolveProductListRowSyncStatus } from '../utils/productListFilters';

export type ProductGroupRow = {
  key: string;
  skuGroup?: string;
  groupRef: string;
  groupRefCanonical?: string;
  brand?: string;
  productFulltype?: string;
  memberCount: number;
  liveCount: number;
  sites: string[];
  imageUrls: string[];
  lastSyncedAt?: string;
  syncStatus: ProductSyncStatus;
  representative: ProductListRowPayload;
  items: ProductListRowPayload[];
};

function textValue(value: unknown) {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function groupStableKey(item: ProductListRowPayload) {
  return textValue(item.skuGroup) || textValue(item.groupRefCanonical) || textValue(item.groupRef);
}

function groupDisplayName(items: ProductListRowPayload[], fallback: string) {
  for (const item of items) {
    const displayName = textValue(item.groupRef) || textValue(item.groupRefCanonical) || textValue(item.skuGroup);
    if (displayName) {
      return displayName;
    }
  }
  return fallback;
}

function isLive(item: ProductListRowPayload) {
  const status = textValue(item.liveStatus || item.statusCode)?.toLowerCase();
  return item.isActive === true || status === 'live' || status === 'active' || status === '1';
}

function latestTime(left?: string, right?: string) {
  if (!left) {
    return right;
  }
  if (!right) {
    return left;
  }
  return new Date(left).getTime() >= new Date(right).getTime() ? left : right;
}

function groupStatus(items: ProductListRowPayload[], uiStates: Record<string, ProductListUiState>, usingMockProductList: boolean) {
  const statuses = items.map((item) => resolveProductListRowSyncStatus(item, uiStates, usingMockProductList));
  if (statuses.includes('failed')) {
    return 'failed';
  }
  if (statuses.includes('conflict')) {
    return 'conflict';
  }
  if (statuses.includes('draft')) {
    return 'draft';
  }
  return 'synced';
}

export function buildProductGroupRows(
  items: ProductListRowPayload[],
  uiStates: Record<string, ProductListUiState>,
  usingMockProductList: boolean
) {
  const groupMap = new Map<string, ProductListRowPayload[]>();
  items.forEach((item) => {
    const key = groupStableKey(item);
    if (!key) {
      return;
    }
    groupMap.set(key, [...(groupMap.get(key) ?? []), item]);
  });

  return [...groupMap.entries()]
    .map(([key, groupItems]) => {
      const representative = groupItems[0];
      const groupRef = groupDisplayName(groupItems, key);
      const sites = [...new Set(groupItems.flatMap((item) => item.siteLabels ?? []).filter(Boolean))];
      const imageUrls = [
        ...new Set(
          groupItems
            .flatMap((item) => [item.imageUrl, ...(item.galleryImages ?? [])])
            .map(textValue)
            .filter((item): item is string => Boolean(item))
        )
      ].slice(0, 4);
      return {
        key,
        skuGroup: textValue(representative.skuGroup),
        groupRef,
        groupRefCanonical: textValue(representative.groupRefCanonical),
        brand: representative.brand,
        productFulltype: representative.productFulltype,
        memberCount: groupItems.length,
        liveCount: groupItems.filter(isLive).length,
        sites,
        imageUrls,
        lastSyncedAt: groupItems.reduce<string | undefined>((current, item) => latestTime(current, item.lastSyncedAt), undefined),
        syncStatus: groupStatus(groupItems, uiStates, usingMockProductList),
        representative,
        items: groupItems
      } satisfies ProductGroupRow;
    })
    .sort((left, right) => right.memberCount - left.memberCount || left.groupRef.localeCompare(right.groupRef));
}

export function countUngroupedProductRows(items: ProductListRowPayload[]) {
  return items.filter((item) => !groupStableKey(item)).length;
}
