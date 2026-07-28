export type OfficialWarehouseFbnReportType =
  | 'fbn_inbound_fbnreceivedreport'
  | 'fbn_inbound_scheduleddeliveryaccuracy'
  | string

export type OfficialWarehouseFbnReportExportItem = {
  exportCode: string
  status?: string
  reportType?: OfficialWarehouseFbnReportType
  fileName?: string
  createdAt?: string
  downloadUrl?: string
}

export type OfficialWarehouseFbnReportExportListView = {
  storeCode?: string
  siteCode?: string
  page: number
  perPage: number
  hasNextPage: boolean
  sourceType?: string
  items: OfficialWarehouseFbnReportExportItem[]
}

export type OfficialWarehouseFbnReportExportCreatePayload = {
  storeCode: string
  siteCode: string
  exportCategoryCode: OfficialWarehouseFbnReportType
  fromDate: string
  toDate: string
}

export type OfficialWarehouseFbnReportExportCreateResult = {
  storeCode?: string
  siteCode?: string
  exportCode?: string
  status?: string
  reportType?: OfficialWarehouseFbnReportType
  fromDate?: string
  toDate?: string
  sourceType?: string
}

export type OfficialWarehouseFbnReportExportStatusPayload = {
  storeCode: string
  siteCode: string
  exportCode: string
  log?: boolean
}

export type OfficialWarehouseFbnReportExportStatusView = {
  storeCode?: string
  siteCode?: string
  exportCode?: string
  status?: string
  fileName?: string
  downloadUrl?: string
  message?: string
  totalRows?: number
  sourceType?: string
}

export type OfficialWarehouseFbnReportImportPayload = {
  storeCode: string
  siteCode: string
  exportCode: string
  logStatus?: boolean
}

export type OfficialWarehouseFbnReportImportResult = {
  importId?: string
  storeCode?: string
  siteCode?: string
  exportCode?: string
  reportType?: OfficialWarehouseFbnReportType
  status?: string
  totalRows?: number
  validRows?: number
  warningRows?: number
  errorRows?: number
  insertedReceiptLines?: number
  insertedAsnRows?: number
  scheduledQuantity?: number
  grnQuantity?: number
  inboundQuantityVariance?: number
  fileName?: string
  fileSha256?: string
  importedAt?: string
  sourceType?: string
}

export type OfficialWarehouseScheduledDeliveryAccuracyRematchPayload = {
  storeCode: string
  siteCode: string
  importId: string
}

export type OfficialWarehouseScheduledDeliveryAccuracyRematchResult = {
  importId?: string
  storeCode?: string
  siteCode?: string
  totalRows: number
  matchedRowsBefore: number
  noLocalAsnRowsBefore: number
  rematchedRows: number
  matchedRowsAfter: number
  noLocalAsnRowsAfter: number
}
