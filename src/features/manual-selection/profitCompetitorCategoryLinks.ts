import type { ManualSelectionCompetitor } from './types'

export type CompetitorCategoryRow = {
  rowKey: string
  competitorLabel: string
  sourceHost: string
  categoryPath: string
  categoryUrl: string
  productUrl: string
}

function text(value?: string) {
  return (value || '').trim()
}

function sourceHostFromUrl(value?: string) {
  try {
    return new URL(text(value)).host
  } catch {
    return ''
  }
}

function isCategoryLikeUrl(value?: string) {
  const normalized = text(value).toLowerCase()
  if (!normalized) {
    return false
  }
  return (
    normalized.includes('/c/') ||
    normalized.includes('/category') ||
    normalized.includes('/categories') ||
    normalized.includes('/search') ||
    normalized.includes('/s?') ||
    normalized.includes('?rh=') ||
    normalized.includes('&rh=')
  )
}

function competitorLabel(competitor: ManualSelectionCompetitor, index: number) {
  return text(competitor.fetchedTitle) || text(competitor.note) || text(competitor.url) || `竞品 ${index + 1}`
}

export function buildCompetitorCategoryRows(competitors: ManualSelectionCompetitor[] = []): CompetitorCategoryRow[] {
  return competitors.flatMap((competitor, competitorIndex) => {
    const sourceHost = text(competitor.fetchedSourceHost) || sourceHostFromUrl(competitor.url)
    const productUrl = text(competitor.url)
    const label = competitorLabel(competitor, competitorIndex)
    const explicitLinks = competitor.fetchedCategoryLinks?.filter((item) => text(item.url) || text(item.path) || text(item.name)) || []

    if (explicitLinks.length) {
      return explicitLinks.map((item, linkIndex) => ({
        rowKey: `${competitor.id || competitorIndex}-${linkIndex}`,
        competitorLabel: label,
        sourceHost,
        categoryPath: text(item.path) || text(item.name) || '未命名类目',
        categoryUrl: text(item.url),
        productUrl
      }))
    }

    const categoryUrl = text(competitor.fetchedCategoryUrl) || (isCategoryLikeUrl(productUrl) ? productUrl : '')
    const categoryPath = text(competitor.fetchedCategoryPath) || text(competitor.fetchedCategoryName) || (categoryUrl ? label : '暂无类目链接')

    return [{
      rowKey: competitor.id || String(competitorIndex),
      competitorLabel: label,
      sourceHost,
      categoryPath,
      categoryUrl,
      productUrl
    }]
  })
}
