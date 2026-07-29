import type { ProductSyncStatus } from './common';
import type { ProductListSummaryPayload, ProductSummarySurface } from './list';
import type { ProductMasterSnapshotPayload } from '../../product-domain/productMasterSnapshot';

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
  taskType?: 'publish-current' | 'product-delete' | 'product-rebuild' | string;
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

export type ProductVariantSpecModalState = {
  open: boolean;
  ownerUserId?: number;
  storeCode?: string;
  skuParent?: string;
  currentZCode?: string;
  title?: string;
  partnerSku?: string;
  variantId?: number;
  imageUrl?: string;
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

export type ProductWorkbenchContext = {
  mode: 'mock' | 'real';
  source: 'list-row' | 'quick-open' | 'init-carrier' | 'manual-open' | 'route-open' | 'unknown';
  storeCode?: string;
  skuParent?: string;
  currentZCode?: string;
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
