export type FileParseAvailableActionsPayload = {
  canCreateTask?: boolean;
  canProcess?: boolean;
  canPublish?: boolean;
  canActivateLogisticsChannels?: boolean;
  canManageStandard?: boolean;
};

export type FileParseTargetPlanPayload = {
  id: number;
  code: string;
  label: string;
  documentType: string;
  documentName: string;
  standardVersion: string;
  currentVersion?: string | null;
  description?: string | null;
  itemTypes?: Array<{ value: string; label: string }>;
  availableActions?: FileParseAvailableActionsPayload;
};

export type FileParseTaskInputPayload = {
  id: number;
  inputType: string;
  inputRole: string;
  fileAssetId?: number | null;
  displayName: string;
  downloadUrl?: string | null;
  sortNo?: number | null;
};

export type FileParseTaskListItemPayload = {
  id: number;
  taskNo: string;
  documentTitle: string;
  targetPlanId: number;
  targetPlanCode: string;
  targetPlanLabel: string;
  documentType: string;
  documentName: string;
  standardVersion: string;
  currentVersion?: string | null;
  status: string;
  dataScopeType: string;
  dataScopeKey: string;
  documentGroupId?: number | null;
  parentTaskId?: number | null;
  iterationNo?: number | null;
  resultId?: number | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  nextRunAt?: string | null;
  totalCount?: number | null;
  pendingCount?: number | null;
  needsFixCount?: number | null;
  hardErrorCount?: number | null;
  conflictCount?: number | null;
  deleteSuspectedCount?: number | null;
  confirmedCount?: number | null;
  rejectedCount?: number | null;
  keepOldCount?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  availableActions?: FileParseAvailableActionsPayload;
};

export type FileParseTaskListPayload = {
  total: number;
  page: number;
  pageSize: number;
  items: FileParseTaskListItemPayload[];
};

export type FileParseTaskDetailPayload = {
  id: number;
  taskNo: string;
  documentTitle: string;
  targetPlanId: number;
  targetPlanCode: string;
  targetPlanLabel: string;
  documentType: string;
  documentName: string;
  standardVersion: string;
  currentVersion?: string | null;
  status: string;
  resultId?: number | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  nextRunAt?: string | null;
  dataScopeType: string;
  dataScopeKey: string;
  documentGroupId?: number | null;
  parentTaskId?: number | null;
  iterationNo?: number | null;
  remark?: string | null;
  message?: string | null;
  inputItems: FileParseTaskInputPayload[];
};

export type FileParseUploadPayload = {
  fileId: number;
  uploadId: string;
  targetPlanId: number;
  standardVersionId: number;
  originalFileName: string;
  contentType?: string | null;
  fileExtension: string;
  sizeBytes: number;
  sha256Hash: string;
  downloadUrl: string;
};

export type FileParseRunPayload = {
  taskId: number;
  taskNo: string;
  documentTitle: string;
  status: string;
  parseAttemptCount: number;
  resultId?: number | null;
  resultNo?: string | null;
  resultItemCount?: number | null;
  message?: string | null;
};

export type FileParseWorkflowStepPayload = {
  key: string;
  label: string;
  status: string;
  count?: number | null;
};

export type FileParseWorkflowCoveragePayload = {
  sourceRows: number;
  processedSourceRows: number;
  unprocessedSourceRows: number;
  resultItems: number;
  hardErrors: number;
};

export type FileParseWorkflowPayload = {
  taskId: number;
  status: string;
  steps: FileParseWorkflowStepPayload[];
  coverage: FileParseWorkflowCoveragePayload;
};

export type FileParseSourceRowPayload = {
  id: number;
  taskId: number;
  inputId?: number | null;
  fileAssetId?: number | null;
  sourceType: string;
  sourceLocator?: string | null;
  pageNo?: number | null;
  sheetName?: string | null;
  tableNo?: number | null;
  rowNo?: number | null;
  columnRange?: string | null;
  rawText?: string | null;
  rawCellsJson?: string | null;
  sourceHash?: string | null;
  sortNo?: number | null;
};

export type FileParseSourceRowsPayload = {
  taskId: number;
  total: number;
  page: number;
  pageSize: number;
  items: FileParseSourceRowPayload[];
};

export type FileParseAiChunkPayload = {
  id: number;
  taskId: number;
  resultId?: number | null;
  chunkNo?: number | null;
  chunkType?: string | null;
  sourceRowCount?: number | null;
  promptHash?: string | null;
  inputHash?: string | null;
  modelProvider?: string | null;
  modelName?: string | null;
  status: string;
  outputItemCount?: number | null;
  responseHash?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
};

export type FileParseAiChunksPayload = {
  taskId: number;
  total: number;
  page: number;
  pageSize: number;
  items: FileParseAiChunkPayload[];
};

export type FileParseValidationIssuePayload = {
  id: number;
  taskId: number;
  resultId?: number | null;
  resultItemId?: number | null;
  sourceRowId?: number | null;
  aiChunkId?: number | null;
  issueType: string;
  severity: string;
  fieldKey?: string | null;
  message?: string | null;
  detailsJson?: string | null;
  resolvedStatus?: string | null;
};

export type FileParseValidationIssuesPayload = {
  taskId: number;
  total: number;
  page: number;
  pageSize: number;
  items: FileParseValidationIssuePayload[];
};

export type FileParseColumnPayload = {
  key: string;
  label: string;
  type: string;
  tableVisible?: boolean;
  width?: number | null;
};

export type FileParseProcessingItemPayload = {
  itemId: number;
  taskId: number;
  resultId: number;
  itemType: string;
  naturalKey: string;
  changeType: string;
  reviewStatus: string;
  confidence?: string | null;
  validationStatus?: string | null;
  fields?: Record<string, unknown> | null;
  oldFields?: Record<string, unknown> | null;
  changedFieldKeys?: string[] | null;
  evidence?: Record<string, unknown> | null;
  validationError?: Record<string, unknown> | null;
  sortNo?: number | null;
};

export type FileParseProcessingItemsPayload = {
  taskId: number;
  resultId: number;
  revisionNo: number;
  total: number;
  page: number;
  pageSize: number;
  columns: FileParseColumnPayload[];
  items: FileParseProcessingItemPayload[];
};

export type FileParseOverviewItemPayload = {
  itemId: number;
  taskId: number;
  resultId: number;
  itemType: string;
  naturalKey: string;
  fields?: Record<string, unknown> | null;
  sourceResultItemId?: number | null;
  sortNo?: number | null;
};

export type FileParseOverviewItemsPayload = {
  taskId: number;
  resultId: number;
  total: number;
  page: number;
  pageSize: number;
  columns: FileParseColumnPayload[];
  items: FileParseOverviewItemPayload[];
};

export type FileParseVersionSummaryPayload = {
  versionId: number;
  versionNo: string;
  targetPlanId: number;
  sourceTaskId?: number | null;
  sourceResultId?: number | null;
  standardVersionId?: number | null;
  baseVersionId?: number | null;
  dataScopeType?: string | null;
  dataScopeKey?: string | null;
  status: 'active' | 'history' | 'revoked';
  publishedAt?: string | null;
  publishedBy?: number | null;
  summary?: Record<string, unknown> | null;
};

export type FileParseVersionListPayload = {
  targetPlanId: number;
  total: number;
  page: number;
  pageSize: number;
  items: FileParseVersionSummaryPayload[];
};

export type FileParseVersionItemPayload = {
  versionItemId: number;
  versionId: number;
  itemType: string;
  naturalKey: string;
  fields?: Record<string, unknown> | null;
  sourceResultItemId?: number | null;
  sortNo?: number | null;
};

export type FileParseVersionItemsPayload = {
  versionId: number;
  versionNo: string;
  targetPlanId: number;
  total: number;
  page: number;
  pageSize: number;
  columns: FileParseColumnPayload[];
  items: FileParseVersionItemPayload[];
};

export type FileParseLogisticsChannelPayload = {
  versionItemId: number;
  naturalKey: string;
  channelKey: string;
  country?: string | null;
  city?: string | null;
  shippingMethod?: string | null;
  feeItem?: string | null;
  billingRule?: string | null;
  leadTime?: string | null;
  selected: boolean;
  fields?: (Record<string, unknown> & {
    itemType?: string;
    relatedItemCounts?: Record<string, number>;
  }) | null;
};

export type FileParseLogisticsActivationPayload = {
  targetPlanId: number;
  targetPlanCode: string;
  targetPlanLabel: string;
  versionId: number;
  versionNo: string;
  ownerUserId: number;
  selectedChannelKeys: string[];
  channels: FileParseLogisticsChannelPayload[];
};

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

export type FileParseBatchReviewPayload = {
  taskId: number;
  resultId: number;
  totalCount: number;
  successCount: number;
  items: FileParseProcessingItemPayload[];
};

type PublishTaskPayload = {
  expectedResultId: number;
  confirmMessage?: string;
  remark?: string;
};

const SESSION_STORAGE_KEY = 'nuono-next-session';

function devSessionHeaders() {
  if (typeof window === 'undefined') {
    return {};
  }
  if (window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost') {
    return {};
  }
  try {
    const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawSession) {
      return {};
    }
    const session = JSON.parse(rawSession) as { userId?: number; roleId?: number; level?: number };
    if (!session.userId) {
      return {};
    }
    return {
      'X-Nuono-Dev-Session-User-Id': String(session.userId),
      ...(session.roleId ? { 'X-Nuono-Dev-Session-Role-Id': String(session.roleId) } : {}),
      ...(session.level !== undefined && session.level !== null ? { 'X-Nuono-Dev-Session-Level': String(session.level) } : {})
    };
  } catch {
    return {};
  }
}

function fileParseFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, {
    ...init,
    headers: {
      ...devSessionHeaders(),
      ...(init?.headers ?? {})
    }
  });
}

async function parseResponse<T>(responseOrPromise: Response | Promise<Response>): Promise<T> {
  const response = await responseOrPromise;
  if (!response.ok) {
    let message = `后端返回 ${response.status}`;
    try {
      const text = (await response.text()).trim();
      if (text) {
        try {
          const payload = JSON.parse(text) as { message?: string; error?: string };
          message = payload.message || payload.error || text;
        } catch {
          message = text;
        }
      }
    } catch {
      // ignore parse failure and use fallback
    }
    throw new Error(message);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  return parseResponse<T>(
    fileParseFetch(path, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
  );
}

export function createFileParseIdempotencyKey(prefix: string) {
  const randomId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${randomId}`;
}

export function fetchFileParseTargetPlans() {
  return parseResponse<FileParseTargetPlanPayload[]>(fileParseFetch('/api/file-management/parse/target-plans'));
}

export function fetchFileParseTasks(params?: {
  keyword?: string;
  targetPlanId?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  return parseResponse<FileParseTaskListPayload>(
    fileParseFetch(withQuery('/api/file-management/parse/tasks', params ?? {}))
  );
}

export function fetchFileParseTaskDetail(taskId: string | number) {
  return parseResponse<FileParseTaskDetailPayload>(fileParseFetch(`/api/file-management/parse/tasks/${taskId}`));
}

export function uploadFileParseInput(targetPlanId: string | number, file: File) {
  const formData = new FormData();
  formData.set('targetPlanId', String(targetPlanId));
  formData.set('file', file);
  return parseResponse<FileParseUploadPayload>(
    fileParseFetch('/api/file-management/parse/uploads', {
      method: 'POST',
      body: formData
    })
  );
}

export function createFileParseTask(payload: CreateTaskPayload, idempotencyKey: string) {
  return jsonRequest<FileParseTaskDetailPayload>('/api/file-management/parse/tasks', payload, idempotencyKey);
}

export function runFileParseTask(taskId: string | number) {
  return parseResponse<FileParseRunPayload>(
    fileParseFetch(`/api/file-management/parse/tasks/${taskId}/run`, {
      method: 'POST'
    })
  );
}

export function fetchFileParseWorkflow(taskId: string | number) {
  return parseResponse<FileParseWorkflowPayload>(
    fileParseFetch(`/api/file-management/parse/tasks/${taskId}/workflow`)
  );
}

export function fetchFileParseSourceRows(taskId: string | number, pageSize = 200) {
  return parseResponse<FileParseSourceRowsPayload>(
    fileParseFetch(withQuery(`/api/file-management/parse/tasks/${taskId}/source-rows`, { page: 1, pageSize }))
  );
}

export function fetchFileParseAiChunks(taskId: string | number, pageSize = 100) {
  return parseResponse<FileParseAiChunksPayload>(
    fileParseFetch(withQuery(`/api/file-management/parse/tasks/${taskId}/ai-chunks`, { page: 1, pageSize }))
  );
}

export function fetchFileParseValidationIssues(taskId: string | number, pageSize = 200) {
  return parseResponse<FileParseValidationIssuesPayload>(
    fileParseFetch(withQuery(`/api/file-management/parse/tasks/${taskId}/validation-issues`, { page: 1, pageSize }))
  );
}

export function fetchFileParseProcessingItems(taskId: string | number, pageSize = 1000) {
  return parseResponse<FileParseProcessingItemsPayload>(
    fileParseFetch(withQuery(`/api/file-management/parse/tasks/${taskId}/processing-items`, { page: 1, pageSize }))
  );
}

export function fetchFileParseOverviewItems(taskId: string | number, pageSize = 1000) {
  return parseResponse<FileParseOverviewItemsPayload>(
    fileParseFetch(withQuery(`/api/file-management/parse/tasks/${taskId}/overview-items`, { page: 1, pageSize }))
  );
}

export function buildFileParseOverviewExportUrl(taskId: string | number) {
  return `/api/file-management/parse/tasks/${taskId}/overview-items/export`;
}

export async function downloadFileParseOverview(taskId: string | number) {
  const response = await fileParseFetch(buildFileParseOverviewExportUrl(taskId));
  if (!response.ok) {
    await parseResponse(response);
  }
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename\*=UTF-8''([^;]+)/);
  const fileName = match ? decodeURIComponent(match[1]) : '解析总览.xlsx';
  return {
    fileName,
    blob: await response.blob()
  };
}

export function fetchFileParseVersions(targetPlanId: string | number, pageSize = 100) {
  return parseResponse<FileParseVersionListPayload>(
    fileParseFetch(withQuery(`/api/file-management/parse/target-plans/${targetPlanId}/versions`, { page: 1, pageSize }))
  );
}

export function fetchFileParseVersionItems(versionId: string | number, pageSize = 1000) {
  return parseResponse<FileParseVersionItemsPayload>(
    fileParseFetch(withQuery(`/api/file-management/parse/versions/${versionId}/items`, { page: 1, pageSize }))
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

export function publishFileParseTask(taskId: string | number, payload: PublishTaskPayload, idempotencyKey: string) {
  return jsonRequest('/api/file-management/parse/tasks/' + taskId + '/publish', payload, idempotencyKey);
}

export function fetchFileParseLogisticsActivations(targetPlanId: string | number, versionId?: string | number) {
  return parseResponse<FileParseLogisticsActivationPayload>(
    fileParseFetch(withQuery('/api/file-management/parse/logistics-channel-activations', { targetPlanId, versionId }))
  );
}

export function saveFileParseLogisticsActivations(payload: {
  targetPlanId: number;
  versionId: number;
  selectedChannelKeys: string[];
}) {
  return jsonRequest<FileParseLogisticsActivationPayload>('/api/file-management/parse/logistics-channel-activations', payload);
}
