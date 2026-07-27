import { Button, Space, message } from 'antd'
import {
  canOpenPublishedProductDetail,
  returnFromPublishedProductListing
} from './productListingSuccessNavigation'
import type { ProductListingWorkflowView } from './types'

export function ProductListingPublishedActions({
  workflow
}: {
  workflow: ProductListingWorkflowView
}) {
  if (
    workflow.phase !== 'PUBLISHED' ||
    workflow.writeCertainty !== 'VERIFIED'
  ) {
    return null
  }
  const returnToProducts = (mode: 'list' | 'detail') => {
    if (!returnFromPublishedProductListing(workflow, mode)) {
      message.error('无法保存上架完成状态，请刷新当前页面后重试。')
    }
  }
  return (
    <Space wrap className="product-listing-workflow-action">
      <Button
        type="primary"
        data-testid="product-listing-return-to-products"
        onClick={() => returnToProducts('list')}
      >
        返回商品列表
      </Button>
      <Button
        disabled={!canOpenPublishedProductDetail(workflow)}
        data-testid="product-listing-open-published-product"
        onClick={() => returnToProducts('detail')}
      >
        查看商品
      </Button>
    </Space>
  )
}
