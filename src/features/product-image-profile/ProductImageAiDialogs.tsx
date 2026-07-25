import { CopyOutlined } from '@ant-design/icons'
import { Button, Modal, Space, Tag, Typography } from 'antd'
import type { ProductImageAiPromptSection } from './aiCopyText'
import {
  currentProductImageAiFieldValue,
  productImageAiSuggestionFields,
  suggestedProductImageAiFieldValue,
  type ProductImageAiSuggestionFieldKey
} from './aiExtractionDiff'
import type { ProductImageAiExtractionSuggestionView } from './api'
import { AiPromptSectionList } from './ProductImageAiPromptList'
import type { ProductImageProfile } from './productImageProfileTypes'

const { Text } = Typography

type ProductImageAiDialogsProps = {
  aiCopyModalOpen: boolean
  aiPromptSections: ProductImageAiPromptSection[]
  decisions: Partial<Record<ProductImageAiSuggestionFieldKey, 'accepted' | 'ignored'>>
  profile: ProductImageProfile
  suggestion: ProductImageAiExtractionSuggestionView | null
  onAcceptAll: () => void
  onAcceptField: (field: ProductImageAiSuggestionFieldKey) => void
  onCloseCopy: () => void
  onCloseSuggestion: () => void
  onCopyAll: () => void
  onCopySection: (section: ProductImageAiPromptSection) => void
  onIgnoreField: (field: ProductImageAiSuggestionFieldKey) => void
}

export function ProductImageAiDialogs({
  aiCopyModalOpen,
  aiPromptSections,
  decisions,
  profile,
  suggestion,
  onAcceptAll,
  onAcceptField,
  onCloseCopy,
  onCloseSuggestion,
  onCopyAll,
  onCopySection,
  onIgnoreField
}: ProductImageAiDialogsProps) {
  return (
    <>
      <Modal
        open={Boolean(suggestion)}
        title="AI 提取建议"
        width="min(980px, calc(100vw - 32px))"
        onCancel={onCloseSuggestion}
        footer={[
          <Button key="close" onClick={onCloseSuggestion}>关闭</Button>,
          <Button key="accept-all" type="primary" onClick={onAcceptAll}>全部接受</Button>
        ]}
      >
        <div className="product-image-profile-ai-diff">
          <Text type="secondary">AI 建议不会自动覆盖表单；接受后也要点击页面“保存”才会写入后台。</Text>
          {suggestion ? productImageAiSuggestionFields.map((item) => {
            const currentValue = currentProductImageAiFieldValue(profile, item.key)
            const suggestedValue = suggestedProductImageAiFieldValue(suggestion, item.key)
            const decision = decisions[item.key]
            return (
              <section
                className={`product-image-profile-ai-diff-row${decision ? ` is-${decision}` : ''}`}
                key={item.key}
              >
                <div className="product-image-profile-ai-diff-row-head">
                  <strong>{item.label}</strong>
                  {decision ? (
                    <Tag color={decision === 'accepted' ? 'success' : 'default'}>
                      {decision === 'accepted' ? '已接受' : '已忽略'}
                    </Tag>
                  ) : null}
                </div>
                <div className="product-image-profile-ai-diff-values">
                  <div>
                    <Text type="secondary">当前值</Text>
                    <pre>{currentValue || '（空）'}</pre>
                  </div>
                  <div>
                    <Text type="secondary">AI 建议值</Text>
                    <pre>{suggestedValue || '（空）'}</pre>
                  </div>
                </div>
                <Space>
                  <Button
                    disabled={!suggestedValue || Boolean(decision)}
                    size="small"
                    type="primary"
                    onClick={() => onAcceptField(item.key)}
                  >
                    接受
                  </Button>
                  <Button
                    disabled={Boolean(decision)}
                    size="small"
                    onClick={() => onIgnoreField(item.key)}
                  >
                    忽略
                  </Button>
                </Space>
              </section>
            )
          }) : null}
        </div>
      </Modal>
      <Modal
        onCancel={onCloseCopy}
        open={aiCopyModalOpen}
        title="AI 指令预览"
        width="min(760px, calc(100vw - 32px))"
        footer={[
          <Button key="close" onClick={onCloseCopy}>关闭</Button>,
          <Button key="copy" icon={<CopyOutlined />} type="primary" onClick={onCopyAll}>
            复制文案
          </Button>
        ]}
      >
        <AiPromptSectionList sections={aiPromptSections} onCopy={onCopySection} compact />
      </Modal>
    </>
  )
}
