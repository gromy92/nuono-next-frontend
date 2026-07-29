import { Drawer, Modal, Spin } from 'antd'
import { ProductKeywordDetailDrawer, type ProductKeywordDetailKeyword } from '../product-keywords/ProductKeywordDetailDrawer'
import {
  KeywordMaintenancePanel,
  ManualCompetitorPanel
} from './productDetail/ProductMaintenancePanels'
import {
  ProductDetail,
  type HistoryRange
} from './productDetail/ProductDetail'
import { SelfRankReportModal } from './rankReports/SelfRankReportModal'
import type {
  CompetitorKeyword,
  CompetitorProductChangeBaselineSummary,
  CompetitorProductChangeGroup,
  CompetitorWatchProduct
} from './types'

export function CompetitorAnalysisOverlays({
  selectedProduct,
  keywordProduct,
  selectedKeywordDetail,
  reportProduct,
  selectedStoreLabel,
  ownedNoonProductCodes,
  detailOpen,
  keywordModalOpen,
  manualModalOpen,
  reportOpen,
  detailLoading,
  reportRankLoading,
  changeLoading,
  actionLoading,
  historyRange,
  keywordInput,
  manualInput,
  manualKeywordId,
  changeRows,
  changeBaselineSummary,
  onDetailClose,
  onKeywordModalClose,
  onManualModalClose,
  onReportClose,
  onKeywordDetailClose,
  onHistoryRangeChange,
  onCandidateStatusChange,
  onCandidateBatchStatusChange,
  onManualRefresh,
  onManualInputChange,
  onManualKeywordChange,
  onManualAdd,
  onKeywordInputChange,
  onAddKeyword,
  onKeywordStatusChange,
  onKeywordDelete,
  onKeywordDetailOpen
}: {
  selectedProduct?: CompetitorWatchProduct
  keywordProduct?: CompetitorWatchProduct
  selectedKeywordDetail: ProductKeywordDetailKeyword | null
  reportProduct?: CompetitorWatchProduct
  selectedStoreLabel: string
  ownedNoonProductCodes: ReadonlySet<string>
  detailOpen: boolean
  keywordModalOpen: boolean
  manualModalOpen: boolean
  reportOpen: boolean
  detailLoading: boolean
  reportRankLoading: boolean
  changeLoading: boolean
  actionLoading: string | null
  historyRange: HistoryRange
  keywordInput: string
  manualInput: string
  manualKeywordId: string
  changeRows: CompetitorProductChangeGroup[]
  changeBaselineSummary?: CompetitorProductChangeBaselineSummary
  onDetailClose: () => void
  onKeywordModalClose: () => void
  onManualModalClose: () => void
  onReportClose: () => void
  onKeywordDetailClose: () => void
  onHistoryRangeChange: (value: HistoryRange) => void
  onCandidateStatusChange: (
    keywordId: string,
    candidateId: string,
    status: 'confirmed' | 'ignored' | 'removed'
  ) => void
  onCandidateBatchStatusChange: (
    keywordId: string,
    candidateIds: string[],
    status: 'confirmed' | 'ignored'
  ) => void
  onManualRefresh: (product: CompetitorWatchProduct) => void
  onManualInputChange: (value: string) => void
  onManualKeywordChange: (value: string) => void
  onManualAdd: () => void
  onKeywordInputChange: (value: string) => void
  onAddKeyword: () => void
  onKeywordStatusChange: (
    keyword: CompetitorKeyword,
    status: 'active' | 'paused'
  ) => void
  onKeywordDelete: (keyword: CompetitorKeyword) => void
  onKeywordDetailOpen: (
    product: CompetitorWatchProduct,
    keyword: CompetitorKeyword
  ) => void
}) {
  const keywordPanelProduct = keywordProduct || selectedProduct
  return (
    <>
      {selectedProduct ? (
        <>
          <Drawer
            width="min(1360px, calc(100vw - 96px))"
            open={detailOpen}
            onClose={onDetailClose}
            title="我方商品竞品详情"
            destroyOnClose={false}
          >
            <ProductDetail
              product={selectedProduct}
              storeLabel={selectedStoreLabel}
              ownedNoonProductCodes={ownedNoonProductCodes}
              historyRange={historyRange}
              onHistoryRangeChange={onHistoryRangeChange}
              onCandidateStatusChange={onCandidateStatusChange}
              onCandidateBatchStatusChange={onCandidateBatchStatusChange}
              onManualRefresh={onManualRefresh}
              actionLoading={actionLoading}
            />
          </Drawer>
          <Modal
            width={680}
            open={manualModalOpen}
            title="手工添加竞品"
            footer={null}
            onCancel={onManualModalClose}
            destroyOnClose={false}
          >
            <Spin spinning={detailLoading}>
              <ManualCompetitorPanel
                product={selectedProduct}
                manualInput={manualInput}
                selectedKeywordId={manualKeywordId}
                actionLoading={actionLoading}
                onManualInputChange={onManualInputChange}
                onManualKeywordChange={onManualKeywordChange}
                onManualAdd={onManualAdd}
              />
            </Spin>
          </Modal>
        </>
      ) : null}
      {keywordPanelProduct ? (
        <Modal
          width={640}
          open={keywordModalOpen}
          title="关键词维护"
          footer={null}
          onCancel={onKeywordModalClose}
          destroyOnClose={false}
        >
          <Spin spinning={detailLoading}>
            <KeywordMaintenancePanel
              product={keywordPanelProduct}
              keywordInput={keywordInput}
              actionLoading={actionLoading}
              onKeywordInputChange={onKeywordInputChange}
              onAddKeyword={onAddKeyword}
              onKeywordStatusChange={onKeywordStatusChange}
              onKeywordDelete={onKeywordDelete}
              onKeywordDetailOpen={(keyword) =>
                onKeywordDetailOpen(keywordPanelProduct, keyword)
              }
            />
          </Spin>
        </Modal>
      ) : null}
      <ProductKeywordDetailDrawer
        open={Boolean(selectedKeywordDetail)}
        onClose={onKeywordDetailClose}
        keyword={selectedKeywordDetail}
      />
      {reportProduct ? (
        <Modal
          className="competitor-analysis-report-dialog"
          width="min(1180px, calc(100vw - 96px))"
          open={reportOpen}
          title={null}
          footer={null}
          style={{ top: 32 }}
          onCancel={onReportClose}
          destroyOnClose={false}
        >
          <SelfRankReportModal
            product={reportProduct}
            storeLabel={selectedStoreLabel}
            rankLoading={reportRankLoading}
            changeGroups={changeRows}
            changeBaselineSummary={changeBaselineSummary}
            changeLoading={changeLoading}
          />
        </Modal>
      ) : null}
    </>
  )
}
