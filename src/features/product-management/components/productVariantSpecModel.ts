import type { ProductVariantSpecLogisticsValue, ProductVariantSpecPayload } from '../../product-specs/types';
import { getProductStableIdentityKey } from '../../product-domain/productIdentity';
import { textInputValue } from '../utils/common';

export type NumericSpecField =
  | 'productLengthCm'
  | 'productWidthCm'
  | 'productHeightCm'
  | 'productWeightG'
  | 'cartonLengthCm'
  | 'cartonWidthCm'
  | 'cartonHeightCm'
  | 'cartonWeightKg'
  | 'cartonQuantity';

export type NumericSpecConfig = {
  label: string;
  field: NumericSpecField;
  unit: string;
  precision?: number;
};

export const batteryOptions: Array<{ label: string; value: ProductVariantSpecLogisticsValue }> = [
  { label: '待确认', value: 'unknown' },
  { label: '无', value: 'none' },
  { label: '带电', value: 'battery' },
  { label: '带磁', value: 'magnetic' },
  { label: '带电+带磁', value: 'battery_and_magnetic' }
];

export const liquidOptions: Array<{ label: string; value: ProductVariantSpecLogisticsValue }> = [
  { label: '待确认', value: 'unknown' },
  { label: '无', value: 'none' },
  { label: '液体', value: 'liquid' },
  { label: '粉末', value: 'powder' },
  { label: '液体+粉末', value: 'liquid_and_powder' }
];

const statusLabels: Record<string, string> = {
  ready: '完整',
  missing_dimensions: '缺尺寸',
  missing_weight: '缺重量',
  missing_carton_quantity: '缺箱装数',
  logistics_attribute_unknown: '物流属性待确认',
  not_found: '未维护'
};

const missingFieldLabels: Record<string, string> = {
  spec_not_found: '未维护',
  dimensions: '尺寸',
  weight: '重量',
  logistics_attribute: '物流属性',
  product_length_cm: '产品长',
  product_width_cm: '产品宽',
  product_height_cm: '产品高',
  product_weight_g: '产品重量',
  carton_length_cm: '外箱长',
  carton_width_cm: '外箱宽',
  carton_height_cm: '外箱高',
  carton_weight_kg: '外箱重量',
  carton_quantity: '箱装数',
  battery_magnetic_type: '带电/磁',
  liquid_powder_type: '液体/粉末'
};

export const productSpecFields: NumericSpecConfig[] = [
  { label: '产品长', field: 'productLengthCm', unit: 'cm' },
  { label: '产品宽', field: 'productWidthCm', unit: 'cm' },
  { label: '产品高', field: 'productHeightCm', unit: 'cm' },
  { label: '产品重量', field: 'productWeightG', unit: 'g' }
];

export const cartonSpecFields: NumericSpecConfig[] = [
  { label: '外箱长', field: 'cartonLengthCm', unit: 'cm' },
  { label: '外箱宽', field: 'cartonWidthCm', unit: 'cm' },
  { label: '外箱高', field: 'cartonHeightCm', unit: 'cm' },
  { label: '外箱重量', field: 'cartonWeightKg', unit: 'kg', precision: 3 },
  { label: '箱装数', field: 'cartonQuantity', unit: '件', precision: 0 }
];

export function specRowKey(row: ProductVariantSpecPayload) {
  return [
    getProductStableIdentityKey(row),
    row.childSku || row.sizeEn || row.sizeAr || row.variantId
  ].map((value) => textInputValue(value).trim()).join(':');
}

export function statusLabel(status?: string) {
  return status ? statusLabels[status] ?? status : '缺规格';
}

export function missingFieldLabel(field: string) {
  return missingFieldLabels[field] ?? field;
}
