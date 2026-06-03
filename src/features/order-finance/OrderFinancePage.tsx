import { ReloadOutlined, SyncOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Col, DatePicker, Empty, Input, Modal, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AuthSession, AuthSessionStore } from '../auth/session'
import { fetchOrderFinanceSkuOrders, fetchOrderFinanceSkuSummary, syncOrderFinanceTransactions } from './api'
import './OrderFinancePage.css'
import type {
  OrderFinanceOrderGroup,
  OrderFinanceQuery,
  OrderFinanceSkuSummaryRow,
  OrderFinanceSkuSummaryView,
  OrderFinanceSummary,
  OrderFinanceSyncInput,
  OrderFinanceTransactionLine
} from './types'

const { RangePicker } = DatePicker
const { Text } = Typography

type DateRangeValue = [Dayjs, Dayjs]

type OrderFinancePageProps = {
  session: AuthSession
}

type OrderFinanceLineRecord = OrderFinanceTransactionLine & {
  detailKey: string
  orderNr: string
  orderDate?: string | null
  currency: string
}

type OrderFinanceOrderRecord = {
  detailKey: string
  orderNr: string
  orderDate?: string | null
  transactionDateFrom?: string | null
  transactionDateTo?: string | null
  currency: string
  lines: OrderFinanceLineRecord[]
  totalAmount: number
}

const latestCompleteDay = () => dayjs().subtract(1, 'day')

const initialDateRange = (): DateRangeValue => {
  const end = latestCompleteDay()
  return [end.subtract(29, 'day'), end]
}

const currencyOptions = [
  { label: 'SAR', value: 'SAR' },
  { label: 'AED', value: 'AED' }
]

const emptySummaryView: OrderFinanceSkuSummaryView = {
  summary: null,
  rows: [],
  dataStatus: null
}

function storeKey(store?: AuthSessionStore | null) {
  if (!store?.storeCode) return ''
  return `${store.storeCode}|${store.site || siteCodeFromStoreCode(store.storeCode)}`
}

function uniqueStores(stores?: AuthSessionStore[], currentStore?: AuthSessionStore | null) {
  const result: AuthSessionStore[] = []
  const seen = new Set<string>()
  const addStore = (store?: AuthSessionStore | null) => {
    const key = storeKey(store)
    if (!store?.storeCode || !key || seen.has(key)) return
    seen.add(key)
    result.push(store)
  }
  ;(stores || []).forEach(addStore)
  addStore(currentStore)
  return result
}

export function OrderFinancePage({ session }: OrderFinancePageProps) {
  const { message } = App.useApp()
  const currentStore = session.currentStore
  const allowedStores = useMemo(() => uniqueStores(session.userStores, currentStore), [session.userStores, currentStore])
  const [selectedStoreKey, setSelectedStoreKey] = useState(() => storeKey(currentStore))
  const [dateRange, setDateRange] = useState<DateRangeValue>(initialDateRange)
  const [currency, setCurrency] = useState<string | undefined>()
  const [search, setSearch] = useState('')
  const [partnerSkuText, setPartnerSkuText] = useState('')
  const [data, setData] = useState<OrderFinanceSkuSummaryView>(emptySummaryView)
  const [loading, setLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRow, setDetailRow] = useState<OrderFinanceSkuSummaryRow | null>(null)
  const loadRequestIdRef = useRef(0)
  const latestQueryRef = useRef<OrderFinanceQuery | null>(null)

  useEffect(() => {
    if (!allowedStores.length) {
      setSelectedStoreKey('')
      return
    }
    const currentKey = storeKey(currentStore)
    const nextKey = currentKey && allowedStores.some((store) => storeKey(store) === currentKey)
      ? currentKey
      : storeKey(allowedStores[0])
    setSelectedStoreKey((previous) => {
      if (currentKey && allowedStores.some((store) => storeKey(store) === currentKey)) {
        return currentKey
      }
      return previous && allowedStores.some((store) => storeKey(store) === previous) ? previous : nextKey
    })
  }, [allowedStores, currentStore])

  const selectedStore = useMemo(
    () => allowedStores.find((store) => storeKey(store) === selectedStoreKey) || allowedStores[0] || null,
    [allowedStores, selectedStoreKey]
  )

  useEffect(() => {
    setDetailOpen(false)
    setDetailRow(null)
    setData(emptySummaryView)
  }, [selectedStoreKey])

  const query = useMemo<OrderFinanceQuery | null>(() => {
    if (!selectedStore?.storeCode) return null
    return {
      storeCode: selectedStore.storeCode,
      siteCode: selectedStore.site || siteCodeFromStoreCode(selectedStore.storeCode),
      dateFrom: dateRange[0].format('YYYY-MM-DD'),
      dateTo: dateRange[1].format('YYYY-MM-DD'),
      currency,
      search: search.trim() || undefined,
      partnerSkuList: parsePartnerSkuText(partnerSkuText)
    }
  }, [currency, selectedStore, dateRange, partnerSkuText, search])

  const loadData = useCallback(async (targetQuery: OrderFinanceQuery | null) => {
    const requestId = loadRequestIdRef.current + 1
    loadRequestIdRef.current = requestId
    if (!targetQuery) {
      setData(emptySummaryView)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const payload = await fetchOrderFinanceSkuSummary(targetQuery)
      if (loadRequestIdRef.current === requestId) {
        setData(payload)
      }
    } catch (error) {
      if (loadRequestIdRef.current === requestId) {
        message.error(error instanceof Error ? error.message : '订单分析数据加载失败')
      }
    } finally {
      if (loadRequestIdRef.current === requestId) {
        setLoading(false)
      }
    }
  }, [message])

  useEffect(() => {
    latestQueryRef.current = query
    void loadData(query)
  }, [loadData, query])

  const handleSync = async () => {
    if (!query) return
    const syncInput = syncInputFromQuery(query)
    setSyncLoading(true)
    try {
      const result = await syncOrderFinanceTransactions(syncInput)
      const rangeText = !result.skipped && result.dateFrom && result.dateTo ? `（${result.dateFrom} 至 ${result.dateTo}）` : ''
      const fallbackMessage = result.skipped
        ? '订单财务数据已是最新'
        : `补齐完成${rangeText}，导入 ${result.importedCount ?? 0} 行，异常 ${result.exceptionCount ?? 0} 行`
      const resultMessage = result.message ? `${result.message}${rangeText}` : fallbackMessage
      const normalizedStatus = (result.status || '').toUpperCase()
      if (normalizedStatus.includes('FAIL')) {
        message.error(resultMessage)
      } else if ((result.exceptionCount ?? 0) > 0 || normalizedStatus.includes('PARTIAL')) {
        message.warning(resultMessage)
      } else {
        message.success(resultMessage)
      }
      await loadData(latestQueryRef.current)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '订单财务同步失败')
    } finally {
      setSyncLoading(false)
    }
  }

  const summaryGroups = useMemo(() => normalizeSummaryGroups(data, query?.currency), [data, query?.currency])
  const rows = data.rows || []
  const dataStatus = data.dataStatus
  const openOrderDetail = useCallback((row: OrderFinanceSkuSummaryRow) => {
    setDetailRow(row)
    setDetailOpen(true)
  }, [])

  const columns = useMemo<ColumnsType<OrderFinanceSkuSummaryRow>>(
    () => [
      {
        title: '商品',
        dataIndex: 'partnerSku',
        key: 'product',
        width: 360,
        fixed: 'left',
        render: (_, row) => (
          <ProductSummaryCell row={row} />
        )
      },
      {
        title: '订单汇总',
        key: 'orderSummary',
        width: 190,
        render: (_, row) => (
          <OrderSummaryCell
            row={row}
            onOpen={() => openOrderDetail(row)}
          />
        )
      },
      {
        title: 'Net Proceeds',
        dataIndex: 'netProceeds',
        key: 'netProceeds',
        align: 'right',
        width: 150,
        render: (value: number) => formatAmountWithoutCurrency(value)
      },
      {
        title: '佣金',
        dataIndex: 'referralFee',
        key: 'referralFee',
        align: 'right',
        width: 130,
        render: (value: number) => formatAmountWithoutCurrency(value)
      },
      {
        title: '履约费',
        dataIndex: 'fulfillmentLogisticsFee',
        key: 'fulfillmentLogisticsFee',
        align: 'right',
        width: 140,
        render: (value: number) => formatAmountWithoutCurrency(value)
      },
      {
        title: 'Total',
        dataIndex: 'totalAmount',
        key: 'totalAmount',
        align: 'right',
        width: 140,
        render: (value: number) => formatAmountWithoutCurrency(value)
      },
      {
        title: '平均单件履约费',
        dataIndex: 'avgFulfillmentFeePerItem',
        key: 'avgFulfillmentFeePerItem',
        align: 'right',
        width: 160,
        render: (value: number | null) => (value === null || value === undefined ? '-' : formatAmountWithoutCurrency(value))
      },
      {
        title: '费用率',
        dataIndex: 'feeRate',
        key: 'feeRate',
        align: 'right',
        width: 110,
        render: (value: number | null) => formatRate(value)
      }
    ],
    [openOrderDetail]
  )

  if (!selectedStore?.storeCode) {
    return (
      <Card variant="borderless" style={{ boxShadow: 'none' }}>
        <Alert type="warning" showIcon message="未选择店铺" description="请先在右上角选择一个店铺后再查看订单分析。" />
      </Card>
    )
  }

  return (
    <Space className="order-finance-page" direction="vertical" size={16} style={{ width: '100%' }}>
      <Card variant="borderless" style={{ boxShadow: 'none' }}>
        <div className="order-finance-toolbar">
          <Space align="start" size={10} wrap>
            <RangePicker
              allowClear={false}
              value={dateRange}
              onChange={(value) => {
                const [start, end] = value || []
                if (start && end) {
                  setDateRange([start, end])
                }
              }}
            />
            <Select
              allowClear
              placeholder="全部币种"
              style={{ width: 120 }}
              value={currency}
              options={currencyOptions}
              onChange={(nextCurrency) => {
                setCurrency(nextCurrency)
              }}
            />
            <Input.Search
              allowClear
              placeholder="标题 / SKU 搜索"
              style={{ width: 220 }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onSearch={(value) => setSearch(value)}
            />
            <Input.TextArea
              allowClear
              placeholder="Partner SKU，可换行或逗号分隔"
              autoSize={{ minRows: 1, maxRows: 3 }}
              style={{ width: 260 }}
              value={partnerSkuText}
              onChange={(event) => {
                setPartnerSkuText(event.target.value)
              }}
            />
          </Space>
          <Space size={10} wrap>
            <Button icon={<ReloadOutlined />} onClick={() => void loadData(query)} loading={loading}>
              刷新
            </Button>
            <Button type="primary" icon={<SyncOutlined />} onClick={() => void handleSync()} loading={syncLoading}>
              补齐 Noon 订单财务
            </Button>
          </Space>
        </div>
      </Card>

      <OrderFinanceDataStatusBar dataStatus={dataStatus} store={selectedStore} query={query} />

      {summaryGroups.length ? (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          {summaryGroups.map((summary) => (
            <div key={summary.currency || 'unknown'}>
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12} lg={4}>
                  <SummaryStatisticCard title="订单数" value={summary.orderCount} />
                </Col>
                <Col xs={24} sm={12} lg={4}>
                  <SummaryStatisticCard title="商品行数" value={summary.itemCount} />
                </Col>
                <Col xs={24} sm={12} lg={5}>
                  <SummaryStatisticCard title="Net Proceeds" value={summary.netProceeds} currency={summary.currency || undefined} />
                </Col>
                <Col xs={24} sm={12} lg={5}>
                  <SummaryStatisticCard title="履约物流费" value={summary.fulfillmentLogisticsFee} currency={summary.currency || undefined} />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <SummaryStatisticCard title="Total" value={summary.totalAmount} currency={summary.currency || undefined} />
                </Col>
              </Row>
            </div>
          ))}
        </Space>
      ) : (
        <Card variant="borderless" style={{ boxShadow: 'none' }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无订单财务汇总" />
        </Card>
      )}

      <Card variant="borderless" style={{ boxShadow: 'none' }}>
        <Table<OrderFinanceSkuSummaryRow>
          rowKey={orderFinanceRowKey}
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 1580 }}
        />
      </Card>
      <Modal
        title={
          <Space direction="vertical" size={2}>
            <Text strong>订单明细</Text>
            <Text type="secondary">
              {detailRow?.partnerSku ? `PSKU: ${detailRow.partnerSku}` : 'Partner SKU 缺失'}
            </Text>
          </Space>
        }
        open={detailOpen}
        footer={null}
        width={1120}
        destroyOnClose
        onCancel={() => setDetailOpen(false)}
      >
        {query && detailRow ? <OrderFinanceOrderDetail query={query} row={detailRow} /> : null}
      </Modal>
    </Space>
  )
}

function SummaryStatisticCard({ title, value, currency }: { title: string; value: number; currency?: string }) {
  return (
    <Card size="small" variant="borderless" style={{ boxShadow: 'none' }}>
      <Statistic
        title={title}
        value={value}
        formatter={() => (currency ? formatAmountWithoutCurrency(value) : formatNumber(value))}
      />
    </Card>
  )
}

function formatAmountWithoutCurrency(value: number | null | undefined) {
  return formatNumber(value ?? 0)
}

function ProductSummaryCell({ row }: { row: OrderFinanceSkuSummaryRow }) {
  const imageUrl = normalizeNoonProductImageUrl(row.imageUrl)
  const [imageBroken, setImageBroken] = useState(false)

  useEffect(() => {
    setImageBroken(false)
  }, [imageUrl])

  return (
    <div className="order-finance-product-cell">
      {imageUrl && !imageBroken ? (
        <img
          className="order-finance-product-image"
          src={imageUrl}
          alt={row.title || row.partnerSku || '商品图'}
          onError={() => setImageBroken(true)}
        />
      ) : (
        <div className="order-finance-product-image order-finance-product-image-empty">无图</div>
      )}
      <div className="order-finance-product-meta">
        <Text className="order-finance-product-title" title={row.title || undefined}>
          {row.title || '-'}
        </Text>
        <Space size={6} wrap>
          <Text className="order-finance-product-psku" type={row.partnerSku ? 'secondary' : 'warning'}>
            PSKU: {row.partnerSku || '缺失'}
          </Text>
          {row.missingPartnerSku || !row.partnerSku ? <Tag color="warning">待映射</Tag> : null}
        </Space>
      </div>
    </div>
  )
}

function normalizeNoonProductImageUrl(rawUrl?: string | null) {
  const trimmed = rawUrl?.trim()
  if (!trimmed) return ''
  if (!trimmed.includes('f.nooncdn.com/')) return trimmed
  const [origin, rawPath = ''] = trimmed.split('f.nooncdn.com/')
  let path = rawPath.trim()
  if (!path) return trimmed
  if (!path.startsWith('p/')) {
    path = `p/${path.replace(new RegExp('^/+'), '')}`
  }
  if (!new RegExp('\\.(jpg|jpeg|png|webp|avif)(\\?|$)', 'i').test(path)) {
    path = `${path}.jpg`
  }
  return `${origin}f.nooncdn.com/${path}`
}

function OrderSummaryCell({
  row,
  onOpen
}: {
  row: OrderFinanceSkuSummaryRow
  onOpen: () => void
}) {
  return (
    <button className="order-finance-order-summary-button" type="button" onClick={onOpen}>
      <Space direction="vertical" size={4}>
        <Space size={6}>
          <Text type="secondary">订单</Text>
          <Text strong>{row.orderCount}</Text>
        </Space>
        <Space size={6}>
          <Text type="secondary">商品行</Text>
          <Text strong>{row.itemCount}</Text>
        </Space>
        <Space size={6}>
          <Text type="secondary">后续更新</Text>
          {row.orderUpdateRowCount ? <Tag color="orange">{row.orderUpdateRowCount}</Tag> : <Text strong>0</Text>}
        </Space>
        <Tag color="blue">{row.currency || '未知'}</Tag>
        <Text className="order-finance-order-summary-action" type="secondary">
          查看订单明细
        </Text>
      </Space>
    </button>
  )
}

function OrderFinanceDataStatusBar({
  dataStatus,
  store,
  query
}: {
  dataStatus?: OrderFinanceSkuSummaryView['dataStatus']
  store?: AuthSessionStore | null
  query?: OrderFinanceQuery | null
}) {
  if (!dataStatus) {
    return null
  }
  const status = dataStatus.latestSyncStatus || dataStatus.lastSyncStatus || dataStatus.status
  return (
    <Card size="small" variant="borderless" style={{ boxShadow: 'none' }}>
      <Space className="order-finance-status-bar" wrap>
        <Text type="secondary">当前站点</Text>
        <Tag>{store?.projectName || store?.projectCode || store?.storeCode || '-'}</Tag>
        <Tag color="blue">{query?.siteCode || store?.site || '-'}</Tag>
        <Text type="secondary">最后同步状态</Text>
        {status ? <Tag color={statusColor(status)}>{status}</Tag> : <Text>-</Text>}
        <Text type="secondary">最新交易日</Text>
        <Text>{dataStatus.latestTransactionDate || '-'}</Text>
        <Text type="secondary">PSKU 缺失</Text>
        {(dataStatus.missingPartnerSkuRowCount || 0) > 0 ? (
          <Tag color="warning">{dataStatus.missingPartnerSkuRowCount} 待映射</Tag>
        ) : (
          <Text>0</Text>
        )}
      </Space>
    </Card>
  )
}

function OrderFinanceOrderDetail({ query, row }: { query: OrderFinanceQuery; row: OrderFinanceSkuSummaryRow }) {
  const { message } = App.useApp()
  const [groups, setGroups] = useState<OrderFinanceOrderGroup[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const loadGroups = async () => {
      setLoading(true)
      try {
        const payload = await fetchOrderFinanceSkuOrders(query, row)
        if (!cancelled) {
          setGroups(groupOrderFinanceOrders(payload, row))
        }
      } catch (error) {
        if (!cancelled) {
          message.error(error instanceof Error ? error.message : '订单明细加载失败')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    void loadGroups()
    return () => {
      cancelled = true
    }
  }, [message, query, row])

  const lines = useMemo<OrderFinanceLineRecord[]>(() => (
    groups.flatMap((group, groupIndex) => (
      (group.lines || []).map((line, lineIndex) => ({
        ...line,
        orderNr: line.orderNr || group.orderNr || 'NA',
        orderDate: line.orderDate || group.orderDate,
        currency: line.currency || group.currency || row.currency || '未知',
        detailKey: [
          group.currency || row.currency || 'currency',
          group.orderNr || line.orderNr || 'order',
          line.transactionDate || 'date',
          line.transactionType || 'type',
          line.itemNr || 'item',
          groupIndex,
          lineIndex
        ].join('::')
      }))
    ))
  ), [groups, row.currency])
  const orderRows = useMemo<OrderFinanceOrderRecord[]>(() => (
    groups.map((group, groupIndex) => {
      const orderLines = lines.filter((line) => (line.orderNr || 'NA') === (group.orderNr || 'NA'))
      const currency = group.currency || orderLines[0]?.currency || row.currency || '未知'
      const orderNr = group.orderNr || orderLines[0]?.orderNr || 'NA'
      const transactionDates = orderLines.map((line) => line.transactionDate).filter(Boolean).sort()
      return {
        detailKey: [currency, orderNr, groupIndex].join('::'),
        orderNr,
        orderDate: group.orderDate || orderLines[0]?.orderDate,
        transactionDateFrom: group.transactionDateFrom || transactionDates[0],
        transactionDateTo: group.transactionDateTo || transactionDates[transactionDates.length - 1],
        currency,
        lines: orderLines,
        totalAmount: orderLines.reduce((sum, line) => sum + totalFeeAmount(line), 0)
      }
    })
  ), [groups, lines, row.currency])

  if (loading) {
    return (
      <div className="order-finance-detail-loading">
        <Text type="secondary">正在加载订单明细...</Text>
      </div>
    )
  }

  if (!orderRows.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无订单明细" />
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <div className="order-finance-detail-summary">
        <span>订单 {groups.length}</span>
        <span>交易行 {lines.length}</span>
        <span>后续更新 {row.orderUpdateRowCount || 0}</span>
        <span>Total {formatMoney(row.totalAmount, row.currency)}</span>
      </div>
      <Table<OrderFinanceOrderRecord>
        rowKey="detailKey"
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: false }}
        columns={detailColumns}
        dataSource={orderRows}
        scroll={{ x: 760 }}
      />
    </Space>
  )
}

const detailColumns: ColumnsType<OrderFinanceOrderRecord> = [
  {
    title: 'Order Nr',
    dataIndex: 'orderNr',
    key: 'orderNr',
    width: 180,
    render: (value: string | null, order) => (
      <Space direction="vertical" size={2}>
        <Text strong>{value || '-'}</Text>
        <Text type="secondary">订单日 {order.orderDate || '-'}</Text>
        <Text type="secondary">
          交易日 {order.transactionDateFrom === order.transactionDateTo
            ? order.transactionDateFrom || '-'
            : `${order.transactionDateFrom || '-'} 至 ${order.transactionDateTo || '-'}`}
        </Text>
      </Space>
    )
  },
  {
    title: '费用',
    key: 'fees',
    width: 580,
    render: (_, order) => <OrderLineBreakdown order={order} />
  }
]

function OrderLineBreakdown({ order }: { order: OrderFinanceOrderRecord }) {
  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      {order.lines.map((line) => {
        const normalized = String(line.transactionType || '').toLowerCase()
        const isUpdate = normalized === 'order_update'
        return (
          <div key={line.detailKey} className="order-finance-order-line-breakdown">
            <div className="order-finance-order-line-type">
              <Tag color={isUpdate ? 'orange' : 'green'}>{isUpdate ? '更新' : '下单'}</Tag>
            </div>
            <FeeBreakdown line={line} />
            <Text type="secondary">时间 {line.transactionDate || line.orderDate || '-'}</Text>
          </div>
        )
      })}
      <div className="order-finance-order-line-total">
        <Text strong>汇总</Text>
        <Text strong>{formatMoney(order.totalAmount, order.currency)}</Text>
      </div>
    </Space>
  )
}

function FeeBreakdown({ line }: { line: OrderFinanceLineRecord }) {
  const components = feeComponents(line)
  if (!components.length) {
    return <Text type="secondary">无费用项</Text>
  }
  return (
    <div className="order-finance-fee-list">
      {components.map((component) => (
        <span key={component.key} className="order-finance-fee-item">
          <Text type="secondary">{component.label}</Text>
          <Text strong>{formatMoney(component.value, line.currency)}</Text>
        </span>
      ))}
    </div>
  )
}

function feeComponents(line: OrderFinanceLineRecord) {
  return [
    { key: 'netProceeds', label: 'Net Proceeds', value: amountValue(line.netProceeds) },
    { key: 'referralFee', label: '佣金', value: amountValue(line.referralFee) },
    { key: 'fulfillmentLogisticsFee', label: '履约物流费', value: amountValue(line.fulfillmentLogisticsFee) },
    { key: 'shippingCredits', label: 'Shipping Credits', value: amountValue(line.shippingCredits) },
    { key: 'otherOrderFee', label: '其他订单费', value: amountValue(line.otherOrderFee) },
    { key: 'orderSubsidies', label: '订单补贴', value: amountValue(line.orderSubsidies) },
    { key: 'nonOrderFees', label: '非订单费', value: amountValue(line.nonOrderFees) },
    { key: 'nonOrderSubsidies', label: '非订单补贴', value: amountValue(line.nonOrderSubsidies) },
    { key: 'others', label: 'Others', value: amountValue(line.others) }
  ].filter((component) => Math.abs(component.value) > 0.000001)
}

function totalFeeAmount(line: OrderFinanceLineRecord) {
  return feeComponents(line).reduce((sum, component) => sum + component.value, 0)
}

function amountValue(value: number | null | undefined) {
  const numericValue = Number(value ?? 0)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function normalizeSummaryGroups(data: OrderFinanceSkuSummaryView, fallbackCurrency?: string): OrderFinanceSummary[] {
  const rawSummary = data.summary
  if (Array.isArray(rawSummary)) {
    return rawSummary.map((summary) => ({ ...summary, currency: summary.currency || fallbackCurrency || '未知' }))
  }
  if (rawSummary) {
    return [{ ...rawSummary, currency: rawSummary.currency || fallbackCurrency || '未知' }]
  }
  return []
}

function groupOrderFinanceOrders(groups: OrderFinanceOrderGroup[], row: OrderFinanceSkuSummaryRow) {
  const orderGroups = new Map<string, OrderFinanceOrderGroup>()
  groups.forEach((group) => {
    const orderNr = group.orderNr || group.lines?.[0]?.orderNr || 'NA'
    const currency = group.currency || group.lines?.[0]?.currency || row.currency || '未知'
    const partnerSku = group.lines?.[0]?.partnerSku || row.partnerSku || (row.missingPartnerSku ? 'MISSING_PARTNER_SKU' : '')
    const sku = group.lines?.[0]?.sku || row.sku || ''
    const groupKey = [currency, orderNr, partnerSku, sku].join('::')
    const current = orderGroups.get(groupKey)
    if (!current) {
      orderGroups.set(groupKey, {
        ...group,
        orderNr,
        currency,
        lines: [...(group.lines || [])]
      })
      return
    }
    current.lines.push(...(group.lines || []))
    current.netProceeds += group.netProceeds || 0
    current.referralFee += group.referralFee || 0
    current.fulfillmentLogisticsFee += group.fulfillmentLogisticsFee || 0
    current.otherOrderFee += group.otherOrderFee || 0
    current.totalAmount += group.totalAmount || 0
    current.transactionDateFrom = minDate(current.transactionDateFrom, group.transactionDateFrom)
    current.transactionDateTo = maxDate(current.transactionDateTo, group.transactionDateTo)
  })
  return Array.from(orderGroups.values())
}

function syncInputFromQuery(query: OrderFinanceQuery): OrderFinanceSyncInput {
  return {
    storeCode: query.storeCode,
    siteCode: query.siteCode
  }
}

function parsePartnerSkuText(text: string) {
  return Array.from(new Set(text.split(/[\s,，;；]+/).map((item) => item.trim()).filter(Boolean)))
}

function siteCodeFromStoreCode(storeCode: string) {
  const normalized = storeCode.toUpperCase()
  if (normalized.includes('AE') || normalized.includes('UAE') || normalized.includes('DB')) return 'AE'
  return 'SA'
}

function orderFinanceRowKey(row: OrderFinanceSkuSummaryRow) {
  return [row.currency || 'UNKNOWN', row.partnerSku || 'MISSING_PARTNER_SKU', row.sku || 'NO_SKU'].join('::')
}

function statusColor(status: string) {
  const normalized = status.toLowerCase()
  if (normalized.includes('success') || normalized.includes('done') || normalized.includes('completed')) return 'green'
  if (normalized.includes('fail') || normalized.includes('error')) return 'red'
  if (normalized.includes('running') || normalized.includes('pending')) return 'processing'
  return 'default'
}

function formatNumber(value?: number | null) {
  return Number(value || 0).toLocaleString('zh-CN')
}

function formatMoney(value?: number | null, currency?: string | null) {
  const amount = Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return currency ? `${amount} ${currency}` : amount
}

function formatRate(value?: number | null) {
  if (value === null || value === undefined) return '-'
  return `${(value * 100).toFixed(2)}%`
}

function minDate(left?: string | null, right?: string | null) {
  if (!left) return right || left
  if (!right) return left
  return left <= right ? left : right
}

function maxDate(left?: string | null, right?: string | null) {
  if (!left) return right || left
  if (!right) return left
  return left >= right ? left : right
}

export default OrderFinancePage
