import { TagsOutlined } from '@ant-design/icons'
import { Button, Empty, Popover, Space, Spin, Tag, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchProductKeywordProduct } from './api'
import type { ProductKeywordEventItem, ProductKeywordItem, ProductKeywordPanelView } from './types'
import './ProductKeywordListHoverPopover.css'

const { Text } = Typography

type ProductKeywordListHoverPopoverProps = {
  storeCode?: string
  siteCode?: string
  partnerSku?: string
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

function tagColor(tag: string) {
  const normalized = tag.toUpperCase()
  if (normalized === 'CORE' || normalized === 'TITLE_TARGET') return 'green'
  if (normalized === 'COMPETITOR_TRACK') return 'geekblue'
  if (normalized === 'ADS_QUERY') return 'purple'
  if (normalized === 'NEGATIVE_CANDIDATE') return 'red'
  return 'default'
}

function keywordStatusLabel(status: string) {
  const normalized = status.toUpperCase()
  if (normalized === 'ACTIVE') return '已启用'
  if (normalized === 'OBSERVED') return '观察中'
  if (normalized === 'CANDIDATE') return '候选词'
  if (normalized === 'INACTIVE') return '已停用'
  if (normalized === 'ARCHIVED') return '已归档'
  return '其他状态'
}

function keywordIntentLabel(tag: string) {
  const normalized = tag.toUpperCase()
  if (normalized === 'CORE') return '核心词'
  if (normalized === 'TITLE_TARGET') return '标题目标词'
  if (normalized === 'COMPETITOR_TRACK') return '竞品跟踪词'
  if (normalized === 'ADS_QUERY') return '广告搜索词'
  if (normalized === 'NEGATIVE_CANDIDATE') return '否词候选'
  return '其他用途'
}

function keywordStatusColor(status: string) {
  const normalized = status.toUpperCase()
  if (normalized === 'ACTIVE') return 'green'
  if (normalized === 'INACTIVE' || normalized === 'ARCHIVED') return 'default'
  return 'blue'
}

function sourceLabel(event: ProductKeywordEventItem) {
  if (event.sourceType === 'TITLE_HISTORY') return '标题使用'
  if (event.sourceType === 'COMPETITOR_KEYWORD') return '竞品出现'
  if (event.sourceType === 'ADS_QUERY') return '广告搜索'
  if (event.sourceType === 'MANUAL') return '手动维护'
  return '其他来源'
}

function keywordChip(keyword: ProductKeywordItem) {
  const tags = parseTags(keyword.intentTagsJson)
  return (
    <div key={keyword.id} className="product-keyword-hover-chip">
      <Text strong>{keyword.keyword}</Text>
      <Space size={[4, 4]} wrap>
        <Tag color={keywordStatusColor(keyword.status)}>{keywordStatusLabel(keyword.status)}</Tag>
        {tags.slice(0, 3).map((tag) => <Tag key={tag} color={tagColor(tag)}>{keywordIntentLabel(tag)}</Tag>)}
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
  const counts = useMemo(() => ({
    title: events.filter((event) => event.sourceType === 'TITLE_HISTORY').length,
    competitor: events.filter((event) => event.sourceType === 'COMPETITOR_KEYWORD').length,
    ads: events.filter((event) => event.sourceType === 'ADS_QUERY').length
  }), [events])

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
      <Space size={[6, 6]} wrap>
        <Tag color={counts.title ? 'green' : 'default'}>标题使用 {counts.title}</Tag>
        <Tag color={counts.competitor ? 'geekblue' : 'default'}>竞品证据 {counts.competitor}</Tag>
        <Tag color={counts.ads ? 'purple' : 'default'}>广告搜索 {counts.ads}</Tag>
      </Space>
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
