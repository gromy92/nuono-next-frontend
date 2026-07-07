import { CalendarOutlined, DownloadOutlined, ExclamationCircleOutlined, InfoCircleOutlined, PlusOutlined, ReloadOutlined, ShoppingOutlined } from '@ant-design/icons'
import { Alert, App, Button, DatePicker, Form, Input, InputNumber, Modal, Popover, Segmented, Select, Space, Spin, Statistic, Switch, Table, Tabs, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import type { EChartsCoreOption } from 'echarts/core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Key, ReactNode } from 'react'
import { EChartPanel, buildNetUnitsLineOption, buildSalesPriceTrendOption } from '../../shared/charts'
import type { AuthSession } from '../auth/session'
import { ProductBaselineIdentity } from '../product-baseline'
import { fetchProductClassificationOptions, type ProductClassificationOptionPayload } from '../product-management/api'
import { fetchSalesForecastDetail, fetchSalesForecastOverview, recalculateSalesForecast } from '../sales-forecast/api'
import type {
  SalesForecastDailyForecast,
  SalesForecastDetail,
  SalesForecastOverview,
  SalesForecastQuery,
  SalesForecastRow
} from '../sales-forecast/types'
import {
  exportSalesAnalyticsCsv,
  fetchActiveSalesActivityWindows,
  fetchSalesActivityWindowHistory,
  fetchSalesAnalyticsProducts,
  fetchSalesAnalyticsSummary,
  fetchSalesAnalyticsTrends,
  fetchSalesProductDetail,
  requestSalesHistoryBackfill,
  saveSalesActivityWindow
} from './api'
import type {
  DailySalesFact,
  SalesActivityWindow,
  SalesActivityWindowInput,
  SalesAnalyticsQuery,
  SalesAnalyticsSummary,
  SalesHistoryCoverage,
  SalesPriceTrendBucket,
  SalesPriceTrendState,
  SalesProductDetail,
  SalesProductRow,
  SalesTrendBucket
} from './types'

const { RangePicker } = DatePicker
const { Text, Title } = Typography

type SalesAnalyticsPageProps = {
  session: AuthSession
  mode?: 'analytics' | 'activity-config'
}

type DateRangeValue = [Dayjs, Dayjs]
type DetailRangePreset = 'week' | 'month' | 'halfYear' | 'year' | 'custom'

type ActivityWindowFormValues = {
  name: string
  activityType: string
  categoryScope?: string
  dateRange: DateRangeValue
  factor: number
  enabled: boolean
}

const latestCompleteDay = () => dayjs().subtract(1, 'day')

const initialDateRange = (): DateRangeValue => {
  const end = latestCompleteDay()
  return [end.subtract(29, 'day'), end]
}

const detailRangePresetOptions: Array<{ label: string; value: DetailRangePreset }> = [
  { label: '最近一周', value: 'week' },
  { label: '最近一个月', value: 'month' },
  { label: '最近半年', value: 'halfYear' },
  { label: '最近一年', value: 'year' },
  { label: '自定义', value: 'custom' }
]

const detailRangeForPreset = (preset: Exclude<DetailRangePreset, 'custom'>): DateRangeValue => {
  const end = latestCompleteDay()
  if (preset === 'week') return [end.subtract(6, 'day'), end]
  if (preset === 'halfYear') return [end.subtract(6, 'month').add(1, 'day'), end]
  if (preset === 'year') return [end.subtract(1, 'year').add(1, 'day'), end]
  return [end.subtract(29, 'day'), end]
}

const emptySummary: SalesAnalyticsSummary = {
  netUnits: 0,
  grossUnits: 0,
  shippedUnits: 0,
  cancelledUnits: 0,
  revenueShipped: 0,
  yourVisitors: 0,
  totalVisitors: 0,
  conversionVisitorsPercentage: null,
  buyBoxVisitorPercentage: null
}

export function SalesActivityConfigPage({ session }: { session: AuthSession }) {
  return <SalesAnalyticsPage session={session} mode="activity-config" />
}

export function SalesAnalyticsPage({ session, mode = 'analytics' }: SalesAnalyticsPageProps) {
  const { message } = App.useApp()
  const [activityForm] = Form.useForm<ActivityWindowFormValues>()
  const currentStore = session.currentStore
  const isActivityConfigMode = mode === 'activity-config'
  const [dateRange, setDateRange] = useState<DateRangeValue>(initialDateRange)
  const [search, setSearch] = useState('')
  const [partnerSkuText, setPartnerSkuText] = useState('')
  const [categoryKeyword, setCategoryKeyword] = useState('')
  const [brand, setBrand] = useState('')
  const [productFulltype, setProductFulltype] = useState('')
  const [dataQualityCode, setDataQualityCode] = useState<string | undefined>()
  const [lifecycleCode, setLifecycleCode] = useState<string | undefined>()
  const [classificationOptions, setClassificationOptions] = useState<{
    brands: ProductClassificationOptionPayload[]
    fulltypes: ProductClassificationOptionPayload[]
    loading: boolean
  }>({ brands: [], fulltypes: [], loading: false })
  const [granularity, setGranularity] = useState('week')
  const [summary, setSummary] = useState<SalesAnalyticsSummary>(emptySummary)
  const [trends, setTrends] = useState<SalesTrendBucket[]>([])
  const [products, setProducts] = useState<SalesProductRow[]>([])
  const [activityWindows, setActivityWindows] = useState<SalesActivityWindow[]>([])
  const [activityHistory, setActivityHistory] = useState<SalesActivityWindow[]>([])
  const [loading, setLoading] = useState(false)
  const [activityLoading, setActivityLoading] = useState(false)
  const [activitySaving, setActivitySaving] = useState(false)
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<SalesActivityWindow | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState<SalesProductDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailContext, setDetailContext] = useState<SalesProductRow | null>(null)
  const [detailRangePreset, setDetailRangePreset] = useState<DetailRangePreset>('month')
  const [detailDateRange, setDetailDateRange] = useState<DateRangeValue>(initialDateRange)
  const [historyBackfillLoading, setHistoryBackfillLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<SalesProductRow[]>([])
  const [compareOpen, setCompareOpen] = useState(false)

  const query = useMemo<SalesAnalyticsQuery | null>(() => {
    if (!currentStore?.storeCode) return null
    const combinedSearch = [search, categoryKeyword]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(' ')
    return {
      storeCode: currentStore.storeCode,
      siteCode: currentStore.site || siteCodeFromStoreCode(currentStore.storeCode),
      dateFrom: dateRange[0].format('YYYY-MM-DD'),
      dateTo: dateRange[1].format('YYYY-MM-DD'),
      search: combinedSearch,
      partnerSkuList: parsePartnerSkuText(partnerSkuText),
      brand,
      productFulltype,
      dataQualityCode,
      lifecycleCode
    }
  }, [brand, categoryKeyword, currentStore, dataQualityCode, dateRange, lifecycleCode, partnerSkuText, productFulltype, search])
  const forecastQuery = useMemo<SalesForecastQuery | null>(() => {
    if (!query) return null
    return {
      storeCode: query.storeCode,
      siteCode: query.siteCode
    }
  }, [query])

  const loadData = useCallback(async () => {
    if (!query) return
    setLoading(true)
    try {
      const [nextSummary, nextTrends, nextProducts] = await Promise.all([
        fetchSalesAnalyticsSummary(query),
        fetchSalesAnalyticsTrends(query, granularity),
        fetchSalesAnalyticsProducts(query)
      ])
      setSummary(nextSummary)
      setTrends(nextTrends)
      setProducts(nextProducts)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '销量分析数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [granularity, message, query])

  const loadActivities = useCallback(async () => {
    if (!query) return
    setActivityLoading(true)
    try {
      const [nextActivitySnapshot, nextHistory] = await Promise.all([
        fetchActiveSalesActivityWindows(query),
        fetchSalesActivityWindowHistory(query)
      ])
      setActivityWindows(nextActivitySnapshot.windows || [])
      setActivityHistory(nextHistory || [])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '活动配置加载失败')
    } finally {
      setActivityLoading(false)
    }
  }, [message, query])

  const loadClassificationOptions = useCallback(
    async (filter?: { brandQuery?: string; fulltypeQuery?: string }) => {
      if (!currentStore?.storeCode) {
        setClassificationOptions({ brands: [], fulltypes: [], loading: false })
        return
      }
      setClassificationOptions((current) => ({ ...current, loading: true }))
      try {
        const payload = await fetchProductClassificationOptions({
          ownerUserId: session.defaultOwnerUserId ?? session.userId,
          storeCode: currentStore.storeCode,
          brandQuery: filter?.brandQuery,
          fulltypeQuery: filter?.fulltypeQuery,
          limit: 50
        })
        setClassificationOptions({
          brands: payload.brands || [],
          fulltypes: payload.fulltypes || [],
          loading: false
        })
      } catch (error) {
        setClassificationOptions((current) => ({ ...current, loading: false }))
        message.warning(error instanceof Error ? error.message : '品牌和后台类目候选加载失败')
      }
    },
    [currentStore?.storeCode, message, session.defaultOwnerUserId, session.userId]
  )

  useEffect(() => {
    if (isActivityConfigMode) return
    void loadData()
  }, [isActivityConfigMode, loadData])

  useEffect(() => {
    if (isActivityConfigMode) return
    void loadClassificationOptions()
  }, [isActivityConfigMode, loadClassificationOptions])

  useEffect(() => {
    void loadActivities()
  }, [loadActivities])

  const loadProductDetail = useCallback(async (row: SalesProductRow, range: DateRangeValue) => {
    if (!query) return
    setDetailLoading(true)
    try {
      setDetail(await fetchSalesProductDetail({
        ...query,
        dateFrom: range[0].format('YYYY-MM-DD'),
        dateTo: range[1].format('YYYY-MM-DD')
      }, row.partnerSku))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '销量详情加载失败')
    } finally {
      setDetailLoading(false)
    }
  }, [message, query])

  const openDetail = async (row: SalesProductRow) => {
    const nextRange = detailRangeForPreset('month')
    setDetailContext(row)
    setDetail(null)
    setDetailRangePreset('month')
    setDetailDateRange(nextRange)
    setDetailOpen(true)
    await loadProductDetail(row, nextRange)
  }

  const changeDetailRangePreset = (preset: DetailRangePreset) => {
    setDetailRangePreset(preset)
    if (preset === 'custom') return
    const nextRange = detailRangeForPreset(preset)
    setDetailDateRange(nextRange)
    if (detailContext) {
      void loadProductDetail(detailContext, nextRange)
    }
  }

  const changeDetailDateRange = (range: DateRangeValue) => {
    setDetailRangePreset('custom')
    setDetailDateRange(range)
    if (detailContext) {
      void loadProductDetail(detailContext, range)
    }
  }

  const requestDetailHistoryBackfill = useCallback(async () => {
    if (!query || !detailContext) return
    setHistoryBackfillLoading(true)
    try {
      const result = await requestSalesHistoryBackfill({
        storeCode: query.storeCode,
        siteCode: query.siteCode,
        dateFrom: detailDateRange[0].format('YYYY-MM-DD'),
        dateTo: detailDateRange[1].format('YYYY-MM-DD')
      })
      message.success(result.message || '已提交历史补全任务')
      await loadProductDetail(detailContext, detailDateRange)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '历史补全提交失败')
    } finally {
      setHistoryBackfillLoading(false)
    }
  }, [detailContext, detailDateRange, loadProductDetail, message, query])

  const requestExport = async () => {
    if (!query) return
    try {
      await exportSalesAnalyticsCsv(query)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '销量导出失败')
    }
  }

  const clearFilters = () => {
    setSearch('')
    setPartnerSkuText('')
    setCategoryKeyword('')
    setBrand('')
    setProductFulltype('')
    setDataQualityCode(undefined)
    setLifecycleCode(undefined)
    setSelectedRowKeys([])
    setSelectedProducts([])
  }

  const productRowKey = (row: SalesProductRow) => row.partnerSku || row.sku || ''

  const refreshAll = () => {
    if (!isActivityConfigMode) {
      void loadData()
    }
    void loadActivities()
  }

  const openActivityModal = (window?: SalesActivityWindow) => {
    setEditingActivity(window || null)
    activityForm.setFieldsValue({
      name: window?.name || '',
      activityType: window?.activityType || 'holiday',
      categoryScope: window?.categoryScope || '',
      dateRange: window ? [dayjs(window.dateFrom), dayjs(window.dateTo)] : dateRange,
      factor: Number(window?.factor ?? 1),
      enabled: window?.enabled ?? true
    })
    setActivityModalOpen(true)
  }

  const submitActivity = async () => {
    if (!query) return
    const values = await activityForm.validateFields()
    const payload = activityPayloadFromForm(query, values, editingActivity?.id)
    setActivitySaving(true)
    try {
      await saveSalesActivityWindow(payload)
      message.success('活动配置已保存')
      setActivityModalOpen(false)
      await loadActivities()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '活动配置保存失败')
    } finally {
      setActivitySaving(false)
    }
  }

  const toggleActivity = async (window: SalesActivityWindow) => {
    if (!query) return
    setActivitySaving(true)
    try {
      await saveSalesActivityWindow({
        id: window.id,
        storeCode: query.storeCode,
        siteCode: query.siteCode,
        name: window.name,
        activityType: window.activityType,
        categoryScope: window.categoryScope || undefined,
        dateFrom: window.dateFrom,
        dateTo: window.dateTo,
        factor: Number(window.factor),
        enabled: !window.enabled
      })
      await loadActivities()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '活动状态保存失败')
    } finally {
      setActivitySaving(false)
    }
  }

  if (!currentStore?.storeCode) {
    return <Alert type="warning" showIcon message="当前账号没有可用店铺" />
  }

  const activityEditorModal = (
    <Modal
      title={editingActivity ? '编辑活动' : '新增活动'}
      open={activityModalOpen}
      confirmLoading={activitySaving}
      onOk={() => void submitActivity()}
      onCancel={() => setActivityModalOpen(false)}
    >
      <Form<ActivityWindowFormValues> form={activityForm} layout="vertical">
        <Form.Item name="name" label="活动名称" rules={[{ required: true, message: '请输入活动名称' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="activityType" label="活动类型" rules={[{ required: true, message: '请选择活动类型' }]}>
          <Select
            options={[
              { label: '节日', value: 'holiday' },
              { label: '平台活动', value: 'promotion' },
              { label: '薪酬日', value: 'salary_day' },
              { label: '其他', value: 'other' }
            ]}
          />
        </Form.Item>
        <Form.Item name="dateRange" label="活动日期" rules={[{ required: true, message: '请选择活动日期' }]}>
          <RangePicker allowClear={false} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="categoryScope" label="类目范围">
          <Input />
        </Form.Item>
        <Form.Item name="factor" label="影响因子" rules={[{ required: true, type: 'number', min: 0.1, max: 5, message: '影响因子需在 0.1 到 5 之间' }]}>
          <InputNumber step={0.05} min={0.1} max={5} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="enabled" label="启用" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )

  if (isActivityConfigMode) {
    return (
      <div data-testid="sales-activity-config-workbench" style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Space wrap>
            <RangePicker
              value={dateRange}
              allowClear={false}
              onChange={(value) => {
                if (value?.[0] && value?.[1]) setDateRange([value[0], value[1]])
              }}
            />
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={refreshAll} loading={activityLoading}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openActivityModal()}>
              新增活动
            </Button>
          </Space>
        </div>

        <ActivityMarkerSummary
          title="当前范围生效活动"
          activityWindows={activityWindows}
          loading={activityLoading}
        />

        <div data-testid="sales-activity-config" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 8 }}>
            <Space>
              <CalendarOutlined />
              <Text strong>节日配置</Text>
            </Space>
          </div>
          <Table<SalesActivityWindow>
            loading={activityLoading}
            rowKey={(row) => String(row.id)}
            size="small"
            columns={activityColumns(openActivityModal, toggleActivity, activitySaving)}
            dataSource={activityHistory}
            pagination={false}
          />
        </div>

        {activityEditorModal}
      </div>
    )
  }

  const latestSalesDate = summary.syncStatus?.latestAvailableSalesDate || latestDateFromProducts(products) || query?.dateTo
  const emptyDateRangeWarning = emptySalesDateRangeWarning(query, products, summary, latestSalesDate, loading)
  const rowSelection = {
    fixed: true,
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    getCheckboxProps: (record: SalesProductRow) => ({
      disabled: selectedRowKeys.length >= 5 && !selectedRowKeys.includes(productRowKey(record))
    }),
    onChange: (keys: Key[], rows: SalesProductRow[]) => {
      if (keys.length > 5) {
        message.warning('最多选择 5 个商品进行对比')
        return
      }
      setSelectedRowKeys(keys.map(String))
      setSelectedProducts(rows)
    }
  }

  return (
    <div data-testid="sales-analytics-workbench" style={{ display: 'grid', gap: 12 }}>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>销量分析</Title>
          </div>
          <Space wrap>
            <Button onClick={clearFilters}>清空筛选</Button>
            <Button type="primary" onClick={() => setCompareOpen(true)} disabled={selectedProducts.length < 2 || selectedProducts.length > 5}>
              对比分析
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => void requestExport()}>
              批量导出
            </Button>
            <Button icon={<ReloadOutlined />} onClick={refreshAll} loading={loading}>
              刷新
            </Button>
          </Space>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
          <Input.TextArea
            allowClear
            autoSize={{ minRows: 1, maxRows: 3 }}
            placeholder="PSKU / SKU，逗号或换行"
            value={partnerSkuText}
            onChange={(event) => setPartnerSkuText(event.target.value)}
            onPressEnter={(event) => {
              if (!event.shiftKey) void loadData()
            }}
          />
          <Input allowClear placeholder="中英文标题关键词" value={search} onChange={(event) => setSearch(event.target.value)} onPressEnter={() => void loadData()} />
          <Input allowClear placeholder="类目链接 / 关键词" value={categoryKeyword} onChange={(event) => setCategoryKeyword(event.target.value)} onPressEnter={() => void loadData()} />
          <Select
            allowClear
            showSearch
            data-testid="sales-brand-filter"
            placeholder="品牌"
            value={brand || undefined}
            loading={classificationOptions.loading}
            filterOption={false}
            options={classificationSelectOptions(classificationOptions.brands)}
            onChange={(value) => setBrand(value || '')}
            onSearch={(value) => void loadClassificationOptions({ brandQuery: value })}
            onFocus={() => void loadClassificationOptions()}
          />
          <Select
            allowClear
            showSearch
            data-testid="sales-fulltype-filter"
            placeholder="后台类目"
            value={productFulltype || undefined}
            loading={classificationOptions.loading}
            filterOption={false}
            options={classificationSelectOptions(classificationOptions.fulltypes)}
            onChange={(value) => setProductFulltype(value || '')}
            onSearch={(value) => void loadClassificationOptions({ fulltypeQuery: value })}
            onFocus={() => void loadClassificationOptions()}
          />
          <Select
            allowClear
            data-testid="sales-lifecycle-filter"
            placeholder="商品生命周期"
            value={lifecycleCode}
            options={lifecycleFilterOptions}
            onChange={(value) => setLifecycleCode(value)}
          />
          <Select
            allowClear
            data-testid="sales-health-filter"
            placeholder="健康度标签"
            value={dataQualityCode}
            options={healthFilterOptions}
            onChange={(value) => setDataQualityCode(value)}
          />
          <RangePicker
            value={dateRange}
            allowClear={false}
            onChange={(value) => {
              if (value?.[0] && value?.[1]) setDateRange([value[0], value[1]])
            }}
          />
        </div>

        <DataStatus summary={summary} latestSalesDate={latestSalesDate} productCount={products.length} selectedCount={selectedProducts.length} />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
        <div
          data-testid="sales-product-list-heading"
          style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderBottom: '1px solid #eef2f7', flexWrap: 'wrap' }}
        >
          <Title level={5} style={{ margin: 0 }}>商品销量列表</Title>
          <Text type="secondary">
            {products.length} 个商品 · 真实销量最新日 {latestSalesDate || '—'}
          </Text>
        </div>
        {emptyDateRangeWarning ? (
          <Alert
            data-testid="sales-empty-date-range-warning"
            type="warning"
            showIcon
            message={emptyDateRangeWarning}
            style={{ margin: 12 }}
          />
        ) : null}
        <Table<SalesProductRow>
          data-testid="sales-analytics-products"
          loading={loading}
          rowKey={productRowKey}
          rowSelection={rowSelection}
          size="middle"
          columns={productColumns(
            openDetail
          )}
          dataSource={products}
          locale={{ emptyText: '暂无商品销量数据' }}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1500 }}
        />
      </div>

      <ComparisonDialog
        open={compareOpen}
        products={selectedProducts}
        trends={trends}
        onClose={() => setCompareOpen(false)}
      />

      <ProductDetailDialog
        open={detailOpen}
        loading={detailLoading}
        row={detailContext}
        detail={detail}
        granularity={granularity}
        detailRangePreset={detailRangePreset}
        detailDateRange={detailDateRange}
        forecastQuery={forecastQuery}
        onClose={() => setDetailOpen(false)}
        onDetailRangePresetChange={changeDetailRangePreset}
        onDetailDateRangeChange={changeDetailDateRange}
        onHistoryBackfill={() => void requestDetailHistoryBackfill()}
        historyBackfillLoading={historyBackfillLoading}
      />
    </div>
  )
}

function Metric({
  title,
  value,
  precision,
  suffix,
  description
}: {
  title: string
  value: number | string
  precision?: number
  suffix?: string
  description?: string
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 12px' }}>
      <Statistic
        title={<MetricTitle title={title} description={description} />}
        value={value}
        precision={typeof value === 'number' ? precision : undefined}
        suffix={suffix}
      />
    </div>
  )
}

function MetricTitle({ title, description }: { title: string; description?: string }) {
  return (
    <Space size={4}>
      <span>{title}</span>
      {description ? (
        <Tooltip title={description}>
          <InfoCircleOutlined data-testid={`sales-metric-help-${title}`} style={{ color: '#8c8c8c' }} />
        </Tooltip>
      ) : null}
    </Space>
  )
}

function ActivityMarkerSummary({
  title,
  activityWindows,
  loading,
  manageHref
}: {
  title: string
  activityWindows: SalesActivityWindow[]
  loading: boolean
  manageHref?: string
}) {
  return (
    <div
      data-testid="sales-activity-marker-summary"
      style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 12px' }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Space wrap>
          <CalendarOutlined />
          <Text strong>{title}</Text>
          {loading ? <Text type="secondary">加载中</Text> : null}
          {!loading && activityWindows.length ? (
            activityWindows.map((window) => (
              <Tag key={window.id} color="blue">
                {window.name} {Number(window.factor).toFixed(2)}x
              </Tag>
            ))
          ) : null}
          {!loading && !activityWindows.length ? <Text type="secondary">当前范围暂无节日/活动标记</Text> : null}
        </Space>
        {manageHref ? (
          <Button size="small" icon={<CalendarOutlined />} href={manageHref}>
            管理节日配置
          </Button>
        ) : null}
      </div>
    </div>
  )
}

const lifecycleFilterOptions = [
  { label: '新品', value: 'new' },
  { label: '增长', value: 'growth' },
  { label: '稳定', value: 'stable' },
  { label: '衰退', value: 'decline' },
  { label: '长尾期', value: 'longTail' },
  { label: '数据不足', value: 'data_insufficient' },
  { label: '待计算', value: 'pending' }
]

const healthFilterOptions = [
  { label: '销量就绪', value: 'sales_fact_ready' },
  { label: '商品主档未匹配', value: 'product_dimension_missing' },
  { label: '品牌缺失', value: 'brand_missing' },
  { label: '后台类目缺失', value: 'backend_fulltype_missing' }
]

function DataStatus({
  summary,
  latestSalesDate,
  productCount,
  selectedCount
}: {
  summary: SalesAnalyticsSummary
  latestSalesDate?: string
  productCount: number
  selectedCount: number
}) {
  const statusState = summary.syncStatus?.state
  const available = summary.businessMetricsAvailable !== false
  return (
    <div
      data-testid="sales-data-status"
      style={{ borderLeft: '3px solid #5e3cde', background: '#f8fafc', padding: '10px 12px', borderRadius: 6 }}
    >
      <Space wrap>
        <Text strong>数据状态：</Text>
        <Text>{productCount} 个商品 · 真实销量最新日 {latestSalesDate || '—'}</Text>
        <Tag color={available ? 'green' : 'gold'}>{statusState ? syncStatusLabel(statusState) : 'ready'}</Tag>
        <Text type="secondary">已选 {selectedCount} 个</Text>
        <Text type="secondary">未接入字段：在途、退货率、竞品价格、去年同期。</Text>
      </Space>
    </div>
  )
}

function ComparisonDialog({
  open,
  products,
  trends,
  onClose
}: {
  open: boolean
  products: SalesProductRow[]
  trends: SalesTrendBucket[]
  onClose: () => void
}) {
  return (
    <Modal title="商品横向对比" open={open} width={980} footer={null} onCancel={onClose}>
      <Tabs
        items={[
          {
            key: 'metrics',
            label: '指标对比',
            children: (
              <div style={{ display: 'grid', gap: 10 }}>
                {products.map((product) => (
                  <div key={`${product.partnerSku}|${product.sku}`} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 12 }}>
                    <Space direction="vertical" size={4}>
                      <ProductBaselineIdentity
                        title={product.productTitle || product.partnerSku}
                        imageUrl={product.imageUrl}
                        imageCount={product.imageUrl ? 1 : 0}
                        imageAlt={product.productTitle || product.partnerSku}
                        imageWidth={72}
                        compact
                        codes={[
                          { label: 'PSKU', value: product.partnerSku, copyText: product.partnerSku },
                          { label: 'SKU', value: product.sku, copyText: product.sku }
                        ]}
                      />
                      <Text>
                        发货 {formatNumber(product.shippedUnits)} / PV {formatNumber(product.yourVisitors)} / 可售库存 {formatNumber(product.currentStock)} / 在途 — / 30天预测 — / {primaryHealthLabel(product)}
                      </Text>
                    </Space>
                  </div>
                ))}
              </div>
            )
          },
          {
            key: 'trend',
            label: '趋势对比',
            children: (
              <div style={{ display: 'grid', gap: 10 }}>
                <Text type="secondary">使用当前范围真实销量事实进行对比；商品级日销量和价格叠加图在详情中查看。</Text>
                {products.map((product) => (
                  <div key={`${product.partnerSku}|trend`} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 80px', gap: 8, alignItems: 'center' }}>
                    <Text>{product.partnerSku}</Text>
                    <div style={{ height: 8, background: '#eef2ff', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.max(6, Math.min(100, Number(product.netUnits || 0) * 8))}%`, height: '100%', background: '#5e3cde' }} />
                    </div>
                    <Text>{formatNumber(product.netUnits)}</Text>
                  </div>
                ))}
                {trends.length ? <Text type="secondary">当前页面趋势粒度：{trends.map((item) => item.bucketLabel).join(' / ')}</Text> : null}
              </div>
            )
          }
        ]}
      />
    </Modal>
  )
}

function ProductDetailDialog({
  open,
  loading,
  row,
  detail,
  granularity,
  detailRangePreset,
  detailDateRange,
  forecastQuery,
  onClose,
  onDetailRangePresetChange,
  onDetailDateRangeChange,
  onHistoryBackfill,
  historyBackfillLoading
}: {
  open: boolean
  loading: boolean
  row: SalesProductRow | null
  detail: SalesProductDetail | null
  granularity: string
  detailRangePreset: DetailRangePreset
  detailDateRange: DateRangeValue
  forecastQuery: SalesForecastQuery | null
  onClose: () => void
  onDetailRangePresetChange: (preset: DetailRangePreset) => void
  onDetailDateRangeChange: (range: DateRangeValue) => void
  onHistoryBackfill: () => void
  historyBackfillLoading: boolean
}) {
  const summary = detail?.summary
  const currentStock = row?.currentStock ?? detail?.currentStock
  const stockCoverDays = row?.stockCoverDays ?? detail?.stockCoverDays
  const imageUrl = row?.imageUrl || detail?.imageUrl
  const productTitle = row?.productTitle || detail?.productTitle || row?.partnerSku || '-'
  const partnerSku = row?.partnerSku || detail?.partnerSku || '-'
  const sku = row?.sku || detail?.sku || '-'
  const brandLabel = row?.brand || '品牌 —'
  const categoryLabel = lastCategoryLabel(row?.productFulltype)
  const lifecycleLabel = row?.lifecycleLabel || '生命周期 —'
  const trendDataRange = formatTrendDataRange(detail?.facts || [], detail?.priceTrend || []) || formatDateRange(detailDateRange)
  const [activeDetailTab, setActiveDetailTab] = useState<'sales' | 'forecast'>('sales')

  useEffect(() => {
    if (open) {
      setActiveDetailTab('sales')
    }
  }, [open, partnerSku])

  return (
    <Modal title={<Space size={6}><ShoppingOutlined />商品详情</Space>} open={open} width={1180} footer={null} onCancel={onClose}>
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <div style={{ paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
          <ProductBaselineIdentity
            title={productTitle}
            imageUrl={imageUrl}
            imageCount={imageUrl ? 1 : 0}
            imageAlt={productTitle}
            imageWidth={104}
            titleMaxWidth="100%"
            codes={[
              { label: 'PSKU', value: partnerSku, copyText: partnerSku },
              { label: 'SKU', value: sku, copyText: sku }
            ]}
            tags={
              <>
                <Tag style={{ marginInlineEnd: 0 }}>{brandLabel}</Tag>
                <Tag title={row?.productFulltype || undefined} style={{ marginInlineEnd: 0 }}>{categoryLabel}</Tag>
                <Tag color={lifecycleColor(row?.lifecycleCode)} style={{ marginInlineEnd: 0 }}>{lifecycleLabel}</Tag>
              </>
            }
            extra={
              <Space wrap size={[4, 4]} align="center">
                {healthTags(row || undefined)}
                <Tag style={{ marginInlineEnd: 0 }}>可售 {formatNumber(currentStock)}</Tag>
                <Tag style={{ marginInlineEnd: 0 }}>覆盖 {formatStockCoverDays(stockCoverDays)}</Tag>
              </Space>
            }
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Space wrap size={[8, 6]}>
            <Text strong>时间范围</Text>
            <Segmented<DetailRangePreset>
              data-testid="sales-detail-range-preset"
              size="small"
              value={detailRangePreset}
              options={detailRangePresetOptions}
              onChange={onDetailRangePresetChange}
            />
            {detailRangePreset === 'custom' ? (
              <span data-testid="sales-detail-custom-range">
                <RangePicker
                  allowClear={false}
                  value={detailDateRange}
                  onChange={(value) => {
                    if (value?.[0] && value?.[1]) onDetailDateRangeChange([value[0], value[1]])
                  }}
                />
              </span>
            ) : (
              <Text type="secondary">
                {formatDateRange(detailDateRange)}
              </Text>
            )}
          </Space>
          {loading ? <Text type="secondary">加载中</Text> : null}
        </div>

        {activeDetailTab === 'sales' ? (
          <HistoryCoverageStatus
            coverage={detail?.historyCoverage}
            loading={historyBackfillLoading}
            onBackfill={onHistoryBackfill}
          />
        ) : null}

        <Tabs
          activeKey={activeDetailTab}
          onChange={(key) => setActiveDetailTab(key === 'forecast' ? 'forecast' : 'sales')}
          items={[
            {
              key: 'sales',
              label: '销量分析',
              children: (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <SummaryStrip
                    items={[
                      { title: '当前范围净销量', value: `${formatNumber(summary?.netUnits)} 件` },
                      { title: '访客 / 转化', value: `${formatNumber(summary?.yourVisitors)} / ${formatPercent(summary?.conversionVisitorsPercentage)}` },
                      { title: '收入', value: `${formatMoney(summary?.revenueShipped)} SAR` }
                    ]}
                  />
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderBottom: '1px solid #eef2f7', flexWrap: 'wrap' }}>
                      <Space direction="vertical" size={0}>
                        <Text strong>销量趋势</Text>
                        <Text type="secondary">
                          {granularity === 'week' ? '当前粒度为周，商品级日明细接入后可切换到日。' : '使用当前可用真实销量事实。'}
                        </Text>
                      </Space>
                      <Text data-testid="sales-trend-data-range" type="secondary">{trendDataRange}</Text>
                    </div>
                    <div style={{ padding: '8px 12px 12px' }}>
                      <TrendLineChart
                        facts={detail?.facts || []}
                        loading={loading}
                        priceTrend={detail?.priceTrend || []}
                        priceTrendState={detail?.priceTrendState}
                      />
                    </div>
                  </div>
                </Space>
              )
            },
            {
              key: 'forecast',
              label: '销量预测',
              children: (
                <ProductForecastPanel
                  open={open}
                  query={forecastQuery}
                  row={row}
                  currentStock={currentStock}
                  stockCoverDays={stockCoverDays}
                  detailDateRange={detailDateRange}
                  actualFacts={detail?.facts || []}
                />
              )
            }
          ]}
        />
      </Space>
    </Modal>
  )
}

function ProductForecastPanel({
  open,
  query,
  row,
  currentStock,
  stockCoverDays,
  detailDateRange,
  actualFacts
}: {
  open: boolean
  query: SalesForecastQuery | null
  row: SalesProductRow | null
  currentStock?: number | null
  stockCoverDays?: number | null
  detailDateRange: DateRangeValue
  actualFacts: DailySalesFact[]
}) {
  const { message } = App.useApp()
  const [overview, setOverview] = useState<SalesForecastOverview | null>(null)
  const [forecastRow, setForecastRow] = useState<SalesForecastRow | null>(null)
  const [forecastDetail, setForecastDetail] = useState<SalesForecastDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const partnerSku = row?.partnerSku || ''
  const loadForecast = useCallback(async () => {
    if (!open || !query || !partnerSku) return
    setLoading(true)
    setErrorMessage('')
    try {
      const nextOverview = await fetchSalesForecastOverview(query)
      const requestedProductKey = normalizeProductKey(partnerSku)
      const matchedRow = (nextOverview.rows || []).find((item) => normalizeProductKey(item.partnerSku) === requestedProductKey) || null
      setOverview(nextOverview)
      setForecastRow(matchedRow)
      setForecastDetail(matchedRow ? await fetchSalesForecastDetail(query, matchedRow.partnerSku) : null)
    } catch (error) {
      setOverview(null)
      setForecastRow(null)
      setForecastDetail(null)
      setErrorMessage(error instanceof Error ? error.message : '销量预测加载失败')
    } finally {
      setLoading(false)
    }
  }, [open, partnerSku, query])

  useEffect(() => {
    if (!open) return
    void loadForecast()
  }, [loadForecast, open])

  const recalculate = async () => {
    if (!query || !partnerSku) return
    setRecalculating(true)
    setErrorMessage('')
    try {
      await recalculateSalesForecast(query)
      await loadForecast()
      message.success('预测已重新计算')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '销量预测重算失败')
    } finally {
      setRecalculating(false)
    }
  }

  const factorBreakdown = forecastDetail?.factorBreakdown || forecastRow?.detail?.factorBreakdown
  const dailyForecasts = factorBreakdown?.dailyForecasts || []
  const rangeForecastUnits = useMemo(
    () => forecastUnitsForRange(dailyForecasts, detailDateRange),
    [dailyForecasts, detailDateRange]
  )
  const rangeActualUnits = useMemo(
    () => actualUnitsForRange(actualFacts, detailDateRange),
    [actualFacts, detailDateRange]
  )
  const chartOption = useMemo(
    () => buildActualAndForecastChartOption(actualFacts, dailyForecasts, detailDateRange),
    [actualFacts, dailyForecasts, detailDateRange]
  )
  const confidenceLabel = forecastRow?.confidenceLabel || '—'
  const emptyTitle = overview?.emptyState?.title || (overview?.state === 'ready' ? '该商品暂无预测结果' : '暂无销量预测结果')
  const emptyDescription =
    overview?.emptyState?.description ||
    (overview?.state === 'ready'
      ? '当前预测结果集中没有匹配到该 PSKU。'
      : '当前店铺还没有预测运行结果。')

  return (
    <Spin spinning={loading || recalculating}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Space wrap>
            <Text strong>销量预测</Text>
            {overview?.sourceDataDate ? <Tag>数据日 {overview.sourceDataDate}</Tag> : null}
            {overview?.calculationVersion ? <Tag>{overview.calculationVersion}</Tag> : null}
            <Tag>{formatDateRange(detailDateRange)}</Tag>
          </Space>
          <Space>
            <Button size="small" icon={<ReloadOutlined />} onClick={() => void loadForecast()} disabled={!query || !partnerSku}>
              刷新预测
            </Button>
            <Button size="small" type="primary" onClick={() => void recalculate()} loading={recalculating} disabled={!query || !partnerSku}>
              重新计算预测
            </Button>
          </Space>
        </div>

        {errorMessage ? <Alert type="error" showIcon message="销量预测加载失败" description={errorMessage} /> : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          <SummaryTile testId="sales-analytics-forecast-range-units" title="筛选范围预测" value={formatForecastUnits(rangeForecastUnits)} />
          <SummaryTile testId="sales-analytics-forecast-range-actual-units" title="筛选范围实际" value={formatForecastUnits(rangeActualUnits)} />
          <SummaryTile title="30天预测" value={formatForecastUnits(forecastRow?.forecastUnits30)} />
          <SummaryTile title="60天预测" value={formatForecastUnits(forecastRow?.forecastUnits60)} />
          <SummaryTile title="90天预测" value={formatForecastUnits(forecastRow?.forecastUnits90)} />
          <SummaryTile title="当前库存" value={typeof currentStock === 'number' ? `${formatNumber(currentStock)} 件` : '—'} />
          <SummaryTile title="库存覆盖天数" value={formatStockCoverDays(stockCoverDays)} />
          <SummaryTile title="置信度" value={confidenceLabel} />
        </div>

        {!forecastRow && !loading ? (
          <Alert
            type={overview?.state === 'ready' ? 'warning' : 'info'}
            showIcon
            message={emptyTitle}
            description={emptyDescription}
          />
        ) : null}

        {forecastRow ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Space size={4} wrap>
              {(forecastRow.riskLabels || []).length
                ? (forecastRow.riskLabels || []).map((risk) => (
                    <Tag key={risk.code} color={forecastRiskColor(risk.severity)}>
                      {risk.label}
                    </Tag>
                  ))
                : <Tag>无风险标签</Tag>}
            </Space>

            <EChartPanel
              option={chartOption}
              state={chartOption ? 'ready' : 'empty'}
              emptyText="当前筛选范围暂无实际销量或逐日预测数据"
              height={240}
              testId="sales-analytics-forecast-daily-chart"
              ariaLabel="实际销量与未来120天逐日预测销量"
              title="实际销量与未来120天逐日预测"
            />

            <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 12 }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Text strong>预测依据</Text>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                  <Text type="secondary">历史 7/30/60/90：{forecastRow.historyUnits7} / {forecastRow.historyUnits30} / {forecastRow.historyUnits60} / {forecastRow.historyUnits90}</Text>
                  <Text type="secondary">基础日均：{formatForecastFactor(factorBreakdown?.baseDailySales)}</Text>
                  <Text type="secondary">趋势因子：{formatForecastFactor(factorBreakdown?.trendFactor)}</Text>
                  <Text type="secondary">30/60/90因子：{formatForecastFactor(factorBreakdown?.futureFactor30 ?? factorBreakdown?.futureFactor)} / {formatForecastFactor(factorBreakdown?.futureFactor60)} / {formatForecastFactor(factorBreakdown?.futureFactor90)}</Text>
                </div>
                <Text>{forecastRow.shortReason || '-'}</Text>
                {forecastRow.confidenceExplanation ? <Text type="secondary">{forecastRow.confidenceExplanation}</Text> : null}
              </Space>
            </div>
          </Space>
        ) : null}
      </Space>
    </Spin>
  )
}

function HistoryCoverageStatus({
  coverage,
  loading,
  onBackfill
}: {
  coverage?: SalesHistoryCoverage | null
  loading: boolean
  onBackfill: () => void
}) {
  if (!coverage || coverage.backfill.state === 'covered') {
    return null
  }
  const backfill = coverage.backfill
  const salesRange = compactRangeText('销量', coverage.salesFactDateFrom, coverage.salesFactDateTo)
  const priceRange = compactRangeText('价格', coverage.priceDateFrom, coverage.priceDateTo)
  return (
    <Alert
      data-testid="sales-history-coverage-status"
      type={backfill.actionAvailable ? 'warning' : 'info'}
      showIcon
      message={
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Space wrap size={[8, 4]}>
            <Text strong>{backfill.label}</Text>
            <Text type="secondary">{backfill.message}</Text>
            {salesRange ? <Tag style={{ marginInlineEnd: 0 }}>{salesRange}</Tag> : null}
            {priceRange ? <Tag style={{ marginInlineEnd: 0 }}>{priceRange}</Tag> : null}
          </Space>
          {backfill.actionAvailable ? (
            <Button size="small" icon={<ReloadOutlined />} loading={loading} onClick={onBackfill}>
              触发历史补全
            </Button>
          ) : null}
        </div>
      }
    />
  )
}

function SummaryStrip({ items }: { items: Array<{ title: string; value: string }> }) {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'nowrap',
        overflowX: 'auto'
      }}
    >
      {items.map((item, index) => (
        <div
          key={item.title}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            whiteSpace: 'nowrap',
            minWidth: 0,
            flex: '1 0 max-content',
            padding: index === 0 ? '0 18px 0 0' : '0 18px',
            borderLeft: index ? '1px solid #e5e7eb' : undefined
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>{item.title}</Text>
          <Text strong style={{ fontSize: 16 }}>{item.value}</Text>
        </div>
      ))}
    </div>
  )
}

function SummaryTile({ title, value, testId }: { title: string; value: string; testId?: string }) {
  return (
    <div data-testid={testId} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 12px' }}>
      <Text type="secondary" style={{ fontSize: 12 }}>{title}</Text>
      <div style={{ marginTop: 4, fontSize: 18, fontWeight: 600 }}>{value}</div>
    </div>
  )
}

function buildActualAndForecastChartOption(
  actualFacts: DailySalesFact[],
  forecastPoints: SalesForecastDailyForecast[],
  range: DateRangeValue
): EChartsCoreOption | null {
  const axisDates = datesBetween(range)
  if (!axisDates.length) return null
  const actualByDate = new Map(
    actualFacts
      .filter((fact) => fact.factDate)
      .map((fact) => [fact.factDate, typeof fact.netUnits === 'number' ? fact.netUnits : 0])
  )
  const forecastByDate = new Map(
    forecastPoints
      .filter((point) => point.forecastDate)
      .map((point) => [String(point.forecastDate), numericForecastValue(point.forecastUnits)])
  )
  const actualValues = axisDates.map((date) => actualByDate.has(date) ? actualByDate.get(date) ?? 0 : null)
  const forecastValues = axisDates.map((date) => forecastByDate.has(date) ? forecastByDate.get(date) ?? 0 : null)
  const hasData = actualValues.some((value) => value !== null) || forecastValues.some((value) => value !== null)
  if (!hasData) return null
  return {
    legend: {
      bottom: 0,
      data: ['实际销量', '预测销量'],
      icon: 'roundRect'
    },
    grid: {
      bottom: 42,
      containLabel: true,
      left: 8,
      right: 14,
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
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: 'rgba(15, 23, 42, 0.08)',
      borderRadius: 8,
      borderWidth: 1,
      extraCssText: 'box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);',
      formatter: (params: unknown) => {
        const items = Array.isArray(params) ? params : [params]
        const first = items[0]
        const dataIndex = typeof first === 'object' && first && 'dataIndex' in first ? Number((first as { dataIndex: number }).dataIndex) : 0
        const date = axisDates[dataIndex]
        const rows = items
          .map((item) => {
            if (!item || typeof item !== 'object') return ''
            const seriesName = 'seriesName' in item ? String((item as { seriesName: string }).seriesName) : ''
            const value = 'value' in item ? (item as { value?: number | null }).value : null
            if (value === null || value === undefined || !Number.isFinite(Number(value))) return ''
            const color = seriesName === '实际销量' ? '#14b8a6' : '#1677ff'
            return `
              <div style="display:flex;align-items:center;gap:8px;color:#475569;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${color};"></span>
                <span>${seriesName}</span>
                <span style="font-weight:700;color:#111827;">${formatChartUnits(Number(value))}</span>
                <span>件</span>
              </div>
            `
          })
          .filter(Boolean)
          .join('')
        return `
          <div style="font-weight:600;color:#111827;margin-bottom:6px;">${date}</div>
          ${rows}
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
      data: axisDates.map((date) => date.slice(5)),
      type: 'category'
    },
    yAxis: {
      axisLabel: {
        color: '#64748b'
      },
      axisTick: {
        show: false
      },
      name: '预测销量',
      nameLocation: 'end',
      nameTextStyle: {
        color: '#64748b',
        fontWeight: 600,
        padding: [0, 0, 0, 44]
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
        data: actualValues,
        emphasis: {
          focus: 'series'
        },
        itemStyle: {
          color: '#14b8a6'
        },
        lineStyle: {
          color: '#14b8a6',
          width: 2
        },
        name: '实际销量',
        showSymbol: false,
        smooth: true,
        type: 'line'
      },
      {
        areaStyle: {
          color: {
            colorStops: [
              {
                color: 'rgba(22, 119, 255, 0.20)',
                offset: 0
              },
              {
                color: 'rgba(20, 184, 166, 0.03)',
                offset: 1
              }
            ],
            type: 'linear',
            x: 0,
            x2: 0,
            y: 0,
            y2: 1
          }
        },
        data: forecastValues,
        emphasis: {
          focus: 'series'
        },
        itemStyle: {
          color: '#1677ff'
        },
        lineStyle: {
          color: '#1677ff',
          type: 'dashed',
          width: 2
        },
        name: '预测销量',
        showSymbol: false,
        smooth: true,
        type: 'line'
      }
    ]
  }
}

function TrendLineChart({
  facts,
  loading,
  priceTrend,
  priceTrendState
}: {
  facts: DailySalesFact[]
  loading: boolean
  priceTrend: SalesPriceTrendBucket[]
  priceTrendState?: SalesPriceTrendState | null
}) {
  const chartOption = useMemo(
    () => {
      if (!facts.length) return null
      const salesPoints = facts.map((fact) => ({
        date: dayjs(fact.factDate).format('MM-DD'),
        fullDate: fact.factDate,
        value: Number(fact.netUnits || 0)
      }))
      if (priceTrendState?.state === 'ready' && priceTrend.length) {
        return buildSalesPriceTrendOption(
          salesPoints,
          priceTrend.map((bucket) => ({
            date: dayjs(bucket.bucketStart).format('MM-DD'),
            fullDate: bucket.bucketStart,
            avgOfferPrice: numericOrNull(bucket.avgOfferPrice),
            minOfferPrice: numericOrNull(bucket.minOfferPrice),
            maxOfferPrice: numericOrNull(bucket.maxOfferPrice),
            orderLineCount: Number(bucket.orderLineCount || 0),
            currencyCode: bucket.currencyCode || undefined
          }))
        )
      }
      return buildNetUnitsLineOption(salesPoints)
    },
    [facts, priceTrend, priceTrendState?.state]
  )
  const showPriceState = priceTrendState && priceTrendState.state !== 'ready'

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {showPriceState ? (
        <Text data-testid="sales-price-trend-state" type="secondary">
          {priceTrendState.message || priceTrendState.label}
        </Text>
      ) : null}
      <EChartPanel
        option={chartOption}
        state={loading ? 'loading' : facts.length ? 'ready' : 'empty'}
        emptyText="暂无趋势数据"
        height={300}
        testId="sales-trend-echart"
        ariaLabel="商品日销量折线图"
      />
    </div>
  )
}

const productColumnHelp = {
  product: {
    testId: 'sales-column-help-product',
    description: '展示商品标题、PSKU、SKU、品牌、后台类目和生命周期。品牌/后台类目来自商品管理主档，未匹配时会显示缺失标签。'
  },
  health: {
    testId: 'sales-column-help-health',
    description: '展示当前商品的数据质量和经营状态，例如销量是否就绪、商品主档是否匹配、品牌或后台类目是否缺失。'
  },
  traffic: {
    testId: 'sales-column-help-traffic',
    description: '访客为商品详情页访问人数，转化率为订单转化表现。最新日表示该商品最新销量事实日的单日指标；当前范围表示当前筛选日期范围内的汇总指标。'
  },
  sales: {
    testId: 'sales-column-help-sales',
    description: '净销量=毛销量扣除取消后的销量；毛销量、发货、取消用于判断订单履约和取消影响。'
  },
  revenue: {
    testId: 'sales-column-help-revenue',
    description: '收入为当前筛选范围内已发货销售额汇总；客单价按收入除以净销量推算。'
  },
  inventory: {
    testId: 'sales-column-help-inventory',
    description: '可售库存来自商品管理库存数据，包含 FBN、Supermall、FBP；覆盖天数按当前库存除以当前范围日均净销量估算。'
  },
  inTransit: {
    testId: 'sales-column-help-in-transit',
    description: '在途库存用于展示采购或物流途中数量；当前底层数据尚未接入，因此保持为空。'
  },
  trendSnapshot: {
    testId: 'sales-column-help-trend-snapshot',
    description: '最新日表示该商品最新销量事实日的单日净销量；当前范围表示筛选日期范围内的累计净销量，用于判断近期销量是否偏离区间表现。'
  },
  forecast: {
    testId: 'sales-column-help-forecast',
    description: '未来预测预留给销量预测结果；没有可信预测结果时不展示伪造数据。'
  }
} as const

function columnTitle(title: string, help: (typeof productColumnHelp)[keyof typeof productColumnHelp]) {
  return (
    <Space size={4} align="center">
      <span>{title}</span>
      <Tooltip title={help.description}>
        <span
          aria-label={`${title}字段说明`}
          data-testid={help.testId}
          style={{ color: '#faad14', cursor: 'help', fontSize: 12, lineHeight: 1, position: 'relative', top: -2 }}
        >
          <ExclamationCircleOutlined />
        </span>
      </Tooltip>
    </Space>
  )
}

function productColumns(
  onOpenDetail: (row: SalesProductRow) => void
): ColumnsType<SalesProductRow> {
  return [
    {
      title: columnTitle('商品信息', productColumnHelp.product),
      key: 'product',
      width: 280,
      fixed: 'left',
      render: (_, row) => (
        <Popover content={<ProductIdentityPopover row={row} />} trigger="hover" placement="rightTop">
          <div>
            <ProductBaselineIdentity
              title={row.productTitle || row.partnerSku}
              imageUrl={row.imageUrl}
              imageCount={row.imageUrl ? 1 : 0}
              imageAlt={row.productTitle || row.partnerSku}
              imageWidth={72}
              compact
              titleMaxWidth={178}
              codes={[
                { label: 'PSKU', value: row.partnerSku, copyText: row.partnerSku },
                { label: 'SKU', value: row.sku, copyText: row.sku }
              ]}
              tags={
                <>
                  <Tag color={lifecycleColor(row.lifecycleCode)} style={{ fontSize: 11, marginInlineEnd: 0, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.lifecycleLabel || '生命周期 —'}
                  </Tag>
                  <Tag style={{ fontSize: 11, marginInlineEnd: 0, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.brand || '品牌 —'}</Tag>
                  <Tag title={row.productFulltype || undefined} style={{ fontSize: 11, marginInlineEnd: 0, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lastCategoryLabel(row.productFulltype)}
                  </Tag>
                </>
              }
            />
          </div>
        </Popover>
      )
    },
    {
      title: columnTitle('健康度', productColumnHelp.health),
      key: 'health',
      width: 130,
      render: (_, row) => <Space direction="vertical" size={4}>{healthTags(row)}</Space>
    },
    {
      title: columnTitle('访客与转化', productColumnHelp.traffic),
      key: 'traffic',
      width: 150,
      render: (_, row) => (
        <TrafficMetric
          latestVisitors={row.latestYourVisitors ?? row.yourVisitors}
          latestConversion={row.latestConversionVisitorsPercentage ?? row.conversionVisitorsPercentage}
          rangeVisitors={row.yourVisitors}
          rangeConversion={row.conversionVisitorsPercentage}
        />
      )
    },
    {
      title: columnTitle('销量表现', productColumnHelp.sales),
      key: 'sales',
      width: 150,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Text>净销量 {formatNumber(row.netUnits)}</Text>
          <Text type="secondary">毛 {formatNumber(row.grossUnits)} / 发 {formatNumber(row.shippedUnits)} / 取消 {formatNumber(row.cancelledUnits)}</Text>
        </Space>
      )
    },
    {
      title: columnTitle('收入', productColumnHelp.revenue),
      key: 'revenue',
      width: 120,
      render: (_, row) => <Space direction="vertical" size={0}><Text strong>{formatMoney(row.revenueShipped)} SAR</Text><Text type="secondary">客单价 {formatMoney(averageOrderValue(row.revenueShipped, row.netUnits))}</Text></Space>
    },
    {
      title: columnTitle('库存', productColumnHelp.inventory),
      key: 'inventory',
      width: 110,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Text>可售 {formatNumber(row.currentStock)}</Text>
          <Text type="secondary">覆盖 {formatStockCoverDays(row.stockCoverDays)}</Text>
        </Space>
      )
    },
    {
      title: columnTitle('在途', productColumnHelp.inTransit),
      key: 'inTransit',
      width: 90,
      render: () => <Text>—</Text>
    },
    {
      title: columnTitle('趋势快照', productColumnHelp.trendSnapshot),
      key: 'trendSnapshot',
      width: 150,
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Text>{formatNumber(row.latestNetUnits ?? row.netUnits)}</Text>
          <Text type="secondary">{formatNumber(row.netUnits)}</Text>
        </Space>
      )
    },
    {
      title: columnTitle('未来预测', productColumnHelp.forecast),
      key: 'forecast',
      width: 130,
      render: () => <Space direction="vertical" size={0}><Text>30天 —</Text><Text type="secondary">置信度 —</Text></Space>
    },
    {
      title: '操作',
      key: 'action',
      width: 72,
      fixed: 'right',
      render: (_, row) => (
        <Button size="small" aria-label="详情" onClick={() => onOpenDetail(row)} style={{ width: 48 }}>详情</Button>
      )
    }
  ]
}

function ProductIdentityPopover({ row }: { row: SalesProductRow }) {
  return (
    <Space direction="vertical" size={6} style={{ maxWidth: 320 }}>
      <Text style={{ whiteSpace: 'normal' }}>{row.productTitle || row.partnerSku}</Text>
      <Text copyable={{ text: row.partnerSku }}>PSKU {row.partnerSku}</Text>
      <Text copyable={{ text: row.sku }}>SKU {row.sku}</Text>
    </Space>
  )
}

function healthTags(row?: SalesProductRow) {
  if (!row) return <Tag>—</Tag>
  const codes = row.dataQualityCodes || []
  const tags: ReactNode[] = []
  if (row.dimensionMatched !== false && !codes.includes('brand_missing') && !codes.includes('backend_fulltype_missing')) {
    tags.push(<Tag key="normal" color="green">经营正常</Tag>)
  }
  for (const code of codes) {
    if (code === 'product_dimension_matched') continue
    tags.push(<Tag key={code} color={dataQualityColor(code)}>{dataQualityLabel(code)}</Tag>)
  }
  if (row.lifecycleQualityState && row.lifecycleQualityState !== 'ready') {
    tags.push(<Tag key="lifecycle-quality">{lifecycleQualityLabel(row.lifecycleQualityState)}</Tag>)
  }
  return tags.length ? tags : <Tag>—</Tag>
}

function primaryHealthLabel(row: SalesProductRow) {
  if (row.dataQualityCodes?.includes('brand_missing')) return '品牌缺失'
  if (row.dataQualityCodes?.includes('backend_fulltype_missing')) return '后台类目缺失'
  if (row.dataQualityCodes?.includes('product_dimension_missing')) return '商品主档未匹配'
  return '经营正常'
}

function latestDateFromProducts(products: SalesProductRow[]) {
  return products
    .map((product) => product.latestFactDate)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1)
}

function emptySalesDateRangeWarning(
  query: SalesAnalyticsQuery | null,
  products: SalesProductRow[],
  summary: SalesAnalyticsSummary,
  latestSalesDate?: string,
  loading?: boolean
) {
  if (loading || !query || products.length || !latestSalesDate || summaryHasSales(summary)) {
    return null
  }
  const latest = dayjs(latestSalesDate)
  const from = dayjs(query.dateFrom)
  const to = dayjs(query.dateTo)
  if (!latest.isValid() || !from.isValid() || !to.isValid() || !latest.isBefore(to, 'day')) {
    return null
  }
  if (latest.isBefore(from, 'day')) {
    return `当前选择日期范围没有销量事实；本地最新销量日是 ${latestSalesDate}。请把时间范围包含最新销量日，或等待销量同步完成。`
  }
  return `当前范围内暂未查到商品列表；本地最新销量日是 ${latestSalesDate}，所选结束日期晚于最新销量数据。`
}

function summaryHasSales(summary: SalesAnalyticsSummary) {
  return Boolean(
    Number(summary.netUnits || 0) ||
      Number(summary.grossUnits || 0) ||
      Number(summary.shippedUnits || 0) ||
      Number(summary.cancelledUnits || 0) ||
      Number(summary.revenueShipped || 0) ||
      Number(summary.yourVisitors || 0)
  )
}

function syncStatusLabel(state?: string) {
  if (state === 'stale' || state === 'STALE_LATEST_SALES') return '数据过期'
  if (state === 'empty_report') return '空报表'
  if (state === 'provider_unavailable') return 'Provider 不可用'
  if (state === 'missing_mapping') return '映射异常'
  return state || 'ready'
}

function averageOrderValue(revenue?: number | null, units?: number | null) {
  if (typeof revenue !== 'number' || !units) return null
  return revenue / units
}

function activityColumns(
  onEdit: (window: SalesActivityWindow) => void,
  onToggle: (window: SalesActivityWindow) => void,
  actionLoading: boolean
): ColumnsType<SalesActivityWindow> {
  return [
    { title: '活动', dataIndex: 'name', width: 180 },
    { title: '类型', dataIndex: 'activityType', width: 100, render: activityTypeLabel },
    { title: '类目', dataIndex: 'categoryScope', width: 130, render: (value?: string) => value || <Text type="secondary">全部</Text> },
    {
      title: '日期',
      key: 'dateRange',
      width: 210,
      render: (_, row) => `${row.dateFrom} 至 ${row.dateTo}`
    },
    { title: '系数', dataIndex: 'factor', width: 80, align: 'right', render: (value: number) => `${Number(value).toFixed(2)}x` },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 80,
      render: (enabled: boolean) => <Tag color={enabled ? 'green' : 'default'}>{enabled ? '启用' : '停用'}</Tag>
    },
    { title: '版本', dataIndex: 'versionNo', width: 72, align: 'right' },
    {
      title: '',
      key: 'action',
      width: 128,
      render: (_, row) => (
        <Space size={4}>
          <Button size="small" onClick={() => onEdit(row)}>
            编辑
          </Button>
          <Button size="small" onClick={() => onToggle(row)} loading={actionLoading}>
            {row.enabled ? '停用' : '启用'}
          </Button>
        </Space>
      )
    }
  ]
}

function activityPayloadFromForm(
  query: SalesAnalyticsQuery,
  values: ActivityWindowFormValues,
  id?: number
): SalesActivityWindowInput {
  const categoryScope = values.categoryScope?.trim()
  return {
    id,
    storeCode: query.storeCode,
    siteCode: query.siteCode,
    name: values.name.trim(),
    activityType: values.activityType,
    categoryScope: categoryScope || undefined,
    dateFrom: values.dateRange[0].format('YYYY-MM-DD'),
    dateTo: values.dateRange[1].format('YYYY-MM-DD'),
    factor: Number(values.factor),
    enabled: values.enabled
  }
}

const detailColumns: ColumnsType<DailySalesFact> = [
  { title: '日期', dataIndex: 'factDate', width: 110 },
  { title: '来源', dataIndex: 'sourceSystem', width: 210 },
  { title: '净销量', dataIndex: 'netUnits', width: 90, align: 'right' },
  { title: '毛销量', dataIndex: 'grossUnits', width: 90, align: 'right' },
  { title: '发货', dataIndex: 'shippedUnits', width: 80, align: 'right' },
  { title: '取消', dataIndex: 'cancelledUnits', width: 80, align: 'right' },
  { title: '销售额', dataIndex: 'revenueShipped', width: 110, align: 'right', render: formatMoney }
]

function siteCodeFromStoreCode(storeCode: string) {
  if (storeCode.endsWith('-NSA') || storeCode.endsWith('-SAU')) return 'SA'
  if (storeCode.endsWith('-NAE')) return 'AE'
  return 'SA'
}

function parsePartnerSkuText(value: string) {
  return Array.from(new Set(value.split(/[\n\r,，;；]+/).map((item) => item.trim()).filter(Boolean)))
}

function classificationSelectOptions(options: ProductClassificationOptionPayload[]) {
  return options
    .filter((option) => option.value || option.label)
    .map((option) => {
      const value = option.value || option.label || ''
      return {
        value,
        label: option.label || value,
        title: option.label || value
      }
    })
}

function lastCategoryLabel(value?: string | null) {
  if (!value?.trim()) return '后台类目 —'
  return value
    .split(/[>\/|\\-]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1) || value
}

function TrafficMetric({
  latestVisitors,
  latestConversion,
  rangeVisitors,
  rangeConversion
}: {
  latestVisitors?: number | null
  latestConversion?: number | null
  rangeVisitors?: number | null
  rangeConversion?: number | null
}) {
  return (
    <Space direction="vertical" size={0} style={{ width: '100%', alignItems: 'flex-end' }}>
      <Text style={{ fontSize: 12 }}>
        访客 {formatNumber(latestVisitors)} / 转化 {formatPercent(latestConversion)}
      </Text>
      <Text style={{ fontSize: 12 }}>
        访客 {formatNumber(rangeVisitors)} / 转化 {formatPercent(rangeConversion)}
      </Text>
    </Space>
  )
}

function formatNumber(value?: number | null) {
  return typeof value === 'number' ? value.toLocaleString('zh-CN') : '-'
}

function formatForecastUnits(value?: number | null) {
  return typeof value === 'number' ? `${value.toLocaleString('zh-CN')} 件` : '—'
}

function forecastUnitsForRange(points: SalesForecastDailyForecast[], range: DateRangeValue) {
  let total = 0
  let matched = false
  const start = range[0].startOf('day')
  const end = range[1].startOf('day')
  for (const point of points) {
    if (!point.forecastDate) continue
    const date = dayjs(point.forecastDate)
    if (!date.isValid() || date.isBefore(start, 'day') || date.isAfter(end, 'day')) continue
    total += numericForecastValue(point.forecastUnits)
    matched = true
  }
  return matched ? Math.ceil(total) : null
}

function actualUnitsForRange(facts: DailySalesFact[], range: DateRangeValue) {
  let total = 0
  let matched = false
  const start = range[0].startOf('day')
  const end = range[1].startOf('day')
  for (const fact of facts) {
    if (!fact.factDate) continue
    const date = dayjs(fact.factDate)
    if (!date.isValid() || date.isBefore(start, 'day') || date.isAfter(end, 'day')) continue
    if (typeof fact.netUnits === 'number') {
      total += fact.netUnits
      matched = true
    }
  }
  return matched ? total : null
}

function datesBetween(range: DateRangeValue) {
  const start = range[0].startOf('day')
  const end = range[1].startOf('day')
  if (!start.isValid() || !end.isValid() || end.isBefore(start, 'day')) {
    return []
  }
  const dates: string[] = []
  for (let cursor = start, index = 0; !cursor.isAfter(end, 'day') && index < 180; cursor = cursor.add(1, 'day'), index++) {
    dates.push(cursor.format('YYYY-MM-DD'))
  }
  return dates
}

function formatForecastFactor(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return '—'
  const numericValue = typeof value === 'number' ? value : Number(value)
  if (Number.isFinite(numericValue)) return numericValue.toFixed(4)
  return String(value)
}

function numericForecastValue(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return 0
  const numericValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function formatChartUnits(value: number) {
  if (!Number.isFinite(value)) return '0'
  if (Math.abs(value) >= 10) return value.toFixed(1)
  return value.toFixed(2)
}

function normalizeProductKey(value?: string | null) {
  return (value || '').trim().toUpperCase()
}

function forecastRiskColor(severity?: string | null) {
  if (severity === 'danger') return 'red'
  if (severity === 'warning') return 'gold'
  return 'blue'
}

function numericOrNull(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function formatStockCoverDays(value?: number | null) {
  return typeof value === 'number'
    ? `${value.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}天`
    : '—'
}

function formatMoney(value?: number | null) {
  return typeof value === 'number' ? value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'
}

function formatDateRange(range: DateRangeValue) {
  return `${range[0].format('YYYY-MM-DD')} 至 ${range[1].format('YYYY-MM-DD')}`
}

function formatTrendDataRange(facts: DailySalesFact[], priceTrend: SalesPriceTrendBucket[]) {
  const dates = [
    ...facts.map((fact) => fact.factDate),
    ...priceTrend.map((bucket) => bucket.bucketStart)
  ].filter((date): date is string => Boolean(date && dayjs(date).isValid()))

  if (!dates.length) return null
  const sorted = dates.sort()
  return `${sorted[0]} 至 ${sorted.at(-1)}`
}

function compactRangeText(label: string, dateFrom?: string | null, dateTo?: string | null) {
  if (!dateFrom && !dateTo) return null
  if (dateFrom && dateTo) return `${label} ${dateFrom} 至 ${dateTo}`
  return `${label} ${dateFrom || dateTo}`
}

function formatPercent(value?: number | null) {
  return typeof value === 'number' ? `${value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}%` : '-'
}

function lifecycleColor(code?: string) {
  if (code === 'growth') return 'green'
  if (code === 'decline') return 'red'
  if (code === 'longTail') return 'default'
  if (code === 'data_insufficient') return 'gold'
  if (code === 'new') return 'blue'
  if (code === 'pending') return 'default'
  return 'processing'
}

function lifecycleQualityLabel(state?: string) {
  if (state === 'pending') return '待计算'
  if (state === 'stockout_hold') return '库存保持'
  if (state === 'data_insufficient_hold') return '数据保持'
  if (state === 'historical_old_product') return '历史老品'
  if (state === 'low_confidence') return '低置信'
  if (state === 'data_insufficient' || state === 'pv_unresolvable') return '数据不足'
  return state || '-'
}

function dataQualityLabel(code?: string) {
  if (code === 'sales_fact_ready') return '销量就绪'
  if (code === 'product_dimension_matched') return '商品已匹配'
  if (code === 'product_dimension_missing') return '商品主档未匹配'
  if (code === 'brand_missing') return '品牌缺失'
  if (code === 'backend_fulltype_missing') return '后台类目缺失'
  return code || '-'
}

function dataQualityColor(code?: string) {
  if (code === 'sales_fact_ready' || code === 'product_dimension_matched') return 'green'
  if (code === 'product_dimension_missing') return 'red'
  if (code === 'brand_missing' || code === 'backend_fulltype_missing') return 'gold'
  return 'default'
}

function activityTypeLabel(type?: string) {
  if (type === 'holiday') return '节日'
  if (type === 'promotion') return '平台活动'
  if (type === 'salary_day') return '薪酬日'
  return type || '-'
}

export default SalesAnalyticsPage
