import { SearchOutlined } from '@ant-design/icons'
import { Button, Popover, Typography } from 'antd'
import type { PurchaseOrderItem } from '../types'

const { Text } = Typography

export function ProductDetailButton({
  item,
  imageUrl,
  titlePair
}: {
  item: PurchaseOrderItem
  imageUrl?: string
  titlePair: { cn: string; en: string }
}) {
  const content = (
    <div className="purchase-product-popover">
      <div className="purchase-thumb-preview-frame">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="purchase-thumb-preview" />
        ) : (
          <div className="purchase-thumb-preview-empty">暂无图片</div>
        )}
      </div>
      <div className="purchase-product-popover-copy">
        <Text strong className="purchase-product-popover-title">{titlePair.cn}</Text>
        {titlePair.en ? (
          <Text type="secondary" className="purchase-product-popover-subtitle">{titlePair.en}</Text>
        ) : null}
        <div className="purchase-product-popover-fields">
          <InfoField label="Z码" value={item.skuParent} />
          <InfoField label="PSKU" value={item.partnerSku} />
          <InfoField label="类目" value={item.productFulltype} />
        </div>
      </div>
    </div>
  )

  return (
    <Popover
      content={content}
      trigger="click"
      overlayClassName="purchase-thumb-tooltip"
      placement="topLeft"
    >
      <Button size="small" icon={<SearchOutlined />} aria-label="详情" title="详情" />
    </Popover>
  )
}

export function ProductThumbnail({ imageUrl }: { imageUrl?: string }) {
  if (!imageUrl) {
    return <div className="purchase-thumb" />
  }

  return <img src={imageUrl} alt="" className="purchase-thumb" />
}

function InfoField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="purchase-product-popover-field">
      <span>{label}</span>
      <strong>{value?.trim() || '-'}</strong>
    </div>
  )
}
