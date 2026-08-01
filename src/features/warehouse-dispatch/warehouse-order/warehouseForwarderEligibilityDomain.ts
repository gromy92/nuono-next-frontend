import type { ShippingOrderLine } from '../../purchase-order/types';

export function isUnsupportedForwarderEligibility(line: ShippingOrderLine) {
  return (line.eligibilityStatus || 'SUPPORTED').toUpperCase() === 'UNSUPPORTED';
}

export function isInquiryRequiredForwarderEligibility(line: ShippingOrderLine) {
  return (line.eligibilityStatus || 'SUPPORTED').toUpperCase() === 'INQUIRY_REQUIRED';
}
