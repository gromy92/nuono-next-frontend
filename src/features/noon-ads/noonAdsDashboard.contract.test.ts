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

const pageSource = readFileSync(join(process.cwd(), 'src/features/noon-ads/NoonAdvertisingPage.tsx'), 'utf8')
const pageStyles = readFileSync(join(process.cwd(), 'src/features/noon-ads/NoonAdvertisingPage.css'), 'utf8')
if (!pageSource.includes('ProductNavigationList') || !pageSource.includes('noon-ads-product-nav-list')) {
  throw new Error('Noon Ads product detail should use a product navigation list instead of a wide product table')
}
if (
  !pageSource.includes('role="button"') ||
  !pageSource.includes('onKeyDown') ||
  pageSource.includes('<button\n            key={productKey}')
) {
  throw new Error('Noon Ads product navigation item should not nest a product image button inside another button')
}
if (pageSource.includes("title: 'PSKU'") || pageSource.includes('请选择一个 PSKU')) {
  throw new Error('Noon Ads page should not label unresolved advertising SKU values as PSKU')
}
if (!pageSource.includes('ProductImageThumb') || !pageSource.includes('src={product.imageUrl}')) {
  throw new Error('Noon Ads product navigation and detail should display product thumbnails from product imageUrl')
}
if (pageSource.includes('系统PSKU') || pageSource.includes('广告SKU')) {
  throw new Error('Noon Ads product identity cells should not show 系统PSKU / 广告SKU copy')
}
if (pageSource.includes('noon-ads-toolbar') || pageStyles.includes('.noon-ads-toolbar')) {
  throw new Error('Noon Ads page should not render the standalone title card above the tabs')
}
if (
  !pageSource.includes('productSearchText') ||
  !pageSource.includes('productFilter') ||
  !pageSource.includes('filteredProductRows') ||
  !pageSource.includes('noon-ads-product-search') ||
  !pageSource.includes('placeholder="搜索商品 / PSKU / 广告码"')
) {
  throw new Error('Noon Ads product detail tab should provide product search and filter controls above the data')
}
if (
  !pageSource.includes('noon-ads-product-workspace') ||
  !pageSource.includes('noon-ads-product-list-pane') ||
  !pageSource.includes('noon-ads-product-detail-pane') ||
  !pageStyles.includes('grid-template-columns') ||
  !pageStyles.includes('min-width: 1160px') ||
  !pageStyles.includes('.noon-ads-product-detail-pane')
) {
  throw new Error('Noon Ads product detail tab should use a left list and right detail layout')
}
const productWorkspaceStyle = pageStyles.match(/\\.noon-ads-product-workspace\\s*\\{[^}]+\\}/)?.[0] || ''
if (productWorkspaceStyle.includes('grid-template-columns: minmax(0, 1fr)')) {
  throw new Error('Noon Ads product detail layout should not collapse into a vertical list/detail stack')
}
const productWorkspaceIndex = pageSource.indexOf('className="noon-ads-product-workspace"')
const productListPaneIndex = pageSource.indexOf('className="noon-ads-product-list-pane"', productWorkspaceIndex)
const productDetailPaneIndex = pageSource.indexOf('className="noon-ads-product-detail-pane"', productWorkspaceIndex)
if (
  productWorkspaceIndex < 0 ||
  productListPaneIndex < productWorkspaceIndex ||
  productDetailPaneIndex < productListPaneIndex
) {
  throw new Error('Noon Ads product list should render to the left of the selected product detail')
}
if (
  !pageSource.includes('noon-ads-product-dossier') ||
  !pageSource.includes('广告计划结构') ||
  !pageSource.includes('关键词/搜索词明细') ||
  !pageSource.includes('selectedCampaignCode') ||
  !pageSource.includes('campaignDiagnosticsByCode')
) {
  throw new Error('Noon Ads product detail should show a product dossier, Campaign structure, and Campaign-scoped query details')
}
if (pageSource.includes('广告结构体检') || pageSource.includes('ProductStructureCheckup')) {
  throw new Error('Noon Ads product detail should not repeat the overview diagnostic card')
}
if (
  !pageSource.includes('商品诊断结论') ||
  !pageSource.includes('noon-ads-product-diagnosis') ||
  !pageSource.includes('diagnosisFilterOptions') ||
  !pageSource.includes('productDiagnosisTagColor') ||
  !pageSource.includes('priorityScore') ||
  !pageSource.includes('coreCampaignCount') ||
  !pageSource.includes('explorationCampaignCount') ||
  !pageSource.includes('unclassifiedCampaignCount')
) {
  throw new Error('Noon Ads product detail should expose diagnosis-first filtering, sorting, and detail evidence')
}
if (
  !pageSource.includes('imagePreviewUrl') ||
  !pageSource.includes('openProductImagePreview') ||
  !pageSource.includes('onProductImagePreview') ||
  !pageSource.includes('noon-ads-image-preview')
) {
  throw new Error('Noon Ads product images should open a large preview from product detail views')
}
if (!pageSource.includes("key: 'overview'") || !pageSource.includes("label: '总览'")) {
  throw new Error('Noon Ads page should provide a top-level 总览 tab')
}
if (!pageSource.includes("key: 'product-detail'") || !pageSource.includes('商品详情')) {
  throw new Error('Noon Ads page should provide a separate top-level 商品详情 tab')
}
if (pageSource.includes("label: `商品分析 (")) {
  throw new Error('Noon Ads page should not keep 商品分析 as a peer tab beside global campaign/query tabs')
}
if (!pageSource.includes('noon-ads-tab-controls')) {
  throw new Error('Noon Ads date range controls should live inside the active analysis tab')
}
if (pageSource.includes('noon-ads-toolbar-controls')) {
  throw new Error('Noon Ads toolbar should not own the date range controls after tab split')
}
const overviewTabControlsIndex = pageSource.indexOf('<NoonAdvertisingTabControls')
const overviewMetricGridIndex = pageSource.indexOf('className="noon-ads-metric-grid"')
if (
  overviewTabControlsIndex < 0 ||
  overviewMetricGridIndex < 0 ||
  overviewTabControlsIndex > overviewMetricGridIndex
) {
  throw new Error('Noon Ads overview tab should show date range controls directly under the tab and above metrics')
}
const productDetailTabIndex = pageSource.indexOf("key: 'product-detail'")
const productDetailTabControlsIndex = pageSource.indexOf('<NoonAdvertisingTabControls', productDetailTabIndex)
const productAnalysisIndex = pageSource.indexOf('className="noon-ads-product-analysis"', productDetailTabIndex)
if (
  productDetailTabIndex < 0 ||
  productDetailTabControlsIndex < 0 ||
  productAnalysisIndex < 0 ||
  productDetailTabControlsIndex > productAnalysisIndex
) {
  throw new Error('Noon Ads product detail tab should show date range controls directly under the tab and above data')
}
if (
  !pageSource.includes('DownloadOutlined') ||
  !pageSource.includes('downloadNoonAdsRowsAsExcel') ||
  !pageSource.includes('onExportCampaignRows') ||
  !pageSource.includes('onExportQueryRows') ||
  !pageSource.includes('导出')
) {
  throw new Error('Noon Ads workbench should provide in-page Excel-compatible exports for campaign and query tables')
}
if (
  !pageSource.includes("onSelectCampaign(null)") ||
  !pageSource.includes('全部广告计划') ||
  pageSource.includes('return selectedProductCampaignRows[0]?.campaignCode || null')
) {
  throw new Error('Noon Ads product detail should default to all campaigns and allow resetting campaign-scoped query tables')
}
