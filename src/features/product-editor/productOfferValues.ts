export function productOfferTextValue(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

export function productOfferStoreCode(record: Record<string, unknown>) {
  return productOfferTextValue(record.storeCode);
}

export function formatProductOfferValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatProductOfferValue(item)).join(' / ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function isProductOfferLiveStatusActive(status: unknown) {
  if (status === true) {
    return true;
  }
  const normalized = productOfferTextValue(status).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'live' || normalized === 'active';
}
