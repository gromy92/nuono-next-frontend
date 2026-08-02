import type { ShippingOrderLine } from './warehouseShippingOrderTypes';

export type EffectiveForwarderEligibilityStatus =
  | 'SUPPORTED'
  | 'INQUIRY_REQUIRED'
  | 'UNSUPPORTED'
  | 'UNKNOWN';

export function normalizeForwarderEligibilityStatus(
  status?: string | null
): EffectiveForwarderEligibilityStatus {
  const normalized = String(status || '').trim().toUpperCase();
  return normalized === 'SUPPORTED'
    || normalized === 'INQUIRY_REQUIRED'
    || normalized === 'UNSUPPORTED'
    ? normalized
    : 'UNKNOWN';
}

export function isSupportedForwarderEligibility(line: ShippingOrderLine) {
  return normalizeForwarderEligibilityStatus(line.eligibilityStatus) === 'SUPPORTED';
}

export function isUnsupportedForwarderEligibility(line: ShippingOrderLine) {
  return normalizeForwarderEligibilityStatus(line.eligibilityStatus) === 'UNSUPPORTED';
}

export function isInquiryRequiredForwarderEligibility(line: ShippingOrderLine) {
  return normalizeForwarderEligibilityStatus(line.eligibilityStatus) === 'INQUIRY_REQUIRED';
}

export function isUnknownForwarderEligibility(line: ShippingOrderLine) {
  return normalizeForwarderEligibilityStatus(line.eligibilityStatus) === 'UNKNOWN';
}
