import { Tag, Typography } from 'antd'

const { Text } = Typography

export function ProductDimensionOptionLabel({
  label,
  value,
  usageCount
}: {
  label?: string | null
  value: string
  usageCount?: number | null
}) {
  const visibleLabel = label || value
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0, maxWidth: '100%' }}>
      <Text ellipsis style={{ maxWidth: 280 }}>
        {visibleLabel}
      </Text>
      {label && label !== value ? (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {value}
        </Text>
      ) : null}
      {typeof usageCount === 'number' ? (
        <Tag style={{ marginInlineEnd: 0, fontSize: 11 }}>{usageCount}</Tag>
      ) : null}
    </span>
  )
}
