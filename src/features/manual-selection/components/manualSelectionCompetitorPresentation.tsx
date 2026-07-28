import { Typography } from 'antd'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import { MANUAL_SELECTION_IMAGE_FALLBACK } from '../constants'
import type { ManualSelectionCompetitor, ManualSelectionCompetitorFormValues } from '../types'
import {
  containsArabicText,
  formatManualSelectionPriceSummary,
  formatManualSelectionCompleteness,
  manualSelectionCollectionSourceLabel,
  manualSelectionImageCandidates,
  manualSelectionStatusText
} from '../utils'

const { Text } = Typography

export function normalizeCompetitors(values: ManualSelectionCompetitorFormValues): ManualSelectionCompetitor[] {
  return (values.competitors || [])
    .map((item, index) => ({
      id: item.id || `manual-competitor-${Date.now()}-${index}`,
      url: item.url?.trim(),
      note: item.note?.trim(),
      fetchStatus: item.fetchStatus,
      fetchedTitle: item.fetchedTitle,
      fetchedTitleAr: item.fetchedTitleAr,
      fetchedSourceImageUrl: item.fetchedSourceImageUrl,
      fetchedImageUrls: item.fetchedImageUrls || [],
      fetchedDescriptionEn: item.fetchedDescriptionEn,
      fetchedDescriptionAr: item.fetchedDescriptionAr,
      fetchedSellingPointsEn: item.fetchedSellingPointsEn || [],
      fetchedSellingPointsAr: item.fetchedSellingPointsAr || [],
      fetchedSourceHost: item.fetchedSourceHost,
      fetchedPriceSummary: item.fetchedPriceSummary,
      fetchedCategoryName: item.fetchedCategoryName,
      fetchedCategoryPath: item.fetchedCategoryPath,
      fetchedCategoryUrl: item.fetchedCategoryUrl,
      fetchedCategoryLinks: item.fetchedCategoryLinks || [],
      fetchedCompleteness: item.fetchedCompleteness,
      fetchedCollectionSource: item.fetchedCollectionSource,
      fetchedAt: item.fetchedAt,
      fetchMessage: item.fetchMessage
    }))
    .filter((item) => Boolean(item.url))
}

export function fetchStatusColor(status?: ManualSelectionCompetitor['fetchStatus']) {
  if (status === 'success') return 'success'
  if (status === 'failed') return 'error'
  if (status === 'fetching') return 'processing'
  return 'default'
}

export function fetchStatusText(status?: ManualSelectionCompetitor['fetchStatus']) {
  if (status === 'success') return '已拉取'
  if (status === 'failed') return '拉取失败'
  if (status === 'fetching') return '拉取中'
  return '未拉取'
}

export function formatFetchedAt(value?: string) {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

export function competitorStatusCounts(competitors: ManualSelectionCompetitor[]) {
  return {
    total: competitors.length,
    fetched: competitors.filter((competitor) => competitor.fetchStatus === 'success').length,
    fetching: competitors.filter((competitor) => competitor.fetchStatus === 'fetching').length,
    failed: competitors.filter((competitor) => competitor.fetchStatus === 'failed').length
  }
}

export function sourceImageUrl(record: ProductSelectionSourceCollection) {
  return manualSelectionImageCandidates(record)[0] || MANUAL_SELECTION_IMAGE_FALLBACK
}

export function imageCount(record: ProductSelectionSourceCollection) {
  return record.imageCount || record.imageUrls?.length || 0
}

export function collectedDetailRows(record: ProductSelectionSourceCollection) {
  const completeness = formatManualSelectionCompleteness(record)
  const priceSummary = formatManualSelectionPriceSummary(record)
  const sourceTitleArText = record.sourceTitleAr || ''
  const sourceDescriptionArText = record.sourceDescriptionAr || record.selectedTextAr || ''
  const sourceTitleAr = containsArabicText(sourceTitleArText) ? sourceTitleArText : '未采集'
  const sourceDescriptionAr = containsArabicText(sourceDescriptionArText)
    ? sourceDescriptionArText
    : '未采集'
  return [
    { label: '采集编号', value: record.collectionNo },
    { label: '采集来源', value: manualSelectionCollectionSourceLabel(record) },
    { label: '三方渠道', value: record.sourcePlatform },
    { label: '采集单价', value: priceSummary },
    { label: '采集状态', value: manualSelectionStatusText(record.status) },
    { label: '采集时间', value: record.collectedAt },
    { label: '采集人', value: record.collectedBy },
    { label: '基础信息', value: completeness.full },
    { label: '图片', value: `${imageCount(record)} 张` },
    { label: '规格', value: `${record.specAttributeCount ?? record.specHints?.length ?? 0} 条` },
    { label: '英文标题', value: record.sourceTitle },
    { label: '中文标题', value: record.sourceTitleCn || record.selectedText },
    { label: '阿语标题', value: sourceTitleAr },
    { label: '阿语描述', value: sourceDescriptionAr }
  ].filter((item) => item.value)
}

export function basicInfoPopoverContent(record: ProductSelectionSourceCollection) {
  const specHints = (record.specHints || []).filter(Boolean).slice(0, 5)
  const arabicSellingPoints = (record.sourceSellingPointsAr || []).filter(Boolean).slice(0, 5)
  return (
    <div className="manual-selection-basic-info-popover-content">
      <div className="manual-selection-basic-info-detail-grid">
        {collectedDetailRows(record).map((item) => (
          <div key={item.label} className="manual-selection-basic-info-detail-row">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
      {specHints.length ? (
        <div className="manual-selection-basic-info-specs">
          <Text type="secondary">采集规格</Text>
          {specHints.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
      ) : null}
      {arabicSellingPoints.length ? (
        <div className="manual-selection-basic-info-specs" dir="rtl" lang="ar">
          <Text type="secondary">阿语卖点</Text>
          {arabicSellingPoints.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function ali1688CandidateCount(record: ProductSelectionSourceCollection) {
  return record.ali1688Collection?.candidateCount || record.ali1688Collection?.candidates?.length || 0
}

export function recommendedCandidateCount(record: ProductSelectionSourceCollection) {
  return record.ali1688Collection?.recommendedCount
    ?? (record.ali1688Collection?.candidates || []).filter((candidate) => candidate.level === 'recommended').length
}

export function linkCompetitorDetailRows(competitor: ManualSelectionCompetitor) {
  return [
    { label: '状态', value: fetchStatusText(competitor.fetchStatus) },
    { label: '平台', value: competitor.fetchedSourceHost || '-' },
    { label: '单价', value: competitor.fetchedPriceSummary || '未采集' },
    { label: '完整度', value: competitor.fetchedCompleteness || '未采集' },
    { label: '来源', value: competitor.fetchedCollectionSource || '手动链接' },
    { label: '拉取时间', value: formatFetchedAt(competitor.fetchedAt) || '-' },
    { label: '备注', value: competitor.note || '-' },
    { label: '链接', value: competitor.url || '-' }
  ]
}

export function linkCompetitorTitle(competitor: ManualSelectionCompetitor) {
  return competitor.fetchedTitle || competitor.url || '未命名竞品'
}

