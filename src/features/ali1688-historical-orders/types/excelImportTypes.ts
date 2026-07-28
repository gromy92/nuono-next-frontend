export type Ali1688ExcelImportSource = {
  authorizationId?: number
  providerCode?: string
  accountLabel?: string
  storeCode?: string
  siteCode?: string
  status?: string
}

export type Ali1688ExcelImportSourceCreateRequest = {
  accountLabel: string
  storeCode?: string
  siteCode?: string
}

export type Ali1688ExcelImportSummary = {
  totalDataRowCount: number
  orderHeaderRowCount: number
  productLineCount: number
  logisticsLineCount: number
  validRowCount: number
  duplicateCandidateCount: number
}

export type Ali1688ExcelImportHeaderValidation = {
  valid: boolean
  expectedHeaderCount: number
  actualHeaderCount: number
  message?: string
  missingHeaders?: string[]
  mismatchedHeaders?: Array<{
    columnIndex: number
    expected?: string
    actual?: string
  }>
}

export type Ali1688ExcelImportRowMessage = {
  rowNumber: number
  fieldName?: string
  code?: string
  message?: string
}

export type Ali1688ExcelImportPreview = {
  batchId: number
  status: 'preview_ready' | 'validation_failed' | string
  fileName?: string
  fileSize?: number
  fileHash?: string
  source?: Ali1688ExcelImportSource
  storeCode?: string
  siteCode?: string
  headerValidation?: Ali1688ExcelImportHeaderValidation
  summary: Ali1688ExcelImportSummary
  rowErrors?: Ali1688ExcelImportRowMessage[]
  rowWarnings?: Ali1688ExcelImportRowMessage[]
}

export type Ali1688ExcelImportPreviewRequest = {
  authorizationId: number
  storeCode?: string
  siteCode?: string
  file: File
}

export type Ali1688ExcelImportCommitCounts = {
  insertedOrderCount: number
  updatedOrderCount: number
  skippedOrderCount: number
  insertedItemCount: number
  updatedItemCount: number
  skippedItemCount: number
  insertedLogisticsCount: number
  updatedLogisticsCount: number
  skippedLogisticsCount: number
}

export type Ali1688ExcelImportCommitResult = {
  batchId: number
  status: 'committed' | string
  counts: Ali1688ExcelImportCommitCounts
}

export type Ali1688ExcelImportBatch = {
  batchId: number
  authorizationId?: number
  providerCode?: string
  accountLabel?: string
  storeCode?: string
  siteCode?: string
  fileName?: string
  fileSize?: number
  fileHash?: string
  status?: string
  headerVersion?: string
  orderHeaderRowCount?: number
  productLineCount?: number
  logisticsLineCount?: number
  validRowCount?: number
  duplicateCandidateCount?: number
  errorCount?: number
  warningCount?: number
  failureCode?: string
  failureMessage?: string
  createdBy?: number
  createdAt?: string
  updatedAt?: string
}

export type Ali1688ExcelImportBatchDetail = Ali1688ExcelImportBatch & {
  errorSummaryJson?: string
}
