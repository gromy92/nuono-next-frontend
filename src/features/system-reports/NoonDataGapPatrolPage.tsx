import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Space, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined } from '@ant-design/icons'
import type { AuthSession } from '../auth/session'
import { EChartPanel, buildHorizontalBarOption } from '../../shared/charts'
import { fetchNoonDataGapPatrol, pauseNoonDataGap, reAuditNoonDataGap, resumeNoonDataGap, retryNoonDataGap } from './api'
import {
  CategoryTag,
  NoonDataDistributionStrip,
  NoonDataEmpty,
  NoonDataMetricGrid,
  NoonDataReportSection,
  StatusTag,
  failureTypeLabel,
  formatDate,
  formatDateTime,
  statusLabel,
  windowTypeLabel
} from './NoonDataReportBlocks'
import type { NoonDataDistributionItem, NoonDataGapPatrol, NoonDataGapRow } from './types'

const { Text } = Typography

type NoonDataGapPatrolPageProps = {
  session: AuthSession
}

type LoadState =
  | { status: 'idle' | 'loading'; data?: NoonDataGapPatrol; message?: string }
  | { status: 'success'; data: NoonDataGapPatrol; message?: string }
  | { status: 'error'; data?: NoonDataGapPatrol; message: string }

export function NoonDataGapPatrolPage({ session }: NoonDataGapPatrolPageProps) {
  const [state, setState] = useState<LoadState>({ status: 'idle' })
  const [actingGapId, setActingGapId] = useState<number | null>(null)
  const canAct = session.activeRoleView === 'boss'

  const load = async () => {
    setState((current) => ({ status: 'loading', data: current.data }))
    try {
      const data = await fetchNoonDataGapPatrol()
      setState({ status: 'success', data })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '数据缺口巡检加载失败'
      setState((current) => ({ status: 'error', data: current.data, message: errorMessage }))
      message.error(errorMessage)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const patrol = state.data
  const rows = patrol?.rows ?? []
  const statusDistribution = useMemo(
    () => localizeDistribution(patrol?.statusDistribution ?? [], statusLabel),
    [patrol?.statusDistribution]
  )
  const failureDistribution = useMemo(
    () => localizeDistribution(patrol?.failureDistribution ?? [], failureTypeLabel),
    [patrol?.failureDistribution]
  )
  const statusChartOption = useMemo(
    () => buildHorizontalBarOption(statusDistribution, { seriesName: '缺口状态', unit: '个' }),
    [statusDistribution]
  )
  const failureChartOption = useMemo(
    () => buildHorizontalBarOption(failureDistribution, { seriesName: '失败类型', unit: '个' }),
    [failureDistribution]
  )
  const statusChartState = state.status === 'loading' ? 'loading' : statusDistribution.length > 0 ? 'ready' : 'empty'
  const failureChartState = state.status === 'loading' ? 'loading' : failureDistribution.length > 0 ? 'ready' : 'empty'
  const runAction = async (gapId: number | null | undefined, action: 'retry' | 'pause' | 'resume' | 'reaudit') => {
    if (!gapId) {
      return
    }
    setActingGapId(gapId)
    try {
      if (action === 'retry') {
        await retryNoonDataGap(gapId)
      } else if (action === 'pause') {
        await pauseNoonDataGap(gapId, 'paused_from_gap_patrol_page')
      } else if (action === 'resume') {
        await resumeNoonDataGap(gapId)
      } else {
        await reAuditNoonDataGap(gapId)
      }
      message.success('操作已提交')
      await load()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '操作失败'
      message.error(errorMessage)
    } finally {
      setActingGapId(null)
    }
  }

  const columns = useMemo<ColumnsType<NoonDataGapRow>>(
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
        title: '窗口',
        key: 'window',
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text>{windowTypeLabel(row.windowType)}</Text>
            <Text type="secondary">
              {formatDate(row.dateFrom)} - {formatDate(row.dateTo)}
            </Text>
          </Space>
        )
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (value) => <StatusTag value={value} />
      },
      {
        title: '重试',
        key: 'retry',
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text>{row.attempts ?? 0} 次</Text>
            <Text type="secondary">{formatDateTime(row.nextRetryAt)}</Text>
          </Space>
        )
      },
      {
        title: '处理方式',
        key: 'action',
        render: (_value, row) => (
          <Space wrap size={[4, 4]}>
            {row.retryable ? <Tag color="gold">可自动重试</Tag> : null}
            {row.requiresManualAction ? <Tag color="red">需人工介入</Tag> : null}
            {!row.retryable && !row.requiresManualAction ? <Tag>待巡检判断</Tag> : null}
          </Space>
        )
      },
      {
        title: '批次/任务',
        key: 'link',
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text>{row.linkedSourceBatchId || '-'}</Text>
            <Text type="secondary">{row.linkedPullTaskId ? `任务 ${row.linkedPullTaskId}` : '-'}</Text>
          </Space>
        )
      },
      {
        title: '诊断',
        key: 'diagnosticSummary',
        ellipsis: true,
        render: (_value, row) => (
          <Space direction="vertical" size={0}>
            <Text>{failureTypeLabel(row.failureType)}</Text>
            <Text type="secondary">{row.diagnosticSummary || '-'}</Text>
          </Space>
        )
      },
      {
        title: '动作',
        key: 'actions',
        width: 220,
        render: (_value, row) => {
          if (!canAct) {
            return <Text type="secondary">只读</Text>
          }
          const loading = actingGapId === row.id
          const canRetry = row.retryable && !row.requiresManualAction && row.status !== 'PROVIDER_RETENTION_LIMIT'
          return (
            <Space size={[4, 4]} wrap>
              <Button size="small" disabled={!canRetry} loading={loading} onClick={() => runAction(row.id, 'retry')}>
                重试
              </Button>
              {row.status === 'PAUSED' ? (
                <Button size="small" loading={loading} onClick={() => runAction(row.id, 'resume')}>
                  恢复
                </Button>
              ) : (
                <Button size="small" loading={loading} onClick={() => runAction(row.id, 'pause')}>
                  暂停
                </Button>
              )}
              <Button size="small" loading={loading} onClick={() => runAction(row.id, 'reaudit')}>
                重新审计
              </Button>
            </Space>
          )
        }
      }
    ],
    [actingGapId, canAct]
  )

  return (
    <div
      data-testid="noon-data-gap-patrol-workbench"
      style={{ padding: 20, display: 'grid', gap: 12, minWidth: 0, overflowX: 'hidden', width: '100%' }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', minWidth: 0 }}>
        <Space wrap style={{ justifyContent: 'flex-end' }}>
          {patrol?.generatedAt ? <Text type="secondary">更新时间 {formatDateTime(patrol.generatedAt)}</Text> : null}
          <Button icon={<ReloadOutlined />} loading={state.status === 'loading'} onClick={load}>
            刷新
          </Button>
        </Space>
      </div>

      {state.status === 'error' ? <Alert type="error" showIcon message={state.message} /> : null}

      <NoonDataReportSection title="缺口巡检总览" testId="noon-data-gap-patrol-overview">
        <NoonDataMetricGrid metrics={patrol?.metrics ?? []} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <EChartPanel title="缺口状态" testId="noon-data-gap-status-chart" ariaLabel="缺口状态分布图表" state={statusChartState} emptyText="暂无缺口状态分布" option={statusChartOption} height={220} />
          <EChartPanel title="失败类型" testId="noon-data-gap-failure-chart" ariaLabel="失败类型分布图表" state={failureChartState} emptyText="暂无失败类型分布" option={failureChartOption} height={220} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <NoonDataDistributionStrip title="缺口状态" items={statusDistribution} />
          <NoonDataDistributionStrip title="失败类型" items={failureDistribution} />
        </div>
      </NoonDataReportSection>

      <NoonDataReportSection title="缺口窗口明细" testId="noon-data-gap-patrol-rows">
        {rows.length ? (
          <Table<NoonDataGapRow>
            size="small"
            rowKey={(row) => String(row.id ?? `${row.storeCode}-${row.siteCode}-${row.category}-${row.dateFrom}`)}
            columns={columns}
            dataSource={rows}
            pagination={{ pageSize: 20, showSizeChanger: false }}
            scroll={{ x: 1220 }}
          />
        ) : (
          <NoonDataEmpty testId="noon-data-gap-patrol-empty" description="暂无数据缺口" />
        )}
      </NoonDataReportSection>
    </div>
  )
}

function localizeDistribution(
  items: NoonDataDistributionItem[],
  labeler: (value: string) => string
): NoonDataDistributionItem[] {
  return items.map((item) => ({
    ...item,
    label: labeler(item.key || item.label)
  }))
}

export default NoonDataGapPatrolPage
