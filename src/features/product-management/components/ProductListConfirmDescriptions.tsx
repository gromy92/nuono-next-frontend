import { Space, Typography } from 'antd'
import type { ProductListRowPayload } from '../types'

const { Text } = Typography

function productName(record: ProductListRowPayload) {
  return record.title || record.partnerSku || record.skuParent || '当前商品'
}

function productIdentityLabel(record: ProductListRowPayload) {
  if (record.partnerSku) return `PSKU: ${record.partnerSku}`
  if (record.skuParent) return `SKU: ${record.skuParent}`
  return ''
}

export function ProductDeleteConfirmDescription({
  record,
  continuing = false
}: { record: ProductListRowPayload; continuing?: boolean }) {
  const identityLabel = productIdentityLabel(record)

  return (
    <Space direction="vertical" size={8} style={{ width: 360, maxWidth: 'calc(100vw - 72px)' }}>
      <Space direction="vertical" size={2} style={{ width: '100%' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          删除对象
        </Text>
        <Text
          strong
          style={{
            display: 'block',
            lineHeight: '20px',
            maxHeight: 60,
            overflow: 'hidden',
            wordBreak: 'break-word'
          }}
        >
          {productName(record)}
        </Text>
        {identityLabel ? (
          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
            {identityLabel}
          </Text>
        ) : null}
      </Space>
      <div
        style={{
          background: '#fff7ed',
          border: '1px solid #fed7aa',
          borderRadius: 6,
          padding: '8px 10px'
        }}
      >
        <Text style={{ color: '#9a3412', display: 'block', fontSize: 12, lineHeight: '18px' }}>
          {continuing
            ? '系统会复用原删除任务，从已验证的安全检查点继续；不会创建第二个删除任务。'
            : '系统会先删除 Noon 商品并回查确认，成功后再清理本地商品目录。'}
        </Text>
      </div>
    </Space>
  )
}

export function ProductRebuildConfirmDescription({ record }: { record: ProductListRowPayload }) {
  const identityLabel = productIdentityLabel(record)

  return (
    <Space direction="vertical" size={8} style={{ width: 380, maxWidth: 'calc(100vw - 72px)' }}>
      <Space direction="vertical" size={2} style={{ width: '100%' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          重建对象
        </Text>
        <Text
          strong
          style={{
            display: 'block',
            lineHeight: '20px',
            maxHeight: 60,
            overflow: 'hidden',
            wordBreak: 'break-word'
          }}
        >
          {productName(record)}
        </Text>
        {identityLabel ? (
          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
            {identityLabel}
          </Text>
        ) : null}
      </Space>
      <div
        style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 6,
          padding: '8px 10px'
        }}
      >
        <Text style={{ color: '#166534', display: 'block', fontSize: 12, lineHeight: '18px' }}>
          系统会先删除 Noon 旧商品，确认后按当前本地数据重新上架；上架时间继承旧 PSKU，不计为新品。
        </Text>
      </div>
    </Space>
  )
}
