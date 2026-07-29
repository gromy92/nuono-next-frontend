import { Card, Space, Statistic, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import type { AuthSessionStore } from '../auth/session'
import type { OrderFinanceQuery, OrderFinanceSkuSummaryRow, OrderFinanceSkuSummaryView } from './types'
import { formatNumber, statusColor } from './orderFinanceModel'

const { Text } = Typography

export function SummaryStatisticCard({ title, value, currency }: { title: string; value: number; currency?: string }) {
  return (
    <Card size="small" variant="borderless" style={{ boxShadow: 'none' }}>
      <Statistic
        title={title}
        value={value}
        formatter={() => (currency ? formatAmountWithoutCurrency(value) : formatNumber(value))}
      />
    </Card>
  )
}

export function formatAmountWithoutCurrency(value: number | null | undefined) {
  return formatNumber(value ?? 0)
}

export function ProductSummaryCell({ row }: { row: OrderFinanceSkuSummaryRow }) {
  const imageUrl = normalizeNoonProductImageUrl(row.imageUrl)
  const [imageBroken, setImageBroken] = useState(false)

  useEffect(() => {
    setImageBroken(false)
  }, [imageUrl])

  return (
    <div className="order-finance-product-cell">
      {imageUrl && !imageBroken ? (
        <img
          className="order-finance-product-image"
          src={imageUrl}
          alt={row.title || row.partnerSku || '商品图'}
          onError={() => setImageBroken(true)}
        />
      ) : (
        <div className="order-finance-product-image order-finance-product-image-empty">无图</div>
      )}
      <div className="order-finance-product-meta">
        <Text className="order-finance-product-title" title={row.title || undefined}>
          {row.title || '-'}
        </Text>
        <Space size={6} wrap>
          <Text className="order-finance-product-psku" type={row.partnerSku ? 'secondary' : 'warning'}>
            PSKU: {row.partnerSku || '缺失'}
          </Text>
          {row.missingPartnerSku || !row.partnerSku ? <Tag color="warning">待映射</Tag> : null}
        </Space>
      </div>
    </div>
  )
}

export function normalizeNoonProductImageUrl(rawUrl?: string | null) {
  const trimmed = rawUrl?.trim()
  if (!trimmed) return ''
  if (!trimmed.includes('f.nooncdn.com/')) return trimmed
  const [origin, rawPath = ''] = trimmed.split('f.nooncdn.com/')
  let path = rawPath.trim()
  if (!path) return trimmed
  if (!path.startsWith('p/')) {
    path = `p/${path.replace(new RegExp('^/+'), '')}`
  }
  if (!new RegExp('\\.(jpg|jpeg|png|webp|avif)(\\?|$)', 'i').test(path)) {
    path = `${path}.jpg`
  }
  return `${origin}f.nooncdn.com/${path}`
}

export function OrderSummaryCell({
  row,
  onOpen
}: {
  row: OrderFinanceSkuSummaryRow
  onOpen: () => void
}) {
  return (
    <button className="order-finance-order-summary-button" type="button" onClick={onOpen}>
      <Space direction="vertical" size={4}>
        <Space size={6}>
          <Text type="secondary">订单</Text>
          <Text strong>{row.orderCount}</Text>
        </Space>
        <Space size={6}>
          <Text type="secondary">商品行</Text>
          <Text strong>{row.itemCount}</Text>
        </Space>
        <Space size={6}>
          <Text type="secondary">后续更新</Text>
          {row.orderUpdateRowCount ? <Tag color="orange">{row.orderUpdateRowCount}</Tag> : <Text strong>0</Text>}
        </Space>
        <Tag color="blue">{row.currency || '未知'}</Tag>
        <Text className="order-finance-order-summary-action" type="secondary">
          查看订单明细
        </Text>
      </Space>
    </button>
  )
}

export function OrderFinanceDataStatusBar({
  dataStatus,
  store,
  query
}: {
  dataStatus?: OrderFinanceSkuSummaryView['dataStatus']
  store?: AuthSessionStore | null
  query?: OrderFinanceQuery | null
}) {
  if (!dataStatus) {
    return null
  }
  const status = dataStatus.latestSyncStatus || dataStatus.lastSyncStatus || dataStatus.status
  return (
    <Card size="small" variant="borderless" style={{ boxShadow: 'none' }}>
      <Space className="order-finance-status-bar" wrap>
        <Text type="secondary">当前站点</Text>
        <Tag>{store?.projectName || store?.projectCode || store?.storeCode || '-'}</Tag>
        <Tag color="blue">{query?.siteCode || store?.site || '-'}</Tag>
        <Text type="secondary">最后同步状态</Text>
        {status ? <Tag color={statusColor(status)}>{status}</Tag> : <Text>-</Text>}
        <Text type="secondary">最新交易日</Text>
        <Text>{dataStatus.latestTransactionDate || '-'}</Text>
        <Text type="secondary">PSKU 缺失</Text>
        {(dataStatus.missingPartnerSkuRowCount || 0) > 0 ? (
          <Tag color="warning">{dataStatus.missingPartnerSkuRowCount} 待映射</Tag>
        ) : (
          <Text>0</Text>
        )}
      </Space>
    </Card>
  )
}
