import { Alert, Button, Drawer, Empty, Input, Select, Space, Table, Tabs, Tag, Tooltip, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import {
  loadOfficialWarehouseInboundStatistics,
  loadOfficialWarehouseProductInboundHistory,
  loadOfficialWarehouseStockStatistics
} from './statisticsApi'
import {
  buildCurrentStockWarehouseBreakdown,
  buildProductStockSourceChain,
  inferProductStockSourceByTotal,
  inboundStageLabel,
  normalizeOfficialWarehouseProductImageUrl,
  type ProductStockSourceChainSegment,
  productInboundHistoryNeedsReview,
  receiptStatusLabel,
} from './statisticsDomain'
import type {
  OfficialWarehouseInboundStatisticsView,
  OfficialWarehouseInboundStatisticsRow,
  OfficialWarehouseProductInboundHistoryView,
  OfficialWarehouseProductInboundReceiptRow,
  OfficialWarehouseStockStatisticsRow,
  OfficialWarehouseStockStatisticsView
} from './statisticsTypes'
import { officialWarehouseError } from './api'
import './OfficialWarehouseStatisticsPanel.css'

const { Text } = Typography

type OfficialWarehouseStatisticsPanelProps = {
  storeCode?: string
  siteCode?: string
  mode?: OfficialWarehouseStatisticsPanelMode
}

type OfficialWarehouseStatisticsTabKey = 'product' | 'inbound'
type OfficialWarehouseStatisticsPanelMode = 'all' | 'product' | 'inbound'

const EMPTY_STOCK_STATS: OfficialWarehouseStockStatisticsView = {
  summary: {
    effectiveStock: 0,
    currentStock: 0,
    returnStock: 0,
    failedOrExceptionStock: 0,
    pendingConfirmationStock: 0,
    skuCount: 0,
    exceptionSkuCount: 0
  },
  rows: []
}

const EMPTY_INBOUND_STATS: OfficialWarehouseInboundStatisticsView = {
  summary: {
    asnCount: 0,
    totalQuantity: 0,
    appointmentScheduledCount: 0,
    appointmentPendingCount: 0,
    appointmentFailedCount: 0,
    receivingAsnCount: 0,
    grnCompletedAsnCount: 0,
    failedAsnCount: 0,
    lineReceiptReportConnected: false,
    receiptLineCount: 0,
    expectedQuantity: 0,
    receivedQuantity: 0,
    qcFailedQuantity: 0,
    unidentifiedQuantity: 0,
    normalLineCount: 0,
    qcFailedLineCount: 0,
    shortReceivedLineCount: 0,
    overReceivedLineCount: 0,
    unidentifiedLineCount: 0,
    matchedLineCount: 0,
    noLocalAsnLineCount: 0,
    lineUnmatchedLineCount: 0,
    productUnmatchedLineCount: 0,
    receiptExceptionLineCount: 0,
    scheduledDeliveryAccuracyConnected: false,
    scheduledDeliveryAccuracyAsnCount: 0,
    scheduledQuantity: 0,
    grnQuantity: 0,
    inboundQuantityVariance: 0,
    putawayCompletedAsnCount: 0,
    cancelledAsnCount: 0,
    expiredAsnCount: 0,
    matchedScheduledDeliveryAccuracyAsnCount: 0,
    noLocalScheduledDeliveryAccuracyAsnCount: 0,
    scheduledDeliveryAccuracyExceptionAsnCount: 0
  },
  rows: []
}

const EMPTY_PRODUCT_INBOUND_HISTORY: OfficialWarehouseProductInboundHistoryView = {
  summary: {
    receiptLineCount: 0,
    expectedQuantity: 0,
    receivedQuantity: 0,
    qcFailedQuantity: 0,
    unidentifiedQuantity: 0,
    exceptionLineCount: 0
  },
  rows: [],
  sourceCandidates: []
}

export function OfficialWarehouseStatisticsPanel({ storeCode, siteCode, mode = 'all' }: OfficialWarehouseStatisticsPanelProps) {
  const visibleTabs = useMemo<OfficialWarehouseStatisticsTabKey[]>(
    () => (mode === 'product' ? ['product'] : mode === 'inbound' ? ['inbound'] : ['product', 'inbound']),
    [mode]
  )
  const [activeTab, setActiveTab] = useState<OfficialWarehouseStatisticsTabKey>(mode === 'inbound' ? 'inbound' : 'product')
  const [stockStats, setStockStats] = useState<OfficialWarehouseStockStatisticsView>(EMPTY_STOCK_STATS)
  const [inboundStats, setInboundStats] = useState<OfficialWarehouseInboundStatisticsView>(EMPTY_INBOUND_STATS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [stockKeyword, setStockKeyword] = useState('')
  const [inboundKeyword, setInboundKeyword] = useState('')
  const [stockBucket, setStockBucket] = useState<string | undefined>('SELLABLE')
  const [selectedStockRow, setSelectedStockRow] = useState<OfficialWarehouseStockStatisticsRow>()
  const [selectedSourceSegment, setSelectedSourceSegment] = useState<ProductStockSourceChainSegment>()
  const [productHistory, setProductHistory] = useState<OfficialWarehouseProductInboundHistoryView>(EMPTY_PRODUCT_INBOUND_HISTORY)
  const [historyLoading, setHistoryLoading] = useState(false)
  const currentTab = visibleTabs.includes(activeTab) ? activeTab : visibleTabs[0]
  const shouldShowProduct = visibleTabs.includes('product')
  const shouldShowInbound = visibleTabs.includes('inbound')
  const panelTitle = mode === 'inbound' ? '入仓单入仓核对' : ''
  const panelSubtitle =
    mode === 'inbound'
      ? '按 ASN / 入仓单查看预约、收货和入仓状态。'
      : ''

  useEffect(() => {
    void loadStatistics()
  }, [storeCode, siteCode, stockBucket, mode])

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0])
    }
  }, [activeTab, visibleTabs])

  async function loadStatistics() {
    if (!storeCode || !siteCode) {
      setStockStats(EMPTY_STOCK_STATS)
      setInboundStats(EMPTY_INBOUND_STATS)
      return
    }
    setLoading(true)
    setError(undefined)
    try {
      const [stock, inbound] = await Promise.all([
        shouldShowProduct
          ? loadOfficialWarehouseStockStatistics({ storeCode, siteCode, keyword: stockKeyword, stockBucket })
          : Promise.resolve(EMPTY_STOCK_STATS),
        shouldShowInbound
          ? loadOfficialWarehouseInboundStatistics({ storeCode, siteCode, keyword: inboundKeyword })
          : Promise.resolve(EMPTY_INBOUND_STATS)
      ])
      setStockStats(stock)
      setInboundStats(inbound)
    } catch (loadError) {
      const text = officialWarehouseError(loadError, '读取官方仓统计失败')
      setError(text)
      message.error(text)
    } finally {
      setLoading(false)
    }
  }

  async function openProductHistory(row: OfficialWarehouseStockStatisticsRow) {
    if (!storeCode || !siteCode || !row.productSiteOfferId) {
      message.warning('当前商品缺少站点 Offer，无法查看入仓历史')
      return
    }
    setSelectedStockRow(row)
    setProductHistory(EMPTY_PRODUCT_INBOUND_HISTORY)
    setHistoryLoading(true)
    try {
      const history = await loadOfficialWarehouseProductInboundHistory({
        storeCode,
        siteCode,
        productSiteOfferId: row.productSiteOfferId
      })
      setProductHistory(history)
    } catch (historyError) {
      const text = officialWarehouseError(historyError, '读取商品入仓历史失败')
      message.error(text)
    } finally {
      setHistoryLoading(false)
    }
  }

  function selectStockBucket(nextBucket?: string) {
    setStockBucket(nextBucket)
  }


  const stockColumns = useMemo<ColumnsType<OfficialWarehouseStockStatisticsRow>>(
    () => [
      {
        title: '商品详情',
        width: 300,
        render: (_, row) => {
          const psku = row.partnerSku || '-'
          const titleCn = row.titleCn?.trim() || (!row.titleEn?.trim() ? row.title?.trim() : '')
          const titleEn = row.titleEn || row.title || '-'
          return (
            <div className="official-warehouse-product-detail">
              <ProductThumb row={row} />
              <div className="official-warehouse-product-detail-copy">
                {titleCn ? (
                  <Text className="official-warehouse-product-title-cn" strong>
                    {titleCn}
                  </Text>
                ) : null}
                <Tooltip title={titleEn} placement="topLeft">
                  <Text className="official-warehouse-product-title-en" type="secondary">
                    {titleEn}
                  </Text>
                </Tooltip>
                <Tooltip title={`PSKU: ${psku}`} placement="topLeft">
                  <Text className="official-warehouse-product-psku" type="secondary">
                    {psku}
                  </Text>
                </Tooltip>
              </div>
            </div>
          )
        }
      },
      {
        title: '当前库存',
        dataIndex: 'currentStock',
        width: 210,
        render: (_, row) => <CurrentStockDetail row={row} />
      },
      {
        title: '库存来源',
        render: (_, row) => (
          <ProductStockSourcePreview
            row={row}
            storeCode={storeCode}
            siteCode={siteCode}
            onOpenDetail={() => void openProductHistory(row)}
          />
        )
      },
      {
        title: '查看',
        width: 70,
        render: (_, row) => (
          <Button type="link" onClick={() => void openProductHistory(row)}>
            详情
          </Button>
        )
      }
    ],
    [storeCode, siteCode]
  )

  const productHistoryColumns = useMemo<ColumnsType<OfficialWarehouseProductInboundReceiptRow>>(
    () => [
      { title: 'ASN', dataIndex: 'noonAsnNr', width: 120 },
      { title: '预约日', dataIndex: 'asnScheduleDate', width: 110 },
      { title: '完成时间', dataIndex: 'asnCompletedAt', width: 160 },
      { title: '预期', dataIndex: 'qtyExpected', width: 80 },
      { title: '实收', dataIndex: 'receivedQty', width: 80 },
      { title: 'QC失败', dataIndex: 'qcFailedQty', width: 90 },
      {
        title: '状态',
        dataIndex: 'receiptStatus',
        width: 110,
        render: (value: string) => <Tag color={value === 'NORMAL' ? 'green' : 'orange'}>{receiptStatusLabel(value)}</Tag>
      },
      { title: 'Noon仓', dataIndex: 'noonWarehouse', width: 100 },
      { title: '导入时间', dataIndex: 'importedAt', width: 160 }
    ],
    []
  )

  const productSourceInference = useMemo(
    () => inferProductStockSourceByTotal(selectedStockRow?.currentStock || 0, productHistory.rows),
    [selectedStockRow?.currentStock, productHistory.rows]
  )
  const productSourceChain = useMemo(
    () => buildProductStockSourceChain(productSourceInference, productHistory.sourceCandidates),
    [productHistory.sourceCandidates, productSourceInference]
  )

  const inboundColumns = useMemo<ColumnsType<OfficialWarehouseInboundStatisticsRow>>(
    () => [
      {
        title: 'ASN',
        fixed: 'left',
        width: 210,
        render: (_, row) => (
          <div className="official-warehouse-stack">
            <Text strong>{row.noonAsnNr || row.localAsnNo || '-'}</Text>
            {row.localAsnNo && row.localAsnNo !== row.noonAsnNr ? <Text type="secondary">{row.localAsnNo}</Text> : null}
          </div>
        )
      },
      {
        title: '入仓状态',
        dataIndex: 'inboundStage',
        width: 110,
        render: (value: string) => <Text type={value === 'FAILED' ? 'danger' : undefined}>{inboundStageLabel(value)}</Text>
      },
      { title: '件数', dataIndex: 'totalQuantity', width: 90 },
      {
        title: '预约状态',
        dataIndex: 'appointmentStatus',
        width: 120,
        render: (value: string) => <Text type={value === 'FAILED' ? 'danger' : undefined}>{appointmentStatusLabel(value)}</Text>
      },
      {
        title: 'Noon状态',
        dataIndex: 'noonAsnStatus',
        width: 130,
        render: (value: string) => asnStatusLabel(value)
      },
      {
        title: 'Noon仓',
        width: 140,
        render: (_, row) => row.selectedWarehousePartnerCode || row.selectedWarehouseCode || '-'
      }
    ],
    []
  )

  const hasInboundReport =
    inboundStats.summary.lineReceiptReportConnected || inboundStats.summary.scheduledDeliveryAccuracyConnected

  const productTable = (
    <Table
      className="official-warehouse-product-stock-table"
      rowKey={(row: OfficialWarehouseStockStatisticsRow) => `${row.partnerSku || row.productSiteOfferId || row.skuParent || row.noonSku}`}
      size="small"
      loading={loading}
      tableLayout="fixed"
      columns={stockColumns}
      dataSource={stockStats.rows}
      pagination={{
        pageSize: 8,
        showSizeChanger: false,
        showTotal: (total) => `共 ${total.toLocaleString()} 个商品`
      }}
      locale={{ emptyText: <Empty description="暂无官方仓库存摘要" /> }}
    />
  )

  const inboundTable = (
    <Table
      rowKey={(row: OfficialWarehouseInboundStatisticsRow) => `${row.asnId || row.noonAsnNr || row.localAsnNo}`}
      size="small"
      loading={loading}
      columns={inboundColumns}
      dataSource={inboundStats.rows}
      pagination={{
        pageSize: 8,
        showSizeChanger: false,
        showTotal: (total) => `共 ${total.toLocaleString()} 个入仓单`
      }}
      scroll={{ x: 820 }}
      locale={{ emptyText: <Empty description="暂无入仓单记录" /> }}
    />
  )

  return (
    <div className="official-warehouse-statistics">
      {error ? <Alert type="error" showIcon message={error} /> : null}

      <div className="official-warehouse-statistics-board">
        <div
          className={[
            'official-warehouse-statistics-board-header',
            !panelTitle && !panelSubtitle ? 'official-warehouse-statistics-board-header-controls-only' : ''
          ].filter(Boolean).join(' ')}
        >
          {panelTitle || panelSubtitle ? (
            <div className="official-warehouse-statistics-title">
              {panelTitle ? <Text strong>{panelTitle}</Text> : null}
              {panelSubtitle ? <Text type="secondary">{panelSubtitle}</Text> : null}
            </div>
          ) : null}
          <Space wrap className="official-warehouse-statistics-controls">
            <Input
              className="official-warehouse-search"
              allowClear
              placeholder={currentTab === 'product' ? 'SKU / PSKU / 商品' : 'ASN / 入仓单'}
              value={currentTab === 'product' ? stockKeyword : inboundKeyword}
              onChange={(event) => {
                if (currentTab === 'product') {
                  setStockKeyword(event.target.value)
                  return
                }
                setInboundKeyword(event.target.value)
              }}
              onPressEnter={() => void loadStatistics()}
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
                onChange={(value) => setStockBucket(value)}
              />
            ) : null}
            <Button icon={<ReloadOutlined />} onClick={() => void loadStatistics()} loading={loading}>
              刷新数据
            </Button>
          </Space>
        </div>

        <div className="official-warehouse-statistics-summary-row">
          {shouldShowProduct ? (
            <div className="official-warehouse-statistics-summary-group">
              <div className="official-warehouse-metrics official-warehouse-history-metrics">
                <Metric
                  label="有效在仓"
                  value={stockStats.summary.effectiveStock}
                  tone="green"
                  active={stockBucket === 'SELLABLE'}
                  onClick={() => selectStockBucket('SELLABLE')}
                />
                <Metric
                  label="当前库存"
                  value={stockStats.summary.currentStock}
                  active={!stockBucket}
                  onClick={() => selectStockBucket(undefined)}
                />
                <Metric
                  label="退货"
                  value={stockStats.summary.returnStock}
                  active={stockBucket === 'RETURNED'}
                  onClick={() => selectStockBucket('RETURNED')}
                />
                <Metric
                  label="失败/异常"
                  value={stockStats.summary.failedOrExceptionStock}
                  tone="red"
                  active={stockBucket === 'DAMAGED'}
                  onClick={() => selectStockBucket('DAMAGED')}
                />
                <Metric
                  label="待确认"
                  value={stockStats.summary.pendingConfirmationStock}
                  tone="amber"
                  active={stockBucket === 'PENDING_CONFIRMATION'}
                  onClick={() => selectStockBucket('PENDING_CONFIRMATION')}
                />
              </div>
            </div>
          ) : null}
          {shouldShowInbound ? (
            <div className="official-warehouse-statistics-summary-group official-warehouse-statistics-summary-compact">
              <Text className="official-warehouse-statistics-summary-label">入仓摘要</Text>
              <div className="official-warehouse-metrics official-warehouse-history-metrics">
                {hasInboundReport ? (
                  <>
                    <Metric
                      label="ASN"
                      value={inboundStats.summary.scheduledDeliveryAccuracyAsnCount || inboundStats.summary.asnCount}
                    />
                    <Metric label="预期" value={inboundStats.summary.expectedQuantity || inboundStats.summary.totalQuantity} />
                    <Metric label="实收" value={inboundStats.summary.receivedQuantity || inboundStats.summary.grnQuantity} tone="green" />
                    <Metric label="QC失败" value={inboundStats.summary.qcFailedQuantity} tone="red" />
                    <Metric label="短收" value={inboundStats.summary.shortReceivedLineCount} tone="red" />
                    <Metric
                      label="差异"
                      value={inboundStats.summary.inboundQuantityVariance}
                      tone={inboundStats.summary.inboundQuantityVariance > 0 ? 'red' : 'green'}
                    />
                  </>
                ) : (
                  <>
                    <Metric label="ASN" value={inboundStats.summary.asnCount} />
                    <Metric label="总件数" value={inboundStats.summary.totalQuantity} />
                    <Metric label={inboundStageLabel('RECEIVING')} value={inboundStats.summary.receivingAsnCount} tone="blue" />
                    <Metric label={inboundStageLabel('GRN_COMPLETED')} value={inboundStats.summary.grnCompletedAsnCount} tone="green" />
                    <Metric label={inboundStageLabel('FAILED')} value={inboundStats.summary.failedAsnCount} tone="red" />
                    <Metric label="约仓成功" value={inboundStats.summary.appointmentScheduledCount} tone="green" />
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {visibleTabs.length > 1 ? (
          <Tabs
            className="official-warehouse-view-tabs"
            activeKey={currentTab}
            destroyInactiveTabPane
            onChange={(key) => setActiveTab(key as OfficialWarehouseStatisticsTabKey)}
            items={[
              ...(shouldShowProduct ? [{ key: 'product', label: '商品视角', children: productTable }] : []),
              ...(shouldShowInbound ? [{ key: 'inbound', label: '入仓单视角', children: inboundTable }] : [])
            ]}
          />
        ) : currentTab === 'product' ? (
          productTable
        ) : (
          inboundTable
        )}

        <Drawer
          width={760}
          open={Boolean(selectedStockRow)}
          title={selectedStockRow?.partnerSku || selectedStockRow?.noonSku || '商品详情'}
          onClose={() => {
            setSelectedStockRow(undefined)
            setSelectedSourceSegment(undefined)
            setProductHistory(EMPTY_PRODUCT_INBOUND_HISTORY)
          }}
        >
          {selectedStockRow ? (
            <div className="official-warehouse-stack">
              <div className="official-warehouse-statistics-title">
                <Text strong>{selectedStockRow.titleCn || selectedStockRow.title || selectedStockRow.noonSku || '-'}</Text>
                <Text type="secondary">{selectedStockRow.titleEn || selectedStockRow.partnerSku || selectedStockRow.noonSku || '-'}</Text>
              </div>
              <div className="official-warehouse-metrics official-warehouse-history-metrics">
                <Metric label="当前库存" value={selectedStockRow.currentStock} />
                <Metric label="有效在仓" value={selectedStockRow.effectiveStock} tone="green" />
                <Metric label="退货" value={selectedStockRow.returnStock} />
                <Metric label="失败/异常" value={selectedStockRow.failedOrExceptionStock} tone="red" />
                <Metric label="待确认" value={selectedStockRow.pendingConfirmationStock} tone="amber" />
              </div>
              <div className="official-warehouse-statistics-title">
                <Text strong>库存来源推算</Text>
                <Text type="secondary">按当前库存总量 + FIFO 消耗推算，非 Noon 真实批次归属。</Text>
              </div>
              <ProductStockSourceChain
                chain={productSourceChain}
                loading={historyLoading}
                onSegmentClick={setSelectedSourceSegment}
              />
              <div className="official-warehouse-statistics-title">
                <Text strong>历史入仓</Text>
                <Text type={productInboundHistoryNeedsReview(productHistory) ? 'warning' : 'secondary'}>
                  {productHistory.summary.receiptLineCount
                    ? `预期 ${productHistory.summary.expectedQuantity.toLocaleString()}，实收 ${productHistory.summary.receivedQuantity.toLocaleString()}，QC失败 ${productHistory.summary.qcFailedQuantity.toLocaleString()}`
                    : '暂无入仓记录'}
                </Text>
              </div>
              <Table
                rowKey={(row) => `${row.importId || ''}-${row.reportRowId || ''}-${row.noonAsnNr || ''}`}
                size="small"
                loading={historyLoading}
                columns={productHistoryColumns}
                dataSource={productHistory.rows}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                scroll={{ x: 980 }}
                locale={{ emptyText: <Empty description="暂无该商品入仓历史" /> }}
              />
            </div>
          ) : null}
        </Drawer>
        <Drawer
          width={420}
          open={Boolean(selectedSourceSegment)}
          title={selectedSourceSegment ? `${sourceStageLabel(selectedSourceSegment.stage)}详情` : '来源详情'}
          onClose={() => setSelectedSourceSegment(undefined)}
        >
          {selectedSourceSegment ? <ProductStockSourceSegmentDetail segment={selectedSourceSegment} /> : null}
        </Drawer>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  tone,
  active,
  onClick
}: {
  label: string
  value: number
  tone?: 'green' | 'blue' | 'red' | 'amber'
  active?: boolean
  onClick?: () => void
}) {
  const className = [
    'official-warehouse-metric',
    tone ? `official-warehouse-metric-${tone}` : '',
    active ? 'official-warehouse-metric-active' : '',
    onClick ? 'official-warehouse-metric-clickable' : ''
  ].filter(Boolean).join(' ')
  const content = (
    <>
      <div className="official-warehouse-metric-value">{Number(value || 0).toLocaleString()}</div>
      <div className="official-warehouse-metric-label">{label}</div>
    </>
  )
  if (onClick) {
    return (
      <button className={className} type="button" aria-pressed={Boolean(active)} onClick={onClick}>
        {content}
      </button>
    )
  }
  return (
    <div className={className}>
      {content}
    </div>
  )
}

function ProductStockSourceChain({
  chain,
  loading,
  onSegmentClick
}: {
  chain: ReturnType<typeof buildProductStockSourceChain>
  loading?: boolean
  onSegmentClick: (segment: ProductStockSourceChainSegment) => void
}) {
  return (
    <div className="official-warehouse-source-chain">
      <div className="official-warehouse-source-chain-head">
        <Text strong>剩余总库存：{chain.totalQuantity.toLocaleString()} 件</Text>
        <Text type="secondary">
          ASN 来自入仓行 FIFO 推算；物流和采购单为同商品候选来源，确认关系前不写入数据。
        </Text>
      </div>
      <div className="official-warehouse-source-chain-grid">
        <ProductStockSourceChainColumn
          title="ASN"
          totalQuantity={chain.totalQuantity}
          segments={chain.stages.asn}
          loading={loading}
          onSegmentClick={onSegmentClick}
        />
        <ProductStockSourceChainColumn
          title="物流"
          totalQuantity={chain.totalQuantity}
          segments={chain.stages.logistics}
          loading={loading}
          onSegmentClick={onSegmentClick}
        />
        <ProductStockSourceChainColumn
          title="采购单"
          totalQuantity={chain.totalQuantity}
          segments={chain.stages.purchaseOrder}
          loading={loading}
          onSegmentClick={onSegmentClick}
        />
      </div>
    </div>
  )
}

function ProductStockSourcePreview({
  row,
  storeCode,
  siteCode,
  onOpenDetail
}: {
  row: OfficialWarehouseStockStatisticsRow
  storeCode?: string
  siteCode?: string
  onOpenDetail: () => void
}) {
  const fallbackChain = useMemo(
    () => buildProductStockSourceChain(inferProductStockSourceByTotal(row.currentStock || 0, [])),
    [row.currentStock]
  )
  const [chain, setChain] = useState(fallbackChain)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setChain(fallbackChain)
    setFailed(false)
    if (!storeCode || !siteCode || !row.productSiteOfferId) {
      return () => {
        cancelled = true
      }
    }
    setLoading(true)
    void loadOfficialWarehouseProductInboundHistory({
      storeCode,
      siteCode,
      productSiteOfferId: row.productSiteOfferId
    })
      .then((history) => {
        if (cancelled) {
          return
        }
        setChain(buildProductStockSourceChain(inferProductStockSourceByTotal(row.currentStock || 0, history.rows), history.sourceCandidates))
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [fallbackChain, row.currentStock, row.productSiteOfferId, siteCode, storeCode])

  if (!chain.totalQuantity) {
    return <Text type="secondary">暂无库存</Text>
  }

  return (
    <div className="official-warehouse-source-preview" aria-busy={loading}>
      <ProductStockSourcePreviewStage
        title="ASN"
        totalQuantity={chain.totalQuantity}
        segments={chain.stages.asn}
        onOpenDetail={onOpenDetail}
      />
      <ProductStockSourcePreviewStage
        title="物流"
        totalQuantity={chain.totalQuantity}
        segments={chain.stages.logistics}
        onOpenDetail={onOpenDetail}
      />
      <ProductStockSourcePreviewStage
        title="采购单"
        totalQuantity={chain.totalQuantity}
        segments={chain.stages.purchaseOrder}
        onOpenDetail={onOpenDetail}
      />
      {failed ? <Text className="official-warehouse-source-preview-error" type="secondary">来源读取失败</Text> : null}
    </div>
  )
}

function ProductStockSourcePreviewStage({
  title,
  totalQuantity,
  segments,
  onOpenDetail
}: {
  title: string
  totalQuantity: number
  segments: ProductStockSourceChainSegment[]
  onOpenDetail: () => void
}) {
  const visibleSegments = segments.length
    ? segments
    : [
        {
          key: `${title}-empty`,
          stage: 'ASN' as const,
          label: '未匹配来源',
          quantity: totalQuantity,
          status: 'UNMATCHED' as const,
          detail: {}
        }
      ]
  return (
    <div className="official-warehouse-source-preview-stage">
      <div className="official-warehouse-source-preview-stage-head">
        <Text strong>{title}</Text>
        <Text type="secondary">{visibleSegments.length} 段</Text>
      </div>
      <div className="official-warehouse-source-preview-bar" aria-label={`${title}库存来源进度`}>
        {visibleSegments.map((segment, index) => (
          <Tooltip key={segment.key} title={`${segment.label}：${segment.quantity.toLocaleString()} 件`}>
            <button
              type="button"
              className="official-warehouse-source-preview-bar-segment"
              aria-label={`${title} ${segment.label} ${segment.quantity.toLocaleString()} 件`}
              style={{
                flexGrow: Math.max(segment.quantity, 1),
                background: sourceSegmentColor(segment, index)
              }}
              onClick={onOpenDetail}
            />
          </Tooltip>
        ))}
      </div>
    </div>
  )
}

function ProductStockSourceChainColumn({
  title,
  totalQuantity,
  segments,
  loading,
  onSegmentClick
}: {
  title: string
  totalQuantity: number
  segments: ProductStockSourceChainSegment[]
  loading?: boolean
  onSegmentClick: (segment: ProductStockSourceChainSegment) => void
}) {
  if (loading && !segments.length) {
    return (
      <div className="official-warehouse-source-chain-column">
        <div className="official-warehouse-source-chain-column-title">
          <Text strong>{title}</Text>
        </div>
        <div className="official-warehouse-source-chain-empty">读取中</div>
      </div>
    )
  }
  if (!totalQuantity || !segments.length) {
    return (
      <div className="official-warehouse-source-chain-column">
        <div className="official-warehouse-source-chain-column-title">
          <Text strong>{title}</Text>
        </div>
        <div className="official-warehouse-source-chain-empty">暂无库存</div>
      </div>
    )
  }
  return (
    <div className="official-warehouse-source-chain-column">
      <div className="official-warehouse-source-chain-column-title">
        <Text strong>{title}</Text>
        <Text type="secondary">{segments.length} 段</Text>
      </div>
      <div className="official-warehouse-source-chain-bar" aria-label={`${title}库存来源分段`}>
        {segments.map((segment, index) => (
          <Tooltip
            key={segment.key}
            title={`${segment.label}：${segment.quantity.toLocaleString()} 件`}
            placement="top"
          >
            <button
              type="button"
              className="official-warehouse-source-chain-segment"
              aria-label={`${title} ${segment.label} ${segment.quantity.toLocaleString()} 件`}
              style={{
                flexGrow: Math.max(segment.quantity, 1),
                background: sourceSegmentColor(segment, index)
              }}
              onClick={() => onSegmentClick(segment)}
            />
          </Tooltip>
        ))}
      </div>
      <div className="official-warehouse-source-chain-legend">
        {segments.map((segment, index) => (
          <button
            key={segment.key}
            type="button"
            className={`official-warehouse-source-chain-chip official-warehouse-source-chain-chip-${segment.status.toLowerCase()}`}
            onClick={() => onSegmentClick(segment)}
          >
            <span
              className="official-warehouse-source-chain-chip-dot"
              style={{ background: sourceSegmentColor(segment, index) }}
            />
            <span className="official-warehouse-source-chain-chip-label">{segment.label}</span>
            <span className="official-warehouse-source-chain-chip-qty">{segment.quantity.toLocaleString()}件</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ProductStockSourceSegmentDetail({ segment }: { segment: ProductStockSourceChainSegment }) {
  return (
    <div className="official-warehouse-source-segment-detail">
      <div className="official-warehouse-source-segment-detail-head">
        <Text strong>{segment.label}</Text>
        <Tag color={sourceSegmentTagColor(segment.status)}>{sourceSegmentStatusLabel(segment.status)}</Tag>
      </div>
      <div className="official-warehouse-source-segment-detail-quantity">
        <Text strong>{segment.quantity.toLocaleString()}</Text>
        <Text type="secondary">件剩余库存</Text>
      </div>
      <div className="official-warehouse-source-segment-detail-list">
        {Object.entries(segment.detail).map(([label, value]) => (
          <div className="official-warehouse-source-segment-detail-row" key={label}>
            <Text type="secondary">{label}</Text>
            <Text>{value}</Text>
          </div>
        ))}
      </div>
    </div>
  )
}

function sourceStageLabel(stage: ProductStockSourceChainSegment['stage']) {
  switch (stage) {
    case 'ASN':
      return 'ASN'
    case 'LOGISTICS':
      return '物流'
    case 'PURCHASE_ORDER':
      return '采购单'
    default:
      return '来源'
  }
}

function sourceSegmentStatusLabel(status: ProductStockSourceChainSegment['status']) {
  switch (status) {
    case 'MATCHED':
      return '已分摊'
    case 'CANDIDATE':
      return '候选关系'
    case 'UNMATCHED':
      return '未匹配'
    case 'RELATION_MISSING':
    case 'WAITING_RELATION':
      return '未建立关系'
    default:
      return '-'
  }
}

function sourceSegmentTagColor(status: ProductStockSourceChainSegment['status']) {
  switch (status) {
    case 'MATCHED':
      return 'blue'
    case 'CANDIDATE':
      return 'cyan'
    case 'UNMATCHED':
      return 'orange'
    case 'RELATION_MISSING':
    case 'WAITING_RELATION':
      return 'default'
    default:
      return 'default'
  }
}

function sourceSegmentColor(segment: ProductStockSourceChainSegment, index: number) {
  if (segment.status === 'UNMATCHED') {
    return '#94a3b8'
  }
  if (segment.status === 'RELATION_MISSING' || segment.status === 'WAITING_RELATION') {
    return '#cbd5e1'
  }
  if (segment.status === 'CANDIDATE') {
    const palette = ['#0891b2', '#0d9488', '#0284c7', '#059669', '#7c3aed', '#db2777']
    return palette[index % palette.length]
  }
  const palette = ['#2563eb', '#16a34a', '#f97316', '#7c3aed', '#0891b2', '#db2777']
  return palette[index % palette.length]
}

function ProductThumb({ row }: { row: OfficialWarehouseStockStatisticsRow }) {
  const [failed, setFailed] = useState(false)
  const imageUrl = normalizeOfficialWarehouseProductImageUrl(row.imageUrl)
  useEffect(() => {
    setFailed(false)
  }, [imageUrl])
  if (!imageUrl || failed) {
    return <div className="official-warehouse-product-thumb-placeholder">无图</div>
  }
  return <img className="official-warehouse-product-thumb" src={imageUrl} alt="" loading="lazy" onError={() => setFailed(true)} />
}

function CurrentStockDetail({ row }: { row: OfficialWarehouseStockStatisticsRow }) {
  const breakdown = buildCurrentStockWarehouseBreakdown(Number(row.currentStock || 0), row.warehouseStocks)
  const summaryItems = [
    {
      key: 'fbn',
      label: '仓',
      value: breakdown.fbnEffectiveStock,
      className: 'official-warehouse-current-stock-summary-fbn'
    },
    {
      key: 'supermall',
      label: 'Supermall',
      value: breakdown.supermallEffectiveStock,
      className: 'official-warehouse-current-stock-summary-supermall'
    },
    {
      key: 'other',
      label: '未标仓',
      value: breakdown.otherEffectiveStock,
      className: 'official-warehouse-current-stock-summary-other'
    }
  ].filter((item) => item.value > 0)
  return (
    <div className="official-warehouse-current-stock-detail">
      <div className="official-warehouse-current-stock-head">
        <div className="official-warehouse-current-stock-total">
          <span>总计</span>
          <strong>{breakdown.totalStock.toLocaleString()}</strong>
          <span>件</span>
        </div>
        {summaryItems.length
          ? summaryItems.map((item) => (
            <span className={`official-warehouse-current-stock-summary-pill ${item.className}`} key={item.key}>
              <span>{item.label}</span>
              <strong>{item.value.toLocaleString()}</strong>
            </span>
          ))
          : null}
      </div>
      {breakdown.rows.length ? (
        <div className="official-warehouse-current-stock-warehouse-chips">
          {breakdown.rows.map((stock) => {
            const extraBuckets = [
              { label: '退货', value: stock.returnStock },
              { label: '异常', value: stock.failedOrExceptionStock },
              { label: '待确认', value: stock.pendingConfirmationStock }
            ].filter((bucket) => bucket.value > 0)
            const title = [
              `${stock.warehouseCode} ${stock.warehouseTypeLabel}`,
              `有效 ${stock.effectiveStock.toLocaleString()}`,
              ...extraBuckets.map((bucket) => `${bucket.label} ${bucket.value.toLocaleString()}`)
            ].join(' · ')
            return (
              <span
                className={`official-warehouse-current-stock-warehouse-chip official-warehouse-current-stock-warehouse-chip-${stock.warehouseType.toLowerCase()}`}
                key={stock.key}
                title={title}
              >
                <span className="official-warehouse-current-stock-warehouse-code">{stock.warehouseCode}</span>
                <strong>{stock.effectiveStock.toLocaleString()}</strong>
                {extraBuckets.length ? <span className="official-warehouse-current-stock-warehouse-alert">!</span> : null}
              </span>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function appointmentStatusLabel(status?: string) {
  switch ((status || '').trim().toUpperCase()) {
    case 'SCHEDULED':
      return '已约仓'
    case 'PENDING':
      return '待约仓'
    case 'RUNNING':
      return '约仓中'
    case 'FAILED':
      return '约仓失败'
    default:
      return status || '-'
  }
}

function asnStatusLabel(status?: string) {
  switch ((status || '').trim().toLowerCase()) {
    case 'putaway_completed':
      return '已上架'
    case 'grn_completed':
      return '已入仓'
    case 'receiving':
      return '收货中'
    case 'scheduled':
      return '已约仓'
    case 'cancelled':
      return '已取消'
    case 'expired':
      return '已过期'
    default:
      return status || '-'
  }
}
