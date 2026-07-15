import assert from 'node:assert/strict';
import { englishDisplayValue } from './ProductAttributeFieldControl';
import type { ProductDetailedAttributeField } from '../productDetailedContentConfig';

const baseMaterialField: ProductDetailedAttributeField = {
  code: 'base_material',
  label: 'Base Material（基础材质）',
  kind: 'select',
  options: [
    { value: 'plastic', en: 'Plastic', ar: 'بلاستيك', zh: '塑料' },
    { value: 'metal', en: 'Metal', ar: 'معدن', zh: '金属' }
  ]
};

assert.equal(
  englishDisplayValue({ code: 'base_material', commonValue: 'plastic' }, baseMaterialField),
  'Plastic（塑料）'
);

assert.equal(
  englishDisplayValue(
    { code: 'base_material', commonValue: 'plastic,metal' },
    { ...baseMaterialField, multiple: true }
  ),
  'Plastic（塑料）, Metal（金属）'
);
