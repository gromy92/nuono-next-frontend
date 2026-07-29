import { formatProductEditorValue, productEditorTextValue } from './productEditorValues';

export const productOfferTextValue = productEditorTextValue;

export function productOfferStoreCode(record: Record<string, unknown>) {
  return productOfferTextValue(record.storeCode);
}

export function formatProductOfferValue(value: unknown): string {
  return formatProductEditorValue(value);
}

export function isProductOfferLiveStatusActive(status: unknown) {
  if (status === true) {
    return true;
  }
  const normalized = productOfferTextValue(status).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'live' || normalized === 'active';
}
