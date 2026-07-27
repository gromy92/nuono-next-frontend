import { Alert, Button, Col, Row, Space, Tag, Typography } from 'antd'
import type { ProductListingAiListingData } from './types'

const { Text } = Typography

type ProductListingAiResultPreviewProps = {
  applied: boolean
  data: ProductListingAiListingData
  generating: boolean
  ready: boolean
  onApply: () => void
}

export function ProductListingAiResultPreview(props: ProductListingAiResultPreviewProps) {
  const { applied, data, generating, onApply, ready } = props
  const qualityScore = data.qualityCheck?.score
  const applyBlocked = generating || !ready

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Space align="center" wrap>
        {typeof qualityScore === 'number' ? (
          <Tag color={scoreColor(qualityScore)} style={{ marginInlineEnd: 0 }}>
            质检 {qualityScore}/100
          </Tag>
        ) : null}
        {stringList(data.keywords?.english).slice(0, 6).map((keyword) => (
          <Tag key={`en-${keyword}`} color="geekblue" style={{ marginInlineEnd: 0 }}>
            {keyword}
          </Tag>
        ))}
        {stringList(data.keywords?.arabic).slice(0, 6).map((keyword) => (
          <Tag key={`ar-${keyword}`} color="cyan" style={{ marginInlineEnd: 0 }}>
            {keyword}
          </Tag>
        ))}
      </Space>

      {generating ? (
        <Alert
          type="info"
          showIcon
          message="正在生成新结果"
          description="下方暂时展示上一次生成结果，完成后会自动更新。"
        />
      ) : null}

      {applied ? (
        <Alert
          type="success"
          showIcon
          message="已填入当前草稿"
          description="英文标题、阿语标题、双语卖点和双语描述已更新；点击页面顶部“保存草稿”后才会写入本地数据库。"
        />
      ) : null}

      <Row gutter={[16, 12]}>
        <Col xs={24} lg={12}>
          <ProductListingAiLanguagePreview
            label="English"
            title={data.noonUploadDraft?.productTitleEn || data.englishListing?.title}
            bullets={data.noonUploadDraft?.productHighlightsEn || data.englishListing?.bullets}
            description={data.noonUploadDraft?.productDescriptionEn || data.englishListing?.longDescription}
          />
        </Col>
        <Col xs={24} lg={12}>
          <ProductListingAiLanguagePreview
            label="Arabic"
            title={data.noonUploadDraft?.productTitleAr || data.arabicListing?.title}
            bullets={data.noonUploadDraft?.productHighlightsAr || data.arabicListing?.bullets}
            description={data.noonUploadDraft?.productDescriptionAr || data.arabicListing?.longDescription}
          />
        </Col>
      </Row>

      <Space align="center" style={{ justifyContent: 'flex-end', width: '100%' }}>
        {generating ? (
          <Text type="secondary">正在生成新结果，完成后可填入</Text>
        ) : applyBlocked ? (
          <Text type="secondary">生成结果校验完成后可填入</Text>
        ) : null}
        <Button type="primary" disabled={applyBlocked} onClick={onApply}>
          {applied ? '重新填入草稿' : '填入草稿'}
        </Button>
      </Space>
    </Space>
  )
}

function ProductListingAiLanguagePreview(props: {
  label: string
  title?: string
  bullets?: string[]
  description?: string
}) {
  const { bullets, description, label, title } = props
  const cleanBullets = stringList(bullets)
  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Text strong style={{ color: 'var(--pm-text-primary)' }}>
        {label}
      </Text>
      <div>
        <Text type="secondary">标题</Text>
        <Typography.Paragraph style={{ marginBottom: 0 }}>{text(title) || '-'}</Typography.Paragraph>
      </div>
      <div>
        <Text type="secondary">卖点</Text>
        {cleanBullets.length ? (
          <ul style={{ margin: '4px 0 0', paddingInlineStart: 18 }}>
            {cleanBullets.map((item, index) => (
              <li key={`${label}-bullet-${index}`} style={{ marginBottom: 4 }}>
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <Typography.Paragraph style={{ marginBottom: 0 }}>-</Typography.Paragraph>
        )}
      </div>
      <div>
        <Text type="secondary">长描述</Text>
        <Typography.Paragraph
          ellipsis={{ rows: 5, expandable: true, symbol: '展开' }}
          style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}
        >
          {text(description) || '-'}
        </Typography.Paragraph>
      </div>
    </Space>
  )
}

function scoreColor(score: number) {
  if (score >= 85) {
    return 'green'
  }
  return score >= 70 ? 'gold' : 'red'
}

function text(value: unknown) {
  return value === null || value === undefined ? '' : String(value)
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.map((item) => text(item).trim()).filter(Boolean) : []
}
