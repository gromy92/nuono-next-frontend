import { LineChartOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Alert, Button, Checkbox, DatePicker, Drawer, Empty, Input, InputNumber, Modal, Popover, Select, Space, Spin, Table, Tag, Tooltip, Typography, message } from 'antd'
import type { Dayjs } from 'dayjs'
import type { EChartsCoreOption } from 'echarts/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  loadAli1688SkuPurchaseHistory,
  previewAli1688SkuPurchaseBatchSourceMatch,
  saveAli1688SkuPurchaseBatches,
  saveAli1688SkuPurchaseBatchSourceMatch
} from '../ali1688-historical-orders/api'
import type {
  Ali1688SkuPurchaseBatchSourceMatchCandidate,
  Ali1688SkuPurchaseBatchSourceMatchPreviewResult,
  Ali1688SkuPurchaseHistoryItem,
  Ali1688SkuPurchaseHistoryQuery,
  Ali1688SkuPurchaseHistoryRecord,
  Ali1688SkuPurchaseHistoryBatch,
  Ali1688SkuPurchaseHistoryBatchSource,
  Ali1688SkuPurchaseHistoryView
} from '../ali1688-historical-orders/types'
import { normalizeNoonImageUrl } from '../product-management/utils/common'
import { EChartPanel } from '../../shared/charts'
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

type PurchaseBatchSource = {
  key: string
  orderId?: number
  itemId?: number
  assignmentId?: number
  orderNo?: string
  orderTime?: string
  supplierName?: string
  assignedQuantity?: string | number | null
  allocatedCost?: string | number | null
  unitPrice?: string | number | null
  amountBasis?: string | number | null
  priceQuality?: 'ready' | 'ok' | 'missing_price_basis' | string
}

type PurchaseBatch = {
  id: string
  batchId?: number
  label: string
  sources: PurchaseBatchSource[]
  countedQuantity: number | null
  countedCost: number | null
  note?: string
}

type SourceMatchFormState = {
  orderNo: string
  offerId: string
  skuId: string
}

type PurchaseBatchMetrics = {
  purchaseCount: number
  totalQuantity: number | null
  totalCost: number | null
  averageUnitPrice: number | null
  recentUnitPrice: number | null
  recentPurchaseTime?: string
  lowestUnitPrice: number | null
  highestUnitPrice: number | null
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

const EMPTY_SOURCE_MATCH_FORM: SourceMatchFormState = {
  orderNo: '',
  offerId: '',
  skuId: ''
}

const SOURCE_MATCH_REJECTION_MESSAGES: Record<string, string> = {
  unsafe_match_key: '请完整填写订单号、offer_id、sku_id。',
  batch_not_found: '批次不存在或已删除，请刷新后重试。',
  no_match: '没有找到同时匹配当前批次店铺、站点、SKU 的 1688 来源。',
  ambiguous_match: '匹配到多条来源，请收窄订单号、offer_id、sku_id 后重试。'
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
  const [batchRecord, setBatchRecord] = useState<Ali1688SkuPurchaseHistoryItem | null>(null)
  const [batchDraftsBySku, setBatchDraftsBySku] = useState<Record<string, PurchaseBatch[]>>({})
  const historyRequestSeqRef = useRef(0)

  async function loadHistory(nextQuery: Ali1688SkuPurchaseHistoryQuery = query) {
    const requestSeq = historyRequestSeqRef.current + 1
    historyRequestSeqRef.current = requestSeq
    setLoading(true)
    try {
      setQuery(nextQuery)
      const nextView = await loadAli1688SkuPurchaseHistory(nextQuery)
      if (requestSeq !== historyRequestSeqRef.current) {
        return
      }
      setView(nextView)
    } catch (error) {
      if (requestSeq !== historyRequestSeqRef.current) {
        return
      }
      message.error(error instanceof Error ? error.message : '读取 SKU 采购历史失败')
      setView(EMPTY_VIEW)
    } finally {
      if (requestSeq === historyRequestSeqRef.current) {
        setLoading(false)
      }
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

  function batchesForRecord(record: Ali1688SkuPurchaseHistoryItem) {
    return batchDraftsBySku[skuPurchaseHistoryRowKey(record)] || buildPurchaseBatchesFromRecord(record)
  }

  async function savePurchaseBatches(record: Ali1688SkuPurchaseHistoryItem, batches: PurchaseBatch[]) {
    await saveAli1688SkuPurchaseBatches({
      storeCode: record.storeCode,
      siteCode: record.siteCode,
      skuParent: record.skuParent,
      partnerSku: record.partnerSku,
      pskuCode: record.pskuCode,
      batches: batches.map((batch) => ({
        label: batch.label,
        countedQuantity: batch.countedQuantity,
        countedCost: batch.countedCost,
        note: batch.note,
        sources: batch.sources.map((source) => ({
          orderId: source.orderId,
          itemId: source.itemId,
          assignmentId: source.assignmentId,
          orderNo: source.orderNo,
          orderTime: source.orderTime,
          supplierName: source.supplierName
        }))
      }))
    })
    const rowKey = skuPurchaseHistoryRowKey(record)
    setBatchDraftsBySku((current) => {
      return {
        ...current,
        [rowKey]: relabelPurchaseBatches(clonePurchaseBatches(batches))
      }
    })
    message.success('采购批次已保存')
  }

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
        <PurchaseHistoryCell record={record} batches={batchesForRecord(record)} onOpenBatches={() => setBatchRecord(record)} />
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

  function submitSearch() {
    void loadHistory(buildQuery(filters, 1, query.pageSize || 20))
  }

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
  const visiblePsku = displayText(record.partnerSku)
  const visibleSku = displayText(record.skuParent)
  const titleCn = displayOptionalText(record.productTitleCn)
  return (
    <div className="ali1688-sku-product-cell">
      <SkuProductThumbnail src={record.productImageUrl} alt={title} linked={record.linkStatus !== 'unlinked'} />
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

function SkuProductThumbnail({ src, alt, linked }: { src?: string; alt: string; linked?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false)
  const normalizedSrc = normalizeNoonImageUrl(src)

  useEffect(() => {
    setImageFailed(false)
  }, [normalizedSrc])

  if (!normalizedSrc || imageFailed) {
    return <span className={skuProductThumbnailClassName('ali1688-sku-product-thumbnail-placeholder', linked)}>无图</span>
  }
  return (
    <span className={skuProductThumbnailClassName('ali1688-sku-product-thumbnail', linked)}>
      <img src={normalizedSrc} alt={alt} onError={() => setImageFailed(true)} />
    </span>
  )
}

function skuProductThumbnailClassName(baseClassName: string, linked?: boolean) {
  return linked ? `${baseClassName} ${baseClassName}--linked` : baseClassName
}

function PurchaseHistoryCell({
  record,
  batches,
  onOpenBatches
}: {
  record: Ali1688SkuPurchaseHistoryItem
  batches: PurchaseBatch[]
  onOpenBatches: () => void
}) {
  const latest = getLatestPurchaseBatch(batches)
  const content = (
    <div className="ali1688-sku-history-popover">
      {batches.slice(0, 8).map((batch) => (
        <div key={batch.id} className="ali1688-sku-history-popover-row">
          <Text strong>{batch.label} · {formatCurrency(purchaseBatchUnitPrice(batch))}</Text>
          <Text type="secondary">
            {displayText(purchaseBatchLatestOrderTime(batch))} · {displayText(purchaseBatchSupplierNames(batch).join('、'))}
          </Text>
          <Text type="secondary">来源订单</Text>
          {purchaseBatchOrderNos(batch).map((orderNo) => (
            <Text key={orderNo} type="secondary">
              {orderNo}
            </Text>
          ))}
          <Text type="secondary">
            计入数量 {formatNumberText(batch.countedQuantity)} · 计入成本 {formatCurrency(batch.countedCost)}
          </Text>
        </div>
      ))}
      {!batches.length ? <Text type="secondary">暂无采购历史摘要</Text> : null}
    </div>
  )

  return (
    <div className="ali1688-sku-history-cell">
      <Popover title="采购历史摘要" content={content} placement="topLeft">
        <div
          className="ali1688-sku-history-summary"
          data-testid={`sku-purchase-history-summary-${record.skuParent || 'unknown'}`}
        >
          <Text strong>{latest ? formatCurrency(purchaseBatchUnitPrice(latest)) : '未返回信息'}</Text>
          <Text type="secondary">{latest ? displayText(purchaseBatchLatestOrderTime(latest)) : '暂无最近采购'}</Text>
          <Text type="secondary">
            {latest ? displayText(purchaseBatchSupplierNames(latest).join('、')) : '暂无供应商'}
          </Text>
          <Text type="secondary">{latest ? `来源 ${displayText(purchaseBatchOrderNos(latest).join('、'))}` : '无订单号'}</Text>
        </div>
      </Popover>
      <Button size="small" onClick={onOpenBatches} disabled={!batches.length}>
        批次明细
      </Button>
    </div>
  )
}

function PurchaseTrendCell({
  record,
  batches,
  metrics,
  onOpen
}: {
  record: Ali1688SkuPurchaseHistoryItem
  batches: PurchaseBatch[]
  metrics: PurchaseBatchMetrics
  onOpen: () => void
}) {
  const points = getReadyPurchaseBatchPoints(batches).map((batch) => purchaseBatchUnitPrice(batch) ?? 0)
  return (
    <div className="ali1688-sku-trend-cell">
      <Sparkline points={points} skuParent={record.skuParent} onOpen={onOpen} />
      <Space size={8} wrap>
        <Text type="secondary">最低 {formatCurrency(metrics.lowestUnitPrice)}</Text>
        <Text type="secondary">最高 {formatCurrency(metrics.highestUnitPrice)}</Text>
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

function PurchaseSummaryCell({ metrics }: { metrics: PurchaseBatchMetrics }) {
  return (
    <div className="ali1688-sku-summary-cell">
      <Text strong>采购次数: {metrics.purchaseCount}</Text>
      <Text>采购总费用: {formatCurrency(metrics.totalCost)}</Text>
      <Text>采购总件数: {formatNumberText(metrics.totalQuantity)}</Text>
      <Text type="secondary">平均采购单价: {formatCurrency(metrics.averageUnitPrice)}</Text>
      <Text type="secondary">最近采购单价: {formatCurrency(metrics.recentUnitPrice)}</Text>
      <Text type="secondary">最近采购时间: {displayText(metrics.recentPurchaseTime)}</Text>
    </div>
  )
}

function TrendDetailDrawer({
  record,
  batches,
  onClose
}: {
  record: Ali1688SkuPurchaseHistoryItem | null
  batches: PurchaseBatch[]
  onClose: () => void
}) {
  const metrics = calculatePurchaseBatchMetrics(batches)
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
            <Tag color="red">最高采购单价: {formatCurrency(metrics.highestUnitPrice)}</Tag>
            <Tag color="blue">最低采购单价: {formatCurrency(metrics.lowestUnitPrice)}</Tag>
            <Tag>{displayText(record.storeCode)} · {displayText(record.siteCode)}</Tag>
          </Space>
          <LargePriceTrendChart batches={batches} />
          <Table<PurchaseBatch>
            rowKey={(item) => item.id}
            size="small"
            pagination={false}
            dataSource={batches}
            scroll={{ x: 780 }}
            columns={[
              {
                title: '批次',
                dataIndex: 'label',
                width: 90,
                render: (value) => displayText(value)
              },
              {
                title: '采购时间',
                width: 150,
                render: (_: unknown, batch) => displayText(purchaseBatchLatestOrderTime(batch))
              },
              {
                title: '来源订单',
                width: 180,
                render: (_: unknown, batch) => displayText(purchaseBatchOrderNos(batch).join('、'))
              },
              {
                title: '供应商',
                width: 180,
                render: (_: unknown, batch) => displayText(purchaseBatchSupplierNames(batch).join('、'))
              },
              {
                title: '采购数量',
                width: 90,
                render: (_: unknown, batch) => formatNumberText(batch.countedQuantity)
              },
              {
                title: '分摊金额',
                width: 110,
                render: (_: unknown, batch) => formatCurrency(batch.countedCost)
              },
              {
                title: '采购单价',
                width: 110,
                render: (_: unknown, batch) => formatCurrency(purchaseBatchUnitPrice(batch))
              },
              {
                title: '价格状态',
                width: 120,
                render: (_: unknown, batch) => priceQualityTag(purchaseBatchPriceQuality(batch))
              }
            ]}
          />
        </div>
      ) : null}
    </Drawer>
  )
}

function PurchaseBatchDrawer({
  record,
  batches,
  onClose,
  onSaveBatches
}: {
  record: Ali1688SkuPurchaseHistoryItem | null
  batches: PurchaseBatch[]
  onClose: () => void
  onSaveBatches: (record: Ali1688SkuPurchaseHistoryItem, batches: PurchaseBatch[]) => Promise<void>
}) {
  const [selectedSourceKeys, setSelectedSourceKeys] = useState<string[]>([])
  const [draftBatches, setDraftBatches] = useState<PurchaseBatch[]>([])
  const [saving, setSaving] = useState(false)
  const [sourceMatchBatchKey, setSourceMatchBatchKey] = useState<string | null>(null)
  const [sourceMatchForm, setSourceMatchForm] = useState<SourceMatchFormState>(EMPTY_SOURCE_MATCH_FORM)
  const [sourceMatchPreview, setSourceMatchPreview] = useState<Ali1688SkuPurchaseBatchSourceMatchPreviewResult | null>(null)
  const [sourceMatchLoading, setSourceMatchLoading] = useState(false)
  const [sourceMatchSaving, setSourceMatchSaving] = useState(false)
  const sources = record ? buildPurchaseBatchSources(record) : []
  const selectedKeySet = new Set(selectedSourceKeys)
  const metrics = calculatePurchaseBatchMetrics(draftBatches)
  const sourceMatchBatch = sourceMatchBatchKey
    ? draftBatches.find((batch) => batch.id === sourceMatchBatchKey) || null
    : null
  const sourceMatchCandidate = sourceMatchPreview?.rejectionReason
    ? undefined
    : sourceMatchPreview?.candidates?.[0]

  useEffect(() => {
    setSelectedSourceKeys([])
    setDraftBatches(clonePurchaseBatches(batches))
    setSourceMatchBatchKey(null)
    setSourceMatchForm(EMPTY_SOURCE_MATCH_FORM)
    setSourceMatchPreview(null)
  }, [batches, record])

  function toggleSource(sourceKey: string, checked: boolean) {
    setSelectedSourceKeys((current) => {
      if (checked) {
        return current.includes(sourceKey) ? current : [...current, sourceKey]
      }
      return current.filter((key) => key !== sourceKey)
    })
  }

  function mergeSelectedSources() {
    if (!record) {
      return
    }
    const selectedKeys = new Set(selectedSourceKeys)
    const selectedSources = sources.filter((source) => selectedKeys.has(source.key))
    if (!selectedSources.length) {
      message.warning('请先选择要合并的订单')
      return
    }
    setDraftBatches((current) => {
      const untouchedBatches = current.filter(
        (batch) => !batch.sources.some((source) => selectedKeys.has(source.key))
      )
      const mergedBatch = createPurchaseBatchFromSources(`merged-${selectedSourceKeys.join('-')}`, selectedSources)
      return relabelPurchaseBatches([mergedBatch, ...untouchedBatches])
    })
    setSelectedSourceKeys([])
  }

  function updateDraftBatch(
    batchId: string,
    patch: Partial<Pick<PurchaseBatch, 'countedQuantity' | 'countedCost' | 'note'>>
  ) {
    setDraftBatches((current) =>
      current.map((batch) => (batch.id === batchId ? { ...batch, ...patch } : batch))
    )
  }

  function openSourceMatch(batch: PurchaseBatch) {
    if (!record) {
      return
    }
    if (!batch.batchId) {
      message.warning('请先保存批次并刷新后再匹配来源')
      return
    }
    setSourceMatchBatchKey(batch.id)
    setSourceMatchForm({
      orderNo: purchaseBatchOrderNos(batch)[0] || '',
      offerId: displayOptionalText(record.sourceOfferId) || '',
      skuId: displayOptionalText(record.sourceSkuId) || ''
    })
    setSourceMatchPreview(null)
  }

  function closeSourceMatch() {
    setSourceMatchBatchKey(null)
    setSourceMatchForm(EMPTY_SOURCE_MATCH_FORM)
    setSourceMatchPreview(null)
    setSourceMatchLoading(false)
    setSourceMatchSaving(false)
  }

  function updateSourceMatchForm(field: keyof SourceMatchFormState, value: string) {
    setSourceMatchForm((current) => ({ ...current, [field]: value }))
    setSourceMatchPreview(null)
  }

  async function previewSourceMatch() {
    if (!sourceMatchBatch?.batchId) {
      return
    }
    setSourceMatchLoading(true)
    try {
      const result = await previewAli1688SkuPurchaseBatchSourceMatch({
        batchId: sourceMatchBatch.batchId,
        orderNo: sourceMatchForm.orderNo.trim(),
        offerId: sourceMatchForm.offerId.trim(),
        skuId: sourceMatchForm.skuId.trim()
      })
      setSourceMatchPreview(result)
      if (result.rejectionReason) {
        message.warning(sourceMatchRejectionMessage(result.rejectionReason))
      } else {
        message.success('已找到唯一来源')
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '匹配 1688 来源失败')
    } finally {
      setSourceMatchLoading(false)
    }
  }

  async function saveSourceMatch() {
    if (!sourceMatchBatch?.batchId || !sourceMatchCandidate) {
      return
    }
    const batchToUpdate = sourceMatchBatch
    setSourceMatchSaving(true)
    try {
      const result = await saveAli1688SkuPurchaseBatchSourceMatch({
        batchId: batchToUpdate.batchId,
        sources: [sourceMatchCandidateToBatchSource(sourceMatchCandidate)]
      })
      const nextSource = purchaseBatchSourceFromMatchCandidate(sourceMatchCandidate, 0)
      setDraftBatches((current) =>
        current.map((batch) => (batch.id === batchToUpdate.id ? { ...batch, sources: [nextSource] } : batch))
      )
      message.success(`来源已保存，替换 ${result.replacedSourceCount} 条旧来源`)
      closeSourceMatch()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存 1688 来源失败')
    } finally {
      setSourceMatchSaving(false)
    }
  }

  async function saveDraftBatches() {
    if (!record) {
      return
    }
    setSaving(true)
    try {
      await onSaveBatches(record, draftBatches)
      onClose()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存 SKU 采购批次失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      title={`采购批次 · ${displayText(record?.skuParent)}`}
      open={Boolean(record)}
      onClose={onClose}
      width={1120}
      destroyOnClose
    >
      {record ? (
        <div className="ali1688-sku-batch-drawer">
          <div className="ali1688-sku-batch-toolbar">
            <Text strong>
              批次汇总: 采购次数 {metrics.purchaseCount} · 总费用 {formatCurrency(metrics.totalCost)} · 总件数{' '}
              {formatNumberText(metrics.totalQuantity)}
            </Text>
            <Space>
              <Button onClick={mergeSelectedSources} disabled={!selectedSourceKeys.length}>
                合并为批次
              </Button>
              <Button aria-label="保存" type="primary" loading={saving} onClick={() => void saveDraftBatches()}>
                保存
              </Button>
              <Button aria-label="关闭" onClick={onClose}>关闭</Button>
            </Space>
          </div>

          <section className="ali1688-sku-batch-section">
            <Text strong>来源订单</Text>
            <div className="ali1688-sku-batch-table-wrap" data-testid="sku-purchase-batch-source-table">
              <table className="ali1688-sku-batch-table">
                <thead>
                  <tr>
                    <th aria-label="选择订单" />
                    <th>订单号</th>
                    <th>采购时间</th>
                    <th>供应商</th>
                    <th>原始数量</th>
                    <th>原始成本</th>
                    <th>原始单价</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => (
                    <tr key={source.key}>
                      <td>
                        <Checkbox
                          aria-label={`选择 ${displayText(source.orderNo)}`}
                          checked={selectedKeySet.has(source.key)}
                          onChange={(event) => toggleSource(source.key, event.target.checked)}
                        />
                      </td>
                      <td>{displayText(source.orderNo)}</td>
                      <td>{displayText(source.orderTime)}</td>
                      <td>{displayText(source.supplierName)}</td>
                      <td>{formatNumberText(source.assignedQuantity)}</td>
                      <td>{formatCurrency(source.allocatedCost)}</td>
                      <td>{formatCurrency(source.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="ali1688-sku-batch-section">
            <Text strong>采购批次</Text>
            <div className="ali1688-sku-batch-table-wrap">
              <table className="ali1688-sku-batch-table ali1688-sku-batch-edit-table">
                <thead>
                  <tr>
                    <th>批次</th>
                    <th>来源订单</th>
                    <th>计入 SKU 数量</th>
                    <th>计入 SKU 成本</th>
                    <th>批次单价</th>
                    <th>备注</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {draftBatches.map((batch) => (
                    <tr key={batch.id}>
                      <td>
                        <Text strong>{batch.label}</Text>
                        <Text type="secondary" className="ali1688-sku-batch-order-count">
                          {batch.sources.length} 单
                        </Text>
                      </td>
                      <td>{displayText(purchaseBatchOrderNos(batch).join('、'))}</td>
                      <td>
                        <InputNumber
                          aria-label={`${batch.label} 计入 SKU 数量`}
                          min={0}
                          precision={0}
                          step={1}
                          value={batch.countedQuantity ?? undefined}
                          onChange={(value) => updateDraftBatch(batch.id, { countedQuantity: normalizeNullableInteger(value) })}
                        />
                      </td>
                      <td>
                        <InputNumber
                          aria-label={`${batch.label} 计入 SKU 成本`}
                          min={0}
                          precision={2}
                          value={batch.countedCost ?? undefined}
                          onChange={(value) => updateDraftBatch(batch.id, { countedCost: normalizeNullableNumber(value) })}
                        />
                      </td>
                      <td>{formatCurrency(purchaseBatchUnitPrice(batch))}</td>
                      <td>
                        <Input
                          aria-label={`${batch.label} 备注`}
                          value={batch.note || ''}
                          onChange={(event) => updateDraftBatch(batch.id, { note: event.target.value })}
                        />
                      </td>
                      <td>
                        <Tooltip title={batch.batchId ? '匹配 1688 历史订单来源' : '新批次需先保存并刷新后再匹配来源'}>
                          <span>
                            <Button
                              size="small"
                              disabled={!batch.batchId}
                              onClick={() => openSourceMatch(batch)}
                            >
                              匹配来源
                            </Button>
                          </span>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <Modal
            title={`匹配 1688 来源 · ${displayText(sourceMatchBatch?.label)}`}
            open={Boolean(sourceMatchBatch)}
            okText="保存来源"
            cancelText="关闭"
            width={720}
            destroyOnClose
            confirmLoading={sourceMatchSaving}
            okButtonProps={{ disabled: !sourceMatchCandidate }}
            onOk={() => void saveSourceMatch()}
            onCancel={closeSourceMatch}
          >
            <div className="ali1688-sku-source-match-modal">
              <div className="ali1688-sku-source-match-form">
                <label>
                  <Text type="secondary">订单号</Text>
                  <Input
                    aria-label="匹配订单号"
                    value={sourceMatchForm.orderNo}
                    onChange={(event) => updateSourceMatchForm('orderNo', event.target.value)}
                  />
                </label>
                <label>
                  <Text type="secondary">offer_id</Text>
                  <Input
                    aria-label="匹配 offer_id"
                    value={sourceMatchForm.offerId}
                    onChange={(event) => updateSourceMatchForm('offerId', event.target.value)}
                  />
                </label>
                <label>
                  <Text type="secondary">sku_id</Text>
                  <Input
                    aria-label="匹配 sku_id"
                    value={sourceMatchForm.skuId}
                    onChange={(event) => updateSourceMatchForm('skuId', event.target.value)}
                  />
                </label>
                <Button
                  type="primary"
                  loading={sourceMatchLoading}
                  disabled={!sourceMatchBatch?.batchId}
                  onClick={() => void previewSourceMatch()}
                >
                  预览匹配
                </Button>
              </div>
              {sourceMatchPreview?.rejectionReason ? (
                <Alert
                  type="warning"
                  showIcon
                  message={sourceMatchRejectionMessage(sourceMatchPreview.rejectionReason)}
                />
              ) : null}
              {sourceMatchCandidate ? (
                <div className="ali1688-sku-source-match-candidate">
                  <Text strong>唯一命中来源</Text>
                  <dl>
                    <div>
                      <dt>订单号</dt>
                      <dd>{displayText(sourceMatchCandidate.orderNo)}</dd>
                    </div>
                    <div>
                      <dt>采购时间</dt>
                      <dd>{displayText(sourceMatchCandidate.orderTime)}</dd>
                    </div>
                    <div>
                      <dt>供应商</dt>
                      <dd>{displayText(sourceMatchCandidate.supplierName)}</dd>
                    </div>
                    <div>
                      <dt>分配数量</dt>
                      <dd>{formatNumberText(sourceMatchCandidate.assignedQuantity)}</dd>
                    </div>
                  </dl>
                </div>
              ) : null}
            </div>
          </Modal>
        </div>
      ) : null}
    </Drawer>
  )
}

function LargePriceTrendChart({ batches }: { batches: PurchaseBatch[] }) {
  const option = useMemo(() => buildPurchaseBatchPriceTrendOption(batches), [batches])

  return (
    <EChartPanel
      ariaLabel="采购单价趋势图表"
      className="ali1688-sku-trend-chart-panel"
      emptyText="暂无可计算价格点"
      height={280}
      option={option}
      state={option ? 'ready' : 'empty'}
      testId="sku-purchase-price-trend-chart"
    />
  )
}

function buildPurchaseBatchPriceTrendOption(batches: PurchaseBatch[]): EChartsCoreOption | null {
  const chartPoints = getReadyPurchaseBatchPoints(batches)
    .map((batch) => ({
      batch,
      value: purchaseBatchUnitPrice(batch)
    }))
    .filter((point): point is { batch: PurchaseBatch; value: number } => point.value !== null)

  if (!chartPoints.length) {
    return null
  }

  const values = chartPoints.map((point) => point.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const allSameValue = max === min
  const axisPadding = Math.max((max - min) * 0.18, max * 0.04, 0.05)
  const yMin = Math.max(0, min - axisPadding)
  const yMax = max + axisPadding
  const axisLabels = chartPoints.map((point) => purchaseBatchChartLabel(point.batch))

  return {
    grid: {
      bottom: 28,
      containLabel: true,
      left: 8,
      right: 22,
      top: 28
    },
    tooltip: {
      axisPointer: {
        lineStyle: {
          color: '#94a3b8',
          type: 'dashed'
        },
        type: 'line'
      },
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: 'rgba(15, 23, 42, 0.08)',
      borderRadius: 8,
      borderWidth: 1,
      confine: true,
      extraCssText: 'box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);',
      formatter: (params: unknown) => {
        const item = Array.isArray(params) ? params[0] : params
        const dataIndex = typeof item === 'object' && item && 'dataIndex' in item ? Number((item as { dataIndex: number }).dataIndex) : 0
        const point = chartPoints[dataIndex]
        if (!point) {
          return ''
        }
        const orderNos = purchaseBatchOrderNos(point.batch).join('、')
        const supplierNames = purchaseBatchSupplierNames(point.batch).join('、')
        return `
          <div style="font-weight:600;color:#111827;margin-bottom:6px;">${escapeChartHtml(point.batch.label)}</div>
          <div style="color:#64748b;margin-bottom:6px;">${escapeChartHtml(displayText(purchaseBatchLatestOrderTime(point.batch)))}</div>
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;color:#475569;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:#2563eb;"></span>
            <span>采购单价</span>
            <span style="font-weight:700;color:#111827;">${escapeChartHtml(formatCurrency(point.value))}</span>
          </div>
          <div style="color:#64748b;">数量 ${escapeChartHtml(formatNumberText(point.batch.countedQuantity))} · 成本 ${escapeChartHtml(formatCurrency(point.batch.countedCost))}</div>
          <div style="color:#64748b;">订单 ${escapeChartHtml(displayText(orderNos))}</div>
          <div style="color:#64748b;">供应商 ${escapeChartHtml(displayText(supplierNames))}</div>
        `
      },
      padding: [10, 12],
      trigger: 'axis'
    },
    xAxis: {
      axisLabel: {
        color: '#64748b',
        hideOverlap: true
      },
      axisLine: {
        lineStyle: {
          color: '#cbd5e1'
        }
      },
      axisTick: {
        show: false
      },
      boundaryGap: false,
      data: axisLabels,
      type: 'category'
    },
    yAxis: {
      axisLabel: {
        color: '#64748b',
        formatter: (value: number) => `¥${Number(value).toFixed(2)}`
      },
      axisTick: {
        show: false
      },
      max: Number(yMax.toFixed(2)),
      min: Number(yMin.toFixed(2)),
      name: '采购单价',
      nameTextStyle: {
        color: '#64748b',
        fontWeight: 600,
        padding: [0, 0, 0, 34]
      },
      splitLine: {
        lineStyle: {
          color: '#e5e7eb',
          type: 'dashed'
        }
      },
      type: 'value'
    },
    series: [
      {
        data: chartPoints.map((point) => {
          const isMax = !allSameValue && point.value === max
          const isMin = !allSameValue && point.value === min
          return {
            itemStyle: {
              borderColor: '#ffffff',
              borderWidth: 2,
              color: isMax ? '#dc2626' : isMin ? '#2563eb' : '#0f766e'
            },
            symbolSize: isMax || isMin ? 9 : 7,
            value: Number(point.value.toFixed(4))
          }
        }),
        emphasis: {
          focus: 'series'
        },
        lineStyle: {
          color: '#2563eb',
          width: 2.5
        },
        name: '采购单价',
        showSymbol: true,
        smooth: false,
        symbol: 'circle',
        type: 'line'
      }
    ]
  }
}

function purchaseBatchChartLabel(batch: PurchaseBatch) {
  const latestTime = purchaseBatchLatestOrderTime(batch)
  if (!latestTime) {
    return batch.label
  }
  const match = latestTime.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const dateLabel = match ? `${match[2]}-${match[3]}` : latestTime
  return `${dateLabel}\n${batch.label}`
}

function escapeChartHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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
  const productKey = record.partnerSku || record.skuParent || ''
  if (record.linkStatus === 'unlinked') {
    return `${record.storeCode || ''}-${record.siteCode || ''}-unlinked-${productKey || record.assignmentId || record.itemId || record.orderNo || ''}`
  }
  return `${record.storeCode || ''}-${record.siteCode || ''}-${productKey}`
}

function buildPurchaseBatchSources(record: Ali1688SkuPurchaseHistoryItem) {
  return (record.history || []).map((item, index): PurchaseBatchSource => ({
    key: purchaseHistorySourceKey(item, index),
    orderId: item.orderId,
    itemId: item.itemId,
    assignmentId: item.assignmentId,
    orderNo: item.orderNo,
    orderTime: item.orderTime,
    supplierName: item.supplierName,
    assignedQuantity: item.assignedQuantity,
    allocatedCost: item.allocatedCost,
    unitPrice: item.unitPrice,
    amountBasis: item.amountBasis,
    priceQuality: item.priceQuality
  }))
}

function purchaseHistorySourceKey(item: Ali1688SkuPurchaseHistoryRecord, index: number) {
  return [
    item.assignmentId ? `assignment-${item.assignmentId}` : '',
    item.orderId ? `order-${item.orderId}` : '',
    item.itemId ? `item-${item.itemId}` : '',
    item.orderNo ? `no-${item.orderNo}` : '',
    `row-${index}`
  ]
    .filter(Boolean)
    .join('-')
}

function buildDefaultPurchaseBatches(record: Ali1688SkuPurchaseHistoryItem) {
  return relabelPurchaseBatches(
    buildPurchaseBatchSources(record).map((source) => createPurchaseBatchFromSources(`default-${source.key}`, [source]))
  )
}

function buildPurchaseBatchesFromRecord(record: Ali1688SkuPurchaseHistoryItem) {
  const persistedBatches = record.purchaseBatches || []
  if (!persistedBatches.length) {
    return buildDefaultPurchaseBatches(record)
  }
  return persistedBatches.map((batch, index) => purchaseBatchFromPersistedBatch(batch, index))
}

function purchaseBatchFromPersistedBatch(
  batch: Ali1688SkuPurchaseHistoryBatch,
  index: number
): PurchaseBatch {
  const label = displayOptionalText(batch.label) || `批次 ${index + 1}`
  return {
    id: batch.id ? `persisted-${batch.id}` : `persisted-${index + 1}`,
    batchId: batch.id,
    label,
    sources: (batch.sources || []).map((source, sourceIndex) => persistedPurchaseBatchSource(source, sourceIndex)),
    countedQuantity: normalizeNullableInteger(batch.countedQuantity ?? null),
    countedCost: normalizeNullableNumber(batch.countedCost ?? null),
    note: batch.note
  }
}

function persistedPurchaseBatchSource(
  source: Ali1688SkuPurchaseHistoryBatchSource,
  index: number
): PurchaseBatchSource {
  return {
    key: persistedPurchaseBatchSourceKey(source, index),
    orderId: source.orderId,
    itemId: source.itemId,
    assignmentId: source.assignmentId,
    orderNo: source.orderNo,
    orderTime: source.orderTime,
    supplierName: source.supplierName
  }
}

function persistedPurchaseBatchSourceKey(source: Ali1688SkuPurchaseHistoryBatchSource, index: number) {
  return [
    source.assignmentId ? `assignment-${source.assignmentId}` : '',
    source.orderId ? `order-${source.orderId}` : '',
    source.itemId ? `item-${source.itemId}` : '',
    source.orderNo ? `no-${source.orderNo}` : '',
    `persisted-${index}`
  ]
    .filter(Boolean)
    .join('-')
}

function sourceMatchCandidateToBatchSource(
  candidate: Ali1688SkuPurchaseBatchSourceMatchCandidate
): Ali1688SkuPurchaseHistoryBatchSource {
  return {
    orderId: candidate.orderId,
    itemId: candidate.itemId,
    assignmentId: candidate.assignmentId,
    orderNo: candidate.orderNo,
    orderTime: candidate.orderTime,
    supplierName: candidate.supplierName
  }
}

function purchaseBatchSourceFromMatchCandidate(
  candidate: Ali1688SkuPurchaseBatchSourceMatchCandidate,
  index: number
): PurchaseBatchSource {
  return {
    key: sourceMatchCandidateKey(candidate, index),
    orderId: candidate.orderId,
    itemId: candidate.itemId,
    assignmentId: candidate.assignmentId,
    orderNo: candidate.orderNo,
    orderTime: candidate.orderTime,
    supplierName: candidate.supplierName,
    assignedQuantity: candidate.assignedQuantity
  }
}

function sourceMatchCandidateKey(candidate: Ali1688SkuPurchaseBatchSourceMatchCandidate, index: number) {
  return [
    candidate.assignmentId ? `assignment-${candidate.assignmentId}` : '',
    candidate.orderId ? `order-${candidate.orderId}` : '',
    candidate.itemId ? `item-${candidate.itemId}` : '',
    candidate.orderNo ? `no-${candidate.orderNo}` : '',
    `source-match-${index}`
  ]
    .filter(Boolean)
    .join('-')
}

function createPurchaseBatchFromSources(id: string, sources: PurchaseBatchSource[]): PurchaseBatch {
  return {
    id,
    label: '批次',
    sources,
    countedQuantity: sumSourceNumbers(sources, 'assignedQuantity'),
    countedCost: sumSourceNumbers(sources, 'allocatedCost')
  }
}

function relabelPurchaseBatches(batches: PurchaseBatch[]) {
  return batches.map((batch, index) => ({
    ...batch,
    label: `批次 ${index + 1}`
  }))
}

function clonePurchaseBatches(batches: PurchaseBatch[]) {
  return batches.map((batch) => ({
    ...batch,
    sources: batch.sources.map((source) => ({ ...source }))
  }))
}

function sumSourceNumbers(sources: PurchaseBatchSource[], field: 'assignedQuantity' | 'allocatedCost') {
  let hasValue = false
  const total = sources.reduce((sum, source) => {
    const parsed = parseNumberValue(source[field])
    if (parsed === null) {
      return sum
    }
    hasValue = true
    return sum + parsed
  }, 0)
  return hasValue ? total : null
}

function normalizeNullableNumber(value: string | number | null) {
  if (value === null) {
    return null
  }
  return parseNumberValue(value)
}

function normalizeNullableInteger(value: string | number | null) {
  const parsed = normalizeNullableNumber(value)
  return parsed === null ? null : Math.round(parsed)
}

function parseNumberValue(value?: string | number | null) {
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

function purchaseBatchOrderNos(batch: PurchaseBatch) {
  return uniqueNonEmpty(batch.sources.map((source) => source.orderNo))
}

function purchaseBatchSupplierNames(batch: PurchaseBatch) {
  return uniqueNonEmpty(batch.sources.map((source) => source.supplierName))
}

function uniqueNonEmpty(values: Array<string | number | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => (value === undefined || value === null ? '' : String(value).trim()))
        .filter(Boolean)
    )
  )
}

function purchaseBatchLatestOrderTime(batch: PurchaseBatch) {
  return batch.sources
    .map((source) => displayOptionalText(source.orderTime))
    .filter((value): value is string => Boolean(value))
    .sort()
    .reverse()[0]
}

function purchaseBatchUnitPrice(batch: PurchaseBatch) {
  if (batch.countedCost === null || batch.countedQuantity === null || batch.countedQuantity <= 0) {
    return null
  }
  return batch.countedCost / batch.countedQuantity
}

function purchaseBatchPriceQuality(batch: PurchaseBatch) {
  if (purchaseBatchUnitPrice(batch) === null || batch.sources.some((source) => source.priceQuality === 'missing_price_basis')) {
    return 'missing_price_basis'
  }
  return 'ready'
}

function calculatePurchaseBatchMetrics(batches: PurchaseBatch[]): PurchaseBatchMetrics {
  const totalQuantity = sumBatchNumbers(batches, 'countedQuantity')
  const totalCost = sumBatchNumbers(batches, 'countedCost')
  const unitPrices = batches
    .map((batch) => purchaseBatchUnitPrice(batch))
    .filter((value): value is number => value !== null)
  const latestBatch = getLatestPurchaseBatch(batches.filter((batch) => purchaseBatchUnitPrice(batch) !== null))
  return {
    purchaseCount: batches.length,
    totalQuantity,
    totalCost,
    averageUnitPrice: totalQuantity && totalCost !== null ? totalCost / totalQuantity : null,
    recentUnitPrice: latestBatch ? purchaseBatchUnitPrice(latestBatch) : null,
    recentPurchaseTime: latestBatch ? purchaseBatchLatestOrderTime(latestBatch) : undefined,
    lowestUnitPrice: unitPrices.length ? Math.min(...unitPrices) : null,
    highestUnitPrice: unitPrices.length ? Math.max(...unitPrices) : null
  }
}

function sumBatchNumbers(batches: PurchaseBatch[], field: 'countedQuantity' | 'countedCost') {
  let hasValue = false
  const total = batches.reduce((sum, batch) => {
    const value = batch[field]
    if (value === null) {
      return sum
    }
    hasValue = true
    return sum + value
  }, 0)
  return hasValue ? total : null
}

function getLatestPurchaseBatch(batches: PurchaseBatch[]) {
  return batches
    .slice()
    .sort((left, right) => compareText(purchaseBatchLatestOrderTime(right), purchaseBatchLatestOrderTime(left)))[0]
}

function getReadyPurchaseBatchPoints(batches: PurchaseBatch[]) {
  return batches
    .filter((batch) => purchaseBatchPriceQuality(batch) !== 'missing_price_basis' && purchaseBatchUnitPrice(batch) !== null)
    .slice()
    .sort((left, right) => compareText(purchaseBatchLatestOrderTime(left), purchaseBatchLatestOrderTime(right)))
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

function sourceMatchRejectionMessage(reason?: string | null) {
  if (!reason) {
    return '未找到可保存的来源。'
  }
  return SOURCE_MATCH_REJECTION_MESSAGES[reason] || `无法保存来源: ${reason}`
}

function formatNumberText(value?: string | number | null) {
  const normalized = value === undefined || value === null ? '' : String(value).trim()
  return normalized || '未返回信息'
}

function formatCurrency(value?: string | number | null) {
  const amount = parseAmount(value)
  return amount === null ? '未返回信息' : `¥${amount.toFixed(2)}`
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

function readyPricePointValue(item: Ali1688SkuPurchaseHistoryRecord) {
  if (item.priceQuality !== 'ready' && item.priceQuality !== 'ok') {
    return null
  }
  return parseAmount(item.unitPrice)
}

function compareText(left?: string | null, right?: string | null) {
  return displayText(left, '').localeCompare(displayText(right, ''), 'zh-Hans-CN')
}

function compareAmount(left?: string | number | null, right?: string | number | null) {
  return (parseAmount(left) ?? Number.NEGATIVE_INFINITY) - (parseAmount(right) ?? Number.NEGATIVE_INFINITY)
}
