import type { CompetitorDashboardAttributeChangeItem } from './types'

type ProductPriceChangeSummary = {
  previousValue: string
  currentValue: string
  currentDate?: string
  latestValue?: string
  missingSnapshot?: boolean
}

export type PriceChangeDisplaySide = {
  eyebrow: string
  code: string
  codeHref?: string
  underImageLines: string[]
  primaryLine: string
  lines: string[]
  lineHrefs?: Array<string | undefined>
}

export type PriceChangeDisplayModel = {
  self: PriceChangeDisplaySide
  competitor: PriceChangeDisplaySide
}

export function splitAttributeChangeItems(items: CompetitorDashboardAttributeChangeItem[]) {
  const priceItems = items.filter((item) => item.changeType === 'PRICE')
  return {
    priceItems: sortPriorityPriceChanges(priceItems),
    titleItems: items.filter((item) => item.changeType === 'TITLE')
  }
}

function sortPriorityPriceChanges(items: CompetitorDashboardAttributeChangeItem[]) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const leftPriority = isPriorityPriceChange(left.item) ? 1 : 0
      const rightPriority = isPriorityPriceChange(right.item) ? 1 : 0
      return rightPriority - leftPriority || left.index - right.index
    })
    .map(({ item }) => item)
}

export function isPriorityPriceChange(item: CompetitorDashboardAttributeChangeItem) {
  if (item.changeType !== 'PRICE') return false
  return competitorPriceLowerThanSelf(item) || competitorRankHigherThanSelf(item)
}

function competitorPriceLowerThanSelf(item: CompetitorDashboardAttributeChangeItem) {
  const competitorPrice = numericPrice(item.currentValue)
  const selfPrice = currentSelfPriceNumber(item)
  return competitorPrice !== undefined && selfPrice !== undefined && competitorPrice < selfPrice
}

function currentSelfPriceNumber(item: CompetitorDashboardAttributeChangeItem) {
  const priceChange = selfPriceChangeSummary(item)
  if (!priceChange || priceChange.missingSnapshot) return undefined
  return numericPrice(priceChange.currentValue || priceChange.latestValue || '')
}

function competitorRankHigherThanSelf(item: CompetitorDashboardAttributeChangeItem) {
  if (!item.latestRankNo) return false
  if (item.selfLatestRankStatus !== 'ranked' || !item.selfLatestRankNo) return true
  return item.latestRankNo < item.selfLatestRankNo
}

export function buildAttributeChangeDisplayModel(
  item: CompetitorDashboardAttributeChangeItem,
  siteCode = 'SA'
): PriceChangeDisplayModel {
  const selfPrice = selfPriceChangeSummary(item)
  const selfCurrentPrice = currentSelfPriceText(selfPrice)
  const selfKeyword = item.selfLatestRankKeyword || item.latestRankKeyword || '暂无关键词'
  const selfKeywordHref = selfKeyword === '暂无关键词' ? undefined : buildNoonSearchUrl(selfKeyword, siteCode)
  const competitorChange = competitorChangeSummary(item)
  return {
    self: {
      eyebrow: '我的商品',
      code: item.partnerSku || '-',
      underImageLines: [selfRankText(item)],
      primaryLine: `当前价格：${selfCurrentPrice}`,
      lines: [`价格变化：${selfPriceChangeValueText(selfPrice)}`, `关键词：${selfKeyword}`],
      lineHrefs: [undefined, selfKeywordHref]
    },
    competitor: {
      eyebrow: '竞品',
      code: item.noonProductCode || '-',
      codeHref: buildNoonProductSearchUrl(item.noonProductCode, siteCode),
      underImageLines: [rankImageText(item.latestRankNo)],
      primaryLine: competitorChange.primaryLine,
      lines: competitorChange.lines
    }
  }
}

export const buildPriceChangeDisplayModel = buildAttributeChangeDisplayModel

export function attributeChangeTag(item: CompetitorDashboardAttributeChangeItem) {
  if (item.changeType === 'TITLE') return undefined
  const direction = priceChangeDirection(item)
  if (direction === 'DOWN') return { color: 'red', text: '降价' }
  if (direction === 'UP') return { color: 'green', text: '涨价' }
  return { color: 'default', text: '价格' }
}

export function formatDashboardDate(date?: string) {
  if (!date) return ''
  return date.length >= 10 ? date.slice(5, 10) : date
}

function buildNoonProductSearchUrl(productCode: string, siteCode = 'SA') {
  const code = normalizeNoonProductCode(productCode)
  return code ? buildNoonSearchUrl(code, siteCode) : undefined
}

function buildNoonSearchUrl(query: string, siteCode = 'SA') {
  const normalizedQuery = query.trim()
  return normalizedQuery
    ? `https://www.noon.com/${noonMarketPath(siteCode)}/search/?q=${encodeURIComponent(normalizedQuery)}`
    : undefined
}

function noonMarketPath(siteCode: string) {
  const normalized = siteCode.trim().toUpperCase()
  if (normalized === 'SA' || normalized === 'KSA') return 'saudi-en'
  if (normalized === 'EG') return 'egypt-en'
  return 'uae-en'
}

function normalizeNoonProductCode(value?: string) {
  return (value || '').trim().toUpperCase()
}

function selfPriceChangeSummary(item: CompetitorDashboardAttributeChangeItem): ProductPriceChangeSummary | undefined {
  if (!item.selfPreviousValue && !item.selfCurrentValue) {
    if (item.selfLatestValue || item.selfSnapshotCount > 0) {
      return {
        previousValue: '',
        currentValue: '',
        currentDate: formatFullDate(item.selfLatestDate),
        latestValue: formatPriceValue(item.selfLatestValue || '')
      }
    }
    return { previousValue: '', currentValue: '', missingSnapshot: true }
  }
  return {
    previousValue: formatPriceValue(item.selfPreviousValue || ''),
    currentValue: formatPriceValue(item.selfCurrentValue || ''),
    currentDate: formatFullDate(item.selfCurrentDate)
  }
}

function selfPriceChangeValueText(priceChange?: ProductPriceChangeSummary) {
  if (!priceChange || priceChange.missingSnapshot) return '未抓取'
  if (!priceChange.previousValue && !priceChange.currentValue) {
    return `最近无变化${priceChange.currentDate ? ` · ${priceChange.currentDate}` : ''}`
  }
  return `${priceChange.previousValue} -> ${priceChange.currentValue}${priceChange.currentDate ? ` · ${priceChange.currentDate}` : ''}`
}

function currentSelfPriceText(priceChange?: ProductPriceChangeSummary) {
  if (!priceChange || priceChange.missingSnapshot) return '未抓取'
  return priceChange.currentValue || priceChange.latestValue || '-'
}

function selfRankText(item: CompetitorDashboardAttributeChangeItem) {
  if (item.selfLatestRankStatus === 'ranked' && item.selfLatestRankNo) return `第 ${item.selfLatestRankNo} 名`
  if (item.selfLatestRankStatus === 'not_in_scan_depth') return `未进前${item.selfLatestScanDepth || 200}`
  if (item.selfLatestRankStatus === 'not_in_top_20') return '未进前20'
  return '暂无排名'
}

function rankImageText(rankNo?: number) {
  return rankNo ? `第 ${rankNo} 名` : '未进榜'
}

function competitorChangeSummary(item: CompetitorDashboardAttributeChangeItem) {
  const dateLine = `日期：${formatFullDate(item.currentDate) || '日期未知'}`
  const rankLine = `排名变化：${rankShortText(item.changeDateRankNo)} -> ${rankShortText(item.latestRankNo)}`
  if (item.changeType === 'TITLE') {
    return {
      primaryLine: '标题变化',
      lines: [
        rankLine,
        `原标题：${formatPriceValue(item.previousValue)}`,
        `新标题：${formatPriceValue(item.currentValue)}`,
        dateLine
      ]
    }
  }
  return {
    primaryLine: `价格变化：${formatPriceValue(item.previousValue)} -> ${formatPriceValue(item.currentValue)}`,
    lines: [rankLine, dateLine]
  }
}

function rankShortText(rankNo?: number) {
  return rankNo ? `#${rankNo}` : '未进榜'
}

function priceChangeDirection(item: CompetitorDashboardAttributeChangeItem) {
  const previous = numericPrice(item.previousValue)
  const current = numericPrice(item.currentValue)
  if (previous === undefined || current === undefined) return 'ALL'
  if (current < previous) return 'DOWN'
  if (current > previous) return 'UP'
  return 'ALL'
}

function numericPrice(value: string) {
  const match = String(value || '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)
  if (!match) return undefined
  const numericValue = Number(match[0])
  return Number.isFinite(numericValue) ? numericValue : undefined
}

function formatPriceValue(value: string) {
  const text = String(value || '').trim()
  if (!text) return '-'
  return text.replace(/^"|"$/g, '') || '-'
}

function formatFullDate(date?: string) {
  return date && date.length >= 10 ? date.slice(0, 10) : date
}
