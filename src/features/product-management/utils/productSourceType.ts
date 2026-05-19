export type ProductSourceType = 'SELF_BUILT' | 'FOLLOW_SELL' | string;

export function normalizeProductSourceType(value?: unknown): ProductSourceType {
  const text = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (text === 'FOLLOW_SELL') {
    return 'FOLLOW_SELL';
  }
  if (text === 'SELF_BUILT') {
    return 'SELF_BUILT';
  }
  return 'SELF_BUILT';
}

export function productSourceTypeMeta(value?: unknown) {
  const type = normalizeProductSourceType(value);
  if (type === 'FOLLOW_SELL') {
    return {
      type,
      label: '跟卖品',
      color: 'gold',
      description: '跟卖品内容来自 Noon 目录，后续只开放 Offer 经营面修改。'
    };
  }
  return {
    type,
    label: '自建品',
    color: 'blue',
    description: '自建品内容和 Offer 经营面都由当前系统管理。'
  };
}
