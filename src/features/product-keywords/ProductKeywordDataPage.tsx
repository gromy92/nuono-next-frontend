import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { App, Button, Empty, Input, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuthSession, AuthSessionStore } from '../auth/session'
import { fetchProductKeywords } from './api'
import type { ProductKeywordItem, ProductKeywordStatus } from './types'
import './ProductKeywordDataPage.css'

const { Text } = Typography

type ProductKeywordDataPageProps = {
  session: AuthSession
}

type StatusFilter = 'ALL' | ProductKeywordStatus

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: '全部状态', value: 'ALL' },
  { label: '已启用', value: 'ACTIVE' },
  { label: '候选', value: 'OBSERVED' },
  { label: '暂停', value: 'PAUSED' },
  { label: '归档', value: 'ARCHIVED' }
]

function siteCodeFromStoreCode(storeCode?: string) {
  const normalized = (storeCode || '').toUpperCase()
  if (normalized.endsWith('-NSA') || normalized.endsWith('-SAU') || normalized.endsWith('-SA')) return 'SA'
  if (normalized.endsWith('-NAE') || normalized.endsWith('-UAE') || normalized.endsWith('-AE')) return 'AE'
  if (normalized.endsWith('-NEG') || normalized.endsWith('-EG')) return 'EG'
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
  addStore(currentStore)
  ;(stores || []).forEach(addStore)
  return result
}

function storeLabel(store: AuthSessionStore) {
  const siteCode = store.site || siteCodeFromStoreCode(store.storeCode)
  const name = store.projectName || store.projectCode || store.orgName || store.storeCode
  return `${name} / ${store.storeCode}${siteCode ? ` / ${siteCode}` : ''}`
}

function parseTags(tagsJson?: string | null) {
  if (!tagsJson) return [] as string[]
  try {
    const parsed = JSON.parse(tagsJson)
    return Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : []
  } catch {
    return tagsJson
      .replace(/[[\]"']/g, '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
}

function statusColor(status?: string) {
  const normalized = (status || '').toUpperCase()
  if (normalized === 'ACTIVE') return 'green'
  if (normalized === 'OBSERVED') return 'blue'
  if (normalized === 'PAUSED') return 'orange'
  if (normalized === 'ARCHIVED') return 'default'
  return 'default'
}

function tagColor(tag: string) {
  const normalized = tag.toUpperCase()
  if (normalized === 'CORE' || normalized === 'TITLE_TARGET') return 'green'
  if (normalized === 'COMPETITOR_TRACK') return 'geekblue'
  if (normalized === 'ADS_QUERY') return 'purple'
  if (normalized === 'NEGATIVE_CANDIDATE') return 'red'
  return 'default'
}

function titleCoverage(tags: string[]) {
  if (tags.includes('CORE') || tags.includes('TITLE_TARGET')) {
    return { state: 'titleTarget', label: '标题目标', color: 'green' }
  }
  return { state: 'notTitleTarget', label: '未纳入标题', color: 'default' }
}

function competitorState(tags: string[]) {
  if (tags.includes('COMPETITOR_TRACK')) {
    return { state: 'competitorEvidence', label: '竞品证据', color: 'geekblue' }
  }
  return { state: 'noCompetitorEvidence', label: '无竞品证据', color: 'default' }
}

function adsState(tags: string[]) {
  if (tags.includes('NEGATIVE_CANDIDATE')) {
    return { state: 'adsEvidence', label: '高花费无单', color: 'red' }
  }
  if (tags.includes('ADS_QUERY')) {
    return { state: 'adsEvidence', label: '广告证据', color: 'purple' }
  }
  return { state: 'noAdsEvidence', label: '无广告证据', color: 'default' }
}

function suggestedAction(row: ProductKeywordItem, tags: string[]) {
  if (row.status === 'OBSERVED' && tags.includes('NEGATIVE_CANDIDATE')) return '评估否词或暂停'
  if (row.status === 'OBSERVED' && tags.includes('ADS_QUERY')) return '评估转核心词'
  if (row.status === 'OBSERVED' && tags.includes('COMPETITOR_TRACK')) return '评估加入标题'
  if (row.status === 'ACTIVE' && (tags.includes('CORE') || tags.includes('TITLE_TARGET'))) return '持续观察标题覆盖'
  return '人工复核'
}

export function ProductKeywordDataPage({ session }: ProductKeywordDataPageProps) {
  const { message } = App.useApp()
  const stores = useMemo(() => uniqueStores(session.userStores, session.currentStore), [session.currentStore, session.userStores])
  const [selectedStoreKey, setSelectedStoreKey] = useState(() => storeKey(session.currentStore) || storeKey(stores[0]) || '')
  const [partnerSku, setPartnerSku] = useState('')
  const [keywordSearch, setKeywordSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<ProductKeywordItem[]>([])

  const selectedStore = useMemo(
    () => stores.find((store) => storeKey(store) === selectedStoreKey) || stores[0] || null,
    [selectedStoreKey, stores]
  )
  const selectedSiteCode = selectedStore?.site || siteCodeFromStoreCode(selectedStore?.storeCode)

  useEffect(() => {
    if (!stores.length) return
    if (!selectedStoreKey || !stores.some((store) => storeKey(store) === selectedStoreKey)) {
      setSelectedStoreKey(storeKey(stores[0]))
    }
  }, [selectedStoreKey, stores])

  const loadKeywords = useCallback(async () => {
    if (!selectedStore?.storeCode || !selectedSiteCode) {
      setRows([])
      return
    }
    setLoading(true)
    try {
      const payload = await fetchProductKeywords({
        storeCode: selectedStore.storeCode,
        siteCode: selectedSiteCode,
        partnerSku: partnerSku.trim() || undefined,
        keywordNorm: keywordSearch.trim() || undefined,
        status: status === 'ALL' ? undefined : status,
        limit: 300
      })
      setRows(payload.items || [])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '关键词数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [keywordSearch, message, partnerSku, selectedSiteCode, selectedStore?.storeCode, status])

  useEffect(() => {
    void loadKeywords()
  }, [loadKeywords])

  const summary = useMemo(() => {
    return {
      total: rows.length,
      active: rows.filter((row) => row.status === 'ACTIVE').length,
      observed: rows.filter((row) => row.status === 'OBSERVED').length
    }
  }, [rows])

  const columns = useMemo<ColumnsType<ProductKeywordItem>>(() => [
    {
      title: '商品',
      dataIndex: 'partnerSku',
      width: 220,
      render: (_, row) => (
        <div className="product-keyword-cell-stack">
          <Text strong copyable>{row.partnerSku}</Text>
          <Text type="secondary">{row.storeCode} / {row.siteCode}</Text>
        </div>
      )
    },
    {
      title: '关键词',
      dataIndex: 'keyword',
      width: 220,
      render: (_, row) => (
        <div className="product-keyword-cell-stack">
          <Text strong>{row.keyword}</Text>
          <Text type="secondary">{row.keywordNorm}</Text>
        </div>
      )
    },
    {
      title: '状态 / 标签',
      width: 240,
      render: (_, row) => {
        const tags = parseTags(row.intentTagsJson)
        return (
          <Space size={[4, 4]} wrap>
            <Tag color={statusColor(row.status)}>{row.status}</Tag>
            {tags.map((tag) => <Tag key={tag} color={tagColor(tag)}>{tag}</Tag>)}
          </Space>
        )
      }
    },
    {
      title: '标题覆盖',
      width: 130,
      render: (_, row) => {
        const state = titleCoverage(parseTags(row.intentTagsJson))
        return <Tag color={state.color}>{state.label}</Tag>
      }
    },
    {
      title: '竞品',
      width: 130,
      render: (_, row) => {
        const state = competitorState(parseTags(row.intentTagsJson))
        return <Tag color={state.color}>{state.label}</Tag>
      }
    },
    {
      title: '广告',
      width: 130,
      render: (_, row) => {
        const state = adsState(parseTags(row.intentTagsJson))
        return <Tag color={state.color}>{state.label}</Tag>
      }
    },
    {
      title: '最近出现',
      dataIndex: 'lastSeenAt',
      width: 180,
      render: (value?: string | null) => value ? <Text>{value.replace('T', ' ')}</Text> : <Text type="secondary">-</Text>
    },
    {
      title: '建议动作',
      width: 170,
      render: (_, row) => <Text>{suggestedAction(row, parseTags(row.intentTagsJson))}</Text>
    }
  ], [])

  return (
    <section className="product-keyword-page" data-testid="product-keyword-data-page">
      <div className="product-keyword-header">
        <div>
          <Typography.Title level={4}>关键词数据</Typography.Title>
          <Text type="secondary">标题、竞品、广告证据统一查看</Text>
        </div>
        <Space size={8}>
          <Tag color="green">ACTIVE {summary.active}</Tag>
          <Tag color="blue">OBSERVED {summary.observed}</Tag>
          <Tag>全部 {summary.total}</Tag>
          <Button
            aria-label="刷新关键词数据"
            title="刷新关键词数据"
            icon={<ReloadOutlined />}
            onClick={() => void loadKeywords()}
            loading={loading}
          />
        </Space>
      </div>

      <div className="product-keyword-filter-bar">
        <Select
          data-testid="product-keyword-store-filter"
          className="product-keyword-store-select"
          value={selectedStoreKey}
          onChange={setSelectedStoreKey}
          options={stores.map((store) => ({ label: storeLabel(store), value: storeKey(store) }))}
          placeholder="选择店铺"
        />
        <Input
          className="product-keyword-filter-input"
          value={partnerSku}
          onChange={(event) => setPartnerSku(event.target.value)}
          placeholder="PSKU"
          allowClear
        />
        <Input
          className="product-keyword-filter-input"
          value={keywordSearch}
          onChange={(event) => setKeywordSearch(event.target.value)}
          prefix={<SearchOutlined />}
          placeholder="关键词"
          allowClear
        />
        <Select
          data-testid="product-keyword-status-filter"
          className="product-keyword-status-select"
          value={status}
          onChange={setStatus}
          options={statusOptions}
        />
      </div>

      <Table<ProductKeywordItem>
        data-testid="product-keyword-table"
        className="product-keyword-table"
        rowKey={(row) => String(row.id)}
        columns={columns}
        dataSource={rows}
        loading={loading}
        size="small"
        pagination={{ pageSize: 50, showSizeChanger: false }}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无关键词数据" /> }}
        scroll={{ x: 1400 }}
      />
    </section>
  )
}
