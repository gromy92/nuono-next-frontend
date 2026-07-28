import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const readFeatureFile = (fileName: string) => readFileSync(
  join(process.cwd(), 'src/features/noon-ads', fileName),
  'utf8'
)
const pageSource = [
  'NoonAdvertisingPage.tsx', 'components/NoonAdvertisingWorkbench.tsx',
  'components/ProductNavigationList.tsx', 'components/ProductAnalysisDetail.tsx',
  'components/AdviceGroups.tsx', 'components/NoonAdsControls.tsx',
  'hooks/useNoonAdvertisingDashboard.ts',
  'presentation/formatters.tsx'
].map(readFeatureFile).join('\n')
const pageStyles = [
  'NoonAdvertisingPage.css', 'styles/dashboard.css',
  'styles/product-analysis.css', 'styles/responsive.css'
].map(readFeatureFile).join('\n')
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
