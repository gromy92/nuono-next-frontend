import { CopyOutlined } from '@ant-design/icons'
import { Badge, Button, Popover, Space, Tooltip, Typography, message } from 'antd'
import type { CSSProperties } from 'react'
import { ImageGalleryDisplay } from '../../../shared/components/ImageGalleryDisplay'
import type {
  ProductSelectionSourceCollection,
  SourceCollectionStatus
} from '../../source-collection/types'
import { MANUAL_SELECTION_IMAGE_FALLBACK, MANUAL_SELECTION_STATUS_BADGE } from '../constants'
import {
  formatManualSelectionCollectionDuration,
  formatManualSelectionCollectedAt,
  formatManualSelectionCompleteness,
  getManualSelectionCollectedSpecHints,
  getManualSelectionMissingBasicFields,
  manualSelectionSkuCount,
  manualSelectionStatusText
} from '../utils'
import { ManualSelectionAli1688InlineStatus } from './ManualSelectionAli1688Panel'

const { Text } = Typography

const SOURCE_TITLE_CLAMP_STYLE: CSSProperties = {
  display: '-webkit-box',
  marginBottom: 0,
  maxWidth: '100%',
  overflow: 'hidden',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  whiteSpace: 'normal',
  wordBreak: 'break-word'
}

const SOURCE_TITLE_ROW_STYLE: CSSProperties = {
  alignItems: 'flex-start',
  display: 'flex',
  gap: 4,
  minWidth: 0
}

const SOURCE_TITLE_TEXT_WRAP_STYLE: CSSProperties = {
  display: 'inline-block',
  flex: '0 1 auto',
  maxWidth: 'calc(100% - 26px)',
  minWidth: 0,
  width: 'fit-content'
}

const SOURCE_TITLE_COPY_STYLE: CSSProperties = {
  flex: '0 0 auto',
  height: 22,
  padding: 0,
  width: 22
}

const SOURCE_NAME_STACK_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 0
}

const COMPLETENESS_INLINE_STYLE: CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'nowrap',
  gap: 10,
  minWidth: 0,
  whiteSpace: 'nowrap'
}

const COLLECTION_STATUS_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 0
}

const COLLECTED_AT_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minWidth: 0,
  whiteSpace: 'nowrap'
}

export function SourceImageCell({ value, record }: { value?: string; record: ProductSelectionSourceCollection }) {
  const galleryUrls = [value || record.sourceImageUrl, ...(record.imageUrls || [])].filter(Boolean) as string[]
  const sourcePlatform = record.sourcePlatform || '-'

  return (
    <ImageGalleryDisplay
      altPrefix={record.sourceTitle || record.sourceTitleCn || '源头商品主图'}
      fallback={MANUAL_SELECTION_IMAGE_FALLBACK}
      getLabel={() => sourcePlatform}
      imageHeight={104}
      imageWidth={104}
      images={galleryUrls.length ? galleryUrls : [MANUAL_SELECTION_IMAGE_FALLBACK]}
      labelTestId="manual-selection-source-platform-tag"
      labelPlacement="below"
      testId="manual-selection-source-image-gallery"
      variant="compact"
      visibleCount={1}
    />
  )
}

function TwoLineNameText(props: {
  children: string
  href?: string
  testId: string
}) {
  const { children, href, testId } = props
  const canCopy = children !== '-'
  const copyText = () => {
    if (!canCopy) return
    void navigator.clipboard.writeText(children).then(
      () => message.success('已复制'),
      () => message.error('复制失败')
    )
  }
  const content = href ? (
    <Typography.Link href={href} target="_blank" rel="noreferrer noopener" style={SOURCE_TITLE_CLAMP_STYLE}>
      {children}
    </Typography.Link>
  ) : (
    <span style={SOURCE_TITLE_CLAMP_STYLE}>{children}</span>
  )

  return (
    <div style={SOURCE_TITLE_ROW_STYLE}>
      <Tooltip title={children}>
        <div data-testid={testId} style={SOURCE_TITLE_TEXT_WRAP_STYLE}>
          {content}
        </div>
      </Tooltip>
      {canCopy ? (
        <Button
          aria-label="复制名称"
          data-testid={`${testId}-copy`}
          icon={<CopyOutlined />}
          size="small"
          style={SOURCE_TITLE_COPY_STYLE}
          type="text"
          onClick={copyText}
        />
      ) : null}
    </div>
  )
}

function CompletenessLines({ record }: { record: ProductSelectionSourceCollection }) {
  const completeness = formatManualSelectionCompleteness(record)
  return (
    <div style={COMPLETENESS_INLINE_STYLE}>
      <Popover content={renderMissingBasicFields(record)} placement="topLeft" trigger="hover">
        <Text data-testid="manual-selection-basic-completeness">{completeness.basics}</Text>
      </Popover>
      <Popover content={renderCollectedSpecHints(record)} placement="topLeft" trigger="hover">
        <Text data-testid="manual-selection-spec-completeness" type="secondary">{completeness.other}</Text>
      </Popover>
    </div>
  )
}

function renderMissingBasicFields(record: ProductSelectionSourceCollection) {
  const missingFields = getManualSelectionMissingBasicFields(record)
  if (!missingFields.length) {
    return <div style={{ maxWidth: 260 }}>基础信息已采集完整。</div>
  }
  return (
    <div style={{ maxWidth: 280 }}>
      <div style={{ color: '#64748b', marginBottom: 6 }}>未采集到</div>
      <ul style={{ margin: 0, paddingInlineStart: 18 }}>
        {missingFields.map((field) => (
          <li key={field}>{field}</li>
        ))}
      </ul>
    </div>
  )
}

function renderCollectedSpecHints(record: ProductSelectionSourceCollection) {
  const specHints = getManualSelectionCollectedSpecHints(record)
  if (!specHints.length) {
    return <div style={{ maxWidth: 260 }}>暂无其他规格。</div>
  }
  return (
    <div style={{ maxHeight: 260, maxWidth: 420, overflowY: 'auto' }}>
      <div style={{ color: '#64748b', marginBottom: 6 }}>已采集到的其他内容</div>
      <ul style={{ margin: 0, paddingInlineStart: 18 }}>
        {specHints.map((hint, index) => (
          <li key={`${hint}-${index}`}>{hint}</li>
        ))}
      </ul>
    </div>
  )
}

function SourceStatusText({
  value,
  record
}: {
  value: SourceCollectionStatus
  record: ProductSelectionSourceCollection
}) {
  const statusText = record.statusText || manualSelectionStatusText(value)
  return <span>{statusText}</span>
}

export function SourceNameCell({ record }: { record: ProductSelectionSourceCollection }) {
  const sourceUrl = record.pageUrl || record.sourceUrl
  const titleEn = record.sourceTitle || '-'
  const titleCn = record.sourceTitleCn || record.selectedText || '-'

  return (
    <div style={SOURCE_NAME_STACK_STYLE}>
      <div>
        <TwoLineNameText href={sourceUrl} testId="manual-selection-source-name-en">
          {titleEn}
        </TwoLineNameText>
      </div>
      <div>
        <TwoLineNameText testId="manual-selection-source-name-cn">
          {titleCn}
        </TwoLineNameText>
      </div>
    </div>
  )
}

export function CompletenessCell({ record }: { record: ProductSelectionSourceCollection }) {
  return (
    <Space direction="vertical" size={0}>
      <CompletenessLines record={record} />
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
        text={<SourceStatusText value={value} record={record} />}
      />
      {record.failureMessage ? <Text type="danger">{record.failureMessage}</Text> : null}
    </Space>
  )
}

export function CollectionStatusCell({ record }: { record: ProductSelectionSourceCollection }) {
  return (
    <div data-testid="manual-selection-collection-status" style={COLLECTION_STATUS_STYLE}>
      <SourceStatusCell value={record.status} record={record} />
      <CompletenessLines record={record} />
    </div>
  )
}

export function CollectedAtCell({
  value,
  record
}: {
  value?: string
  record: ProductSelectionSourceCollection
}) {
  const duration = formatManualSelectionCollectionDuration(record)
  return (
    <div data-testid="manual-selection-collected-at" style={COLLECTED_AT_STYLE}>
      <Text>{formatManualSelectionCollectedAt(value)}</Text>
      {duration ? <Text type="secondary">用时{duration}</Text> : null}
    </div>
  )
}

export function Ali1688StatusCell({ record }: { record: ProductSelectionSourceCollection }) {
  return <ManualSelectionAli1688InlineStatus record={record} />
}

export function SkuCountCell({ record }: { record: ProductSelectionSourceCollection }) {
  return <Text strong>{manualSelectionSkuCount(record)}</Text>
}
