import { Modal, Space, Tabs, Typography } from 'antd'
import { ProductBaselineIdentity } from '../../product-baseline'
import type { SalesProductRow, SalesTrendBucket } from '../types'
import { formatNumber, missingFieldLabels } from '../presentation/formatters'

const { Text } = Typography

export function ComparisonDialog({
  open,
  products,
  trends,
  onClose
}: {
  open: boolean
  products: SalesProductRow[]
  trends: SalesTrendBucket[]
  onClose: () => void
}) {
  return (
    <Modal title="商品横向对比" open={open} width={980} footer={null} onCancel={onClose}>
      <Tabs
        items={[
          {
            key: 'metrics',
            label: '指标对比',
            children: (
              <div style={{ display: 'grid', gap: 10 }}>
                {products.map((product) => (
                  <div key={`${product.partnerSku}|${product.sku}`} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 12 }}>
                    <Space direction="vertical" size={4}>
                      <ProductBaselineIdentity
                        title={product.productTitle || product.partnerSku}
                        imageUrl={product.imageUrl}
                        imageCount={product.imageUrl ? 1 : 0}
                        imageAlt={product.productTitle || product.partnerSku}
                        imageWidth={72}
                        compact
                        codes={[
                          { label: 'PSKU', value: product.partnerSku, copyText: product.partnerSku },
                          { label: 'SKU', value: product.sku, copyText: product.sku }
                        ]}
                      />
                      <Text>{comparisonMetricText(product)}</Text>
                    </Space>
                  </div>
                ))}
              </div>
            )
          },
          {
            key: 'trend',
            label: '趋势对比',
            children: (
              <div style={{ display: 'grid', gap: 10 }}>
                <Text type="secondary">使用当前范围真实销量事实进行对比；商品级日销量和价格叠加图在详情中查看。</Text>
                {products.map((product) => (
                  <div key={`${product.partnerSku}|trend`} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 80px', gap: 8, alignItems: 'center' }}>
                    <Text>{product.partnerSku}</Text>
                    <div style={{ height: 8, background: '#eef2ff', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.max(6, Math.min(100, Number(product.netUnits || 0) * 8))}%`, height: '100%', background: '#168553' }} />
                    </div>
                    <Text>{formatNumber(product.netUnits)}</Text>
                  </div>
                ))}
                {trends.length ? <Text type="secondary">当前页面趋势粒度：{trends.map((item) => item.bucketLabel).join(' / ')}</Text> : null}
              </div>
            )
          }
        ]}
      />
    </Modal>
  )
}

function comparisonMetricText(product: SalesProductRow) {
  const missingFields = missingFieldLabels(product)
  const missingFieldSuffix = missingFields.length ? ` / ${missingFields.join(' / ')}` : ''
  return `发货 ${formatNumber(product.shippedUnits)} / PV ${formatNumber(product.yourVisitors)} / 可售库存 ${formatNumber(product.currentStock)}${missingFieldSuffix}`
}
