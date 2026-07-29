import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import { MANUAL_SELECTION_IMAGE_FALLBACK } from '../constants'
import type { ManualSelectionAnalysisProjectView, ManualSelectionCompetitor } from '../types'
import {
  formatManualSelectionCompleteness,
  formatManualSelectionPriceSummary,
  manualSelectionCollectionSourceLabel,
  manualSelectionImageCandidates,
  manualSelectionStatusText
} from '../utils'

export function ali1688CandidateCount(record: ProductSelectionSourceCollection) {
  return record.ali1688Collection?.candidateCount || record.ali1688Collection?.candidates?.length || 0
}

export function recommendedCandidateCount(record: ProductSelectionSourceCollection) {
  return record.ali1688Collection?.recommendedCount
    ?? (record.ali1688Collection?.candidates || []).filter((candidate) => candidate.level === 'recommended').length
}

export function sourceImageUrl(record: ProductSelectionSourceCollection) {
  return manualSelectionImageCandidates(record)[0] || MANUAL_SELECTION_IMAGE_FALLBACK
}

export function collectionOverviewText(record: ProductSelectionSourceCollection) {
  const priceSummary = formatManualSelectionPriceSummary(record) || '未采集'
  const completeness = formatManualSelectionCompleteness(record).basics.replace('基础信息：', '')
  return `单价 ${priceSummary} 完整度 ${completeness} 平台 ${record.sourcePlatform || '-'} ${manualSelectionCollectionSourceLabel(record)}`
}

export function competitorHost(competitor: ManualSelectionCompetitor) {
  if (competitor.fetchedSourceHost) {
    return competitor.fetchedSourceHost
  }
  if (!competitor.url) {
    return ''
  }
  try {
    return new URL(competitor.url).host
  } catch {
    return ''
  }
}

export function competitorPlatformLabel(competitor: ManualSelectionCompetitor) {
  const host = competitorHost(competitor).toLowerCase()
  if (host.includes('noon')) {
    return 'Noon'
  }
  if (host.includes('amazon')) {
    return 'Amazon'
  }
  return host.replace(/^www\./, '') || '链接'
}

export function competitorPlatformTone(competitor: ManualSelectionCompetitor) {
  const platform = competitorPlatformLabel(competitor).toLowerCase()
  if (platform.includes('noon')) {
    return 'is-noon'
  }
  if (platform.includes('amazon')) {
    return 'is-amazon'
  }
  return 'is-link'
}

export function competitorStatusLabel(status?: ManualSelectionCompetitor['fetchStatus']) {
  if (status === 'success') {
    return ''
  }
  if (status === 'failed') {
    return '失败'
  }
  if (status === 'fetching') {
    return '拉取中'
  }
  return '未拉取'
}

export function competitorStatusTone(status?: ManualSelectionCompetitor['fetchStatus']) {
  if (status === 'success') {
    return 'is-success'
  }
  if (status === 'failed') {
    return 'is-failed'
  }
  if (status === 'fetching') {
    return 'is-fetching'
  }
  return 'is-pending'
}

export function competitorPriceSummary(competitor: ManualSelectionCompetitor) {
  const priceSummary = competitor.fetchedPriceSummary?.trim()
  if (!priceSummary) {
    return '未采集'
  }
  return formatManualSelectionPriceSummary({
    id: competitor.id || '',
    collectionNo: '',
    sourceType: 'marketplace-url',
    sourcePlatform: competitorPlatformLabel(competitor),
    sourceUrl: competitor.url || '',
    pageUrl: competitor.url || '',
    sourceTitle: competitor.fetchedTitle || '',
    sourceImageUrl: '',
    imageUrls: [],
    priceSummary,
    specHints: [],
    status: 'success',
    statusText: '采集成功',
    collectedAt: '',
    collectedBy: '',
    collectedFieldCount: 0,
    imageCount: 0
  } as ProductSelectionSourceCollection) || priceSummary
}

export function competitorCompletenessSummary(competitor: ManualSelectionCompetitor) {
  return competitor.fetchedCompleteness || (competitor.fetchStatus === 'success' ? '已拉取' : '未采集')
}

export function competitorCollectionSourceSummary(competitor: ManualSelectionCompetitor) {
  return competitor.fetchedCollectionSource || '手动链接'
}

export function competitorOverviewText(competitor: ManualSelectionCompetitor) {
  const platform = competitorPlatformLabel(competitor)
  return `单价 ${competitorPriceSummary(competitor)} / 完整度 ${competitorCompletenessSummary(competitor)} / 平台 ${platform} / 来源 ${competitorCollectionSourceSummary(competitor)}`
}

export function projectCompetitorCount(project: ManualSelectionAnalysisProjectView) {
  return project.records.length + (project.competitors?.length || 0)
}

export function projectCollectionStatusRows(project: ManualSelectionAnalysisProjectView) {
  const records = project.records || []
  const statusLabel = collectionStatusSummaryLabel(records)
  return uniqueTexts([
    statusLabel,
    ...records.map(collectionSourceTypeLabel),
    ...records.map(manualSelectionCollectionSourceLabel)
  ].filter(Boolean))
}

export function collectionStatusSummaryLabel(records: ProductSelectionSourceCollection[]) {
  if (records.some((record) => record.status === 'failed')) {
    return '失败'
  }
  if (records.some((record) => record.status === 'running')) {
    return '采集中'
  }
  if (records.length && records.every((record) => record.status === 'success')) {
    return '成功'
  }
  return records[0] ? manualSelectionStatusText(records[0].status) : '未采集'
}

export function collectionSourceTypeLabel(record: ProductSelectionSourceCollection) {
  const normalized = (record.sourceType || '').toLowerCase()
  if (normalized.includes('marketplace') || normalized.includes('url')) {
    return '浏览器'
  }
  if (normalized.includes('plugin') || normalized.includes('extension')) {
    return '插件'
  }
  return record.sourceType || ''
}

export function collectionStatusColor(label: string) {
  if (label === '成功') {
    return 'green'
  }
  if (label === '失败') {
    return 'red'
  }
  if (label === '采集中') {
    return 'processing'
  }
  return 'default'
}

export function uniqueTexts(values: string[]) {
  return values.filter((value, index, list) => value && list.indexOf(value) === index)
}
