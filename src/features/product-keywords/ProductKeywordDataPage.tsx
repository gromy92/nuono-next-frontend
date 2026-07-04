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
  { label: '已纳入词库', value: 'ACTIVE' },
  { label: '待确认候选', value: 'OBSERVED' },
  { label: '已暂停', value: 'PAUSED' },
  { label: '已归档', value: 'ARCHIVED' }
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

function statusColor(status?: string) {
  const normalized = (status || '').toUpperCase()
  if (normalized === 'ACTIVE') return 'green'
  if (normalized === 'OBSERVED') return 'blue'
  if (normalized === 'PAUSED') return 'orange'
  if (normalized === 'ARCHIVED') return 'default'
  return 'default'
}

function statusLabel(status?: string) {
  const normalized = (status || '').toUpperCase()
  if (normalized === 'ACTIVE') return '已纳入词库'
  if (normalized === 'OBSERVED') return '待确认候选'
  if (normalized === 'PAUSED') return '已暂停'
  if (normalized === 'ARCHIVED') return '已归档'
  return '未知状态'
}

function values(items?: string[] | null) {
  return (items || []).map((item) => String(item).trim().toUpperCase()).filter(Boolean)
}

function titleTypeLabel(type: string) {
  const normalized = type.toUpperCase()
  if (normalized === 'CORE') return '核心词'
  if (normalized === 'ATTRIBUTE') return '属性词'
  if (normalized === 'SCENE') return '场景词'
  if (normalized === 'AUDIENCE') return '人群词'
  if (normalized === 'SPEC') return '规格词'
  if (normalized === 'TRENDING') return '流行词'
  return '标题词'
}

function titleTypeColor(type: string) {
  const normalized = type.toUpperCase()
  if (normalized === 'CORE') return 'green'
  if (normalized === 'TRENDING') return 'orange'
  if (normalized === 'ATTRIBUTE') return 'blue'
  if (normalized === 'SCENE') return 'magenta'
  if (normalized === 'AUDIENCE') return 'purple'
  if (normalized === 'SPEC') return 'geekblue'
  return 'default'
}

function titleUsageStateLabel(state: string) {
  const normalized = state.toUpperCase()
  if (normalized === 'TITLE_TARGET') return '标题目标'
  if (normalized === 'TITLE_COVERED') return '当前已覆盖'
  if (normalized === 'TITLE_MISSING') return '当前未覆盖'
  if (normalized === 'TITLE_REMOVED') return '已从标题移除'
  if (normalized === 'TITLE_NOT_FIT') return '不适合标题'
  return '标题状态'
}

function titleUsageStateColor(state: string) {
  const normalized = state.toUpperCase()
  if (normalized === 'TITLE_TARGET' || normalized === 'TITLE_COVERED') return 'green'
  if (normalized === 'TITLE_MISSING') return 'orange'
  if (normalized === 'TITLE_REMOVED' || normalized === 'TITLE_NOT_FIT') return 'red'
  return 'default'
}

function competitorEvidenceState(row: ProductKeywordItem) {
  return row.competitorEvidence
    ? { label: '有竞品证据', color: 'geekblue' }
    : { label: '无竞品证据', color: 'default' }
}

function adsEvidenceState(row: ProductKeywordItem) {
  if (row.negativeCandidate) return { label: '否词候选', color: 'red' }
  return row.adsEvidence
    ? { label: '有广告证据', color: 'purple' }
    : { label: '无广告证据', color: 'default' }
}

function titleDimensionItems(row: ProductKeywordItem) {
  return {
    types: values(row.titleTypes),
    states: values(row.titleUsageStates)
  }
}

function suggestedAction(row: ProductKeywordItem) {
  const titleStates = values(row.titleUsageStates)
  const titleTypes = values(row.titleTypes)
  if (row.negativeCandidate) return '评估否词或暂停'
  if (titleStates.includes('TITLE_MISSING')) return '补充标题覆盖'
  if (titleStates.includes('TITLE_COVERED')) return '持续观察标题覆盖'
  if (row.competitorEvidence && titleTypes.length === 0) return '人工判断是否加入标题'
  if (row.adsEvidence && row.status === 'OBSERVED') return '人工复核广告价值'
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
          <Space size={[4, 4]} wrap>
            <Tag color={statusColor(row.status)}>{statusLabel(row.status)}</Tag>
            <Text type="secondary">{row.keywordNorm}</Text>
          </Space>
        </div>
      )
    },
    {
      title: '标题',
      width: 260,
      render: (_, row) => {
        const { types, states } = titleDimensionItems(row)
        return (
          <Space size={[4, 4]} wrap>
            {types.map((type) => <Tag key={type} color={titleTypeColor(type)}>{titleTypeLabel(type)}</Tag>)}
            {states.map((state) => <Tag key={state} color={titleUsageStateColor(state)}>{titleUsageStateLabel(state)}</Tag>)}
            {!types.length && !states.length ? <Tag>未设置标题类型</Tag> : null}
          </Space>
        )
      }
    },
    {
      title: '竞品',
      width: 130,
      render: (_, row) => {
        const state = competitorEvidenceState(row)
        return <Tag color={state.color}>{state.label}</Tag>
      }
    },
    {
      title: '广告',
      width: 130,
      render: (_, row) => {
        const state = adsEvidenceState(row)
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
      render: (_, row) => <Text>{suggestedAction(row)}</Text>
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
          <Tag color="green">已纳入词库 {summary.active}</Tag>
          <Tag color="blue">待确认候选 {summary.observed}</Tag>
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
