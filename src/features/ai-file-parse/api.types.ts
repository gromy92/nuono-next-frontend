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
  inputItems?: FileParseTaskInputPayload[];
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

export type FileParseBatchReviewPayload = {
  taskId: number;
  resultId: number;
  totalCount: number;
  successCount: number;
  items: FileParseProcessingItemPayload[];
};
