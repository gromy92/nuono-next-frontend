import type { ProductCompetitorContentTextItem } from './productCompetitorContentSources'
import {
  normalizeProductTitleKeywordInput,
  parseProductTitleKeywordInputList,
  type ProductTitleSharedKeyword
} from './productCompetitorContentKeywords'
import type { ProductContentKeywordInputRow } from './productContentKeywordEditor'

export function productTitleContainsKeyword(title: string, keyword: string) {
  const titleTokens = normalizedTokens(title)
  const keywordTokens = normalizedTokens(keyword)
  if (!titleTokens.length || !keywordTokens.length || keywordTokens.length > titleTokens.length) {
    return false
  }
  return titleTokens.some((_, startIndex) =>
    keywordTokens.every((token, offset) => titleTokens[startIndex + offset] === token)
  )
}

export function matchingCompetitorsForKeyword(
  productTitle: string,
  keyword: string,
  competitors: ProductCompetitorContentTextItem[]
) {
  if (!productTitleContainsKeyword(productTitle, keyword)) {
    return []
  }
  return competitors.filter((competitor) => productTitleContainsKeyword(competitor.text, keyword))
}

export function matchingCompetitorsForKeywordRow(
  productTitle: string,
  row: ProductContentKeywordInputRow,
  competitors: ProductCompetitorContentTextItem[]
) {
  const matchedByKey = new Map<string, ProductCompetitorContentTextItem>()
  parseProductTitleKeywordInputList(row.value).forEach((keyword) => {
    matchingCompetitorsForKeyword(productTitle, keyword, competitors).forEach((competitor) => {
      matchedByKey.set(competitor.key, competitor)
    })
  })
  return Array.from(matchedByKey.values())
}

export function withAutomaticKeywordCompetitorMatches(
  rows: ProductContentKeywordInputRow[],
  productTitle: string,
  competitors: ProductCompetitorContentTextItem[]
) {
  return rows.map((row) => ({
    ...row,
    competitorSourceKeys: matchingCompetitorsForKeywordRow(productTitle, row, competitors).map((item) => item.key)
  }))
}

export function mergeAiSuggestedKeywordRows(
  rows: ProductContentKeywordInputRow[],
  suggestions: string[]
) {
  const seenKeywords = new Set(
    rows.flatMap((row) => parseProductTitleKeywordInputList(row.value)).map(normalizedKeyword)
  )
  const nextRows = [...rows]
  suggestions.forEach((suggestion, index) => {
    const keyword = normalizeProductTitleKeywordInput(suggestion)
    const key = normalizedKeyword(keyword)
    if (!key || seenKeywords.has(key)) {
      return
    }
    seenKeywords.add(key)
    nextRows.push({
      id: `ai-keyword-${index}-${key}`,
      value: keyword,
      competitorSourceKeys: [],
      automatic: true
    })
  })
  return nextRows
}

export function sharedAiTitleKeywords(
  productTitle: string,
  suggestions: string[],
  competitors: ProductCompetitorContentTextItem[]
): ProductTitleSharedKeyword[] {
  return suggestions.flatMap((suggestion) => {
    const keyword = normalizeProductTitleKeywordInput(suggestion)
    const matchedCompetitors = matchingCompetitorsForKeyword(productTitle, keyword, competitors)
    return matchedCompetitors.length
      ? [{
          key: normalizedKeyword(keyword),
          label: keyword,
          competitorCount: matchedCompetitors.length
        }]
      : []
  })
}

function normalizedTokens(value: string) {
  return normalizeProductTitleKeywordInput(value)
    .normalize('NFKC')
    .toLocaleLowerCase()
    .split(/\s+/u)
    .filter(Boolean)
}

function normalizedKeyword(value: string) {
  return normalizedTokens(value).join(' ')
}
