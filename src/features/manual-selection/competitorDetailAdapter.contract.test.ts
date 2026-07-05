import assert from 'node:assert/strict'
import { collectionFromLinkCompetitor } from './competitorDetailAdapter'
import type { ManualSelectionAnalysisProjectView } from './types'

const project: ManualSelectionAnalysisProjectView = {
  projectId: '91011',
  projectName: '红色手机壳',
  projectMaterialCount: 1,
  records: [
    {
      id: 'material-red',
      collectionNo: 'PSC-red',
      sourceType: 'marketplace-url',
      sourcePlatform: 'Temu',
      sourceUrl: 'https://example.com/red',
      pageUrl: 'https://example.com/red',
      sourceTitle: 'Red material',
      sourceImageUrl: 'https://example.com/red-main.jpg',
      imageUrls: ['https://example.com/red-extra.jpg'],
      priceSummary: '',
      specHints: [],
      status: 'success',
      statusText: '采集成功',
      collectedAt: '',
      collectedBy: '',
      collectedFieldCount: 1,
      imageCount: 2
    }
  ],
  items: [],
  competitors: []
}

const detailRecord = collectionFromLinkCompetitor(project, {
  id: 'competitor-blue',
  url: 'https://www.noon.com/saudi-en/blue-case/p/',
  fetchStatus: 'success',
  fetchedSourceImageUrl: 'https://example.com/blue-main.jpg',
  fetchedImageUrls: ['https://example.com/blue-main.jpg', 'https://example.com/blue-extra.jpg'],
  fetchedSourceHost: 'noon.com',
  fetchedTitle: 'Blue competitor'
}, 0)

assert.equal(detailRecord.sourceImageUrl, 'https://example.com/blue-main.jpg')
assert.deepEqual(detailRecord.imageUrls, [
  'https://example.com/blue-main.jpg',
  'https://example.com/blue-extra.jpg'
])
assert(!detailRecord.imageUrls.includes('https://example.com/red-main.jpg'))
assert(!detailRecord.imageUrls.includes('https://example.com/red-extra.jpg'))
