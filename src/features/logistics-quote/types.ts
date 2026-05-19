export type LogisticsQuoteWorkbenchSummaryDto = {
  totalForwarders: number
  totalBundles: number
  publishedVersions: number
  totalRules: number
}

export type LogisticsQuoteBundleListItemDto = {
  id: number
  bundleName: string
  forwarderName: string
  analysisStatus: string
  latestVersionNo: string
  latestVersionStatus: string
  recommendationLevel: string
  fileCount: number
  noteCount: number
  updatedAt?: string
}

export type LogisticsQuoteForwarderDto = {
  id?: number
  name: string
  alias?: string
  companyName?: string
  notes?: string
}

export type LogisticsQuoteVersionDto = {
  id?: number
  versionNo: string
  status: string
  summary?: string
  effectiveFrom?: string
}

export type LogisticsQuoteSourceFileDto = {
  id?: number
  fileName: string
  fileType: string
  filePath?: string
  sourceLabel?: string
  archived?: boolean
  archiveUrl?: string
}

export type LogisticsQuoteSourceNoteDto = {
  id?: number
  noteType: string
  sourceChannel: string
  content: string
}

export type LogisticsQuoteServiceDto = {
  serviceName: string
  countryCode?: string
  routeCode?: string
  transportMode?: string
  businessType?: string
  serviceScope?: string
  transitTimeText?: string
  remarks?: string
}

export type LogisticsQuoteRuleDto = {
  serviceName: string
  ruleName: string
  ruleType: string
  cargoCategory?: string
  billingUnit?: string
  currency?: string
  unitPrice?: number | null
  calcBasis?: string
  summary?: string
}

export type LogisticsQuoteRestrictionDto = {
  serviceName: string
  restrictionType: string
  operator?: string
  value?: string
  unit?: string
  severity?: string
  description?: string
}

export type LogisticsQuoteEvidenceDto = {
  targetType: string
  targetName: string
  sourceType: string
  sourceName: string
  locator?: string
  evidenceText?: string
}

export type LogisticsQuoteReputationSnapshotDto = {
  overallScore?: number
  complianceScore?: number
  timelinessScore?: number
  priceTransparencyScore?: number
  claimsScore?: number
  serviceScore?: number
  recommendationLevel?: string
  recentRiskSummary?: string
  analysisSummary?: string
}

export type LogisticsQuoteReputationSignalDto = {
  signalType: string
  polarity: string
  severity: string
  sourceType: string
  topic?: string
  evidenceText?: string
}

export type LogisticsQuoteBundleDetailDto = {
  id: number
  bundleName: string
  analysisStatus: string
  analysisSummary?: string
  sourceReadbackHint?: string
  selectedNoteId?: number | null
  selectedFileId?: number | null
  forwarder: LogisticsQuoteForwarderDto
  quoteVersion: LogisticsQuoteVersionDto
  files: LogisticsQuoteSourceFileDto[]
  notes: LogisticsQuoteSourceNoteDto[]
  services: LogisticsQuoteServiceDto[]
  rules: LogisticsQuoteRuleDto[]
  restrictions: LogisticsQuoteRestrictionDto[]
  evidences: LogisticsQuoteEvidenceDto[]
  reputationSnapshot: LogisticsQuoteReputationSnapshotDto
  reputationSignals: LogisticsQuoteReputationSignalDto[]
}

export type LogisticsQuoteWorkbenchResponse = {
  mode: string
  ready: boolean
  message?: string
  summary: LogisticsQuoteWorkbenchSummaryDto
  selectedBundleId?: number | null
  bundles: LogisticsQuoteBundleListItemDto[]
  selectedBundle?: LogisticsQuoteBundleDetailDto | null
}

export type LogisticsQuoteOperationPriceItemsSummaryDto = {
  totalItems: number
  airItemCount: number
  seaItemCount: number
  warehouseItemCount: number
  adjustedItemCount: number
}

export type LogisticsQuoteOperationPriceItemDto = {
  targetId: number
  targetType: string
  numericField: string
  quoteVersionId?: number
  quoteVersionNo?: string
  forwarderId?: number
  forwarderName?: string
  serviceCode?: string
  serviceName?: string
  transportMode?: string
  targetPlatform?: string
  deliveryCity?: string
  cargoCategoryCode?: string
  cargoCategoryName?: string
  categoryLevel1?: string
  categoryLevel2?: string
  pricingModel?: string
  currency?: string
  standardValue?: number | null
  adjustedValue?: number | null
  effectiveValue?: number | null
  billingUnit?: string
  billingBasis?: string
  minCharge?: number | null
  minBillableUnit?: number | null
  priceStatus?: string
  sourceFileName?: string
  sourceLocator?: string
  remark?: string
  hasAdjustment?: boolean
  adjustmentReason?: string
  updatedAt?: string
}

export type LogisticsQuoteOperationPriceItemsResponse = {
  mode: string
  ready: boolean
  message?: string
  summary: LogisticsQuoteOperationPriceItemsSummaryDto
  items: LogisticsQuoteOperationPriceItemDto[]
}

export type LogisticsQuoteOperationPriceAdjustmentRequest = {
  targetType: string
  targetId: number
  numericField: string
  adjustedValue: number
  reason: string
}

export type LogisticsQuoteOperationPriceAdjustmentResponse = {
  ready: boolean
  message?: string
  adjustmentId?: number
  logId?: number
}

export type LogisticsQuoteSourceBundleCreateRequest = {
  forwarderName: string
  forwarderAlias?: string
  forwarderNotes?: string
  bundleName: string
  analysisStatus?: string
  analysisSummary?: string
  files: Array<{
    fileName: string
    fileType?: string
    filePath?: string
  }>
  notes: Array<{
    noteType?: string
    sourceChannel?: string
    content: string
    authorName?: string
  }>
}

export type LogisticsQuoteSourceBundleNoteUpdateRequest = {
  noteId: number
  content: string
}

export type LogisticsQuoteSourceBundleFileCreateRequest = {
  fileName: string
  fileType?: string
  filePath?: string
}

export type LogisticsQuoteSourceBundleFileUpdateRequest = {
  fileId: number
  fileName: string
  fileType?: string
  filePath?: string
}

export type LogisticsQuoteSourceBundleNoteCreateRequest = {
  noteType?: string
  sourceChannel?: string
  content: string
  authorName?: string
}

export type LogisticsQuoteSourceBundleAnalysisSummaryUpdateRequest = {
  analysisSummary: string
}

export type LogisticsQuoteDraftFromNoteRequest = {
  noteId: number
  serviceName: string
  countryCode?: string
  routeCode?: string
  transportMode?: string
  businessType?: string
  serviceScope?: string
  currency?: string
  versionNo?: string
  effectiveFrom?: string
  summary?: string
}

export type LogisticsQuoteNotePreviewRuleDto = {
  ruleName: string
  ruleType: string
  billingUnit: string
  unitPrice?: number | null
  triggerCondition?: string
  summary?: string
}

export type LogisticsQuoteNotePreviewRestrictionDto = {
  restrictionType: string
  operator?: string
  value?: string
  unit?: string
  severity?: string
  description?: string
}

export type LogisticsQuoteNotePreviewRequest = {
  noteText: string
}

export type LogisticsQuoteNotePreviewResponse = {
  ready: boolean
  message?: string
  normalizedNote?: string
  rulePreviews: LogisticsQuoteNotePreviewRuleDto[]
  restrictionPreviews: LogisticsQuoteNotePreviewRestrictionDto[]
  warnings: string[]
}
