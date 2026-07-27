import { message } from 'antd'
import type { ProductListingReviewReopenIntent } from './useProductListingReviewReopen'

export function completeProductListingReviewReopen(
  intent: ProductListingReviewReopenIntent,
  closeReview: () => void
) {
  closeReview()
  focusProductListingEditor()
  if (intent.kind === 'REVIEW_DRAFT') {
    message.info('旧上架检查已解除，请复核商品资料后再次点击“检查并上架”。')
  } else if (intent.kind === 'EDIT_DRAFT') {
    message.info('旧上架检查已解除，可以继续修改商品资料。')
  }
}

export function focusProductListingEditor() {
  window.setTimeout(() => {
    document
      .querySelector('[data-testid="product-listing-editor"]')
      ?.scrollIntoView({ behavior: 'smooth' })
  }, 0)
}
