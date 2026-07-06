import { HistoryOutlined, InfoCircleOutlined, SearchOutlined } from '@ant-design/icons'
import { App, Button, Empty, Input, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuthSession } from '../auth/session'
import { fetchProductKeywords } from './api'
import { ProductKeywordDetailDrawer } from './ProductKeywordDetailDrawer'
import { ProductKeywordHistoryDrawer } from './ProductKeywordHistoryDrawer'
import type { ProductKeywordItem } from './types'
import './ProductKeywordDataPage.css'

const { Text } = Typography

type ProductKeywordDataPageProps = {
  session: AuthSession
}

function siteCodeFromStoreCode(storeCode?: string) {
  const normalized = (storeCode || '').toUpperCase()
  if (normalized.endsWith('-NSA') || normalized.endsWith('-SAU') || normalized.endsWith('-SA')) return 'SA'
  if (normalized.endsWith('-NAE') || normalized.endsWith('-UAE') || normalized.endsWith('-AE')) return 'AE'
  if (normalized.endsWith('-NEG') || normalized.endsWith('-EG')) return 'EG'
  return ''
}

function values(items?: string[] | null) {
  return (items || []).map((item) => String(item).trim().toUpperCase()).filter(Boolean)
}

function normalizeKeywordDisplay(value?: string | null) {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function shouldShowKeywordNorm(row: ProductKeywordItem) {
  const normalizedKeyword = normalizeKeywordDisplay(row.keyword)
  const normalizedKeywordNorm = normalizeKeywordDisplay(row.keywordNorm)
  return Boolean(normalizedKeywordNorm && normalizedKeyword !== normalizedKeywordNorm)
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

export function ProductKeywordDataPage({ session }: ProductKeywordDataPageProps) {
  const { message } = App.useApp()
  const [partnerSku, setPartnerSku] = useState('')
  const [keywordSearch, setKeywordSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<ProductKeywordItem[]>([])
  const [selectedDetailKeyword, setSelectedDetailKeyword] = useState<ProductKeywordItem | null>(null)
  const [selectedHistoryKeyword, setSelectedHistoryKeyword] = useState<ProductKeywordItem | null>(null)

  const selectedStore = session.currentStore
  const selectedSiteCode = selectedStore?.site || siteCodeFromStoreCode(selectedStore?.storeCode)

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
        limit: 5000
      })
      setRows(payload.items || [])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '关键词数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [keywordSearch, message, partnerSku, selectedSiteCode, selectedStore?.storeCode])

  useEffect(() => {
    void loadKeywords()
  }, [loadKeywords])

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
          {shouldShowKeywordNorm(row) ? <Text type="secondary">{row.keywordNorm}</Text> : null}
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
      title: '操作',
      width: 130,
      render: (_, row) => (
        <Space size={10}>
          <Button
            type="link"
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={(event) => {
              event.stopPropagation()
              setSelectedDetailKeyword(row)
            }}
            style={{ height: 22, padding: 0 }}
          >详情</Button>
          <Button
            type="link"
            size="small"
            icon={<HistoryOutlined />}
            onClick={(event) => {
              event.stopPropagation()
              setSelectedHistoryKeyword(row)
            }}
            style={{ height: 22, padding: 0 }}
          >历史</Button>
        </Space>
      )
    }
  ], [])

  return (
    <section className="product-keyword-page" data-testid="product-keyword-data-page">
      <div className="product-keyword-filter-bar">
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

      <ProductKeywordDetailDrawer
        open={Boolean(selectedDetailKeyword)}
        onClose={() => setSelectedDetailKeyword(null)}
        keyword={selectedDetailKeyword}
      />

      <ProductKeywordHistoryDrawer
        open={Boolean(selectedHistoryKeyword)}
        onClose={() => setSelectedHistoryKeyword(null)}
        storeCode={selectedHistoryKeyword?.storeCode}
        siteCode={selectedHistoryKeyword?.siteCode}
        partnerSku={selectedHistoryKeyword?.partnerSku}
        keywordNorm={selectedHistoryKeyword?.keywordNorm}
        title={selectedHistoryKeyword ? `关键词历史：${selectedHistoryKeyword.keyword}` : '关键词历史'}
      />
    </section>
  )
}
