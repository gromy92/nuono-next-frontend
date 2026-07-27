import { CopyOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import type { ProductImageAiPromptSection } from './aiCopyText'
import { AiPromptSectionList } from './ProductImageAiPromptList'
import { ProductImageFactsEditor, type ProductImageFactsValue } from './ProductImageFactsEditor'

export type ProductImageElementsTabProps = {
  aiPromptSections: ProductImageAiPromptSection[]
  extracting: boolean
  facts: ProductImageFactsValue
  profileReady: boolean
  onChangeFacts: (value: ProductImageFactsValue) => void
  onCopyAll: () => void
  onCopySection: (section: ProductImageAiPromptSection) => void
  onExtract: () => void
}

export function ProductImageElementsTab({
  aiPromptSections,
  extracting,
  facts,
  profileReady,
  onChangeFacts,
  onCopyAll,
  onCopySection,
  onExtract
}: ProductImageElementsTabProps) {
  return (
    <div className="product-image-profile-tab-body product-image-profile-elements">
      <div className="product-image-profile-elements-grid">
        <ProductImageFactsEditor
          value={facts}
          disabled={!profileReady}
          extracting={extracting}
          onChange={onChangeFacts}
          onExtract={onExtract}
        />
        <section className="product-image-profile-panel product-image-profile-ai-prompt-panel">
          <div className="product-image-profile-panel-head">
            <strong>最终上图内容</strong>
            <Button size="small" icon={<CopyOutlined />} onClick={onCopyAll}>
              复制全部
            </Button>
          </div>
          <AiPromptSectionList sections={aiPromptSections} onCopy={onCopySection} />
        </section>
      </div>
    </div>
  )
}
