import { Alert, App, Card, Col, Empty, Modal, Row, Space, Table, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AuthSession, AuthSessionStore } from '../auth/session'
import { fetchOrderFinanceSkuSummary, syncOrderFinanceTransactions } from './api'
import { OrderFinanceDataStatusBar, SummaryStatisticCard } from './OrderFinancePresentation'
import { OrderFinanceOrderDetail } from './OrderFinanceOrderDetail'
import { OrderFinanceToolbar } from './OrderFinanceToolbar'
import { useOrderFinanceColumns } from './useOrderFinanceColumns'
import {
  normalizeSummaryGroups,
  orderFinanceRowKey,
  parsePartnerSkuText,
  siteCodeFromStoreCode,
  syncInputFromQuery,
} from './orderFinanceModel'
import './OrderFinancePage.css'
import type {
  OrderFinanceQuery,
  OrderFinanceSkuSummaryRow,
  OrderFinanceSkuSummaryView
} from './types'

const { Text } = Typography

type DateRangeValue = [Dayjs, Dayjs]

type OrderFinancePageProps = {
  session: AuthSession
}

const latestCompleteDay = () => dayjs().subtract(1, 'day')

const initialDateRange = (): DateRangeValue => {
  const end = latestCompleteDay()
  return [end.subtract(29, 'day'), end]
}

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

  const columns = useOrderFinanceColumns(openOrderDetail)

  if (!selectedStore?.storeCode) {
    return (
      <Card variant="borderless" style={{ boxShadow: 'none' }}>
        <Alert type="warning" showIcon message="未选择店铺" description="请先在右上角选择一个店铺后再查看订单分析。" />
      </Card>
    )
  }

  return (
    <Space className="order-finance-page" direction="vertical" size={16} style={{ width: '100%' }}>
      <OrderFinanceToolbar
        dateRange={dateRange}
        currency={currency}
        search={search}
        partnerSkuText={partnerSkuText}
        loading={loading}
        syncLoading={syncLoading}
        onDateRangeChange={setDateRange}
        onCurrencyChange={setCurrency}
        onSearchChange={setSearch}
        onPartnerSkuTextChange={setPartnerSkuText}
        onRefresh={() => void loadData(query)}
        onSync={() => void handleSync()}
      />

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

export default OrderFinancePage
