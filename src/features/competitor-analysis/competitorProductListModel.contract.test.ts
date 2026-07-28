import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { buildNoonSearchUrl, noonMarketPath } from './competitorNoonLinks'
import {
  mergeProductTitleFields,
  normalizeProductKeywordNorm,
  productListIdentityCodes,
  productTitleLines
} from './competitorProductListModel'
import { loadReportRankHistory } from './competitorRankHistory'
import type { CompetitorWatchProduct } from './types'

const product = {
  id: 'watch-1',
  storeCode: 'STORE',
  siteCode: 'SA',
  partnerSku: 'PSKU-1',
  selfNoonProductCode: 'ZSELF001',
  title: 'English title',
  titleCn: '中文标题',
  keywords: [
    { id: 'keyword-1', keyword: 'phone case', status: 'active', displayOrder: 1 }
  ],
  rankPoints: [
    {
      id: 'rank-1',
      keywordId: 'keyword-1',
      noonProductCode: 'ZSELF001',
      factDate: '2026-07-27',
      rankNo: 9,
      rankStatus: 'ranked',
      isSelf: true,
      isConfirmedCompetitor: false,
      isSponsored: false
    }
  ]
} as CompetitorWatchProduct

assert.equal(normalizeProductKeywordNorm('  Phone   Case '), 'phone case')
assert.deepEqual(productTitleLines(product), {
  primary: '中文标题',
  secondary: 'English title',
  alt: '中文标题'
})
assert.deepEqual(productListIdentityCodes(product), [
  { value: 'PSKU-1', copyText: 'PSKU-1' },
  { value: 'ZSELF001', copyText: 'ZSELF001' }
])
assert.equal(
  mergeProductTitleFields(product, { ...product, title: '', titleCn: '' }).titleCn,
  '中文标题'
)

assert.equal(noonMarketPath('SA'), 'saudi-en')
assert.equal(noonMarketPath('EG'), 'egypt-en')
assert.equal(noonMarketPath('AE'), 'uae-en')
assert.equal(
  buildNoonSearchUrl('phone case', 'SA', 'watch-1', '123'),
  'https://www.noon.com/saudi-en/search/?q=phone%20case#nuonoWatchProductId=watch-1&nuonoKeywordId=123&nuonoKeyword=phone+case'
)

const calls: Array<{ productId: string; rangeDays?: number }> = []
const loaded = await loadReportRankHistory(product, 15, async (productId, query) => {
  calls.push({ productId, rangeDays: query.rangeDays })
  return [
    {
      id: 'rank-2',
      keywordId: 'keyword-1',
      noonProductCode: 'zself001',
      factDate: '2026-07-27',
      rankNo: 7,
      rankStatus: 'ranked',
      isSelf: true,
      isConfirmedCompetitor: false,
      isSponsored: false
    },
    {
      id: 'rank-3',
      keywordId: 'keyword-1',
      noonProductCode: 'ZSELF001',
      factDate: '2026-07-28',
      rankNo: 6,
      rankStatus: 'ranked',
      isSelf: true,
      isConfirmedCompetitor: false,
      isSponsored: false
    }
  ]
})
assert.deepEqual(calls, [{ productId: 'watch-1', rangeDays: 15 }])
assert.equal(loaded.failedCount, 0)
assert.deepEqual(loaded.product.rankPoints.map((point) => point.rankNo), [7, 6])

const pageSource = readFileSync(
  'src/features/competitor-analysis/CompetitorAnalysisPage.tsx',
  'utf8'
)
assert.doesNotMatch(
  pageSource,
  /function (?:ProductKeywordLinks|ProductTitleStack|loadReportRankHistory|buildNoonSearchUrl)\b/
)
