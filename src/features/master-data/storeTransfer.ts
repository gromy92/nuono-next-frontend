import type { MasterDataUserDetail } from './types';

export type StoreTransferGroup = {
  key: string;
  label: string;
  storeCodes: string[];
  sites: string[];
};

export type StoreTransferSource = {
  storeCode: string;
  projectCode?: string;
  projectName?: string;
  site?: string;
};

export function mergeStoreTransferGroup(map: Map<string, StoreTransferGroup>, group: StoreTransferGroup) {
  const current = map.get(group.key) || {
    key: group.key,
    label: group.label,
    storeCodes: [],
    sites: []
  };
  group.storeCodes.forEach((storeCode) => {
    if (storeCode && !current.storeCodes.includes(storeCode)) {
      current.storeCodes.push(storeCode);
    }
  });
  group.sites.forEach((site) => {
    if (site && !current.sites.includes(site)) {
      current.sites.push(site);
    }
  });
  if (!current.label && group.label) {
    current.label = group.label;
  }
  map.set(group.key, current);
}

export function buildStoreTransferGroupsFromSources(stores: StoreTransferSource[] = []) {
  const map = new Map<string, StoreTransferGroup>();
  stores.forEach((store) => {
    if (!store.storeCode) {
      return;
    }
    const groupKey = store.projectCode || store.projectName || store.storeCode.replace(/-[^-]+$/, '');
    mergeStoreTransferGroup(map, {
      key: groupKey,
      label: store.projectName || store.projectCode || groupKey,
      storeCodes: [store.storeCode],
      sites: store.site ? [store.site] : []
    });
  });
  return Array.from(map.values()).sort((left, right) => left.label.localeCompare(right.label, 'zh-CN'));
}

export function buildStoreTransferGroupsFromLinks(storeLinks: MasterDataUserDetail['storeLinks'] = []) {
  return buildStoreTransferGroupsFromSources(storeLinks);
}

export function toTransferData(groups: StoreTransferGroup[]) {
  return groups.map((group) => ({
    key: group.key,
    title: group.label,
    description: group.sites.length ? group.sites.join(' / ') : group.storeCodes.join(' / ')
  }));
}

export function expandStoreGroupKeys(groups: StoreTransferGroup[], groupKeys: string[] = []) {
  return Array.from(
    new Set(
      groupKeys.flatMap((groupKey) => groups.find((group) => group.key === groupKey)?.storeCodes || [])
    )
  );
}
