import { Alert, Button, Card, Empty, List, Segmented, Select, Space, Spin, Table, Tag, Typography } from 'antd'
import { LinkOutlined, ReloadOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuthSession, AuthSessionStore } from '../auth/session'
import { fetchAiOperationsDashboardOverview } from './api'
import type {
  AiOperationsDashboardDatePreset,
  AiOperationsDashboardEvidenceItem,
  AiOperationsDashboardOverview,
  AiOperationsDashboardQuery,
  AiOperationsDashboardSignal
} from './types'

const { Text, Title } = Typography

type AiOperationsDashboardPageProps = {
  session: AuthSession
}

const DATE_PRESET_OPTIONS: Array<{ label: string; value: AiOperationsDashboardDatePreset }> = [
  { label: '今天', value: 'today' },
  { label: '近7天', value: 'last7Days' },
  { label: '近30天', value: 'last30Days' }
]

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

function tagColor(state?: string | null) {
  if (state === 'info') return 'blue'
  if (state === 'warning') return 'orange'
  if (state === 'error') return 'red'
  if (state === 'ready') return 'green'
  if (state === 'sync_in_progress' || state === 'backfill_running') return 'processing'
  if (state === 'partial_success') return 'gold'
  if (state === 'empty' || state === 'workspace_empty' || state === 'backfill_required' || state === 'empty_report') return 'default'
  if (state === 'runtime_disabled' || state === 'not_connected') return 'blue'
  if (state === 'provider_unavailable' || state === 'stale') return 'orange'
  if (state === 'backfill_failed' || state === 'missing_mapping') return 'red'
  return 'default'
}

function formatMetricValue(value: AiOperationsDashboardOverview['metricCards'][number]['value'], unit?: string | null) {
  if (value === null || value === undefined || value === '') {
    return '--'
  }
  return `${value}${unit ? ` ${unit}` : ''}`
}

export function AiOperationsDashboardPage({ session }: AiOperationsDashboardPageProps) {
  const currentStore = session.currentStore
  const allowedStores = useMemo(() => uniqueStores(session.userStores, currentStore), [currentStore, session.userStores])
  const [selectedStoreKey, setSelectedStoreKey] = useState(() => storeKey(currentStore))
  const [datePreset, setDatePreset] = useState<AiOperationsDashboardDatePreset>('last7Days')
  const [overview, setOverview] = useState<AiOperationsDashboardOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!allowedStores.length) {
      setSelectedStoreKey('')
      return
    }
    const currentKey = storeKey(currentStore)
    const nextKey =
      currentKey && allowedStores.some((store) => storeKey(store) === currentKey)
        ? currentKey
        : storeKey(allowedStores[0])
    setSelectedStoreKey((previous) =>
      previous && allowedStores.some((store) => storeKey(store) === previous) ? previous : nextKey
    )
  }, [allowedStores, currentStore])

  const selectedStore = useMemo(
    () => allowedStores.find((store) => storeKey(store) === selectedStoreKey) || allowedStores[0] || null,
    [allowedStores, selectedStoreKey]
  )

  const query = useMemo<AiOperationsDashboardQuery>(
    () => ({
      storeCode: selectedStore?.storeCode,
      siteCode: selectedStore?.site || siteCodeFromStoreCode(selectedStore?.storeCode),
      datePreset
    }),
    [datePreset, selectedStore]
  )

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      setOverview(await fetchAiOperationsDashboardOverview(query))
    } catch (error) {
      setOverview(null)
      setErrorMessage(error instanceof Error ? error.message : 'AI运营看板加载失败')
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  const metricCards = overview?.metricCards || []
  const signals = overview?.signals || []
  const evidenceItems = overview?.evidence?.items || []
  const suggestionItems = overview?.suggestions?.items || []

  return (
    <div data-testid="ai-operations-dashboard-workbench" style={{ padding: 20 }}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <Space direction="vertical" size={2}>
            <Title level={4} style={{ margin: 0 }}>
              AI运营看板
            </Title>
            <Text type="secondary">
              {overview?.scope?.dateFrom && overview?.scope?.dateTo
                ? `${overview.scope.dateFrom} 至 ${overview.scope.dateTo}`
                : '等待后端范围确认'}
            </Text>
          </Space>
          <Space wrap>
            <Select
              value={selectedStoreKey || undefined}
              placeholder="选择店铺"
              style={{ minWidth: 220 }}
              disabled={!allowedStores.length}
              options={allowedStores.map((store) => ({
                value: storeKey(store),
                label: `${store.projectName || store.projectCode || store.storeCode} / ${store.site || siteCodeFromStoreCode(store.storeCode)}`
              }))}
              onChange={setSelectedStoreKey}
            />
            <Segmented
              value={datePreset}
              options={DATE_PRESET_OPTIONS}
              onChange={(value) => setDatePreset(value as AiOperationsDashboardDatePreset)}
            />
            <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void loadOverview()}>
              刷新
            </Button>
          </Space>
        </div>

        {errorMessage ? <Alert type="error" showIcon message={errorMessage} /> : null}

        {overview?.summary ? (
          <Alert
            type={overview.summary.state === 'empty' ? 'info' : 'success'}
            showIcon
            message={
              <Space>
                <span>{overview.summary.title}</span>
                <Tag color={tagColor(overview.summary.state)}>{overview.summary.state}</Tag>
              </Space>
            }
            description={overview.summary.description}
          />
        ) : null}

        <Spin spinning={loading}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12
              }}
            >
              {metricCards.map((metric) => (
                <Card key={metric.key} size="small" variant="borderless" style={{ background: '#f8fafc' }}>
                  <Space direction="vertical" size={6} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <Text strong>{metric.title}</Text>
                      <Space size={4}>
                        <Tag color={tagColor(metric.state)}>{metric.state}</Tag>
                        {metric.qualityState && metric.qualityState !== metric.state ? (
                          <Tag color={tagColor(metric.qualityState)}>{metric.qualityState}</Tag>
                        ) : null}
                      </Space>
                    </div>
                    <Text style={{ fontSize: 24 }}>{formatMetricValue(metric.value, metric.unit)}</Text>
                    <Text type="secondary">{metric.description || metric.qualityState || '等待信号接入'}</Text>
                  </Space>
                </Card>
              ))}
            </div>

            <DashboardSection title="经营信号" state={signals.length ? 'partial_success' : 'not_connected'}>
              {signals.length ? <SignalsTable signals={signals} /> : <Empty description="暂无可用经营信号" />}
            </DashboardSection>

            <DashboardSection title="AI今日总结" state={overview?.aiSummary?.state || 'runtime_disabled'}>
              {overview?.aiSummary?.content ? (
                <Text>{overview.aiSummary.content}</Text>
              ) : (
                <Empty description="AI总结运行时未启用" />
              )}
            </DashboardSection>

            <DashboardSection title="AI建议" state={overview?.suggestions?.state || 'runtime_disabled'}>
              {suggestionItems.length ? (
                <List
                  dataSource={suggestionItems}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta title={item.title} description={item.description || item.status} />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无 AI 建议" />
              )}
            </DashboardSection>

            <DashboardSection title="证据来源" state={overview?.evidence?.state || 'not_connected'}>
              {evidenceItems.length ? (
                <EvidenceList items={evidenceItems} />
              ) : (
                <Empty description="暂无证据来源，AI不会基于缺失数据生成结论" />
              )}
            </DashboardSection>
          </Space>
        </Spin>
      </Space>
    </div>
  )
}

function DashboardSection({ title, state, children }: { title: string; state: string; children: React.ReactNode }) {
  return (
    <section style={{ borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Space align="center">
          <Text strong>{title}</Text>
          <Tag color={tagColor(state)}>{state}</Tag>
        </Space>
        {children}
      </Space>
    </section>
  )
}

function SignalsTable({ signals }: { signals: AiOperationsDashboardSignal[] }) {
  return (
    <Table
      size="small"
      pagination={false}
      rowKey="key"
      dataSource={signals}
      columns={[
        {
          title: '信号',
          dataIndex: 'title',
          render: (_: string, row) => (
            <Space direction="vertical" size={2}>
              <Text strong>{row.title}</Text>
              <Text type="secondary">{row.description || row.key}</Text>
            </Space>
          )
        },
        {
          title: '状态',
          dataIndex: 'state',
          width: 150,
          render: (value: string) => <Tag color={tagColor(value)}>{value}</Tag>
        },
        {
          title: '严重度',
          dataIndex: 'severity',
          width: 120,
          render: (value: string | null) => (value ? <Tag color={tagColor(value)}>{value}</Tag> : '-')
        },
        {
          title: '来源',
          dataIndex: 'source',
          width: 180,
          render: (value: string | null) => value || '-'
        },
        {
          title: '查看',
          dataIndex: 'drillThroughPath',
          width: 100,
          render: (value: string | null) =>
            value ? (
              <a href={value}>
                <Space size={4}>
                  <LinkOutlined />
                  <span>查看</span>
                </Space>
              </a>
            ) : (
              '-'
            )
        }
      ]}
    />
  )
}

function EvidenceList({ items }: { items: AiOperationsDashboardEvidenceItem[] }) {
  return (
    <List
      size="small"
      dataSource={items}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            title={
              <Space>
                <span>{item.label}</span>
                {item.state ? <Tag color={tagColor(item.state)}>{item.state}</Tag> : null}
              </Space>
            }
            description={item.description || item.source}
          />
        </List.Item>
      )}
    />
  )
}
