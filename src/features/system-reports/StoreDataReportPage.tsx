import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Empty, Segmented, Select, Space, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { EChartPanel } from '../../shared/charts'
import type { AuthSession } from '../auth/session'
import { fetchStoreDataReportOverview } from './api'
import {
  buildStoreDataReportProjection,
  percent,
  rankingDimensionLabel,
  rankingDimensionOptions,
  rankingLimitOptions
} from './reportBlocks'
import type { RankingDimension } from './reportBlocks'
import {
  EmptyStoreBuckets,
  MetricGrid,
  ReportKpiGrid,
  ReportSection,
  ResponsiveChartGrid
} from './StoreDataReportBlocks'
import { buildChartOptions, buildStoreOptions } from './storeDataReportCharts'
import type { StoreDataReportOverview } from './types'

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
      setState({ status: 'success', data: await fetchStoreDataReportOverview() })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '店铺数据报表加载失败'
      setState((current) => ({ status: 'error', data: current.data, message: errorMessage }))
      message.error(errorMessage)
    }
  }

  useEffect(() => {
    void load()
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
  const chartProps = { state: chartState, emptyText: '当前筛选暂无店铺数据' } as const

  return (
    <div data-testid="store-data-report-workbench" style={{ padding: 20, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
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
          <Button icon={<ReloadOutlined />} loading={state.status === 'loading'} onClick={load}>刷新</Button>
        </Space>
      </div>

      {state.status === 'error' ? <Alert type="error" showIcon message={state.message} /> : null}

      {overview ? (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <ReportSection testId="store-data-report-overview-section">
            <MetricGrid metrics={overview.metrics} />
            <ResponsiveChartGrid>
              <EChartPanel title="完整度结构" testId="store-data-report-completeness-chart" ariaLabel="完整度结构图表" option={chartOptions.completeness} {...chartProps} />
              <EChartPanel title="异常构成" testId="store-data-report-issue-chart" ariaLabel="异常构成图表" option={chartOptions.issueMix} {...chartProps} />
            </ResponsiveChartGrid>
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
            <EChartPanel title="问题排行" testId="store-data-report-ranking-chart" ariaLabel="问题排行图表" option={chartOptions.storeRanking} {...chartProps} />
          </ReportSection>

          <ReportSection
            title="商品详情完整度报表"
            description="用字段缺失构成和 Top N 识别资料缺口，默认不展开逐店铺明细。"
            testId="store-data-report-detail-completeness-section"
          >
            <ReportKpiGrid items={[
              { title: '详情字段总量', value: projection.totals.siteOffers * 5, unit: '项' },
              { title: '字段缺失', value: projection.totals.detailFieldMissing, unit: '项', tone: 'warning' },
              {
                title: '详情完整率',
                value: `${percent(Math.max(projection.totals.siteOffers * 5 - projection.totals.detailFieldMissing, 0), projection.totals.siteOffers * 5)}%`,
                tone: projection.totals.detailFieldMissing > 0 ? 'warning' : 'ready'
              },
              { title: '详情基线缺失', value: projection.totals.missingDetailBaseline, unit: '个', tone: 'danger' }
            ]} />
            <ResponsiveChartGrid>
              <EChartPanel title="字段缺失构成" testId="store-data-report-detail-field-mix-chart" ariaLabel="字段缺失构成图表" option={chartOptions.detailFieldMix} {...chartProps} />
              <EChartPanel title="详情缺失 Top 店铺" testId="store-data-report-detail-top-chart" ariaLabel="详情缺失 Top 店铺图表" option={chartOptions.detailTop} {...chartProps} />
            </ResponsiveChartGrid>
          </ReportSection>

          <ReportSection
            title="销量数据覆盖报表"
            description="用覆盖结构和缺口排行判断销量事实是否覆盖商品经营面。"
            testId="store-data-report-sales-coverage-section"
          >
            <ReportKpiGrid items={[
              { title: '商品经营面', value: projection.totals.siteOffers, unit: '个' },
              { title: '有销量商品', value: projection.totals.offersWithSalesFacts, unit: '个', tone: 'ready' },
              { title: '缺销量商品', value: projection.totals.offersWithoutSalesFacts, unit: '个', tone: 'warning' },
              {
                title: '销量覆盖率',
                value: `${percent(projection.totals.offersWithSalesFacts, projection.totals.siteOffers)}%`,
                tone: projection.totals.offersWithoutSalesFacts > 0 ? 'warning' : 'ready'
              }
            ]} />
            <ResponsiveChartGrid>
              <EChartPanel title="销量覆盖结构" testId="store-data-report-sales-coverage-chart" ariaLabel="销量覆盖结构图表" option={chartOptions.salesCoverage} {...chartProps} />
              <EChartPanel title="销量缺口 Top 店铺" testId="store-data-report-sales-top-chart" ariaLabel="销量缺口 Top 店铺图表" option={chartOptions.salesTop} {...chartProps} />
            </ResponsiveChartGrid>
          </ReportSection>

          <ReportSection
            title="销量映射异常报表"
            description="按异常类型聚合销量关联问题，只用排行暴露最需要处理的店铺。"
            testId="store-data-report-mapping-anomaly-section"
          >
            <ReportKpiGrid items={[
              { title: '销量无商品', value: projection.totals.salesMappingAnomalies, unit: '个', tone: 'danger' },
              { title: '跨店铺挂载', value: projection.totals.crossStoreOffers, unit: '个', tone: 'danger' },
              { title: '商品无销量', value: projection.totals.offersWithoutSalesFacts, unit: '个', tone: 'warning' },
              {
                title: '异常店铺占比',
                value: `${percent(projection.mappingAnomalyRows.length, projection.totals.storeSites)}%`,
                tone: projection.mappingAnomalyRows.length > 0 ? 'warning' : 'ready'
              }
            ]} />
            <ResponsiveChartGrid>
              <EChartPanel title="映射异常构成" testId="store-data-report-mapping-mix-chart" ariaLabel="映射异常构成图表" option={chartOptions.mappingMix} {...chartProps} />
              <EChartPanel title="映射异常 Top 店铺" testId="store-data-report-mapping-top-chart" ariaLabel="映射异常 Top 店铺图表" option={chartOptions.mappingTop} {...chartProps} />
            </ResponsiveChartGrid>
          </ReportSection>

          <ReportSection
            title="生命周期计算覆盖报表"
            description="用计算覆盖和问题排行观察生命周期状态是否完成。"
            testId="store-data-report-lifecycle-coverage-section"
          >
            <ReportKpiGrid items={[
              { title: '已计算生命周期', value: projection.totals.lifecycleCurrent, unit: '个', tone: 'ready' },
              { title: '未计算生命周期', value: projection.totals.lifecycleMissing, unit: '个', tone: 'warning' },
              { title: '数据不足', value: projection.totals.lifecycleDataInsufficient, unit: '个', tone: 'warning' },
              {
                title: '计算覆盖率',
                value: `${percent(projection.totals.lifecycleCurrent, projection.totals.siteOffers)}%`,
                tone: projection.totals.lifecycleMissing > 0 ? 'warning' : 'ready'
              }
            ]} />
            <ResponsiveChartGrid>
              <EChartPanel title="生命周期覆盖结构" testId="store-data-report-lifecycle-coverage-chart" ariaLabel="生命周期覆盖结构图表" option={chartOptions.lifecycleCoverage} {...chartProps} />
              <EChartPanel title="生命周期问题 Top 店铺" testId="store-data-report-lifecycle-top-chart" ariaLabel="生命周期问题 Top 店铺图表" option={chartOptions.lifecycleTop} {...chartProps} />
            </ResponsiveChartGrid>
          </ReportSection>

          <ReportSection
            title="空数据店铺报表"
            description="把商品为空、销量为空、有商品无销量、有销量无商品的店铺站点分组展示。"
            testId="store-data-report-empty-store-section"
          >
            <EmptyStoreBuckets buckets={projection.emptyStoreBuckets} totalStoreSites={projection.totals.storeSites} />
            <EChartPanel title="空数据店铺分布" testId="store-data-report-empty-store-chart" ariaLabel="空数据店铺分布图表" option={chartOptions.emptyStore} {...chartProps} />
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

export default StoreDataReportPage
