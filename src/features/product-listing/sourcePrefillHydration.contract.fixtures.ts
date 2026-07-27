import type {
  ManualSelectionGroupProfitEstimateSnapshot,
  ManualSelectionGroupView
} from '../manual-selection/types'
import type { ProductSelectionSourceCollection } from '../source-collection/types'

function sourceRecord(id: string): ProductSelectionSourceCollection {
  return {
    id,
    collectionNo: `PSC-${id}`,
    storeCode: 'STR245027-NSA',
    siteCode: 'SA',
    sourceType: 'marketplace-url',
    collectionSource: 'plugin',
    sourcePlatform: 'Noon',
    sourceUrl: `https://www.noon.com/saudi-en/source-${id}/p/`,
    pageUrl: `https://www.noon.com/saudi-en/source-${id}/p/`,
    sourceTitle: `Rugged phone case ${id}`,
    sourceTitleCn: `防摔手机壳 ${id}`,
    sourceTitleAr: `Arabic title ${id}`,
    sourceDescriptionEn: `English description ${id}`,
    sourceDescriptionAr: `Arabic description ${id}`,
    sourceSellingPointsEn: [`English selling point ${id}`],
    sourceSellingPointsAr: [`Arabic selling point ${id}`],
    sourceImageUrl: `https://images.example.test/${id}.jpg`,
    imageUrls: [`https://images.example.test/${id}-detail.jpg`],
    priceSummary: 'SAR 78.00',
    specHints: [],
    categoryName: 'Phone Cases',
    categoryPath: 'Electronics > Mobiles > Phone Cases',
    categoryUrl: 'https://www.noon.com/saudi-en/electronics/mobiles/phone-cases/',
    categoryLinks: [
      {
        name: 'Phone Cases',
        path: 'Electronics > Mobiles > Phone Cases',
        url: 'https://www.noon.com/saudi-en/electronics/mobiles/phone-cases/'
      }
    ],
    status: 'success',
    statusText: '采集成功',
    collectedAt: '2026-07-06 10:00:00',
    collectedBy: '插件',
    collectedFieldCount: 10,
    imageCount: 2
  }
}

export const manualSelectionGroup: ManualSelectionGroupView = {
  groupId: '91001',
  groupNo: 'PSG-91001',
  groupName: '防摔手机壳组合',
  siteCode: 'SA',
  status: 'active',
  materialCount: 1,
  materials: [
    {
      materialId: '92001',
      groupId: '91001',
      sourceCollectionId: '86001',
      status: 'active',
      sourceCollection: sourceRecord('86001')
    }
  ],
  procurement: {
    ali1688PurchaseUrl: 'https://detail.1688.com/offer/1001.html',
    purchasePriceRmb: 18.5,
    purchasePrice: 18.5,
    status: 'active'
  },
  competitors: [
    {
      id: '93001',
      url: 'https://www.noon.com/saudi-en/competitor/p/',
      fetchStatus: 'success',
      fetchedTitle: 'Competitor case title',
      fetchedDescriptionEn: 'Competitor English description',
      fetchedSellingPointsEn: ['Competitor selling point'],
      fetchedSourceHost: 'noon',
      fetchedCategoryName: 'Phone Cases',
      fetchedCategoryPath: 'Electronics / Mobiles / Cases',
      fetchedCategoryUrl: 'https://www.noon.com/saudi-en/mobiles-accessories/c/',
      fetchedAt: '2026-07-06 10:10:00'
    }
  ]
}

export const manualSelectionProfitEstimate: ManualSelectionGroupProfitEstimateSnapshot = {
  groupId: '91001',
  status: 'saved',
  snapshot: {
    selectedCategory: {
      value: 'electronic_accessories-mobile_accessories-phone_cases',
      label: 'Phone cases'
    }
  }
}

export const displayOnlyProfitEstimate: ManualSelectionGroupProfitEstimateSnapshot = {
  groupId: '91001',
  status: 'saved',
  snapshot: {
    selectedCategory: {
      value: 'Kitchen Utensils & Gadgets',
      label: 'Kitchen Utensils & Gadgets'
    }
  }
}
