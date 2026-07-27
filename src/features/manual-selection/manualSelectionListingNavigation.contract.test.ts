import {
  buildManualSelectionGroupListingTarget,
  openManualSelectionGroupListingInNewTab,
  reserveManualSelectionGroupListingTab
} from './listingNavigation'
import { readFileSync } from 'node:fs'
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

const pageSource = readFileSync(new URL('./ManualSelectionPage.tsx', import.meta.url), 'utf8')
if (!/buildManualSelectionGroupListingTarget\(project,\s*props\.storeCode\)/.test(pageSource)) {
  throw new Error('formal manual-selection page must pass its store to the listing target')
}
if (!/openManualSelectionGroupListingInNewTab\(project,\s*props\.storeCode\)/.test(pageSource)) {
  throw new Error('formal manual-selection popup must use the same source store')
}

installWindowSearch('?devSession=1&devAccount=xingyao&devStore=STR245027-NSA&devSite=SA&manualSelectionTab=analysis')

const target = buildManualSelectionGroupListingTarget(project, 'STR-SHELL-NSA')

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

if (params.get('storeCode') !== 'STR245027-NSA') {
  throw new Error('expected source group store in listing source')
}

const fallbackStoreTarget = buildManualSelectionGroupListingTarget({
  ...project,
  records: project.records.map((record) => ({ ...record, storeCode: '' }))
}, 'STR-FALLBACK-NSA')
if (new URLSearchParams(fallbackStoreTarget.split('?')[1]).get('storeCode') !== 'STR-FALLBACK-NSA') {
  throw new Error('expected page store fallback in listing source')
}

const noStoreTarget = buildManualSelectionGroupListingTarget({
  ...project,
  records: project.records.map((record) => ({ ...record, storeCode: '' }))
})
if (new URLSearchParams(noStoreTarget.split('?')[1]).has('storeCode')) {
  throw new Error('listing source must not carry an empty storeCode')
}

if (params.get('devAccount') !== 'xingyao' || params.get('devStore') !== 'STR245027-NSA' || params.get('devSite') !== 'SA') {
  throw new Error('expected current workspace dev query to be preserved')
}

if (params.has('manualSelectionTab')) {
  throw new Error('manual selection tab state must not leak into listing route')
}

installWindowSearch('')
const productionTarget = buildManualSelectionGroupListingTarget(project)
const productionParams = new URLSearchParams(productionTarget.split('?')[1])
if (
  productionParams.get('listingSource') !== 'manual-selection' ||
  productionParams.get('selectionGroupId') !== 'group-901' ||
  productionParams.get('storeCode') !== 'STR245027-NSA' ||
  productionParams.has('devSession')
) {
  throw new Error('normal manual-selection listing entry must not depend on devSession')
}

installWindowSearch('?devSession=1&devAccount=xingyao&devStore=STR245027-NSA&devSite=SA&manualSelectionTab=analysis')
let openedUrl = ''
let openedTarget = ''
let openedFeatures = ''
let openedNavigation = ''

const didOpenNewTab = openManualSelectionGroupListingInNewTab({
  ...project,
  records: project.records.map((record) => ({ ...record, storeCode: '' }))
}, 'STR-FALLBACK-NSA', (url, target, features) => {
  openedUrl = url
  openedTarget = target || ''
  openedFeatures = features || ''
  return {
    opener: {} as Window,
    location: {
      replace: (nextUrl: string) => {
        openedNavigation = nextUrl
      }
    },
    close: () => undefined
  } as unknown as Window
})

if (!didOpenNewTab) {
  throw new Error('expected listing route to open a new tab')
}

if (openedUrl !== fallbackStoreTarget || openedNavigation) {
  throw new Error('expected the normal new tab to open the listing target directly')
}

if (openedTarget !== '_blank') {
  throw new Error(`expected listing route to open _blank, got ${openedTarget}`)
}

if (openedFeatures) {
  throw new Error(`expected a normal new tab without popup features, got ${openedFeatures}`)
}

let reservedUrl = ''
let reservedTarget = ''
let reservedFeatures = ''
let navigatedUrl = ''
let reservedTabClosed = false
const reservation = reserveManualSelectionGroupListingTab({
  ...project,
  records: project.records.map((record) => ({ ...record, storeCode: '' }))
}, 'STR-FALLBACK-NSA', (url, target, features) => {
  reservedUrl = url
  reservedTarget = target || ''
  reservedFeatures = features || ''
  return {
    opener: {} as Window,
    location: {
      replace: (nextUrl: string) => {
        navigatedUrl = nextUrl
      }
    },
    close: () => {
      reservedTabClosed = true
    }
  } as unknown as Window
})

if (!reservation) {
  throw new Error('expected a synchronous listing tab reservation')
}

if (reservedUrl !== 'about:blank' || reservedTarget !== '_blank' || reservedFeatures) {
  throw new Error('expected a synchronous blank normal-tab reservation')
}

if (!reservation.navigate() || navigatedUrl !== fallbackStoreTarget) {
  throw new Error('expected the reserved tab to navigate after source preparation')
}

reservation.close()
if (!reservedTabClosed) {
  throw new Error('expected reserved tab cleanup to be available')
}
