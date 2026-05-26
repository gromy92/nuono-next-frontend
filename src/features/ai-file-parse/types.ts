export type AiParseFieldType = 'text' | 'number' | 'money' | 'enum' | 'date' | 'boolean' | 'json';

export type AiParseInputType = 'FILE' | 'IMAGE' | 'EXCEL' | 'PDF' | 'OCR_TEXT' | 'MANUAL_TEXT';

export type AiParseInputRole = 'PRIMARY_SOURCE' | 'PARSED_FILE' | 'SUPPLEMENT' | 'REFERENCE';

export type AiParseTaskStatus =
  | 'reading'
  | 'parsing'
  | 'retry_waiting'
  | 'review_required'
  | 'ready_to_publish'
  | 'published'
  | 'failed';

export type AiParseTaskFilters = {
  targetPlanId: string;
  status: '' | AiParseTaskStatus;
  keyword: string;
};

export type AiParseChangeType = 'added' | 'changed' | 'delete_suspected' | 'conflict' | 'unchanged';

export type AiParseReviewStatus = 'pending' | 'needs_fix' | 'confirmed' | 'rejected' | 'keep_old' | 'hard_error';

export type AiParseConfidence = 'high' | 'medium' | 'low';

export type AiParseValidationStatus = 'pass' | 'warning' | 'hard_error';

export type AiParseRole = 'admin' | 'boss' | 'opsLead' | 'operator';

export type AiParseStandardField = {
  key: string;
  label: string;
  type: AiParseFieldType;
  required?: boolean;
  options?: string[];
  unit?: string;
  tableVisible?: boolean;
  width?: number;
};

export type AiParseDocumentStandard = {
  id: string;
  documentType: string;
  documentName: string;
  standardVersion: string;
  description: string;
  active: boolean;
  supportedInputs: AiParseInputType[];
  businessScopeFields: AiParseStandardField[];
  resultFields: AiParseStandardField[];
  itemTypes: Array<{ value: string; label: string }>;
  publishAdapterLabel: string;
};

export type AiParseStoreOption = {
  id: string;
  projectName: string;
  projectCode: string;
  ownerName: string;
  sites: string[];
};

export type AiParseTargetOutputPlan = {
  id: string;
  code?: string;
  label: string;
  documentType: string;
  documentName: string;
  standardId: string;
  standardVersion: string;
  storeId: string;
  storeLabel: string;
  businessScope: Record<string, string>;
  currentVersion: string;
  description: string;
  itemTypes?: Array<{ value: string; label: string }>;
  availableActions?: {
    canCreateTask?: boolean;
    canProcess?: boolean;
    canPublish?: boolean;
    canActivateLogisticsChannels?: boolean;
    canManageStandard?: boolean;
  };
};

export type AiParseTaskInput = {
  id: string;
  inputType: AiParseInputType;
  inputRole: AiParseInputRole;
  displayName: string;
  detail: string;
  downloadUrl?: string;
};

export type AiParseTaskStats = {
  total: number;
  pending: number;
  needsFix: number;
  conflicts: number;
  deleteSuspected: number;
  hardErrors: number;
  confirmed: number;
};

export type AiParseTask = {
  id: string;
  documentTitle: string;
  targetPlanId: string;
  documentType: string;
  documentName: string;
  standardVersion: string;
  storeId: string;
  storeLabel: string;
  businessScope: Record<string, string>;
  inputItems: AiParseTaskInput[];
  resultId: string;
  status: AiParseTaskStatus;
  documentGroupId?: string;
  parentTaskId?: string;
  iterationNo?: number;
  stats: AiParseTaskStats;
  currentVersion: string;
  createdAt: string;
  updatedAt: string;
  remark?: string;
  failureCode?: string;
  failureMessage?: string;
  nextRunAt?: string;
  availableActions?: AiParseTargetOutputPlan['availableActions'];
};

export type AiParseResultItem = {
  id: string;
  taskId: string;
  resultId: string;
  itemType: string;
  itemTypeLabel: string;
  naturalKey: string;
  changeType: AiParseChangeType;
  reviewStatus: AiParseReviewStatus;
  confidence: AiParseConfidence;
  summary: string;
  validationStatus: AiParseValidationStatus;
  validationMessage: string;
  evidence: string;
  sourceInputIds: string[];
  fields: Record<string, string | number | boolean | null>;
  oldFields?: Record<string, string | number | boolean | null>;
  changedFieldKeys: string[];
};

export type AiParseVersion = {
  id: string;
  versionNo: string;
  targetPlanId: string;
  documentType: string;
  documentName: string;
  standardVersion: string;
  storeLabel: string;
  businessScopeText: string;
  publishedAt: string;
  publisherName: string;
  sourceTaskId: string;
  status: 'active' | 'history' | 'revoked';
  inputSummary: string;
  itemCount: number;
};

export type AiParseVersionSnapshotItem = {
  id: string;
  versionId: string;
  itemTypeLabel: string;
  naturalKey: string;
  fields: Record<string, string | number | boolean | null>;
  sourceResultItemId?: string;
};

export type AiParseOperationLog = {
  id: string;
  taskId: string;
  action: string;
  operatorName: string;
  operatedAt: string;
  detail: string;
};

export type AiParseRolePermission = {
  role: AiParseRole;
  label: string;
  scope: string;
  canDraftEdit: boolean;
  canPublish: boolean;
  canActivateLogisticsChannels?: boolean;
  canManageStandard: boolean;
};
