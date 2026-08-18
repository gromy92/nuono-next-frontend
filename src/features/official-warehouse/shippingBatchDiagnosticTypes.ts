export type OfficialWarehouseShippingBatchDiagnosticSeverity = 'info' | 'warning' | 'error'

export type OfficialWarehouseShippingBatchDiagnostic = {
  code: string
  severity: OfficialWarehouseShippingBatchDiagnosticSeverity
  title: string
  message: string
  action?: string
  batchId?: string
  batchNo?: string
  status?: string
  latestNodeStatus?: string
  targetSiteCode?: string
  packageCount?: number
  sourceCandidateCount?: number
  currentScopeCandidateCount?: number
  goodsLineCount?: number
  resolvedLineCount?: number
  shippedQuantity?: number
  remainingQuantity?: number
}
