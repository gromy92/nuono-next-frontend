import type { ProductDetailedAttributeField } from '../product-domain/productDetailedAttributeCatalog';

const LENGTH_UNIT_OPTIONS = ['mm', 'cm', 'm', 'in', 'ft'].map((unit) => ({
  value: unit,
  label: unit
}));
const WEIGHT_UNIT_OPTIONS = ['g', 'KG', 'lb', 'lbs'].map((unit) => ({
  value: unit,
  label: unit
}));

export function productAttributeUnitOptions(field: ProductDetailedAttributeField) {
  if (field.unitOptions?.length) {
    return field.unitOptions.map((unit) => ({ value: unit, label: unit }));
  }
  return field.code.includes('weight') ? WEIGHT_UNIT_OPTIONS : LENGTH_UNIT_OPTIONS;
}
