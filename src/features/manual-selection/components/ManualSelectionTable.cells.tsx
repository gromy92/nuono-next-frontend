import { Badge, Image, Space, Typography } from 'antd'
import type {
  ProductSelectionSourceCollection,
  SourceCollectionStatus
} from '../../source-collection/types'
import { MANUAL_SELECTION_IMAGE_FALLBACK, MANUAL_SELECTION_STATUS_BADGE } from '../constants'
import {
  formatManualSelectionCompleteness,
  manualSelectionSkuCount,
  manualSelectionStatusText
} from '../utils'
import { ManualSelectionAli1688InlineStatus } from './ManualSelectionAli1688Panel'

const { Paragraph, Text } = Typography

export function SourceImageCell({ value, record }: { value?: string; record: ProductSelectionSourceCollection }) {
  return (
    <Image
      alt={record.sourceTitle || record.sourceTitleCn || '源头商品主图'}
      width={72}
      height={72}
      src={value || MANUAL_SELECTION_IMAGE_FALLBACK}
      fallback={MANUAL_SELECTION_IMAGE_FALLBACK}
      style={{ objectFit: 'cover', borderRadius: 6 }}
    />
  )
}

export function SourceTitleCell({ value, record }: { value?: string; record: ProductSelectionSourceCollection }) {
  const sourceUrl = record.pageUrl || record.sourceUrl
  const title = value || '-'
  return (
    <Paragraph
      copyable={title !== '-' ? { text: title } : false}
      ellipsis={{ rows: 5 }}
      style={{ marginBottom: 0, maxWidth: 310 }}
    >
      {sourceUrl ? (
        <Typography.Link href={sourceUrl} target="_blank" rel="noreferrer noopener">
          {title}
        </Typography.Link>
      ) : (
        title
      )}
    </Paragraph>
  )
}

export function CompletenessCell({ record }: { record: ProductSelectionSourceCollection }) {
  const completeness = formatManualSelectionCompleteness(record)
  return (
    <Space direction="vertical" size={2}>
      <Text>{completeness.basics}</Text>
      <Text type="secondary">{completeness.other}</Text>
    </Space>
  )
}

export function SourceStatusCell({
  value,
  record
}: {
  value: SourceCollectionStatus
  record: ProductSelectionSourceCollection
}) {
  return (
    <Space direction="vertical" size={2}>
      <Badge
        status={MANUAL_SELECTION_STATUS_BADGE[value] || 'default'}
        text={record.statusText || manualSelectionStatusText(value)}
      />
      {record.failureMessage ? <Text type="danger">{record.failureMessage}</Text> : null}
    </Space>
  )
}

export function Ali1688StatusCell({ record }: { record: ProductSelectionSourceCollection }) {
  return <ManualSelectionAli1688InlineStatus record={record} />
}

export function SkuCountCell({ record }: { record: ProductSelectionSourceCollection }) {
  return <Text strong>{manualSelectionSkuCount(record)}</Text>
}
