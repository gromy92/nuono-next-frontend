import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Badge, Button, Modal, Space, Tag, Typography } from 'antd'
import type { SyntheticEvent } from 'react'
import { useEffect, useState } from 'react'
import type {
  ProductSelectionSourceCollection,
  SourceCollectionStatus
} from '../../source-collection/types'
import { MANUAL_SELECTION_IMAGE_FALLBACK, MANUAL_SELECTION_STATUS_BADGE } from '../constants'
import {
  formatManualSelectionCompleteness,
  manualSelectionCollectionSourceLabel,
  manualSelectionImageCandidates,
  manualSelectionStatusText
} from '../utils'
import { ManualSelectionAli1688InlineStatus } from './ManualSelectionAli1688Panel'

const { Text } = Typography

export function SourceImageCell({ value, record }: { value?: string; record: ProductSelectionSourceCollection }) {
  const candidates = manualSelectionImageCandidates(record, value)
  const candidatesKey = candidates.join('\n')
  const galleryImages = candidates.length ? candidates : [MANUAL_SELECTION_IMAGE_FALLBACK]
  const [candidateIndex, setCandidateIndex] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const sourceUrl = candidates[candidateIndex] || MANUAL_SELECTION_IMAGE_FALLBACK
  const activeGalleryImage = galleryImages[galleryIndex] || MANUAL_SELECTION_IMAGE_FALLBACK

  useEffect(() => {
    setCandidateIndex(0)
    setGalleryIndex(0)
  }, [candidatesKey])

  const openGallery = () => {
    setGalleryIndex(Math.min(candidateIndex, galleryImages.length - 1))
    setGalleryOpen(true)
  }
  const goPrevious = () => {
    setGalleryIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length)
  }
  const goNext = () => {
    setGalleryIndex((current) => (current + 1) % galleryImages.length)
  }
  const replaceWithFallback = (event: SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.src !== MANUAL_SELECTION_IMAGE_FALLBACK) {
      event.currentTarget.src = MANUAL_SELECTION_IMAGE_FALLBACK
    }
  }

  return (
    <>
      <button
        type="button"
        className="manual-selection-source-image"
        aria-label={`查看商品图片画廊，${galleryImages.length}张`}
        onClick={openGallery}
      >
        <img
          alt={record.sourceTitle || record.sourceTitleCn || '源头商品主图'}
          src={sourceUrl}
          referrerPolicy="no-referrer"
          onError={() => {
            setCandidateIndex((current) => (
              current + 1 < candidates.length ? current + 1 : current
            ))
          }}
        />
        {galleryImages.length > 1 ? <span className="manual-selection-source-image-count">{galleryImages.length}张</span> : null}
      </button>
      <Modal
        className="manual-selection-source-gallery-modal"
        open={galleryOpen}
        footer={null}
        width={920}
        centered
        destroyOnClose
        onCancel={() => setGalleryOpen(false)}
      >
        <div className="manual-selection-source-gallery" data-testid="manual-selection-source-gallery">
          <div className="manual-selection-source-gallery-main">
            <img
              src={activeGalleryImage}
              alt={`商品图 ${galleryIndex + 1}`}
              referrerPolicy="no-referrer"
              onError={replaceWithFallback}
            />
          </div>
          <div className="manual-selection-source-gallery-meta">
            <Text className="manual-selection-source-gallery-count">
              第 {galleryIndex + 1} / {galleryImages.length} 张
            </Text>
            <Space size={12}>
              <Button
                shape="circle"
                aria-label="上一张"
                title="上一张"
                icon={<LeftOutlined />}
                disabled={galleryImages.length <= 1}
                onClick={goPrevious}
              />
              <Button
                shape="circle"
                aria-label="下一张"
                title="下一张"
                icon={<RightOutlined />}
                disabled={galleryImages.length <= 1}
                onClick={goNext}
              />
            </Space>
          </div>
          <div className="manual-selection-source-gallery-thumbs">
            {galleryImages.map((imageUrl, index) => (
              <button
                key={`${imageUrl}-${index}`}
                type="button"
                className={`manual-selection-source-gallery-thumb${index === galleryIndex ? ' is-active' : ''}`}
                aria-label={`查看第 ${index + 1} 张`}
                onClick={() => setGalleryIndex(index)}
              >
                <img
                  src={imageUrl}
                  alt={`商品缩略图 ${index + 1}`}
                  referrerPolicy="no-referrer"
                  onError={replaceWithFallback}
                />
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  )
}

export function SourceChannelCell({ record }: { record: ProductSelectionSourceCollection }) {
  return (
    <div className="manual-selection-source-channel-cell">
      <SourceImageCell value={record.sourceImageUrl} record={record} />
      <Text className="manual-selection-source-channel-name" title={record.sourcePlatform || undefined}>
        {record.sourcePlatform || '-'}
      </Text>
    </div>
  )
}

export function SourceTitleCell({ value, record }: { value?: string; record: ProductSelectionSourceCollection }) {
  const sourceUrl = record.pageUrl || record.sourceUrl
  const title = value || '-'
  return (
    <div className="manual-selection-source-title-cell" title={title !== '-' ? title : undefined}>
      <span className="manual-selection-source-title-text">
        {sourceUrl ? (
          <Typography.Link href={sourceUrl} target="_blank" rel="noreferrer noopener">
            {title}
          </Typography.Link>
        ) : title}
      </span>
      {title !== '-' ? <Text className="manual-selection-source-title-copy" copyable={{ text: title }} /> : null}
    </div>
  )
}

export function SourceChineseTitleCell({ value, record }: { value?: string; record: ProductSelectionSourceCollection }) {
  const title = value || record.selectedText || '-'
  return (
    <div className="manual-selection-source-cn-cell" title={title !== '-' ? title : undefined}>
      <span className="manual-selection-source-cn-text">{title}</span>
    </div>
  )
}

export function SourceNameCell({ record }: { record: ProductSelectionSourceCollection }) {
  return (
    <div className="manual-selection-source-name-cell">
      <SourceTitleCell value={record.sourceTitle} record={record} />
      <SourceChineseTitleCell value={record.sourceTitleCn} record={record} />
    </div>
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
      <Tag
        className="manual-selection-collection-source-tag"
        color={manualSelectionCollectionSourceLabel(record) === '插件' ? 'purple' : 'blue'}
        data-testid="manual-selection-collection-source"
      >
        {manualSelectionCollectionSourceLabel(record)}
      </Tag>
      {record.failureMessage ? <Text type="danger">{record.failureMessage}</Text> : null}
    </Space>
  )
}

export function Ali1688StatusCell({ record }: { record: ProductSelectionSourceCollection }) {
  return <ManualSelectionAli1688InlineStatus record={record} />
}
