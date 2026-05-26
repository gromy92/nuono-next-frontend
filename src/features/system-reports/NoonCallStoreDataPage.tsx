import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Space, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined } from '@ant-design/icons'
import type { AuthSession } from '../auth/session'
import { isSystemAdminSession } from '../app-shell/WorkspaceRouting'
import { EChartPanel, buildDistributionPieOption, buildHorizontalBarOption } from '../../shared/charts'
import type { DistributionPoint } from '../../shared/charts'
import { fetchNoonCallStoreData, syncNoonCallStoreDataCategory } from './api'
import {
  NoonDataEmpty,
  NoonDataMetricGrid,
  NoonDataReportHeader,
  NoonDataReportSection,
  StatusTag,
  formatDate,
  formatDateTime
} from './NoonDataReportBlocks'
import type { NoonCallStoreCategoryCell, NoonCallStoreDataRow, NoonCallStoreDataView } from './types'

const { Text } = Typography

type NoonCallStoreDataPageProps = {
  session: AuthSession
}

type LoadState =
  | { status: 'idle' | 'loading'; data?: NoonCallStoreDataView; message?: string }
  | { status: 'success'; data: NoonCallStoreDataView; message?: string }
  | { status: 'error'; data?: NoonCallStoreDataView; message: string }

const CATEGORY_ORDER = ['PRODUCT_LIST', 'PRODUCT_DETAIL', 'SALES_ORDER', 'SALES_PRODUCT_VIEWS']

export function NoonCallStoreDataPage({ session }: NoonCallStoreDataPageProps) {
  const [state, setState] = useState<LoadState>({ status: 'idle' })
  const [actingKey, setActingKey] = useState<string | null>(null)
  const canAct = session.activeRoleView === 'boss' || isSystemAdminSession(session)

  const load = async () => {
    setState((current) => ({ status: 'loading', data: current.data }))
    try {
      const data = await fetchNoonCallStoreData()
      setState({ status: 'success', data })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Noon 店铺数据加载失败'
      setState((current) => ({ status: 'error', data: current.data, message: errorMessage }))
      message.error(errorMessage)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runSync = async (row: NoonCallStoreDataRow, cell: NoonCallStoreCategoryCell) => {
    if (!row.ownerUserId || !row.storeCode || !row.siteCode || !cell.category) {
      return
    }
    const nextActingKey = `${row.ownerUserId}:${row.storeCode}:${row.siteCode}:${cell.category}`
    setActingKey(nextActingKey)
    try {
      const result = await syncNoonCallStoreDataCategory(row.ownerUserId, row.storeCode, row.siteCode, cell.category)
      message.success(result.message || '同步任务已提交')
      await load()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步任务提交失败'
      message.error(errorMessage)
    } finally {
      setActingKey(null)
    }
  }

  const columns = useMemo<ColumnsType<NoonCallStoreDataRow>>(
    () => [
      {
        title: '店铺',
        dataIndex: 'storeCode',
        key: 'storeCode',
        fixed: 'left',
        width: 190,
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text strong>{row.storeCode || '-'}</Text>
            <Text type="secondary">{row.siteCode || '-'}</Text>
          </Space>
        )
      },
      {
        title: '整体标记',
        dataIndex: 'overallMarker',
        key: 'overallMarker',
        width: 120,
        render: (value) => <MarkerTag value={value} />
      },
      ...CATEGORY_ORDER.map((category) => ({
        title: categoryTitle(category),
        key: category,
        width: 250,
        render: (_value: unknown, row: NoonCallStoreDataRow) => {
          const cell = row.categories.find((item) => item.category === category)
          return cell ? (
            <CategorySyncCell
              row={row}
              cell={cell}
              canAct={canAct}
              loading={actingKey === `${row.ownerUserId}:${row.storeCode}:${row.siteCode}:${cell.category}`}
              onSync={runSync}
            />
          ) : (
            <Text type="secondary">未接入</Text>
          )
        }
      })),
      {
        title: '最近同步',
        dataIndex: 'lastSyncAt',
        key: 'lastSyncAt',
        width: 150,
        render: formatDateTime
      }
    ],
    [actingKey, canAct]
  )

  const view = state.data
  const rows = view?.rows ?? []
  const markerDistribution = useMemo(() => buildMarkerDistribution(rows), [rows])
  const categoryStatusDistribution = useMemo(() => buildCategoryMarkerDistribution(rows), [rows])
  const categoryGapDistribution = useMemo(() => buildCategoryGapDistribution(rows), [rows])
  const markerChartOption = useMemo(
    () => buildDistributionPieOption(markerDistribution, { seriesName: '整体标记', unit: '个' }),
    [markerDistribution]
  )
  const categoryStatusChartOption = useMemo(
    () => buildDistributionPieOption(categoryStatusDistribution, { seriesName: '数据项状态', unit: '项' }),
    [categoryStatusDistribution]
  )
  const categoryGapChartOption = useMemo(
    () => buildHorizontalBarOption(categoryGapDistribution, { seriesName: '活跃缺口', unit: '个' }),
    [categoryGapDistribution]
  )
  const markerChartState = state.status === 'loading' ? 'loading' : markerDistribution.length > 0 ? 'ready' : 'empty'
  const categoryStatusChartState = state.status === 'loading' ? 'loading' : categoryStatusDistribution.length > 0 ? 'ready' : 'empty'
  const categoryGapChartState =
    state.status === 'loading' ? 'loading' : categoryGapDistribution.some((item) => item.value > 0) ? 'ready' : 'empty'

  return (
    <div data-testid="noon-call-store-data-workbench" style={{ padding: 20, display: 'grid', gap: 12 }}>
      <NoonDataReportHeader
        title="店铺数据"
        subtitle="系统报表 / 店铺数据"
        generatedAt={view?.generatedAt}
        extra={
          <Button icon={<ReloadOutlined />} loading={state.status === 'loading'} onClick={load}>
            刷新
          </Button>
        }
      />

      {state.status === 'error' ? <Alert type="error" showIcon message={state.message} /> : null}

      <NoonDataReportSection title="同步概览" testId="noon-call-store-data-overview">
        <NoonDataMetricGrid metrics={view?.metrics ?? []} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          <EChartPanel title="整体标记分布" testId="noon-call-store-data-marker-chart" ariaLabel="Noon 店铺整体标记分布图表" state={markerChartState} emptyText="暂无整体标记分布" option={markerChartOption} />
          <EChartPanel title="数据项状态分布" testId="noon-call-store-data-category-status-chart" ariaLabel="Noon 店铺数据项状态分布图表" state={categoryStatusChartState} emptyText="暂无数据项状态分布" option={categoryStatusChartOption} />
          <EChartPanel title="活跃缺口排行" testId="noon-call-store-data-gap-chart" ariaLabel="Noon 店铺数据活跃缺口排行图表" state={categoryGapChartState} emptyText="暂无活跃缺口" option={categoryGapChartOption} />
        </div>
      </NoonDataReportSection>

      <NoonDataReportSection title="店铺列表" testId="noon-call-store-data-table">
        {rows.length ? (
          <Table<NoonCallStoreDataRow>
            size="small"
            rowKey={(row) => `${row.ownerUserId}-${row.storeCode}-${row.siteCode}`}
            columns={columns}
            dataSource={rows}
            pagination={{ pageSize: 20, showSizeChanger: false }}
            scroll={{ x: 1420 }}
          />
        ) : (
          <NoonDataEmpty testId="noon-call-store-data-empty" description="暂无 Noon 店铺同步数据" />
        )}
      </NoonDataReportSection>
    </div>
  )
}

function CategorySyncCell({
  row,
  cell,
  canAct,
  loading,
  onSync
}: {
  row: NoonCallStoreDataRow
  cell: NoonCallStoreCategoryCell
  canAct: boolean
  loading: boolean
  onSync: (row: NoonCallStoreDataRow, cell: NoonCallStoreCategoryCell) => void
}) {
  const disabled = !canAct || cell.syncable === false
  return (
    <div data-testid={`noon-call-cell-${cell.category}`} style={{ display: 'grid', gap: 6, minWidth: 220 }}>
      <Space size={6} wrap>
        <Text strong>{cell.label || categoryTitle(cell.category)}</Text>
        <MarkerTag value={cell.marker} />
      </Space>
      <Space size={[4, 4]} wrap>
        <StatusTag value={cell.latestStatus} />
        <StatusTag value={cell.historyStatus} />
      </Space>
      <Space direction="vertical" size={0}>
        <Text type="secondary">数据日 {formatDate(cell.latestDataDate)}</Text>
        <Text type="secondary">
          task {cell.latestTaskId ?? '-'} {cell.latestTaskStatus ? `/${cell.latestTaskStatus}` : ''}
        </Text>
        <Text type="secondary">同步 {formatDateTime(cell.lastSyncAt)}</Text>
        {cell.failureType ? <Text type="danger">{cell.failureType}</Text> : null}
      </Space>
      <Button size="small" disabled={disabled} loading={loading} onClick={() => onSync(row, cell)}>
        同步
      </Button>
    </div>
  )
}

function MarkerTag({ value }: { value?: string | null }) {
  const normalized = (value || '').trim()
  const colors: Record<string, string> = {
    COMPLETE: 'green',
    PENDING_SYNC: 'gold',
    SYNCING: 'blue',
    FAILED: 'red',
    MANUAL_ACTION: 'red',
    NOT_INTEGRATED: 'default',
    PENDING_CONFIRMATION: 'gold'
  }
  return <Tag color={colors[normalized] || 'default'}>{markerLabel(normalized)}</Tag>
}

function categoryTitle(category?: string | null) {
  const labels: Record<string, string> = {
    PRODUCT_LIST: '商品列表信息',
    PRODUCT_DETAIL: '商品信息',
    SALES_ORDER: '订单数据',
    SALES_PRODUCT_VIEWS: '销量数据'
  }
  return labels[category || ''] || category || '未知'
}

function markerLabel(value?: string | null) {
  const normalized = (value || '').trim()
  const labels: Record<string, string> = {
    COMPLETE: '完整',
    PENDING_SYNC: '待同步',
    SYNCING: '同步中',
    FAILED: '失败',
    MANUAL_ACTION: '需人工处理',
    NOT_INTEGRATED: '未接入',
    PENDING_CONFIRMATION: '待确认'
  }
  return labels[normalized] || normalized || '未知'
}

function buildMarkerDistribution(rows: NoonCallStoreDataRow[]): DistributionPoint[] {
  const counts = new Map<string, number>()
  rows.forEach((row) => increment(counts, row.overallMarker || 'UNKNOWN'))
  return mapCounts(counts, markerLabel)
}

function buildCategoryMarkerDistribution(rows: NoonCallStoreDataRow[]): DistributionPoint[] {
  const counts = new Map<string, number>()
  rows.forEach((row) => {
    row.categories.forEach((cell) => increment(counts, cell.marker || cell.latestStatus || 'UNKNOWN'))
  })
  return mapCounts(counts, markerLabel)
}

function buildCategoryGapDistribution(rows: NoonCallStoreDataRow[]): DistributionPoint[] {
  return CATEGORY_ORDER.map((category) => ({
    key: category,
    label: categoryTitle(category),
    value: rows.reduce((total, row) => {
      const cell = row.categories.find((item) => item.category === category)
      return total + Number(cell?.activeGapCount || 0)
    }, 0)
  }))
}

function increment(counts: Map<string, number>, key: string) {
  counts.set(key, (counts.get(key) || 0) + 1)
}

function mapCounts(counts: Map<string, number>, label: (value: string) => string): DistributionPoint[] {
  return Array.from(counts.entries()).map(([key, value]) => ({
    key,
    label: label(key),
    value
  }))
}

export default NoonCallStoreDataPage
