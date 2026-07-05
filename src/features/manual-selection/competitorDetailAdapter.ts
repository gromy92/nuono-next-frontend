import type { ProductSelectionSourceCollection } from '../source-collection/types'
import type { ManualSelectionAnalysisProjectView, ManualSelectionCompetitor } from './types'

function sourceHostFromUrl(url?: string) {
  if (!url) {
    return ''
  }
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function collectionFromLinkCompetitor(
  project: ManualSelectionAnalysisProjectView,
  competitor: ManualSelectionCompetitor,
  index: number
): ProductSelectionSourceCollection {
  const representative = project.records[0]
  const imageUrls = Array.from(new Set([
    competitor.fetchedSourceImageUrl,
    ...(competitor.fetchedImageUrls || [])
  ].filter((url): url is string => Boolean(url?.trim()))))
  const sourceHost = competitor.fetchedSourceHost || sourceHostFromUrl(competitor.url)
  const sourcePlatform = sourceHost.toLowerCase().includes('amazon')
    ? 'Amazon'
    : sourceHost.toLowerCase().includes('noon')
      ? 'Noon'
      : sourceHost || '链接竞品'
  return {
    id: competitor.id || `competitor-${index}`,
    collectionNo: competitor.id || `竞品-${index + 1}`,
    storeId: representative?.storeId,
    storeName: representative?.storeName,
    storeCode: representative?.storeCode,
    siteCode: representative?.siteCode,
    sourceType: 'marketplace-url',
    collectionSource: competitor.fetchedCollectionSource === '系统采集' ? 'browser' : 'plugin',
    sourcePlatform,
    sourceUrl: competitor.url,
    pageUrl: competitor.url,
    sourceTitle: competitor.fetchedTitle || competitor.url || '未命名竞品',
    sourceTitleCn: '',
    sourceTitleAr: competitor.fetchedTitleAr || '',
    sourceImageUrl: imageUrls[0] || '',
    imageUrls,
    priceSummary: competitor.fetchedPriceSummary || '',
    specHints: [],
    sourceDescriptionEn: competitor.fetchedDescriptionEn || '',
    sourceDescriptionAr: competitor.fetchedDescriptionAr || '',
    sourceSellingPointsEn: competitor.fetchedSellingPointsEn || [],
    sourceSellingPointsAr: competitor.fetchedSellingPointsAr || [],
    selectedText: competitor.note || '',
    selectedTextAr: '',
    notes: competitor.fetchMessage || competitor.note || '',
    status: competitor.fetchStatus === 'failed' ? 'failed' : 'success',
    statusText: competitor.fetchStatus === 'failed' ? '拉取失败' : '采集成功',
    failureMessage: competitor.fetchStatus === 'failed' ? competitor.fetchMessage : undefined,
    collectedAt: competitor.fetchedAt || '',
    collectedBy: competitor.fetchedCollectionSource || '系统采集',
    collectedFieldCount: Number(competitor.fetchedCompleteness?.split('/')[0]) || 0,
    collectedFieldTotal: Number(competitor.fetchedCompleteness?.split('/')[1]) || undefined,
    imageCount: imageUrls.length
  }
}
