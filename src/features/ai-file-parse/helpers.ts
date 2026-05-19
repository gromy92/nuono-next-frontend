import { changeTypeMeta } from './meta';
import type {
  AiParseDocumentStandard,
  AiParseResultItem,
  AiParseTask,
  AiParseTaskStatus
} from './types';

export function formatBusinessScope(standard: AiParseDocumentStandard | undefined, scope: Record<string, string>) {
  if (!standard) {
    return Object.values(scope).filter(Boolean).join(' / ') || '-';
  }
  return standard.businessScopeFields
    .map((field) => scope[field.key])
    .filter(Boolean)
    .join(' / ') || '-';
}

export function summarizeInputs(task: AiParseTask, inputTypeLabel: (inputType: AiParseTask['inputItems'][number]['inputType']) => string) {
  const counts = task.inputItems.reduce<Record<string, number>>((acc, input) => {
    const label = inputTypeLabel(input.inputType);
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([label, count]) => `${label}${count}`)
    .join('，') || '-';
}

export function deriveTaskStatus(items: AiParseResultItem[], currentStatus: AiParseTaskStatus): AiParseTaskStatus {
  if (currentStatus === 'published' || currentStatus === 'failed') {
    return currentStatus;
  }
  if (!items.length) {
    return 'review_required';
  }
  const hasBlockingItem = items.some((item) => isBlockingItem(item));
  return hasBlockingItem ? 'review_required' : 'ready_to_publish';
}

export function isBlockingItem(item: AiParseResultItem) {
  if (item.reviewStatus === 'pending' || item.reviewStatus === 'needs_fix' || item.reviewStatus === 'hard_error') {
    return true;
  }
  return item.changeType === 'conflict' && !['confirmed', 'rejected', 'keep_old'].includes(item.reviewStatus);
}

export function readFieldDisplayValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return typeof value === 'boolean' ? (value ? '是' : '否') : String(value);
}

export function getFieldValueClass(item: AiParseResultItem, fieldKey: string) {
  if (item.changedFieldKeys.includes(fieldKey) || item.changeType === 'added') {
    return changeTypeMeta[item.changeType].className;
  }
  return '';
}

const fixedContextFieldKeys = new Set(['country', 'platform', 'fulfillmentType']);

export function getDisplayResultFields(standard: AiParseDocumentStandard | undefined) {
  return (standard?.resultFields ?? []).filter((field) => !fixedContextFieldKeys.has(field.key));
}

export function getTableVisibleFields(standard: AiParseDocumentStandard | undefined) {
  return getDisplayResultFields(standard).filter((field) => field.tableVisible);
}
