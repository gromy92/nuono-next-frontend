import { Tag, Tooltip, Typography } from 'antd'
import type { ProductStockSourceChain, ProductStockSourceChainSegment } from './statisticsDomain'
import {
  sourceSegmentColor,
  sourceSegmentStatusLabel,
  sourceSegmentTagColor
} from './productStockSourcePresentation'

const { Text } = Typography

export function ProductStockSourceChainView({
  chain,
  loading,
  onSegmentClick
}: {
  chain: ProductStockSourceChain
  loading?: boolean
  onSegmentClick: (segment: ProductStockSourceChainSegment) => void
}) {
  return (
    <div className="official-warehouse-source-chain">
      <div className="official-warehouse-source-chain-head">
        <Text strong>剩余总库存：{chain.totalQuantity.toLocaleString()} 件</Text>
        <Text type="secondary">
          ASN 来自入仓行 FIFO 推算；物流和采购单为同商品候选来源，确认关系前不写入数据。
        </Text>
      </div>
      <div className="official-warehouse-source-chain-grid">
        <ProductStockSourceChainColumn
          title="ASN"
          totalQuantity={chain.totalQuantity}
          segments={chain.stages.asn}
          loading={loading}
          onSegmentClick={onSegmentClick}
        />
        <ProductStockSourceChainColumn
          title="物流"
          totalQuantity={chain.totalQuantity}
          segments={chain.stages.logistics}
          loading={loading}
          onSegmentClick={onSegmentClick}
        />
        <ProductStockSourceChainColumn
          title="采购单"
          totalQuantity={chain.totalQuantity}
          segments={chain.stages.purchaseOrder}
          loading={loading}
          onSegmentClick={onSegmentClick}
        />
      </div>
    </div>
  )
}

function ProductStockSourceChainColumn({
  title,
  totalQuantity,
  segments,
  loading,
  onSegmentClick
}: {
  title: string
  totalQuantity: number
  segments: ProductStockSourceChainSegment[]
  loading?: boolean
  onSegmentClick: (segment: ProductStockSourceChainSegment) => void
}) {
  if (loading && !segments.length) {
    return <EmptySourceChainColumn title={title} text="读取中" />
  }
  if (!totalQuantity || !segments.length) {
    return <EmptySourceChainColumn title={title} text="暂无库存" />
  }
  return (
    <div className="official-warehouse-source-chain-column">
      <div className="official-warehouse-source-chain-column-title">
        <Text strong>{title}</Text>
        <Text type="secondary">{segments.length} 段</Text>
      </div>
      <div className="official-warehouse-source-chain-bar" aria-label={`${title}库存来源分段`}>
        {segments.map((segment, index) => (
          <Tooltip key={segment.key} title={`${segment.label}：${segment.quantity.toLocaleString()} 件`}>
            <button
              type="button"
              className="official-warehouse-source-chain-segment"
              aria-label={`${title} ${segment.label} ${segment.quantity.toLocaleString()} 件`}
              style={{ flexGrow: Math.max(segment.quantity, 1), background: sourceSegmentColor(segment, index) }}
              onClick={() => onSegmentClick(segment)}
            />
          </Tooltip>
        ))}
      </div>
      <div className="official-warehouse-source-chain-legend">
        {segments.map((segment, index) => (
          <button
            key={segment.key}
            type="button"
            className={`official-warehouse-source-chain-chip official-warehouse-source-chain-chip-${segment.status.toLowerCase()}`}
            onClick={() => onSegmentClick(segment)}
          >
            <span
              className="official-warehouse-source-chain-chip-dot"
              style={{ background: sourceSegmentColor(segment, index) }}
            />
            <span className="official-warehouse-source-chain-chip-label">{segment.label}</span>
            <span className="official-warehouse-source-chain-chip-qty">{segment.quantity.toLocaleString()}件</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function EmptySourceChainColumn({ title, text }: { title: string; text: string }) {
  return (
    <div className="official-warehouse-source-chain-column">
      <div className="official-warehouse-source-chain-column-title">
        <Text strong>{title}</Text>
      </div>
      <div className="official-warehouse-source-chain-empty">{text}</div>
    </div>
  )
}

export function ProductStockSourceSegmentDetail({
  segment
}: {
  segment: ProductStockSourceChainSegment
}) {
  return (
    <div className="official-warehouse-source-segment-detail">
      <div className="official-warehouse-source-segment-detail-head">
        <Text strong>{segment.label}</Text>
        <Tag color={sourceSegmentTagColor(segment.status)}>{sourceSegmentStatusLabel(segment.status)}</Tag>
      </div>
      <div className="official-warehouse-source-segment-detail-quantity">
        <Text strong>{segment.quantity.toLocaleString()}</Text>
        <Text type="secondary">件剩余库存</Text>
      </div>
      <div className="official-warehouse-source-segment-detail-list">
        {Object.entries(segment.detail).map(([label, value]) => (
          <div className="official-warehouse-source-segment-detail-row" key={label}>
            <Text type="secondary">{label}</Text>
            <Text>{value}</Text>
          </div>
        ))}
      </div>
    </div>
  )
}
