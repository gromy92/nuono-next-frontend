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
