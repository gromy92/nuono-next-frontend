import { Empty, Tag, Typography } from 'antd'
import { ProductBaselineIdentity } from '../../product-baseline'
import { ProductTitleStack } from '../CompetitorProductListCells'
import { productTitleLines } from '../competitorProductListModel'
import type {
  CompetitorProductChangeBaselineSummary,
  CompetitorProductChangeGroup,
  CompetitorWatchProduct
} from '../types'
import { ProductChangeCompetitorCard } from './ProductChangeCompetitorCard'
import {
  buildProductChangeCompetitorCards,
  buildProductChangeSummary,
  formatSnapshotDate
} from './productChangeModel'

const { Text } = Typography

export function ProductChangeModal({
  product,
  storeLabel,
  groups,
  baselineSummary,
  showIdentity = true,
  showSummary = true
}: {
  product: CompetitorWatchProduct
  storeLabel?: string
  groups: CompetitorProductChangeGroup[]
  baselineSummary?: CompetitorProductChangeBaselineSummary
  showIdentity?: boolean
  showSummary?: boolean
}) {
  const summary = buildProductChangeSummary(groups)
  const competitorCards = buildProductChangeCompetitorCards(product, groups)
  const monitoredCount = baselineSummary?.monitoredCompetitorCount
    ?? product.confirmedCompetitorCount
    ?? 0
  const titleLines = productTitleLines(product)
  const emptyDescription = baselineSummary?.snapshotCompetitorCount
    ? `已抓取 ${baselineSummary.snapshotCompetitorCount}/${baselineSummary.monitoredCompetitorCount || baselineSummary.snapshotCompetitorCount} 个监控竞品基线，最新 ${formatSnapshotDate(baselineSummary.latestSnapshotDate)}，暂无字段变化`
    : monitoredCount
      ? `当前有 ${monitoredCount} 个监控竞品，暂无字段变化`
      : '暂无商品详情变化'

  return (
    <div className="competitor-analysis-product-change-modal" data-testid="competitor-product-change-modal">
      {showIdentity ? (
        <ProductBaselineIdentity
          title={<ProductTitleStack titleLines={titleLines} />}
          fallbackTitle="未命名商品"
          imageUrl={product.imageUrl}
          imageAlt={titleLines.alt}
          imageWidth={72}
          titleMaxWidth={680}
          codes={[
            { label: '店铺', value: storeLabel || product.storeCode || '-' },
            { label: 'psku', value: product.partnerSku || '-', copyText: product.partnerSku || undefined },
            ...(product.selfNoonProductCode
              ? [{ label: 'Noon', value: product.selfNoonProductCode, copyText: product.selfNoonProductCode }]
              : [])
          ]}
          tags={
            <>
              <Tag style={{ marginInlineEnd: 0 }}>{product.siteCode || '-'}</Tag>
              <Tag color="cyan" style={{ marginInlineEnd: 0 }}>商品详情变化</Tag>
            </>
          }
        />
      ) : null}
      {showSummary ? (
        <ProductChangeSummaryLine
          summary={summary}
          monitoredCompetitorCount={monitoredCount}
          baselineSummary={baselineSummary}
        />
      ) : null}
      {competitorCards.length ? (
        <div className="competitor-analysis-product-change-competitor-list">
          {competitorCards.map((card) => (
            <ProductChangeCompetitorCard key={card.noonProductCode} product={product} card={card} />
          ))}
        </div>
      ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription} />}
    </div>
  )
}

export function ProductChangeSummaryLine({
  summary,
  monitoredCompetitorCount,
  baselineSummary
}: {
  summary: ReturnType<typeof buildProductChangeSummary>
  monitoredCompetitorCount: number
  baselineSummary?: CompetitorProductChangeBaselineSummary
}) {
  return (
    <div className="competitor-analysis-product-change-summary-line">
      <SummaryItem label="监控竞品" value={`${monitoredCompetitorCount} 个`} />
      <SummaryItem label="详情基线" value={`${baselineSummary?.snapshotCompetitorCount ?? 0} 个`} />
      <SummaryItem label="变化日期" value={`${summary.changedDays} 天`} />
      <SummaryItem label="变化字段" value={`${summary.fieldChanges} 项`} />
      <SummaryItem label="价格变化" value={`${summary.priceChanges} 次`} />
      <SummaryItem label="最新基线" value={formatSnapshotDate(baselineSummary?.latestSnapshotDate)} />
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="competitor-analysis-product-change-summary-item">
      <Text type="secondary">{label}</Text>
      <Text strong>{value}</Text>
    </div>
  )
}
