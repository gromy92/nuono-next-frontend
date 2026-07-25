import { CopyOutlined } from '@ant-design/icons'
import { Button, Input, Typography } from 'antd'
import type { ProductImageAiPromptSection } from './aiCopyText'

const { Text } = Typography
const { TextArea } = Input

export function AiPromptSectionList({
  compact = false,
  onCopy,
  sections
}: {
  compact?: boolean
  onCopy: (section: ProductImageAiPromptSection) => void
  sections: ProductImageAiPromptSection[]
}) {
  return (
    <div className={`product-image-profile-ai-prompt-sections${compact ? ' is-compact' : ''}`}>
      {sections.map((section) => {
        const lines = section.text.split('\n')
        const technicalStart = section.key === 'OVERALL'
          ? 0
          : lines.findIndex((line) => line.trim().startsWith('- 画面：'))
        const copyText = technicalStart === 0
          ? '无直接上图文案'
          : lines.slice(0, technicalStart < 0 ? lines.length : technicalStart).join('\n')
        const technicalText = technicalStart < 0 ? '' : lines.slice(technicalStart).join('\n')
        return <section className="product-image-profile-ai-prompt-section" key={section.key}>
          <div className="product-image-profile-ai-prompt-section-head">
            <div>
              <strong>{section.title}</strong>
              <Text type="secondary">{section.subtitle}</Text>
            </div>
            <Button icon={<CopyOutlined />} size="small" type="text" onClick={() => onCopy(section)}>
              复制
            </Button>
          </div>
          <pre className="product-image-profile-ai-copy-preview">{copyText}</pre>
          {technicalText ? (
            <details className="product-image-profile-ai-advanced">
              <summary>高级生成要求</summary>
              <TextArea
                className="product-image-profile-ai-prompt-section-textarea"
                readOnly
                autoSize={{ minRows: compact ? 3 : 4, maxRows: compact ? 8 : 10 }}
                value={technicalText}
              />
            </details>
          ) : null}
        </section>
      })}
    </div>
  )
}
