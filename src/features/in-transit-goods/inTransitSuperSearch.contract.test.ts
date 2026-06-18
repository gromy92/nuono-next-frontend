import assert from 'node:assert/strict'
import { buildInTransitSuperSearchUrl } from './api'

const activeUrl = buildInTransitSuperSearchUrl('http://127.0.0.1:9621', {
  keyword: '  PHOMEMO  '
})
assert.equal(activeUrl, '/api/in-transit-goods/super-search?keyword=PHOMEMO')

const historyUrl = buildInTransitSuperSearchUrl('http://127.0.0.1:9621', {
  keyword: 'PAPERSAYSB036',
  includeHistory: true,
  limit: 30,
  projectCode: 'PRJ108065'
})
assert.equal(
  historyUrl,
  '/api/in-transit-goods/super-search?keyword=PAPERSAYSB036&includeHistory=true&limit=30&projectCode=PRJ108065'
)
