import type { ApiProblem } from '../../shared/api'
import type { OfficialWarehouseProductCandidate } from './api'

export const OFFICIAL_WAREHOUSE_ASN_PRODUCT_PREFLIGHT_FAILED = 'OFFICIAL_WAREHOUSE_ASN_PRODUCT_PREFLIGHT_FAILED'

export type AsnProductPreflightInvalidLine = {
  partnerSku?: string
  pskuCode?: string
  reasonCode: string
  message?: string
}

const REASON_LABELS: Record<string, string> = {
  EMPTY_SELECTION: '未选择可创建的商品',
  LOCAL_IDENTITY_INCOMPLETE: '本地商品身份或数量不完整',
  REMOTE_PRODUCT_MISSING: 'Noon 当前店铺未找到该商品',
  PSKU_MISMATCH: 'Noon PSKU 与本地冻结值不一致',
  REMOTE_IDENTITY_AMBIGUOUS: 'Noon 返回多个相同商品身份，无法安全创建',
  PBARCODE_UNMAPPED: 'Noon 未建立有效 pbarcode 映射',
  BARCODE_PBARCODE_MISMATCH: '物流 barcode 未出现在 Noon pbarcode 映射中'
}

export function asnProductPreflightInvalidLines(problem?: ApiProblem): AsnProductPreflightInvalidLine[] {
  if (problem?.code !== OFFICIAL_WAREHOUSE_ASN_PRODUCT_PREFLIGHT_FAILED || !Array.isArray(problem.details?.invalidLines)) {
    return []
  }
  return problem.details.invalidLines.flatMap((line) => {
    if (!line || typeof line !== 'object' || Array.isArray(line)) return []
    const record = line as Record<string, unknown>
    const reasonCode = stringValue(record.reasonCode)
    if (!reasonCode) return []
    return [{
      partnerSku: stringValue(record.partnerSku),
      pskuCode: stringValue(record.pskuCode),
      reasonCode,
      message: stringValue(record.message)
    }]
  })
}

export function asnProductPreflightReasonText(line: AsnProductPreflightInvalidLine) {
  return REASON_LABELS[line.reasonCode] || line.message || line.reasonCode
}

export function matchesAsnProductPreflightInvalidLine(
  candidate: Pick<OfficialWarehouseProductCandidate, 'partnerSku' | 'pskuCode'>,
  invalidLine: AsnProductPreflightInvalidLine
) {
  return sameCode(candidate.partnerSku, invalidLine.partnerSku) || sameCode(candidate.pskuCode, invalidLine.pskuCode)
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function sameCode(left?: string, right?: string) {
  return Boolean(left?.trim() && right?.trim() && left.trim().toLowerCase() === right.trim().toLowerCase())
}
