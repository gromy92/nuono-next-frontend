import { Alert, Button, Card, Empty, Input, Select, Space, Spin, Table, Tag, Tooltip, Typography, type TableColumnsType } from 'antd'
import { SyncOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useMemo, useState, type HTMLAttributes } from 'react'
import type { AuthSession, AuthSessionStore } from '../auth/session'
import { normalizeNoonImageUrl } from '../product-management/utils'
import { fetchProductLifecycleAnalysisOverview, recalculateProductLifecycleAnalysis } from './api'
import type {
  ProductLifecycleAnalysisOverview,
  ProductLifecycleAnalysisQuery,
  ProductLifecycleAnalysisRecalculation,
  ProductLifecycleAnalysisRow
} from './types'

const { Text } = Typography
const { Search } = Input

type ProductLifecycleAnalysisPageProps = {
  session: AuthSession
}

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

function rowKey(row: ProductLifecycleAnalysisRow) {
  return `${row.partnerSku || '-'}::${row.sku || '-'}`
}

function lifecycleColor(code?: string | null) {
  if (code === 'new') return '#60a5fa'
  if (code === 'growth') return '#22c55e'
  if (code === 'stable') return '#2563eb'
  if (code === 'decline') return '#f97316'
  if (code === 'longTail') return '#64748b'
  return '#cbd5e1'
}

function timelineSegments(row: ProductLifecycleAnalysisRow) {
  const points = row.futureTimeline || []
  const segments: Array<{ code?: string | null; label?: string | null; count: number }> = []
  for (const point of points) {
    const last = segments[segments.length - 1]
    if (last && last.code === point.lifecycleCode) {
      last.count += 1
    } else {
      segments.push({ code: point.lifecycleCode, label: point.lifecycleLabel, count: 1 })
    }
  }
  return segments
}

function missingRequirementsText(row: ProductLifecycleAnalysisRow) {
  return (row.projectionMissingRequirements || []).filter(Boolean).join('、')
}

function listingDateText(row: ProductLifecycleAnalysisRow) {
  if (
    !row.listingDate ||
    row.listingDateSource === 'missing' ||
    row.listingDateSource === 'not_listed' ||
    row.listingDateSource === 'data_missing' ||
    row.listingDateSource === 'pulled'
  ) {
    return '缺失上架日/未上架'
  }
  return `上架日 ${row.listingDate}`
}

function projectionUnavailableMessage(row: ProductLifecycleAnalysisRow) {
  if (row.projectionState === 'lifecycle_period_config_missing') {
    return '生命周期预测参数缺失，无法计算。'
  }
  if (row.projectionState === 'lifecycle_rule_config_missing') {
    return '缺少已发布生命周期规则配置，无法计算。'
  }
  if (row.projectionState === 'lifecycle_stage_start_date_missing') {
    return '缺少当前生命周期阶段起点，无法计算。'
  }
  if (row.projectionState === 'lifecycle_data_insufficient') {
    return '当前生命周期为数据不足，暂不预测。'
  }
  return row.projectionMessage || '生命周期预测暂不可用。'
}

function includesKeyword(value: string | null | undefined, keyword: string) {
  return (value || '').toLowerCase().includes(keyword)
}

export function ProductLifecycleAnalysisPage({ session }: ProductLifecycleAnalysisPageProps) {
  const currentStore = session.currentStore
  const [selectedStoreKey, setSelectedStoreKey] = useState(() => storeKey(currentStore))
  const [overview, setOverview] = useState<ProductLifecycleAnalysisOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [runStatus, setRunStatus] = useState<ProductLifecycleAnalysisRecalculation | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')

  const allowedStores = useMemo(() => uniqueStores(session.userStores, currentStore), [currentStore, session.userStores])

  useEffect(() => {
    if (!allowedStores.length) {
      setSelectedStoreKey('')
      return
    }
    const currentKey = storeKey(currentStore)
    const nextKey =
      currentKey && allowedStores.some((store) => storeKey(store) === currentKey) ? currentKey : storeKey(allowedStores[0])
    setSelectedStoreKey((previous) =>
      previous && allowedStores.some((store) => storeKey(store) === previous) ? previous : nextKey
    )
  }, [allowedStores, currentStore])

  const selectedStore = useMemo(
    () => allowedStores.find((store) => storeKey(store) === selectedStoreKey) || allowedStores[0] || null,
    [allowedStores, selectedStoreKey]
  )

  const query = useMemo<ProductLifecycleAnalysisQuery | null>(() => {
    if (!selectedStore?.storeCode) return null
    return {
      storeCode: selectedStore.storeCode,
      siteCode: selectedStore.site || siteCodeFromStoreCode(selectedStore.storeCode)
    }
  }, [selectedStore])

  const loadOverview = useCallback(async () => {
    if (!query) return
    setLoading(true)
    setErrorMessage('')
    try {
      setOverview(await fetchProductLifecycleAnalysisOverview(query))
    } catch (error) {
      setOverview(null)
      setErrorMessage(error instanceof Error ? error.message : '商品生命周期分析数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [query])

  const handleRecalculate = useCallback(async () => {
    if (!query) return
    setRecalculating(true)
    setErrorMessage('')
    try {
      const result = await recalculateProductLifecycleAnalysis(query)
      setRunStatus(result)
      await loadOverview()
    } catch (error) {
      setRunStatus(null)
      setErrorMessage(error instanceof Error ? error.message : '商品生命周期同步失败')
    } finally {
      setRecalculating(false)
    }
  }, [loadOverview, query])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  const rows = overview?.rows || []
  const summary = overview?.summary
  const normalizedSearchKeyword = searchKeyword.trim().toLowerCase()
  const filteredRows = useMemo(() => {
    if (!normalizedSearchKeyword) return rows
    return rows.filter((row) =>
      [
        row.partnerSku,
        row.productTitle,
        row.lifecycleLabel,
        row.analysisStateLabel,
        row.brand,
        row.productFulltype
      ].some((value) => includesKeyword(value, normalizedSearchKeyword))
    )
  }, [normalizedSearchKeyword, rows])

  const summaryText = `共 ${summary?.totalProductCount ?? 0} 个商品，可分析 ${summary?.readyProductCount ?? 0} 个，参数缺失 ${summary?.missingParameterProductCount ?? 0} 个，未来3个月预计变化 ${summary?.expectedLifecycleChangeProductCount ?? 0} 个`

  const columns = useMemo<TableColumnsType<ProductLifecycleAnalysisRow>>(
    () => [
      {
        title: '商品',
        dataIndex: 'partnerSku',
        width: 330,
        render: (_value, row) => {
          const imageUrl = normalizeNoonImageUrl(row.imageUrl)
          return (
            <Space align="start" size={10}>
              {imageUrl ? (
                <img
                  data-testid="product-lifecycle-image"
                  src={imageUrl}
                  alt={row.productTitle || row.partnerSku || '商品图片'}
                  referrerPolicy="no-referrer"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 6,
                    objectFit: 'cover',
                    background: '#f1f5f9',
                    flex: '0 0 auto'
                  }}
                />
              ) : (
                <span
                  aria-label="商品图片缺失"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 6,
                    display: 'grid',
                    placeItems: 'center',
                    background: '#e2e8f0',
                    color: '#475569',
                    fontWeight: 600,
                    flex: '0 0 auto'
                  }}
                >
                  {row.partnerSku?.slice(0, 1) || '-'}
                </span>
              )}
              <Space direction="vertical" size={2}>
                <Tooltip title={row.productTitle || row.partnerSku || '-'}>
                  <div
                    data-testid="product-lifecycle-title"
                    style={{
                      display: '-webkit-box',
                      width: 230,
                      overflow: 'hidden',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      whiteSpace: 'normal',
                      lineHeight: '20px',
                      fontWeight: 600,
                      color: '#0f172a'
                    }}
                  >
                    {row.productTitle || row.partnerSku || '-'}
                  </div>
                </Tooltip>
                <Text type="secondary">PSKU {row.partnerSku || '-'}</Text>
                {row.brand || row.productFulltype ? (
                  <Text type="secondary" style={{ maxWidth: 230 }} ellipsis={{ tooltip: true }}>
                    {[row.brand, row.productFulltype].filter(Boolean).join(' / ')}
                  </Text>
                ) : null}
              </Space>
            </Space>
          )
        }
      },
      {
        title: '未来3个月',
        dataIndex: 'projectionState',
        width: 260,
        render: (_value, row) => {
          if (row.projectionState !== 'ready') {
            const missingText = missingRequirementsText(row)
            return (
              <Space direction="vertical" size={4}>
                <Tag color="orange">无法计算</Tag>
                <Text>{projectionUnavailableMessage(row)}</Text>
                {missingText ? <Text type="secondary">{missingText}</Text> : null}
              </Space>
            )
          }
          const segments = timelineSegments(row)
          return (
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text>已处 {row.currentStageElapsedDays ?? '-'} 天</Text>
              <Text>剩余 {row.currentStageRemainingDays ?? '-'} 天</Text>
              <Text>下阶段 {row.nextLifecycleLabel || '-'}</Text>
              <Text type="secondary">变更日 {row.nextTransitionDate || '-'}</Text>
              {segments.length ? (
                <div
                  aria-label="未来3个月生命周期时间线"
                  style={{
                    display: 'flex',
                    height: 8,
                    width: '100%',
                    minWidth: 160,
                    maxWidth: 220,
                    overflow: 'hidden',
                    borderRadius: 4,
                    background: '#e5e7eb'
                  }}
                >
                  {segments.map((segment, index) => (
                    <span
                      key={`${segment.code || 'unknown'}-${index}`}
                      title={`${segment.label || segment.code || '-'} ${segment.count}天`}
                      style={{
                        flex: `${segment.count} 1 0`,
                        background: lifecycleColor(segment.code)
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </Space>
          )
        }
      },
      {
        title: '生命周期/状态',
        dataIndex: 'lifecycleLabel',
        width: 170,
        render: (value, row) => (
          <Space direction="vertical" size={4}>
            <Tag color={row.lifecycleCode === 'data_insufficient' ? 'default' : 'blue'}>{value || '-'}</Tag>
            <Tag color={row.analysisState === 'ready' ? 'green' : 'orange'}>{row.analysisStateLabel || row.analysisState || '-'}</Tag>
          </Space>
        )
      },
      {
        title: '库存/销量',
        dataIndex: 'currentStock',
        width: 170,
        render: (_value, row) => (
          <Space direction="vertical" size={2}>
            <Text>库存 {row.currentStock ?? '-'}</Text>
            <Text>近30天销量 {row.recent30DaySales ?? 0}</Text>
            <Text type="secondary">销量数据至 {row.latestFactDate || '-'}</Text>
          </Space>
        )
      },
      {
        title: '生命周期日期',
        dataIndex: 'analysisDate',
        width: 190,
        render: (_value, row) => (
          <Space direction="vertical" size={2}>
            <Text>分析日 {row.analysisDate || '-'}</Text>
            <Text type="secondary">{listingDateText(row)}</Text>
            <Text type="secondary">阶段起点 {row.currentStageStartDate || '-'}</Text>
          </Space>
        )
      }
    ],
    []
  )

  return (
    <div data-testid="product-lifecycle-analysis-page" style={{ display: 'grid', gap: 16 }}>
      <Space align="center" style={{ justifyContent: 'flex-end', width: '100%' }} wrap>
        <Button
          icon={<SyncOutlined />}
          onClick={() => void handleRecalculate()}
          loading={recalculating}
          disabled={!query}
        >
          同步生命周期
        </Button>
        <Select
          value={selectedStoreKey || undefined}
          style={{ minWidth: 240 }}
          placeholder="选择店铺"
          onChange={setSelectedStoreKey}
          options={allowedStores.map((store) => ({
            value: storeKey(store),
            label: `${store.projectName || store.projectCode || store.storeCode} / ${store.storeCode}`
          }))}
        />
      </Space>

      {errorMessage ? <Alert type="error" showIcon message={errorMessage} /> : null}
      {runStatus ? (
        <Alert
          type={runStatus.status === 'succeeded' ? 'success' : 'warning'}
          showIcon
          message={runStatus.message || '生命周期计算已执行。'}
          description={`已处理 ${runStatus.processedCount}，变化 ${runStatus.changedCount}，保持 ${runStatus.heldCount}，数据不足 ${runStatus.dataInsufficientCount}`}
        />
      ) : null}

      <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }} wrap>
        <Text data-testid="product-lifecycle-summary" type="secondary">
          {summaryText}
        </Text>
        <Search
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
          placeholder="搜索PSKU/标题/生命周期"
          allowClear
          style={{ width: 320 }}
        />
      </Space>

      <Card variant="borderless" style={{ boxShadow: 'none' }}>
        <Spin spinning={loading}>
          <Table<ProductLifecycleAnalysisRow>
            columns={columns}
            dataSource={filteredRows}
            rowKey={rowKey}
            pagination={false}
            scroll={{ x: 1130 }}
            onRow={() => ({ 'data-testid': 'product-lifecycle-analysis-row' } as HTMLAttributes<HTMLElement>)}
            locale={{
              emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无商品生命周期分析结果" />
            }}
          />
        </Spin>
      </Card>
    </div>
  )
}
