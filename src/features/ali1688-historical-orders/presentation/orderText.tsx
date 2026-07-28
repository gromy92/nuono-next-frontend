import { Tag, Tooltip, Typography } from 'antd'
import type { ReactNode } from 'react'
import type { Ali1688HistoricalOrderItem } from '../types'

const { Text } = Typography

export function parseAssignmentBreakdownTargets(assignmentBreakdownText?: string) {
  return (assignmentBreakdownText || '')
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const tokens = part.split(/\s+/).filter(Boolean)
      if (tokens[0] === '耗材' || tokens[0] === 'CONSUMABLE') {
        return {
          targetType: 'CONSUMABLE' as const,
          targetStoreCode: 'CONSUMABLE',
          targetSiteCode: undefined
        }
      }
      if (tokens[0] === '已下架' || tokens[0] === 'DISCONTINUED') {
        return {
          targetType: 'DISCONTINUED' as const,
          targetStoreCode: 'DISCONTINUED',
          targetSiteCode: undefined
        }
      }
      const discontinuedMarkerIndex = tokens.findIndex((token) => token === '已下架' || token === 'DISCONTINUED')
      if (discontinuedMarkerIndex > 0 && /^\d+(\.\d+)?$/.test(tokens[tokens.length - 1])) {
        return {
          targetType: 'DISCONTINUED' as const,
          targetStoreCode: tokens[0],
          targetSiteCode: discontinuedMarkerIndex > 1 && tokens[1] !== '*' ? tokens[1] : undefined
        }
      }
      if (tokens.length >= 3 && /^\d+(\.\d+)?$/.test(tokens[tokens.length - 1])) {
        return {
          targetType: 'STORE_SITE' as const,
          targetStoreCode: tokens[0],
          targetSiteCode: tokens[1] === '*' ? undefined : tokens[1]
        }
      }
      if (tokens.length >= 2 && /^\d+(\.\d+)?$/.test(tokens[tokens.length - 1])) {
        return {
          targetType: 'STORE_SITE' as const,
          targetStoreCode: tokens[0],
          targetSiteCode: undefined
        }
      }
      return {
        targetType: 'STORE_SITE' as const,
        targetStoreCode: tokens[0] || '',
        targetSiteCode: tokens[1] === '*' ? undefined : tokens[1]
      }
    })
    .filter((entry) => entry.targetStoreCode)
}

export function assignmentSummaryText(item?: Ali1688HistoricalOrderItem) {
  if (!item || item.assignmentStatus === 'quantity_missing') {
    return undefined
  }
  const assigned = item.assignedQuantity ?? 0
  if (item.remainingQuantity !== undefined && item.remainingQuantity !== null) {
    return `已分配 ${assigned} / 剩余 ${item.remainingQuantity}`
  }
  if (item.originalQuantity !== undefined && item.originalQuantity !== null) {
    return `已分配 ${assigned} / 原始 ${item.originalQuantity}`
  }
  return undefined
}

export function assignmentStatusLabel(item: Ali1688HistoricalOrderItem) {
  if (item.assignmentStatusLabel) {
    return item.assignmentStatusLabel
  }
  if (item.assignmentStatus === 'quantity_missing' || item.quantity === null) {
    return '数量未返回'
  }
  if (item.assignmentStatus === 'assigned') {
    return '已分配'
  }
  if (item.assignmentStatus === 'partially_assigned') {
    return '部分分配'
  }
  return '未分配'
}

export function compactJoin(values: Array<string | undefined>, separator: string) {
  return values.filter((value): value is string => Boolean(value?.trim())).join(separator)
}

const missingFieldLabels: Record<string, string> = {
  amount: '金额',
  logistics: '物流',
  supplier: '供应商',
  sku: '规格',
  image: '图片',
  sourceLink: '原始链接'
}

const missingFieldOrder = ['amount', 'logistics', 'supplier', 'sku', 'image', 'sourceLink']

export function renderMissingFields(fields?: string[]) {
  if (!fields?.length) {
    return null
  }
  const labels = [...fields]
    .sort((left, right) => missingFieldOrder.indexOf(left) - missingFieldOrder.indexOf(right))
    .map((field) => missingFieldLabels[field] || field)
  return (
    <Tooltip title={labels.join(' / ')} placement="topLeft">
      <Text type="secondary" className="ali1688-missing-fields">未返回信息</Text>
    </Tooltip>
  )
}

export function orderStatusText(status?: string) {
  const normalized = status?.trim()
  if (!normalized) {
    return '状态未返回'
  }
  const statusMap: Record<string, string> = {
    waitbuyerpay: '等待买家付款',
    waitsellersend: '等待卖家发货',
    waitbuyerreceive: '等待买家收货',
    waitbuyerconfirmgoods: '等待买家确认收货',
    waitlogisticstakein: '等待物流揽收',
    waitselleract: '等待卖家操作',
    success: '交易成功',
    cancel: '交易取消',
    canceled: '交易取消',
    terminate: '交易关闭',
    terminated: '交易关闭'
  }
  return statusMap[normalized.toLowerCase()] || normalized
}

export function syncStatusText(status?: string) {
  if (status === 'success') {
    return '同步成功'
  }
  if (status === 'partial_success') {
    return '部分成功'
  }
  if (status === 'running') {
    return '同步中'
  }
  if (status === 'failed') {
    return '同步失败'
  }
  return '未开始'
}

export function importStatusText(status?: string) {
  if (status === 'committed' || status === 'success') {
    return '导入完成'
  }
  if (status === 'preview_ready') {
    return '预览通过'
  }
  if (status === 'validation_failed') {
    return '校验失败'
  }
  if (status === 'failed') {
    return '导入失败'
  }
  return status || '未知'
}

export function importStatusColor(status?: string) {
  if (status === 'committed' || status === 'success') {
    return 'success'
  }
  if (status === 'validation_failed' || status === 'failed') {
    return 'error'
  }
  if (status === 'preview_ready') {
    return 'processing'
  }
  return 'default'
}
