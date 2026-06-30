import { Alert, Button, Card, Descriptions, Drawer, Empty, Input, Segmented, Select, Space, Spin, Table, Tag, Typography } from 'antd'
import { AppstoreOutlined, EyeOutlined, ReloadOutlined, StarFilled, StarOutlined, TableOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useMemo, useState, type HTMLAttributes } from 'react'
import type { AuthSession, AuthSessionStore } from '../auth/session'
import { ProductBaselineIdentity } from '../product-baseline'
import {
  exportSalesForecastCsv,
  fetchSalesForecastOverview,
  recalculateSalesForecast,
  setSalesForecastFollowUp
} from './api'
import type { SalesForecastOverview, SalesForecastQuery, SalesForecastRow } from './types'

const { Text, Title } = Typography

type ForecastWindow = 30 | 60 | 90
type ForecastViewMode = 'table' | 'card'

type SalesForecastPageProps = {
  session: AuthSession
}

function siteCodeFromStoreCode(storeCode?: string) {
  const normalized = (storeCode || '').toUpperCase()
  if (normalized.endsWith('-NSA') || normalized.endsWith('-SAU') || normalized.endsWith('-SA')) return 'SA'
  if (normalized.endsWith('-NAE') || normalized.endsWith('-UAE') || normalized.endsWith('-AE')) return 'AE'
  if (normalized.endsWith('-EG')) return 'EG'
  return ''
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

export function SalesForecastPage({ session }: SalesForecastPageProps) {
  const currentStore = session.currentStore
  const [overview, setOverview] = useState<SalesForecastOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [runStatusMessage, setRunStatusMessage] = useState('')
  const [recalculating, setRecalculating] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [forecastWindow, setForecastWindow] = useState<ForecastWindow>(30)
  const [viewMode, setViewMode] = useState<ForecastViewMode>('table')
  const [selectedStoreKey, setSelectedStoreKey] = useState(() => storeKey(currentStore))
  const [searchKeyword, setSearchKeyword] = useState('')
  const [lifecycleFilter, setLifecycleFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [confidenceFilter, setConfidenceFilter] = useState('all')
  const [updatingFollowUpKey, setUpdatingFollowUpKey] = useState('')
  const [detailRow, setDetailRow] = useState<SalesForecastRow | null>(null)

  const allowedStores = useMemo(() => uniqueStores(session.userStores, currentStore), [session.userStores, currentStore])

  useEffect(() => {
    if (!allowedStores.length) {
      setSelectedStoreKey('')
      return
    }
    const currentKey = storeKey(currentStore)
    const nextKey = currentKey && allowedStores.some((store) => storeKey(store) === currentKey)
      ? currentKey
      : storeKey(allowedStores[0])
    setSelectedStoreKey((previous) => (previous && allowedStores.some((store) => storeKey(store) === previous) ? previous : nextKey))
  }, [allowedStores, currentStore])

  const selectedStore = useMemo(
    () => allowedStores.find((store) => storeKey(store) === selectedStoreKey) || allowedStores[0] || null,
    [allowedStores, selectedStoreKey]
  )

  const query = useMemo<SalesForecastQuery | null>(() => {
    if (!selectedStore?.storeCode) return null
    return {
      storeCode: selectedStore.storeCode,
      siteCode: selectedStore.site || siteCodeFromStoreCode(selectedStore.storeCode)
    }
  }, [selectedStore])

  const loadOverview = useCallback(async () => {
    if (!query) return
    setLoading(true)
    setErrorMessage('')
    try {
      setOverview(await fetchSalesForecastOverview(query))
    } catch (error) {
      setOverview(null)
      setErrorMessage(error instanceof Error ? error.message : '销量预测数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  const emptyState = overview?.emptyState
  const rows = overview?.rows || []
  const filteredRows = useMemo(
    () => filterForecastRows(rows, {
      searchKeyword,
      lifecycleFilter,
      riskFilter,
      confidenceFilter
    }),
    [rows, searchKeyword, lifecycleFilter, riskFilter, confidenceFilter]
  )
  const summary = useMemo(() => summarizeForecastRows(filteredRows, forecastWindow), [filteredRows, forecastWindow])

  const toggleFollowUp = useCallback(
    async (row: SalesForecastRow) => {
      if (!query) return
      const nextMarked = !row.followUpMarked
      const key = rowKey(row)
      setUpdatingFollowUpKey(key)
      setErrorMessage('')
      try {
        const result = await setSalesForecastFollowUp({
          storeCode: query.storeCode,
          siteCode: query.siteCode,
          partnerSku: row.partnerSku,
          marked: nextMarked
        })
        setOverview((previous) =>
          previous
            ? {
                ...previous,
                rows: previous.rows.map((item) =>
                  item.partnerSku === result.partnerSku
                    ? { ...item, followUpMarked: result.marked }
                    : item
                )
              }
            : previous
        )
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '重点跟进标记更新失败')
      } finally {
        setUpdatingFollowUpKey('')
      }
    },
    [query]
  )

  const handleRecalculate = useCallback(async () => {
    if (!query) return
    setRecalculating(true)
    setErrorMessage('')
    setRunStatusMessage('')
    try {
      const status = await recalculateSalesForecast(query)
      if (status.status === 'succeeded') {
        setRunStatusMessage(`重算成功：生成 ${status.resultCount} 行预测结果`)
        await loadOverview()
      } else {
        setRunStatusMessage(`重算失败：${status.failureReason || '未知原因'}`)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '销量预测重算失败')
    } finally {
      setRecalculating(false)
    }
  }, [loadOverview, query])

  const handleExport = useCallback(async () => {
    if (!query) return
    setExporting(true)
    setErrorMessage('')
    try {
      const exportFile = await exportSalesForecastCsv(query, {
        forecastWindow,
        searchKeyword,
        lifecycleFilter,
        riskFilter,
        confidenceFilter
      })
      downloadCsv(exportFile.filename, exportFile.content)
      setRunStatusMessage('导出已生成')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '销量预测导出失败')
    } finally {
      setExporting(false)
    }
  }, [confidenceFilter, forecastWindow, lifecycleFilter, query, riskFilter, searchKeyword])
  const columns = useMemo(
    () => [
      {
        title: '商品',
        dataIndex: 'partnerSku',
        width: 260,
        render: (_: string, row: SalesForecastRow) => (
          <ProductBaselineIdentity
            title={row.productTitle || row.partnerSku}
            showImage={false}
            compact
            codes={[
              { label: 'PSKU', value: row.partnerSku, copyText: row.partnerSku },
              { label: 'SKU', value: row.sku, copyText: row.sku }
            ]}
          />
        )
      },
      {
        title: '最新数据日',
        dataIndex: 'latestFactDate',
        width: 130,
        render: (value: string | null) => value || '-'
      },
      {
        title: '7/30/60/90日销量',
        dataIndex: 'historyUnits30',
        width: 170,
        render: (_: number, row: SalesForecastRow) =>
          `${row.historyUnits7} / ${row.historyUnits30} / ${row.historyUnits60} / ${row.historyUnits90}`
      },
      {
        title: `${forecastWindow}天预测`,
        dataIndex: forecastDataIndex(forecastWindow),
        width: 110,
        render: (_: number, row: SalesForecastRow) => <Text strong>{forecastUnits(row, forecastWindow)}</Text>
      },
      {
        title: '库存/风险',
        dataIndex: 'currentStock',
        width: 180,
        render: (_: number | null, row: SalesForecastRow) => (
          <Space direction="vertical" size={2}>
            <Text>库存 {formatOptionalNumber(row.currentStock)}</Text>
            <Text type="secondary">覆盖 {formatCoverDays(row.stockCoverDays)} 天</Text>
            <Space size={4} wrap>
              {(row.riskLabels || []).map((risk) => (
                <Tag key={risk.code} color={riskColor(risk.severity)}>
                  {risk.label}
                </Tag>
              ))}
            </Space>
          </Space>
        )
      },
      {
        title: '生命周期',
        dataIndex: 'lifecycleLabel',
        width: 100,
        render: (value: string | null) => <Tag color="green">{value || '未分类'}</Tag>
      },
      {
        title: '置信度',
        dataIndex: 'confidenceLabel',
        width: 100,
        render: (_: string | null, row: SalesForecastRow) => (
          <Tag color={confidenceColor(row.confidenceLevel)}>置信度 {row.confidenceLabel || '-'}</Tag>
        )
      },
      {
        title: '预测原因',
        dataIndex: 'shortReason',
        render: (value: string | null) => <Text>{value || '-'}</Text>
      },
      {
        title: '版本',
        dataIndex: 'calculationVersion',
        width: 130,
        render: (_: string | null, row: SalesForecastRow) => (
          <Space direction="vertical" size={0}>
            <Text>{row.calculationVersion || '-'}</Text>
            <Text type="secondary">{row.configVersion || '-'}</Text>
          </Space>
        )
      },
      {
        title: '详情',
        dataIndex: 'detail',
        width: 150,
        render: (_: unknown, row: SalesForecastRow) => (
          <Space size={4}>
            <Button
              type="text"
              size="small"
              icon={row.followUpMarked ? <StarFilled /> : <StarOutlined />}
              loading={updatingFollowUpKey === rowKey(row)}
              onClick={() => void toggleFollowUp(row)}
            >
              {row.followUpMarked ? '取消重点跟进' : '标记重点跟进'}
            </Button>
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setDetailRow(row)}>
              详情
            </Button>
          </Space>
        )
      }
    ],
    [forecastWindow, toggleFollowUp, updatingFollowUpKey]
  )

  return (
    <div data-testid="sales-forecast-workbench" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card variant="borderless" style={{ boxShadow: 'none' }}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
            <Space align="center">
              <Title level={4} style={{ margin: 0 }}>
                销量预测
              </Title>
              <Tag color="blue">P0</Tag>
            </Space>
            <Space size={8}>
              <Button onClick={() => void handleRecalculate()} loading={recalculating} disabled={!query}>
                重算
              </Button>
              <Button onClick={() => void handleExport()} loading={exporting} disabled={!query || overview?.state !== 'ready'}>
                导出
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadOverview} loading={loading}>
                刷新
              </Button>
            </Space>
          </Space>
          <Segmented
            data-testid="sales-forecast-window-switch"
            value={forecastWindow}
            options={[
              { label: '30天', value: 30 },
              { label: '60天', value: 60 },
              { label: '90天', value: 90 }
            ]}
            onChange={(value) => setForecastWindow(Number(value) as ForecastWindow)}
          />
          <Space wrap size={8}>
            <Select
              data-testid="sales-forecast-store-filter"
              size="small"
              style={{ minWidth: 180 }}
              value={selectedStoreKey || undefined}
              placeholder="选择店铺/站点"
              options={allowedStores.map((store) => ({
                label: `${store.storeCode} / ${store.site || siteCodeFromStoreCode(store.storeCode) || '-'}`,
                value: storeKey(store)
              }))}
              onChange={setSelectedStoreKey}
            />
            <Input
              allowClear
              size="small"
              placeholder="搜索标题 / PSKU / SKU"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              style={{ width: 220 }}
            />
            <Select
              data-testid="sales-forecast-lifecycle-filter"
              size="small"
              value={lifecycleFilter}
              style={{ width: 132 }}
              options={[
                { label: '全部生命周期', value: 'all' },
                { label: '新品', value: 'new' },
                { label: '增长', value: 'growth' },
                { label: '稳定', value: 'stable' },
                { label: '衰退', value: 'decline' },
                { label: '长尾期', value: 'longTail' },
                { label: '数据不足', value: 'data_insufficient' }
              ]}
              onChange={setLifecycleFilter}
            />
            <Select
              data-testid="sales-forecast-risk-filter"
              size="small"
              value={riskFilter}
              style={{ width: 110 }}
              options={[
                { label: '全部风险', value: 'all' },
                { label: '有风险', value: 'risk' },
                { label: '无风险', value: 'none' }
              ]}
              onChange={setRiskFilter}
            />
            <Select
              data-testid="sales-forecast-confidence-filter"
              size="small"
              value={confidenceFilter}
              style={{ width: 110 }}
              options={[
                { label: '全部置信度', value: 'all' },
                { label: '高', value: 'high' },
                { label: '中', value: 'medium' },
                { label: '低', value: 'low' }
              ]}
              onChange={setConfidenceFilter}
            />
            <Segmented
              data-testid="sales-forecast-view-switch"
              size="small"
              value={viewMode}
              options={[
                { label: <span><TableOutlined /> 表格</span>, value: 'table' },
                { label: <span><AppstoreOutlined /> 卡片</span>, value: 'card' }
              ]}
              onChange={(value) => setViewMode(value as ForecastViewMode)}
            />
          </Space>
          <Text type="secondary">
            {query ? `${query.storeCode} / ${query.siteCode}` : '当前账号暂无可用店铺'}
          </Text>
          {overview?.state === 'ready' ? (
            <Text type="secondary">
              数据日 {overview.sourceDataDate || '-'} / 计算版本 {overview.calculationVersion || '-'}
            </Text>
          ) : null}
          {runStatusMessage ? (
            <Text data-testid="sales-forecast-run-status" type={runStatusMessage.includes('失败') ? 'danger' : 'secondary'}>
              {runStatusMessage}
            </Text>
          ) : null}
        </Space>
      </Card>

      {overview?.state === 'ready' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', gap: 8 }}>
          <SummaryMetric testId="sales-forecast-summary-total" label={`${forecastWindow}天预测合计`} value={summary.totalForecastUnits} />
          <SummaryMetric testId="sales-forecast-summary-growth" label="增长商品" value={summary.growthCount} />
          <SummaryMetric testId="sales-forecast-summary-risk" label="风险商品" value={summary.riskCount} />
          <SummaryMetric testId="sales-forecast-summary-low-confidence" label="低置信度" value={summary.lowConfidenceCount} />
        </div>
      ) : null}

      {errorMessage ? <Alert type="error" showIcon message="销量预测数据加载失败" description={errorMessage} /> : null}

      <Spin spinning={loading}>
        <Card variant="borderless" style={{ boxShadow: 'none' }}>
          {overview?.state === 'empty' ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical" size={4}>
                  <Text strong>{emptyState?.title || '暂无销量预测结果'}</Text>
                  <Text type="secondary">
                    {emptyState?.description || '当前店铺还没有预测运行结果。后续可在完成预测计算后查看 30/60/90 天预测。'}
                  </Text>
                </Space>
              }
            />
          ) : (
            <>
              {viewMode === 'table' ? (
                <Table
                  rowKey={rowKey}
                  dataSource={filteredRows}
                  columns={columns}
                  pagination={false}
                  locale={{ emptyText: '暂无符合条件的预测结果' }}
                  components={{
                    body: {
                      row: (props: HTMLAttributes<HTMLTableRowElement>) => (
                        <tr {...props} data-testid="sales-forecast-row" />
                      )
                    }
                  }}
                />
              ) : (
                <ForecastCardGrid
                  rows={filteredRows}
                  forecastWindow={forecastWindow}
                  updatingFollowUpKey={updatingFollowUpKey}
                  onToggleFollowUp={toggleFollowUp}
                />
              )}
            </>
          )}
        </Card>
      </Spin>

      <Drawer
        title={detailRow?.productTitle || detailRow?.partnerSku || '预测详情'}
        open={Boolean(detailRow)}
        width={560}
        onClose={() => setDetailRow(null)}
        destroyOnClose
      >
        {detailRow ? <SalesForecastDetailDrawer row={detailRow} /> : null}
      </Drawer>
    </div>
  )
}

function SummaryMetric({ testId, label, value }: { testId: string; label: string; value: number }) {
  return (
    <div
      data-testid={testId}
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        background: '#ffffff',
        padding: '10px 12px',
        minHeight: 68
      }}
    >
      <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
        {label}
      </Text>
      <Text strong style={{ display: 'block', fontSize: 22, lineHeight: 1.4 }}>
        {value}
      </Text>
    </div>
  )
}

function ForecastCardGrid({
  rows,
  forecastWindow,
  updatingFollowUpKey,
  onToggleFollowUp
}: {
  rows: SalesForecastRow[]
  forecastWindow: ForecastWindow
  updatingFollowUpKey: string
  onToggleFollowUp: (row: SalesForecastRow) => void
}) {
  if (!rows.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无符合条件的预测结果" />
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
      {rows.map((row) => (
        <div
          key={rowKey(row)}
          data-testid="sales-forecast-card"
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            padding: 12,
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          <ProductBaselineIdentity
            title={row.productTitle || row.partnerSku}
            showImage={false}
            compact
            codes={[
              { label: 'PSKU', value: row.partnerSku, copyText: row.partnerSku },
              { label: 'SKU', value: row.sku, copyText: row.sku }
            ]}
          />
          <Space size={8} wrap>
            <Tag color="blue">{forecastWindow}天 {forecastUnits(row, forecastWindow)}</Tag>
            <Tag color={confidenceColor(row.confidenceLevel)}>置信度 {row.confidenceLabel || '-'}</Tag>
            <Tag color="green">{row.lifecycleLabel || '未分类'}</Tag>
          </Space>
          <Text type="secondary">库存 {formatOptionalNumber(row.currentStock)} / 覆盖 {formatCoverDays(row.stockCoverDays)} 天</Text>
          <Space size={4} wrap>
            {(row.riskLabels || []).length > 0
              ? (row.riskLabels || []).map((risk) => (
                  <Tag key={risk.code} color={riskColor(risk.severity)}>
                    {risk.label}
                  </Tag>
                ))
              : <Tag>无风险</Tag>}
          </Space>
          <Text>{row.shortReason || '-'}</Text>
          <Button
            size="small"
            icon={row.followUpMarked ? <StarFilled /> : <StarOutlined />}
            loading={updatingFollowUpKey === rowKey(row)}
            onClick={() => onToggleFollowUp(row)}
          >
            {row.followUpMarked ? '取消重点跟进' : '标记重点跟进'}
          </Button>
        </div>
      ))}
    </div>
  )
}

function SalesForecastDetailDrawer({ row }: { row: SalesForecastRow }) {
  const detail = row.detail
  const featureValues = detail?.featureValues
  const factorBreakdown = detail?.factorBreakdown

  return (
    <div data-testid="sales-forecast-detail-drawer">
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <ProductBaselineIdentity
          title={row.productTitle || row.partnerSku}
          showImage={false}
          compact
          codes={[
            { label: 'PSKU', value: row.partnerSku, copyText: row.partnerSku },
            { label: 'SKU', value: row.sku, copyText: row.sku }
          ]}
        />

        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label="特征值">
            {featureValues
              ? `${featureValues.historyUnits7} / ${featureValues.historyUnits30} / ${featureValues.historyUnits60} / ${featureValues.historyUnits90}`
              : `${row.historyUnits7} / ${row.historyUnits30} / ${row.historyUnits60} / ${row.historyUnits90}`}
          </Descriptions.Item>
          <Descriptions.Item label="观察天数">{featureValues?.observedDays ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="当前库存">{formatOptionalNumber(featureValues?.currentStock ?? row.currentStock)}</Descriptions.Item>
          <Descriptions.Item label="库存覆盖">
            {formatCoverDays(featureValues?.stockCoverDays ?? row.stockCoverDays)} 天
          </Descriptions.Item>
          <Descriptions.Item label="置信度">
            {row.confidenceLabel || '-'} {row.confidenceExplanation ? `：${row.confidenceExplanation}` : ''}
          </Descriptions.Item>
          <Descriptions.Item label="风险标签">
            <Space size={4} wrap>
              {(row.riskLabels || []).length > 0
                ? (row.riskLabels || []).map((risk) => (
                    <Tag key={risk.code} color={riskColor(risk.severity)}>
                      {risk.label}
                    </Tag>
                  ))
                : '-'}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="数据质量">
            {(row.dataQualityWarnings || []).length > 0 ? row.dataQualityWarnings?.join(' / ') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="基础日均">{formatFactor(factorBreakdown?.baseDailySales)}</Descriptions.Item>
          <Descriptions.Item label="近期趋势率">{formatFactor(factorBreakdown?.recentDailyTrendRate)}</Descriptions.Item>
          <Descriptions.Item label="趋势因子">{formatFactor(factorBreakdown?.trendFactor)}</Descriptions.Item>
          <Descriptions.Item label="生命周期因子">{formatFactor(factorBreakdown?.lifecycleFactor)}</Descriptions.Item>
          <Descriptions.Item label="未来因子">{formatFactor(factorBreakdown?.futureFactor)}</Descriptions.Item>
          <Descriptions.Item label="活动影响">{row.activityExplanation || row.activityWindowSummary || '-'}</Descriptions.Item>
          <Descriptions.Item label="30/60/90预测">
            {factorBreakdown
              ? `${factorBreakdown.forecastUnits30} / ${factorBreakdown.forecastUnits60} / ${factorBreakdown.forecastUnits90}`
              : `${row.forecastUnits30} / ${row.forecastUnits60} / ${row.forecastUnits90}`}
          </Descriptions.Item>
          <Descriptions.Item label="生命周期解释">{detail?.lifecycleExplanation || '-'}</Descriptions.Item>
          <Descriptions.Item label="版本">
            {detail?.calculationVersion || row.calculationVersion || '-'} / {detail?.configVersion || row.configVersion || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Space>
    </div>
  )
}

function forecastDataIndex(forecastWindow: ForecastWindow) {
  if (forecastWindow === 60) return 'forecastUnits60'
  if (forecastWindow === 90) return 'forecastUnits90'
  return 'forecastUnits30'
}

function forecastUnits(row: SalesForecastRow, forecastWindow: ForecastWindow) {
  if (forecastWindow === 60) return row.forecastUnits60
  if (forecastWindow === 90) return row.forecastUnits90
  return row.forecastUnits30
}

function rowKey(row: SalesForecastRow) {
  return row.partnerSku || row.sku || ''
}

function filterForecastRows(
  rows: SalesForecastRow[],
  filters: {
    searchKeyword: string
    lifecycleFilter: string
    riskFilter: string
    confidenceFilter: string
  }
) {
  const keyword = filters.searchKeyword.trim().toLowerCase()
  return rows.filter((row) => {
    if (keyword) {
      const text = `${row.productTitle || ''} ${row.partnerSku || ''} ${row.sku || ''}`.toLowerCase()
      if (!text.includes(keyword)) return false
    }
    if (filters.lifecycleFilter !== 'all' && row.lifecycleCode !== filters.lifecycleFilter) {
      return false
    }
    if (filters.riskFilter === 'risk' && !(row.riskLabels || []).length) {
      return false
    }
    if (filters.riskFilter === 'none' && (row.riskLabels || []).length) {
      return false
    }
    if (filters.confidenceFilter !== 'all' && row.confidenceLevel !== filters.confidenceFilter) {
      return false
    }
    return true
  })
}

function summarizeForecastRows(rows: SalesForecastRow[], forecastWindow: ForecastWindow) {
  return rows.reduce(
    (summary, row) => ({
      totalForecastUnits: summary.totalForecastUnits + forecastUnits(row, forecastWindow),
      growthCount: summary.growthCount + (row.lifecycleCode === 'growth' ? 1 : 0),
      riskCount: summary.riskCount + ((row.riskLabels || []).length > 0 ? 1 : 0),
      lowConfidenceCount: summary.lowConfidenceCount + (row.confidenceLevel === 'low' ? 1 : 0)
    }),
    {
      totalForecastUnits: 0,
      growthCount: 0,
      riskCount: 0,
      lowConfidenceCount: 0
    }
  )
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function formatFactor(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return '-'
  const numericValue = typeof value === 'number' ? value : Number(value)
  if (Number.isFinite(numericValue)) return numericValue.toFixed(4)
  return String(value)
}

function formatOptionalNumber(value?: number | null) {
  if (value === null || value === undefined) return '-'
  return String(value)
}

function formatCoverDays(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return '-'
  const numericValue = typeof value === 'number' ? value : Number(value)
  if (Number.isFinite(numericValue)) return numericValue.toFixed(1)
  return String(value)
}

function confidenceColor(level?: string | null) {
  if (level === 'high') return 'green'
  if (level === 'medium') return 'gold'
  if (level === 'low') return 'red'
  return 'default'
}

function riskColor(severity?: string | null) {
  if (severity === 'danger') return 'red'
  if (severity === 'warning') return 'gold'
  return 'blue'
}

export default SalesForecastPage
