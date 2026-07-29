import { Empty, Tag } from 'antd'
import { ProductImageThumb } from '../../product-baseline'
import type {
  NoonAdvertisingProductDiagnostic,
  NoonAdvertisingProductRow
} from '../types'
import {
  advertisingIdentityKeyOf,
  displaySkuOf,
  formatDecimal,
  formatMoney,
  formatNumber,
  formatRate,
  planTypeCountText,
  primaryDiagnosticReason,
  productDiagnosisTagColor,
  secondarySkuOf
} from '../presentation/formatters'

export function ProductNavigationList({
  products,
  productDiagnosticsByKey,
  selectedProductKey,
  loading,
  onSelectProduct,
  onProductImagePreview
}: {
  products: NoonAdvertisingProductRow[]
  productDiagnosticsByKey: Map<string, NoonAdvertisingProductDiagnostic>
  selectedProductKey: string | null
  loading: boolean
  onSelectProduct: (productKey: string) => void
  onProductImagePreview: (imageUrl?: string | null) => void
}) {
  if (!products.length) {
    return (
      <div className="noon-ads-product-nav-empty">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={loading ? '广告商品加载中' : '暂无商品广告数据'} />
      </div>
    )
  }

  return (
    <div className="noon-ads-product-nav-list" aria-label="商品列表">
      {products.map((product) => {
        const productKey = advertisingIdentityKeyOf(product)
        const selected = productKey === selectedProductKey
        const diagnostic = productDiagnosticsByKey.get(productKey)
        const reason = primaryDiagnosticReason(diagnostic)
        return (
          <div
            key={productKey}
            role="button"
            tabIndex={0}
            className={`noon-ads-product-nav-item${selected ? ' noon-ads-product-nav-item-selected' : ''}`}
            onClick={() => onSelectProduct(productKey)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelectProduct(productKey)
              }
            }}
          >
            <ProductImageThumb
              src={product.imageUrl}
              alt={displaySkuOf(product) || '商品图片'}
              imageCount={product.imageUrl ? 1 : 0}
              width={56}
              onClick={(event) => {
                event.stopPropagation()
                onProductImagePreview(product.imageUrl)
              }}
            />
            <div className="noon-ads-product-nav-content">
              <div className="noon-ads-product-nav-title">
                <span>{displaySkuOf(product) || 'no sku'}</span>
                <Tag color={productDiagnosisTagColor(diagnostic?.diagnosisType)}>
                  {diagnostic?.diagnosisLabel || '样本不足'}
                </Tag>
              </div>
              {secondarySkuOf(product) ? (
                <div className="noon-ads-product-nav-subtitle">{secondarySkuOf(product)}</div>
              ) : null}
              <div className="noon-ads-product-nav-diagnosis">
                <span>{planTypeCountText(diagnostic)}</span>
                <span>{reason}</span>
              </div>
              <div className="noon-ads-product-nav-metrics">
                <ProductNavMetric label="花费" value={formatMoney(product.spendAmount)} />
                <ProductNavMetric label="订单" value={formatNumber(product.ordersCount)} />
                <ProductNavMetric label="ROAS" value={formatDecimal(product.roas)} />
                <ProductNavMetric label="零订单" value={formatRate(product.zeroOrderSpendShare)} />
              </div>
              <div className="noon-ads-product-nav-structure">
                {formatNumber(product.campaignCount)} 个广告计划 / {formatNumber(product.queryCount)} 个词
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ProductNavMetric({ label, value }: { label: string; value: string }) {
  return (
    <span className="noon-ads-product-nav-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </span>
  )
}
