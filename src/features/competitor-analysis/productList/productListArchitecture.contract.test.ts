import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import {
  parseProductFilterValues,
  productFilterValues
} from './productListFilters'
import {
  productActionKey,
  productRowKey,
  sameProductLine
} from './competitorProductIdentity'
import type { CompetitorWatchProduct } from '../types'

const product = {
  storeCode: 'STR108065-NSA',
  siteCode: 'SA',
  partnerSku: 'PSKU-1',
  productSiteOfferId: 'offer-1'
} as CompetitorWatchProduct
const sameIdentity = {
  ...product,
  id: 'watch-1'
} as CompetitorWatchProduct

assert.equal(productRowKey(product), 'STR108065-NSA::SA::PSKU-1')
assert.equal(productActionKey('report', product), 'report-STR108065-NSA::SA::PSKU-1')
assert.equal(sameProductLine(product, sameIdentity), true)
assert.deepEqual(
  productFilterValues(true, false, 'recent7dChangeCountDesc'),
  ['monitorZero', 'recent7dChangeCountDesc']
)
assert.deepEqual(
  parseProductFilterValues([
    'monitorZero',
    'candidateZero',
    'monitoredCountAsc'
  ]),
  {
    monitorZeroOnly: true,
    candidateZeroOnly: true,
    sortBy: 'monitoredCountAsc'
  }
)

const pageSource = readFileSync(
  'src/features/competitor-analysis/CompetitorAnalysisPage.tsx',
  'utf8'
)
assert.doesNotMatch(pageSource, /const productColumns\b/)
assert.doesNotMatch(pageSource, /competitor-analysis-search-grid/)
assert.match(pageSource, /<CompetitorProductListTab\b/)
