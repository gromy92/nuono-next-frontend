import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, DatePicker, Input, Select, Spin, Table } from 'antd'
import type { Ali1688SkuPurchaseHistoryItem } from '../../ali1688-historical-orders/types'
import { useSkuPurchaseHistoryWorkbench } from '../hooks/useSkuPurchaseHistoryWorkbench'
import type { Ali1688SkuPurchaseHistoryPageProps, FilterState } from '../model/pageTypes'
import {
  calculatePurchaseBatchMetrics,
  compareAmount,
  compareText
} from '../model/purchaseBatchMetrics'
import { buildQuery, skuPurchaseHistoryRowKey } from '../model/purchaseBatchSources'
import {
  ProductInfoCell,
  PurchaseHistoryCell,
  PurchaseSummaryCell,
  PurchaseTrendCell,
  SkuPurchaseHistoryEmptyState
} from './ProductPurchaseCells'
import { PurchaseBatchDrawer } from './PurchaseBatchDrawer'
import { TrendDetailDrawer } from './TrendDetailDrawer'

const { RangePicker } = DatePicker

export function SkuPurchaseHistoryWorkbench({
  storeCode,
  siteCode
}: Ali1688SkuPurchaseHistoryPageProps) {
  const state = useSkuPurchaseHistoryWorkbench({ storeCode, siteCode })
  const {
    filters, setFilters, query, view, loading,
    trendRecord, setTrendRecord, batchRecord, setBatchRecord,
    loadHistory, batchesForRecord, savePurchaseBatches, submitSearch
  } = state
  const tableColumns = [
    {
      title: '商品信息',
      key: 'product',
      width: 420,
      sorter: (left: Ali1688SkuPurchaseHistoryItem, right: Ali1688SkuPurchaseHistoryItem) =>
        compareText(left.skuParent, right.skuParent),
      render: (_: unknown, record: Ali1688SkuPurchaseHistoryItem) => <ProductInfoCell record={record} />
    },
    {
      title: '采购历史',
      key: 'history',
      width: 300,
      sorter: (left: Ali1688SkuPurchaseHistoryItem, right: Ali1688SkuPurchaseHistoryItem) =>
        compareText(left.recentPurchaseTime, right.recentPurchaseTime),
      render: (_: unknown, record: Ali1688SkuPurchaseHistoryItem) => (
        <PurchaseHistoryCell
          record={record}
          batches={batchesForRecord(record)}
          onOpenBatches={() => setBatchRecord(record)}
        />
      )
    },
    {
      title: '采购单价趋势',
      key: 'trend',
      width: 240,
      sorter: (left: Ali1688SkuPurchaseHistoryItem, right: Ali1688SkuPurchaseHistoryItem) =>
        compareAmount(left.recentUnitPrice, right.recentUnitPrice),
      render: (_: unknown, record: Ali1688SkuPurchaseHistoryItem) => (
        <PurchaseTrendCell
          record={record}
          batches={batchesForRecord(record)}
          metrics={calculatePurchaseBatchMetrics(batchesForRecord(record))}
          onOpen={() => setTrendRecord(record)}
        />
      )
    },
    {
      title: '采购总结',
      key: 'summary',
      width: 280,
      sorter: (left: Ali1688SkuPurchaseHistoryItem, right: Ali1688SkuPurchaseHistoryItem) =>
        (left.purchaseCount ?? 0) - (right.purchaseCount ?? 0),
      render: (_: unknown, record: Ali1688SkuPurchaseHistoryItem) => (
        <PurchaseSummaryCell metrics={calculatePurchaseBatchMetrics(batchesForRecord(record))} />
      )
    }
  ]

  return (
    <section className="ali1688-sku-purchase-history-page" data-testid="ali1688-sku-purchase-history-page">
      <section className="ali1688-sku-purchase-history-filters" aria-label="SKU 采购历史筛选">
        <div className="ali1688-sku-purchase-history-query">
          <Input
            className="ali1688-sku-purchase-history-keyword-input"
            aria-label="名称搜索"
            allowClear
            placeholder="名称 / SKU"
            value={filters.keyword}
            onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
            onPressEnter={submitSearch}
          />
          <Select
            aria-label="关联"
            data-testid="sku-purchase-link-status-filter"
            style={{ width: 120 }}
            options={[
              { label: '全部', value: 'all' },
              { label: '已关联', value: 'linked' },
              { label: '未关联', value: 'unlinked' }
            ]}
            value={filters.linkStatus}
            onChange={(value) => setFilters((current) => ({
              ...current,
              linkStatus: value as FilterState['linkStatus']
            }))}
          />
          <RangePicker
            allowClear
            value={filters.purchaseRange}
            onChange={(value) => setFilters((current) => ({ ...current, purchaseRange: value }))}
            placeholder={['采购开始', '采购结束']}
            format="YYYY-MM-DD"
          />
        </div>
        <div className="ali1688-sku-purchase-history-actions">
          <Button type="primary" icon={<SearchOutlined />} onClick={submitSearch}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={() => void loadHistory(query)}>刷新</Button>
        </div>
      </section>

      <Spin spinning={loading}>
        <Table<Ali1688SkuPurchaseHistoryItem>
          className="ali1688-sku-purchase-history-table"
          rowKey={skuPurchaseHistoryRowKey}
          columns={tableColumns}
          dataSource={view.items || []}
          scroll={{ x: 1180 }}
          locale={{
            emptyText: <SkuPurchaseHistoryEmptyState unlinkedAssignedLineCount={view.unlinkedAssignedLineCount || 0} />
          }}
          pagination={{
            current: view.pagination?.page || query.page || 1,
            pageSize: view.pagination?.pageSize || query.pageSize || 20,
            total: view.pagination?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条 SKU 采购历史`
          }}
          onChange={(pagination) => {
            void loadHistory(buildQuery(
              filters,
              pagination.current || 1,
              pagination.pageSize || query.pageSize || 20
            ))
          }}
        />
      </Spin>
      <TrendDetailDrawer
        record={trendRecord}
        batches={trendRecord ? batchesForRecord(trendRecord) : []}
        onClose={() => setTrendRecord(null)}
      />
      <PurchaseBatchDrawer
        record={batchRecord}
        batches={batchRecord ? batchesForRecord(batchRecord) : []}
        onClose={() => setBatchRecord(null)}
        onSaveBatches={savePurchaseBatches}
      />
    </section>
  )
}
