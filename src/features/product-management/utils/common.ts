import dayjs from 'dayjs';
import type { ProductSyncStatus } from '../types';
import { normalizeNoonImageUrl } from '../../product-baseline';
import {
  formatProductValue,
  productTextInputValue
} from '../../product-domain/productValueFormatting';
export { normalizeNoonImageUrl };
export {
  formatProductValue as formatSnapshotValue,
  productTextInputValue as textInputValue
};

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
