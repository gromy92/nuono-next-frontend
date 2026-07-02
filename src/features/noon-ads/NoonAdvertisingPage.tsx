import {
  DownloadOutlined,
  ExclamationCircleOutlined,
  PartitionOutlined,
  ReloadOutlined,
  RiseOutlined,
  SearchOutlined,
  UnorderedListOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { Alert, App, Button, DatePicker, Empty, Input, Modal, Segmented, Space, Statistic, Table, Tabs, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AuthSession } from '../auth/session'
import { ProductImageThumb, normalizeProductImageUrl } from '../product-baseline'
import { fetchNoonAdvertisingDashboard, fetchNoonAdvertisingLatestReportWindow } from './api'
import {
  buildNoonAdvertisingAdviceGroups,
  type NoonAdvertisingAdviceGroup,
  type NoonAdvertisingAdviceGroupKey,
  type NoonAdvertisingAdviceTrendStatus
} from './advice'
import './NoonAdvertisingPage.css'
import type {
  NoonAdvertisingCampaignDiagnostic,
  NoonAdvertisingCampaignRow,
  NoonAdvertisingDataStatus,
  NoonAdvertisingDashboardQuery,
  NoonAdvertisingDashboardView,
  NoonAdvertisingLatestReportWindow,
  NoonAdvertisingLatestReportWindowQuery,
  NoonAdvertisingProductDiagnosisType,
  NoonAdvertisingProductDiagnostic,
  NoonAdvertisingProductRow,
  NoonAdvertisingQueryRow
} from './types'

const { RangePicker } = DatePicker
const { Text } = Typography

type DateRangeValue = [Dayjs, Dayjs]
type ProductFilterKey = 'all' | NoonAdvertisingProductDiagnosisType
type NoonAdsExportColumn<T> = {
  title: string
  text?: boolean
  value: (row: T) => string | number | null | undefined
}

type NoonAdvertisingPageProps = {
  session: AuthSession
}

const latestCompleteDay = () => dayjs().subtract(1, 'day')
const diagnosisFilterOptions: Array<{ label: string; value: ProductFilterKey }> = [
  { label: '全部', value: 'all' },
  { label: '优先止损', value: 'STOP_LOSS' },
  { label: '可沉淀核心', value: 'PROMOTE_TO_CORE' },
  { label: '核心可观察', value: 'CORE_OBSERVE' },
  { label: '结构待整理', value: 'STRUCTURE_REVIEW' },
  { label: '样本不足', value: 'INSUFFICIENT_DATA' }
]

const initialDateRange = (): DateRangeValue => {
  const end = latestCompleteDay()
  return [end.subtract(29, 'day'), end]
}

function dateRangeFromLatestWindow(latestWindow: NoonAdvertisingLatestReportWindow): DateRangeValue | null {
  if (!latestWindow.dataAvailable || !latestWindow.dateFrom || !latestWindow.dateTo) return null
  const from = dayjs(latestWindow.dateFrom)
  const to = dayjs(latestWindow.dateTo)
  return from.isValid() && to.isValid() ? [from, to] : null
}

function trendQueryFromDashboardQuery(query: NoonAdvertisingDashboardQuery): NoonAdvertisingDashboardQuery {
  const trendTo = dayjs(query.dateTo)
  return {
    ...query,
    dateFrom: trendTo.subtract(6, 'day').format('YYYY-MM-DD'),
    dateTo: trendTo.format('YYYY-MM-DD')
  }
}

const emptyDashboard: NoonAdvertisingDashboardView = {
  adSummary: {
    campaignCount: 0,
    queryCount: 0,
    views: 0,
    clicks: 0,
    ordersCount: 0,
    assistedOrders: 0,
    atcCount: 0,
    spendAmount: 0,
    adRevenue: 0,
    ctrPercentage: 0,
    roas: 0,
    cpc: 0,
    cps: 0,
    cvrPercentage: 0,
    zeroOrderSpendAmount: 0,
    zeroOrderSpendShare: 0
  },
  salesSummary: {
    netUnits: 0,
    revenueShipped: 0,
    adSpendShareOfSales: 0
  },
  campaignRows: [],
  productRows: [],
  productDiagnostics: [],
  campaignDiagnostics: [],
  zeroOrderQueries: [],
  winningQueries: [],
  dataStatus: {
    batchCount: 0,
    campaignRowCount: 0,
    queryRowCount: 0,
    dataAvailable: false
  }
}

export function NoonAdvertisingPage({ session }: NoonAdvertisingPageProps) {
  const { message } = App.useApp()
  const currentStore = session.currentStore
  const selectedStore = currentStore || session.userStores?.[0] || null
  const projectCode = selectedStore?.projectCode?.trim() || ''
  const [dateRange, setDateRange] = useState<DateRangeValue>(initialDateRange)
  const [dashboard, setDashboard] = useState<NoonAdvertisingDashboardView>(emptyDashboard)
  const [loading, setLoading] = useState(false)
  const [latestWindowLoading, setLatestWindowLoading] = useState(false)
  const [resolvedScopeKey, setResolvedScopeKey] = useState('')
  const [expandedAdviceKey, setExpandedAdviceKey] = useState<NoonAdvertisingAdviceGroupKey | null>(null)
  const [selectedProductKey, setSelectedProductKey] = useState<string | null>(null)
  const [selectedCampaignCode, setSelectedCampaignCode] = useState<string | null>(null)
  const [productSearchText, setProductSearchText] = useState('')
  const [productFilter, setProductFilter] = useState<ProductFilterKey>('all')
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [trendDashboard, setTrendDashboard] = useState<NoonAdvertisingDashboardView>(emptyDashboard)
  const loadRequestIdRef = useRef(0)
  const latestWindowRequestIdRef = useRef(0)

  const scopeQuery = useMemo<NoonAdvertisingLatestReportWindowQuery | null>(() => {
    if (!selectedStore?.storeCode || !projectCode) return null
    return {
      projectCode,
      storeCode: selectedStore.storeCode,
      siteCode: selectedStore.site || siteCodeFromStoreCode(selectedStore.storeCode)
    }
  }, [projectCode, selectedStore])

  const scopeKey = useMemo(
    () => scopeQuery ? `${scopeQuery.projectCode}|${scopeQuery.storeCode}|${scopeQuery.siteCode}` : '',
    [scopeQuery]
  )

  const query = useMemo<NoonAdvertisingDashboardQuery | null>(() => {
    if (!scopeQuery || resolvedScopeKey !== scopeKey) return null
    return {
      ...scopeQuery,
      dateFrom: dateRange[0].format('YYYY-MM-DD'),
      dateTo: dateRange[1].format('YYYY-MM-DD')
    }
  }, [dateRange, resolvedScopeKey, scopeKey, scopeQuery])

  const loadLatestReportWindow = useCallback(async (
    targetQuery: NoonAdvertisingLatestReportWindowQuery | null,
    targetScopeKey: string
  ) => {
    const requestId = latestWindowRequestIdRef.current + 1
    latestWindowRequestIdRef.current = requestId
    setResolvedScopeKey('')
    setDashboard(emptyDashboard)
    setTrendDashboard(emptyDashboard)
    if (!targetQuery || !targetScopeKey) {
      setDateRange(initialDateRange())
      setLatestWindowLoading(false)
      return
    }
    setLatestWindowLoading(true)
    try {
      const latestWindow = await fetchNoonAdvertisingLatestReportWindow(targetQuery)
      if (latestWindowRequestIdRef.current === requestId) {
        setDateRange(dateRangeFromLatestWindow(latestWindow) || initialDateRange())
        setResolvedScopeKey(targetScopeKey)
      }
    } catch (error) {
      if (latestWindowRequestIdRef.current === requestId) {
        message.error(error instanceof Error ? error.message : '广告报表窗口加载失败')
        setDateRange(initialDateRange())
        setResolvedScopeKey(targetScopeKey)
      }
    } finally {
      if (latestWindowRequestIdRef.current === requestId) {
        setLatestWindowLoading(false)
      }
    }
  }, [message])

  const loadDashboard = useCallback(async (targetQuery: NoonAdvertisingDashboardQuery | null) => {
    const requestId = loadRequestIdRef.current + 1
    loadRequestIdRef.current = requestId
    if (!targetQuery) {
      setDashboard(emptyDashboard)
      setTrendDashboard(emptyDashboard)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [payload, trendPayload] = await Promise.all([
        fetchNoonAdvertisingDashboard(targetQuery),
        fetchNoonAdvertisingDashboard(trendQueryFromDashboardQuery(targetQuery))
      ])
      if (loadRequestIdRef.current === requestId) {
        setDashboard(payload)
        setTrendDashboard(trendPayload)
      }
    } catch (error) {
      if (loadRequestIdRef.current === requestId) {
        message.error(error instanceof Error ? error.message : '广告数据加载失败')
      }
    } finally {
      if (loadRequestIdRef.current === requestId) {
        setLoading(false)
      }
    }
  }, [message])

  useEffect(() => {
    void loadLatestReportWindow(scopeQuery, scopeKey)
  }, [loadLatestReportWindow, scopeKey, scopeQuery])

  useEffect(() => {
    void loadDashboard(query)
  }, [loadDashboard, query])

  const productRows = dashboard.productRows || emptyDashboard.productRows
  const productDiagnosticsByKey = useMemo(() => {
    return new Map((dashboard.productDiagnostics || []).map((row) => [advertisingIdentityKeyOf(row), row]))
  }, [dashboard.productDiagnostics])
  const normalizedProductSearchText = productSearchText.trim().toLowerCase()
  const filteredProductRows = useMemo(() => {
    return productRows
      .filter((row) => {
        const productKey = advertisingIdentityKeyOf(row)
        const diagnostic = productDiagnosticsByKey.get(productKey)
        const matchesSearch = !normalizedProductSearchText || searchableProductTextOf(row).includes(normalizedProductSearchText)
        return matchesSearch && productMatchesFilter(diagnostic, productFilter)
      })
      .sort((left, right) => {
        const leftDiagnostic = productDiagnosticsByKey.get(advertisingIdentityKeyOf(left))
        const rightDiagnostic = productDiagnosticsByKey.get(advertisingIdentityKeyOf(right))
        const priorityDiff = Number(rightDiagnostic?.priorityScore || 0) - Number(leftDiagnostic?.priorityScore || 0)
        if (priorityDiff !== 0) return priorityDiff
        return Number(right.spendAmount || 0) - Number(left.spendAmount || 0)
      })
  }, [normalizedProductSearchText, productDiagnosticsByKey, productFilter, productRows])
  const selectedProduct = useMemo(
    () => filteredProductRows.find((row) => advertisingIdentityKeyOf(row) === selectedProductKey) || filteredProductRows[0] || null,
    [filteredProductRows, selectedProductKey]
  )
  const openProductImagePreview = useCallback((rawImageUrl?: string | null) => {
    const normalizedImageUrl = normalizeProductImageUrl(rawImageUrl)
    if (normalizedImageUrl) {
      setImagePreviewUrl(normalizedImageUrl)
    }
  }, [])
  const previewImageUrl = normalizeProductImageUrl(imagePreviewUrl)
  const selectedProductKeyResolved = selectedProduct ? advertisingIdentityKeyOf(selectedProduct) : null
  const campaignDiagnosticsByCode = useMemo(() => {
    return new Map((dashboard.campaignDiagnostics || []).map((row) => [row.campaignCode, row]))
  }, [dashboard.campaignDiagnostics])
  const exportFileSuffix = query ? `${query.storeCode}_${query.siteCode}_${query.dateFrom}_${query.dateTo}` : 'noon_ads'
  const onExportCampaignRows = useCallback((rows: NoonAdvertisingCampaignRow[], label: string, filePart: string) => {
    const exportedCount = downloadNoonAdsRowsAsExcel({
      filename: `noon_ads_${sanitizeFilePart(filePart)}_${exportFileSuffix}.xls`,
      sheetName: label,
      columns: campaignExportColumns(campaignDiagnosticsByCode),
      rows
    })
    if (exportedCount > 0) {
      message.success(`已导出 ${formatNumber(exportedCount)} 行`)
    } else {
      message.warning('当前没有可导出的数据')
    }
  }, [campaignDiagnosticsByCode, exportFileSuffix, message])
  const onExportQueryRows = useCallback((rows: NoonAdvertisingQueryRow[], label: string, filePart: string) => {
    const exportedCount = downloadNoonAdsRowsAsExcel({
      filename: `noon_ads_${sanitizeFilePart(filePart)}_${exportFileSuffix}.xls`,
      sheetName: label,
      columns: queryExportColumns(),
      rows
    })
    if (exportedCount > 0) {
      message.success(`已导出 ${formatNumber(exportedCount)} 行`)
    } else {
      message.warning('当前没有可导出的数据')
    }
  }, [exportFileSuffix, message])
  const selectedProductDiagnostic = selectedProductKeyResolved ? productDiagnosticsByKey.get(selectedProductKeyResolved) || null : null
  const selectedProductCampaignRows = useMemo(
    () => selectedProductKeyResolved ? dashboard.campaignRows.filter((row) => advertisingIdentityKeyOf(row) === selectedProductKeyResolved) : [],
    [dashboard.campaignRows, selectedProductKeyResolved]
  )
  const selectedProductZeroOrderQueries = useMemo(
    () => selectedProductKeyResolved ? dashboard.zeroOrderQueries.filter((row) => advertisingIdentityKeyOf(row) === selectedProductKeyResolved) : [],
    [dashboard.zeroOrderQueries, selectedProductKeyResolved]
  )
  const selectedProductWinningQueries = useMemo(
    () => selectedProductKeyResolved ? dashboard.winningQueries.filter((row) => advertisingIdentityKeyOf(row) === selectedProductKeyResolved) : [],
    [dashboard.winningQueries, selectedProductKeyResolved]
  )
  const selectedCampaignCodeResolved = selectedProductCampaignRows.some((row) => row.campaignCode === selectedCampaignCode)
    ? selectedCampaignCode
    : null

  useEffect(() => {
    setSelectedProductKey((previous) => {
      if (previous && filteredProductRows.some((row) => advertisingIdentityKeyOf(row) === previous)) return previous
      return filteredProductRows[0] ? advertisingIdentityKeyOf(filteredProductRows[0]) : null
    })
  }, [filteredProductRows])

  useEffect(() => {
    setSelectedCampaignCode((previous) => {
      if (previous && selectedProductCampaignRows.some((row) => row.campaignCode === previous)) return previous
      return null
    })
  }, [selectedProductCampaignRows])

  const campaignColumns = useMemo<ColumnsType<NoonAdvertisingCampaignRow>>(() => [
    {
      title: '广告计划',
      dataIndex: 'campaignCode',
      key: 'campaign',
      width: 260,
      fixed: 'left',
      render: (_, row) => (
        <div>
          <Text strong>{row.campaignName || row.campaignCode}</Text>
          <div className="noon-ads-muted">{row.campaignCode}</div>
        </div>
      )
    },
    {
      title: '计划类型',
      dataIndex: 'campaignCode',
      key: 'planType',
      width: 130,
      render: (_, row) => {
        const diagnostic = campaignDiagnosticsByCode.get(row.campaignCode)
        return <Tag color={planTypeTagColor(diagnostic?.planType)}>{diagnostic?.planTypeLabel || '未分类'}</Tag>
      }
    },
    {
      title: '结构诊断',
      dataIndex: 'campaignCode',
      key: 'diagnostic',
      width: 180,
      render: (_, row) => <DiagnosticInline diagnostic={campaignDiagnosticsByCode.get(row.campaignCode)} />
    },
    { title: '状态', dataIndex: 'campaignStatus', key: 'campaignStatus', width: 110, render: statusTag },
    { title: '花费', dataIndex: 'spendAmount', key: 'spendAmount', align: 'right', width: 120, render: formatMoney },
    { title: '收入', dataIndex: 'adRevenue', key: 'adRevenue', align: 'right', width: 120, render: formatMoney },
    { title: '订单', dataIndex: 'ordersCount', key: 'ordersCount', align: 'right', width: 90, render: formatNumber },
    { title: 'ROAS', dataIndex: 'roas', key: 'roas', align: 'right', width: 90, render: formatDecimal },
    { title: 'CTR', dataIndex: 'ctrPercentage', key: 'ctrPercentage', align: 'right', width: 90, render: formatRate },
    { title: 'CVR', dataIndex: 'cvrPercentage', key: 'cvrPercentage', align: 'right', width: 90, render: formatRate },
    { title: '零订单花费', dataIndex: 'zeroOrderSpendAmount', key: 'zeroOrderSpendAmount', align: 'right', width: 130, render: formatMoney },
    { title: '零订单占比', dataIndex: 'zeroOrderSpendShare', key: 'zeroOrderSpendShare', align: 'right', width: 120, render: formatRate }
  ], [campaignDiagnosticsByCode])

  const queryColumns = useMemo<ColumnsType<NoonAdvertisingQueryRow>>(() => [
    {
      title: '关键词/搜索词',
      dataIndex: 'queryText',
      key: 'queryText',
      width: 300,
      fixed: 'left',
      render: (_, row) => (
        <div className="noon-ads-query-cell">
          <span className="noon-ads-query-text">{row.queryText || '(缺失关键词/搜索词)'}</span>
          <span className="noon-ads-muted">{row.queryKind || 'unknown'} · {displaySkuOf(row) || 'no sku'}</span>
        </div>
      )
    },
    {
      title: '广告计划',
      dataIndex: 'campaignCode',
      key: 'campaignCode',
      width: 190,
      render: (_, row) => (
        <div>
          <Text>{row.campaignName || row.campaignCode}</Text>
          <div className="noon-ads-muted">{row.campaignCode}</div>
        </div>
      )
    },
    { title: '花费', dataIndex: 'spendAmount', key: 'spendAmount', align: 'right', width: 110, render: formatMoney },
    { title: '收入', dataIndex: 'adRevenue', key: 'adRevenue', align: 'right', width: 110, render: formatMoney },
    { title: '订单', dataIndex: 'ordersCount', key: 'ordersCount', align: 'right', width: 80, render: formatNumber },
    { title: '点击', dataIndex: 'clicks', key: 'clicks', align: 'right', width: 80, render: formatNumber },
    { title: 'ROAS', dataIndex: 'roas', key: 'roas', align: 'right', width: 90, render: formatDecimal },
    { title: 'CPC', dataIndex: 'cpc', key: 'cpc', align: 'right', width: 90, render: formatMoney },
    { title: 'CVR', dataIndex: 'cvrPercentage', key: 'cvrPercentage', align: 'right', width: 90, render: formatRate }
  ], [])

  const adSummary = dashboard.adSummary || emptyDashboard.adSummary
  const salesSummary = dashboard.salesSummary || emptyDashboard.salesSummary
  const dataStatus = dashboard.dataStatus || emptyDashboard.dataStatus
  const trendDataStatus = trendDashboard.dataStatus || emptyDashboard.dataStatus
  const adviceGroups = useMemo(() => buildNoonAdvertisingAdviceGroups(dashboard, trendDashboard), [dashboard, trendDashboard])
  const expandedAdviceGroup = adviceGroups.find((group) => group.key === expandedAdviceKey) || null

  return (
    <div className="noon-ads-page" data-testid="noon-ads-workbench">
      {!selectedStore?.storeCode ? (
        <Alert type="warning" showIcon message="当前账号没有可用店铺" />
      ) : null}

      {!dataStatus.dataAvailable && !loading && !latestWindowLoading ? (
        <Alert
          type="info"
          showIcon
          message="当前范围没有广告报表"
          description="先导入 Noon Ads Campaign Overview 和 Queries 的归一化数据后，这里会展示广告计划和关键词/搜索词经营数据。"
        />
      ) : null}

      <AdviceGroupModal group={expandedAdviceGroup} onClose={() => setExpandedAdviceKey(null)} />
      <Modal
        className="noon-ads-image-preview"
        open={Boolean(previewImageUrl)}
        footer={null}
        width={760}
        centered
        onCancel={() => setImagePreviewUrl(null)}
      >
        {previewImageUrl ? <img src={previewImageUrl} alt="商品图片" /> : null}
      </Modal>

      <Tabs
        className="noon-ads-primary-tabs"
        items={[
          {
            key: 'overview',
            label: '总览',
            children: (
              <>
                <NoonAdvertisingTabControls
                  dateRange={dateRange}
                  dataStatus={dataStatus}
                  disabled={!query}
                  loading={loading || latestWindowLoading}
                  trendDataStatus={trendDataStatus}
                  onDateRangeChange={setDateRange}
                  onRefresh={() => void loadDashboard(query)}
                />

                <div className="noon-ads-metric-grid">
                  <Metric label="广告花费" value={formatMoney(adSummary.spendAmount)} />
                  <Metric label="广告收入" value={formatMoney(adSummary.adRevenue)} />
                  <Metric label="ROAS" value={formatDecimal(adSummary.roas)} />
                  <Metric label="广告订单" value={formatNumber(adSummary.ordersCount)} />
                  <Metric label="自然销售额" value={formatMoney(salesSummary.revenueShipped)} />
                  <Metric label="广告费率" value={formatRate(salesSummary.adSpendShareOfSales)} />
                </div>

                <div className="noon-ads-advice-grid" aria-label="广告经营建议">
                  {adviceGroups.map((group) => (
                    <AdviceGroup key={group.key} group={group} onOpenAll={setExpandedAdviceKey} />
                  ))}
                </div>

                <div className="noon-ads-panel">
                  <Tabs
                    items={[
                      {
                        key: 'campaigns',
                        label: `广告计划 (${formatNumber(dashboard.campaignRows.length)})`,
                        children: (
                          <div className="noon-ads-table-stack">
                            <NoonAdsTableActions
                              count={dashboard.campaignRows.length}
                              onExport={() => onExportCampaignRows(dashboard.campaignRows, '广告计划', 'campaigns')}
                            />
                            <Table
                              className="noon-ads-table"
                              size="small"
                              rowKey={(row) => row.campaignCode}
                              loading={loading || latestWindowLoading}
                              columns={campaignColumns}
                              dataSource={dashboard.campaignRows}
                              scroll={{ x: 1630 }}
                              pagination={{ pageSize: 20, showSizeChanger: true }}
                              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无广告计划数据" /> }}
                            />
                          </div>
                        )
                      },
                      {
                        key: 'zero-order',
                        label: `零订单关键词/搜索词 (${formatNumber(dashboard.zeroOrderQueries.length)})`,
                        children: (
                          <div className="noon-ads-table-stack">
                            <NoonAdsTableActions
                              count={dashboard.zeroOrderQueries.length}
                              onExport={() => onExportQueryRows(dashboard.zeroOrderQueries, '零订单关键词搜索词', 'zero_order_queries')}
                            />
                            <Table
                              className="noon-ads-table"
                              size="small"
                              rowKey={queryRowKey}
                              loading={loading || latestWindowLoading}
                              columns={queryColumns}
                              dataSource={dashboard.zeroOrderQueries}
                              scroll={{ x: 1160 }}
                              pagination={{ pageSize: 20, showSizeChanger: true }}
                              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无零订单关键词/搜索词" /> }}
                            />
                          </div>
                        )
                      },
                      {
                        key: 'winning',
                        label: `高转化关键词/搜索词 (${formatNumber(dashboard.winningQueries.length)})`,
                        children: (
                          <div className="noon-ads-table-stack">
                            <NoonAdsTableActions
                              count={dashboard.winningQueries.length}
                              onExport={() => onExportQueryRows(dashboard.winningQueries, '高转化关键词搜索词', 'winning_queries')}
                            />
                            <Table
                              className="noon-ads-table"
                              size="small"
                              rowKey={queryRowKey}
                              loading={loading || latestWindowLoading}
                              columns={queryColumns}
                              dataSource={dashboard.winningQueries}
                              scroll={{ x: 1160 }}
                              pagination={{ pageSize: 20, showSizeChanger: true }}
                              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无高转化关键词/搜索词" /> }}
                            />
                          </div>
                        )
                      }
                    ]}
                  />
                </div>
              </>
            )
          },
          {
            key: 'product-detail',
            label: `商品详情 (${formatNumber(productRows.length)})`,
            children: (
              <>
                <NoonAdvertisingTabControls
                  dateRange={dateRange}
                  dataStatus={dataStatus}
                  disabled={!query}
                  loading={loading || latestWindowLoading}
                  trendDataStatus={trendDataStatus}
                  onDateRangeChange={setDateRange}
                  onRefresh={() => void loadDashboard(query)}
                />

                <div className="noon-ads-panel">
                  <div className="noon-ads-product-analysis">
                    <div className="noon-ads-product-search">
                      <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder="搜索商品 / PSKU / 广告码"
                        value={productSearchText}
                        onChange={(event) => setProductSearchText(event.target.value)}
                      />
                      <Segmented
                        value={productFilter}
                        onChange={(value) => setProductFilter(value as ProductFilterKey)}
                        options={diagnosisFilterOptions}
                      />
                      <Text type="secondary">
                        显示 {formatNumber(filteredProductRows.length)} / {formatNumber(productRows.length)}
                      </Text>
                    </div>
                    <div className="noon-ads-product-workspace">
                      <div className="noon-ads-product-list-pane">
                        <ProductNavigationList
                          products={filteredProductRows}
                          productDiagnosticsByKey={productDiagnosticsByKey}
                          selectedProductKey={selectedProductKeyResolved}
                          loading={loading || latestWindowLoading}
                          onSelectProduct={setSelectedProductKey}
                          onProductImagePreview={openProductImagePreview}
                        />
                      </div>
                      <div className="noon-ads-product-detail-pane">
                        <ProductAnalysisDetail
                          product={selectedProduct}
                          diagnostic={selectedProductDiagnostic}
                          campaignRows={selectedProductCampaignRows}
                          selectedCampaignCode={selectedCampaignCodeResolved}
                          zeroOrderQueries={selectedProductZeroOrderQueries}
                          winningQueries={selectedProductWinningQueries}
                          campaignDiagnosticsByCode={campaignDiagnosticsByCode}
                          queryColumns={queryColumns}
                          onSelectCampaign={setSelectedCampaignCode}
                          onExportCampaignRows={onExportCampaignRows}
                          onExportQueryRows={onExportQueryRows}
                          onProductImagePreview={openProductImagePreview}
                          loading={loading || latestWindowLoading}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )
          }
        ]}
      />
    </div>
  )
}

function NoonAdsTableActions({
  count,
  onExport
}: {
  count: number
  onExport: () => void
}) {
  return (
    <div className="noon-ads-table-actions">
      <Text type="secondary">{formatNumber(count)} 行</Text>
      <Button size="small" icon={<DownloadOutlined />} onClick={onExport}>
        导出
      </Button>
    </div>
  )
}

function NoonAdvertisingTabControls({
  dateRange,
  dataStatus,
  disabled,
  loading,
  trendDataStatus,
  onDateRangeChange,
  onRefresh
}: {
  dateRange: DateRangeValue
  dataStatus: NoonAdvertisingDataStatus
  disabled: boolean
  loading: boolean
  trendDataStatus: NoonAdvertisingDataStatus
  onDateRangeChange: (value: DateRangeValue) => void
  onRefresh: () => void
}) {
  return (
    <div className="noon-ads-tab-controls">
      <Space wrap>
        <RangePicker
          value={dateRange}
          allowClear={false}
          onChange={(value) => {
            if (value?.[0] && value?.[1]) {
              onDateRangeChange([value[0], value[1]])
            }
          }}
        />
        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          disabled={disabled}
          onClick={onRefresh}
        >
          刷新
        </Button>
      </Space>
      <Space wrap>
        <Tag color={dataStatus.dataAvailable ? 'green' : 'default'}>{dataStatus.dataAvailable ? '已导入' : '无数据'}</Tag>
        <Text type="secondary">Batch {formatNumber(dataStatus.batchCount)}</Text>
        <Text type="secondary">广告计划行 {formatNumber(dataStatus.campaignRowCount)}</Text>
        <Text type="secondary">关键词/搜索词行 {formatNumber(dataStatus.queryRowCount)}</Text>
        {dataStatus.earliestReportDate && dataStatus.latestReportDate ? (
          <Text type="secondary">{dataStatus.earliestReportDate} 至 {dataStatus.latestReportDate}</Text>
        ) : null}
        <Text type="secondary">
          近7天趋势 {trendDataStatus.dataAvailable && trendDataStatus.earliestReportDate && trendDataStatus.latestReportDate
            ? `${trendDataStatus.earliestReportDate} 至 ${trendDataStatus.latestReportDate}`
            : '样本不足'}
        </Text>
      </Space>
    </div>
  )
}

function ProductNavigationList({
  products,
  productDiagnosticsByKey,
  selectedProductKey,
  loading,
  onSelectProduct,
  onProductImagePreview
}: {
  products: NoonAdvertisingProductRow[]
  productDiagnosticsByKey: Map<string, NoonAdvertisingProductDiagnostic>
  selectedProductKey: string | null
  loading: boolean
  onSelectProduct: (productKey: string) => void
  onProductImagePreview: (imageUrl?: string | null) => void
}) {
  if (!products.length) {
    return (
      <div className="noon-ads-product-nav-empty">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={loading ? '广告商品加载中' : '暂无商品广告数据'} />
      </div>
    )
  }

  return (
    <div className="noon-ads-product-nav-list" aria-label="商品列表">
      {products.map((product) => {
        const productKey = advertisingIdentityKeyOf(product)
        const selected = productKey === selectedProductKey
        const diagnostic = productDiagnosticsByKey.get(productKey)
        const reason = primaryDiagnosticReason(diagnostic)
        return (
          <div
            key={productKey}
            role="button"
            tabIndex={0}
            className={`noon-ads-product-nav-item${selected ? ' noon-ads-product-nav-item-selected' : ''}`}
            onClick={() => onSelectProduct(productKey)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelectProduct(productKey)
              }
            }}
          >
            <ProductImageThumb
              src={product.imageUrl}
              alt={displaySkuOf(product) || '商品图片'}
              imageCount={product.imageUrl ? 1 : 0}
              width={56}
              onClick={(event) => {
                event.stopPropagation()
                onProductImagePreview(product.imageUrl)
              }}
            />
            <div className="noon-ads-product-nav-content">
              <div className="noon-ads-product-nav-title">
                <span>{displaySkuOf(product) || 'no sku'}</span>
                <Tag color={productDiagnosisTagColor(diagnostic?.diagnosisType)}>
                  {diagnostic?.diagnosisLabel || '样本不足'}
                </Tag>
              </div>
              {secondarySkuOf(product) ? (
                <div className="noon-ads-product-nav-subtitle">{secondarySkuOf(product)}</div>
              ) : null}
              <div className="noon-ads-product-nav-diagnosis">
                <span>{planTypeCountText(diagnostic)}</span>
                <span>{reason}</span>
              </div>
              <div className="noon-ads-product-nav-metrics">
                <ProductNavMetric label="花费" value={formatMoney(product.spendAmount)} />
                <ProductNavMetric label="订单" value={formatNumber(product.ordersCount)} />
                <ProductNavMetric label="ROAS" value={formatDecimal(product.roas)} />
                <ProductNavMetric label="零订单" value={formatRate(product.zeroOrderSpendShare)} />
              </div>
              <div className="noon-ads-product-nav-structure">
                {formatNumber(product.campaignCount)} 个广告计划 / {formatNumber(product.queryCount)} 个词
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ProductNavMetric({ label, value }: { label: string; value: string }) {
  return (
    <span className="noon-ads-product-nav-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </span>
  )
}

function ProductAnalysisDetail({
  product,
  diagnostic,
  campaignRows,
  selectedCampaignCode,
  zeroOrderQueries,
  winningQueries,
  campaignDiagnosticsByCode,
  queryColumns,
  onSelectCampaign,
  onExportCampaignRows,
  onExportQueryRows,
  onProductImagePreview,
  loading
}: {
  product: NoonAdvertisingProductRow | null
  diagnostic: NoonAdvertisingProductDiagnostic | null
  campaignRows: NoonAdvertisingCampaignRow[]
  selectedCampaignCode: string | null
  zeroOrderQueries: NoonAdvertisingQueryRow[]
  winningQueries: NoonAdvertisingQueryRow[]
  campaignDiagnosticsByCode: Map<string, NoonAdvertisingCampaignDiagnostic>
  queryColumns: ColumnsType<NoonAdvertisingQueryRow>
  onSelectCampaign: (campaignCode: string | null) => void
  onExportCampaignRows: (rows: NoonAdvertisingCampaignRow[], label: string, filePart: string) => void
  onExportQueryRows: (rows: NoonAdvertisingQueryRow[], label: string, filePart: string) => void
  onProductImagePreview: (imageUrl?: string | null) => void
  loading: boolean
}) {
  const selectedCampaign = campaignRows.find((row) => row.campaignCode === selectedCampaignCode) || null
  const selectedCampaignName = selectedCampaign?.campaignName || selectedCampaign?.campaignCode || '全部广告计划'
  const mainCampaign = campaignRows[0] || null
  const productFilePart = sanitizeFilePart(displaySkuOf(product || {}) || 'product')
  const zeroOrderQueryCountByCampaign = useMemo(() => countRowsByCampaign(zeroOrderQueries), [zeroOrderQueries])
  const winningQueryCountByCampaign = useMemo(() => countRowsByCampaign(winningQueries), [winningQueries])
  const selectedCampaignZeroOrderQueries = useMemo(
    () => selectedCampaign?.campaignCode
      ? zeroOrderQueries.filter((row) => row.campaignCode === selectedCampaign.campaignCode)
      : zeroOrderQueries,
    [selectedCampaign, zeroOrderQueries]
  )
  const selectedCampaignWinningQueries = useMemo(
    () => selectedCampaign?.campaignCode
      ? winningQueries.filter((row) => row.campaignCode === selectedCampaign.campaignCode)
      : winningQueries,
    [selectedCampaign, winningQueries]
  )
  const campaignStructureColumns = useMemo<ColumnsType<NoonAdvertisingCampaignRow>>(() => [
    {
      title: '广告计划',
      dataIndex: 'campaignCode',
      key: 'campaign',
      width: 230,
      fixed: 'left',
      render: (_, row) => (
        <div>
          <Text strong>{row.campaignName || row.campaignCode}</Text>
          <div className="noon-ads-muted">{row.campaignCode}</div>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'campaignCode',
      key: 'planType',
      width: 116,
      render: (_, row) => {
        const campaignDiagnostic = campaignDiagnosticsByCode.get(row.campaignCode)
        return <Tag color={planTypeTagColor(campaignDiagnostic?.planType)}>{campaignDiagnostic?.planTypeLabel || '未分类'}</Tag>
      }
    },
    {
      title: '诊断标签',
      dataIndex: 'campaignCode',
      key: 'diagnostic',
      width: 180,
      render: (_, row) => <DiagnosticInline diagnostic={campaignDiagnosticsByCode.get(row.campaignCode)} />
    },
    {
      title: '建议动作',
      dataIndex: 'campaignCode',
      key: 'recommendedActions',
      width: 240,
      render: (_, row) => <CampaignActionInline diagnostic={campaignDiagnosticsByCode.get(row.campaignCode)} />
    },
    { title: '状态', dataIndex: 'campaignStatus', key: 'campaignStatus', width: 94, render: statusTag },
    { title: '花费', dataIndex: 'spendAmount', key: 'spendAmount', align: 'right', width: 104, render: formatMoney },
    { title: '收入', dataIndex: 'adRevenue', key: 'adRevenue', align: 'right', width: 104, render: formatMoney },
    { title: '订单', dataIndex: 'ordersCount', key: 'ordersCount', align: 'right', width: 80, render: formatNumber },
    { title: 'ROAS', dataIndex: 'roas', key: 'roas', align: 'right', width: 84, render: formatDecimal },
    { title: '零订单占比', dataIndex: 'zeroOrderSpendShare', key: 'zeroOrderSpendShare', align: 'right', width: 108, render: formatRate },
    {
      title: '零订单词',
      key: 'zeroOrderQueryCount',
      align: 'right',
      width: 92,
      render: (_, row) => formatNumber(zeroOrderQueryCountByCampaign.get(row.campaignCode) || 0)
    },
    {
      title: '高转化词',
      key: 'winningQueryCount',
      align: 'right',
      width: 92,
      render: (_, row) => formatNumber(winningQueryCountByCampaign.get(row.campaignCode) || 0)
    }
  ], [campaignDiagnosticsByCode, winningQueryCountByCampaign, zeroOrderQueryCountByCampaign])

  if (!product) {
    return (
      <div className="noon-ads-product-detail noon-ads-product-detail-empty">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择一个商品标识" />
      </div>
    )
  }

  return (
    <div className="noon-ads-product-detail">
      <section className="noon-ads-product-dossier">
        <div className="noon-ads-product-dossier-main">
          <ProductImageThumb
            src={product.imageUrl}
            alt={displaySkuOf(product) || '商品图片'}
            imageCount={product.imageUrl ? 1 : 0}
            width={72}
            onClick={() => onProductImagePreview(product.imageUrl)}
          />
          <div className="noon-ads-product-dossier-title">
            <Space size={6} wrap>
              <Text strong>{displaySkuOf(product)}</Text>
              <Tag color={productDiagnosisTagColor(diagnostic?.diagnosisType)}>
                {diagnostic?.diagnosisLabel || '样本不足'}
              </Tag>
              <Tag color={diagnostic?.rankDataAvailable ? 'green' : 'default'}>
                {diagnostic?.rankDataAvailable ? '搜索排名已接入' : '搜索排名未接入'}
              </Tag>
            </Space>
            <div className="noon-ads-muted">
              {[secondarySkuOf(product), `${formatNumber(product.campaignCount)} 个广告计划 / ${formatNumber(product.queryCount)} 个关键词/搜索词`]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </div>
        </div>
        <div className="noon-ads-product-dossier-facts">
          <ProductFact label="主消耗 Campaign" value={mainCampaign?.campaignName || mainCampaign?.campaignCode || '-'} />
          <ProductFact label="Campaign 数" value={formatNumber(campaignRows.length)} />
          <ProductFact label="零订单词" value={formatNumber(zeroOrderQueries.length)} />
          <ProductFact label="高转化词" value={formatNumber(winningQueries.length)} />
        </div>
      </section>

      <ProductDiagnosisPanel product={product} diagnostic={diagnostic} />

      <div className="noon-ads-product-kpis">
        <Metric label="商品广告花费" value={formatMoney(product.spendAmount)} />
        <Metric label="商品广告收入" value={formatMoney(product.adRevenue)} />
        <Metric label="商品 ROAS" value={formatDecimal(product.roas)} />
        <Metric label="商品广告订单" value={formatNumber(product.ordersCount)} />
        <Metric label="零订单花费" value={formatMoney(product.zeroOrderSpendAmount)} />
        <Metric label="零订单占比" value={formatRate(product.zeroOrderSpendShare)} />
      </div>

      <section className="noon-ads-product-section">
        <div className="noon-ads-product-section-header">
          <div>
            <Text strong>广告计划结构</Text>
            <div className="noon-ads-muted">点击广告计划后，下方关键词/搜索词随之切换。</div>
          </div>
          <Space size={8} wrap className="noon-ads-product-section-actions">
            <Button
              size="small"
              type={!selectedCampaign ? 'primary' : 'default'}
              onClick={() => onSelectCampaign(null)}
            >
              全部广告计划
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => onExportCampaignRows(campaignRows, `${displaySkuOf(product)} Campaign`, `${productFilePart}_campaigns`)}
            >
              导出
            </Button>
          </Space>
        </div>
        <Table
          className="noon-ads-table noon-ads-product-campaign-table"
          size="small"
          rowKey={(row) => row.campaignCode}
          loading={loading}
          columns={campaignStructureColumns}
          dataSource={campaignRows}
          scroll={{ x: 1510 }}
          pagination={campaignRows.length > 8 ? { pageSize: 8 } : false}
          rowClassName={(row) => row.campaignCode === selectedCampaign?.campaignCode ? 'noon-ads-table-row-selected' : ''}
          onRow={(row) => ({
            onClick: () => onSelectCampaign(row.campaignCode)
          })}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无商品广告计划" /> }}
        />
      </section>

      <section className="noon-ads-product-section">
        <div className="noon-ads-product-section-header">
          <div>
            <Text strong>关键词/搜索词明细</Text>
            <div className="noon-ads-muted">{selectedCampaignName}</div>
          </div>
          <Space size={8} wrap className="noon-ads-product-section-actions">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => onExportQueryRows(
                selectedCampaignZeroOrderQueries,
                `${displaySkuOf(product)} 零订单关键词搜索词`,
                `${productFilePart}_${selectedCampaign?.campaignCode || 'all_campaigns'}_zero_order_queries`
              )}
            >
              导出零订单
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => onExportQueryRows(
                selectedCampaignWinningQueries,
                `${displaySkuOf(product)} 高转化关键词搜索词`,
                `${productFilePart}_${selectedCampaign?.campaignCode || 'all_campaigns'}_winning_queries`
              )}
            >
              导出高转化
            </Button>
          </Space>
        </div>
      <Tabs
        size="small"
        items={[
          {
            key: 'product-zero-order',
            label: `零订单关键词/搜索词 (${formatNumber(selectedCampaignZeroOrderQueries.length)})`,
            children: (
              <Table
                className="noon-ads-table"
                size="small"
                rowKey={queryRowKey}
                loading={loading}
                columns={queryColumns}
                dataSource={selectedCampaignZeroOrderQueries}
                scroll={{ x: 1160 }}
                pagination={{ pageSize: 8 }}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无零订单关键词/搜索词" /> }}
              />
            )
          },
          {
            key: 'product-winning',
            label: `高转化关键词/搜索词 (${formatNumber(selectedCampaignWinningQueries.length)})`,
            children: (
              <Table
                className="noon-ads-table"
                size="small"
                rowKey={queryRowKey}
                loading={loading}
                columns={queryColumns}
                dataSource={selectedCampaignWinningQueries}
                scroll={{ x: 1160 }}
                pagination={{ pageSize: 8 }}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无高转化关键词/搜索词" /> }}
              />
            )
          }
        ]}
      />
      </section>
    </div>
  )
}

function ProductDiagnosisPanel({
  product,
  diagnostic
}: {
  product: NoonAdvertisingProductRow
  diagnostic: NoonAdvertisingProductDiagnostic | null
}) {
  const diagnosisLabel = diagnostic?.diagnosisLabel || '样本不足'
  const actions = diagnostic?.recommendedActions?.length ? diagnostic.recommendedActions : ['样本不足，暂不判断广告结构。']

  return (
    <section className="noon-ads-product-diagnosis">
      <div className="noon-ads-product-diagnosis-header">
        <div>
          <Text strong>商品诊断结论</Text>
          <div className="noon-ads-muted">{primaryDiagnosticReason(diagnostic)}</div>
        </div>
        <Space size={6} wrap>
          <Tag color={productDiagnosisTagColor(diagnostic?.diagnosisType)}>{diagnosisLabel}</Tag>
          <Tag>优先级 {formatNumber(diagnostic?.priorityScore || 0)}</Tag>
        </Space>
      </div>
      <div className="noon-ads-product-diagnosis-evidence">
        <ProductFact label="花费" value={formatMoney(product.spendAmount)} />
        <ProductFact label="订单" value={formatNumber(product.ordersCount)} />
        <ProductFact label="ROAS" value={formatDecimal(product.roas)} />
        <ProductFact label="零订单占比" value={formatRate(product.zeroOrderSpendShare)} />
        <ProductFact label="计划类型" value={planTypeCountText(diagnostic)} />
      </div>
      <ul className="noon-ads-product-diagnosis-actions">
        {actions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
      <div className="noon-ads-product-diagnosis-note">建议仅供只读分析，真实广告调整需人工确认。</div>
    </section>
  )
}

function ProductFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="noon-ads-product-fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function DiagnosticInline({ diagnostic }: { diagnostic?: NoonAdvertisingCampaignDiagnostic }) {
  if (!diagnostic?.labels?.length) return <Text type="secondary">暂无明显问题</Text>
  return (
    <Space size={[4, 4]} wrap>
      {diagnostic.labels.map((label) => (
        <Tag key={label} color={diagnosticLabelTagColor(label)}>{label}</Tag>
      ))}
    </Space>
  )
}

function CampaignActionInline({ diagnostic }: { diagnostic?: NoonAdvertisingCampaignDiagnostic }) {
  if (!diagnostic?.recommendedActions?.length) return <Text type="secondary">-</Text>
  return (
    <div className="noon-ads-campaign-action">
      {diagnostic.recommendedActions[0]}
    </div>
  )
}

function planTypeTagColor(planType?: string) {
  if (planType === 'EXPLORATION') return 'blue'
  if (planType === 'CORE') return 'green'
  return 'default'
}

function AdviceGroup({
  group,
  onOpenAll
}: {
  group: NoonAdvertisingAdviceGroup
  onOpenAll: (key: NoonAdvertisingAdviceGroupKey) => void
}) {
  const hiddenItemCount = Math.max(group.items.length - 3, 0)

  return (
    <section className={`noon-ads-advice-group noon-ads-advice-${group.tone}`}>
      <div className="noon-ads-advice-header">
        <span className="noon-ads-advice-icon">{adviceIcon(group)}</span>
        <div>
          <Text strong>{group.title}</Text>
          <div className="noon-ads-muted">{group.subtitle}</div>
        </div>
        <Tag color={adviceTagColor(group)}>{formatNumber(group.items.length)}</Tag>
      </div>
      <div className="noon-ads-advice-list">
        {group.items.length ? group.items.slice(0, 3).map((item) => (
          <div className="noon-ads-advice-item" key={item.key}>
            <div>
              <Text strong>{item.title}</Text>
              <div className="noon-ads-muted">{item.subtitle}</div>
            </div>
            <AdviceEvidence item={item} />
          </div>
        )) : (
          <div className="noon-ads-advice-empty">暂无建议项</div>
        )}
      </div>
      {hiddenItemCount > 0 ? (
        <Button
          className="noon-ads-advice-more"
          type="link"
          size="small"
          icon={<UnorderedListOutlined />}
          onClick={() => onOpenAll(group.key)}
        >
          查看全部 {formatNumber(group.items.length)} 条
        </Button>
      ) : null}
    </section>
  )
}

function AdviceGroupModal({
  group,
  onClose
}: {
  group: NoonAdvertisingAdviceGroup | null
  onClose: () => void
}) {
  return (
    <Modal
      className="noon-ads-advice-modal"
      title={group ? `${group.title}（${formatNumber(group.items.length)} 条）` : undefined}
      open={Boolean(group)}
      footer={null}
      onCancel={onClose}
      width={760}
    >
      <div className="noon-ads-advice-modal-list">
        {group?.items.map((item, index) => (
          <div className="noon-ads-advice-modal-item" key={`${item.key}-${index}`}>
            <div className="noon-ads-advice-modal-rank">{formatNumber(index + 1)}</div>
            <div className="noon-ads-advice-modal-content">
              <Text strong>{item.title}</Text>
              <div className="noon-ads-muted">{item.subtitle}</div>
              <AdviceEvidence item={item} showTrendDetail />
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}

function AdviceEvidence({
  item,
  showTrendDetail = false
}: {
  item: NoonAdvertisingAdviceGroup['items'][number]
  showTrendDetail?: boolean
}) {
  return (
    <div className="noon-ads-advice-evidence">
      {item.trend ? (
        <Tag className="noon-ads-advice-trend-tag" color={adviceTrendTagColor(item.trend.status)}>
          {item.trend.label}
        </Tag>
      ) : null}
      <span>{item.evidence}</span>
      {showTrendDetail && item.trend?.detail ? (
        <div className="noon-ads-advice-trend-detail">{item.trend.detail}</div>
      ) : null}
    </div>
  )
}

function adviceIcon(group: NoonAdvertisingAdviceGroup) {
  if (group.key === 'stopLoss') return <ExclamationCircleOutlined />
  if (group.key === 'scaleCandidates') return <RiseOutlined />
  if (group.key === 'lowEfficiency') return <WarningOutlined />
  return <PartitionOutlined />
}

function adviceTagColor(group: NoonAdvertisingAdviceGroup) {
  if (group.tone === 'danger') return 'red'
  if (group.tone === 'success') return 'green'
  if (group.tone === 'warning') return 'gold'
  return 'blue'
}

function adviceTrendTagColor(status: NoonAdvertisingAdviceTrendStatus) {
  if (status === 'continuedRisk' || status === 'cooling') return 'orange'
  if (status === 'improving' || status === 'stillStrong') return 'green'
  if (status === 'reducedSpend') return 'blue'
  return 'default'
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="noon-ads-metric">
      <Statistic title={label} value={value} />
    </div>
  )
}

function siteCodeFromStoreCode(storeCode: string) {
  const normalized = storeCode.toUpperCase()
  if (normalized.includes('AE') || normalized.includes('UAE') || normalized.includes('DB')) return 'AE'
  return 'SA'
}

function statusTag(value?: string | null) {
  if (!value) return <Tag>未知</Tag>
  const normalized = value.toLowerCase()
  const color = normalized.includes('active') || normalized.includes('enable') ? 'green' : normalized.includes('pause') ? 'orange' : 'default'
  return <Tag color={color}>{value}</Tag>
}

function queryRowKey(row: NoonAdvertisingQueryRow) {
  return [row.campaignCode || 'NO_CAMPAIGN', advertisingIdentityKeyOf(row), row.queryText || 'NO_QUERY', row.queryKind || 'unknown'].join('::')
}

function partnerSkuOf(row: { partnerSku?: string | null; primaryPartnerSku?: string | null }) {
  return row.partnerSku || row.primaryPartnerSku || ''
}

function displaySkuOf(row: {
  partnerSku?: string | null
  primaryPartnerSku?: string | null
  adSkuCode?: string | null
  primaryAdSkuCode?: string | null
  sku?: string | null
  primarySku?: string | null
}) {
  return partnerSkuOf(row) || row.adSkuCode || row.primaryAdSkuCode || row.sku || row.primarySku || ''
}

function secondarySkuOf(row: {
  adSkuCode?: string | null
  primaryAdSkuCode?: string | null
  partnerSku?: string | null
  primaryPartnerSku?: string | null
  sku?: string | null
  primarySku?: string | null
}) {
  const primary = displaySkuOf(row)
  const secondary = row.adSkuCode || row.primaryAdSkuCode || ''
  return secondary && secondary !== primary ? secondary : ''
}

function searchableProductTextOf(row: NoonAdvertisingProductRow) {
  return [
    displaySkuOf(row),
    secondarySkuOf(row),
    row.partnerSku,
    row.adSkuCode,
    row.sku,
    row.storeCode,
    row.siteCode
  ].filter(Boolean).join(' ').toLowerCase()
}

function productMatchesFilter(diagnostic: NoonAdvertisingProductDiagnostic | undefined, filter: ProductFilterKey) {
  if (filter === 'all') return true
  return (diagnostic?.diagnosisType || 'INSUFFICIENT_DATA') === filter
}

function primaryDiagnosticReason(diagnostic?: NoonAdvertisingProductDiagnostic | null) {
  return diagnostic?.labels?.find((label) => label !== '搜索排名未接入') || '样本不足'
}

function planTypeCountText(diagnostic?: NoonAdvertisingProductDiagnostic | null) {
  return `核心 ${formatNumber(diagnostic?.coreCampaignCount || 0)} / 探索 ${formatNumber(diagnostic?.explorationCampaignCount || 0)} / 未分类 ${formatNumber(diagnostic?.unclassifiedCampaignCount || 0)}`
}

function productDiagnosisTagColor(diagnosisType?: NoonAdvertisingProductDiagnosisType | null) {
  if (diagnosisType === 'STOP_LOSS') return 'red'
  if (diagnosisType === 'PROMOTE_TO_CORE') return 'green'
  if (diagnosisType === 'CORE_OBSERVE') return 'blue'
  if (diagnosisType === 'STRUCTURE_REVIEW') return 'gold'
  return 'default'
}

function diagnosticLabelTagColor(label: string) {
  if (label.includes('消耗') || label.includes('走弱') || label.includes('零订单')) return 'warning'
  if (label.includes('稳定') || label.includes('收获') || label.includes('高转化')) return 'green'
  if (label.includes('待确认') || label.includes('无法归类')) return 'default'
  return 'blue'
}

function countRowsByCampaign(rows: Array<{ campaignCode: string }>) {
  const counts = new Map<string, number>()
  rows.forEach((row) => {
    counts.set(row.campaignCode, (counts.get(row.campaignCode) || 0) + 1)
  })
  return counts
}

function campaignExportColumns(
  campaignDiagnosticsByCode: Map<string, NoonAdvertisingCampaignDiagnostic>
): Array<NoonAdsExportColumn<NoonAdvertisingCampaignRow>> {
  return [
    { title: '商品标识', text: true, value: displaySkuOf },
    { title: '广告侧商品码', text: true, value: (row) => row.primaryAdSkuCode || '' },
    { title: 'Campaign Code', text: true, value: (row) => row.campaignCode },
    { title: 'Campaign 名称', text: true, value: (row) => row.campaignName || '' },
    { title: '计划类型', text: true, value: (row) => campaignDiagnosticsByCode.get(row.campaignCode)?.planTypeLabel || '未分类' },
    { title: '结构标签', text: true, value: (row) => campaignDiagnosticsByCode.get(row.campaignCode)?.labels?.join(' / ') || '' },
    { title: '状态', text: true, value: (row) => row.campaignStatus || '' },
    { title: 'QC 状态', text: true, value: (row) => row.qcStatus || '' },
    { title: '花费', value: (row) => row.spendAmount },
    { title: '广告收入', value: (row) => row.adRevenue },
    { title: '订单', value: (row) => row.ordersCount },
    { title: '曝光', value: (row) => row.views },
    { title: '点击', value: (row) => row.clicks },
    { title: 'ROAS', value: (row) => row.roas },
    { title: 'CPC', value: (row) => row.cpc },
    { title: 'CTR', value: (row) => row.ctrPercentage },
    { title: 'CVR', value: (row) => row.cvrPercentage },
    { title: '零订单花费', value: (row) => row.zeroOrderSpendAmount },
    { title: '零订单占比', value: (row) => row.zeroOrderSpendShare }
  ]
}

function queryExportColumns(): Array<NoonAdsExportColumn<NoonAdvertisingQueryRow>> {
  return [
    { title: '商品标识', text: true, value: displaySkuOf },
    { title: '广告侧商品码', text: true, value: (row) => row.adSkuCode || '' },
    { title: 'Campaign Code', text: true, value: (row) => row.campaignCode },
    { title: 'Campaign 名称', text: true, value: (row) => row.campaignName || '' },
    { title: '关键词/搜索词', text: true, value: (row) => row.queryText || '' },
    { title: '类型', text: true, value: (row) => row.queryKind || '' },
    { title: '花费', value: (row) => row.spendAmount },
    { title: '广告收入', value: (row) => row.adRevenue },
    { title: '订单', value: (row) => row.ordersCount },
    { title: '曝光', value: (row) => row.views },
    { title: '点击', value: (row) => row.clicks },
    { title: 'ROAS', value: (row) => row.roas },
    { title: 'CPC', value: (row) => row.cpc },
    { title: 'CTR', value: (row) => row.ctrPercentage },
    { title: 'CVR', value: (row) => row.cvrPercentage }
  ]
}

function downloadNoonAdsRowsAsExcel<T>({
  filename,
  sheetName,
  columns,
  rows
}: {
  filename: string
  sheetName: string
  columns: Array<NoonAdsExportColumn<T>>
  rows: T[]
}) {
  if (!rows.length) return 0
  const header = columns
    .map((column) => `<th style="mso-number-format:'\\@';">${escapeExcelHtml(column.title)}</th>`)
    .join('')
  const body = rows
    .map((row) => (
      `<tr>${columns.map((column) => {
        const value = column.value(row)
        const style = column.text ? " style=\"mso-number-format:'\\@';\"" : ''
        return `<td${style}>${escapeExcelHtml(value ?? '')}</td>`
      }).join('')}</tr>`
    ))
    .join('')
  const html = [
    '<!doctype html>',
    '<html>',
    '<head><meta charset="UTF-8"></head>',
    '<body>',
    `<table><caption>${escapeExcelHtml(sheetName)}</caption><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`,
    '</body>',
    '</html>'
  ].join('')
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.xls') ? filename : `${filename}.xls`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
  return rows.length
}

function escapeExcelHtml(value: string | number) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function sanitizeFilePart(value: string) {
  return value
    .trim()
    .replace(/[^\w\u4e00-\u9fa5.-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    || 'export'
}

function advertisingIdentityKeyOf(row: {
  advertisingIdentityKey?: string | null
  productIdentityKey?: string | null
  storeCode?: string | null
  siteCode?: string | null
  adSkuCode?: string | null
  primaryAdSkuCode?: string | null
  partnerSku?: string | null
  primaryPartnerSku?: string | null
  sku?: string | null
  primarySku?: string | null
}) {
  return row.advertisingIdentityKey || row.productIdentityKey || [
    row.storeCode || '',
    row.siteCode || '',
    partnerSkuOf(row) || `ADSKU:${row.adSkuCode || row.primaryAdSkuCode || row.sku || row.primarySku || 'NO_SKU'}`
  ].join('|')
}

function formatNumber(value?: number | null) {
  return Number(value || 0).toLocaleString('zh-CN')
}

function formatMoney(value?: number | null) {
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function formatDecimal(value?: number | null) {
  if (value === null || value === undefined) return '-'
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function formatRate(value?: number | null) {
  if (value === null || value === undefined) return '-'
  return `${(Number(value || 0) * 100).toFixed(2)}%`
}
