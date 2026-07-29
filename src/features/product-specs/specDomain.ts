import type { AuthSession, AuthSessionStore } from '../auth/session'
import { getProductCurrentZCode, getProductStableIdentityKey } from '../product-domain/productIdentity'
import {
  logisticsFieldConfigs, productSpecFields,
  type EditableSourceType, type LogisticsAttributeFilter, type LogisticsProfileField,
  type SpecSourceDraft
} from './specPageConfig'
import type { ProductLogisticsProfilePayload, ProductVariantSpecPayload, ProductVariantSpecSourcePayload, ProductVariantSpecSourceType } from './types'

export function readInitialProductSpecsKeyword() {
  if (typeof window === 'undefined') {
    return '';
  }
  return new URLSearchParams(window.location.search).get('keyword')?.trim() || '';
}

export function isConfirmedLogisticsValue(value: string) {
  return Boolean(value && value !== 'unknown');
}

export function logisticsValueKind(value: string) {
  if (!isConfirmedLogisticsValue(value)) {
    return 'missing';
  }
  return value === 'none' ? 'none' : 'included';
}

export function withLogisticsConfirmationStatus(profile: ProductLogisticsProfilePayload): ProductLogisticsProfilePayload {
  const confirmed = logisticsFieldConfigs.every((config) =>
    isConfirmedLogisticsValue(String(profile[config.field] || 'unknown'))
  );
  return {
    ...profile,
    profileStatus: confirmed ? 'confirmed' : 'needs_review',
    manualConfirmRequired: !confirmed
  };
}


export function findSource(
  sources: ProductVariantSpecSourcePayload[] | undefined,
  sourceType: ProductVariantSpecSourceType
) {
  return (sources || []).find((source) => source.sourceType === sourceType);
}

export function isOfficialSpecMissing(row: ProductVariantSpecPayload) {
  return isSourceProductSpecMissing(findSource(row.sources, 'noon_official'));
}

export function isDomesticSpecMissing(row: ProductVariantSpecPayload) {
  return (
    isSourceProductSpecMissing(findSource(row.sources, 'ali1688')) &&
    isSourceProductSpecMissing(findSource(row.sources, 'warehouse'))
  );
}

export function isLogisticsProfileMissing(row: ProductVariantSpecPayload) {
  const profile = {
    ...defaultLogisticsProfile(row, row.storeCode),
    ...row.logisticsProfile
  };
  return logisticsFieldConfigs.some((config) => !isConfirmedLogisticsValue(String(profile[config.field] || 'unknown')));
}

export function rowMatchesLogisticsAttributeFilter(row: ProductVariantSpecPayload, filter: LogisticsAttributeFilter) {
  if (filter === 'all') {
    return true;
  }
  const separatorIndex = filter.indexOf(':');
  if (separatorIndex < 0) {
    return true;
  }
  const field = filter.slice(0, separatorIndex) as LogisticsProfileField;
  const expectedValue = filter.slice(separatorIndex + 1);
  if (!logisticsFieldConfigs.some((config) => config.field === field)) {
    return true;
  }
  const profile = {
    ...defaultLogisticsProfile(row, row.storeCode),
    ...row.logisticsProfile
  };
  return String(profile[field] || 'unknown') === expectedValue;
}

export function isSourceProductSpecMissing(source?: ProductVariantSpecSourcePayload) {
  if (!source) {
    return true;
  }
  return productSpecFields.some((field) => !isPositiveSpecValue(source[field.key]));
}

export function isPositiveSpecValue(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function defaultLogisticsProfile(row: ProductVariantSpecPayload, storeCode?: string): ProductLogisticsProfilePayload {
  return {
    storeCode: row.storeCode || storeCode,
    skuParent: row.skuParent,
    currentZCode: getProductCurrentZCode(row),
    title: row.title,
    imageUrl: row.imageUrl,
    variantId: row.variantId,
    partnerSku: row.partnerSku,
    childSku: row.childSku,
    sizeEn: row.sizeEn,
    sizeAr: row.sizeAr,
    profileStatus: 'needs_review',
    batteryType: 'unknown',
    electricType: 'unknown',
    magneticType: 'unknown',
    liquidType: 'unknown',
    powderType: 'unknown',
    woodenMaterialType: 'unknown',
    bladeWeaponType: 'unknown',
    manualConfirmRequired: true
  };
}

export type ProductSpecStoreScope = {
  storeCode: string;
};

export function resolveCurrentSpecStoreScope(session: AuthSession): ProductSpecStoreScope {
  const stores = collectSpecStores(session);
  const currentStore = resolveCurrentSpecBusinessStore(session, stores);
  if (!currentStore?.storeCode) {
    return { storeCode: '' };
  }
  const currentGroupKey = specBusinessStoreKey(currentStore);
  const groupStores = stores.filter((store) => specBusinessStoreKey(store) === currentGroupKey);
  const requestStore =
    groupStores
      .filter((store) => store.storeCode && store.authorized !== false)
      .sort(compareSpecRequestStores)[0] ||
    groupStores.filter((store) => store.storeCode).sort(compareSpecRequestStores)[0] ||
    currentStore;
  return {
    storeCode: requestStore.storeCode || currentStore.storeCode || ''
  };
}

export function collectSpecStores(session: AuthSession) {
  const stores: AuthSessionStore[] = [];
  const seen = new Set<string>();
  const addStore = (store?: AuthSessionStore | null) => {
    if (!store?.storeCode) {
      return;
    }
    const key = `${store.storeCode}::${store.site || ''}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    stores.push(store);
  };
  (session.userStores || []).forEach(addStore);
  addStore(session.currentStore);
  return stores;
}

export function resolveCurrentSpecBusinessStore(session: AuthSession, stores: AuthSessionStore[]) {
  const currentStoreCode = session.currentStore?.storeCode;
  const currentSite = session.currentStore?.site;
  if (currentStoreCode) {
    return (
      stores.find(
        (store) => store.storeCode === currentStoreCode && String(store.site || '') === String(currentSite || '')
      ) ||
      stores.find((store) => store.storeCode === currentStoreCode) ||
      session.currentStore
    );
  }
  return stores.find((store) => store.authorized !== false) || stores[0];
}

export function specBusinessStoreKey(store: AuthSessionStore) {
  return store.projectCode || store.orgCode || store.projectName || store.storeCode;
}

export function specBusinessStoreLabel(store: AuthSessionStore) {
  return store.projectName || store.orgName || store.projectCode || store.storeCode;
}

export function compareSpecRequestStores(left: AuthSessionStore, right: AuthSessionStore) {
  return (
    String(left.storeCode || '').localeCompare(String(right.storeCode || '')) ||
    String(left.site || '').localeCompare(String(right.site || ''))
  );
}

export function buildStoreLabelByCode(session: AuthSession) {
  const labels = new Map<string, string>();
  collectSpecStores(session).forEach((store) => {
    if (!store.storeCode || labels.has(store.storeCode)) {
      return;
    }
    labels.set(store.storeCode, specBusinessStoreLabel(store));
  });
  return labels;
}

export function resolveRequestOwnerUserId(session: AuthSession, activeOwnerId?: number) {
  if (session.defaultOwnerUserId) {
    return activeOwnerId || session.defaultOwnerUserId;
  }
  return undefined;
}

export function specGridStyle(props: { includeCarton: boolean; includeSource: boolean; includeEffective?: boolean }) {
  const { includeCarton, includeSource, includeEffective = false } = props;
  const prefixColumns = [
    includeEffective ? '20px' : '',
    includeSource ? (includeCarton ? '76px' : '0px') : ''
  ].filter(Boolean);
  const valueColumns = includeCarton ? 'repeat(9, minmax(22px, 1fr))' : 'repeat(4, minmax(22px, 1fr))';
  return {
    display: 'grid',
    gridTemplateColumns: [...prefixColumns, valueColumns].join(' '),
    gap: '5px 4px',
    alignItems: 'center',
    minWidth: 0
  } as const;
}

export const headerCellStyle = {
  fontSize: 12,
  lineHeight: '18px',
  whiteSpace: 'nowrap'
} as const;

export function createSpecSourceDraft(
  source?: ProductVariantSpecSourcePayload | ProductVariantSpecPayload,
  sourceType?: EditableSourceType
): SpecSourceDraft {
  return {
    productLengthCm: source?.productLengthCm ?? undefined,
    productWidthCm: source?.productWidthCm ?? undefined,
    productHeightCm: source?.productHeightCm ?? undefined,
    productWeightG: source?.productWeightG ?? undefined,
    cartonLengthCm: source?.cartonLengthCm ?? undefined,
    cartonWidthCm: source?.cartonWidthCm ?? undefined,
    cartonHeightCm: source?.cartonHeightCm ?? undefined,
    cartonWeightKg: source?.cartonWeightKg ?? undefined,
    cartonQuantity: source?.cartonQuantity ?? undefined,
    cartonSourceType:
      source?.cartonSourceType ??
      (sourceType === 'ali1688' ? 'factory_carton' : sourceType === 'warehouse' ? 'warehouse_measured' : 'none'),
    batteryMagneticType: source?.batteryMagneticType ?? 'unknown',
    liquidPowderType: source?.liquidPowderType ?? 'unknown'
  };
}

export function normalizeDraftNumber(value: number | string | null) {
  if (value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function buildEditKey(row: ProductVariantSpecPayload, sourceType: EditableSourceType) {
  return `${productSpecRowKey(row)}:${sourceType}`;
}

export function productSpecRowKey(row: ProductVariantSpecPayload) {
  return [
    getProductStableIdentityKey(row),
    row.childSku || row.sizeEn || row.sizeAr || row.variantId
  ].map((value) => String(value ?? '').trim()).filter(Boolean).join(':');
}

export function formatCompactNumber(value: number) {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  return Number.isInteger(value) ? String(value) : String(value).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}
