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

export type ProductVariantSpecLogisticsValue =
  | 'unknown'
  | 'none'
  | 'battery'
  | 'magnetic'
  | 'battery_and_magnetic'
  | 'liquid'
  | 'powder'
  | 'liquid_and_powder';

export type ProductVariantSpecSourceType = 'ali1688' | 'warehouse' | 'noon_official';

export type ProductVariantSpecCartonSourceType =
  | 'none'
  | 'factory_carton'
  | 'warehouse_measured'
  | 'derived_from_warehouse';

export type ProductVariantSpecPayload = {
  storeCode?: string;
  skuParent?: string;
  currentZCode?: string;
  title?: string;
  imageUrl?: string;
  variantId?: number;
  partnerSku?: string;
  childSku?: string;
  sizeEn?: string;
  sizeAr?: string;
  effectiveSourceId?: number;
  effectiveSourceType?: ProductVariantSpecSourceType | string;
  productLengthCm?: number;
  productWidthCm?: number;
  productHeightCm?: number;
  productWeightG?: number;
  cartonLengthCm?: number;
  cartonWidthCm?: number;
  cartonHeightCm?: number;
  cartonWeightKg?: number;
  cartonQuantity?: number;
  cartonSourceType?: ProductVariantSpecCartonSourceType | string;
  batteryMagneticType?: 'unknown' | 'none' | 'battery' | 'magnetic' | 'battery_and_magnetic';
  liquidPowderType?: 'unknown' | 'none' | 'liquid' | 'powder' | 'liquid_and_powder';
  completenessStatus?: string;
  missingFields?: string[];
  sources?: ProductVariantSpecSourcePayload[];
  logisticsProfile?: ProductLogisticsProfilePayload;
  sourceType?: string;
  confirmedAt?: string;
  confirmedBy?: number;
  createdBy?: number;
  updatedBy?: number;
  gmtCreate?: string;
  gmtUpdated?: string;
  isDeleted?: boolean;
};

export type ProductVariantSpecSourcePayload = {
  sourceId?: number;
  variantId?: number;
  sourceType?: ProductVariantSpecSourceType | string;
  productLengthCm?: number;
  productWidthCm?: number;
  productHeightCm?: number;
  productWeightG?: number;
  cartonLengthCm?: number;
  cartonWidthCm?: number;
  cartonHeightCm?: number;
  cartonWeightKg?: number;
  cartonQuantity?: number;
  cartonSourceType?: ProductVariantSpecCartonSourceType | string;
  batteryMagneticType?: 'unknown' | 'none' | 'battery' | 'magnetic' | 'battery_and_magnetic';
  liquidPowderType?: 'unknown' | 'none' | 'liquid' | 'powder' | 'liquid_and_powder';
  sourceRecordedAt?: string;
  confirmedAt?: string;
  confirmedBy?: number;
  updatedBy?: number;
  gmtUpdated?: string;
};

export type ProductVariantSpecListPayload = {
  ready: boolean;
  source?: string;
  message?: string;
  ownerUserId?: number;
  storeCode?: string;
  skuParent?: string;
  currentZCode?: string;
  partnerSku?: string;
  warnings?: string[];
  items: ProductVariantSpecPayload[];
};

export type ProductVariantSpecOverviewPayload = {
  ready: boolean;
  source?: string;
  message?: string;
  ownerUserId?: number;
  storeCode?: string;
  warnings?: string[];
  items: ProductVariantSpecPayload[];
};

export type ProductVariantSpecDetailPayload = {
  ready: boolean;
  ownerUserId?: number;
  storeCode?: string;
  variantId?: number;
  partnerSku?: string;
  childSku?: string;
  skuParent?: string;
  currentZCode?: string;
  title?: string;
  imageUrl?: string;
  effectiveSourceId?: number;
  effectiveSourceType?: ProductVariantSpecSourceType | string;
  effectiveSpec?: ProductVariantSpecPayload;
  sources?: ProductVariantSpecSourcePayload[];
  warnings?: string[];
};

export type ProductVariantSpecSaveRequest = ProductVariantSpecPayload & {
  ownerUserId?: number;
  storeCode: string;
  skuParent?: string;
  currentZCode?: string;
  partnerSku?: string;
};

export type ProductVariantSpecSourceSaveRequest = ProductVariantSpecSourcePayload & {
  ownerUserId?: number;
  storeCode: string;
  variantId?: number;
  partnerSku?: string;
  skuParent?: string;
  currentZCode?: string;
  sourceType: ProductVariantSpecSourceType;
};

export type ProductVariantSpecEffectiveSourceRequest = {
  ownerUserId?: number;
  storeCode: string;
  variantId?: number;
  partnerSku?: string;
  skuParent?: string;
  currentZCode?: string;
  sourceId: number;
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

export type ProductLogisticsProfilePayload = {
  profileId?: number;
  storeCode?: string;
  skuParent?: string;
  currentZCode?: string;
  title?: string;
  imageUrl?: string;
  variantId?: number;
  partnerSku?: string;
  childSku?: string;
  sizeEn?: string;
  sizeAr?: string;
  profileStatus?: 'needs_review' | 'confirmed' | string;
  batteryElectricType?: 'unknown' | 'none' | 'battery_or_electric' | string;
  batteryType?: 'unknown' | 'none' | 'battery_equipment' | string;
  magneticType?: 'unknown' | 'none' | 'magnetic' | string;
  liquidType?: 'unknown' | 'none' | 'liquid' | string;
  powderType?: 'unknown' | 'none' | 'powder' | string;
  liquidPowderType?: 'unknown' | 'none' | 'liquid' | 'powder' | 'liquid_and_powder' | string;
  electricType?: 'unknown' | 'none' | 'battery_equipment' | 'electric_equipment_review' | string;
  plugType?: 'unknown' | 'none' | 'none_or_usb_review' | 'plug_required_review' | string;
  voltageCompatibleType?: 'unknown' | 'none' | string;
  madeInChinaLabelStatus?: string;
  msdsStatus?: string;
  seaTransportReportStatus?: string;
  brandRiskType?: string;
  foodContactType?: string;
  medicalType?: string;
  cosmeticType?: string;
  wirelessCameraGpsType?: string;
  laserType?: string;
  bladeWeaponType?: string;
  culturalRestrictionType?: string;
  woodenMaterialType?: string;
  sensitiveTagsJson?: string;
  prohibitedTagsJson?: string;
  manualConfirmRequired?: boolean;
  confirmedAt?: string;
  confirmedBy?: number;
  notes?: string;
  gmtUpdated?: string;
};

export type ProductLogisticsProfileListPayload = {
  ready: boolean;
  ownerUserId?: number;
  storeCode?: string;
  skuParent?: string;
  currentZCode?: string;
  partnerSku?: string;
  items: ProductLogisticsProfilePayload[];
};

export type ProductLogisticsProfileSaveRequest = ProductLogisticsProfilePayload & {
  ownerUserId?: number;
  storeCode: string;
  variantId?: number;
  partnerSku?: string;
  currentZCode?: string;
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
