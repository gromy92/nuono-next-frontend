import { ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Empty, Space, Spin, Tag, Timeline, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchProductKeywordProduct } from './api'
import type { ProductKeywordEventItem, ProductKeywordPanelView } from './types'
import './ProductKeywordHistorySection.css'

const { Text } = Typography

type ProductKeywordHistorySectionProps = {
  storeCode?: string
  siteCode?: string
  partnerSku?: string
  keywordNorm?: string
  maxEvents?: number
}

function sourceLabel(sourceType?: string | null) {
  if (sourceType === 'TITLE_HISTORY') return '标题使用'
  if (sourceType === 'COMPETITOR_KEYWORD') return '竞品出现'
  if (sourceType === 'ADS_QUERY') return '广告搜索'
  if (sourceType === 'MANUAL') return '手动维护'
  return '其他来源'
}

function sourceColor(sourceType?: string | null) {
  if (sourceType === 'TITLE_HISTORY') return 'green'
  if (sourceType === 'COMPETITOR_KEYWORD') return 'geekblue'
  if (sourceType === 'ADS_QUERY') return 'purple'
  if (sourceType === 'MANUAL') return 'default'
  return 'default'
}

function formatEventTime(value?: string | null) {
  return value ? value.replace('T', ' ') : ''
}

function normalizeHistoryKeyword(value?: string | null) {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function sourceCount(events: ProductKeywordEventItem[], sourceType: string) {
  return events.filter((event) => event.sourceType === sourceType).length
}

function historyEventLine(event: ProductKeywordEventItem) {
  const time = formatEventTime(event.occurredAt)
  return (
    <div className="product-keyword-history-event">
      <Space size={[6, 4]} wrap>
        <Tag color={sourceColor(event.sourceType)} style={{ marginInlineEnd: 0 }}>
          {sourceLabel(event.sourceType)}
        </Tag>
        <Text strong>{event.keyword}</Text>
      </Space>
      {time ? <Text type="secondary">{time}</Text> : null}
    </div>
  )
}

export function ProductKeywordHistorySection({
  storeCode,
  siteCode,
  partnerSku,
  keywordNorm,
  maxEvents
}: ProductKeywordHistorySectionProps) {
  const [panel, setPanel] = useState<ProductKeywordPanelView | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const canLoad = Boolean(storeCode && siteCode && partnerSku)

  const loadHistory = useCallback(async () => {
    if (!storeCode || !siteCode || !partnerSku) {
      setPanel(null)
      setErrorMessage(undefined)
      return
    }
    setLoading(true)
    setErrorMessage(undefined)
    try {
      setPanel(await fetchProductKeywordProduct(partnerSku, { storeCode, siteCode }))
    } catch (error) {
      setPanel(null)
      setErrorMessage(error instanceof Error ? error.message : '关键词历史加载失败')
    } finally {
      setLoading(false)
    }
  }, [partnerSku, siteCode, storeCode])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const events = panel?.events || []
  const normalizedTargetKeyword = useMemo(() => normalizeHistoryKeyword(keywordNorm), [keywordNorm])
  const scopedEvents = useMemo(
    () => normalizedTargetKeyword
      ? events.filter((event) => normalizeHistoryKeyword(event.keywordNorm || event.keyword) === normalizedTargetKeyword)
      : events,
    [events, normalizedTargetKeyword]
  )
  const visibleEvents = useMemo(
    () => scopedEvents.slice(0, maxEvents || scopedEvents.length),
    [scopedEvents, maxEvents]
  )

  return (
    <section className="product-keyword-history-section" data-testid="product-keyword-history-section">
      <div className="product-keyword-history-header">
        <div>
          <Text strong>关键词使用历史</Text>
          <Text type="secondary"> 标题、竞品、广告记录</Text>
        </div>
        <Button
          aria-label="刷新关键词历史"
          title="刷新关键词历史"
          icon={<ReloadOutlined />}
          size="small"
          onClick={() => void loadHistory()}
          loading={loading}
          disabled={!canLoad}
        />
      </div>

      {!canLoad ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="缺少 PSKU 或站点，暂时不能读取关键词历史" />
      ) : errorMessage ? (
        <Alert type="warning" showIcon message={errorMessage} />
      ) : loading && !panel ? (
        <Space size={8}>
          <Spin size="small" />
          <Text type="secondary">正在读取关键词历史...</Text>
        </Space>
      ) : (
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <Space size={[6, 6]} wrap>
            <Tag style={{ marginInlineEnd: 0 }}>全部 {scopedEvents.length}</Tag>
            <Tag color="green" style={{ marginInlineEnd: 0 }}>标题 {sourceCount(scopedEvents, 'TITLE_HISTORY')}</Tag>
            <Tag color="geekblue" style={{ marginInlineEnd: 0 }}>竞品 {sourceCount(scopedEvents, 'COMPETITOR_KEYWORD')}</Tag>
            <Tag color="purple" style={{ marginInlineEnd: 0 }}>广告 {sourceCount(scopedEvents, 'ADS_QUERY')}</Tag>
          </Space>
          {visibleEvents.length ? (
            <Timeline
              className="product-keyword-history-timeline"
              items={visibleEvents.map((event) => ({
                color: sourceColor(event.sourceType),
                children: historyEventLine(event)
              }))}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={normalizedTargetKeyword ? '当前关键词暂无使用历史' : '暂无关键词使用历史'}
            />
          )}
        </Space>
      )}
    </section>
  )
}
