import type { ProductDetailTabRequest, StoreInitializationPayload } from './types';
import type { StoreSyncOverviewPayload } from './workspaceContracts';

type StoreSyncOverviewStore = StoreSyncOverviewPayload['stores'][number];

export function matchesProductStoreCode(store: StoreSyncOverviewStore, storeCode?: string) {
  if (!storeCode) {
    return false;
  }
  return store.storeCode === storeCode || store.siteStores.some((siteStore) => siteStore.storeCode === storeCode);
}

export function findProductStoreByCode(stores: StoreSyncOverviewPayload['stores'], storeCode?: string) {
  if (!storeCode) {
    return null;
  }
  return stores.find((item) => matchesProductStoreCode(item, storeCode)) ?? null;
}

export function resolveProductApiStoreCode(store: StoreSyncOverviewStore | null | undefined, preferredStoreCode?: string) {
  if (!store) {
    return undefined;
  }

  const preferredSiteStore = preferredStoreCode
    ? store.siteStores.find((siteStore) => siteStore.storeCode === preferredStoreCode && siteStore.isAuthorized !== false)
    : undefined;
  const authorizedSiteStore = store.siteStores.find((siteStore) => siteStore.isAuthorized !== false);
  return preferredSiteStore?.storeCode || authorizedSiteStore?.storeCode || store.siteStores[0]?.storeCode || store.storeCode;
}

export function shouldEnableProductMockFallback() {
  if (typeof window === 'undefined') {
    return false;
  }

  const search = new URLSearchParams(window.location.search);
  return search.get('productMock') === '1';
}

export function pickPreferredBoundStore(
  stores: StoreSyncOverviewPayload['stores']
): StoreSyncOverviewPayload['stores'][number] | null {
  return (
    stores.find((item) => item.isAuthorized && matchesProductStoreCode(item, 'STR245027-NAE')) ??
    stores.find((item) => item.projectName?.toLowerCase() === 'xingyao' && item.isAuthorized) ??
    stores.find((item) => item.isAuthorized) ??
    null
  );
}

export function storeInitializationStatusMeta(status?: StoreInitializationPayload['status']) {
  if (status === 'READY') {
    return { label: '可用', color: 'success' as const };
  }
  if (status === 'RUNNING') {
    return { label: '初始化中', color: 'processing' as const };
  }
  if (status === 'FAILED') {
    return { label: '部分失败', color: 'warning' as const };
  }
  if (status === 'BLOCKED') {
    return { label: '待准备', color: 'default' as const };
  }
  return { label: '未初始化', color: 'default' as const };
}

export function storeInitializationStepColor(status: StoreInitializationPayload['steps'][number]['status']) {
  if (status === 'completed') {
    return 'success';
  }
  if (status === 'running') {
    return 'processing';
  }
  if (status === 'failed') {
    return 'warning';
  }
  return 'default';
}

export function isSameProductDetailRequest(
  currentValue: ProductDetailTabRequest | null | undefined,
  nextValue: ProductDetailTabRequest
) {
  if (!currentValue) {
    return false;
  }

  const currentPartnerSku = (currentValue.partnerSku ?? '').trim();
  const nextPartnerSku = (nextValue.partnerSku ?? '').trim();
  const sameScope =
    currentValue.mode === nextValue.mode &&
    (currentValue.storeCode ?? '') === (nextValue.storeCode ?? '');

  if (currentPartnerSku && nextPartnerSku) {
    return sameScope && currentPartnerSku === nextPartnerSku;
  }

  return (
    sameScope &&
    currentValue.skuParent === nextValue.skuParent &&
    currentPartnerSku === nextPartnerSku
  );
}
