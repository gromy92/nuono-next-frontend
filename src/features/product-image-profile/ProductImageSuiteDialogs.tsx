import { Checkbox, Input, Modal, Space, Typography } from 'antd'
import { suiteAssetRoleLabel } from './productImageProfileConstants'
import type { ProductImageSuite, ProductImageSuiteAsset } from './productImageProfileTypes'
import { SuitePreviewModal } from './ProductImageSuitePreview'

const { Text } = Typography
const { TextArea } = Input

type ProductImageSuiteDialogsProps = {
  previewAsset: ProductImageSuiteAsset | null
  reviewAssetIds: Set<number>
  reviewComment: string
  reviewingSuite: ProductImageSuite | null
  reviewWholeSuite: boolean
  submitting: boolean
  onClosePreview: () => void
  onCloseReview: () => void
  onSetReviewAssetIds: (ids: Set<number>) => void
  onSetReviewComment: (comment: string) => void
  onSetReviewWholeSuite: (wholeSuite: boolean) => void
  onSubmitReview: () => void
}

export function ProductImageSuiteDialogs({
  previewAsset,
  reviewAssetIds,
  reviewComment,
  reviewingSuite,
  reviewWholeSuite,
  submitting,
  onClosePreview,
  onCloseReview,
  onSetReviewAssetIds,
  onSetReviewComment,
  onSetReviewWholeSuite,
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
          <TextArea
            maxLength={2000}
            placeholder="填写整套图的审核意见（必填）"
            rows={4}
            showCount
            value={reviewComment}
            onChange={(event) => onSetReviewComment(event.target.value)}
          />
          <Checkbox
            checked={reviewWholeSuite}
            onChange={(event) => {
              onSetReviewWholeSuite(event.target.checked)
              if (event.target.checked) onSetReviewAssetIds(new Set())
            }}
          >
            整套重做
          </Checkbox>
          {!reviewWholeSuite ? (
            <div>
              <Text type="secondary">选择需要重做的图片：</Text>
              <Space direction="vertical" style={{ display: 'flex', marginTop: 8 }}>
                {(reviewingSuite?.assets ?? []).map((asset) => (
                  <Checkbox
                    checked={Boolean(asset.backendId && reviewAssetIds.has(asset.backendId))}
                    disabled={!asset.backendId}
                    key={asset.id}
                    onChange={(event) => {
                      if (!asset.backendId) return
                      const next = new Set(reviewAssetIds)
                      if (event.target.checked) next.add(asset.backendId)
                      else next.delete(asset.backendId)
                      onSetReviewAssetIds(next)
                    }}
                  >
                    {suiteAssetRoleLabel[asset.imageRole]}{asset.roleOrdinal}
                  </Checkbox>
                ))}
              </Space>
            </div>
          ) : null}
        </Space>
      </Modal>
      <SuitePreviewModal asset={previewAsset} onClose={onClosePreview} />
    </>
  )
}
