import type {
  FileParseColumnPayload,
  FileParseOverviewItemPayload,
  FileParseProcessingItemPayload
} from './api';
import { readFieldDisplayValue } from './helpers';
import { validationMeta } from './meta';
import type {
  AiParseChangeType,
  AiParseConfidence,
  AiParseResultItem,
  AiParseReviewStatus,
  AiParseStandardField
} from './types';

function normalizeChangeType(value: string | undefined): AiParseChangeType {
  if (value === 'added' || value === 'changed' || value === 'delete_suspected' || value === 'conflict' || value === 'unchanged') {
    return value;
  }
  return 'unchanged';
}

function normalizeReviewStatus(value: string | undefined): AiParseReviewStatus {
  if (value === 'pending' || value === 'needs_fix' || value === 'confirmed' || value === 'rejected' || value === 'keep_old' || value === 'hard_error') {
    return value;
  }
  return 'pending';
}

function normalizeConfidence(value: string | null | undefined): AiParseConfidence {
  return value === 'high' || value === 'medium' || value === 'low' ? value : 'medium';
}

function normalizeValidationStatus(value: string | null | undefined): AiParseResultItem['validationStatus'] {
  return value === 'pass' || value === 'warning' || value === 'hard_error' ? value : 'pass';
}

function normalizeScalar(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  return JSON.stringify(value);
}

function normalizeFields(fields: Record<string, unknown> | null | undefined) {
  return Object.fromEntries(
    Object.entries(fields ?? {}).map(([key, value]) => [key, normalizeScalar(value)])
  );
}

function summarizeFields(fields: AiParseResultItem['fields'], changedFieldKeys: string[]) {
  const keys = changedFieldKeys.length ? changedFieldKeys : Object.keys(fields).slice(0, 2);
  return keys.map((key) => `${key}: ${readFieldDisplayValue(fields[key])}`).join('，') || '-';
}

function evidenceText(evidence: Record<string, unknown> | null | undefined) {
  return [evidence?.source, evidence?.sheet, evidence?.quote].filter(Boolean).join(' / ') || '-';
}

function validationMessage(
  error: Record<string, unknown> | null | undefined,
  status: AiParseResultItem['validationStatus']
) {
  const message = error?.message || error?.reason;
  return typeof message === 'string' && message ? message : validationMeta[status].label;
}

export function fileParseItemTypeLabel(itemType: string) {
  const labels: Record<string, string> = {
    commission_rule: '佣金规则',
    platform_fee: '平台费用',
    outbound_fee_rule: '出仓费规则',
    outbound_size_classification_rule: '出仓费规格分级',
    outbound_fee_weight_slab_rule: '出仓费重量费用',
    outbound_fee_calculation_policy: '出仓费计算策略',
    outbound_fee_exception: '出仓费例外',
    logistics_channel_rule: '物流渠道规则',
    logistics_service_line: '物流服务线路',
    logistics_cargo_category: '物流货物分类',
    logistics_base_price: '物流基础价格',
    logistics_surcharge: '物流附加费',
    logistics_billing_rule: '物流计费规则',
    logistics_warehouse_service_fee: '海外仓服务费',
    logistics_restriction: '物流禁限运与合规',
    base_price: '基础价格',
    surcharge: '附加费用',
    calculation_rule: '计费规则'
  };
  return labels[itemType] ?? itemType;
}

export function mapColumnsToFields(columns: FileParseColumnPayload[]): AiParseStandardField[] {
  return columns.map((column) => ({
    key: column.key,
    label: column.label || column.key,
    type: column.type === 'decimal' || column.type === 'integer'
      ? 'number'
      : (column.type as AiParseStandardField['type']) || 'text',
    tableVisible: column.tableVisible ?? true,
    width: column.width ?? 140
  }));
}

export function mapProcessingItem(item: FileParseProcessingItemPayload): AiParseResultItem {
  const fields = normalizeFields(item.fields);
  const changedFieldKeys = item.changedFieldKeys ?? [];
  const status = normalizeValidationStatus(item.validationStatus);
  return {
    id: String(item.itemId),
    taskId: String(item.taskId),
    resultId: String(item.resultId),
    itemType: item.itemType,
    itemTypeLabel: fileParseItemTypeLabel(item.itemType),
    naturalKey: item.naturalKey,
    changeType: normalizeChangeType(item.changeType),
    reviewStatus: normalizeReviewStatus(item.reviewStatus),
    confidence: normalizeConfidence(item.confidence),
    summary: summarizeFields(fields, changedFieldKeys),
    validationStatus: status,
    validationMessage: validationMessage(item.validationError, status),
    evidence: evidenceText(item.evidence),
    sourceInputIds: [],
    fields,
    oldFields: item.oldFields ? normalizeFields(item.oldFields) : undefined,
    changedFieldKeys
  };
}

export function mapOverviewItem(item: FileParseOverviewItemPayload): AiParseResultItem {
  const fields = normalizeFields(item.fields);
  return {
    id: String(item.itemId),
    taskId: String(item.taskId),
    resultId: String(item.resultId),
    itemType: item.itemType,
    itemTypeLabel: fileParseItemTypeLabel(item.itemType),
    naturalKey: item.naturalKey,
    changeType: 'unchanged',
    reviewStatus: 'confirmed',
    confidence: 'high',
    summary: summarizeFields(fields, []),
    validationStatus: 'pass',
    validationMessage: '-',
    evidence: '-',
    sourceInputIds: [],
    fields,
    changedFieldKeys: []
  };
}
