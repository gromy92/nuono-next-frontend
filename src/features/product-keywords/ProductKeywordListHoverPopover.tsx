import { TagsOutlined } from '@ant-design/icons'
import { Button, Empty, Popover, Space, Spin, Tag, Typography } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchProductKeywordProduct } from './api'
import type { ProductKeywordEventItem, ProductKeywordItem, ProductKeywordPanelView } from './types'
import './ProductKeywordListHoverPopover.css'

const { Text } = Typography

type ProductKeywordListHoverPopoverProps = {
  storeCode?: string
  siteCode?: string
  partnerSku?: string
}

function values(items?: string[] | null) {
  return (items || []).map((item) => String(item).trim().toUpperCase()).filter(Boolean)
}

function keywordStatusLabel(status: string) {
  const normalized = status.toUpperCase()
  if (normalized === 'ACTIVE') return '已启用'
  if (normalized === 'OBSERVED') return '候选词'
  if (normalized === 'PAUSED') return '已暂停'
  if (normalized === 'ARCHIVED') return '已归档'
  return '其他状态'
}

function keywordStatusColor(status: string) {
  const normalized = status.toUpperCase()
  if (normalized === 'ACTIVE') return 'green'
  if (normalized === 'PAUSED') return 'orange'
  if (normalized === 'ARCHIVED') return 'default'
  return 'blue'
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

function sourceLabel(event: ProductKeywordEventItem) {
  if (event.sourceType === 'TITLE_HISTORY') return '标题使用'
  if (event.sourceType === 'COMPETITOR_KEYWORD') return '竞品出现'
  if (event.sourceType === 'ADS_QUERY') return '广告搜索'
  if (event.sourceType === 'MANUAL') return '手动维护'
  return '其他来源'
}

function keywordChip(keyword: ProductKeywordItem) {
  const titleTypes = values(keyword.titleTypes)
  const titleUsageStates = values(keyword.titleUsageStates)
  return (
    <div key={keyword.id} className="product-keyword-hover-chip">
      <Text strong>{keyword.keyword}</Text>
      <Space size={[4, 4]} wrap>
        <Tag color={keywordStatusColor(keyword.status)}>{keywordStatusLabel(keyword.status)}</Tag>
        {titleTypes.slice(0, 3).map((type) => <Tag key={type} color={titleTypeColor(type)}>{titleTypeLabel(type)}</Tag>)}
        {titleUsageStates.slice(0, 2).map((state) => <Tag key={state} color={titleUsageStateColor(state)}>{titleUsageStateLabel(state)}</Tag>)}
        {keyword.competitorEvidence ? <Tag color="geekblue">有竞品证据</Tag> : null}
        {keyword.negativeCandidate ? <Tag color="red">否词候选</Tag> : keyword.adsEvidence ? <Tag color="purple">有广告证据</Tag> : null}
      </Space>
    </div>
  )
}

function ProductKeywordHoverContent({
  errorMessage,
  loading,
  panel
}: {
  errorMessage?: string
  loading: boolean
  panel: ProductKeywordPanelView | null
}) {
  const keywords = panel?.keywords || []
  const events = panel?.events || []

  if (loading && !panel) {
    return <div className="product-keyword-hover-loading"><Spin size="small" /> <Text type="secondary">加载关键词...</Text></div>
  }
  if (errorMessage) {
    return <Text type="danger">{errorMessage}</Text>
  }
  if (!keywords.length && !events.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无关键词数据" />
  }
  return (
    <div className="product-keyword-hover-content">
      <div className="product-keyword-hover-section">
        <Text strong>当前关键词资产</Text>
        <div className="product-keyword-hover-keywords">
          {keywords.slice(0, 6).map(keywordChip)}
        </div>
      </div>
      {events.length ? (
        <div className="product-keyword-hover-section">
          <Text strong>最近使用记录</Text>
          <div className="product-keyword-hover-events">
            {events.slice(0, 5).map((event) => (
              <div key={event.id} className="product-keyword-hover-event">
                <Tag>{sourceLabel(event)}</Tag>
                <Text>{event.keyword}</Text>
                <Text type="secondary">{event.occurredAt?.replace('T', ' ')}</Text>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function ProductKeywordListHoverPopover({ storeCode, siteCode, partnerSku }: ProductKeywordListHoverPopoverProps) {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<ProductKeywordPanelView | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const requestSeqRef = useRef(0)

  const canLoad = Boolean(storeCode && siteCode && partnerSku)

  useEffect(() => {
    requestSeqRef.current += 1
    setOpen(false)
    setPanel(null)
    setLoading(false)
    setErrorMessage(undefined)
    return () => {
      requestSeqRef.current += 1
    }
  }, [partnerSku, siteCode, storeCode])

  const loadPanel = useCallback(async () => {
    if (!storeCode || !siteCode || !partnerSku || loading) return
    const requestSeq = requestSeqRef.current + 1
    requestSeqRef.current = requestSeq
    setLoading(true)
    setErrorMessage(undefined)
    try {
      const nextPanel = await fetchProductKeywordProduct(partnerSku, { storeCode, siteCode })
      if (requestSeqRef.current === requestSeq) {
        setPanel(nextPanel)
      }
    } catch (error) {
      if (requestSeqRef.current === requestSeq) {
        setPanel(null)
        setErrorMessage(error instanceof Error ? error.message : '关键词加载失败')
      }
    } finally {
      if (requestSeqRef.current === requestSeq) {
        setLoading(false)
      }
    }
  }, [loading, partnerSku, siteCode, storeCode])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen && canLoad && !panel) {
      void loadPanel()
    }
  }

  const label = '关键词'

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
      trigger={['hover', 'focus']}
      placement="bottomLeft"
      title="关键词"
      content={canLoad
        ? <ProductKeywordHoverContent errorMessage={errorMessage} loading={loading} panel={panel} />
        : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="缺少 PSKU 或站点" />}
    >
      <Button
        data-testid="product-keyword-list-hover"
        type="link"
        size="small"
        icon={<TagsOutlined />}
        disabled={!canLoad}
        onClick={(event) => event.stopPropagation()}
        style={{ height: 20, padding: 0, fontSize: 12 }}
      >
        {label}
      </Button>
    </Popover>
  )
}
