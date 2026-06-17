import { Alert, Table } from 'antd'
import { InTransitBatchToolbar } from './InTransitBatchToolbar'
import { InTransitBoxDetailView } from './InTransitBoxDetailView'
import { InTransitAliasDrawer } from './InTransitAliasDrawer'
import { InTransitImportDrawer } from './InTransitImportDrawer'
import { InTransitBatchEditorDrawer } from './InTransitBatchEditorDrawer'
import { InTransitSkuFreightDrawer } from './InTransitSkuFreightDrawer'
import type { InTransitGoodsPageProps } from './InTransitGoodsPage.models'
import { stripedRowClassName } from './InTransitGoodsPage.utils'
import { useInTransitBatchColumns } from './useInTransitBatchColumns'
import { useInTransitBatchEditor } from './useInTransitBatchEditor'
import { useInTransitBatchList } from './useInTransitBatchList'
import { useInTransitBoxDetail } from './useInTransitBoxDetail'
import { useInTransitForwarderAlias } from './useInTransitForwarderAlias'
import { useInTransitImport } from './useInTransitImport'
import { useInTransitSkuFreight } from './useInTransitSkuFreight'
import './InTransitGoodsPage.css'

export function InTransitGoodsPage({
  isBoxDetailTab = false,
  boxDetailRequest,
  onOpenBoxDetailTab,
  onCloseBoxDetailTab
}: InTransitGoodsPageProps = {}) {
  const batchList = useInTransitBatchList(isBoxDetailTab)
  const batchEditor = useInTransitBatchEditor(batchList.filters, batchList.load)
  const alias = useInTransitForwarderAlias(batchList.filters, batchList.load)
  const importer = useInTransitImport(batchList.filters, batchList.load)
  const boxDetail = useInTransitBoxDetail({
    isBoxDetailTab,
    boxDetailRequest,
    onOpenBoxDetailTab,
    onCloseBoxDetailTab
  })
  const skuFreight = useInTransitSkuFreight(boxDetailRequest)
  const batchColumns = useInTransitBatchColumns({
    statusLabel: batchList.statusLabel,
    transportLabel: batchList.transportLabel,
    nodeStatusLabel: batchList.nodeStatusLabel,
    formatDestination: batchList.formatDestination,
    batchSortOrder: batchList.batchSortOrder,
    onOpenForwarderAlias: alias.openForwarderAliasDrawer,
    onOpenBoxDetail: boxDetail.openBoxDetail,
    onOpenEdit: batchEditor.openEdit
  })

  const boxDetailBatch = isBoxDetailTab ? boxDetailRequest?.batch ?? null : null
  if (boxDetailBatch) {
    return (
      <InTransitBoxDetailView
        batch={boxDetailBatch}
        activeTab={boxDetail.boxDetailTab}
        boxGroups={boxDetail.boxGroups}
        productGroups={boxDetail.productGroups}
        loading={boxDetail.loadingBoxLines}
        skuFreight={skuFreight}
        onTabChange={boxDetail.setBoxDetailTab}
      />
    )
  }

  return (
    <div className="in-transit-page" data-testid="in-transit-goods-page">
      {batchList.state.status === 'error' ? <Alert type="error" showIcon message={batchList.state.message} /> : null}

      <InTransitBatchToolbar
        filters={batchList.filters}
        loading={batchList.state.status === 'loading'}
        forwarderFilterValue={batchList.forwarderFilterValue}
        forwarderFilterOptions={batchList.forwarderFilterOptions}
        transportOptions={batchList.transportOptions}
        destinationOptions={batchList.destinationOptions}
        statusOptions={batchList.statusOptions}
        onForwarderChange={batchList.updateForwarderFilter}
        onFilterChange={batchList.updateFilters}
        onRefresh={() => void batchList.load(batchList.filters)}
        onOpenImport={importer.openImportDrawer}
        onOpenCreate={batchEditor.openCreate}
      />

      <div className="in-transit-page__table">
        <Table
          rowKey="batchId"
          rowClassName={stripedRowClassName}
          columns={batchColumns}
          dataSource={batchList.rows}
          loading={batchList.state.status === 'loading'}
          locale={{ emptyText: '暂无在途批次' }}
          scroll={{ x: 1500 }}
          pagination={{
            current: batchList.filters.page ?? batchList.batchListMeta.page,
            pageSize: batchList.filters.pageSize ?? batchList.batchListMeta.pageSize,
            total: batchList.batchListMeta.totalCount,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
          onChange={batchList.handleBatchTableChange}
        />
      </div>

      <InTransitSkuFreightDrawer
        open={skuFreight.skuFreightDrawerOpen}
        context={skuFreight.skuFreightContext}
        history={skuFreight.skuFreightHistory}
        comparison={skuFreight.forwarderFreightComparison}
        loading={skuFreight.loadingSkuFreight}
        onClose={skuFreight.closeSkuFreightDrawer}
      />
      <InTransitAliasDrawer
        open={alias.aliasDrawerOpen}
        targetBatch={alias.aliasTargetBatch}
        aliasForwarderId={alias.aliasForwarderId}
        saving={alias.savingAlias}
        forwarderOptions={batchList.forwarderOptions}
        onForwarderChange={alias.setAliasForwarderId}
        onClose={alias.closeForwarderAliasDrawer}
        onSubmit={() => void alias.submitForwarderAlias()}
      />
      <InTransitImportDrawer
        importer={importer}
        statusLabel={batchList.statusLabel}
        transportLabel={batchList.transportLabel}
        formatDestination={batchList.formatDestination}
      />
      <InTransitBatchEditorDrawer
        editor={batchEditor}
        forwarderOptions={batchList.forwarderOptions}
        transportOptions={batchList.transportOptions}
        statusOptions={batchList.statusOptions}
        destinationOptions={batchList.destinationOptions}
        nodeOptions={batchList.nodeOptions}
        nodeStatusLabel={batchList.nodeStatusLabel}
      />
    </div>
  )
}

export default InTransitGoodsPage
