import { Tag, Typography } from 'antd'
import { buildNoonProductDetailUrl } from '../competitorNoonLinks'
import type {
  CompetitorProductChangeField,
  CompetitorWatchProduct
} from '../types'
import {
  buildNoonImageAssetUrl,
  buildProductChangeRankItems,
  formatProductChangeContent,
  formatProductChangeValue,
  productChangeFieldColor,
  productChangeFieldKey,
  type ProductChangeCompetitorCardView
} from './productChangeModel'

const { Link, Text } = Typography

export function ProductChangeCompetitorCard({
  product,
  card
}: {
  product: CompetitorWatchProduct
  card: ProductChangeCompetitorCardView
}) {
  const placeholderText = card.productName.slice(0, 2).toUpperCase()
  const productLink = card.canonicalUrl
    || buildNoonProductDetailUrl(card.noonProductCode, product.siteCode)
  const productLinkLabel = `打开 Noon 商品 ${card.noonProductCode}`

  return (
    <article className="competitor-analysis-product-change-competitor-card">
      <div className="competitor-analysis-product-change-competitor-detail">
        {productLink ? (
          <a
            href={productLink}
            target="_blank"
            rel="noreferrer"
            className="competitor-analysis-product-change-competitor-media"
            aria-label={`${productLinkLabel} 图片`}
          >
            {card.imageUrl ? <img src={card.imageUrl} alt="" /> : null}
            <span>{placeholderText}</span>
          </a>
        ) : (
          <div className="competitor-analysis-product-change-competitor-media">
            {card.imageUrl ? <img src={card.imageUrl} alt="" /> : null}
            <span>{placeholderText}</span>
          </div>
        )}
        <div className="competitor-analysis-product-change-competitor-meta">
          {productLink ? (
            <Link
              copyable={{ text: card.noonProductCode }}
              href={productLink}
              target="_blank"
              rel="noreferrer"
              aria-label={productLinkLabel}
              className="competitor-analysis-product-change-competitor-code"
            >
              {card.noonProductCode}
            </Link>
          ) : (
            <Text
              copyable={{ text: card.noonProductCode }}
              className="competitor-analysis-product-change-competitor-code"
            >
              {card.noonProductCode}
            </Text>
          )}
          <Text type="secondary" className="competitor-analysis-product-change-competitor-name">
            {card.productName}
          </Text>
        </div>
      </div>

      <div className="competitor-analysis-product-change-date-list">
        {card.dateGroups.map((dateGroup) => (
          <div
            key={`${card.noonProductCode}-${dateGroup.factDate}`}
            className="competitor-analysis-product-change-date-block"
          >
            <div className="competitor-analysis-product-change-date-title">
              <Text strong>{dateGroup.factDate}</Text>
              <Tag color={card.subjectType === 'self' ? 'blue' : 'green'}>
                {card.subjectType === 'self' ? '本品' : '竞品'}
              </Tag>
            </div>
            <ProductChangeRankSection
              product={product}
              noonProductCode={card.noonProductCode}
              factDate={dateGroup.factDate}
            />
            <ProductChangeFieldSection changes={dateGroup.changes} />
          </div>
        ))}
      </div>
    </article>
  )
}

function ProductChangeRankSection({
  product,
  noonProductCode,
  factDate
}: {
  product: CompetitorWatchProduct
  noonProductCode: string
  factDate: string
}) {
  const rankItems = buildProductChangeRankItems(product, noonProductCode, factDate)
  return (
    <div className="competitor-analysis-product-change-rank-section">
      <Text type="secondary" className="competitor-analysis-product-change-section-label">
        排名
      </Text>
      <div className="competitor-analysis-product-change-rank-list">
        {rankItems.length ? rankItems.map((item) => (
          <div
            key={`${item.keyword}-${item.channel}-${item.status}`}
            className="competitor-analysis-product-change-rank-row"
          >
            <Text className="competitor-analysis-product-change-rank-keyword">{item.keyword}</Text>
            <Text type="secondary" className="competitor-analysis-product-change-rank-channel">
              {item.channel}
            </Text>
            <Text strong className="competitor-analysis-product-change-rank-status">
              {item.status}
            </Text>
          </div>
        )) : (
          <Text type="secondary" className="competitor-analysis-product-change-rank-empty">
            暂无排名
          </Text>
        )}
      </div>
    </div>
  )
}

function ProductChangeFieldSection({
  changes
}: {
  changes: CompetitorProductChangeField[]
}) {
  return (
    <div className="competitor-analysis-product-change-field-section">
      <Text type="secondary" className="competitor-analysis-product-change-section-label">
        变化
      </Text>
      <ul className="competitor-analysis-product-change-content-list">
        {changes.map((change, index) => (
          <li key={`${change.fieldKey}-${index}`} className="competitor-analysis-product-change-field-row">
            <Tag color={productChangeFieldColor(change.fieldKey)}>{change.fieldLabel}</Tag>
            <ProductChangeContent change={change} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProductChangeContent({ change }: { change: CompetitorProductChangeField }) {
  if (productChangeFieldKey(change.fieldKey) === 'mainImage') {
    return <ProductChangeMainImageLinks change={change} />
  }
  return <Text>{formatProductChangeContent(change)}</Text>
}

function ProductChangeMainImageLinks({ change }: { change: CompetitorProductChangeField }) {
  const oldHref = buildNoonImageAssetUrl(change.oldValue, change.newValue)
  const newHref = buildNoonImageAssetUrl(change.newValue, change.oldValue)
  return (
    <span
      className="competitor-analysis-product-change-image-links"
      title={`${formatProductChangeValue(change.oldValue)} -> ${formatProductChangeValue(change.newValue)}`}
    >
      <ProductChangeImageAssetLink label="主图A" href={oldHref} />
      <span className="competitor-analysis-product-change-image-arrow">-&gt;</span>
      <ProductChangeImageAssetLink label="主图B" href={newHref} />
    </span>
  )
}

function ProductChangeImageAssetLink({ label, href }: { label: string; href: string }) {
  return href ? (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className="competitor-analysis-product-change-image-link"
      aria-label={label}
    >
      {label}
    </Link>
  ) : <Text>{label}</Text>
}
