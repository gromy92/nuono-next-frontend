import {
  apiFetch,
  apiRequestJson,
  apiRequestNoContent,
  readApiError
} from '../../shared/api';
import type {
  FileParseBatchReviewPayload,
  FileParseLogisticsActivationPayload,
  FileParseOverviewItemsPayload,
  FileParseProcessingItemPayload,
  FileParseProcessingItemsPayload,
  FileParseRunPayload,
  FileParseTargetPlanPayload,
  FileParseTaskDetailPayload,
  FileParseTaskListPayload,
  FileParseUploadPayload,
  FileParseVersionItemsPayload,
  FileParseVersionListPayload
} from './api.types';

export type * from './api.types';

type CreateTaskInputPayload = {
  inputType: string;
  inputRole: string;
  fileAssetId?: number;
  textContent?: string;
  displayName?: string;
  sortNo?: number;
};

type CreateTaskPayload = {
  documentTitle: string;
  targetPlanId: number;
  parentTaskId?: number;
  inputItems: CreateTaskInputPayload[];
  remark?: string;
};

type ReviewItemPayload = {
  expectedResultId: number;
  fields?: Record<string, unknown>;
  remark?: string;
  reason?: string;
};

type BatchReviewItemsPayload = {
  expectedResultId: number;
  itemIds: number[];
  remark?: string;
};

type PublishTaskPayload = {
  expectedResultId: number;
  confirmMessage?: string;
  remark?: string;
};

function withQuery(path: string, params: Record<string, string | number | undefined | null>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  return query.size ? `${path}?${query.toString()}` : path;
}

function jsonRequest<T>(path: string, body: unknown, idempotencyKey?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  return apiRequestJson<T>(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
}

export function createFileParseIdempotencyKey(prefix: string) {
  const randomId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${randomId}`;
}

export function fetchFileParseTargetPlans() {
  return apiRequestJson<FileParseTargetPlanPayload[]>('/api/file-management/parse/target-plans');
}

export function fetchFileParseTasks(params?: {
  keyword?: string;
  targetPlanId?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  return apiRequestJson<FileParseTaskListPayload>(
    withQuery('/api/file-management/parse/tasks', params ?? {})
  );
}

export function fetchFileParseTaskDetail(taskId: string | number) {
  return apiRequestJson<FileParseTaskDetailPayload>(`/api/file-management/parse/tasks/${taskId}`);
}

export function deleteFileParseTask(taskId: string | number) {
  return apiRequestNoContent(`/api/file-management/parse/tasks/${taskId}`, { method: 'DELETE' });
}

export function uploadFileParseInput(targetPlanId: string | number, file: File) {
  const formData = new FormData();
  formData.set('targetPlanId', String(targetPlanId));
  formData.set('file', file);
  return apiRequestJson<FileParseUploadPayload>('/api/file-management/parse/uploads', {
    method: 'POST',
    body: formData
  });
}

export function createFileParseTask(payload: CreateTaskPayload, idempotencyKey: string) {
  return jsonRequest<FileParseTaskDetailPayload>('/api/file-management/parse/tasks', payload, idempotencyKey);
}

export function runFileParseTask(taskId: string | number) {
  return apiRequestJson<FileParseRunPayload>(`/api/file-management/parse/tasks/${taskId}/run`, {
    method: 'POST'
  });
}

export function fetchFileParseProcessingItems(taskId: string | number, pageSize = 1000) {
  return apiRequestJson<FileParseProcessingItemsPayload>(
    withQuery(`/api/file-management/parse/tasks/${taskId}/processing-items`, { page: 1, pageSize })
  );
}

export function fetchFileParseOverviewItems(taskId: string | number, pageSize = 1000) {
  return apiRequestJson<FileParseOverviewItemsPayload>(
    withQuery(`/api/file-management/parse/tasks/${taskId}/overview-items`, { page: 1, pageSize })
  );
}

export function buildFileParseOverviewExportUrl(taskId: string | number) {
  return `/api/file-management/parse/tasks/${taskId}/overview-items/export`;
}

export async function downloadFileParseOverview(taskId: string | number) {
  const response = await apiFetch(buildFileParseOverviewExportUrl(taskId));
  if (!response.ok) {
    throw await readApiError(response);
  }
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename\*=UTF-8''([^;]+)/);
  return {
    fileName: match ? decodeURIComponent(match[1]) : '解析总览.xlsx',
    blob: await response.blob()
  };
}

export function fetchFileParseVersions(targetPlanId: string | number, pageSize = 100) {
  return apiRequestJson<FileParseVersionListPayload>(
    withQuery(`/api/file-management/parse/target-plans/${targetPlanId}/versions`, { page: 1, pageSize })
  );
}

export function fetchFileParseVersionItems(versionId: string | number, pageSize = 1000) {
  return apiRequestJson<FileParseVersionItemsPayload>(
    withQuery(`/api/file-management/parse/versions/${versionId}/items`, { page: 1, pageSize })
  );
}

export function reviewFileParseItem(
  taskId: string | number,
  itemId: string | number,
  action: 'edit' | 'accept' | 'reject' | 'keep-old',
  payload: ReviewItemPayload,
  idempotencyKey: string
) {
  return jsonRequest<FileParseProcessingItemPayload>(
    `/api/file-management/parse/tasks/${taskId}/items/${itemId}/${action}`,
    payload,
    idempotencyKey
  );
}

export function batchAcceptFileParseItems(
  taskId: string | number,
  payload: BatchReviewItemsPayload,
  idempotencyKey: string
) {
  return jsonRequest<FileParseBatchReviewPayload>(
    `/api/file-management/parse/tasks/${taskId}/items/batch-accept`,
    payload,
    idempotencyKey
  );
}

export function publishFileParseTask(
  taskId: string | number,
  payload: PublishTaskPayload,
  idempotencyKey: string
) {
  return jsonRequest<unknown>(
    `/api/file-management/parse/tasks/${taskId}/publish`,
    payload,
    idempotencyKey
  );
}

export function fetchFileParseLogisticsActivations(
  targetPlanId: string | number,
  versionId?: string | number
) {
  return apiRequestJson<FileParseLogisticsActivationPayload>(
    withQuery('/api/file-management/parse/logistics-channel-activations', { targetPlanId, versionId })
  );
}

export function saveFileParseLogisticsActivations(payload: {
  targetPlanId: number;
  versionId: number;
  selectedChannelKeys: string[];
}) {
  return jsonRequest<FileParseLogisticsActivationPayload>(
    '/api/file-management/parse/logistics-channel-activations',
    payload
  );
}
