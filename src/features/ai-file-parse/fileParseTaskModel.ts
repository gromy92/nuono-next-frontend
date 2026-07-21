import type {
  FileParseTargetPlanPayload,
  FileParseTaskDetailPayload,
  FileParseTaskInputPayload,
  FileParseTaskListItemPayload
} from './api';
import type {
  AiParseInputType,
  AiParseTargetOutputPlan,
  AiParseTask,
  AiParseTaskFilters,
  AiParseTaskStatus
} from './types';

export const EMPTY_TASK_FILTERS: AiParseTaskFilters = {
  targetPlanId: '',
  status: '',
  keyword: ''
};

export function taskFiltersToQuery(filters: AiParseTaskFilters) {
  const keyword = filters.keyword.trim();
  return {
    targetPlanId: filters.targetPlanId ? Number(filters.targetPlanId) : undefined,
    status: filters.status || undefined,
    keyword: keyword || undefined
  };
}

export function inputTypeLabel(inputType: AiParseInputType) {
  const labels: Record<AiParseInputType, string> = {
    FILE: '文件',
    IMAGE: '图片',
    EXCEL: 'Excel',
    PDF: 'PDF',
    OCR_TEXT: 'OCR文本',
    MANUAL_TEXT: '人工文案'
  };
  return labels[inputType];
}

function toDisplayDate(value: string | null | undefined) {
  return value ? value.replace('T', ' ').slice(0, 19) : '-';
}

function normalizeInputType(value: string | undefined): AiParseInputType {
  const normalized = value?.toLowerCase();
  if (normalized === 'image') return 'IMAGE';
  if (normalized === 'excel') return 'EXCEL';
  if (normalized === 'pdf') return 'PDF';
  if (normalized === 'ocr_text') return 'OCR_TEXT';
  if (normalized === 'manual_text') return 'MANUAL_TEXT';
  return 'FILE';
}

function normalizeInputRole(value: string | undefined): AiParseTask['inputItems'][number]['inputRole'] {
  const normalized = value?.toLowerCase();
  if (normalized === 'parsed_file') return 'PARSED_FILE';
  if (normalized === 'supplement') return 'SUPPLEMENT';
  if (normalized === 'reference') return 'REFERENCE';
  return 'PRIMARY_SOURCE';
}

function normalizeTaskStatus(value: string | undefined, nextRunAt?: string | null): AiParseTaskStatus {
  if (value === 'failed' && nextRunAt) return 'retry_waiting';
  if (
    value === 'reading'
    || value === 'parsing'
    || value === 'retry_waiting'
    || value === 'review_required'
    || value === 'ready_to_publish'
    || value === 'published'
    || value === 'failed'
  ) {
    return value;
  }
  return 'failed';
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

export function mapTargetPlan(plan: FileParseTargetPlanPayload): AiParseTargetOutputPlan {
  return {
    id: String(plan.id),
    code: plan.code,
    label: plan.label,
    documentType: plan.documentType,
    documentName: plan.documentName,
    standardId: `standard-${plan.id}`,
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
    status: normalizeTaskStatus(task.status, task.nextRunAt),
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
    status: normalizeTaskStatus(detail.status, detail.nextRunAt),
    documentGroupId: detail.documentGroupId ? String(detail.documentGroupId) : fallback.documentGroupId,
    parentTaskId: detail.parentTaskId ? String(detail.parentTaskId) : undefined,
    iterationNo: detail.iterationNo ?? fallback.iterationNo ?? 1,
    remark: detail.remark || undefined,
    failureCode: detail.failureCode || undefined,
    failureMessage: detail.failureMessage || detail.message || undefined,
    nextRunAt: toDisplayDate(detail.nextRunAt)
  };
}

export function targetOutputPlanLabel(task: AiParseTask | undefined, plans: AiParseTargetOutputPlan[]) {
  if (!task) return '-';
  return plans.find((plan) => plan.id === task.targetPlanId)?.label ?? task.documentName;
}

export function isLogisticsTargetPlan(plan: AiParseTargetOutputPlan | undefined) {
  const code = (plan?.code ?? '').toLowerCase();
  const documentType = (plan?.documentType ?? '').toLowerCase();
  const label = (plan?.label ?? '').toLowerCase();
  return code.startsWith('logistics') || documentType.startsWith('logistics') || label.includes('物流');
}
