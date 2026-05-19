import { textInputValue } from './common';

export function barcodeFromKeyAttributes(keyAttributes: Array<Record<string, unknown>>) {
  for (const attribute of keyAttributes) {
    const code = textInputValue(attribute.code).toLowerCase();
    if (!['barcode', 'gtin', 'ean', 'upc'].some((keyword) => code.includes(keyword))) {
      continue;
    }
    const value =
      textInputValue(attribute.commonValue).trim() ||
      textInputValue(attribute.enValue).trim() ||
      textInputValue(attribute.arValue).trim();
    if (value) {
      return value;
    }
  }
  return undefined;
}
