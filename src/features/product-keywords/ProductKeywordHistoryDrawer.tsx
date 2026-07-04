import { Drawer } from 'antd'
import { ProductKeywordHistorySection } from './ProductKeywordHistorySection'

type ProductKeywordHistoryDrawerProps = {
  open: boolean
  onClose: () => void
  storeCode?: string
  siteCode?: string
  partnerSku?: string
}

export function ProductKeywordHistoryDrawer({
  open,
  onClose,
  storeCode,
  siteCode,
  partnerSku
}: ProductKeywordHistoryDrawerProps) {
  return (
    <Drawer
      title="关键词历史"
      open={open}
      onClose={onClose}
      width={720}
      destroyOnClose
    >
      <ProductKeywordHistorySection
        storeCode={storeCode}
        siteCode={siteCode}
        partnerSku={partnerSku}
      />
    </Drawer>
  )
}
