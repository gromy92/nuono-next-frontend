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
