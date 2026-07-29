import type { AuthSession } from '../auth/session'
import type { ProductVariantSpecSourcePayload, ProductVariantSpecSourceType } from './types'

export type ProductSpecsPageProps = {
  session: AuthSession;
  activeOwnerId?: number;
};

export const sourceLabels: Record<string, string> = {
  ali1688: '1688',
  warehouse: '仓管',
  noon_official: 'Noon官方'
};

export const sourceColors: Record<string, string> = {
  ali1688: 'blue',
  warehouse: 'green',
  noon_official: 'purple'
};

export type SpecNumberField =
  | 'productLengthCm'
  | 'productWidthCm'
  | 'productHeightCm'
  | 'productWeightG'
  | 'cartonLengthCm'
  | 'cartonWidthCm'
  | 'cartonHeightCm'
  | 'cartonWeightKg'
  | 'cartonQuantity';

export type EditableSourceType = Extract<ProductVariantSpecSourceType, 'ali1688'>;
export type SpecCompletenessFilter =
  | 'all'
  | 'ali1688_missing'
  | 'warehouse_missing'
  | 'domestic_missing'
  | 'official_missing'
  | 'logistics_missing';

export type SpecSourceDraft = Pick<
  ProductVariantSpecSourcePayload,
  | SpecNumberField
  | 'cartonSourceType'
  | 'batteryMagneticType'
  | 'liquidPowderType'
>;

export type SpecField = {
  key: SpecNumberField;
  label: string;
  min?: number;
  precision?: number;
};

export type LogisticsOption = {
  value: string;
  label: string;
};

export const productSpecFields: SpecField[] = [
  { key: 'productLengthCm', label: '长/cm', min: 0.01, precision: 2 },
  { key: 'productWidthCm', label: '宽/cm', min: 0.01, precision: 2 },
  { key: 'productHeightCm', label: '高/cm', min: 0.01, precision: 2 },
  { key: 'productWeightG', label: '重/g', min: 0.01, precision: 2 }
];

export const cartonSpecFields: SpecField[] = [
  { key: 'cartonLengthCm', label: '箱长/cm', min: 0.01, precision: 2 },
  { key: 'cartonWidthCm', label: '箱宽/cm', min: 0.01, precision: 2 },
  { key: 'cartonHeightCm', label: '箱高/cm', min: 0.01, precision: 2 },
  { key: 'cartonWeightKg', label: '箱重/kg', min: 0.001, precision: 3 },
  { key: 'cartonQuantity', label: '数量', min: 1, precision: 0 }
];

export const magneticLogisticsOptions: LogisticsOption[] = [
  { label: '磁性', value: 'unknown' },
  { label: '不带磁', value: 'none' },
  { label: '带磁', value: 'magnetic' }
];

export type LogisticsProfileField =
  | 'batteryType'
  | 'electricType'
  | 'magneticType'
  | 'liquidType'
  | 'powderType'
  | 'woodenMaterialType'
  | 'bladeWeaponType';

export type LogisticsFieldConfig = {
  field: LogisticsProfileField;
  ariaLabel: string;
  options: LogisticsOption[];
};

export const logisticsFieldConfigs: LogisticsFieldConfig[] = [
  {
    field: 'batteryType',
    ariaLabel: '带电',
    options: [
      { label: '带电', value: 'unknown' },
      { label: '不带电', value: 'none' },
      { label: '带电', value: 'battery_equipment' }
    ]
  },
  {
    field: 'electricType',
    ariaLabel: '电器',
    options: [
      { label: '电器', value: 'unknown' },
      { label: '非电器', value: 'none' },
      { label: '电器', value: 'electric_equipment_review' }
    ]
  },
  {
    field: 'magneticType',
    ariaLabel: '磁性',
    options: magneticLogisticsOptions
  },
  {
    field: 'liquidType',
    ariaLabel: '液体',
    options: [
      { label: '液体', value: 'unknown' },
      { label: '非液体', value: 'none' },
      { label: '液体', value: 'liquid' }
    ]
  },
  {
    field: 'powderType',
    ariaLabel: '粉末',
    options: [
      { label: '粉末', value: 'unknown' },
      { label: '非粉末', value: 'none' },
      { label: '粉末', value: 'powder' }
    ]
  },
  {
    field: 'woodenMaterialType',
    ariaLabel: '木材',
    options: [
      { label: '木材', value: 'unknown' },
      { label: '非木材', value: 'none' },
      { label: '木材', value: 'wooden_material_review' }
    ]
  },
  {
    field: 'bladeWeaponType',
    ariaLabel: '刀具',
    options: [
      { label: '刀具', value: 'unknown' },
      { label: '非刀具', value: 'none' },
      { label: '刀具', value: 'blade_tool_review' }
    ]
  }
];

export type LogisticsAttributeFilter = 'all' | `${LogisticsProfileField}:${string}`;

export const logisticsAttributeFilterOptions: Array<{ value: LogisticsAttributeFilter; label: string }> = [
  { value: 'all', label: '全部物流属性' },
  ...logisticsFieldConfigs.flatMap((config) =>
    config.options.map((option) => ({
      value: `${config.field}:${option.value}` as LogisticsAttributeFilter,
      label: `${config.ariaLabel}：${logisticsFilterOptionLabel(option)}`
    }))
  )
];


export function logisticsFilterOptionLabel(option: LogisticsOption) {
  return option.value === 'unknown' ? '未选择' : option.label
}
