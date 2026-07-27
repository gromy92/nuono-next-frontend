import { Input, Modal, Space, Typography } from 'antd'
import type { ProductImageSuite, ProductImageSuiteAsset } from './productImageProfileTypes'
import { SuitePreviewModal } from './ProductImageSuitePreview'

const { Text } = Typography
const { TextArea } = Input

type ProductImageSuiteDialogsProps = {
  previewAsset: ProductImageSuiteAsset | null
  reviewAssetFeedback: string
  reviewOverallComment: string
  reviewingSuite: ProductImageSuite | null
  submitting: boolean
  onClosePreview: () => void
  onCloseReview: () => void
  onSetReviewAssetFeedback: (comment: string) => void
  onSetReviewOverallComment: (comment: string) => void
  onSubmitReview: () => void
}

export function ProductImageSuiteDialogs({
  previewAsset,
  reviewAssetFeedback,
  reviewOverallComment,
  reviewingSuite,
  submitting,
  onClosePreview,
  onCloseReview,
  onSetReviewAssetFeedback,
  onSetReviewOverallComment,
  onSubmitReview
}: ProductImageSuiteDialogsProps) {
  return (
    <>
      <Modal
        open={Boolean(reviewingSuite)}
        title="审核不通过"
        okText="提交并重新做图"
        cancelText="取消"
        confirmLoading={submitting}
        onCancel={onCloseReview}
        onOk={onSubmitReview}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>逐图修改意见</Text>
            <Text type="secondary">（在对应图片名称后填写；可只填需要修改的图片）</Text>
          </div>
          <TextArea
            maxLength={2000}
            rows={Math.min(12, Math.max(5, (reviewingSuite?.assets.length ?? 0) + 1))}
            showCount
            value={reviewAssetFeedback}
            onChange={(event) => onSetReviewAssetFeedback(event.target.value)}
          />
          <Text strong>整体意见</Text>
          <TextArea
            maxLength={2000}
            placeholder="填写整套图片的统一修改意见"
            rows={4}
            showCount
            value={reviewOverallComment}
            onChange={(event) => onSetReviewOverallComment(event.target.value)}
          />
          <Text type="secondary">
            逐图修改意见和整体意见至少填写一项。只填写整体意见时，将整套重新做图。
          </Text>
        </Space>
      </Modal>
      <SuitePreviewModal asset={previewAsset} onClose={onClosePreview} />
    </>
  )
}
