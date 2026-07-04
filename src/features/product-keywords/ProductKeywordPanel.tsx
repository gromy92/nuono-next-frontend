import { ReloadOutlined } from '@ant-design/icons'
import { App, Button, Empty, Space, Tag, Timeline, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchProductKeywordProduct } from './api'
import type { ProductKeywordEventItem, ProductKeywordItem, ProductKeywordPanelView } from './types'
import './ProductKeywordPanel.css'

const { Text } = Typography

type ProductKeywordPanelProps = {
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

function titleTarget(keyword: ProductKeywordItem) {
  const tags = parseTags(keyword.intentTagsJson)
  return tags.includes('CORE') || tags.includes('TITLE_TARGET')
}

function competitorEvidence(event: ProductKeywordEventItem) {
  return event.sourceType === 'COMPETITOR_KEYWORD'
}

function adsEvidence(event: ProductKeywordEventItem) {
  return event.sourceType === 'ADS_QUERY'
}

function eventLabel(event: ProductKeywordEventItem) {
  if (event.sourceType === 'TITLE_HISTORY') return '标题'
  if (event.sourceType === 'COMPETITOR_KEYWORD') return '竞品'
  if (event.sourceType === 'ADS_QUERY') return '广告'
  return event.sourceType
}

function keywordLine(keyword: ProductKeywordItem) {
  const tags = parseTags(keyword.intentTagsJson)
  return (
    <div key={keyword.id} className="product-keyword-panel-line">
      <div>
        <Text strong>{keyword.keyword}</Text>
        <Text type="secondary"> {keyword.status}</Text>
      </div>
      <Space size={[4, 4]} wrap>
        {tags.map((tag) => <Tag key={tag} color={tagColor(tag)}>{tag}</Tag>)}
      </Space>
    </div>
  )
}

export function ProductKeywordPanel({ storeCode, siteCode, partnerSku }: ProductKeywordPanelProps) {
  const { message } = App.useApp()
  const [panel, setPanel] = useState<ProductKeywordPanelView | null>(null)
  const [loading, setLoading] = useState(false)

  const canLoad = Boolean(storeCode && siteCode && partnerSku)
  const loadPanel = useCallback(async () => {
    if (!storeCode || !siteCode || !partnerSku) {
      setPanel(null)
      return
    }
    setLoading(true)
    try {
      setPanel(await fetchProductKeywordProduct(partnerSku, { storeCode, siteCode }))
    } catch (error) {
      setPanel(null)
      message.warning(error instanceof Error ? error.message : '商品关键词加载失败')
    } finally {
      setLoading(false)
    }
  }, [message, partnerSku, siteCode, storeCode])

  useEffect(() => {
    void loadPanel()
  }, [loadPanel])

  const keywords = panel?.keywords || []
  const events = panel?.events || []
  const titleKeywords = useMemo(() => keywords.filter(titleTarget), [keywords])
  const competitorEvents = useMemo(() => events.filter(competitorEvidence), [events])
  const adsEvents = useMemo(() => events.filter(adsEvidence), [events])
  const timeline = useMemo(() => events.slice(0, 8), [events])

  return (
    <section className="product-keyword-panel" data-testid="product-keyword-panel">
      <div className="product-keyword-panel-header">
        <div>
          <Text strong>关键词</Text>
          <Text type="secondary"> {partnerSku || '未选择商品'}</Text>
        </div>
        <Button
          aria-label="刷新商品关键词"
          title="刷新商品关键词"
          icon={<ReloadOutlined />}
          size="small"
          onClick={() => void loadPanel()}
          loading={loading}
          disabled={!canLoad}
        />
      </div>
      {!canLoad ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前商品缺少 PSKU 或站点信息" />
      ) : (
        <div className="product-keyword-panel-grid">
          <div className="product-keyword-panel-section">
            <Text strong>关键词资产</Text>
            <div className="product-keyword-panel-list">
              {keywords.length ? keywords.slice(0, 6).map(keywordLine) : <Text type="secondary">暂无关键词资产</Text>}
            </div>
          </div>
          <div className="product-keyword-panel-section">
            <Text strong>标题覆盖</Text>
            <div className="product-keyword-panel-list">
              {titleKeywords.length ? titleKeywords.slice(0, 4).map(keywordLine) : <Text type="secondary">暂无标题目标词</Text>}
            </div>
          </div>
          <div className="product-keyword-panel-section">
            <Text strong>竞品证据</Text>
            <Text type="secondary" className="product-keyword-panel-count">已串联 {competitorEvents.length} 条</Text>
          </div>
          <div className="product-keyword-panel-section">
            <Text strong>广告证据</Text>
            <Text type="secondary" className="product-keyword-panel-count">已串联 {adsEvents.length} 条</Text>
          </div>
          <div className="product-keyword-panel-section product-keyword-panel-timeline">
            <Text strong>历史时间线</Text>
            {timeline.length ? (
              <Timeline
                className="product-keyword-panel-timeline-list"
                items={timeline.map((event) => ({
                  children: (
                    <span>
                      <Tag>{eventLabel(event)}</Tag>
                      <Text>{event.keyword}</Text>
                      <Text type="secondary"> {event.occurredAt?.replace('T', ' ')}</Text>
                    </span>
                  )
                }))}
              />
            ) : (
              <Text type="secondary">暂无历史记录</Text>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
