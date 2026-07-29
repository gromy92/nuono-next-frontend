import type { OfficialWarehouseInboundOrder, OfficialWarehouseSummary } from './types'

export type OfficialWarehouseAsnSummaryRow = {
  status?: string
  totalQuantity?: number
  appointment?: {
    status?: string
  } | null
}

export type OfficialWarehouseAsnSummary = {
  asnTotal: number
  asnCreated: number
  asnProcessing: number
  asnFailed: number
  appointmentPending: number
  appointmentSuccess: number
  appointmentFailed: number
  totalQuantity: number
}

export function buildOfficialWarehouseAsnSummary(rows: OfficialWarehouseAsnSummaryRow[]): OfficialWarehouseAsnSummary {
  return rows.reduce<OfficialWarehouseAsnSummary>(
    (summary, row) => {
      summary.asnTotal += 1
      if (row.status === 'LINES_CREATED') {
        summary.asnCreated += 1
      } else if (row.status === 'FAILED') {
        summary.asnFailed += 1
      } else {
        summary.asnProcessing += 1
      }
      const appointmentStatus = row.appointment?.status
      if (appointmentStatus === 'PENDING' || appointmentStatus === 'RUNNING') {
        summary.appointmentPending += 1
      }
      if (appointmentStatus === 'SCHEDULED') {
        summary.appointmentSuccess += 1
      }
      if (appointmentStatus === 'FAILED') {
        summary.appointmentFailed += 1
      }
      summary.totalQuantity += Number(row.totalQuantity || 0)
      return summary
    },
    {
      asnTotal: 0,
      asnCreated: 0,
      asnProcessing: 0,
      asnFailed: 0,
      appointmentPending: 0,
      appointmentSuccess: 0,
      appointmentFailed: 0,
      totalQuantity: 0
    }
  )
}

export function buildOfficialWarehouseSummary(rows: OfficialWarehouseInboundOrder[]): OfficialWarehouseSummary {
  return rows.reduce<OfficialWarehouseSummary>(
    (summary, row) => {
      summary.totalInboundOrders += 1
      if (row.asnStatus === 'DRAFT' || row.asnStatus === 'WAREHOUSE_CONFIRMED' || row.asnStatus === 'SUBMITTING') {
        summary.pendingAsn += 1
      }
      if (row.asnStatus === 'FAILED') {
        summary.failedAsn += 1
      }
      if (row.appointmentStatus === 'PENDING' || row.appointmentStatus === 'RUNNING') {
        summary.pendingAppointment += 1
      }
      if (row.appointmentStatus === 'SUCCESS') {
        summary.successAppointment += 1
      }
      if (row.appointmentStatus === 'FAILED') {
        summary.failedAppointment += 1
      }
      if (row.discrepancyStatus === 'NEEDS_CORRECTION') {
        summary.receiptCorrectionsNeeded += 1
      }
      return summary
    },
    {
      totalInboundOrders: 0,
      pendingAsn: 0,
      failedAsn: 0,
      pendingAppointment: 0,
      successAppointment: 0,
      failedAppointment: 0,
      receiptCorrectionsNeeded: 0
    }
  )
}
