import { LineChartOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, DatePicker, Drawer, Empty, Input, Popover, Segmented, Space, Spin, Table, Tag, Tooltip, Typography, message } from 'antd'
import type { Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { loadAli1688HistoricalOrderDetail, loadAli1688SkuPurchaseHistory } from '../ali1688-historical-orders/api'
import type {
  Ali1688HistoricalOrderDetail,
  Ali1688SkuPurchaseHistoryItem,
  Ali1688SkuPurchaseHistoryQuery,
  Ali1688SkuPurchaseHistoryRecord,
  Ali1688SkuPurchaseHistoryView
} from '../ali1688-historical-orders/types'
import { normalizeNoonImageUrl } from '../product-management/utils/common'
import './Ali1688SkuPurchaseHistoryPage.css'

const { Text } = Typography
const { RangePicker } = DatePicker

type AssignmentTargetStore = {
  storeCode: string
  projectCode?: string
  projectName?: string
  site?: string
}

type Ali1688SkuPurchaseHistoryPageProps = {
  storeCode?: string
  siteCode?: string
  availableStores?: AssignmentTargetStore[]
}

type FilterState = {
  storeCode?: string
  siteCode?: string
  keyword: string
  linkStatus: 'all' | 'linked' | 'unlinked'
  purchaseRange: [Dayjs | null, Dayjs | null] | null
}

const EMPTY_VIEW: Ali1688SkuPurchaseHistoryView = {
  items: [],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0
  },
  unlinkedAssignedLineCount: 0
}

export function Ali1688SkuPurchaseHistoryPage({ storeCode, siteCode }: Ali1688SkuPurchaseHistoryPageProps) {
  const initialStoreCode = storeCode?.trim()
  const initialSiteCode = siteCode?.trim()
  const [filters, setFilters] = useState<FilterState>({
    storeCode: initialStoreCode,
    siteCode: initialSiteCode,
    keyword: '',
    linkStatus: 'all',
    purchaseRange: null
  })
  const [query, setQuery] = useState<Ali1688SkuPurchaseHistoryQuery>({
    storeCode: initialStoreCode,
    siteCode: initialSiteCode,
    page: 1,
    pageSize: 20
  })
  const [view, setView] = useState<Ali1688SkuPurchaseHistoryView>(EMPTY_VIEW)
  const [loading, setLoading] = useState(false)
  const [trendRecord, setTrendRecord] = useState<Ali1688SkuPurchaseHistoryItem | null>(null)
  const [sourceOrderOpen, setSourceOrderOpen] = useState(false)
  const [sourceOrderLoading, setSourceOrderLoading] = useState(false)
  const [sourceOrderDetail, setSourceOrderDetail] = useState<Ali1688HistoricalOrderDetail | null>(null)

  async function loadHistory(nextQuery: Ali1688SkuPurchaseHistoryQuery = query) {
    setLoading(true)
    try {
      setQuery(nextQuery)
      setView(await loadAli1688SkuPurchaseHistory(nextQuery))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取 SKU 采购历史失败')
      setView(EMPTY_VIEW)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const nextStoreCode = storeCode?.trim()
    const nextSiteCode = siteCode?.trim()
    const nextFilters: FilterState = {
      storeCode: nextStoreCode,
      siteCode: nextSiteCode,
      keyword: '',
      linkStatus: 'all',
      purchaseRange: null
    }
    const nextQuery = buildQuery(nextFilters, 1, query.pageSize || 20)
    setFilters(nextFilters)
    void loadHistory(nextQuery)
  }, [siteCode, storeCode])

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
      render: (_: unknown, record: Ali1688SkuPurchaseHistoryItem) => <PurchaseHistoryCell record={record} />
    },
    {
      title: '采购单价趋势',
      key: 'trend',
      width: 240,
      sorter: (left: Ali1688SkuPurchaseHistoryItem, right: Ali1688SkuPurchaseHistoryItem) =>
        compareAmount(left.recentUnitPrice, right.recentUnitPrice),
      render: (_: unknown, record: Ali1688SkuPurchaseHistoryItem) => (
        <PurchaseTrendCell record={record} onOpen={() => setTrendRecord(record)} />
      )
    },
    {
      title: '采购总结',
      key: 'summary',
      width: 280,
      sorter: (left: Ali1688SkuPurchaseHistoryItem, right: Ali1688SkuPurchaseHistoryItem) =>
        (left.purchaseCount ?? 0) - (right.purchaseCount ?? 0),
      render: (_: unknown, record: Ali1688SkuPurchaseHistoryItem) => <PurchaseSummaryCell record={record} />
    }
  ]

  function submitSearch() {
    void loadHistory(buildQuery(filters, 1, query.pageSize || 20))
  }

  async function openSourceOrder(history: Ali1688SkuPurchaseHistoryRecord) {
    if (!history.orderId) {
      message.warning('当前采购历史未返回原始订单 ID。')
      return
    }
    setSourceOrderOpen(true)
    setSourceOrderLoading(true)
    setSourceOrderDetail(null)
    try {
      setSourceOrderDetail(await loadAli1688HistoricalOrderDetail(String(history.orderId), {
        storeCode: trendRecord?.storeCode,
        siteCode: trendRecord?.siteCode
      }))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取 1688 历史订单详情失败')
    } finally {
      setSourceOrderLoading(false)
    }
  }

  return (
    <section className="ali1688-sku-purchase-history-page" data-testid="ali1688-sku-purchase-history-page">
      <section className="ali1688-sku-purchase-history-filters" aria-label="SKU 采购历史筛选">
        <div className="ali1688-sku-purchase-history-query">
          <Input
            aria-label="名称搜索"
            allowClear
            placeholder="名称 / SKU"
            value={filters.keyword}
            onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
            onPressEnter={submitSearch}
          />
          <Segmented
            aria-label="关联状态"
            data-testid="sku-purchase-link-status-filter"
            options={[
              { label: '全部', value: 'all' },
              { label: '已关联', value: 'linked' },
              { label: '未关联', value: 'unlinked' }
            ]}
            value={filters.linkStatus}
            onChange={(value) =>
              setFilters((current) => ({ ...current, linkStatus: value as FilterState['linkStatus'] }))
            }
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
          <Button type="primary" icon={<SearchOutlined />} onClick={submitSearch}>
            查询
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => void loadHistory(query)}>
            刷新
          </Button>
        </div>
      </section>

      <Spin spinning={loading}>
        <Table<Ali1688SkuPurchaseHistoryItem>
          className="ali1688-sku-purchase-history-table"
          rowKey={(record) => skuPurchaseHistoryRowKey(record)}
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
            void loadHistory(buildQuery(filters, pagination.current || 1, pagination.pageSize || query.pageSize || 20))
          }}
        />
      </Spin>
      <TrendDetailDrawer
        record={trendRecord}
        onClose={() => setTrendRecord(null)}
        onOpenOrder={openSourceOrder}
      />
      <SourceOrderDetailDrawer
        open={sourceOrderOpen}
        loading={sourceOrderLoading}
        detail={sourceOrderDetail}
        onClose={() => {
          setSourceOrderOpen(false)
          setSourceOrderDetail(null)
        }}
      />
    </section>
  )
}

function SkuPurchaseHistoryEmptyState({ unlinkedAssignedLineCount }: { unlinkedAssignedLineCount: number }) {
  if (unlinkedAssignedLineCount > 0) {
    return (
      <Empty
        description={
          <div className="ali1688-sku-empty-state">
            <Text strong>当前筛选下没有已关联 SKU 采购历史</Text>
            <Text type="secondary">有 {unlinkedAssignedLineCount} 条已分配货品行尚未商品关联</Text>
          </div>
        }
      />
    )
  }
  return <Empty description="暂无 SKU 采购历史" />
}

function ProductInfoCell({ record }: { record: Ali1688SkuPurchaseHistoryItem }) {
  const title = displayText(record.productTitle, record.partnerSku || record.skuParent)
  const visiblePsku = displayText(record.partnerSku, record.pskuCode)
  const visibleSku = displayText(record.skuParent)
  const titleCn = displayOptionalText(record.productTitleCn)
  return (
    <div className="ali1688-sku-product-cell">
      <SkuProductThumbnail src={record.productImageUrl} alt={title} />
      <div className="ali1688-sku-product-main">
        <Tooltip title={<ProductTitleTooltip title={title} titleCn={titleCn} />} placement="topLeft">
          <Text strong className="ali1688-sku-product-title">
            {title}
          </Text>
        </Tooltip>
        <Space wrap size={[10, 2]} className="ali1688-sku-product-identity">
          <span>
            <Text type="secondary">PSKU: </Text>
            <Text copyable={visiblePsku !== '-' ? { text: visiblePsku, tooltips: ['复制 PSKU', '已复制'] } : false}>
              {visiblePsku}
            </Text>
          </span>
          <span>
            <Text type="secondary">SKU: </Text>
            <Text copyable={visibleSku !== '-' ? { text: visibleSku, tooltips: ['复制 SKU', '已复制'] } : false}>
              {visibleSku}
            </Text>
          </span>
        </Space>
        <Space size={[6, 4]} wrap>
          {record.linkStatus === 'unlinked' ? <Tag>未关联</Tag> : <Tag color="green">已关联</Tag>}
          <Tag>店铺: {displayText(record.storeCode)} · {displayText(record.siteCode)}</Tag>
        </Space>
      </div>
    </div>
  )
}

function ProductTitleTooltip({ title, titleCn }: { title: string; titleCn?: string }) {
  return (
    <div className="ali1688-sku-product-title-tooltip">
      <div>{title}</div>
      <div className="ali1688-sku-product-title-tooltip-cn">
        <span>中文名</span>
        <strong>{titleCn || '未维护'}</strong>
      </div>
    </div>
  )
}

function SkuProductThumbnail({ src, alt }: { src?: string; alt: string }) {
  const [imageFailed, setImageFailed] = useState(false)
  const normalizedSrc = normalizeNoonImageUrl(src)

  useEffect(() => {
    setImageFailed(false)
  }, [normalizedSrc])

  if (!normalizedSrc || imageFailed) {
    return <span className="ali1688-sku-product-thumbnail-placeholder">无图</span>
  }
  return (
    <span className="ali1688-sku-product-thumbnail">
      <img src={normalizedSrc} alt={alt} onError={() => setImageFailed(true)} />
    </span>
  )
}

function PurchaseHistoryCell({ record }: { record: Ali1688SkuPurchaseHistoryItem }) {
  const history = record.history || []
  const latest = history[0]
  const content = (
    <div className="ali1688-sku-history-popover">
      {history.slice(0, 8).map((item, index) => (
        <div key={`${item.assignmentId || item.orderNo || index}`} className="ali1688-sku-history-popover-row">
          <Text strong>{displayText(item.orderNo)}</Text>
          <Text type="secondary">{displayText(item.orderTime)} · {displayText(item.supplierName)}</Text>
          <Text type="secondary">数量 {formatNumberText(item.assignedQuantity)} · 单价 {formatCurrency(item.unitPrice)}</Text>
        </div>
      ))}
      {!history.length ? <Text type="secondary">暂无采购历史摘要</Text> : null}
    </div>
  )

  return (
    <Popover title="采购历史摘要" content={content} placement="topLeft">
      <div
        className="ali1688-sku-history-summary"
        data-testid={`sku-purchase-history-summary-${record.skuParent || 'unknown'}`}
      >
        <Text strong>{latest ? formatCurrency(latest.unitPrice) : '未返回信息'}</Text>
        <Text type="secondary">{latest ? displayText(latest.orderTime) : '暂无最近采购'}</Text>
        <Text type="secondary">{latest ? displayText(latest.supplierName) : '暂无供应商'}</Text>
        <Text type="secondary">{latest ? `订单 ${displayText(latest.orderNo)}` : '无订单号'}</Text>
      </div>
    </Popover>
  )
}

function PurchaseTrendCell({ record, onOpen }: { record: Ali1688SkuPurchaseHistoryItem; onOpen: () => void }) {
  const points = (record.history || [])
    .slice()
    .reverse()
    .map((item) => parseAmount(item.unitPrice))
    .filter((value): value is number => value !== null)
  return (
    <div className="ali1688-sku-trend-cell">
      <Sparkline points={points} skuParent={record.skuParent} onOpen={onOpen} />
      <Space size={8} wrap>
        <Text type="secondary">最低 {formatCurrency(record.lowestUnitPrice)}</Text>
        <Text type="secondary">最高 {formatCurrency(record.highestUnitPrice)}</Text>
      </Space>
    </div>
  )
}

function Sparkline({ points, skuParent, onOpen }: { points: number[]; skuParent?: string; onOpen: () => void }) {
  if (!points.length) {
    return (
      <button
        type="button"
        className="ali1688-sku-sparkline-empty"
        data-testid={`sku-purchase-sparkline-${skuParent || 'unknown'}`}
        onClick={onOpen}
      >
        <LineChartOutlined />
        <Text type="secondary">暂无趋势</Text>
      </button>
    )
  }
  const width = 154
  const height = 48
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const step = points.length === 1 ? width : width / (points.length - 1)
  const pathPoints = points
    .map((value, index) => {
      const x = points.length === 1 ? width / 2 : index * step
      const y = height - ((value - min) / range) * (height - 8) - 4
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <button
      className="ali1688-sku-sparkline"
      data-testid={`sku-purchase-sparkline-${skuParent || 'unknown'}`}
      type="button"
      onClick={onOpen}
    >
      <svg role="img" aria-label="采购单价趋势" viewBox={`0 0 ${width} ${height}`}>
        <polyline points={pathPoints} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((value, index) => {
          const x = points.length === 1 ? width / 2 : index * step
          const y = height - ((value - min) / range) * (height - 8) - 4
          return <circle key={`${value}-${index}`} cx={x} cy={y} r="3" fill="#2563eb" />
        })}
      </svg>
    </button>
  )
}

function PurchaseSummaryCell({ record }: { record: Ali1688SkuPurchaseHistoryItem }) {
  return (
    <div className="ali1688-sku-summary-cell">
      <Text strong>采购次数: {record.purchaseCount ?? 0}</Text>
      <Text>采购总费用: {formatCurrency(record.totalCost)}</Text>
      <Text>采购总件数: {formatNumberText(record.totalQuantity)}</Text>
      <Text type="secondary">平均采购单价: {formatCurrency(record.averageUnitPrice)}</Text>
      <Text type="secondary">最近采购单价: {formatCurrency(record.recentUnitPrice)}</Text>
      <Text type="secondary">最近采购时间: {displayText(record.recentPurchaseTime)}</Text>
      <AmountBasisTag amountBasis={record.amountBasis} flags={record.dataQualityFlags} />
    </div>
  )
}

function AmountBasisTag({ amountBasis, flags }: { amountBasis?: string; flags?: string[] }) {
  const hasMissingBasis = flags?.includes('missing_price_basis')
  if (hasMissingBasis) {
    return <Tag color="orange">存在缺失价格点</Tag>
  }
  if (amountBasis === 'item_amount_allocated') {
    return <Tag color="gold">按货品金额分摊</Tag>
  }
  return <Tag color="green">按实付款分摊</Tag>
}

function TrendDetailDrawer({
  record,
  onClose,
  onOpenOrder
}: {
  record: Ali1688SkuPurchaseHistoryItem | null
  onClose: () => void
  onOpenOrder: (history: Ali1688SkuPurchaseHistoryRecord) => void
}) {
  const history = record?.history || []
  return (
    <Drawer
      title={`采购单价趋势 · ${displayText(record?.skuParent)}`}
      open={Boolean(record)}
      onClose={onClose}
      width={920}
      destroyOnClose
    >
      {record ? (
        <div className="ali1688-sku-trend-detail">
          <Space size={[10, 8]} wrap>
            <Tag color="red">最高采购单价: {formatCurrency(record.highestUnitPrice)}</Tag>
            <Tag color="blue">最低采购单价: {formatCurrency(record.lowestUnitPrice)}</Tag>
            <Tag>{displayText(record.storeCode)} · {displayText(record.siteCode)}</Tag>
          </Space>
          <LargePriceTrendChart history={history} />
          <Table<Ali1688SkuPurchaseHistoryRecord>
            rowKey={(item, index) => `${item.assignmentId || item.orderNo || index}`}
            size="small"
            pagination={false}
            dataSource={history}
            scroll={{ x: 780 }}
            columns={[
              {
                title: '采购时间',
                dataIndex: 'orderTime',
                width: 150,
                render: (value) => displayText(value)
              },
              {
                title: '订单号',
                dataIndex: 'orderNo',
                width: 180,
                render: (value) => displayText(value)
              },
              {
                title: '供应商',
                dataIndex: 'supplierName',
                width: 180,
                render: (value) => displayText(value)
              },
              {
                title: '数量',
                dataIndex: 'assignedQuantity',
                width: 90,
                render: (value) => formatNumberText(value)
              },
              {
                title: '单价',
                dataIndex: 'unitPrice',
                width: 110,
                render: (value) => formatCurrency(value)
              },
              {
                title: '金额口径',
                dataIndex: 'amountBasis',
                width: 130,
                render: (value) => amountBasisLabel(value)
              },
              {
                title: '质量',
                dataIndex: 'priceQuality',
                width: 120,
                render: (value) => priceQualityTag(value)
              },
              {
                title: '操作',
                key: 'action',
                width: 100,
                fixed: 'right',
                render: (_value, item) => (
                  <Button type="link" size="small" disabled={!item.orderId} onClick={() => onOpenOrder(item)}>
                    查看订单
                  </Button>
                )
              }
            ]}
          />
        </div>
      ) : null}
    </Drawer>
  )
}

function LargePriceTrendChart({ history }: { history: Ali1688SkuPurchaseHistoryRecord[] }) {
  const validPoints = history
    .filter((item) => parseAmount(item.unitPrice) !== null)
    .slice()
    .reverse()
  if (!validPoints.length) {
    return <Empty description="暂无可计算价格点" />
  }
  const width = 760
  const height = 240
  const padding = 32
  const values = validPoints.map((item) => parseAmount(item.unitPrice) ?? 0)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const step = validPoints.length === 1 ? 0 : (width - padding * 2) / (validPoints.length - 1)
  const coordinates = validPoints.map((item, index) => {
    const value = parseAmount(item.unitPrice) ?? 0
    const x = validPoints.length === 1 ? width / 2 : padding + step * index
    const y = height - padding - ((value - min) / range) * (height - padding * 2)
    return { item, value, x, y }
  })
  const pathPoints = coordinates.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')

  return (
    <svg className="ali1688-sku-trend-large-chart" role="img" aria-label="全部采购单价趋势" viewBox={`0 0 ${width} ${height}`}>
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#cbd5e1" />
      <polyline points={pathPoints} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {coordinates.map((point, index) => {
        const isMax = point.value === max
        const isMin = point.value === min
        return (
          <g key={`${point.item.assignmentId || point.item.orderNo || index}`}>
            <circle cx={point.x} cy={point.y} r={isMax || isMin ? 5 : 4} fill={isMax ? '#dc2626' : isMin ? '#2563eb' : '#0f766e'}>
              <title>{`${displayText(point.item.orderTime)} ${displayText(point.item.orderNo)} ${formatCurrency(point.item.unitPrice)}`}</title>
            </circle>
            {isMax || isMin ? (
              <text x={point.x + 7} y={point.y - 7} fill={isMax ? '#dc2626' : '#2563eb'} fontSize="12">
                {isMax ? '最高' : '最低'} {formatCurrency(point.item.unitPrice)}
              </text>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}

function SourceOrderDetailDrawer({
  open,
  loading,
  detail,
  onClose
}: {
  open: boolean
  loading: boolean
  detail: Ali1688HistoricalOrderDetail | null
  onClose: () => void
}) {
  return (
    <Drawer title="1688 历史订单详情" open={open} onClose={onClose} width={760} destroyOnClose>
      <Spin spinning={loading}>
        {detail ? (
          <div className="ali1688-sku-source-order-detail">
            <dl>
              <div>
                <dt>订单号</dt>
                <dd>{displayText(detail.orderNo)}</dd>
              </div>
              <div>
                <dt>供应商</dt>
                <dd>{displayText(detail.supplierName)}</dd>
              </div>
              <div>
                <dt>下单时间</dt>
                <dd>{displayText(detail.orderTime)}</dd>
              </div>
              <div>
                <dt>实付款</dt>
                <dd>{displayText(detail.paidAmountText)}</dd>
              </div>
            </dl>
            <Table
              rowKey={(item: { id?: string }, index) => item.id || String(index)}
              size="small"
              pagination={false}
              dataSource={detail.items || []}
              columns={[
                {
                  title: '货品',
                  dataIndex: 'title',
                  render: (value) => displayText(value)
                },
                {
                  title: '数量',
                  dataIndex: 'quantity',
                  width: 100,
                  render: (value) => formatNumberText(value)
                },
                {
                  title: '金额',
                  dataIndex: 'amountText',
                  width: 120,
                  render: (value) => displayText(value)
                }
              ]}
            />
          </div>
        ) : null}
      </Spin>
    </Drawer>
  )
}

function buildQuery(filters: FilterState, page: number, pageSize: number): Ali1688SkuPurchaseHistoryQuery {
  return {
    storeCode: filters.storeCode,
    siteCode: filters.siteCode,
    keyword: filters.keyword.trim() || undefined,
    linkStatus: filters.linkStatus === 'all' ? undefined : filters.linkStatus,
    purchaseTimeFrom: filters.purchaseRange?.[0]?.format('YYYY-MM-DD'),
    purchaseTimeTo: filters.purchaseRange?.[1]?.format('YYYY-MM-DD'),
    page,
    pageSize
  }
}

function skuPurchaseHistoryRowKey(record: Ali1688SkuPurchaseHistoryItem) {
  if (record.linkStatus === 'unlinked') {
    return `${record.storeCode || ''}-${record.siteCode || ''}-unlinked-${record.assignmentId || record.itemId || record.orderNo || ''}`
  }
  return `${record.storeCode || ''}-${record.siteCode || ''}-${record.skuParent || ''}`
}

function displayText(value?: string | number | null, fallback?: string | number | null) {
  const normalized = value === undefined || value === null ? '' : String(value).trim()
  if (normalized) {
    return normalized
  }
  const fallbackText = fallback === undefined || fallback === null ? '' : String(fallback).trim()
  return fallbackText || '未返回信息'
}

function displayOptionalText(value?: string | number | null) {
  const normalized = value === undefined || value === null ? '' : String(value).trim()
  return normalized || undefined
}

function formatNumberText(value?: string | number | null) {
  const normalized = value === undefined || value === null ? '' : String(value).trim()
  return normalized || '未返回信息'
}

function formatCurrency(value?: string | number | null) {
  const amount = parseAmount(value)
  return amount === null ? '未返回信息' : `¥${amount.toFixed(2)}`
}

function amountBasisLabel(value?: string | null) {
  if (value === 'paid_amount_allocated') {
    return '按实付款分摊'
  }
  if (value === 'item_amount_allocated') {
    return '按货品金额分摊'
  }
  return '未返回信息'
}

function priceQualityTag(value?: string | null) {
  if (value === 'missing_price_basis') {
    return <Tag color="orange">缺失价格基础</Tag>
  }
  return <Tag color="green">正常</Tag>
}

function parseAmount(value?: string | number | null) {
  if (value === undefined || value === null) {
    return null
  }
  const normalized = String(value).replace(/[¥,\s]/g, '')
  if (!normalized) {
    return null
  }
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function compareText(left?: string | null, right?: string | null) {
  return displayText(left, '').localeCompare(displayText(right, ''), 'zh-Hans-CN')
}

function compareAmount(left?: string | number | null, right?: string | number | null) {
  return (parseAmount(left) ?? Number.NEGATIVE_INFINITY) - (parseAmount(right) ?? Number.NEGATIVE_INFINITY)
}
