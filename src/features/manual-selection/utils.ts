import dayjs from 'dayjs'
import type { ProductSelectionSourceCollection } from '../source-collection/types'

export function normalizeManualSelectionKeyword(value?: string) {
  return (value || '').trim().toLowerCase()
}

export function inferManualSelectionPlatform(url?: string) {
  const normalized = normalizeManualSelectionKeyword(url)
  if (normalized.includes('noon.')) {
    return 'Noon'
  }
  if (normalized.includes('amazon.')) {
    return 'Amazon'
  }
  if (normalized.includes('shein.')) {
    return 'SHEIN'
  }
  if (normalized.includes('1688.')) {
    return '1688'
  }
  return '其他'
}

export function supportedManualSelectionPlatform(platform: string) {
  return ['Noon', 'Amazon', 'SHEIN'].includes(platform)
}

export function manualSelectionStatusText(status: string) {
  if (status === 'running') {
    return '采集中'
  }
  if (status === 'failed') {
    return '采集失败'
  }
  return '采集成功'
}

export function manualSelectionCollectionUrl(record: ProductSelectionSourceCollection) {
  return record.pageUrl || record.sourceUrl || ''
}

export function manualSelectionSkuCount(_record: ProductSelectionSourceCollection) {
  return 1
}

export function formatManualSelectionCollectedAt(value?: string) {
  if (!value) {
    return '-'
  }
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : value
}

export function formatManualSelectionCompleteness(record: ProductSelectionSourceCollection) {
  const total = record.collectedFieldTotal || (['Amazon', 'Noon', 'SHEIN'].includes(record.sourcePlatform) ? 15 : 8)
  const specAttributeCount = record.specAttributeCount ?? countStructuredSpecHints(record.specHints)
  return {
    basics: `基础信息：${record.collectedFieldCount || 0}/${total}`,
    other: `其他 ${specAttributeCount}条`,
    full: `基础信息：${record.collectedFieldCount || 0}/${total}　其他 ${specAttributeCount}条`
  }
}

function countStructuredSpecHints(specHints?: string[]) {
  return (specHints || []).filter((item) => item.search(/[:：]/) > 0).length
}
