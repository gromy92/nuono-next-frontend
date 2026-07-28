import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { normalizeProductImageUrl } from '../product-baseline'
import { buildNoonAdvertisingDashboardParams, buildNoonAdvertisingLatestReportWindowParams } from './api'
import type {
  NoonAdvertisingDashboardQuery,
  NoonAdvertisingDashboardView,
  NoonAdvertisingLatestReportWindow,
  NoonAdvertisingLatestReportWindowQuery
} from './types'

const query: NoonAdvertisingDashboardQuery = {
  projectCode: 'PRJ69486',
  storeCode: 'STR69486-NSA',
  siteCode: 'SA',
  dateFrom: '2026-05-26',
  dateTo: '2026-06-25'
}

const params = buildNoonAdvertisingDashboardParams(query)
if (params.get('projectCode') !== 'PRJ69486' || params.get('storeCode') !== 'STR69486-NSA') {
  throw new Error('Noon Ads dashboard params did not preserve project/store scope')
}

const latestWindowQuery: NoonAdvertisingLatestReportWindowQuery = {
  projectCode: 'PRJ69486',
  storeCode: 'STR69486-NSA',
  siteCode: 'SA'
}

const latestWindowParams = buildNoonAdvertisingLatestReportWindowParams(latestWindowQuery)
if (
  latestWindowParams.get('projectCode') !== 'PRJ69486' ||
  latestWindowParams.get('storeCode') !== 'STR69486-NSA' ||
  latestWindowParams.has('dateFrom')
) {
  throw new Error('Noon Ads latest window params should only preserve project/store/site scope')
}

const latestWindow: NoonAdvertisingLatestReportWindow = {
  dataAvailable: true,
  dateFrom: '2026-05-26',
  dateTo: '2026-06-25'
}

if (!latestWindow.dataAvailable || latestWindow.dateTo !== '2026-06-25') {
  throw new Error('Noon Ads latest report window contract should expose the imported date window')
}

const dashboard: NoonAdvertisingDashboardView = {
  adSummary: {
    campaignCount: 148,
    queryCount: 218571,
    views: 0,
    clicks: 0,
    ordersCount: 822,
    assistedOrders: 0,
    atcCount: 0,
    spendAmount: 5006.61,
    adRevenue: 34862.09,
    ctrPercentage: 0,
    roas: 6.96,
    cpc: 0,
    cps: 0,
    cvrPercentage: 0,
    zeroOrderSpendAmount: 4185.29,
    zeroOrderSpendShare: 0.836
  },
  salesSummary: {
    netUnits: 2120,
    revenueShipped: 85828.86,
    adSpendShareOfSales: 0.058332
  },
  campaignRows: [],
  productRows: [
    {
      storeCode: 'STR69486-NSA',
      siteCode: 'SA',
      adSkuCode: 'ZDD-SAMPLE-001',
      partnerSku: 'SGGR001',
      imageUrl: 'https://f.nooncdn.com/p/pzsku/ZDD-SAMPLE-001/45/main.jpg',
      productIdentityKey: 'STR69486-NSA|SA|SGGR001',
      advertisingIdentityKey: 'STR69486-NSA|SA|SGGR001',
      productIdentityResolved: true,
      sku: 'SGGR001',
      campaignCount: 1,
      queryCount: 2,
      views: 800,
      clicks: 40,
      ordersCount: 5,
      assistedOrders: 0,
      atcCount: 12,
      spendAmount: 50,
      adRevenue: 250,
      ctrPercentage: 0.05,
      roas: 5,
      cpc: 1.25,
      cps: 10,
      cvrPercentage: 0.125,
      zeroOrderSpendAmount: 21,
      zeroOrderSpendShare: 0.42
    }
  ],
  productDiagnostics: [
    {
      storeCode: 'STR69486-NSA',
      siteCode: 'SA',
      adSkuCode: 'ZDD-SAMPLE-001',
      partnerSku: 'SGGR001',
      productIdentityKey: 'STR69486-NSA|SA|SGGR001',
      advertisingIdentityKey: 'STR69486-NSA|SA|SGGR001',
      productIdentityResolved: true,
      sku: 'SGGR001',
      campaignCount: 1,
      queryCount: 2,
      diagnosisType: 'STRUCTURE_REVIEW',
      diagnosisLabel: '结构待整理',
      priorityScore: 60,
      coreCampaignCount: 1,
      explorationCampaignCount: 0,
      unclassifiedCampaignCount: 0,
      structureStatus: 'NEEDS_ATTENTION',
      labels: ['缺探索计划', '搜索排名未接入'],
      recommendedActions: ['当前计划用途不清，建议先归类为核心或探索后再判断动作。'],
      planTypeCounts: {
        CORE: 1
      },
      rankDataAvailable: false
    }
  ],
  campaignDiagnostics: [
    {
      campaignCode: 'C_SAMPLE',
      storeCode: 'STR69486-NSA',
      siteCode: 'SA',
      adSkuCode: 'ZDD-SAMPLE-001',
      partnerSku: 'SGGR001',
      productIdentityKey: 'STR69486-NSA|SA|SGGR001',
      advertisingIdentityKey: 'STR69486-NSA|SA|SGGR001',
      productIdentityResolved: true,
      sku: 'SGGR001',
      planType: 'CORE',
      planTypeConfidence: 'RULE',
      planTypeLabel: '核心计划',
      labels: ['核心计划待观察'],
      recommendedActions: ['核心计划样本尚未稳定，建议先观察订单和 ROAS 趋势。']
    }
  ],
  zeroOrderQueries: [],
  winningQueries: [],
  dataStatus: {
    batchCount: 1,
    campaignRowCount: 1,
    queryRowCount: 1,
    earliestReportDate: '2026-05-26',
    latestReportDate: '2026-06-25',
    dataAvailable: true
  }
}

if (!dashboard.dataStatus.dataAvailable) {
  throw new Error('Noon Ads dashboard contract should expose data availability')
}

if (dashboard.productRows[0]?.adSkuCode !== 'ZDD-SAMPLE-001' || dashboard.productRows[0]?.queryCount !== 2) {
  throw new Error('Noon Ads dashboard contract should expose PSKU-level advertising rows')
}

if (
  dashboard.productRows[0]?.partnerSku !== 'SGGR001' ||
  dashboard.productRows[0]?.imageUrl !== 'https://f.nooncdn.com/p/pzsku/ZDD-SAMPLE-001/45/main.jpg' ||
  dashboard.productRows[0]?.productIdentityKey !== 'STR69486-NSA|SA|SGGR001' ||
  dashboard.productRows[0]?.advertisingIdentityKey !== 'STR69486-NSA|SA|SGGR001'
) {
  throw new Error('Noon Ads dashboard contract should expose store/site/partnerSku identity and product image')
}

const normalizedNoonProductImageUrl = normalizeProductImageUrl(
  'https://f.nooncdn.com/eff639f2df2651369082d90705ccc7ca|pzsku/Z763CC536AE30FF658259Z/45/1768543884/5af868d5-4bfa-418b-a671-436dc3e1b9e2'
)
if (
  normalizedNoonProductImageUrl !==
  'https://f.nooncdn.com/p/eff639f2df2651369082d90705ccc7ca%7Cpzsku/Z763CC536AE30FF658259Z/45/1768543884/5af868d5-4bfa-418b-a671-436dc3e1b9e2.jpg'
) {
  throw new Error('Noon Ads product image thumbnails should normalize hashed Noon pzsku image URLs')
}

if (
  dashboard.productDiagnostics[0]?.adSkuCode !== 'ZDD-SAMPLE-001' ||
  dashboard.productDiagnostics[0]?.diagnosisType !== 'STRUCTURE_REVIEW' ||
  dashboard.productDiagnostics[0]?.diagnosisLabel !== '结构待整理' ||
  dashboard.productDiagnostics[0]?.coreCampaignCount !== 1 ||
  dashboard.productDiagnostics[0]?.rankDataAvailable !== false ||
  dashboard.campaignDiagnostics[0]?.planType !== 'CORE' ||
  dashboard.campaignDiagnostics[0]?.planTypeConfidence !== 'RULE' ||
  dashboard.campaignDiagnostics[0]?.planTypeLabel !== '核心计划'
) {
  throw new Error('Noon Ads dashboard contract should expose read-only campaign structure diagnostics')
}
