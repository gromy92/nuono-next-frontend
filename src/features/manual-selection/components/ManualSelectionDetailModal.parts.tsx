import { CopyOutlined } from '@ant-design/icons'
import { Button, Image, Tooltip, Typography, message } from 'antd'
import type { ReactNode } from 'react'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import { MANUAL_SELECTION_IMAGE_FALLBACK } from '../constants'

const { Paragraph, Text } = Typography

export const EMPTY_DETAIL_TEXT = '未采集到'

const KNOWN_CURRENCY_PATTERN = /\b(AED|SAR|USD|EGP|CNY|RMB|EUR|GBP|KWD|QAR|BHD|OMR)\b|[$€£¥]|د\.إ|ر\.س/i

export function displayDetailText(value?: string) {
  return value && value.trim() ? value : EMPTY_DETAIL_TEXT
}

export function DetailSection(props: { title: string; children: ReactNode }) {
  return (
    <section className="manual-selection-detail-section">
      <div className="manual-selection-detail-section-title">{props.title}</div>
      {props.children}
    </section>
  )
}

export function DetailPanelGrid(props: { children: ReactNode }) {
  return (
    <div className="manual-selection-detail-panel-grid">{props.children}</div>
  )
}

export function DetailPanel(props: {
  label: string
  children: ReactNode
  rtl?: boolean
}) {
  return (
    <div className={`manual-selection-detail-panel${props.rtl ? ' is-rtl' : ''}`}>
      <div className="manual-selection-detail-panel-label">{props.label}</div>
      <div className="manual-selection-detail-panel-body">{props.children}</div>
    </div>
  )
}

export function DetailMetric(props: { label: string; value?: ReactNode }) {
  const isMissing = props.value === undefined || props.value === null || String(props.value).trim() === ''
  return (
    <div className="manual-selection-detail-metric">
      <span className="manual-selection-detail-metric-label">{props.label}</span>
      <span className={`manual-selection-detail-metric-value${isMissing ? ' is-missing' : ''}`}>
        {isMissing ? EMPTY_DETAIL_TEXT : props.value}
      </span>
    </div>
  )
}

export function detailCompleteness(record: ProductSelectionSourceCollection) {
  const total = record.collectedFieldTotal || (['Amazon', 'Noon', 'SHEIN'].includes(record.sourcePlatform) ? 15 : 8)
  const count = Math.min(Math.max(record.collectedFieldCount || 0, 0), total)
  return {
    count,
    total,
    percent: total > 0 ? Math.round((count / total) * 100) : 0
  }
}

export function formatPriceSummary(record: ProductSelectionSourceCollection) {
  const price = record.priceSummary?.trim()
  if (!price || KNOWN_CURRENCY_PATTERN.test(price)) {
    return price
  }
  const currency = inferPriceCurrency(record)
  return currency ? `${currency} ${price}` : price
}

export function renderDetailText(value?: string, rtl = false, maxHeight?: number) {
  if (!value || !value.trim()) {
    return <Text type="secondary">{EMPTY_DETAIL_TEXT}</Text>
  }
  return (
    <div
      className={`manual-selection-detail-text${rtl ? ' is-rtl' : ''}`}
      style={{
        maxHeight,
        overflowY: maxHeight ? 'auto' : undefined
      }}
    >
      <Paragraph
        copyable={{ text: value }}
        style={{
          marginBottom: 0,
          overflowWrap: 'anywhere',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {value}
      </Paragraph>
    </div>
  )
}

export function renderDetailItemList(items: string[], rtl = false, maxHeight?: number) {
  if (!items.length) {
    return <Text type="secondary">{EMPTY_DETAIL_TEXT}</Text>
  }
  return (
    <div
      className={`manual-selection-detail-item-list${rtl ? ' is-rtl' : ''}`}
      style={{
        maxHeight,
        overflowY: maxHeight ? 'auto' : undefined
      }}
    >
      {items.map((item, index) => (
        <div
          key={`${item.slice(0, 32)}-${index}`}
          className="manual-selection-detail-item"
          data-testid="manual-selection-detail-summary-item"
        >
          <span className="manual-selection-detail-item-index">{index + 1}</span>
          <Paragraph
            copyable={{ text: item }}
            style={{
              marginBottom: 0,
              overflowWrap: 'anywhere',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {item}
          </Paragraph>
        </div>
      ))}
    </div>
  )
}

export function splitDetailItems(value?: string) {
  const text = value?.trim()
  if (!text) {
    return []
  }
  const normalized = text
    .replace(/\r/g, '\n')
    .replace(/\s*(\[[^\]]{2,80}\]\s*-?)/g, '\n$1')
  const lines = normalized
    .split(/\n+/)
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  if (lines.length > 1) {
    return lines
  }
  return [text]
}

export function legacySellingPointsFromSpecHints(specHints?: string[]) {
  return (specHints || [])
    .filter((item) => item && item.search(/[:：]/) <= 0)
    .slice(0, 8)
}

export function legacySellingPointsFromText(value?: string) {
  const text = value?.trim()
  if (!text?.includes('[')) {
    return []
  }
  return splitDetailItems(text)
    .filter((item) => item.trim().startsWith('['))
    .slice(0, 8)
}

export function renderImages(record: ProductSelectionSourceCollection, sourceTitleCn: string) {
  if (!record.imageUrls?.length) {
    return <Text type="secondary">{EMPTY_DETAIL_TEXT}</Text>
  }
  return (
    <Image.PreviewGroup>
      <div className="manual-selection-detail-image-strip">
        {record.imageUrls.slice(0, 12).map((url, index) => (
          <Image
            key={`${url}-${index}`}
            alt={`${record.sourceTitle || sourceTitleCn || '源头商品'} ${index + 1}`}
            width={72}
            height={72}
            src={url}
            fallback={MANUAL_SELECTION_IMAGE_FALLBACK}
            className="manual-selection-detail-thumb"
          />
        ))}
      </div>
    </Image.PreviewGroup>
  )
}

export function isLikelyChineseTitle(value?: string) {
  const text = value?.trim()
  return Boolean(text && text.length <= 160 && /[\u4e00-\u9fff]/.test(text))
}

export function TitleBlock(props: { label: string; value?: string; href?: string; rtl?: boolean }) {
  const content = displayDetailText(props.value)
  const canCopy = Boolean(props.value)
  const copyTitle = () => {
    if (!props.value) return
    void navigator.clipboard.writeText(props.value).then(
      () => message.success('已复制'),
      () => message.error('复制失败')
    )
  }
  return (
    <div className={`manual-selection-detail-title-block${props.rtl ? ' is-rtl' : ''}`}>
      <div className="manual-selection-detail-title-label">{props.label}</div>
      <div className="manual-selection-detail-title-row">
        <Tooltip title={props.value || ''}>
          <div className={`manual-selection-detail-title-text${props.rtl ? ' is-rtl' : ''}`}>
            {props.href && props.value ? (
              <Typography.Link href={props.href} target="_blank" rel="noreferrer noopener">
                {props.value}
              </Typography.Link>
            ) : (
              content
            )}
          </div>
        </Tooltip>
        {canCopy ? (
          <Button
            aria-label={`复制${props.label}`}
            className="manual-selection-detail-title-copy"
            icon={<CopyOutlined />}
            size="small"
            type="text"
            onClick={copyTitle}
          />
        ) : null}
      </div>
    </div>
  )
}

function inferPriceCurrency(record: ProductSelectionSourceCollection) {
  const sourceUrl = `${record.pageUrl || ''} ${record.sourceUrl || ''}`.toLowerCase()
  if (sourceUrl.includes('amazon.ae') || sourceUrl.includes('/uae-')) {
    return 'AED'
  }
  if (sourceUrl.includes('amazon.sa') || sourceUrl.includes('/saudi-')) {
    return 'SAR'
  }
  if (sourceUrl.includes('amazon.eg') || sourceUrl.includes('/egypt-')) {
    return 'EGP'
  }
  if (sourceUrl.includes('amazon.com')) {
    return 'USD'
  }
  const storeCode = (record.storeCode || '').toLowerCase()
  if (storeCode.includes('-nae') || storeCode.endsWith('-ae')) {
    return 'AED'
  }
  if (storeCode.includes('-ksa') || storeCode.endsWith('-sa')) {
    return 'SAR'
  }
  if (storeCode.endsWith('-eg')) {
    return 'EGP'
  }
  if (record.sourcePlatform === 'Noon') {
    return 'AED'
  }
  return ''
}
