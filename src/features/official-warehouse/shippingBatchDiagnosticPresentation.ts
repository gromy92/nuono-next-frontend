import type { OfficialWarehouseShippingBatchCandidate } from './api'
import type { OfficialWarehouseShippingBatchDiagnostic } from './shippingBatchDiagnosticTypes'

export function shippingBatchDiagnosticEmptyText(
  diagnostic?: OfficialWarehouseShippingBatchDiagnostic,
  loading = false
) {
  if (loading) return '正在查询物流批次…'
  return diagnostic
    ? '未找到可选择的物流批次，请查看上方原因'
    : '未找到可约仓物流批次'
}

export function isOfficialWarehouseShippingBatchSelectable(
  batch: OfficialWarehouseShippingBatchCandidate
) {
  if (batch.alreadyAppointed) return true
  return Number(batch.remainingQuantity ?? batch.storeSiteQuantity ?? batch.totalQuantity ?? 0) > 0
}

export function zeroQuantityShippingBatchDiagnostic(
  rows: OfficialWarehouseShippingBatchCandidate[]
): OfficialWarehouseShippingBatchDiagnostic | undefined {
  if (!rows.length || rows.some(isOfficialWarehouseShippingBatchSelectable)) return undefined
  const batch = rows[0]
  const batchNo = batch.batchNo || batch.trackingNo || batch.externalShipmentNo || batch.id
  return {
    code: 'NO_AVAILABLE_QUANTITY',
    severity: 'warning',
    title: '物流批次暂无可约数量',
    message: `批次 ${batchNo} 当前可约仓数量为 0，不能选择创建 ASN。`,
    action: '核对发货数量以及已有 ASN/预约'
  }
}
