import { Table, Tabs } from 'antd'
import type { BoxDetailTabKey, InTransitBoxGroup, InTransitProductGroup } from './InTransitGoodsPage.models'
import type { InTransitBatch } from './types'
import type { InTransitProductMatchCandidate } from './types'
import { stripedRowClassName } from './InTransitGoodsPage.utils'
import { useInTransitBoxDetailColumns } from './useInTransitBoxDetailColumns'
import { InTransitSkuFreightDrawer } from './InTransitSkuFreightDrawer'
import type { useInTransitSkuFreight } from './useInTransitSkuFreight'
import { InTransitProductMatchPanel } from './InTransitProductMatchPanel'

type InTransitBoxDetailViewProps = {
  batch: InTransitBatch
  activeTab: BoxDetailTabKey
  boxGroups: InTransitBoxGroup[]
  productGroups: InTransitProductGroup[]
  loading: boolean
  productMatchCandidates: InTransitProductMatchCandidate[]
  rematchingProducts: boolean
  skuFreight: ReturnType<typeof useInTransitSkuFreight>
  onTabChange: (tab: BoxDetailTabKey) => void
  onRematchProducts: () => void
}

export function InTransitBoxDetailView({
  batch,
  activeTab,
  boxGroups,
  productGroups,
  loading,
  productMatchCandidates,
  rematchingProducts,
  skuFreight,
  onTabChange,
  onRematchProducts
}: InTransitBoxDetailViewProps) {
  const { boxDetailColumns, productColumns } = useInTransitBoxDetailColumns((row) => void skuFreight.openSkuFreightHistory(row))
  return (
    <div className="in-transit-page" data-testid="in-transit-goods-page">
      <div className="in-transit-detail__header">
        <div className="in-transit-detail__summary">
          <span className="in-transit-page__stat">PSKU {batch.skuCount ?? productGroups.length}</span>
          <span className="in-transit-page__stat">箱数 {batch.boxCount ?? boxGroups.length}</span>
          <span className="in-transit-page__stat">发货 {batch.shippedQuantityTotal ?? '-'}</span>
          <span className="in-transit-page__stat">入仓 {batch.receivedQuantityTotal ?? '-'}</span>
          <span className="in-transit-page__stat">剩余 {batch.remainingQuantityTotal ?? '-'}</span>
        </div>
      </div>
      <InTransitProductMatchPanel
        items={productMatchCandidates}
        loading={loading}
        rematching={rematchingProducts}
        onRematch={onRematchProducts}
      />
      <div className="in-transit-detail">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => onTabChange(key as BoxDetailTabKey)}
          items={[
            {
              key: 'box',
              label: '箱子维度',
              children: (
                <Table
                  rowKey="boxNo"
                  rowClassName={stripedRowClassName}
                  columns={boxDetailColumns}
                  dataSource={boxGroups}
                  loading={loading}
                  locale={{ emptyText: '暂无箱子明细' }}
                  pagination={false}
                  size="small"
                  scroll={{ x: 1220 }}
                />
              )
            },
            {
              key: 'product',
              label: '产品维度',
              children: (
                <Table
                  rowKey="psku"
                  rowClassName={stripedRowClassName}
                  columns={productColumns}
                  dataSource={productGroups}
                  loading={loading}
                  locale={{ emptyText: '暂无产品明细' }}
                  pagination={false}
                  size="small"
                  scroll={{ x: 1220 }}
                />
              )
            }
          ]}
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
    </div>
  )
}
