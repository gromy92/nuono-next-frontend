import { sanitizeProcurementCopy } from './procurementPresentationDomain';

export function parseProcurementNumberRange(rawValue?: string) {
  if (!rawValue) {
    return { min: null as number | null, max: null as number | null };
  }

  const matchedNumbers = rawValue.match(/\d+(?:\.\d+)?/g);
  if (!matchedNumbers?.length) {
    return { min: null, max: null };
  }

  const numbers = matchedNumbers
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));

  if (!numbers.length) {
    return { min: null, max: null };
  }

  return {
    min: numbers[0] ?? null,
    max: numbers.length > 1 ? numbers[1] ?? numbers[0] : numbers[0]
  };
}

export function parseProcurementLeadingInteger(rawValue?: string) {
  if (!rawValue) {
    return null;
  }

  const matched = rawValue.match(/\d+/);
  if (!matched) {
    return null;
  }

  const parsed = Number(matched[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeProcurementFieldText(rawValue?: string) {
  return sanitizeProcurementCopy(rawValue).toLowerCase().replace(/\s+/g, '');
}

export function procurementFieldTokens(rawValue?: string) {
  const normalized = sanitizeProcurementCopy(rawValue).toLowerCase();
  if (!normalized) {
    return [];
  }

  const direct = normalized.replace(/\s+/g, '');
  return Array.from(
    new Set(
      [direct, ...normalized.split(/[，,、/+\-|()（）\s]+/)]
        .map((item) => item.trim())
        .filter((item) => item.length >= 2)
    )
  );
}

export function procurementPowerMode(rawValue?: string) {
  const normalized = normalizeProcurementFieldText(rawValue);
  if (!normalized) {
    return '';
  }
  if (
    normalized.includes('充电') ||
    normalized.includes('usb') ||
    normalized.includes('电池') ||
    normalized.includes('rechargeable')
  ) {
    return '充电款';
  }
  if (normalized.includes('插电') || normalized.includes('插头') || normalized.includes('plug')) {
    return '插电款';
  }
  if (normalized.includes('无电') || normalized.includes('非电')) {
    return '无电';
  }
  if (normalized.includes('蜡烛') || normalized.includes('木炭') || normalized.includes('炭')) {
    return '蜡烛/炭';
  }
  return sanitizeProcurementCopy(rawValue);
}

export function procurementMaxDays(rawValue?: string) {
  const normalized = sanitizeProcurementCopy(rawValue);
  if (!normalized) {
    return null;
  }

  const matchedNumbers = normalized.match(/\d+/g);
  if (!matchedNumbers?.length) {
    if (normalized.includes('现货')) {
      return 3;
    }
    return null;
  }

  const numbers = matchedNumbers
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
  if (!numbers.length) {
    return null;
  }
  return Math.max(...numbers);
}
