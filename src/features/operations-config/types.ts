export type OperationConfigBossOption = {
  ownerUserId: number
  displayName?: string | null
  accountNo?: string | null
}

export type OperationConfigStoreScope = {
  ownerUserId: number
  logicalStoreId?: number | null
  projectCode?: string | null
  projectName?: string | null
  storeCode: string
  siteCode: string
}

export type OperationConfigScopeView = {
  systemAdmin: boolean
  roleName?: string | null
  bossOptions: OperationConfigBossOption[]
  selectedBossUserIds: number[]
  stores: OperationConfigStoreScope[]
  defaultOwnerUserId?: number | null
  defaultStoreCode?: string | null
  defaultSiteCode?: string | null
  emptyReason?: 'SELECT_BOSS' | 'NO_STORE' | string | null
}

export type OperationConfigPageKind = 'business-calendar' | 'lifecycle-rules'

export type OperationConfigBundleScopeStore = {
  ownerUserId: number
  storeCode: string
  siteCode: string
}

export type OperationConfigBundleVersion = {
  id: number
  publishRecordId: number
  versionNo: string
  displayName?: string | null
  status: string
  publishSourceRole?: string | null
  publishSourceLabel?: string | null
  scopeSummary?: string | null
  affectedStoreCount: number
  activityRuleCount: number
  lifecycleRuleSummary?: string | null
  publishedBy?: number | null
  publishedAt?: string | null
  createdBy?: number | null
  createdAt?: string | null
  scopeStores?: OperationConfigBundleScopeStore[]
}

export type OperationConfigCurrentBundleView = {
  bundle?: OperationConfigBundleVersion | null
  matchType: 'STORE_SITE' | 'BOSS_WIDE' | 'NONE' | string
}

export type OperationConfigVersionAction = {
  action: 'EDIT' | 'DETAIL' | 'COPY' | 'DELETE' | 'PUBLISH' | 'DISABLE' | string
  label: string
  enabled: boolean
  disabledReason?: string | null
}

export type OperationConfigVersionRow = {
  versionNo: string
  displayName: string
  configType: 'BUSINESS_CALENDAR' | 'PRODUCT_LIFECYCLE' | string
  configTypeLabel: string
  status: string
  statusLabel: string
  sourceLabel?: string | null
  summary?: string | null
  itemCount: number
  scopeSummary?: string | null
  updatedBy?: number | null
  updatedAt?: string | null
  actions: OperationConfigVersionAction[]
}

export type OperationConfigDefaultVersionItem = {
  groupName?: string | null
  itemName: string
  cadence?: string | null
  valueType?: string | null
  defaultValue?: string | null
  resultShape?: string | null
  note?: string | null
}

export type OperationConfigVersionDetail = OperationConfigVersionRow & {
  items: OperationConfigDefaultVersionItem[]
  auditTrail?: OperationConfigVersionAudit[]
}

export type OperationConfigVersionAudit = {
  operatorUserId?: number | null
  operatorLabel?: string | null
  operation: string
  fromStatus?: string | null
  toStatus?: string | null
  reason?: string | null
  operatedAt?: string | null
}

export type OperationConfigDefaultVersion = {
  versionNo: string
  displayName: string
  configType: 'business_calendar' | 'product_lifecycle' | string
  status: 'SYSTEM_DEFAULT' | string
  publishSourceLabel?: string | null
  sourceDocument?: string | null
  summary?: string | null
  itemCount: number
  items: OperationConfigDefaultVersionItem[]
}

export type OperationCalendarRule = {
  id: number
  bundleVersionId?: number | null
  ownerUserId: number
  storeCode: string
  siteCode: string
  ruleName: string
  activityType: string
  dateFrom: string
  dateTo: string
  recurringExpression?: string | null
  targetScopeType: string
  targetScopeValue?: string | null
  factorValue: number
  factorPurpose: string
  enabled: boolean
  publishStatus: string
  publishSourceRole?: string | null
  publishSourceLabel?: string | null
}

export type OperationCalendarRuleScopeQuery = {
  bossUserIds?: number[]
  bundleVersionId?: number | null
  ownerUserId: number
  storeCode: string
  siteCode: string
}

export type OperationCalendarRuleCopyPreviousYearInput = OperationCalendarRuleScopeQuery & {
  sourceYear: number
  targetYear: number
}

export type OperationCalendarRuleDraftInput = OperationCalendarRuleScopeQuery & {
  id?: number | null
  ruleName: string
  activityType: string
  dateFrom: string
  dateTo: string
  recurringExpression?: string | null
  targetScopeType: string
  targetScopeValue?: string | null
  factorValue: number
  factorPurpose: string
  enabled: boolean
}

export type OperationCalendarRuleBatchUpdateInput = OperationCalendarRuleScopeQuery & {
  ruleIds: number[]
  enabled?: boolean
  factorValue?: number
}

export type OperationConfigProductDimensionOption = {
  value: string
  label?: string | null
  usageCount?: number | null
}

export type OperationConfigProductDimensionOptionsView = {
  ready: boolean
  source: string
  brands: OperationConfigProductDimensionOption[]
  productFulltypes: OperationConfigProductDimensionOption[]
  categories: OperationConfigProductDimensionOption[]
}

export type OperationLifecycleRuleThresholds = {
  newMaxAgeDays: number
  newMinAgeDays: number
  highPriceThreshold: number
  growthMinSalesGrowthRate: number
  growthMinPvGrowthRate: number
  growthMinMonthlySales: number
  growthMinActiveSalesDays: number
  growthMaxVolatility: number
  stableMinPvGrowthRate: number
  stableVolatilityMin: number
  stableVolatilityMax: number
  declineMaxVolatility: number
  declineMaxSalesGrowthRate: number
  longTailMaxVolatility: number
  longTailMaxMonthlySales: number
}

export type OperationLifecycleRuleView = {
  id?: number | null
  ownerUserId: number
  storeCode: string
  siteCode: string
  ruleVersion: string
  sourceRuleVersion?: string | null
  bundleVersionId?: number | null
  thresholds: OperationLifecycleRuleThresholds
  publishStatus: string
  publishSourceRole?: string | null
  publishSourceLabel?: string | null
  fallback: boolean
}

export type OperationLifecycleRule = Omit<OperationLifecycleRuleView, 'fallback'> & {
  id: number
  publishRecordId?: number | null
}

export type OperationLifecycleRuleDiff = {
  field: keyof OperationLifecycleRuleThresholds | string
  label: string
  beforeValue: string
  afterValue: string
}

export type OperationLifecycleRuleStateView = {
  current: OperationLifecycleRuleView
  draft?: OperationLifecycleRuleView | null
  diffs: OperationLifecycleRuleDiff[]
  history: OperationLifecycleRuleView[]
  impactScope: string
}

export type OperationLifecycleRuleDraftInput = OperationCalendarRuleScopeQuery & {
  id?: number | null
  thresholds: OperationLifecycleRuleThresholds
}

export type OperationLifecycleRecalculationInput = OperationCalendarRuleScopeQuery & {
  anchorDate: string
  selectedRuleVersion: string
}

export type OperationLifecycleRecalculationJob = {
  id: number
  ownerUserId: number
  storeCode: string
  siteCode: string
  anchorDate: string
  ruleVersion: string
  status: string
  processedCount: number
  changedCount: number
  heldCount: number
  dataInsufficientCount: number
  triggeredByUserId?: number | null
  triggerSource?: string | null
}
