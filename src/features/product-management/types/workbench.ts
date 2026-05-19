import type { ProductSyncStatus } from './common';
import type { ProductListSummaryPayload, ProductSummarySurface } from './list';

export type ProductWorkbenchAction = 'save' | 'publish-current' | 'pull' | 'rollback-draft';

export type ProductWorkbenchActionOptions = {
  syncMergePolicy?: 'keep_draft' | 'use_noon';
  publishConflictResolution?: 'use_local';
};

export type ProductPublishConflictField = {
  path: string;
  label?: string;
  scope?: 'shared' | 'site' | string;
  baselineValue?: unknown;
  localValue?: unknown;
  noonValue?: unknown;
};

export type ProductPublishConflictPayload = {
  status?: string;
  message?: string;
  currentSiteCode?: string;
  checkedAt?: string;
  fields: ProductPublishConflictField[];
};

export type ProductPublishTaskStatus =
  | 'queued'
  | 'running'
  | 'submitted'
  | 'verifying'
  | 'pending_effective'
  | 'write_unknown'
  | 'verify_timeout'
  | 'pending_manual_check'
  | 'synced'
  | 'failed'
  | 'cancelled';

export type ProductPublishTaskPayload = {
  taskId?: number;
  status?: ProductPublishTaskStatus | string;
  message?: string;
  changedDomains?: string[];
  retryCount?: number;
  verifyAttemptCount?: number;
  nextRunAt?: string;
  finishedAt?: string;
  pollAfterMillis?: number;
  workbench?: ProductWorkbenchPayload;
};

export type ProductMasterSnapshotPayload = {
  mode: string;
  ready: boolean;
  degraded?: boolean;
  message?: string;
  warnings: string[];
  missingCoreTables: string[];
  missingOperationalKeys?: string[];
  storeContext: Record<string, unknown>;
  identity: Record<string, unknown>;
  taxonomy: Record<string, unknown>;
  content: Record<string, unknown>;
  platformSignals: Record<string, unknown>;
  keyAttributes: Array<Record<string, unknown>>;
  group: Record<string, unknown>;
  variants: Array<Record<string, unknown>>;
  pricing: Record<string, unknown>;
  stock: Record<string, unknown>;
  siteOffers: Array<Record<string, unknown>>;
};

export type ProductWorkbenchPayload = ProductMasterSnapshotPayload & {
  baselineSnapshot?: ProductMasterSnapshotPayload;
  draftSnapshot?: ProductMasterSnapshotPayload;
  syncStatus?: ProductSyncStatus;
  lastSyncedAt?: string;
  note?: string;
  recentActions?: Array<Record<string, unknown>>;
  keyContentHistory?: Array<Record<string, unknown>>;
  pendingKeyContentHistoryCount?: number;
  pendingKeyContentHistoryVisibleAfter?: string;
  listSummary?: ProductListSummaryPayload;
  publishConflict?: ProductPublishConflictPayload;
  publishTask?: ProductPublishTaskPayload;
};

export type ProductMasterSnapshotState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: ProductWorkbenchPayload }
  | { status: 'error'; message: string };

export type ProductWorkbenchState = {
  baseline: ProductMasterSnapshotPayload;
  draft: ProductMasterSnapshotPayload;
  syncStatus: ProductSyncStatus;
  lastSyncedAt?: string;
  note?: string;
  keyContentHistory: Array<Record<string, unknown>>;
  pendingKeyContentHistoryCount: number;
  pendingKeyContentHistoryVisibleAfter?: string;
};

export type ProductFieldDomainKey = 'main' | 'content' | 'grouping' | 'attributes' | 'site';

export type ProductFieldDomainStatus = 'synced' | 'draft' | 'attention' | 'blocked';

export type ProductFieldDomainSurface = {
  key: ProductFieldDomainKey;
  label: string;
  scopeLabel: string;
  status: ProductFieldDomainStatus;
  dirty: boolean;
  note: string;
  metrics: Array<{ label: string; value: string | number }>;
  issues: string[];
  blockingIssueCount: number;
};

export type ProductWorkbenchFieldSurface = {
  domains: ProductFieldDomainSurface[];
  changedDomainKeys: ProductFieldDomainKey[];
  changedDomainLabels: string[];
  publishCurrentScopeLabel: string;
  publishCurrentIssues: string[];
  currentSiteCode?: string;
};

export type ProductWorkbenchContext = {
  mode: 'mock' | 'real';
  source: 'list-row' | 'quick-open' | 'init-carrier' | 'manual-open' | 'route-open' | 'unknown';
  storeCode?: string;
  skuParent?: string;
  partnerSku?: string;
  pskuCode?: string;
  summaryPreview: ProductSummarySurface | null;
  openedAt: string;
};

export type ProductWorkbenchSurfaceReadyState = {
  status: 'ready';
  context: ProductWorkbenchContext;
  payload: ProductWorkbenchPayload;
  workbench: ProductWorkbenchState;
  summary: ProductSummarySurface | null;
  recentActions: Array<Record<string, unknown>>;
  loadedAt: string;
};

export type ProductWorkbenchSurfaceState =
  | { status: 'idle' }
  | { status: 'loading'; context: ProductWorkbenchContext; message?: string }
  | { status: 'error'; context?: ProductWorkbenchContext; message: string }
  | ProductWorkbenchSurfaceReadyState;
