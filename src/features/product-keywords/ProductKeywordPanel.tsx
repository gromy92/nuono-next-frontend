import { HistoryOutlined, ReloadOutlined } from '@ant-design/icons'
import { App, Button, Empty, Space, Tag, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchProductKeywordProduct } from './api'
import type { ProductKeywordEventItem, ProductKeywordItem, ProductKeywordPanelView } from './types'
import { ProductKeywordHistoryDrawer } from './ProductKeywordHistoryDrawer'
import './ProductKeywordPanel.css'

const { Text } = Typography

type ProductKeywordPanelProps = {
  storeCode?: string
  siteCode?: string
  partnerSku?: string
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

function titleKeyword(keyword: ProductKeywordItem) {
  return values(keyword.titleTypes).length > 0 || values(keyword.titleUsageStates).length > 0
}

function competitorEvidence(event: ProductKeywordEventItem) {
  return event.sourceType === 'COMPETITOR_KEYWORD'
}

function adsEvidence(event: ProductKeywordEventItem) {
  return event.sourceType === 'ADS_QUERY'
}

function keywordLine(keyword: ProductKeywordItem) {
  const titleTypes = values(keyword.titleTypes)
  const titleUsageStates = values(keyword.titleUsageStates)
  return (
    <div key={keyword.id} className="product-keyword-panel-line">
      <div>
        <Text strong>{keyword.keyword}</Text>
      </div>
      <Space size={[4, 4]} wrap>
        {titleTypes.map((type) => <Tag key={type} color={titleTypeColor(type)}>{titleTypeLabel(type)}</Tag>)}
        {titleUsageStates.map((state) => <Tag key={state} color={titleUsageStateColor(state)}>{titleUsageStateLabel(state)}</Tag>)}
        {keyword.competitorEvidence ? <Tag color="geekblue">有竞品证据</Tag> : null}
        {keyword.negativeCandidate ? <Tag color="red">否词候选</Tag> : keyword.adsEvidence ? <Tag color="purple">有广告证据</Tag> : null}
        {!titleTypes.length && !titleUsageStates.length && !keyword.competitorEvidence && !keyword.adsEvidence && !keyword.negativeCandidate
          ? <Tag>未设置维度</Tag>
          : null}
      </Space>
    </div>
  )
}

export function ProductKeywordPanel({ storeCode, siteCode, partnerSku }: ProductKeywordPanelProps) {
  const { message } = App.useApp()
  const [panel, setPanel] = useState<ProductKeywordPanelView | null>(null)
  const [loading, setLoading] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

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
  const titleKeywords = useMemo(() => keywords.filter(titleKeyword), [keywords])
  const competitorKeywords = useMemo(() => keywords.filter((keyword) => keyword.competitorEvidence), [keywords])
  const adsKeywords = useMemo(() => keywords.filter((keyword) => keyword.adsEvidence || keyword.negativeCandidate), [keywords])
  const competitorEvents = useMemo(() => events.filter(competitorEvidence), [events])
  const adsEvents = useMemo(() => events.filter(adsEvidence), [events])

  return (
    <>
      <section className="product-keyword-panel" data-testid="product-keyword-panel">
        <div className="product-keyword-panel-header">
          <div>
            <Text strong>关键词</Text>
            <Text type="secondary"> {partnerSku || '未选择商品'}</Text>
          </div>
          <Space size={6}>
            <Button
              icon={<HistoryOutlined />}
              size="small"
              onClick={() => setHistoryOpen(true)}
              disabled={!canLoad}
            >
              历史
            </Button>
            <Button
              aria-label="刷新商品关键词"
              title="刷新商品关键词"
              icon={<ReloadOutlined />}
              size="small"
              onClick={() => void loadPanel()}
              loading={loading}
              disabled={!canLoad}
            />
          </Space>
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
              <div className="product-keyword-panel-list">
                {competitorKeywords.length ? competitorKeywords.slice(0, 4).map(keywordLine) : <Text type="secondary">暂无竞品证据词</Text>}
              </div>
            </div>
            <div className="product-keyword-panel-section">
              <Text strong>广告证据</Text>
              <Text type="secondary" className="product-keyword-panel-count">已串联 {adsEvents.length} 条</Text>
              <div className="product-keyword-panel-list">
                {adsKeywords.length ? adsKeywords.slice(0, 4).map(keywordLine) : <Text type="secondary">暂无广告证据词</Text>}
              </div>
            </div>
          </div>
        )}
      </section>
      <ProductKeywordHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        storeCode={storeCode}
        siteCode={siteCode}
        partnerSku={partnerSku}
      />
    </>
  )
}
