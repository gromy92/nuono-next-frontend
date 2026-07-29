import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Drawer, Input, Select, Space, Table, message } from 'antd'
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons'
import type { AuthSession } from '../auth/session'
import { EChartPanel, buildDistributionPieOption } from '../../shared/charts'
import { fetchNoonDataCompletenessOverview, fetchNoonDataGapPatrol } from './api'
import {
  NoonDataDistributionStrip,
  NoonDataEmpty,
  NoonDataMetricGrid,
  NoonDataReportHeader,
  NoonDataReportSection
} from './NoonDataReportBlocks'
import {
  buildNoonDataCompletenessColumns,
  NOON_DATA_CATEGORY_OPTIONS,
  NOON_DATA_GAP_COLUMNS,
  NOON_DATA_HISTORY_STATUS_OPTIONS,
  NOON_DATA_LATEST_STATUS_OPTIONS
} from './noonDataCompletenessTable'
import type {
  NoonDataCompletenessFilters,
  NoonDataCompletenessOverview,
  NoonDataCompletenessRow,
  NoonDataGapPatrol,
  NoonDataGapRow
} from './types'

type NoonDataCompletenessPageProps = {
  session: AuthSession
}

type LoadState =
  | { status: 'idle' | 'loading'; data?: NoonDataCompletenessOverview; message?: string }
  | { status: 'success'; data: NoonDataCompletenessOverview; message?: string }
  | { status: 'error'; data?: NoonDataCompletenessOverview; message: string }

type GapLoadState =
  | { status: 'idle' | 'loading'; data?: NoonDataGapPatrol; message?: string }
  | { status: 'success'; data: NoonDataGapPatrol; message?: string }
  | { status: 'error'; data?: NoonDataGapPatrol; message: string }

export function NoonDataCompletenessPage({ session: _session }: NoonDataCompletenessPageProps) {
  const [state, setState] = useState<LoadState>({ status: 'idle' })
  const [filters, setFilters] = useState<NoonDataCompletenessFilters>({})
  const [selectedRow, setSelectedRow] = useState<NoonDataCompletenessRow | null>(null)
  const [gapState, setGapState] = useState<GapLoadState>({ status: 'idle' })

  const load = async (nextFilters: NoonDataCompletenessFilters = filters) => {
    setState((current) => ({ status: 'loading', data: current.data }))
    try {
      const data = await fetchNoonDataCompletenessOverview(nextFilters)
      setState({ status: 'success', data })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '数据完整度加载失败'
      setState((current) => ({ status: 'error', data: current.data, message: errorMessage }))
      message.error(errorMessage)
    }
  }

  const openDrilldown = async (row: NoonDataCompletenessRow) => {
    setSelectedRow(row)
    setGapState((current) => ({ status: 'loading', data: current.data }))
    try {
      const data = await fetchNoonDataGapPatrol({
        ownerUserId: row.ownerUserId ?? undefined,
        storeCode: row.storeCode ?? undefined,
        siteCode: row.siteCode ?? undefined,
        category: row.category ?? undefined
      })
      setGapState({ status: 'success', data })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '缺口明细加载失败'
      setGapState((current) => ({ status: 'error', data: current.data, message: errorMessage }))
      message.error(errorMessage)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const overview = state.data
  const rows = overview?.rows ?? []
  const categoryDistribution = overview?.categoryDistribution ?? []
  const latestStatusDistribution = overview?.latestStatusDistribution ?? []
  const historyStatusDistribution = overview?.historyStatusDistribution ?? []
  const categoryChartOption = useMemo(
    () => buildDistributionPieOption(categoryDistribution, { seriesName: '数据类别', unit: '类' }),
    [categoryDistribution]
  )
  const latestStatusChartOption = useMemo(
    () => buildDistributionPieOption(latestStatusDistribution, { seriesName: '最新状态', unit: '项' }),
    [latestStatusDistribution]
  )
  const historyStatusChartOption = useMemo(
    () => buildDistributionPieOption(historyStatusDistribution, { seriesName: '历史补全', unit: '项' }),
    [historyStatusDistribution]
  )
  const categoryChartState = state.status === 'loading' ? 'loading' : categoryDistribution.length > 0 ? 'ready' : 'empty'
  const latestStatusChartState = state.status === 'loading' ? 'loading' : latestStatusDistribution.length > 0 ? 'ready' : 'empty'
  const historyStatusChartState = state.status === 'loading' ? 'loading' : historyStatusDistribution.length > 0 ? 'ready' : 'empty'
  const columns = useMemo(() => buildNoonDataCompletenessColumns(openDrilldown), [])

  const applyFilters = () => {
    load(filters)
  }

  return (
    <div data-testid="noon-data-completeness-workbench" style={{ padding: 20, display: 'grid', gap: 12 }}>
      <NoonDataReportHeader
        title="数据完整度"
        subtitle="系统报表 / 数据完整度"
        generatedAt={overview?.generatedAt}
        extra={
          <Button icon={<ReloadOutlined />} loading={state.status === 'loading'} onClick={() => load()}>
            刷新
          </Button>
        }
      />

      {state.status === 'error' ? <Alert type="error" showIcon message={state.message} /> : null}

      <NoonDataReportSection title="筛选" testId="noon-data-completeness-filters">
        <Space wrap>
          <Input
            data-testid="noon-data-filter-store"
            placeholder="店铺编码"
            allowClear
            value={filters.storeCode ?? ''}
            onChange={(event) => setFilters((current) => ({ ...current, storeCode: event.target.value }))}
            style={{ width: 180 }}
          />
          <Input
            data-testid="noon-data-filter-site"
            placeholder="站点"
            allowClear
            value={filters.siteCode ?? ''}
            onChange={(event) => setFilters((current) => ({ ...current, siteCode: event.target.value }))}
            style={{ width: 120 }}
          />
          <Select
            aria-label="数据类别"
            value={filters.category ?? ''}
            options={NOON_DATA_CATEGORY_OPTIONS}
            onChange={(value) => setFilters((current) => ({ ...current, category: value || null }))}
            style={{ width: 190 }}
          />
          <Select
            aria-label="最新状态"
            value={filters.latestStatus ?? ''}
            options={NOON_DATA_LATEST_STATUS_OPTIONS}
            onChange={(value) => setFilters((current) => ({ ...current, latestStatus: value || null }))}
            style={{ width: 150 }}
          />
          <Select
            aria-label="历史状态"
            value={filters.historyStatus ?? ''}
            options={NOON_DATA_HISTORY_STATUS_OPTIONS}
            onChange={(value) => setFilters((current) => ({ ...current, historyStatus: value || null }))}
            style={{ width: 150 }}
          />
          <Button data-testid="noon-data-filter-submit" icon={<FilterOutlined />} onClick={applyFilters}>
            应用
          </Button>
        </Space>
      </NoonDataReportSection>

      <NoonDataReportSection title="完整性台账总览" testId="noon-data-completeness-overview">
        <NoonDataMetricGrid metrics={overview?.metrics ?? []} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <EChartPanel title="数据类别" testId="noon-data-completeness-category-chart" ariaLabel="数据类别分布图表" state={categoryChartState} emptyText="暂无数据类别分布" option={categoryChartOption} />
          <EChartPanel title="最新状态" testId="noon-data-completeness-latest-status-chart" ariaLabel="最新状态分布图表" state={latestStatusChartState} emptyText="暂无最新状态分布" option={latestStatusChartOption} />
          <EChartPanel title="历史补全" testId="noon-data-completeness-history-status-chart" ariaLabel="历史补全分布图表" state={historyStatusChartState} emptyText="暂无历史补全分布" option={historyStatusChartOption} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <NoonDataDistributionStrip title="数据类别" items={categoryDistribution} />
          <NoonDataDistributionStrip title="最新状态" items={latestStatusDistribution} />
          <NoonDataDistributionStrip title="历史补全" items={historyStatusDistribution} />
        </div>
      </NoonDataReportSection>

      <NoonDataReportSection title="完整性台账明细" testId="noon-data-completeness-ledger">
        {rows.length ? (
          <Table<NoonDataCompletenessRow>
            size="small"
            rowKey={(row) => String(row.id ?? `${row.storeCode}-${row.siteCode}-${row.category}`)}
            columns={columns}
            dataSource={rows}
            pagination={{ pageSize: 20, showSizeChanger: false }}
            scroll={{ x: 1140 }}
          />
        ) : (
          <NoonDataEmpty testId="noon-data-completeness-empty" description="暂无数据完整性台账" />
        )}
      </NoonDataReportSection>

      <Drawer
        title={selectedRow ? `${selectedRow.storeCode || '-'} / ${selectedRow.siteCode || '-'} 缺口明细` : '缺口明细'}
        open={Boolean(selectedRow)}
        width={820}
        onClose={() => setSelectedRow(null)}
      >
        <div data-testid="noon-data-gap-drilldown" style={{ display: 'grid', gap: 12 }}>
          {gapState.status === 'error' ? <Alert type="error" showIcon message={gapState.message} /> : null}
          <Table<NoonDataGapRow>
            size="small"
            rowKey={(row) => String(row.id ?? `${row.category}-${row.windowType}-${row.dateFrom}-${row.dateTo}`)}
            columns={NOON_DATA_GAP_COLUMNS}
            dataSource={gapState.data?.rows ?? []}
            loading={gapState.status === 'loading'}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            scroll={{ x: 760 }}
          />
        </div>
      </Drawer>
    </div>
  )
}

export default NoonDataCompletenessPage
