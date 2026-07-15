import {
  buildManualSelectionGroupListingTarget,
  openManualSelectionGroupListingInNewTab
} from './listingNavigation'
import type { ManualSelectionAnalysisProjectView } from './types'

function installWindowSearch(search: string) {
  ;(globalThis as any).window = {
    location: { search }
  }
}

const project: ManualSelectionAnalysisProjectView = {
  projectId: 'project-901',
  groupId: 'group-901',
  groupNo: 'MSG-901',
  projectName: 'iPhone 17 Pro Max 防摔支架基础款',
  projectMaterialCount: 1,
  items: [],
  records: [
    {
      id: 'collection-901',
      collectionNo: 'PSC-901',
      storeCode: 'STR245027-NSA',
      siteCode: 'SA',
      sourceType: 'marketplace-url',
      collectionSource: 'plugin',
      sourcePlatform: 'Noon',
      sourceUrl: 'https://www.noon.com/saudi-en/example/p/',
      pageUrl: 'https://www.noon.com/saudi-en/example/p/',
      sourceTitle: 'For iPhone 17 Pro Max Magnetic Rugged Kickstand Case',
      sourceTitleCn: 'iPhone 17 Pro Max 防摔支架基础款',
      sourceImageUrl: 'https://images.example.test/case.jpg',
      imageUrls: ['https://images.example.test/case.jpg'],
      priceSummary: 'SAR 78.00',
      specHints: [],
      status: 'success',
      statusText: '采集成功',
      collectedAt: '2026-06-29 12:00',
      collectedBy: '插件',
      collectedFieldCount: 12,
      collectedFieldTotal: 15,
      specAttributeCount: 4,
      imageCount: 1
    }
  ]
}

installWindowSearch('?devSession=1&devAccount=xingyao&devStore=STR245027-NSA&devSite=SA&manualSelectionTab=analysis')

const target = buildManualSelectionGroupListingTarget(project)

if (!target.startsWith('/purchase/listing?')) {
  throw new Error(`expected listing route, got ${target}`)
}

const [, searchText] = target.split('?')
const params = new URLSearchParams(searchText)

if (params.get('listingSource') !== 'manual-selection') {
  throw new Error('expected manual-selection listing source')
}

if (params.has('sourceCollectionId')) {
  throw new Error('group listing route must not use one collection as representative source')
}

if (params.get('selectionGroupId') !== 'group-901') {
  throw new Error('expected selection group id in listing source')
}

if (params.get('devAccount') !== 'xingyao' || params.get('devStore') !== 'STR245027-NSA' || params.get('devSite') !== 'SA') {
  throw new Error('expected current workspace dev query to be preserved')
}

if (params.has('manualSelectionTab')) {
  throw new Error('manual selection tab state must not leak into listing route')
}

let openedUrl = ''
let openedTarget = ''
let openedFeatures = ''

const didOpenNewTab = openManualSelectionGroupListingInNewTab(project, (url, target, features) => {
  openedUrl = url
  openedTarget = target || ''
  openedFeatures = features || ''
  return {} as Window
})

if (!didOpenNewTab) {
  throw new Error('expected listing route to open a new tab')
}

if (openedUrl !== target) {
  throw new Error('expected new tab url to match listing target')
}

if (openedTarget !== '_blank') {
  throw new Error(`expected listing route to open _blank, got ${openedTarget}`)
}

if (!openedFeatures.includes('noopener') || !openedFeatures.includes('noreferrer')) {
  throw new Error(`expected safe new tab features, got ${openedFeatures}`)
}
