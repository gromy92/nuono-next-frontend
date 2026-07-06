import type { ProductOperationStageCode } from '../types';

export type ProductOperationStageMeta = {
  value: ProductOperationStageCode;
  label: string;
  color: 'cyan' | 'green' | 'gold' | 'red';
};

const PRODUCT_OPERATION_STAGE_META: Record<ProductOperationStageCode, ProductOperationStageMeta> = {
  TESTING: {
    value: 'TESTING',
    label: '测试新品',
    color: 'cyan'
  },
  STABLE: {
    value: 'STABLE',
    label: '稳定销售',
    color: 'green'
  },
  WATCH: {
    value: 'WATCH',
    label: '观察调整',
    color: 'gold'
  },
  CLEARANCE: {
    value: 'CLEARANCE',
    label: '清仓',
    color: 'red'
  }
};

export const PRODUCT_OPERATION_STAGE_OPTIONS: ProductOperationStageMeta[] = [
  PRODUCT_OPERATION_STAGE_META.TESTING,
  PRODUCT_OPERATION_STAGE_META.STABLE,
  PRODUCT_OPERATION_STAGE_META.WATCH,
  PRODUCT_OPERATION_STAGE_META.CLEARANCE
];

export const PRODUCT_OPERATION_STAGE_FILTER_OPTIONS = [
  { label: '全部阶段', value: 'all' },
  { label: '未设置', value: 'unset' },
  ...PRODUCT_OPERATION_STAGE_OPTIONS.map((option) => ({ label: option.label, value: option.value }))
];

export const PRODUCT_OPERATION_STAGE_SELECT_OPTIONS = [
  { label: '未设置', value: '' },
  ...PRODUCT_OPERATION_STAGE_OPTIONS.map((option) => ({ label: option.label, value: option.value }))
];

export function normalizeProductOperationStageCode(value?: string | null): ProductOperationStageCode | undefined {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (normalized === 'TESTING' || normalized === 'STABLE' || normalized === 'WATCH' || normalized === 'CLEARANCE') {
    return normalized;
  }
  return undefined;
}

export function productOperationStageMeta(value?: string | null) {
  const code = normalizeProductOperationStageCode(value);
  return code
    ? PRODUCT_OPERATION_STAGE_META[code]
    : {
        value: undefined,
        label: '未设置',
        color: 'default' as const
      };
}
