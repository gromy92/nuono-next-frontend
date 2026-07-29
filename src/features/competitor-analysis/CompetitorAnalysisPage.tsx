import {
  Tabs,
} from 'antd'
import { useState } from 'react'
import type { AuthSession } from '../auth/session'
import { CompetitorDashboardTab } from './CompetitorDashboardTab'
import { CompetitorPriceChangeTab } from './CompetitorPriceChangeTab'
import { CompetitorAnalysisOverlays } from './CompetitorAnalysisOverlays'
import { useCompetitorReport } from './rankReports/useCompetitorReport'
import { useCompetitorMonitoringActions } from './monitoring/useCompetitorMonitoringActions'
import type { HistoryRange } from './productDetail/ProductDetail'
import { useCompetitorCandidateActions } from './productDetail/useCompetitorCandidateActions'
import { useCompetitorKeywordActions } from './productDetail/useCompetitorKeywordActions'
import { CompetitorProductListTab } from './productList/CompetitorProductListTab'
import { productActionKey } from './productList/competitorProductIdentity'
import { DEFAULT_PRODUCT_SORT_BY } from './productList/productListFilters'
import { useCompetitorProductCatalog } from './productList/useCompetitorProductCatalog'
import type {
  CompetitorDashboardDrill,
  CompetitorWatchProduct
} from './types'
import './styles/index.css'

type CompetitorAnalysisPageProps = {
  session: AuthSession
}

type CompetitorAnalysisTabKey = 'dashboard' | 'detail' | 'priceChanges'

export function CompetitorAnalysisPage({ session }: CompetitorAnalysisPageProps) {
  const {
    products, setProducts, selectedProduct, setSelectedProductId,
    listLoading, detailLoading,
    productSearch, setProductSearch, keywordSearch, setKeywordSearch,
    competitorSearch, setCompetitorSearch,
    monitorZeroOnly, setMonitorZeroOnly,
    candidateZeroOnly, setCandidateZeroOnly,
    productSortBy, setProductSortBy,
    productPage, setProductPage, productPageSize, setProductPageSize, productTotal,
    selectedStore, selectedSiteCode, selectedStoreLabel, ownedNoonProductCodes,
    mergeProduct, loadProductDetail, ensureWatchProduct, reloadProductBaselines
  } = useCompetitorProductCatalog(session)
  const [detailOpen, setDetailOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [openActionTooltip, setOpenActionTooltip] = useState<string | null>(null)
  const [historyRange, setHistoryRange] = useState<HistoryRange>('30')
  const [activeTab, setActiveTab] = useState<CompetitorAnalysisTabKey>('dashboard')
  const dashboardStoreCode = selectedStore?.storeCode || ''
  const dashboardSiteCode = selectedSiteCode
  const {
    reportProduct,
    reportOpen,
    setReportOpen,
    reportRankLoading,
    changeRows,
    changeBaselineSummary,
    changeLoading,
    openReport
  } = useCompetitorReport({
    ensureWatchProduct,
    loadProductDetail,
    mergeProduct,
    setSelectedProductId,
    setActionLoading
  })
  const { handleManualRefresh, handleManualMonitoring } =
    useCompetitorMonitoringActions({
      selectedStoreCode: selectedStore?.storeCode,
      selectedSiteCode,
      setProducts,
      loadProductDetail,
      reloadProductBaselines,
      setActionLoading
    })
  const {
    keywordProduct, setKeywordProduct,
    selectedKeywordDetail, setSelectedKeywordDetail,
    keywordModalOpen, setKeywordModalOpen,
    manualModalOpen, setManualModalOpen,
    keywordInput, setKeywordInput, manualInput, setManualInput,
    manualKeywordId, setManualKeywordId,
    openManualModal, openKeywordModal, handleAddKeyword,
    handleKeywordStatusChange, handleKeywordDelete,
    openProductKeywordDetail, handleManualAdd
  } = useCompetitorKeywordActions({
    selectedProduct,
    ensureWatchProduct,
    loadProductDetail,
    mergeProduct,
    setSelectedProductId,
    setActionLoading
  })
  const {
    handleCandidateStatusChange,
    handleCandidateBatchStatusChange
  } = useCompetitorCandidateActions({ mergeProduct, setActionLoading })

  const openDetail = async (product: CompetitorWatchProduct) => {
    setActionLoading(productActionKey('ensure', product))
    const readyProduct = await ensureWatchProduct(product)
    setActionLoading(null)
    if (!readyProduct?.id) {
      return
    }
    setSelectedProductId(readyProduct.id)
    setDetailOpen(true)
    void loadProductDetail(readyProduct.id)
  }



  const resetSearch = () => {
    setProductSearch('')
    setKeywordSearch('')
    setCompetitorSearch('')
    setMonitorZeroOnly(false)
    setCandidateZeroOnly(false)
    setProductSortBy(DEFAULT_PRODUCT_SORT_BY)
    setProductPage(1)
  }


  const handleDashboardDrill = async (drill: CompetitorDashboardDrill) => {
    if (!drill.watchProductId && !drill.productSiteOfferId && !drill.issueType && !drill.changeType && !drill.date) {
      return
    }
    setActiveTab('detail')
    if (drill.watchProductId) {
      setSelectedProductId(drill.watchProductId)
      const row = products.find((product) => product.id === drill.watchProductId)
      if (row) {
        await openDetail(row)
        return
      }
      const detail = await loadProductDetail(drill.watchProductId)
      if (detail) {
        setDetailOpen(true)
      }
      return
    }
    if (drill.productSiteOfferId) {
      const drillPartnerSku = 'partnerSku' in drill && typeof drill.partnerSku === 'string' ? drill.partnerSku : ''
      setProductSearch(drillPartnerSku || drill.productSiteOfferId)
      setProductPage(1)
    }
  }


  return (
    <div className="competitor-analysis-page" data-testid="competitor-analysis-workbench">
      <Tabs
        className="competitor-analysis-main-tabs"
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as CompetitorAnalysisTabKey)}
        items={[
          {
            key: 'dashboard',
            label: '数据看板',
            children: (
              <CompetitorDashboardTab
                storeCode={dashboardStoreCode}
                siteCode={dashboardSiteCode}
                onDrill={(drill) => void handleDashboardDrill(drill)}
              />
            )
          },
          {
            key: 'detail',
            label: '明细维护',
            children: (
              <CompetitorProductListTab
                products={products}
                loading={listLoading}
                page={productPage}
                pageSize={productPageSize}
                total={productTotal}
                productSearch={productSearch}
                keywordSearch={keywordSearch}
                competitorSearch={competitorSearch}
                monitorZeroOnly={monitorZeroOnly}
                candidateZeroOnly={candidateZeroOnly}
                sortBy={productSortBy}
                storeReady={Boolean(selectedStore?.storeCode && selectedSiteCode)}
                actionLoading={actionLoading}
                openActionTooltip={openActionTooltip}
                reportOpen={reportOpen}
                onSearchChange={(field, value) => {
                  if (field === 'productSearch') setProductSearch(value)
                  if (field === 'keywordSearch') setKeywordSearch(value)
                  if (field === 'competitorSearch') setCompetitorSearch(value)
                  setProductPage(1)
                }}
                onFilterChange={(filters) => {
                  setMonitorZeroOnly(filters.monitorZeroOnly)
                  setCandidateZeroOnly(filters.candidateZeroOnly)
                  setProductSortBy(filters.sortBy)
                  setProductPage(1)
                }}
                onReset={resetSearch}
                onManualMonitoring={() => void handleManualMonitoring()}
                onPageChange={(page, pageSize) => {
                  setProductPage(page)
                  setProductPageSize(pageSize)
                }}
                onKeywordEdit={(product) => void openKeywordModal(product)}
                onRefresh={(product) => void handleManualRefresh(product)}
                onManualAdd={(product) => void openManualModal(product)}
                onDetail={(product) => void openDetail(product)}
                onReport={(product) => {
                  setOpenActionTooltip(null)
                  void openReport(product)
                }}
                onReportTooltipChange={setOpenActionTooltip}
              />
            )
          },
          {
            key: 'priceChanges',
            label: '详情变化',
            children: (
              <CompetitorPriceChangeTab
                storeCode={dashboardStoreCode}
                siteCode={dashboardSiteCode}
                onDrill={(drill) => void handleDashboardDrill(drill)}
              />
            )
          }
        ]}
      />

      <CompetitorAnalysisOverlays
        selectedProduct={selectedProduct}
        keywordProduct={keywordProduct}
        selectedKeywordDetail={selectedKeywordDetail}
        reportProduct={reportProduct}
        selectedStoreLabel={selectedStoreLabel}
        ownedNoonProductCodes={ownedNoonProductCodes}
        detailOpen={detailOpen}
        keywordModalOpen={keywordModalOpen}
        manualModalOpen={manualModalOpen}
        reportOpen={reportOpen}
        detailLoading={detailLoading}
        reportRankLoading={reportRankLoading}
        changeLoading={changeLoading}
        actionLoading={actionLoading}
        historyRange={historyRange}
        keywordInput={keywordInput}
        manualInput={manualInput}
        manualKeywordId={manualKeywordId}
        changeRows={changeRows}
        changeBaselineSummary={changeBaselineSummary}
        onDetailClose={() => setDetailOpen(false)}
        onKeywordModalClose={() => {
          setKeywordModalOpen(false)
          setKeywordProduct(undefined)
        }}
        onManualModalClose={() => setManualModalOpen(false)}
        onReportClose={() => setReportOpen(false)}
        onKeywordDetailClose={() => setSelectedKeywordDetail(null)}
        onHistoryRangeChange={setHistoryRange}
        onCandidateStatusChange={(keywordId, candidateId, status) =>
          void handleCandidateStatusChange(keywordId, candidateId, status)
        }
        onCandidateBatchStatusChange={(keywordId, candidateIds, status) =>
          void handleCandidateBatchStatusChange(keywordId, candidateIds, status)
        }
        onManualRefresh={(product) => void handleManualRefresh(product)}
        onManualInputChange={setManualInput}
        onManualKeywordChange={setManualKeywordId}
        onManualAdd={() => void handleManualAdd()}
        onKeywordInputChange={setKeywordInput}
        onAddKeyword={() => void handleAddKeyword()}
        onKeywordStatusChange={(keyword, status) =>
          void handleKeywordStatusChange(keyword, status)
        }
        onKeywordDelete={(keyword) => void handleKeywordDelete(keyword)}
        onKeywordDetailOpen={openProductKeywordDetail}
      />
    </div>
  )
}
