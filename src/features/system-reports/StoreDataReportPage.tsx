import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Alert, Button, Card, Empty, Progress, Segmented, Select, Space, Tag, Typography, message } from 'antd'
import { DatabaseOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons'
import type { EChartsCoreOption } from 'echarts/core'
import { EChartPanel } from '../../shared/charts'
import type { AuthSession } from '../auth/session'
import { fetchStoreDataReportOverview } from './api'
import {
  buildStoreDataReportProjection,
  percent,
  rankStoreRows,
  rankingColor,
  rankingDimensionLabel,
  rankingDimensionOptions,
  rankingLimitOptions
} from './reportBlocks'
import type { EmptyStoreBucket, RankingDimension, StoreReportRowView } from './reportBlocks'
import type { StoreDataReportMetric, StoreDataReportOverview } from './types'

const { Text } = Typography

type StoreDataReportPageProps = {
  session: AuthSession
}

type LoadState =
  | { status: 'idle' | 'loading'; data?: StoreDataReportOverview; message?: string }
  | { status: 'success'; data: StoreDataReportOverview; message?: string }
  | { status: 'error'; data?: StoreDataReportOverview; message: string }

export function StoreDataReportPage({ session: _session }: StoreDataReportPageProps) {
  const [selectedStoreCode, setSelectedStoreCode] = useState<string | undefined>()
  const [rankingDimension, setRankingDimension] = useState<RankingDimension>('salesMissing')
  const [rankingLimit, setRankingLimit] = useState(10)
  const [state, setState] = useState<LoadState>({ status: 'idle' })

  const load = async () => {
    setState((current) => ({ status: 'loading', data: current.data }))
    try {
      const data = await fetchStoreDataReportOverview()
      setState({ status: 'success', data })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '店铺数据报表加载失败'
      setState((current) => ({ status: 'error', data: current.data, message: errorMessage }))
      message.error(errorMessage)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const overview = state.data
  const allRows = overview?.rows ?? []
  const storeOptions = useMemo(() => buildStoreOptions(allRows), [allRows])
  const visibleRows = useMemo(
    () => (selectedStoreCode ? allRows.filter((row) => row.storeCode === selectedStoreCode) : allRows),
    [allRows, selectedStoreCode]
  )
  const projection = useMemo(() => buildStoreDataReportProjection(visibleRows), [visibleRows])
  const chartOptions = useMemo(
    () => buildChartOptions(projection.rows, projection.totals, rankingDimension, rankingLimit),
    [projection.rows, projection.totals, rankingDimension, rankingLimit]
  )
  const chartState = state.status === 'loading' ? 'loading' : projection.rows.length > 0 ? 'ready' : 'empty'

  return (
    <div data-testid="store-data-report-workbench" style={{ padding: 20, display: 'grid', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <Space wrap>
          <Select
            allowClear
            style={{ width: 280 }}
            placeholder="全部系统店铺"
            options={storeOptions}
            value={selectedStoreCode}
            onChange={setSelectedStoreCode}
            data-testid="store-data-report-store-filter"
          />
          <Button icon={<ReloadOutlined />} loading={state.status === 'loading'} onClick={load}>
            刷新
          </Button>
        </Space>
      </div>

      {state.status === 'error' ? <Alert type="error" showIcon message={state.message} /> : null}

      {overview ? (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <ReportSection
            testId="store-data-report-overview-section"
          >
            <MetricGrid metrics={overview.metrics} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
              <EChartPanel title="完整度结构" testId="store-data-report-completeness-chart" ariaLabel="完整度结构图表" state={chartState} emptyText="当前筛选暂无店铺数据" option={chartOptions.completeness} />
              <EChartPanel title="异常构成" testId="store-data-report-issue-chart" ariaLabel="异常构成图表" state={chartState} emptyText="当前筛选暂无店铺数据" option={chartOptions.issueMix} />
            </div>
          </ReportSection>

          <ReportSection
            title="店铺数据健康排行"
            description={`只展示问题最集中的店铺站点，当前按${rankingDimensionLabel(rankingDimension)}排序。`}
            testId="store-data-report-ranking-section"
            extra={
              <Space wrap size={8}>
                <Segmented<RankingDimension>
                  size="small"
                  options={rankingDimensionOptions}
                  value={rankingDimension}
                  onChange={setRankingDimension}
                  data-testid="store-data-report-ranking-dimension"
                />
                <Select
                  size="small"
                  style={{ width: 96 }}
                  options={rankingLimitOptions}
                  value={rankingLimit}
                  onChange={setRankingLimit}
                  data-testid="store-data-report-ranking-limit"
                />
              </Space>
            }
          >
            <EChartPanel title="问题排行" testId="store-data-report-ranking-chart" ariaLabel="问题排行图表" state={chartState} emptyText="当前筛选暂无店铺数据" option={chartOptions.storeRanking} />
          </ReportSection>

          <ReportSection
            title="商品详情完整度报表"
            description="用字段缺失构成和 Top N 识别资料缺口，默认不展开逐店铺明细。"
            testId="store-data-report-detail-completeness-section"
          >
            <ReportKpiGrid
              items={[
                { title: '详情字段总量', value: projection.totals.siteOffers * 5, unit: '项' },
                { title: '字段缺失', value: projection.totals.detailFieldMissing, unit: '项', tone: 'warning' },
                {
                  title: '详情完整率',
                  value: `${percent(
                    Math.max(projection.totals.siteOffers * 5 - projection.totals.detailFieldMissing, 0),
                    projection.totals.siteOffers * 5
                  )}%`,
                  tone: projection.totals.detailFieldMissing > 0 ? 'warning' : 'ready'
                },
                { title: '详情基线缺失', value: projection.totals.missingDetailBaseline, unit: '个', tone: 'danger' }
              ]}
            />
            <ResponsiveChartGrid>
              <EChartPanel title="字段缺失构成" testId="store-data-report-detail-field-mix-chart" ariaLabel="字段缺失构成图表" state={chartState} emptyText="当前筛选暂无店铺数据" option={chartOptions.detailFieldMix} />
              <EChartPanel title="详情缺失 Top 店铺" testId="store-data-report-detail-top-chart" ariaLabel="详情缺失 Top 店铺图表" state={chartState} emptyText="当前筛选暂无店铺数据" option={chartOptions.detailTop} />
            </ResponsiveChartGrid>
          </ReportSection>

          <ReportSection
            title="销量数据覆盖报表"
            description="用覆盖结构和缺口排行判断销量事实是否覆盖商品经营面。"
            testId="store-data-report-sales-coverage-section"
          >
            <ReportKpiGrid
              items={[
                { title: '商品经营面', value: projection.totals.siteOffers, unit: '个' },
                { title: '有销量商品', value: projection.totals.offersWithSalesFacts, unit: '个', tone: 'ready' },
                { title: '缺销量商品', value: projection.totals.offersWithoutSalesFacts, unit: '个', tone: 'warning' },
                {
                  title: '销量覆盖率',
                  value: `${percent(projection.totals.offersWithSalesFacts, projection.totals.siteOffers)}%`,
                  tone: projection.totals.offersWithoutSalesFacts > 0 ? 'warning' : 'ready'
                }
              ]}
            />
            <ResponsiveChartGrid>
              <EChartPanel title="销量覆盖结构" testId="store-data-report-sales-coverage-chart" ariaLabel="销量覆盖结构图表" state={chartState} emptyText="当前筛选暂无店铺数据" option={chartOptions.salesCoverage} />
              <EChartPanel title="销量缺口 Top 店铺" testId="store-data-report-sales-top-chart" ariaLabel="销量缺口 Top 店铺图表" state={chartState} emptyText="当前筛选暂无店铺数据" option={chartOptions.salesTop} />
            </ResponsiveChartGrid>
          </ReportSection>

          <ReportSection
            title="销量映射异常报表"
            description="按异常类型聚合销量关联问题，只用排行暴露最需要处理的店铺。"
            testId="store-data-report-mapping-anomaly-section"
          >
            <ReportKpiGrid
              items={[
                { title: '销量无商品', value: projection.totals.salesMappingAnomalies, unit: '个', tone: 'danger' },
                { title: '跨店铺挂载', value: projection.totals.crossStoreOffers, unit: '个', tone: 'danger' },
                { title: '商品无销量', value: projection.totals.offersWithoutSalesFacts, unit: '个', tone: 'warning' },
                {
                  title: '异常店铺占比',
                  value: `${percent(projection.mappingAnomalyRows.length, projection.totals.storeSites)}%`,
                  tone: projection.mappingAnomalyRows.length > 0 ? 'warning' : 'ready'
                }
              ]}
            />
            <ResponsiveChartGrid>
              <EChartPanel title="映射异常构成" testId="store-data-report-mapping-mix-chart" ariaLabel="映射异常构成图表" state={chartState} emptyText="当前筛选暂无店铺数据" option={chartOptions.mappingMix} />
              <EChartPanel title="映射异常 Top 店铺" testId="store-data-report-mapping-top-chart" ariaLabel="映射异常 Top 店铺图表" state={chartState} emptyText="当前筛选暂无店铺数据" option={chartOptions.mappingTop} />
            </ResponsiveChartGrid>
          </ReportSection>

          <ReportSection
            title="生命周期计算覆盖报表"
            description="用计算覆盖和问题排行观察生命周期状态是否完成。"
            testId="store-data-report-lifecycle-coverage-section"
          >
            <ReportKpiGrid
              items={[
                { title: '已计算生命周期', value: projection.totals.lifecycleCurrent, unit: '个', tone: 'ready' },
                { title: '未计算生命周期', value: projection.totals.lifecycleMissing, unit: '个', tone: 'warning' },
                { title: '数据不足', value: projection.totals.lifecycleDataInsufficient, unit: '个', tone: 'warning' },
                {
                  title: '计算覆盖率',
                  value: `${percent(projection.totals.lifecycleCurrent, projection.totals.siteOffers)}%`,
                  tone: projection.totals.lifecycleMissing > 0 ? 'warning' : 'ready'
                }
              ]}
            />
            <ResponsiveChartGrid>
              <EChartPanel title="生命周期覆盖结构" testId="store-data-report-lifecycle-coverage-chart" ariaLabel="生命周期覆盖结构图表" state={chartState} emptyText="当前筛选暂无店铺数据" option={chartOptions.lifecycleCoverage} />
              <EChartPanel title="生命周期问题 Top 店铺" testId="store-data-report-lifecycle-top-chart" ariaLabel="生命周期问题 Top 店铺图表" state={chartState} emptyText="当前筛选暂无店铺数据" option={chartOptions.lifecycleTop} />
            </ResponsiveChartGrid>
          </ReportSection>

          <ReportSection
            title="空数据店铺报表"
            description="把商品为空、销量为空、有商品无销量、有销量无商品的店铺站点分组展示。"
            testId="store-data-report-empty-store-section"
          >
            <EmptyStoreBuckets buckets={projection.emptyStoreBuckets} totalStoreSites={projection.totals.storeSites} />
            <EChartPanel title="空数据店铺分布" testId="store-data-report-empty-store-chart" ariaLabel="空数据店铺分布图表" state={chartState} emptyText="当前筛选暂无店铺数据" option={chartOptions.emptyStore} />
          </ReportSection>
        </Space>
      ) : (
        <Card variant="borderless">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无店铺数据" />
        </Card>
      )}
    </div>
  )
}

function ReportSection({
  title,
  description,
  testId,
  extra,
  children
}: {
  title?: string
  description?: string
  testId: string
  extra?: ReactNode
  children: ReactNode
}) {
  return (
    <Card variant="borderless" style={{ borderRadius: 6 }} data-testid={testId}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {title || description || extra ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {title || description ? (
              <Space direction="vertical" size={2}>
                {title ? (
                  <Text strong style={{ fontSize: 16 }}>
                    {title}
                  </Text>
                ) : null}
                {description ? <Text type="secondary">{description}</Text> : null}
              </Space>
            ) : null}
            {extra}
          </div>
        ) : null}
        {children}
      </Space>
    </Card>
  )
}

function MetricGrid({ metrics }: { metrics: StoreDataReportMetric[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
      {metrics.map((metric) => (
        <MetricCard key={metric.key} metric={metric} />
      ))}
    </div>
  )
}

function MetricCard({ metric }: { metric: StoreDataReportMetric }) {
  const warning = metric.state === 'warning'
  return (
    <Card size="small" variant="borderless" style={{ background: '#f8fafc', borderRadius: 6 }}>
      <Space direction="vertical" size={4}>
        <Space size={6}>
          {warning ? <WarningOutlined style={{ color: '#d97706' }} /> : <DatabaseOutlined style={{ color: '#2563eb' }} />}
          <Text type="secondary">{metric.title}</Text>
        </Space>
        <Text strong style={{ fontSize: 22, lineHeight: '28px' }}>
          {metric.value.toLocaleString()}
          {metric.unit ? <Text type="secondary"> {metric.unit}</Text> : null}
        </Text>
      </Space>
    </Card>
  )
}

function ResponsiveChartGrid({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
      {children}
    </div>
  )
}

type ReportKpiTone = 'ready' | 'warning' | 'danger'

type ReportKpiItem = {
  title: string
  value: number | string
  unit?: string
  tone?: ReportKpiTone
}

function ReportKpiGrid({ items }: { items: ReportKpiItem[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
      {items.map((item) => (
        <Card key={item.title} size="small" variant="borderless" style={{ background: '#f8fafc', borderRadius: 6 }}>
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <Space size={6} style={{ justifyContent: 'space-between', width: '100%' }}>
              <Text type="secondary">{item.title}</Text>
              <Tag color={kpiToneColor(item.tone)}>{kpiToneLabel(item.tone)}</Tag>
            </Space>
            <Text strong style={{ fontSize: 22, lineHeight: '28px' }}>
              {formatKpiValue(item.value)}
              {item.unit ? <Text type="secondary"> {item.unit}</Text> : null}
            </Text>
          </Space>
        </Card>
      ))}
    </div>
  )
}

function EmptyStoreBuckets({ buckets, totalStoreSites }: { buckets: EmptyStoreBucket[]; totalStoreSites: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
      {buckets.map((bucket) => (
        <Card key={bucket.key} size="small" variant="borderless" style={{ background: '#f8fafc', borderRadius: 6 }}>
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <Space size={8} style={{ justifyContent: 'space-between', width: '100%' }}>
              <Text strong>{bucket.title}</Text>
              <Tag color={bucket.rows.length > 0 ? 'gold' : 'green'}>{bucket.rows.length}</Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {bucket.description}
            </Text>
            <Progress
              percent={totalStoreSites > 0 ? percent(bucket.rows.length, totalStoreSites) : 0}
              size="small"
              status={bucket.rows.length > 0 ? 'normal' : 'success'}
            />
          </Space>
        </Card>
      ))}
    </div>
  )
}

function buildChartOptions(
  rows: StoreReportRowView[],
  totals: ReturnType<typeof buildStoreDataReportProjection>['totals'],
  rankingDimension: RankingDimension,
  rankingLimit: number
) {
  const rankingRows = rankStoreRows(rows, rankingDimension, rankingLimit).reverse()
  const detailFieldItems = [
    { name: '标题缺失', value: sumRows(rows, (row) => row.missingTitleEnCount) },
    { name: '描述缺失', value: sumRows(rows, (row) => row.missingDescriptionEnCount) },
    { name: '品牌缺失', value: sumRows(rows, (row) => row.missingBrandCount) },
    { name: '类目缺失', value: sumRows(rows, (row) => row.missingProductFulltypeCount) },
    { name: '图片缺失', value: sumRows(rows, (row) => row.missingImageCount) }
  ]
  const emptyStoreItems = [
    { name: '商品为 0', value: totals.emptyStoreSites },
    { name: '销量为 0', value: rows.filter((row) => row.salesFactRows === 0).length },
    { name: '有商品无销量', value: totals.productWithoutSalesSites },
    { name: '有销量无商品', value: totals.salesWithoutProductSites }
  ]
  return {
    completeness: baseChartOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { bottom: 0 },
      grid: { top: 20, left: 8, right: 8, bottom: 44, containLabel: true },
      xAxis: { type: 'category', data: ['详情字段', '销量事实', '生命周期'] },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          name: '已覆盖',
          type: 'bar',
          stack: 'coverage',
          data: [
            Math.max(totals.siteOffers * 5 - totals.detailFieldMissing, 0),
            totals.offersWithSalesFacts,
            totals.lifecycleCurrent
          ],
          itemStyle: { color: '#2563eb', borderRadius: [4, 4, 0, 0] }
        },
        {
          name: '缺失',
          type: 'bar',
          stack: 'coverage',
          data: [totals.detailFieldMissing, totals.offersWithoutSalesFacts, totals.lifecycleMissing],
          itemStyle: { color: '#f97316', borderRadius: [4, 4, 0, 0] }
        }
      ]
    }),
    storeRanking: baseChartOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { top: 8, left: 8, right: 24, bottom: 12, containLabel: true },
      xAxis: { type: 'value', minInterval: 1 },
      yAxis: {
        type: 'category',
        data: rankingRows.map((row) => `${row.displayName} / ${row.siteCode}\n${row.storeCode}`),
        axisLabel: { fontSize: 11 }
      },
      series: [
        {
          name: rankingDimensionLabel(rankingDimension),
          type: 'bar',
          data: rankingRows.map((row) => row.rankingValue),
          label: { show: true, position: 'right' },
          itemStyle: { color: rankingColor(rankingDimension), borderRadius: [0, 4, 4, 0] }
        }
      ]
    }),
    issueMix: baseChartOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, type: 'scroll' },
      series: [
        {
          name: '异常构成',
          type: 'pie',
          radius: ['46%', '72%'],
          center: ['50%', '44%'],
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          label: { formatter: '{b}: {c}' },
          data: issueMixData([
            { name: '详情基线缺失', value: totals.missingDetailBaseline },
            { name: '详情字段缺失', value: totals.detailFieldMissing },
            { name: '销量事实缺失', value: totals.offersWithoutSalesFacts },
            { name: '销量映射异常', value: totals.salesMappingAnomalies },
            { name: '生命周期缺失', value: totals.lifecycleMissing },
            { name: '生命周期数据不足', value: totals.lifecycleDataInsufficient },
            { name: '跨店铺挂载', value: totals.crossStoreOffers }
          ])
        }
      ]
    }),
    detailFieldMix: baseChartOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, type: 'scroll' },
      series: [
        {
          name: '字段缺失',
          type: 'pie',
          radius: ['42%', '70%'],
          center: ['50%', '42%'],
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          label: { formatter: '{b}: {c}' },
          data: issueMixData(detailFieldItems)
        }
      ]
    }),
    detailTop: buildTopStoreBarOption(rows, (row) => row.detailFieldMissingTotal, '字段缺失', '#16a34a'),
    salesCoverage: baseChartOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { bottom: 0 },
      grid: { top: 24, left: 8, right: 8, bottom: 44, containLabel: true },
      xAxis: { type: 'category', data: ['商品销量覆盖'] },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          name: '有销量商品',
          type: 'bar',
          stack: 'sales-coverage',
          data: [totals.offersWithSalesFacts],
          itemStyle: { color: '#2563eb', borderRadius: [4, 4, 0, 0] }
        },
        {
          name: '缺销量商品',
          type: 'bar',
          stack: 'sales-coverage',
          data: [totals.offersWithoutSalesFacts],
          itemStyle: { color: '#f97316', borderRadius: [4, 4, 0, 0] }
        }
      ]
    }),
    salesTop: buildTopStoreBarOption(rows, (row) => row.offersWithoutSalesFacts, '缺销量商品', '#f97316'),
    mappingMix: baseChartOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, type: 'scroll' },
      series: [
        {
          name: '映射异常',
          type: 'pie',
          radius: ['42%', '70%'],
          center: ['50%', '42%'],
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          label: { formatter: '{b}: {c}' },
          data: issueMixData([
            { name: '销量无商品', value: totals.salesMappingAnomalies },
            { name: '跨店铺挂载', value: totals.crossStoreOffers },
            { name: '商品无销量', value: totals.offersWithoutSalesFacts }
          ])
        }
      ]
    }),
    mappingTop: buildTopStoreBarOption(
      rows,
      (row) => row.mappingAnomalyTotal + row.offersWithoutSalesFacts,
      '映射/覆盖问题',
      '#7c3aed'
    ),
    lifecycleCoverage: baseChartOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { bottom: 0 },
      grid: { top: 24, left: 8, right: 8, bottom: 44, containLabel: true },
      xAxis: { type: 'category', data: ['生命周期计算'] },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          name: '已计算',
          type: 'bar',
          stack: 'lifecycle-coverage',
          data: [totals.lifecycleCurrent],
          itemStyle: { color: '#2563eb', borderRadius: [4, 4, 0, 0] }
        },
        {
          name: '未计算',
          type: 'bar',
          stack: 'lifecycle-coverage',
          data: [totals.lifecycleMissing],
          itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] }
        },
        {
          name: '数据不足',
          type: 'bar',
          data: [totals.lifecycleDataInsufficient],
          itemStyle: { color: '#f97316', borderRadius: [4, 4, 4, 4] }
        }
      ]
    }),
    lifecycleTop: buildTopStoreBarOption(
      rows,
      (row) => row.lifecycleMissingCount + row.lifecycleDataInsufficientCount,
      '生命周期问题',
      '#ef4444'
    ),
    emptyStore: baseChartOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { top: 16, left: 8, right: 8, bottom: 12, containLabel: true },
      xAxis: { type: 'value', minInterval: 1 },
      yAxis: {
        type: 'category',
        data: emptyStoreItems.map((item) => item.name).reverse(),
        axisLabel: { fontSize: 11 }
      },
      series: [
        {
          name: '店铺站点数',
          type: 'bar',
          data: emptyStoreItems.map((item) => item.value).reverse(),
          label: { show: true, position: 'right' },
          itemStyle: { color: '#0891b2', borderRadius: [0, 4, 4, 0] }
        }
      ]
    })
  }
}

function buildStoreOptions(rows: StoreDataReportOverview['rows']) {
  const optionMap = new Map<string, { value: string; label: string }>()
  for (const row of rows) {
    if (!row.storeCode || optionMap.has(row.storeCode)) continue
    optionMap.set(row.storeCode, {
      value: row.storeCode,
      label: `${row.projectName || row.projectCode || row.storeCode} / ${row.siteCode || '-'} / ${row.storeCode}`
    })
  }
  return Array.from(optionMap.values()).sort((first, second) => first.label.localeCompare(second.label))
}

function baseChartOption(option: EChartsCoreOption): EChartsCoreOption {
  return {
    color: ['#2563eb', '#f97316', '#ef4444', '#16a34a', '#7c3aed', '#0891b2'],
    textStyle: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif'
    },
    ...option
  }
}

function issueMixData(items: Array<{ name: string; value: number }>) {
  const nonZeroItems = items.filter((item) => item.value > 0)
  if (nonZeroItems.length > 0) return nonZeroItems
  return [{ name: '暂无异常', value: 1, itemStyle: { color: '#94a3b8' } }]
}

function buildTopStoreBarOption(
  rows: StoreReportRowView[],
  score: (row: StoreReportRowView) => number,
  seriesName: string,
  color: string
): EChartsCoreOption {
  const rankedRows = rows
    .map((row) => ({ label: `${row.displayName} / ${row.siteCode}\n${row.storeCode}`, value: score(row) }))
    .filter((row) => row.value > 0)
    .sort((first, second) => second.value - first.value)
    .slice(0, 10)
    .reverse()
  const chartRows = rankedRows.length > 0 ? rankedRows : [{ label: '暂无问题', value: 0 }]

  return baseChartOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { top: 8, left: 8, right: 24, bottom: 12, containLabel: true },
    xAxis: { type: 'value', minInterval: 1 },
    yAxis: {
      type: 'category',
      data: chartRows.map((row) => row.label),
      axisLabel: { fontSize: 11 }
    },
    series: [
      {
        name: seriesName,
        type: 'bar',
        data: chartRows.map((row) => row.value),
        label: { show: true, position: 'right' },
        itemStyle: { color, borderRadius: [0, 4, 4, 0] }
      }
    ]
  })
}

function sumRows(rows: StoreReportRowView[], pick: (row: StoreReportRowView) => number) {
  return rows.reduce((total, row) => total + pick(row), 0)
}

function formatKpiValue(value: number | string) {
  return typeof value === 'number' ? value.toLocaleString() : value
}

function kpiToneColor(tone: ReportKpiTone = 'ready') {
  if (tone === 'danger') return 'red'
  if (tone === 'warning') return 'gold'
  return 'blue'
}

function kpiToneLabel(tone: ReportKpiTone = 'ready') {
  if (tone === 'danger') return '异常'
  if (tone === 'warning') return '关注'
  return '正常'
}

export default StoreDataReportPage
