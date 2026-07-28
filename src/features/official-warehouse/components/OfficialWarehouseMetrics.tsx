import { Typography } from 'antd'

const { Text } = Typography

export function Metric({
  label,
  value,
  tone
}: {
  label: string
  value: number
  tone?: 'green' | 'blue' | 'red'
}) {
  const className = [
    'official-warehouse-metric',
    tone ? `official-warehouse-metric-${tone}` : ''
  ].filter(Boolean).join(' ')
  return (
    <div className={className}>
      <span className="official-warehouse-metric-label">{label}:</span>
      <span className="official-warehouse-metric-value">{value}</span>
    </div>
  )
}

export function InboundReceiptMetric({
  label,
  value,
  tone
}: {
  label: string
  value: number
  tone?: 'green' | 'red' | 'amber' | 'purple'
}) {
  const className = [
    'official-warehouse-inbound-receipt-metric',
    tone ? `official-warehouse-inbound-receipt-metric-${tone}` : ''
  ].filter(Boolean).join(' ')
  return (
    <div className={className}>
      <Text type="secondary">{label}</Text>
      <Text strong>{Number(value || 0).toLocaleString()}</Text>
    </div>
  )
}
