import type { ShippingOrderLine } from './warehouseShippingOrderTypes';

export function isUnsupportedForwarderEligibility(line: ShippingOrderLine) {
  return (line.eligibilityStatus || 'SUPPORTED').toUpperCase() === 'UNSUPPORTED';
}

export function isInquiryRequiredForwarderEligibility(line: ShippingOrderLine) {
  return (line.eligibilityStatus || 'SUPPORTED').toUpperCase() === 'INQUIRY_REQUIRED';
}
