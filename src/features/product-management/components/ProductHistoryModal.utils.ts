import type { ProductSummarySurface } from '../types';
import { formatDateTimeParts, normalizeSnapshotTextList, textInputValue } from '../utils';

export const PRODUCT_HISTORY_FILTER_ALL = 'all';

export type ProductHistoryFilter = 'all' | 'success' | 'failed' | 'draft' | 'content' | 'offer' | 'price';
export type ProductHistoryItem = Record<string, unknown>;
export type ProductHistoryChange = Record<string, unknown>;

export function rawHistoryText(value: unknown) {
  return textInputValue(value).trim();
}

export function historyChangeRecords(item: ProductHistoryItem) {
  if (!Array.isArray(item.changes)) {
    return [];
  }
  return item.changes.filter((change): change is ProductHistoryChange => Boolean(change) && typeof change === 'object');
}

export function historyStatusMeta(item: ProductHistoryItem) {
  const resultStatus = rawHistoryText(item.resultStatus);
  const statusLabel = rawHistoryText(item.statusLabel);
  const actionType = rawHistoryText(item.actionType);

  if (resultStatus === 'failed' || statusLabel.includes('失败')) {
    return { label: statusLabel || '发布失败', color: 'error' as const };
  }
  if (resultStatus === 'pending_manual_check' || statusLabel.includes('人工核对')) {
    return { label: statusLabel || '待人工核对', color: 'warning' as const };
  }
  if (resultStatus === 'draft' || actionType === 'save' || statusLabel.includes('草稿') || statusLabel.includes('保存')) {
    return { label: statusLabel || '草稿保存', color: 'processing' as const };
  }
  if (resultStatus === 'synced' || statusLabel.includes('成功')) {
    return { label: statusLabel || '发布成功', color: 'success' as const };
  }
  if (['pending_effective', 'write_unknown', 'verify_timeout', 'running', 'queued'].includes(resultStatus)) {
    return { label: statusLabel || '发布中', color: 'processing' as const };
  }
  if (actionType === 'pull') {
    return { label: statusLabel || '同步记录', color: 'default' as const };
  }
  return { label: statusLabel || resultStatus || '历史记录', color: 'default' as const };
}

export function historyChangeTypeLabel(changeType: string) {
  const labels: Record<string, string> = {
    title: '标题',
    description: '详情',
    images: '图片',
    publish: '发布',
    pull: '同步',
    save: '保存',
    'rollback-draft': '回滚',
    content: '图文',
    offer: '经营',
    sizes: '尺码',
    attribute: '属性'
  };
  return labels[changeType] ?? changeType;
}

export function historyItemTime(item: ProductHistoryItem) {
  return rawHistoryText(item.publishedAt) || rawHistoryText(item.visibleAt) || rawHistoryText(item.visibleAfter);
}

export function formatHistoryDateTime(value: unknown, withSeconds = true) {
  const text = rawHistoryText(value);
  if (!text) {
    return '';
  }
  const isoMatch = text.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?/);
  if (isoMatch) {
    return `${isoMatch[1]} ${isoMatch[2]}${withSeconds && isoMatch[3] ? `:${isoMatch[3]}` : ''}`;
  }
  const parts = formatDateTimeParts(text);
  if (!parts) {
    return text;
  }
  return `${parts.date}${parts.time ? ` ${withSeconds ? parts.time : parts.time.slice(0, 5)}` : ''}`.trim();
}

export function historyImageUrls(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => rawHistoryText(item)).filter((item) => /^https?:\/\//.test(item));
}

export function historyChangeFieldLabel(change: ProductHistoryChange) {
  return rawHistoryText(change.label) || rawHistoryText(change.field) || '字段';
}

export function formatHistoryValue(
  value: unknown,
  change: ProductHistoryChange,
  summary?: ProductSummarySurface | null
) {
  if (isUnsetValue(value)) {
    return '未设置';
  }
  if (Array.isArray(value)) {
    return isImageChange(change) ? `${value.length} 张图片` : value.map((item) => rawHistoryText(item)).join('、');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  if (isDateField(change)) {
    return formatHistoryDateTime(value, false);
  }
  const text = rawHistoryText(value);
  if (isPriceField(change) && /^-?\d+(\.\d+)?$/.test(text)) {
    return `${summary?.currency || ''} ${text}`.trim();
  }
  return text;
}

export function filterProductHistoryItems(items: ProductHistoryItem[], filter: ProductHistoryFilter) {
  return items.filter((item) => matchesHistoryFilter(item, filter));
}

export function buildProductHistoryFilterOptions(items: ProductHistoryItem[]) {
  const candidates: Array<{ label: string; value: ProductHistoryFilter; count: number }> = [
    { label: '全部', value: 'all', count: items.length },
    { label: '发布成功', value: 'success', count: filterProductHistoryItems(items, 'success').length },
    { label: '发布失败', value: 'failed', count: filterProductHistoryItems(items, 'failed').length },
    { label: '草稿保存', value: 'draft', count: filterProductHistoryItems(items, 'draft').length },
    { label: '图文', value: 'content', count: filterProductHistoryItems(items, 'content').length },
    { label: '经营', value: 'offer', count: filterProductHistoryItems(items, 'offer').length },
    { label: '价格', value: 'price', count: filterProductHistoryItems(items, 'price').length }
  ];

  return candidates
    .filter((item) => item.value === 'all' || item.count > 0)
    .map((item) => ({ label: `${item.label} ${item.count}`, value: item.value }));
}

function isUnsetValue(value: unknown) {
  const text = rawHistoryText(value);
  return !text || text === '空' || text === '-' || text.toLowerCase() === 'null';
}

function isDateField(change: ProductHistoryChange) {
  const field = rawHistoryText(change.field).toLowerCase();
  const label = rawHistoryText(change.label);
  return field.includes('date') || field.includes('time') || field.includes('start') || field.includes('end') || label.includes('时间') || label.includes('开始') || label.includes('结束');
}

function isPriceField(change: ProductHistoryChange) {
  const field = rawHistoryText(change.field).toLowerCase();
  const label = rawHistoryText(change.label);
  return field.includes('price') || label.includes('价');
}

function isImageChange(change: ProductHistoryChange) {
  const field = rawHistoryText(change.field).toLowerCase();
  const label = rawHistoryText(change.label);
  return field.includes('image') || label.includes('图片');
}

function hasContentChange(item: ProductHistoryItem) {
  const changeTypes = normalizeSnapshotTextList(item.changeTypes);
  return changeTypes.some((type) => ['content', 'title', 'description', 'images'].includes(type));
}

function hasOfferChange(item: ProductHistoryItem) {
  return normalizeSnapshotTextList(item.changeTypes).includes('offer');
}

function hasPriceChange(item: ProductHistoryItem) {
  return historyChangeRecords(item).some(isPriceField);
}

function matchesHistoryFilter(item: ProductHistoryItem, filter: ProductHistoryFilter) {
  const meta = historyStatusMeta(item);
  if (filter === 'all') {
    return true;
  }
  if (filter === 'success') {
    return meta.label.includes('成功');
  }
  if (filter === 'failed') {
    return meta.label.includes('失败');
  }
  if (filter === 'draft') {
    return meta.label.includes('草稿') || meta.label.includes('保存');
  }
  if (filter === 'content') {
    return hasContentChange(item);
  }
  if (filter === 'offer') {
    return hasOfferChange(item);
  }
  return hasPriceChange(item);
}
