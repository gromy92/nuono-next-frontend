import type { ProductSyncStatus } from './common';

export type ProductLastPublishTaskPayload = {
  taskId?: number;
  status?: string;
  statusLabel?: '发布中' | '发布成功' | '发布失败' | '待人工核对' | string;
  resultText?: string;
  submittedAt?: string;
  finishedAt?: string;
  targetSiteCode?: string;
  pskuCode?: string;
  partnerSku?: string;
  changes?: Array<Record<string, unknown>>;
};

export type ProductLifecycleStatePayload = {
  code?: string;
  label?: string;
  ruleVersion?: string;
  analysisDate?: string;
  listingDate?: string;
  listingDateSource?: string;
  qualityState?: string;
  explanation?: string;
  evidenceJson?: string;
};

export type ProductListFilters = {
  skuQuery: string;
  titleQuery: string;
  brandQuery: string;
  issueFilter: string;
  liveFilter: string;
  lifecycleFilter: string;
  syncFilter: string;
  stockFilter: string;
};

export type StoreInitializationPayload = {
  mode: string;
  ready: boolean;
  status: 'BLOCKED' | 'IDLE' | 'RUNNING' | 'READY' | 'FAILED';
  message?: string;
  ownerUserId?: number;
  projectName?: string;
  projectCode?: string;
  storeCode?: string;
  siteCount?: number;
  uniqueProductCount?: number;
  siteOfferCount?: number;
  progressPercent?: number;
  phaseLabel?: string;
  startedAt?: string;
  lastInitializedAt?: string;
  canEnterProductWorkbench?: boolean;
  missingCoreTables: string[];
  warnings: string[];
  steps: Array<{
    code: string;
    label: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    message?: string;
  }>;
  siteSummaries: Array<{
    storeCode: string;
    site?: string;
    liveStatus?: string;
    productCount?: number;
  }>;
  sampleProducts: Array<{
    skuParent: string;
    productSourceType?: string;
    partnerSku?: string;
    pskuCode?: string;
    offerCode?: string;
    storeCode?: string;
    site?: string;
    title?: string;
    brand?: string;
    imageUrl?: string;
    galleryImages?: string[];
    barcode?: string;
    currency?: string;
    price?: string;
    productFulltype?: string;
    variantCount?: number;
    liveStatus?: string;
  }>;
  productItems: Array<{
    skuParent: string;
    productSourceType?: string;
    partnerSku?: string;
    pskuCode?: string;
    offerCode?: string;
    referenceStoreCode?: string;
    title?: string;
    brand?: string;
    imageUrl?: string;
    galleryImages?: string[];
    barcode?: string;
    currency?: string;
    referencePrice?: string;
    originalPrice?: string;
    salePrice?: string;
    productFulltype?: string;
    skuGroup?: string;
    groupRef?: string;
    groupRefCanonical?: string;
    liveStatus?: string;
    statusCode?: string;
    isActive?: boolean;
    syncStatus?: ProductSyncStatus;
    lastSyncedAt?: string;
    lastDraftSavedAt?: string;
    detailBaselineStatus?: 'ready' | 'missing' | 'preparing' | 'failed' | string;
    detailBaselineMessage?: string;
    detailBaselineSyncedAt?: string;
    variantCount?: number;
    siteOfferCount?: number;
    historyMetaReady?: boolean;
    pendingKeyContentHistoryCount?: number;
    visibleKeyContentHistoryCount?: number;
    pendingKeyContentHistoryVisibleAfter?: string;
    siteLabels: string[];
    liveStatuses: string[];
    issueTags: string[];
    totalFbnStock?: number;
    totalSupermallStock?: number;
    totalFbpStock?: number;
    viewsCount?: number;
    unitsSold?: number;
    salesAmount?: string;
    salesCurrency?: string;
    lifecycleState?: ProductLifecycleStatePayload;
    lastPublishTask?: ProductLastPublishTaskPayload;
  }>;
};

export type StoreInitializationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: StoreInitializationPayload }
  | { status: 'error'; message: string };

export type ProductListRowPayload = StoreInitializationPayload['productItems'][number];

export type ProductListDatasetPayload = {
  ready: boolean;
  source: 'projection-primary' | 'init-snapshot-fallback' | 'workspace-empty' | 'bootstrap-only';
  message?: string;
  warnings: string[];
  ownerUserId?: number;
  projectName?: string;
  projectCode?: string;
  storeCode?: string;
  initializationStatus?: StoreInitializationPayload['status'] | string;
  initializationMessage?: string;
  lastInitializedAt?: string;
  lastDatasetSyncedAt?: string;
  totalItems?: number;
  syncedCount?: number;
  draftCount?: number;
  conflictCount?: number;
  failedCount?: number;
  liveCount?: number;
  groupedCount?: number;
  pendingPriceCount?: number;
  historyReadyCount?: number;
  items: ProductListRowPayload[];
};

export type ProductListDatasetState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: ProductListDatasetPayload }
  | { status: 'error'; message: string };

export type ProductListSummaryPayload = {
  ready: boolean;
  source?: string;
  message?: string;
  warnings: string[];
  storeCode?: string;
  skuParent?: string;
  productSourceType?: string;
  partnerSku?: string;
  pskuCode?: string;
  offerCode?: string;
  title?: string;
  brand?: string;
  imageUrl?: string;
  galleryImages?: string[];
  barcode?: string;
  referencePrice?: string;
  originalPrice?: string;
  salePrice?: string;
  productFulltype?: string;
  skuGroup?: string | null;
  groupRef?: string | null;
  groupRefCanonical?: string | null;
  isActive?: boolean;
  liveStatus?: string;
  statusCode?: string;
  syncStatus?: ProductSyncStatus;
  lastSyncedAt?: string;
  lastDraftSavedAt?: string;
  detailBaselineStatus?: 'ready' | 'missing' | 'preparing' | 'failed' | string;
  detailBaselineMessage?: string;
  detailBaselineSyncedAt?: string;
  variantCount?: number;
  siteOfferCount?: number;
  siteLabels: string[];
  liveStatuses: string[];
  historyMetaReady?: boolean;
  pendingKeyContentHistoryCount?: number;
  visibleKeyContentHistoryCount?: number;
  pendingKeyContentHistoryVisibleAfter?: string;
  totalFbnStock?: number;
  totalSupermallStock?: number;
  totalFbpStock?: number;
  viewsCount?: number;
  unitsSold?: number;
  salesAmount?: string;
  salesCurrency?: string;
  lifecycleState?: ProductLifecycleStatePayload;
  lastPublishTask?: ProductLastPublishTaskPayload;
};

export type ProductSummarySurface = {
  skuParent: string;
  productSourceType?: string;
  partnerSku?: string;
  pskuCode?: string;
  offerCode?: string;
  storeCode?: string;
  title?: string;
  titleAr?: string;
  brand?: string;
  imageUrl?: string;
  galleryImages: string[];
  barcode?: string;
  currency?: string;
  referencePrice?: string;
  originalPrice?: string;
  salePrice?: string;
  productFulltype?: string;
  skuGroup?: string;
  groupRef?: string;
  groupRefCanonical?: string;
  liveStatus?: string;
  statusCode?: string;
  isActive?: boolean;
  syncStatus?: ProductSyncStatus;
  lastSyncedAt?: string;
  lastDraftSavedAt?: string;
  detailBaselineStatus?: 'ready' | 'missing' | 'preparing' | 'failed' | string;
  detailBaselineMessage?: string;
  detailBaselineSyncedAt?: string;
  variantCount?: number;
  siteOfferCount?: number;
  siteLabels: string[];
  liveStatuses: string[];
  totalFbnStock?: number;
  totalSupermallStock?: number;
  totalFbpStock?: number;
  viewsCount?: number;
  unitsSold?: number;
  salesAmount?: string;
  salesCurrency?: string;
  lifecycleState?: ProductLifecycleStatePayload;
};
