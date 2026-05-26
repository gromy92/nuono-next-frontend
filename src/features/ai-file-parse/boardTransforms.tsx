import { Space, Tag, Tooltip, Typography } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { withPublicBasePath } from '../../runtimePaths';
import {
  aiParseStandards,
  inputTypeLabel
} from './mockData';
import type {
  FileParseColumnPayload,
  FileParseOverviewItemPayload,
  FileParseProcessingItemPayload,
  FileParseTargetPlanPayload,
  FileParseTaskDetailPayload,
  FileParseTaskInputPayload,
  FileParseTaskListItemPayload,
  FileParseVersionItemPayload,
  FileParseVersionSummaryPayload
} from './api';
import {
  readFieldDisplayValue,
  summarizeInputs as summarizeTaskInputs
} from './helpers';
import { validationMeta } from './meta';
import type {
  AiParseChangeType,
  AiParseConfidence,
  AiParseResultItem,
  AiParseReviewStatus,
  AiParseStandardField,
  AiParseTargetOutputPlan,
  AiParseTask,
  AiParseTaskStatus,
  AiParseVersion,
  AiParseVersionSnapshotItem
} from './types';

const { Text } = Typography;

export const keepOldHelp = '保留旧值：这条仍对应已有规则，但本次解析的新值不采用，发布时沿用对比版本里的旧值。';
export const rejectHelp = '驳回：这条解析结果不进入发布版本，适合无效、重复或不属于当前目标输出方案的数据。';

export type VersionCompareRow = {
  id: string;
  changeType: AiParseChangeType;
  itemTypeLabel: string;
  naturalKey: string;
  baseFields?: AiParseVersionSnapshotItem['fields'];
  targetFields?: AiParseVersionSnapshotItem['fields'];
  changedFieldKeys: string[];
  validationStatus: AiParseResultItem['validationStatus'];
  validationMessage: string;
};

export function summarizeInputs(task: AiParseTask) {
  return summarizeTaskInputs(task, inputTypeLabel);
}

function inputDownloadHref(input: AiParseTask['inputItems'][number]) {
  return input.downloadUrl ? withPublicBasePath(input.downloadUrl) : '';
}

export function renderTaskListInputItems(task: AiParseTask) {
  if (!task.inputItems.length) {
    return <Text type="secondary">{summarizeInputs(task)}</Text>;
  }
  return (
    <Space direction="vertical" size={4} className="ai-file-parse-input-list">
      {task.inputItems.map((input) => {
        const label = inputTypeLabel(input.inputType);
        const isTextInput = input.inputType === 'OCR_TEXT' || input.inputType === 'MANUAL_TEXT';
        const href = inputDownloadHref(input);
        return (
          <div key={input.id} className="ai-file-parse-input-item">
            <Tag>{label}</Tag>
            {isTextInput || !href ? (
              <Text strong>{input.displayName}</Text>
            ) : (
              <Typography.Link href={href} download={input.displayName}>
                {input.displayName}
              </Typography.Link>
            )}
          </div>
        );
      })}
    </Space>
  );
}

export function renderActionHelp(text: string) {
  return (
    <Tooltip title={text}>
      <ExclamationCircleOutlined className="ai-file-parse-help-icon" />
    </Tooltip>
  );
}

function toDisplayDate(value: string | null | undefined) {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').slice(0, 19);
}

function normalizeInputType(value: string | undefined): AiParseTask['inputItems'][number]['inputType'] {
  const normalized = value?.toLowerCase();
  if (normalized === 'image') {
    return 'IMAGE';
  }
  if (normalized === 'excel') {
    return 'EXCEL';
  }
  if (normalized === 'pdf') {
    return 'PDF';
  }
  if (normalized === 'ocr_text') {
    return 'OCR_TEXT';
  }
  if (normalized === 'manual_text') {
    return 'MANUAL_TEXT';
  }
  return 'FILE';
}

function normalizeInputRole(value: string | undefined): AiParseTask['inputItems'][number]['inputRole'] {
  const normalized = value?.toLowerCase();
  if (normalized === 'parsed_file') {
    return 'PARSED_FILE';
  }
  if (normalized === 'supplement') {
    return 'SUPPLEMENT';
  }
  if (normalized === 'reference') {
    return 'REFERENCE';
  }
  return 'PRIMARY_SOURCE';
}

function normalizeTaskStatus(value: string | undefined): AiParseTaskStatus {
  if (
    value === 'reading' ||
    value === 'parsing' ||
    value === 'retry_waiting' ||
    value === 'review_required' ||
    value === 'ready_to_publish' ||
    value === 'published' ||
    value === 'failed'
  ) {
    return value;
  }
  return 'failed';
}

function normalizeTaskStatusWithRetry(value: string | undefined, nextRunAt?: string | null): AiParseTaskStatus {
  if (value === 'failed' && nextRunAt) {
    return 'retry_waiting';
  }
  return normalizeTaskStatus(value);
}

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
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value;
  }
  return 'medium';
}

function normalizeValidationStatus(value: string | null | undefined): AiParseResultItem['validationStatus'] {
  if (value === 'pass' || value === 'warning' || value === 'hard_error') {
    return value;
  }
  return 'pass';
}

function normalizeScalar(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  return JSON.stringify(value);
}

function normalizeFields(fields: Record<string, unknown> | null | undefined) {
  return Object.fromEntries(
    Object.entries(fields ?? {}).map(([key, value]) => [key, normalizeScalar(value)])
  );
}

function summarizeFieldValues(fields: Record<string, string | number | boolean | null>, changedFieldKeys: string[]) {
  const keys = changedFieldKeys.length ? changedFieldKeys : Object.keys(fields).slice(0, 2);
  return keys.map((key) => `${key}: ${readFieldDisplayValue(fields[key])}`).join('，') || '-';
}

function evidenceText(evidence: Record<string, unknown> | null | undefined) {
  const source = evidence?.source;
  const quote = evidence?.quote;
  const sheet = evidence?.sheet;
  return [source, sheet, quote].filter(Boolean).join(' / ') || '-';
}

function validationMessage(validationError: Record<string, unknown> | null | undefined, validationStatus: AiParseResultItem['validationStatus']) {
  const message = validationError?.message || validationError?.reason;
  return typeof message === 'string' && message ? message : validationMeta[validationStatus].label;
}

export function mapColumnsToFields(columns: FileParseColumnPayload[]): AiParseStandardField[] {
  return columns.map((column) => ({
    key: column.key,
    label: column.label || column.key,
    type: column.type === 'decimal' || column.type === 'integer' ? 'number' : (column.type as AiParseStandardField['type']) || 'text',
    tableVisible: column.tableVisible ?? true,
    width: column.width ?? 140
  }));
}

export function mapTargetPlan(plan: FileParseTargetPlanPayload): AiParseTargetOutputPlan {
  const fallbackStandard = aiParseStandards.find((standard) => standard.documentName === plan.documentName) ?? aiParseStandards[0];
  return {
    id: String(plan.id),
    code: plan.code,
    label: plan.label,
    documentType: plan.documentType,
    documentName: plan.documentName,
    standardId: fallbackStandard?.id ?? `standard-${plan.id}`,
    standardVersion: plan.standardVersion,
    storeId: 'global',
    storeLabel: '全局',
    businessScope: {},
    currentVersion: plan.currentVersion || '未发布',
    description: plan.description || '',
    itemTypes: plan.itemTypes,
    availableActions: plan.availableActions
  };
}

function mapTaskInput(input: FileParseTaskInputPayload): AiParseTask['inputItems'][number] {
  return {
    id: String(input.id),
    inputType: normalizeInputType(input.inputType),
    inputRole: normalizeInputRole(input.inputRole),
    displayName: input.displayName,
    detail: input.fileAssetId ? `文件ID ${input.fileAssetId}` : '',
    downloadUrl: input.downloadUrl || undefined
  };
}

export function mapTaskFromList(task: FileParseTaskListItemPayload): AiParseTask {
  return {
    id: String(task.id),
    documentTitle: task.documentTitle,
    targetPlanId: String(task.targetPlanId),
    documentType: task.documentType,
    documentName: task.documentName,
    standardVersion: task.standardVersion,
    storeId: 'global',
    storeLabel: '全局',
    businessScope: {},
    resultId: task.resultId ? String(task.resultId) : '',
    status: normalizeTaskStatusWithRetry(task.status, task.nextRunAt),
    documentGroupId: task.documentGroupId ? String(task.documentGroupId) : String(task.id),
    parentTaskId: task.parentTaskId ? String(task.parentTaskId) : undefined,
    iterationNo: task.iterationNo ?? 1,
    stats: {
      total: task.totalCount ?? 0,
      pending: task.pendingCount ?? 0,
      needsFix: task.needsFixCount ?? 0,
      conflicts: task.conflictCount ?? 0,
      deleteSuspected: task.deleteSuspectedCount ?? 0,
      hardErrors: task.hardErrorCount ?? 0,
      confirmed: (task.confirmedCount ?? 0) + (task.keepOldCount ?? 0)
    },
    currentVersion: task.currentVersion || '未发布',
    createdAt: toDisplayDate(task.createdAt),
    updatedAt: toDisplayDate(task.updatedAt),
    failureCode: task.failureCode || undefined,
    failureMessage: task.failureMessage || undefined,
    nextRunAt: toDisplayDate(task.nextRunAt),
    inputItems: (task.inputItems ?? []).map(mapTaskInput),
    availableActions: task.availableActions
  };
}

export function mergeTaskDetail(task: AiParseTask | undefined, detail: FileParseTaskDetailPayload): AiParseTask {
  const fallback = task ?? mapTaskFromList({
    id: detail.id,
    taskNo: detail.taskNo,
    documentTitle: detail.documentTitle,
    targetPlanId: detail.targetPlanId,
    targetPlanCode: detail.targetPlanCode,
    targetPlanLabel: detail.targetPlanLabel,
    documentType: detail.documentType,
    documentName: detail.documentName,
    standardVersion: detail.standardVersion,
    currentVersion: detail.currentVersion,
    status: detail.status,
    dataScopeType: detail.dataScopeType,
    dataScopeKey: detail.dataScopeKey
  });
  return {
    ...fallback,
    documentTitle: detail.documentTitle,
    targetPlanId: String(detail.targetPlanId),
    documentType: detail.documentType,
    documentName: detail.documentName,
    standardVersion: detail.standardVersion,
    currentVersion: detail.currentVersion || fallback.currentVersion || '未发布',
    inputItems: detail.inputItems.map(mapTaskInput),
    resultId: detail.resultId ? String(detail.resultId) : '',
    status: normalizeTaskStatusWithRetry(detail.status, detail.nextRunAt),
    documentGroupId: detail.documentGroupId ? String(detail.documentGroupId) : fallback.documentGroupId,
    parentTaskId: detail.parentTaskId ? String(detail.parentTaskId) : undefined,
    iterationNo: detail.iterationNo ?? fallback.iterationNo ?? 1,
    remark: detail.remark || undefined,
    failureCode: detail.failureCode || undefined,
    failureMessage: detail.failureMessage || detail.message || undefined,
    nextRunAt: toDisplayDate(detail.nextRunAt)
  };
}

function itemTypeLabel(itemType: string) {
  const labelMap: Record<string, string> = {
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
  return labelMap[itemType] ?? itemType;
}

export function mapProcessingItem(item: FileParseProcessingItemPayload): AiParseResultItem {
  const fields = normalizeFields(item.fields);
  const changedFieldKeys = item.changedFieldKeys ?? [];
  const validationStatus = normalizeValidationStatus(item.validationStatus);
  return {
    id: String(item.itemId),
    taskId: String(item.taskId),
    resultId: String(item.resultId),
    itemType: item.itemType,
    itemTypeLabel: itemTypeLabel(item.itemType),
    naturalKey: item.naturalKey,
    changeType: normalizeChangeType(item.changeType),
    reviewStatus: normalizeReviewStatus(item.reviewStatus),
    confidence: normalizeConfidence(item.confidence),
    summary: summarizeFieldValues(fields, changedFieldKeys),
    validationStatus,
    validationMessage: validationMessage(item.validationError, validationStatus),
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
    itemTypeLabel: itemTypeLabel(item.itemType),
    naturalKey: item.naturalKey,
    changeType: 'unchanged',
    reviewStatus: 'confirmed',
    confidence: 'high',
    summary: summarizeFieldValues(fields, []),
    validationStatus: 'pass',
    validationMessage: '-',
    evidence: '-',
    sourceInputIds: [],
    fields,
    changedFieldKeys: []
  };
}

export function mapVersion(version: FileParseVersionSummaryPayload, targetPlan: AiParseTargetOutputPlan | undefined): AiParseVersion {
  const summary = version.summary ?? {};
  const itemCount = typeof summary.itemCount === 'number' ? summary.itemCount : 0;
  return {
    id: String(version.versionId),
    versionNo: version.versionNo,
    targetPlanId: String(version.targetPlanId),
    documentType: targetPlan?.documentType ?? '',
    documentName: targetPlan?.documentName ?? '',
    standardVersion: targetPlan?.standardVersion ?? '',
    storeLabel: targetPlan?.storeLabel ?? '全局',
    businessScopeText: targetPlan?.label ?? '-',
    publishedAt: toDisplayDate(version.publishedAt),
    publisherName: version.publishedBy ? `用户 ${version.publishedBy}` : '-',
    sourceTaskId: version.sourceTaskId ? String(version.sourceTaskId) : '',
    status: version.status,
    inputSummary: '-',
    itemCount
  };
}

export function mapVersionSnapshotItem(item: FileParseVersionItemPayload): AiParseVersionSnapshotItem {
  return {
    id: String(item.versionItemId),
    versionId: String(item.versionId),
    itemTypeLabel: itemTypeLabel(item.itemType),
    naturalKey: item.naturalKey,
    fields: normalizeFields(item.fields),
    sourceResultItemId: item.sourceResultItemId == null ? undefined : String(item.sourceResultItemId)
  };
}

export function renderDetailInputItems(task: AiParseTask) {
  return (
    <Space direction="vertical" size={6} className="ai-file-parse-input-list">
      {task.inputItems.map((input) => {
        const label = inputTypeLabel(input.inputType);
        const isTextInput = input.inputType === 'OCR_TEXT' || input.inputType === 'MANUAL_TEXT';
        if (isTextInput) {
          return (
            <div key={input.id} className="ai-file-parse-input-item">
              <Tag>{label}</Tag>
              <Text strong>{input.displayName}</Text>
              <Text>{input.detail}</Text>
            </div>
          );
        }
        return (
          <div key={input.id} className="ai-file-parse-input-item">
            <Tag>{label}</Tag>
            {input.downloadUrl ? (
              <Typography.Link href={inputDownloadHref(input)} download={input.displayName}>
                {input.displayName}
              </Typography.Link>
            ) : (
              <Text strong>{input.displayName}</Text>
            )}
            {input.detail ? <Text type="secondary">{input.detail}</Text> : null}
          </div>
        );
      })}
    </Space>
  );
}

export function targetOutputPlanLabel(task: AiParseTask | undefined, targetPlans: AiParseTargetOutputPlan[]) {
  if (!task) {
    return '-';
  }
  const planById = targetPlans.find((plan) => plan.id === task.targetPlanId);
  if (planById) {
    return planById.label;
  }
  const matchedPlan = targetPlans.find((plan) => {
    if (plan.documentType !== task.documentType || plan.storeId !== task.storeId) {
      return false;
    }
    return Object.entries(plan.businessScope).every(([key, value]) => task.businessScope[key] === value);
  });
  return matchedPlan?.label ?? task.documentName;
}

export function sortVersionsByPublishedAt(versions: AiParseVersion[]) {
  return [...versions].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export function isLogisticsTargetPlan(plan: AiParseTargetOutputPlan | undefined) {
  const code = (plan?.code ?? '').toLowerCase();
  const documentType = (plan?.documentType ?? '').toLowerCase();
  const label = (plan?.label ?? '').toLowerCase();
  return code.startsWith('logistics') || documentType.startsWith('logistics') || label.includes('物流');
}

function hasFieldChanges(
  baseFields: AiParseVersionSnapshotItem['fields'] | undefined,
  targetFields: AiParseVersionSnapshotItem['fields'] | undefined,
  fieldKeys: string[]
) {
  return fieldKeys.filter((key) => readFieldDisplayValue(baseFields?.[key]) !== readFieldDisplayValue(targetFields?.[key]));
}

export function buildVersionCompareRows(
  snapshotItems: AiParseVersionSnapshotItem[],
  visibleFieldKeys: string[],
  baseVersion: AiParseVersion | undefined,
  targetVersion: AiParseVersion | undefined
): VersionCompareRow[] {
  if (!baseVersion || !targetVersion) {
    return [];
  }
  const baseItems = snapshotItems.filter((item) => item.versionId === baseVersion.id);
  const targetItems = snapshotItems.filter((item) => item.versionId === targetVersion.id);
  const baseMap = new Map(baseItems.map((item) => [item.naturalKey, item]));
  const targetMap = new Map(targetItems.map((item) => [item.naturalKey, item]));
  const naturalKeys = Array.from(new Set([...baseMap.keys(), ...targetMap.keys()]));
  return naturalKeys
    .map((naturalKey) => {
      const baseItem = baseMap.get(naturalKey);
      const targetItem = targetMap.get(naturalKey);
      const baseFields = baseItem?.fields;
      const targetFields = targetItem?.fields;
      const changedFieldKeys = hasFieldChanges(baseFields, targetFields, visibleFieldKeys);
      let changeType: AiParseChangeType = 'unchanged';
      if (!baseFields && targetFields) {
        changeType = 'added';
      } else if (baseFields && !targetFields) {
        changeType = 'delete_suspected';
      } else if (changedFieldKeys.length > 0) {
        changeType = 'changed';
      }
      return {
        id: `${baseVersion.id}-${targetVersion.id}-${naturalKey}`,
        changeType,
        itemTypeLabel: targetItem?.itemTypeLabel ?? baseItem?.itemTypeLabel ?? '-',
        naturalKey,
        baseFields,
        targetFields,
        changedFieldKeys,
        validationStatus: 'pass' as const,
        validationMessage: '-'
      };
    })
    .filter((row) => row.changeType !== 'unchanged');
}
