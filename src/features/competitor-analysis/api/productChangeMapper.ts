import type {
  BackendProductChangeBaselineSummary,
  BackendProductChangeField,
  BackendProductChangeGroup
} from './backendContracts'
import type {
  CompetitorProductChangeBaselineSummary,
  CompetitorProductChangeField,
  CompetitorProductChangeGroup
} from '../types'
import { idValue, numberValue, stringValue } from './transportValues'

export function mapProductChangeGroup(row: BackendProductChangeGroup): CompetitorProductChangeGroup {
  const factDate = stringValue(row.factDate)
  const noonProductCode = stringValue(row.noonProductCode)
  return {
    id: idValue(row.id) || `${factDate}-${noonProductCode}`,
    factDate,
    noonProductCode,
    productName: stringValue(row.productName) || noonProductCode || '未知商品',
    subjectType: String(row.subjectType || '').toUpperCase() === 'SELF' ? 'self' : 'competitor',
    changes: (row.changes || []).map(mapProductChangeField)
  }
}

export function mapProductChangeBaselineSummary(
  row?: BackendProductChangeBaselineSummary
): CompetitorProductChangeBaselineSummary | undefined {
  if (!row) return undefined
  return {
    monitoredCompetitorCount: numberValue(row.monitoredCompetitorCount),
    snapshotCompetitorCount: numberValue(row.snapshotCompetitorCount),
    firstSnapshotDate: stringValue(row.firstSnapshotDate) || undefined,
    latestSnapshotDate: stringValue(row.latestSnapshotDate) || undefined,
    latestCapturedAt: stringValue(row.latestCapturedAt) || undefined
  }
}

function mapProductChangeField(row: BackendProductChangeField): CompetitorProductChangeField {
  return {
    fieldKey: stringValue(row.fieldKey),
    fieldLabel: stringValue(row.fieldLabel) || stringValue(row.fieldKey),
    changeType: stringValue(row.changeType),
    oldValue: row.oldValue,
    newValue: row.newValue,
    severity: normalizeChangeSeverity(row.severity)
  }
}

function normalizeChangeSeverity(value: unknown): CompetitorProductChangeField['severity'] {
  const normalized = String(value || 'INFO').toUpperCase()
  if (normalized === 'CRITICAL') {
    return 'critical'
  }
  if (normalized === 'WARNING') {
    return 'warning'
  }
  return 'info'
}
