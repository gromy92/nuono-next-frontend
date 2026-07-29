import { Space, Tooltip, Typography } from 'antd'
import type { CSSProperties, ReactNode } from 'react'
import { ProductImageThumb } from './ProductImageThumb'

const { Text } = Typography

export type ProductBaselineCode = {
  label?: string
  value?: ReactNode
  copyText?: string
}

export type ProductBaselineIdentityProps = {
  title?: ReactNode
  subtitle?: ReactNode
  fallbackTitle?: ReactNode
  imageUrl?: string | null
  imageCount?: number
  imageAlt?: string
  imageWidth?: CSSProperties['width']
  imageDisabled?: boolean
  showImage?: boolean
  onImageClick?: () => void
  codes?: ProductBaselineCode[]
  tags?: ReactNode
  extra?: ReactNode
  titleMaxWidth?: CSSProperties['maxWidth']
  compact?: boolean
}

export function ProductBaselineIdentity({
  title,
  subtitle,
  fallbackTitle = '-',
  imageUrl,
  imageCount,
  imageAlt,
  imageWidth = 72,
  imageDisabled,
  showImage = true,
  onImageClick,
  codes = [],
  tags,
  extra,
  titleMaxWidth = '100%',
  compact = false
}: ProductBaselineIdentityProps) {
  const visibleTitle = title || fallbackTitle
  const visibleSubtitle = subtitle === undefined || subtitle === null || subtitle === '' ? undefined : subtitle
  const visibleImageAlt = imageAlt || (typeof visibleTitle === 'string' ? visibleTitle : '商品图片')
  const visibleCodes = codes.filter((item) => item.value !== undefined && item.value !== null && item.value !== '')

  return (
    <div style={{ display: 'flex', gap: compact ? 8 : 10, alignItems: 'flex-start', minWidth: 0 }}>
      {showImage ? (
        <ProductImageThumb
          src={imageUrl}
          alt={visibleImageAlt}
          imageCount={imageCount}
          width={imageWidth}
          disabled={imageDisabled}
          onClick={
            onImageClick
              ? (event) => {
                event.stopPropagation()
                onImageClick()
              }
              : undefined
          }
        />
      ) : null}
      <Space direction="vertical" size={compact ? 2 : 4} style={{ minWidth: 0, flex: '1 1 auto' }}>
        <Tooltip title={typeof visibleTitle === 'string' ? visibleTitle : undefined}>
          <Text
            strong
            ellipsis
            style={{ maxWidth: titleMaxWidth, fontSize: compact ? 12 : 14, lineHeight: compact ? '18px' : '20px' }}
          >
            {visibleTitle}
          </Text>
        </Tooltip>
        {visibleSubtitle ? (
          <Tooltip title={typeof visibleSubtitle === 'string' ? visibleSubtitle : undefined}>
            <Text
              type="secondary"
              ellipsis
              style={{ maxWidth: titleMaxWidth, fontSize: compact ? 11 : 12, lineHeight: compact ? '16px' : '18px' }}
            >
              {visibleSubtitle}
            </Text>
          </Tooltip>
        ) : null}
        {visibleCodes.length ? (
          <Space size={[6, 2]} wrap>
            {visibleCodes.map((code, index) => (
              <Text
                key={`${code.label || 'code'}-${code.copyText || index}`}
                type="secondary"
                copyable={code.copyText ? { text: code.copyText } : false}
                style={{ fontSize: compact ? 11 : 12, lineHeight: compact ? '16px' : '18px' }}
              >
                {code.label ? (
                  <>
                    {code.label} {code.value}
                  </>
                ) : (
                  code.value
                )}
              </Text>
            ))}
          </Space>
        ) : null}
        {tags ? <Space size={[4, 4]} wrap>{tags}</Space> : null}
        {extra}
      </Space>
    </div>
  )
}
