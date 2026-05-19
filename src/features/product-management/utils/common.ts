import dayjs from 'dayjs';
import type { ProductMasterSnapshotPayload, ProductSyncStatus, ProductWorkbenchPayload } from '../types';

export function parseOptionalNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = String(value).replace(/,/g, '').trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function aggregateFbnStock(record?: Record<string, unknown>) {
  return (parseOptionalNumber(record?.fbnStock) ?? 0) + (parseOptionalNumber(record?.supermallStock) ?? 0);
}

export function formatSnapshotValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatSnapshotValue(item)).join(' / ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function formatDateTimeParts(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return {
      date: value,
      time: ''
    };
  }

  return {
    date: parsed.format('YYYY-MM-DD'),
    time: parsed.format('HH:mm:ss')
  };
}

export function snapshotPayloadCore(payload: ProductMasterSnapshotPayload | ProductWorkbenchPayload): ProductMasterSnapshotPayload {
  return {
    mode: payload.mode,
    ready: payload.ready,
    message: payload.message,
    warnings: Array.isArray(payload.warnings) ? [...payload.warnings] : [],
    missingCoreTables: Array.isArray(payload.missingCoreTables) ? [...payload.missingCoreTables] : [],
    storeContext: cloneRecord(payload.storeContext),
    identity: cloneRecord(payload.identity),
    taxonomy: cloneRecord(payload.taxonomy),
    content: cloneRecord(payload.content),
    platformSignals: cloneRecord(payload.platformSignals ?? {}),
    keyAttributes: cloneRecordList(payload.keyAttributes),
    group: cloneRecord(payload.group),
    variants: cloneRecordList(payload.variants),
    pricing: cloneRecord(payload.pricing),
    stock: cloneRecord(payload.stock),
    siteOffers: cloneRecordList(payload.siteOffers)
  };
}

export function cloneSnapshotPayload(payload: ProductMasterSnapshotPayload | ProductWorkbenchPayload) {
  return snapshotPayloadCore(payload);
}

export function cloneRecord(record: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(record)) as Record<string, unknown>;
}

export function cloneRecordList(list: Array<Record<string, unknown>>) {
  return JSON.parse(JSON.stringify(list)) as Array<Record<string, unknown>>;
}

export function areSnapshotPartsEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function splitMultilineValue(value: string) {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function joinMultilineValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '')).join('\n');
  }
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

export function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item ?? '').trim()).filter((item) => item.length > 0);
}

export function normalizeSnapshotTextList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter((item) => item.length > 0);
  }
  if (value === null || value === undefined) {
    return [];
  }
  const normalized = String(value).trim();
  return normalized ? [normalized] : [];
}

function hasImageExtension(value: string) {
  return /\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(value);
}

export function normalizeNoonImageUrl(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return '';
  }

  let normalized = raw;
  if (/^original\/pzsku\//i.test(normalized)) {
    normalized = normalized.replace(/^original\/pzsku\//i, 'https://f.nooncdn.com/p/pzsku/');
  } else if (/^pzsku\//i.test(normalized)) {
    normalized = `https://f.nooncdn.com/p/${normalized}`;
  } else if (/^https:\/\/f\.nooncdn\.com\/p\/original\/pzsku\//i.test(normalized)) {
    normalized = normalized.replace(
      /^https:\/\/f\.nooncdn\.com\/p\/original\/pzsku\//i,
      'https://f.nooncdn.com/p/pzsku/'
    );
  } else if (/^https:\/\/f\.nooncdn\.com\/pzsku\//i.test(normalized)) {
    normalized = normalized.replace(/^https:\/\/f\.nooncdn\.com\/pzsku\//i, 'https://f.nooncdn.com/p/pzsku/');
  }

  if (/^https:\/\/f\.nooncdn\.com\/p\/pzsku\//i.test(normalized) && !hasImageExtension(normalized)) {
    return `${normalized}.jpg`;
  }
  return normalized;
}

function galleryImageDedupeKey(value: string) {
  const normalized = value.trim().toLowerCase();
  const uuidMatch = normalized.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuidMatch) {
    return uuidMatch[0].toLowerCase();
  }

  return normalized.replace(/[?#].*$/, '');
}

export function mergeGalleryImageUrls(...values: unknown[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const candidates = Array.isArray(value) ? value : value ? [value] : [];
    candidates.forEach((item) => {
      const normalized = normalizeNoonImageUrl(item);
      const dedupeKey = normalized ? galleryImageDedupeKey(normalized) : '';
      if (!normalized || seen.has(dedupeKey)) {
        return;
      }
      seen.add(dedupeKey);
      result.push(normalized);
    });
  });

  return result;
}

export function textInputValue(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

export function siteOfferCode(record: Record<string, unknown>) {
  if (typeof record.storeCode === 'string' && record.storeCode) {
    return record.storeCode;
  }
  return String(record.storeCode ?? '');
}

export function nowSyncTime() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

export function normalizeProductSyncStatus(value: unknown): ProductSyncStatus | undefined {
  if (value === 'conflict') {
    return 'draft';
  }
  if (value === 'synced' || value === 'draft' || value === 'failed') {
    return value;
  }
  return undefined;
}

export function siteOfferEditableFieldsEqual(
  left: Record<string, unknown> | undefined,
  right: Record<string, unknown> | undefined
) {
  const numericKeys = new Set(['price', 'salePrice', 'priceMin', 'priceMax', 'idWarranty']);
  const booleanKeys = new Set(['isActive']);
  const keys = [
    'price',
    'salePrice',
    'saleStart',
    'saleEnd',
    'priceMin',
    'priceMax',
    'isActive',
    'idWarranty',
    'offerNote'
  ];
  return keys.every((key) => {
    const leftValue = left?.[key];
    const rightValue = right?.[key];
    if (numericKeys.has(key)) {
      const leftNumber = parseOptionalNumber(leftValue);
      const rightNumber = parseOptionalNumber(rightValue);
      if (leftNumber === null || rightNumber === null) {
        return String(leftValue ?? '') === String(rightValue ?? '');
      }
      return leftNumber === rightNumber;
    }
    if (booleanKeys.has(key)) {
      return Boolean(leftValue) === Boolean(rightValue);
    }
    return String(leftValue ?? '') === String(rightValue ?? '');
  });
}
