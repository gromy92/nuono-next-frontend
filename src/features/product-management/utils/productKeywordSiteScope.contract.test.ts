import { strict as assert } from 'node:assert'

import {
  productKeywordSiteCodeFromScope,
  siteCodeFromStoreCode
} from './productKeywordSiteScope'

assert.equal(siteCodeFromStoreCode('STR108065-NSA'), 'SA')
assert.equal(siteCodeFromStoreCode('STR108065-NAE'), 'AE')
assert.equal(siteCodeFromStoreCode('STR108065-NEG'), 'EG')

assert.equal(
  productKeywordSiteCodeFromScope({
    storeCode: 'STR108065-NSA',
    siteLabels: ['AE', 'SA']
  }),
  'SA',
  'keyword history/list site scope should prefer current store site over aggregated siteLabels'
)

assert.equal(
  productKeywordSiteCodeFromScope({
    storeCode: '',
    siteLabels: ['AE', 'SA']
  }),
  'AE',
  'aggregated siteLabels are only a fallback when current store site is unavailable'
)
