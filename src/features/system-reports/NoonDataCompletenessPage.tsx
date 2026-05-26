import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Drawer, Input, Select, Space, Table, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons'
import type { AuthSession } from '../auth/session'
import { EChartPanel, buildDistributionPieOption } from '../../shared/charts'
import { fetchNoonDataCompletenessOverview, fetchNoonDataGapPatrol } from './api'
import {
  CategoryTag,
  NoonDataDistributionStrip,
  NoonDataEmpty,
  NoonDataMetricGrid,
  NoonDataReportHeader,
  NoonDataReportSection,
  StatusTag,
  formatDate,
  formatDateTime
} from './NoonDataReportBlocks'
import type {
  NoonDataCompletenessFilters,
  NoonDataCompletenessOverview,
  NoonDataCompletenessRow,
  NoonDataGapPatrol,
  NoonDataGapRow
} from './types'

const { Text } = Typography

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

const CATEGORY_OPTIONS = [
  { label: '全部类别', value: '' },
  { label: '商品列表', value: 'PRODUCT_LIST' },
  { label: '商品详情', value: 'PRODUCT_DETAIL' },
  { label: '销售订单', value: 'SALES_ORDER' },
  { label: 'Product Views 销量/PV', value: 'SALES_PRODUCT_VIEWS' }
]

const LATEST_STATUS_OPTIONS = [
  { label: '全部最新状态', value: '' },
  { label: '就绪', value: 'READY' },
  { label: '未完成', value: 'INCOMPLETE' },
  { label: '待确认', value: 'PENDING_CONFIRMATION' },
  { label: '失败', value: 'FAILED' },
  { label: '已暂停', value: 'PAUSED' },
  { label: '未接入', value: 'NOT_INTEGRATED' }
]

const HISTORY_STATUS_OPTIONS = [
  { label: '全部历史状态', value: '' },
  { label: '无需补全', value: 'NOT_REQUIRED' },
  { label: '未完成', value: 'INCOMPLETE' },
  { label: '已完成', value: 'COMPLETE' },
  { label: '确认空', value: 'CONFIRMED_EMPTY' },
  { label: '超出保留期', value: 'PROVIDER_RETENTION_LIMIT' },
  { label: '失败', value: 'FAILED' },
  { label: '未接入', value: 'NOT_INTEGRATED' }
]

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
  const columns = useMemo<ColumnsType<NoonDataCompletenessRow>>(
    () => [
      {
        title: '店铺',
        dataIndex: 'storeCode',
        key: 'storeCode',
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text strong>{row.storeCode || '-'}</Text>
            <Text type="secondary">{row.siteCode || '-'}</Text>
          </Space>
        )
      },
      {
        title: '类别',
        dataIndex: 'category',
        key: 'category',
        render: (value) => <CategoryTag value={value} />
      },
      {
        title: '最新状态',
        dataIndex: 'latestStatus',
        key: 'latestStatus',
        render: (value) => <StatusTag value={value} />
      },
      {
        title: '历史补全',
        dataIndex: 'historyStatus',
        key: 'historyStatus',
        render: (value) => <StatusTag value={value} />
      },
      {
        title: '最新数据日',
        dataIndex: 'latestDataDate',
        key: 'latestDataDate',
        render: formatDate
      },
      {
        title: '历史覆盖',
        key: 'historyRange',
        render: (_value, row) => `${formatDate(row.historyCoveredFrom)} - ${formatDate(row.historyCoveredTo)}`
      },
      {
        title: '巡检',
        key: 'patrol',
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text>{row.patrolEnabled ? '已开启' : '未开启'}</Text>
            <Text type={row.activeGapCount ? 'danger' : 'secondary'}>{row.activeGapCount ?? 0} 个缺口</Text>
          </Space>
        )
      },
      {
        title: '下次巡检',
        dataIndex: 'nextPatrolAt',
        key: 'nextPatrolAt',
        render: formatDateTime
      },
      {
        title: '缺口',
        key: 'gaps',
        fixed: 'right',
        width: 96,
        render: (_value, row) => (
          <Button size="small" onClick={() => openDrilldown(row)}>
            查看缺口
          </Button>
        )
      }
    ],
    []
  )

  const gapColumns = useMemo<ColumnsType<NoonDataGapRow>>(
    () => [
      {
        title: '窗口',
        dataIndex: 'windowType',
        key: 'windowType',
        width: 160
      },
      {
        title: '日期范围',
        key: 'dateRange',
        width: 190,
        render: (_value, row) => `${formatDate(row.dateFrom)} - ${formatDate(row.dateTo)}`
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (value) => <StatusTag value={value} />
      },
      {
        title: '失败类型',
        dataIndex: 'failureType',
        key: 'failureType',
        width: 190,
        render: (value) => value || '-'
      },
      {
        title: '证据',
        key: 'evidence',
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text>task {row.linkedPullTaskId ?? '-'}</Text>
            <Text type="secondary">batch {row.linkedSourceBatchId ?? '-'}</Text>
            <Text type="secondary">{row.diagnosticSummary || '-'}</Text>
          </Space>
        )
      }
    ],
    []
  )

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
            options={CATEGORY_OPTIONS}
            onChange={(value) => setFilters((current) => ({ ...current, category: value || null }))}
            style={{ width: 190 }}
          />
          <Select
            aria-label="最新状态"
            value={filters.latestStatus ?? ''}
            options={LATEST_STATUS_OPTIONS}
            onChange={(value) => setFilters((current) => ({ ...current, latestStatus: value || null }))}
            style={{ width: 150 }}
          />
          <Select
            aria-label="历史状态"
            value={filters.historyStatus ?? ''}
            options={HISTORY_STATUS_OPTIONS}
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
            columns={gapColumns}
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
