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
  formatDateTime,
  statusLabel
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
  const [syncingKeys, setSyncingKeys] = useState<Set<string>>(() => new Set())
  const canAct = session.activeRoleView === 'boss' || isSystemAdminSession(session)

  const load = async (options?: { preserveOptimisticSyncing?: boolean }) => {
    if (!options?.preserveOptimisticSyncing) {
      setSyncingKeys(new Set())
    }
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
    const nextActingKey = rowCategoryKey(row, cell)
    setActingKey(nextActingKey)
    setSyncingKeys((current) => addSyncingKey(current, nextActingKey))
    try {
      const result = await syncNoonCallStoreDataCategory(row.ownerUserId, row.storeCode, row.siteCode, cell.category)
      message.success(result.message || '同步任务已提交')
      await load({ preserveOptimisticSyncing: true })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步任务提交失败'
      setSyncingKeys((current) => removeSyncingKey(current, nextActingKey))
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
        width: 170,
        render: (_value, row) => (
          <Space direction="vertical" size={0} style={{ maxWidth: 146, minWidth: 0 }}>
            <Text strong ellipsis={{ tooltip: row.storeName || '未命名店铺' }} style={{ maxWidth: 146 }}>
              {row.storeName || '未命名店铺'}
            </Text>
            <Text type="secondary">{row.siteCode || '-'}</Text>
          </Space>
        )
      },
      {
        title: '整体标记',
        dataIndex: 'overallMarker',
        key: 'overallMarker',
        width: 88,
        render: (value) => <MarkerTag value={value} />
      },
      ...CATEGORY_ORDER.map((category) => ({
        title: categoryTitle(category),
        key: category,
        width: 160,
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
        width: 130,
        render: formatDateTime
      }
    ],
    [actingKey, canAct]
  )

  const view = state.data
  const rows = view?.rows ?? []
  const displayRows = useMemo(() => applyOptimisticSyncing(rows, syncingKeys), [rows, syncingKeys])
  const markerDistribution = useMemo(() => buildMarkerDistribution(displayRows), [displayRows])
  const categoryStatusDistribution = useMemo(() => buildCategoryMarkerDistribution(displayRows), [displayRows])
  const categoryGapDistribution = useMemo(() => buildCategoryGapDistribution(displayRows), [displayRows])
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
    <div
      data-testid="noon-call-store-data-workbench"
      style={{ padding: 20, display: 'grid', gap: 12, minWidth: 0, overflowX: 'hidden', width: '100%' }}
    >
      <NoonDataReportHeader
        generatedAt={view?.generatedAt}
        extra={
          <Button icon={<ReloadOutlined />} loading={state.status === 'loading'} onClick={() => void load()}>
            刷新
          </Button>
        }
      />

      {state.status === 'error' ? <Alert type="error" showIcon message={state.message} /> : null}

      <NoonDataReportSection title="同步概览" testId="noon-call-store-data-overview">
        <NoonDataMetricGrid metrics={view?.metrics ?? []} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 12, minWidth: 0 }}>
          <EChartPanel title="整体标记分布" testId="noon-call-store-data-marker-chart" ariaLabel="Noon 店铺整体标记分布图表" state={markerChartState} emptyText="暂无整体标记分布" option={markerChartOption} />
          <EChartPanel title="数据项状态分布" testId="noon-call-store-data-category-status-chart" ariaLabel="Noon 店铺数据项状态分布图表" state={categoryStatusChartState} emptyText="暂无数据项状态分布" option={categoryStatusChartOption} />
          <EChartPanel title="活跃缺口排行" testId="noon-call-store-data-gap-chart" ariaLabel="Noon 店铺数据活跃缺口排行图表" state={categoryGapChartState} emptyText="暂无活跃缺口" option={categoryGapChartOption} />
        </div>
      </NoonDataReportSection>

      <NoonDataReportSection title="店铺列表" testId="noon-call-store-data-table">
        {displayRows.length ? (
          <Table<NoonCallStoreDataRow>
            size="small"
            rowKey={(row) => `${row.ownerUserId}-${row.storeCode}-${row.siteCode}`}
            columns={columns}
            dataSource={displayRows}
            pagination={{ pageSize: 20, showSizeChanger: false }}
            scroll={{ x: 1040 }}
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
  const markerText = markerLabel(cell.marker)
  const statusValues = displayStatuses(cell, markerText)
  return (
    <div data-testid={`noon-call-cell-${cell.category}`} style={{ display: 'grid', gap: 4, minWidth: 0 }}>
      <Space size={6} wrap>
        <Text strong ellipsis={{ tooltip: cell.label || categoryTitle(cell.category) }} style={{ maxWidth: 132 }}>
          {cell.label || categoryTitle(cell.category)}
        </Text>
        <MarkerTag value={cell.marker} />
      </Space>
      {statusValues.length ? (
        <Space size={[4, 4]} wrap>
          {statusValues.map((status) => (
            <StatusTag key={status} value={status} />
          ))}
        </Space>
      ) : null}
      <Space direction="vertical" size={0}>
        {cell.latestDataDate ? <Text type="secondary">数据截至 {formatDate(cell.latestDataDate)}</Text> : null}
        {cell.latestTaskId ? (
          <Text type="secondary">
            task {cell.latestTaskId} {cell.latestTaskStatus ? `/${cell.latestTaskStatus}` : ''}
          </Text>
        ) : null}
        {cell.lastSyncAt ? <Text type="secondary">同步 {formatDateTime(cell.lastSyncAt)}</Text> : null}
        {cell.failureType ? <Text type="danger">{cell.failureType}</Text> : null}
      </Space>
      <Button
        size="small"
        autoInsertSpace={false}
        disabled={disabled}
        loading={loading}
        style={{ justifySelf: 'start', whiteSpace: 'nowrap' }}
        onClick={() => onSync(row, cell)}
      >
        同步
      </Button>
    </div>
  )
}

function rowCategoryKey(row: NoonCallStoreDataRow, cell: Pick<NoonCallStoreCategoryCell, 'category'>) {
  return `${row.ownerUserId}:${row.storeCode}:${row.siteCode}:${cell.category}`
}

function addSyncingKey(current: Set<string>, key: string) {
  const next = new Set(current)
  next.add(key)
  return next
}

function removeSyncingKey(current: Set<string>, key: string) {
  const next = new Set(current)
  next.delete(key)
  return next
}

function applyOptimisticSyncing(rows: NoonCallStoreDataRow[], syncingKeys: Set<string>): NoonCallStoreDataRow[] {
  if (!syncingKeys.size) {
    return rows
  }
  return rows.map((row) => {
    let changed = false
    const categories = row.categories.map((cell) => {
      if (!syncingKeys.has(rowCategoryKey(row, cell))) {
        return cell
      }
      changed = true
      return {
        ...cell,
        marker: 'SYNCING',
        latestTaskStatus: cell.latestTaskStatus || 'QUEUED'
      }
    })
    return changed ? { ...row, overallMarker: 'SYNCING', categories } : row
  })
}

function uniqueStatuses(...values: Array<string | null | undefined>) {
  const seen = new Set<string>()
  const statuses: string[] = []
  values.forEach((value) => {
    const normalized = (value || '').trim()
    if (!normalized || seen.has(normalized)) {
      return
    }
    seen.add(normalized)
    statuses.push(normalized)
  })
  return statuses
}

function displayStatuses(cell: NoonCallStoreCategoryCell, markerText: string) {
  return uniqueStatuses(cell.latestStatus, cell.historyStatus).filter((status) => {
    if (statusLabel(status) === markerText) {
      return false
    }
    if (status === 'NOT_REQUIRED') {
      return false
    }
    if (cell.marker === 'COMPLETE' && (status === 'READY' || status === 'COMPLETE')) {
      return false
    }
    return true
  })
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
