import { textInputValue } from './common';

export type ProductIdentityLike = {
  storeCode?: string;
  referenceStoreCode?: string;
  partnerSku?: string;
  currentZCode?: string;
  skuParent?: string;
  productVariantId?: number | string;
  variantId?: number | string;
  productSiteOfferId?: number | string;
  siteOfferId?: number | string;
};

export function normalizeProductIdentityValue(value: unknown) {
  return textInputValue(value).trim();
}

export function getProductCurrentZCode(value: ProductIdentityLike | undefined) {
  return normalizeProductIdentityValue(value?.currentZCode || value?.skuParent);
}

export function getProductIdentityStoreCode(value: ProductIdentityLike | undefined) {
  return normalizeProductIdentityValue(value?.referenceStoreCode || value?.storeCode);
}

export function getProductStableIdentityKey(value: ProductIdentityLike | undefined) {
  const storeCode = getProductIdentityStoreCode(value);
  const partnerSku = normalizeProductIdentityValue(value?.partnerSku);
  if (partnerSku) {
    return [storeCode, `psku:${partnerSku}`].filter(Boolean).join('|');
  }

  const currentZCode = getProductCurrentZCode(value);
  if (currentZCode) {
    return [storeCode, `z:${currentZCode}`].filter(Boolean).join('|');
  }

  const compatibilityRef = normalizeProductIdentityValue(
    value?.productVariantId || value?.variantId || value?.productSiteOfferId || value?.siteOfferId
  );
  return compatibilityRef ? [storeCode, `row:${compatibilityRef}`].filter(Boolean).join('|') : storeCode;
}

export function getProductListRowIdentityKey(value: ProductIdentityLike) {
  return getProductStableIdentityKey(value) || getProductCurrentZCode(value);
}

export function getProductIdentityLookupKeys(value: ProductIdentityLike | undefined) {
  const keys = new Set<string>();
  const storeCode = getProductIdentityStoreCode(value);
  const partnerSku = normalizeProductIdentityValue(value?.partnerSku);
  const currentZCode = getProductCurrentZCode(value);

  if (partnerSku) {
    keys.add([storeCode, `psku:${partnerSku}`].filter(Boolean).join('|'));
    keys.add(`psku:${partnerSku}`);
    keys.add(partnerSku);
  }
  if (currentZCode) {
    keys.add([storeCode, `z:${currentZCode}`].filter(Boolean).join('|'));
    keys.add(`z:${currentZCode}`);
    keys.add(currentZCode);
  }

  const stableKey = getProductStableIdentityKey(value);
  if (stableKey) {
    keys.add(stableKey);
  }
  return Array.from(keys).filter(Boolean);
}

export function findProductByIdentity<T extends ProductIdentityLike>(
  itemsByIdentity: Map<string, T>,
  value: ProductIdentityLike | undefined
) {
  for (const key of getProductIdentityLookupKeys(value)) {
    const item = itemsByIdentity.get(key);
    if (item) {
      return item;
    }
  }
  return undefined;
}

export function isSameStableProductIdentity(
  currentValue: ProductIdentityLike | null | undefined,
  nextValue: ProductIdentityLike | null | undefined
) {
  if (!currentValue || !nextValue) {
    return false;
  }

  const currentStoreCode = getProductIdentityStoreCode(currentValue);
  const nextStoreCode = getProductIdentityStoreCode(nextValue);
  const sameStoreScope = !currentStoreCode || !nextStoreCode || currentStoreCode === nextStoreCode;
  if (!sameStoreScope) {
    return false;
  }

  const currentPartnerSku = normalizeProductIdentityValue(currentValue.partnerSku);
  const nextPartnerSku = normalizeProductIdentityValue(nextValue.partnerSku);
  if (currentPartnerSku && nextPartnerSku) {
    return currentPartnerSku === nextPartnerSku;
  }

  const currentZCode = getProductCurrentZCode(currentValue);
  const nextZCode = getProductCurrentZCode(nextValue);
  return Boolean(currentZCode && nextZCode && currentZCode === nextZCode);
}
