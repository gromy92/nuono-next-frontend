import { Drawer, Empty, Space, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import { ProductKeywordHistorySection } from './ProductKeywordHistorySection'
import type {
  ProductKeywordTitleType,
  ProductKeywordTitleUsageState
} from './types'
import './ProductKeywordDetailDrawer.css'

const { Text } = Typography

export type ProductKeywordDetailKeyword = {
  storeCode?: string
  siteCode?: string
  partnerSku?: string
  keyword?: string
  keywordNorm?: string
  titleTypes?: Array<ProductKeywordTitleType | string>
  titleUsageStates?: Array<ProductKeywordTitleUsageState | string>
  competitorEvidence?: boolean
  adsEvidence?: boolean
  negativeCandidate?: boolean
}

type ProductKeywordDetailDrawerProps = {
  open: boolean
  onClose: () => void
  keyword?: ProductKeywordDetailKeyword | null
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

function DimensionSection({
  title,
  children
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="product-keyword-detail-section">
      <Text strong>{title}</Text>
      <Space size={[6, 6]} wrap>
        {children}
      </Space>
    </div>
  )
}

export function ProductKeywordDetailDrawer({
  open,
  onClose,
  keyword
}: ProductKeywordDetailDrawerProps) {
  const titleTypes = values(keyword?.titleTypes)
  const titleUsageStates = values(keyword?.titleUsageStates)
  const title = keyword?.keyword ? `关键词详情：${keyword.keyword}` : '关键词详情'

  return (
    <Drawer title={title} open={open} onClose={onClose} width={760} destroyOnClose>
      <section className="product-keyword-detail-drawer" data-testid="product-keyword-detail-drawer">
        {!keyword ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择关键词" />
        ) : (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div className="product-keyword-detail-identity">
              <Text strong>{keyword.keyword || '-'}</Text>
              <Text type="secondary">
                {keyword.partnerSku || '-'} / {keyword.storeCode || '-'} / {keyword.siteCode || '-'}
              </Text>
            </div>

            <DimensionSection title="标题">
              {titleTypes.map((type) => (
                <Tag key={`type-${type}`} color={titleTypeColor(type)}>{titleTypeLabel(type)}</Tag>
              ))}
              {titleUsageStates.map((state) => (
                <Tag key={`state-${state}`} color={titleUsageStateColor(state)}>{titleUsageStateLabel(state)}</Tag>
              ))}
              {!titleTypes.length && !titleUsageStates.length ? <Tag>未设置标题类型</Tag> : null}
            </DimensionSection>

            <DimensionSection title="竞品">
              {keyword.competitorEvidence ? (
                <Tag color="geekblue">有竞品证据</Tag>
              ) : (
                <Tag>无竞品证据</Tag>
              )}
            </DimensionSection>

            <DimensionSection title="广告">
              {keyword.negativeCandidate ? (
                <Tag color="red">否词候选</Tag>
              ) : keyword.adsEvidence ? (
                <Tag color="purple">有广告证据</Tag>
              ) : (
                <Tag>无广告证据</Tag>
              )}
            </DimensionSection>

            <ProductKeywordHistorySection
              storeCode={keyword.storeCode}
              siteCode={keyword.siteCode}
              partnerSku={keyword.partnerSku}
              keywordNorm={keyword.keywordNorm || keyword.keyword}
            />
          </Space>
        )}
      </section>
    </Drawer>
  )
}
