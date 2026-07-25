import { LinkOutlined, PictureOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons'
import { Button, Checkbox, Empty, Input, Modal, Select, Space, Tabs, Tag, Typography, Upload } from 'antd'
import { AssetDetailModal } from './ProductImageAssetPreview'
import { SystemImage } from './ProductImageSystemImage'
import { acceptedImageTypes, imageRoleLabel } from './productImageProfileConstants'
import type { ImageRole, ProfileAsset } from './productImageProfileTypes'
import type { ProductImageProcessingStatus } from './api'

const { Text } = Typography
const { TextArea } = Input

type RoleOption = { disabled?: boolean; label: string; value: ImageRole }

type ProductImageAssetDialogsProps = {
  assetImportOpen: boolean
  assetImportTab: 'url' | 'link' | 'upload'
  assetUrlText: string
  availableReuseRoleOptions: RoleOption[]
  collectingSourceLink: boolean
  importingAssetUrls: boolean
  previewAsset: ProfileAsset | null
  processingAsset: ProfileAsset | null
  processingNote: string
  processingStatus: ProductImageProcessingStatus
  requestOwnerId: number
  reuseAsset: ProfileAsset | null
  reuseRoles: ImageRole[]
  savingAssetWorkflow: boolean
  selectedSourceCandidates: Set<string>
  sourceCandidates: string[]
  sourceCollectionStatus?: string
  sourceLinkUrl: string
  storeCode: string
  productMasterId?: number
  uploading: boolean
  onCloseImport: () => void
  onClosePreview: () => void
  onCloseProcessing: () => void
  onCloseReuse: () => void
  onCollectSource: () => void
  onImportSelected: () => void
  onImportUrls: () => void
  onRefreshSource: () => void
  onSaveProcessing: () => void
  onSaveReuse: () => void
  onSelectImportTab: (tab: 'url' | 'link' | 'upload') => void
  onSetAssetUrlText: (value: string) => void
  onSetProcessingNote: (value: string) => void
  onSetProcessingStatus: (status: ProductImageProcessingStatus) => void
  onSetReuseRoles: (roles: ImageRole[]) => void
  onToggleCandidate: (imageUrl: string, checked: boolean) => void
  onUpdateSourceLink: (value: string) => void
  onUpload: (file: File) => void
}

export function ProductImageAssetDialogs(props: ProductImageAssetDialogsProps) {
  const {
    assetImportOpen, assetImportTab, assetUrlText, availableReuseRoleOptions,
    collectingSourceLink, importingAssetUrls, previewAsset, processingAsset,
    processingNote, processingStatus, requestOwnerId, reuseAsset, reuseRoles,
    savingAssetWorkflow, selectedSourceCandidates, sourceCandidates,
    sourceCollectionStatus, sourceLinkUrl, storeCode, productMasterId, uploading
  } = props

  return (
    <>
      <Modal
        open={Boolean(reuseAsset)}
        title="复用图片"
        okText="确认复用"
        cancelText="取消"
        okButtonProps={{
          disabled: !reuseRoles.length || !availableReuseRoleOptions.length,
          loading: savingAssetWorkflow
        }}
        onCancel={props.onCloseReuse}
        onOk={props.onSaveReuse}
      >
        <div className="product-image-profile-workflow-modal">
          <Text>当前用途：{reuseAsset ? imageRoleLabel[reuseAsset.imageRole] : '-'}</Text>
          <Text type="secondary">复用只增加用途，不会复制或重新上传图片文件。</Text>
          <label>
            <span>新增用途</span>
            <Select
              mode="multiple"
              options={availableReuseRoleOptions}
              placeholder={availableReuseRoleOptions.length ? '可多选' : '这张图已用于全部分类'}
              value={reuseRoles}
              onChange={props.onSetReuseRoles}
            />
          </label>
        </div>
      </Modal>
      <Modal
        open={Boolean(processingAsset)}
        title="图片处理意见"
        okText="保存"
        cancelText="取消"
        okButtonProps={{ loading: savingAssetWorkflow }}
        onCancel={props.onCloseProcessing}
        onOk={props.onSaveProcessing}
      >
        <div className="product-image-profile-workflow-modal">
          <Text>图片用途：{processingAsset ? imageRoleLabel[processingAsset.imageRole] : '-'}</Text>
          <label>
            <span>处理意见</span>
            <TextArea
              autoSize={{ minRows: 4, maxRows: 8 }}
              maxLength={1000}
              placeholder="例如：裁掉水印、补白底、调整为竖版构图"
              value={processingNote}
              onChange={(event) => props.onSetProcessingNote(event.target.value)}
            />
          </label>
          <Checkbox
            checked={processingStatus === 'PROCESSED'}
            onChange={(event) => props.onSetProcessingStatus(
              event.target.checked ? 'PROCESSED' : 'PENDING'
            )}
          >
            标记为已处理
          </Checkbox>
        </div>
      </Modal>
      <Modal
        className="product-image-profile-asset-import-modal"
        footer={null}
        onCancel={props.onCloseImport}
        open={assetImportOpen}
        title="添加基础图"
        width="min(760px, calc(100vw - 32px))"
      >
        <Tabs
          activeKey={assetImportTab}
          onChange={(key) => props.onSelectImportTab(key as 'url' | 'link' | 'upload')}
          items={[
            {
              key: 'url',
              label: '图片 URL',
              children: (
                <div className="product-image-profile-import-panel">
                  <TextArea
                    autoSize={{ minRows: 5, maxRows: 8 }}
                    value={assetUrlText}
                    placeholder="图片 URL，一行一个"
                    onChange={(event) => props.onSetAssetUrlText(event.target.value)}
                  />
                  <div className="product-image-profile-import-actions">
                    <Button
                      type="primary"
                      loading={importingAssetUrls}
                      onClick={props.onImportUrls}
                    >
                      加入基础图
                    </Button>
                  </div>
                </div>
              )
            },
            {
              key: 'link',
              label: '商品链接',
              children: (
                <div className="product-image-profile-import-panel">
                  <Space.Compact className="product-image-profile-source-input">
                    <Input
                      prefix={<LinkOutlined />}
                      value={sourceLinkUrl}
                      placeholder="Amazon / noon 商品详情链接"
                      onChange={(event) => props.onUpdateSourceLink(event.target.value)}
                    />
                    <Button loading={collectingSourceLink} type="primary" onClick={props.onCollectSource}>
                      采集
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      loading={collectingSourceLink}
                      onClick={props.onRefreshSource}
                    />
                  </Space.Compact>
                  <div className="product-image-profile-source-status">
                    {sourceCollectionStatus ? <Tag>{sourceCollectionStatus}</Tag> : null}
                    <Text type="secondary">已选 {selectedSourceCandidates.size} 张</Text>
                    <Button
                      disabled={!selectedSourceCandidates.size}
                      loading={importingAssetUrls}
                      type="primary"
                      onClick={props.onImportSelected}
                    >
                      加入基础图
                    </Button>
                  </div>
                  {sourceCandidates.length ? (
                    <div className="product-image-profile-candidate-grid">
                      {sourceCandidates.map((imageUrl, index) => {
                        const checked = selectedSourceCandidates.has(imageUrl)
                        return (
                          <div
                            aria-pressed={checked}
                            className={`product-image-profile-candidate-card${checked ? ' is-selected' : ''}`}
                            key={imageUrl}
                            role="button"
                            tabIndex={0}
                            onClick={() => props.onToggleCandidate(imageUrl, !checked)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                props.onToggleCandidate(imageUrl, !checked)
                              }
                            }}
                          >
                            <SystemImage
                              src={imageUrl}
                              alt={`候选图 ${index + 1}`}
                              fallback={<PictureOutlined />}
                            />
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无候选图" />
                  )}
                </div>
              )
            },
            {
              key: 'upload',
              label: '直接上传',
              children: (
                <div className="product-image-profile-import-panel">
                  <Upload
                    accept={acceptedImageTypes.join(',')}
                    beforeUpload={(file) => {
                      props.onUpload(file)
                      return Upload.LIST_IGNORE
                    }}
                    multiple
                    showUploadList={false}
                  >
                    <Button icon={<UploadOutlined />} loading={uploading} type="primary">
                      选择图片
                    </Button>
                  </Upload>
                </div>
              )
            }
          ]}
        />
      </Modal>
      <AssetDetailModal
        asset={previewAsset}
        metadataContext={{ ownerUserId: requestOwnerId, productMasterId, storeCode }}
        onClose={props.onClosePreview}
      />
    </>
  )
}
