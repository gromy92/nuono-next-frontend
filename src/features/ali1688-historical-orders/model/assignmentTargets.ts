import type { Ali1688HistoricalOrderAssignmentRecord } from '../types'
import {
  CONSUMABLE_ASSIGNMENT_VALUE,
  type AssignmentTargetOption,
  type AssignmentTargetStore
} from './pageTypes'
import { compactJoin } from '../presentation/orderText'

export function buildAssignmentTargetOptions(
  availableStores: AssignmentTargetStore[] | undefined,
  fallbackStoreCode?: string,
  fallbackSiteCode?: string
): AssignmentTargetOption[] {
  const sourceStores = availableStores?.length
    ? availableStores
    : fallbackStoreCode
      ? [{ storeCode: fallbackStoreCode, projectCode: fallbackStoreCode, site: fallbackSiteCode }]
      : []
  const seen = new Set<string>()
  const options: AssignmentTargetOption[] = [{
    value: CONSUMABLE_ASSIGNMENT_VALUE,
    label: '耗材（共用）',
    targetType: 'CONSUMABLE'
  }]
  sourceStores.forEach((store) => {
    const targetStoreCode = (store.projectCode || store.storeCode || '').trim()
    if (!targetStoreCode) {
      return
    }
    const targetSiteCode = (store.site || '').trim() || undefined
    const value = assignmentTargetValue(targetStoreCode, targetSiteCode)
    if (seen.has(value)) {
      return
    }
    seen.add(value)
    options.push({
      value,
      label: compactJoin([store.projectName || store.projectCode || store.storeCode || targetStoreCode, targetSiteCode], ' '),
      targetType: 'STORE_SITE',
      targetStoreCode,
      targetSiteCode
    })
  })
  return options
}

export function assignmentTargetValue(targetStoreCode: string, targetSiteCode?: string) {
  return targetSiteCode ? `${targetStoreCode}::${targetSiteCode}` : targetStoreCode
}

export function parseAssignmentTargetValue(value: string) {
  if (value === CONSUMABLE_ASSIGNMENT_VALUE) {
    return {
      targetType: 'CONSUMABLE' as const,
      targetStoreCode: '',
      targetSiteCode: undefined
    }
  }
  const [targetStoreCode, targetSiteCode] = value.split('::')
  return {
    targetType: 'STORE_SITE' as const,
    targetStoreCode: targetStoreCode?.trim() || '',
    targetSiteCode: targetSiteCode?.trim() || undefined
  }
}

export function isConsumableTarget(target?: AssignmentTargetOption) {
  return target?.targetType === 'CONSUMABLE'
}

export function isDiscontinuedTarget(target?: AssignmentTargetOption) {
  return target?.targetType === 'DISCONTINUED'
}

export function isStorelessFullLineTarget(target?: AssignmentTargetOption) {
  return isConsumableTarget(target)
}

export function isStorelessFullLineTargetValue(value: string) {
  return value === CONSUMABLE_ASSIGNMENT_VALUE
}

export function assignmentTargetDescription(target?: AssignmentTargetOption) {
  if (isDiscontinuedTarget(target)) {
    return '已下架商品'
  }
  return '耗材'
}

export function selectedAssignmentTargets(
  options: AssignmentTargetOption[],
  targetValues: string[]
) {
  const targetValueSet = new Set(targetValues)
  return options.filter((option) => targetValueSet.has(option.value))
}

export function buildAssignmentRecordQuantityState(records: Ali1688HistoricalOrderAssignmentRecord[]) {
  return records.reduce<Record<string, number | null>>((current, record) => {
    if (record.assignmentId && record.status === 'active') {
      current[record.assignmentId] = record.assignedQuantity ?? null
    }
    return current
  }, {})
}

export function assignmentRecordTargetLabel(record: Ali1688HistoricalOrderAssignmentRecord) {
  if (record.targetType === 'CONSUMABLE') {
    return '耗材（共用）'
  }
  if (record.targetType === 'DISCONTINUED') {
    const siteCode = record.targetSiteCode && record.targetSiteCode !== '*'
      ? record.targetSiteCode
      : undefined
    return compactJoin([record.targetStoreCode, siteCode, '已下架商品'], ' · ') || '已下架商品'
  }
  const siteCode = record.targetSiteCode && record.targetSiteCode !== '*'
    ? record.targetSiteCode
    : undefined
  return compactJoin([record.targetStoreCode, siteCode], ' · ') || `分配 ${record.assignmentId || ''}`.trim()
}

export function isStorelessFullLineAssignmentRecord(record: Ali1688HistoricalOrderAssignmentRecord) {
  return isStorelessFullLineAssignmentType(record.targetType)
}

export function isStorelessFullLineAssignmentType(targetType?: string) {
  return targetType === 'CONSUMABLE'
}

export function isProductLinkBlockedAssignmentType(targetType?: string) {
  return isStorelessFullLineAssignmentType(targetType) || targetType === 'DISCONTINUED'
}

export function assignmentRecordStatusText(status?: string) {
  if (status === 'revoked') {
    return '已撤回'
  }
  if (status === 'active') {
    return '有效'
  }
  return status || '未知'
}
