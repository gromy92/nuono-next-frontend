import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { buildCompetitorCategoryRows } from './profitCompetitorCategoryLinks'

const rows = buildCompetitorCategoryRows([
  {
    id: 'noon-category',
    url: 'https://www.noon.com/saudi-en/mobiles-accessories/c/',
    fetchedSourceHost: 'www.noon.com',
    fetchedTitle: 'Noon category source'
  },
  {
    id: 'explicit-category',
    url: 'https://www.amazon.sa/dp/B0TEST',
    fetchedSourceHost: 'www.amazon.sa',
    fetchedTitle: 'Amazon product',
    fetchedCategoryName: 'Phone Cases',
    fetchedCategoryPath: 'Electronics / Mobiles / Cases',
    fetchedCategoryUrl: 'https://www.amazon.sa/s?rh=n%3A123'
  },
  {
    id: 'plain-product',
    url: 'https://www.noon.com/saudi-en/product/Z123/p/',
    fetchedSourceHost: 'www.noon.com',
    fetchedTitle: 'Plain product'
  }
])

assert.equal(rows.length, 3)
assert.equal(rows[0].categoryUrl, 'https://www.noon.com/saudi-en/mobiles-accessories/c/')
assert.equal(rows[0].categoryPath, 'Noon category source')
assert.equal(rows[1].categoryUrl, 'https://www.amazon.sa/s?rh=n%3A123')
assert.equal(rows[1].categoryPath, 'Electronics / Mobiles / Cases')
assert.equal(rows[2].categoryUrl, '')
assert.equal(rows[2].categoryPath, '暂无类目链接')
assert.equal(rows[2].productUrl, 'https://www.noon.com/saudi-en/product/Z123/p/')

const featureDir = path.resolve('src/features/manual-selection')
const modalSource = fs.readFileSync(
  path.join(featureDir, 'components/ManualSelectionProfitEstimateModal.tsx'),
  'utf8'
)

assert(
  modalSource.includes('查看竞品类目') &&
    modalSource.includes('competitorCategoryRows') &&
    modalSource.includes('competitorCategoryOpen'),
  'profit estimate category selection should expose a competitor category links modal'
)
