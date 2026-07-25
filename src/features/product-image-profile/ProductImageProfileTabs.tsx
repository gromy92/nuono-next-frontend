import { Tabs } from 'antd'
import { ProductImageAssetsTab, type ProductImageAssetsTabProps } from './ProductImageAssetsTab'
import { ProductImageElementsTab, type ProductImageElementsTabProps } from './ProductImageElementsTab'
import type { ProductImageProfileTabKey } from './productImageProfileTypes'
import { ProductImageSuitesTab, type ProductImageSuitesTabProps } from './ProductImageSuitesTab'

type ProductImageProfileTabsProps = {
  activeKey: ProductImageProfileTabKey
  assets: ProductImageAssetsTabProps
  elements: ProductImageElementsTabProps
  suites: ProductImageSuitesTabProps
  onChange: (key: ProductImageProfileTabKey) => void
}

export function ProductImageProfileTabs({
  activeKey,
  assets,
  elements,
  suites,
  onChange
}: ProductImageProfileTabsProps) {
  return (
    <Tabs
      activeKey={activeKey}
      className="product-image-profile-tabs"
      onChange={(key) => onChange(key as ProductImageProfileTabKey)}
      items={[
        {
          key: 'assets',
          label: '基础图',
          children: activeKey === 'assets' ? <ProductImageAssetsTab {...assets} /> : null
        },
        {
          key: 'elements',
          label: '图片元素',
          children: activeKey === 'elements' ? <ProductImageElementsTab {...elements} /> : null
        },
        {
          key: 'suites',
          label: 'AI 套图',
          children: activeKey === 'suites' ? <ProductImageSuitesTab {...suites} /> : null
        }
      ]}
    />
  )
}
