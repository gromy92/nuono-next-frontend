import type {
  ManualSelectionAnalysisProjectView,
  ManualSelectionCompetitor,
  ManualSelectionProfitEstimateSeed
} from './types'
import type { ProductSelectionSourceCollection } from '../source-collection/types'

function text(value?: string) {
  return (value || '').trim()
}

function finitePositiveNumber(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

function priceNumberFromSummary(value?: string) {
  const normalized = text(value).replace(/,/g, '')
  const match = normalized.match(/\d+(?:\.\d+)?/)
  if (!match) {
    return undefined
  }
  return finitePositiveNumber(Number(match[0]))
}

function collectionPrice(record: ProductSelectionSourceCollection) {
  if (record.status === 'failed') {
    return undefined
  }
  return priceNumberFromSummary(record.priceSummary)
}

function competitorPrice(competitor: ManualSelectionCompetitor) {
  if (competitor.fetchStatus && competitor.fetchStatus !== 'success') {
    return undefined
  }
  return priceNumberFromSummary(competitor.fetchedPriceSummary)
}

function mostAggressiveCompetitorPrice(project: ManualSelectionAnalysisProjectView) {
  const prices = [
    ...(project.records || []).map(collectionPrice),
    ...(project.competitors || []).map(competitorPrice)
  ].filter((value): value is number => typeof value === 'number')
  if (!prices.length) {
    return undefined
  }
  return Math.min(...prices)
}

export function createManualSelectionProfitEstimateSeed(
  project: ManualSelectionAnalysisProjectView
): ManualSelectionProfitEstimateSeed {
  const firstRecord = project.records?.[0]
  const purchaseUrl = text(project.procurement?.ali1688PurchaseUrl)
  return {
    groupId: text(project.groupId || project.projectId),
    title: text(project.projectName)
      || text(firstRecord?.sourceTitleCn || firstRecord?.selectedText || firstRecord?.sourceTitle),
    categoryHint: (project.records || []).map((record) => [
      record.sourceTitle,
      record.sourceTitleCn,
      record.selectedText,
      record.sourceDescriptionEn,
      record.sourceDescriptionAr,
      ...(record.specHints || [])
    ].filter(Boolean).join(' ')).join('\n'),
    ali1688Url: purchaseUrl,
    salePrice: mostAggressiveCompetitorPrice(project),
    purchasePrice: finitePositiveNumber(project.procurement?.purchasePriceRmb ?? project.procurement?.purchasePrice)
  }
}
