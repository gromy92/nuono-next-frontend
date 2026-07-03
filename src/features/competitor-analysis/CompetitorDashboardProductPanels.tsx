import { Empty, Tag, Typography } from 'antd'
import { useMemo } from 'react'
import type { CompetitorDashboardProductItem, CompetitorWatchProduct } from './types'
import { PanelHeader, RunStatusTag } from './CompetitorDashboardCommon'

const { Text } = Typography

export function CurrentProductPanel({
  loading,
  products,
  total,
  coverageTopProducts,
  onProductClick
}: {
  loading: boolean
  products: CompetitorWatchProduct[]
  total: number
  coverageTopProducts: CompetitorDashboardProductItem[]
  onProductClick: (product: CompetitorWatchProduct) => void
}) {
  const coverageByWatchId = useMemo(
    () => new Map(coverageTopProducts.map((item) => [item.watchProductId, item])),
    [coverageTopProducts]
  )

  return (
    <section className="competitor-analysis-dashboard-panel competitor-analysis-dashboard-current-panel">
      <PanelHeader
        title="现在要处理的商品"
        explanation="从明细列表读取当前店铺站点的监控商品，优先展示待确认候选多、关键词多、覆盖缺口明显的商品；点击商品进入原明细处理。"
        summary={`当前店铺共 ${total} 个监控商品`}
      />
      {loading ? (
        <div className="competitor-analysis-dashboard-current-empty">
          <Text type="secondary">加载中</Text>
        </div>
      ) : products.length ? (
        <div className="competitor-analysis-dashboard-current-list">
          {products.map((product) => {
            const coverage = coverageByWatchId.get(product.id)
            return (
              <button
                type="button"
                key={product.id}
                className="competitor-analysis-dashboard-current-item"
                onClick={() => onProductClick(product)}
              >
                <div className="competitor-analysis-dashboard-current-thumb">
                  <img src={product.imageUrl} alt={product.title} />
                </div>
                <div className="competitor-analysis-dashboard-current-body">
                  <div className="competitor-analysis-dashboard-current-title-row">
                    <Text strong ellipsis={{ tooltip: product.partnerSku || product.title }}>
                      {product.partnerSku || product.title || product.id}
                    </Text>
                    <RunStatusTag status={product.latestRunStatus} />
                  </div>
                  <Text className="competitor-analysis-dashboard-current-title" ellipsis={{ tooltip: product.title }}>
                    {product.title}
                  </Text>
                  <div className="competitor-analysis-dashboard-current-stats">
                    <span>待确认 {product.pendingCandidateCount || 0}</span>
                    <span>关键词 {product.activeKeywordCount || 0}</span>
                    <span>已确认 {product.confirmedCompetitorCount || 0}</span>
                    {coverage ? <span>缺口 {coverage.value}/{coverage.targetValue || 3}</span> : null}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="competitor-analysis-dashboard-current-empty">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前没有监控商品" />
        </div>
      )}
    </section>
  )
}

export function CoverageGapPanel({
  loading,
  items,
  onItemClick
}: {
  loading: boolean
  items: CompetitorDashboardProductItem[]
  onItemClick: (item: CompetitorDashboardProductItem) => void
}) {
  const visibleItems = items.slice(0, 12)
  return (
    <section className="competitor-analysis-dashboard-panel">
      <PanelHeader
        title="监控覆盖缺口"
        explanation="展示当前低于目标竞品数的商品。缺口 3/3 表示该商品距离目标监控竞品数还差 3 个，点击 SKU 可进入明细补充或确认竞品。"
        summary="按 SKU 快速定位处理"
      />
      {loading ? (
        <div className="competitor-analysis-dashboard-current-empty">
          <Text type="secondary">加载中</Text>
        </div>
      ) : visibleItems.length ? (
        <div className="competitor-analysis-dashboard-coverage-list" data-testid="competitor-dashboard-coverage-top">
          {visibleItems.map((item) => {
            const targetValue = item.targetValue || Math.max(item.value, 1)
            const percent = Math.min(100, Math.round((item.value / targetValue) * 100))
            return (
              <button
                type="button"
                key={`${item.watchProductId || item.partnerSku || item.productSiteOfferId}-${item.partnerSku || item.label}`}
                className="competitor-analysis-dashboard-coverage-item"
                onClick={() => onItemClick(item)}
              >
                <div className="competitor-analysis-dashboard-coverage-main">
                  <Text strong ellipsis={{ tooltip: item.partnerSku || item.label }}>
                    {item.partnerSku || item.label}
                  </Text>
                  <Text type="secondary" ellipsis={{ tooltip: item.title }}>
                    {item.title || '未命名商品'}
                  </Text>
                </div>
                <div className="competitor-analysis-dashboard-coverage-meter" aria-label={`缺口 ${item.value}/${targetValue}`}>
                  <span style={{ width: `${percent}%` }} />
                </div>
                <Tag color="blue">缺口 {item.value}/{targetValue}</Tag>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="competitor-analysis-dashboard-current-empty">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前没有监控缺口" />
        </div>
      )}
    </section>
  )
}
