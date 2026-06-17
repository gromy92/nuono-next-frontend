import { useMemo } from 'react'
import { Button, Space, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { InTransitBoxGroup, InTransitProductGroup } from './InTransitGoodsPage.models'
import { productDisplayName } from './InTransitGoodsPage.utils'
import { InTransitProductThumb } from './InTransitProductThumb'

const { Text } = Typography

export function useInTransitBoxDetailColumns(onOpenSkuFreightHistory: (row: InTransitProductGroup) => void) {
  const boxDetailColumns = useMemo<ColumnsType<InTransitBoxGroup>>(() => [
    {
      title: '箱号',
      dataIndex: 'boxNo',
      key: 'boxNo',
      fixed: 'left',
      width: 220,
      render: (value, row) => (
        <Space direction="vertical" size={4} className="in-transit-box-code-cell">
          <Text strong>{value || '-'}</Text>
          {row.externalBoxNo !== '-' ? <Text type="secondary">平台 {row.externalBoxNo}</Text> : null}
          {row.packageTrackingNo !== '-' ? <Text type="secondary">追踪 {row.packageTrackingNo}</Text> : null}
          <Space size={4} wrap>
            {row.packageStatus !== '-' ? <Tag color="blue" style={{ marginInlineEnd: 0 }}>{row.packageStatus}</Tag> : null}
            {row.logisticsStatus !== '-' ? <Tag color="purple" style={{ marginInlineEnd: 0 }}>{row.logisticsStatus}</Tag> : null}
          </Space>
        </Space>
      )
    },
    {
      title: '箱内产品',
      key: 'products',
      width: 560,
      render: (_value, row) => (
        <div className="in-transit-box-products">
          {row.lines.map((line) => {
            const productTitle = productDisplayName(line)
            return (
              <div key={line.lineId} className="in-transit-box-products__item">
                <InTransitProductThumb imageUrl={line.productImageUrl} title={productTitle} />
                <div className="in-transit-box-products__body">
                  <Text strong>{productTitle}</Text>
                  <div className="in-transit-box-products__meta">
                    <Text>PSKU {line.psku}</Text>
                    <Text>数量 {line.shippedQuantity ?? '-'}</Text>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )
    },
    {
      title: '箱规',
      key: 'cartonSpec',
      width: 260,
      render: (_value, row) => (
        <div className="in-transit-package-spec">
          <div className="in-transit-package-spec__group">
            <Text type="secondary">箱规</Text>
            <Text>尺寸 {row.packageSpec.sizeCm}</Text>
            <Text>重量 {row.packageSpec.weightKg}</Text>
            <Text>体积 {row.packageSpec.volumeCbm}</Text>
          </div>
          <div className="in-transit-package-spec__group">
            <Text type="secondary">仓库测量</Text>
            <Text>尺寸 {row.measuredSpec.sizeCm}</Text>
            <Text>重量 {row.measuredSpec.weightKg}</Text>
            <Text>体积 {row.measuredSpec.volumeCbm}</Text>
          </div>
        </div>
      )
    },
    { title: '汇总', key: 'summary', width: 260, render: (_value, row) => renderBoxSummary(row) }
  ], [])

  const productColumns = useMemo<ColumnsType<InTransitProductGroup>>(() => [
    {
      title: '产品',
      key: 'product',
      fixed: 'left',
      width: 360,
      render: (_value, row) => {
        const productTitle = productDisplayName(row)
        return (
          <Space align="start" size={10} className="in-transit-product-cell">
            <InTransitProductThumb imageUrl={row.productImageUrl} title={productTitle} />
            <Space direction="vertical" size={0} className="in-transit-product-cell__body">
              <Text strong>{productTitle}</Text>
              <Text>PSKU {row.psku}</Text>
              <Button type="link" size="small" className="in-transit-batch-cell__box-link" onClick={() => onOpenSkuFreightHistory(row)}>
                运费历史
              </Button>
            </Space>
          </Space>
        )
      }
    },
    {
      title: '所在箱子',
      key: 'boxes',
      width: 420,
      render: (_value, row) => (
        <div className="in-transit-product-boxes">
          {row.lines.map((line) => (
            <span key={line.lineId} className="in-transit-product-boxes__item">
              <Text strong>{line.boxNo || '未填写箱号'}</Text>
              <Text type="secondary">数量 {line.shippedQuantity ?? '-'}</Text>
            </span>
          ))}
        </div>
      )
    },
    { title: '店铺', key: 'store', width: 180, render: (_value, row) => row.storeValues.join(' / ') || '-' },
    { title: '汇总', key: 'summary', width: 260, render: (_value, row) => renderProductSummary(row) }
  ], [onOpenSkuFreightHistory])

  return { boxDetailColumns, productColumns }
}

function renderBoxSummary(row: InTransitBoxGroup) {
  return (
    <Space size={10} wrap>
      <span className="in-transit-page__stat">PSKU {row.pskuCount}</span>
      <span className="in-transit-page__stat">发货 {row.shippedQuantityTotal}</span>
      <span className="in-transit-page__stat">入仓 {row.receivedQuantityTotal}</span>
      <span className="in-transit-page__stat">剩余 {row.remainingQuantityTotal}</span>
    </Space>
  )
}

function renderProductSummary(row: InTransitProductGroup) {
  return (
    <Space size={10} wrap>
      <span className="in-transit-page__stat">箱号 {row.boxCount}</span>
      <span className="in-transit-page__stat">发货 {row.shippedQuantityTotal}</span>
      <span className="in-transit-page__stat">入仓 {row.receivedQuantityTotal}</span>
      <span className="in-transit-page__stat">剩余 {row.remainingQuantityTotal}</span>
      <span className="in-transit-page__stat">箱数 {row.cartonCountTotal ?? '-'}</span>
    </Space>
  )
}
