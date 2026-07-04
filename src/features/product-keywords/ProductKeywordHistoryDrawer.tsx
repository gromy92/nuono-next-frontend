import { Drawer } from 'antd'
import { ProductKeywordHistorySection } from './ProductKeywordHistorySection'

type ProductKeywordHistoryDrawerProps = {
  open: boolean
  onClose: () => void
  storeCode?: string
  siteCode?: string
  partnerSku?: string
  keywordNorm?: string
  title?: string
}

export function ProductKeywordHistoryDrawer({
  open,
  onClose,
  storeCode,
  siteCode,
  partnerSku,
  keywordNorm,
  title
}: ProductKeywordHistoryDrawerProps) {
  return (
    <Drawer
      title={title || '关键词历史'}
      open={open}
      onClose={onClose}
      width={720}
      destroyOnClose
    >
      <ProductKeywordHistorySection
        storeCode={storeCode}
        siteCode={siteCode}
        partnerSku={partnerSku}
        keywordNorm={keywordNorm}
      />
    </Drawer>
  )
}
