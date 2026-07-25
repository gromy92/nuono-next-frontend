import { CheckCircleOutlined, CopyOutlined, DeleteOutlined, FileImageOutlined } from '@ant-design/icons'
import { Button, Empty, Input, Popconfirm, Select, Tag, Typography } from 'antd'
import type { OperationsSkinView } from '../operations-skin-management/types'
import { suiteStatusMeta } from './productImageProfileConstants'
import type { ProductImageProfile, ProductImageSuite, ProductImageSuiteAsset } from './productImageProfileTypes'
import { SuiteThumb } from './ProductImageSuitePreview'

const { Text } = Typography
const { TextArea } = Input

export type ProductImageSuitesTabProps = {
  changingAssetId?: string
  creating: boolean
  deletingSuiteId?: string
  profile: ProductImageProfile
  selectedSkinId?: number
  skins: OperationsSkinView[]
  submitting: boolean
  onApprove: (suite: ProductImageSuite) => void
  onCopyDraft: (suite: ProductImageSuite) => void
  onCreate: () => void
  onMoveAsset: (
    suite: ProductImageSuite,
    asset: ProductImageSuiteAsset,
    options: { targetSuiteId?: number; targetIndex?: number }
  ) => void
  onOpenReject: (suite: ProductImageSuite) => void
  onPreviewAsset: (asset: ProductImageSuiteAsset) => void
  onRemoveAsset: (suite: ProductImageSuite, asset: ProductImageSuiteAsset) => void
  onRemoveSuite: (suite: ProductImageSuite) => void
  onRetry: (suite: ProductImageSuite) => void
  onSelectSkin: (skinId: number) => void
}

export function ProductImageSuitesTab({
  changingAssetId,
  creating,
  deletingSuiteId,
  profile,
  selectedSkinId,
  skins,
  submitting,
  onApprove,
  onCopyDraft,
  onCreate,
  onMoveAsset,
  onOpenReject,
  onPreviewAsset,
  onRemoveAsset,
  onRemoveSuite,
  onRetry,
  onSelectSkin
}: ProductImageSuitesTabProps) {
  return (
    <div className="product-image-profile-tab-body">
      <div className="product-image-profile-tab-actions product-image-profile-suite-toolbar">
        <Select
          placeholder="选择皮肤"
          style={{ minWidth: 220 }}
          value={selectedSkinId}
          options={skins.map((skin) => ({ label: skin.skinName, value: skin.id }))}
          onChange={onSelectSkin}
        />
        <Button icon={<FileImageOutlined />} loading={creating} onClick={onCreate}>
          申请做图
        </Button>
      </div>
      {profile.suites.length ? (
        <div className="product-image-profile-suite-list">
          {profile.suites.map((suite) => {
            const status = suiteStatusMeta[suite.suiteStatus]
            const otherSuites = profile.suites.filter(
              (candidate) => candidate.id !== suite.id && candidate.backendId
            )
            return (
              <div className="product-image-profile-suite-card" key={suite.id}>
                <div className="product-image-profile-suite-info">
                  <div>
                    <strong>{suite.suiteName}</strong>
                    <Text type="secondary">{suite.skinName} / {suite.createdAt}</Text>
                  </div>
                  <Tag color={status.color}>{status.label}</Tag>
                </div>
                {suite.assets.length ? (
                  <div className="product-image-profile-suite-assets">
                    {suite.assets.map((asset, assetIndex) => (
                      <SuiteThumb
                        asset={asset}
                        canMoveDown={assetIndex < suite.assets.length - 1}
                        canMoveUp={assetIndex > 0}
                        key={asset.id}
                        moving={changingAssetId === asset.id}
                        onMove={(direction) => onMoveAsset(suite, asset, {
                          targetIndex: assetIndex + direction
                        })}
                        onMoveToSuite={(targetSuiteId) => onMoveAsset(suite, asset, { targetSuiteId })}
                        onPreview={onPreviewAsset}
                        onRemove={() => onRemoveAsset(suite, asset)}
                        otherSuites={otherSuites}
                      />
                    ))}
                  </div>
                ) : suite.draftPromptText ? (
                  <TextArea
                    className="product-image-profile-suite-draft-textarea"
                    readOnly
                    autoSize={{ minRows: 8, maxRows: 14 }}
                    value={suite.draftPromptText}
                  />
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无套图图片" />
                )}
                {suite.reviewComment ? <Text type="secondary">审核意见：{suite.reviewComment}</Text> : null}
                {suite.failureReason ? <Text type="danger">失败原因：{suite.failureReason}</Text> : null}
                <div className="product-image-profile-suite-actions">
                  {suite.draftPromptText ? (
                    <Button icon={<CopyOutlined />} onClick={() => onCopyDraft(suite)}>复制草稿</Button>
                  ) : null}
                  {suite.suiteStatus === 'PENDING_REVIEW' || suite.suiteStatus === 'ADOPTED' ? (
                    <>
                      <Button
                        icon={<CheckCircleOutlined />}
                        loading={submitting}
                        type="primary"
                        onClick={() => onApprove(suite)}
                      >
                        审核通过并发布
                      </Button>
                      <Button loading={submitting} onClick={() => onOpenReject(suite)}>不通过</Button>
                    </>
                  ) : null}
                  {suite.suiteStatus === 'FAILED' ? (
                    <Button loading={submitting} onClick={() => onRetry(suite)}>重试</Button>
                  ) : null}
                  {suite.suiteStatus === 'ONLINE' ? (
                    <Text type="secondary">
                      {suite.publishedAt ? `上线时间：${suite.publishedAt}` : 'Noon 已回读确认'}
                    </Text>
                  ) : null}
                  <Popconfirm
                    cancelText="取消"
                    okText="删除"
                    okButtonProps={{ danger: true, loading: deletingSuiteId === suite.id }}
                    title={suite.suiteStatus === 'ADOPTED'
                      ? '当前采用套图也会从资料库删除，确定继续吗？'
                      : '确定删除这套 AI 套图吗？'}
                    onConfirm={() => onRemoveSuite(suite)}
                  >
                    <Button danger icon={<DeleteOutlined />} loading={deletingSuiteId === suite.id}>
                      删除
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="product-image-profile-empty-suite">
          <FileImageOutlined />
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 AI 生成套图" />
        </div>
      )}
    </div>
  )
}
