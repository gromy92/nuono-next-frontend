import type { StoreSyncOverviewState } from '../workspaceContracts';
import { findProductStoreByCode, pickPreferredBoundStore, resolveProductApiStoreCode } from '../workspaceHelpers';

type ProductStoreLike = Extract<StoreSyncOverviewState, { status: 'success' }>['data']['stores'][number];

export function resolvePreferredInitializationStoreCode(
  storeSyncState: StoreSyncOverviewState,
  currentStoreCode?: string
) {
  if (storeSyncState.status !== 'success') {
    return undefined;
  }
  const matchedStore = findProductStoreByCode(storeSyncState.data.stores, currentStoreCode);
  const preferredStore = matchedStore ?? pickPreferredBoundStore(storeSyncState.data.stores);
  return resolveProductApiStoreCode(preferredStore, currentStoreCode);
}

export function resolveSelectedInitializationStoreCode({
  currentStoreCode,
  enableStoreSelection,
  preferredStoreCode,
  selectedStoreCodeOverride,
  storeSyncState
}: {
  currentStoreCode?: string;
  enableStoreSelection: boolean;
  preferredStoreCode?: string;
  selectedStoreCodeOverride?: string;
  storeSyncState: StoreSyncOverviewState;
}) {
  if (!enableStoreSelection) {
    return selectedStoreCodeOverride;
  }
  if (storeSyncState.status !== 'success') {
    return undefined;
  }

  const selectedOverrideStore = findProductStoreByCode(storeSyncState.data.stores, selectedStoreCodeOverride);
  if (selectedOverrideStore) {
    return resolveProductApiStoreCode(selectedOverrideStore, selectedStoreCodeOverride);
  }

  return preferredStoreCode;
}

export function toProductStoreOption(item: ProductStoreLike, currentStoreCode?: string) {
  const value = resolveProductApiStoreCode(item, currentStoreCode);
  if (!value) {
    return null;
  }
  return {
    label: `${item.projectName || item.projectCode || item.storeCode} · ${
      item.projectCode || item.storeCode
    } · ${item.siteCount ?? item.siteStores.length} 站点`,
    value
  };
}

export function toInitializationStoreOption(item: ProductStoreLike, currentStoreCode?: string) {
  const value = resolveProductApiStoreCode(item, currentStoreCode);
  if (!value) {
    return null;
  }
  return {
    label: `${item.projectName || item.projectCode || item.storeCode} · ${item.projectCode || item.storeCode}`,
    value
  };
}

export function buildAuthorizedStoreOptions(
  storeSyncState: StoreSyncOverviewState,
  currentStoreCode: string | undefined,
  mapper: (item: ProductStoreLike, currentStoreCode?: string) => { label: string; value: string } | null
) {
  return storeSyncState.status === 'success'
    ? storeSyncState.data.stores
        .filter((item) => item.isAuthorized)
        .map((item) => mapper(item, currentStoreCode))
        .filter((item): item is { label: string; value: string } => Boolean(item))
    : [];
}
