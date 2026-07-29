import { Alert, Button, Input, Select, Space, Tabs, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { OfficialWarehouseProductHistoryDrawers } from './OfficialWarehouseProductHistoryDrawers'
import { OfficialWarehouseStatisticsSummary } from './OfficialWarehouseStatisticsSummary'
import {
  OfficialWarehouseInboundStatisticsTable,
  OfficialWarehouseProductStatisticsTable
} from './OfficialWarehouseStatisticsTables'
import type {
  OfficialWarehouseStatisticsPanelProps,
  OfficialWarehouseStatisticsTabKey
} from './officialWarehouseStatisticsModel'
import { useOfficialWarehouseStatistics } from './useOfficialWarehouseStatistics'
import './OfficialWarehouseStatisticsPanel.css'

const { Text } = Typography

export function OfficialWarehouseStatisticsPanel({
  storeCode,
  siteCode,
  mode = 'all'
}: OfficialWarehouseStatisticsPanelProps) {
  const state = useOfficialWarehouseStatistics(storeCode, siteCode, mode)
  const panelTitle = mode === 'inbound' ? '入仓单入仓核对' : ''
  const panelSubtitle = mode === 'inbound' ? '按 ASN / 入仓单查看预约、收货和入仓状态。' : ''
  const productTable = (
    <OfficialWarehouseProductStatisticsTable
      stats={state.stockStats}
      loading={state.loading}
      storeCode={storeCode}
      siteCode={siteCode}
      onOpenHistory={(row) => void state.openProductHistory(row)}
    />
  )
  const inboundTable = (
    <OfficialWarehouseInboundStatisticsTable stats={state.inboundStats} loading={state.loading} />
  )

  return (
    <div className="official-warehouse-statistics">
      {state.error ? <Alert type="error" showIcon message={state.error} /> : null}
      <div className="official-warehouse-statistics-board">
        <StatisticsPanelHeader
          title={panelTitle}
          subtitle={panelSubtitle}
          currentTab={state.currentTab}
          stockKeyword={state.stockKeyword}
          inboundKeyword={state.inboundKeyword}
          stockBucket={state.stockBucket}
          loading={state.loading}
          onStockKeywordChange={state.setStockKeyword}
          onInboundKeywordChange={state.setInboundKeyword}
          onStockBucketChange={state.setStockBucket}
          onReload={() => void state.loadStatistics()}
        />
        <OfficialWarehouseStatisticsSummary
          stockStats={state.stockStats}
          inboundStats={state.inboundStats}
          stockBucket={state.stockBucket}
          shouldShowProduct={state.shouldShowProduct}
          shouldShowInbound={state.shouldShowInbound}
          onStockBucketChange={state.setStockBucket}
        />
        {state.visibleTabs.length > 1 ? (
          <Tabs
            className="official-warehouse-view-tabs"
            activeKey={state.currentTab}
            destroyInactiveTabPane
            onChange={(key) => state.setActiveTab(key as OfficialWarehouseStatisticsTabKey)}
            items={[
              ...(state.shouldShowProduct ? [{ key: 'product', label: '商品视角', children: productTable }] : []),
              ...(state.shouldShowInbound ? [{ key: 'inbound', label: '入仓单视角', children: inboundTable }] : [])
            ]}
          />
        ) : state.currentTab === 'product' ? productTable : inboundTable}
        <OfficialWarehouseProductHistoryDrawers
          selectedStockRow={state.selectedStockRow}
          selectedSourceSegment={state.selectedSourceSegment}
          productHistory={state.productHistory}
          productSourceChain={state.productSourceChain}
          historyLoading={state.historyLoading}
          onCloseHistory={state.closeProductHistory}
          onSelectSourceSegment={state.setSelectedSourceSegment}
          onCloseSourceSegment={() => state.setSelectedSourceSegment(undefined)}
        />
      </div>
    </div>
  )
}

function StatisticsPanelHeader({
  title,
  subtitle,
  currentTab,
  stockKeyword,
  inboundKeyword,
  stockBucket,
  loading,
  onStockKeywordChange,
  onInboundKeywordChange,
  onStockBucketChange,
  onReload
}: {
  title: string
  subtitle: string
  currentTab: OfficialWarehouseStatisticsTabKey
  stockKeyword: string
  inboundKeyword: string
  stockBucket?: string
  loading: boolean
  onStockKeywordChange: (value: string) => void
  onInboundKeywordChange: (value: string) => void
  onStockBucketChange: (value?: string) => void
  onReload: () => void
}) {
  return (
    <div
      className={[
        'official-warehouse-statistics-board-header',
        !title && !subtitle ? 'official-warehouse-statistics-board-header-controls-only' : ''
      ].filter(Boolean).join(' ')}
    >
      {title || subtitle ? (
        <div className="official-warehouse-statistics-title">
          {title ? <Text strong>{title}</Text> : null}
          {subtitle ? <Text type="secondary">{subtitle}</Text> : null}
        </div>
      ) : null}
      <Space wrap className="official-warehouse-statistics-controls">
        <Input
          className="official-warehouse-search"
          allowClear
          placeholder={currentTab === 'product' ? 'SKU / PSKU / 商品' : 'ASN / 入仓单'}
          value={currentTab === 'product' ? stockKeyword : inboundKeyword}
          onChange={(event) => (
            currentTab === 'product'
              ? onStockKeywordChange(event.target.value)
              : onInboundKeywordChange(event.target.value)
          )}
          onPressEnter={onReload}
        />
        {currentTab === 'product' ? (
          <Select
            allowClear
            className="official-warehouse-status-filter"
            placeholder="筛选"
            value={stockBucket}
            options={[
              { label: '有效在仓', value: 'SELLABLE' },
              { label: '退货', value: 'RETURNED' },
              { label: '失败/异常', value: 'DAMAGED' },
              { label: '待确认', value: 'PENDING_CONFIRMATION' }
            ]}
            onChange={onStockBucketChange}
          />
        ) : null}
        <Button icon={<ReloadOutlined />} onClick={onReload} loading={loading}>
          刷新数据
        </Button>
      </Space>
    </div>
  )
}
