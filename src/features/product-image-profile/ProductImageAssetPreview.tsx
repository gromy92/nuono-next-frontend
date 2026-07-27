import { EyeOutlined, PictureOutlined } from '@ant-design/icons'
import { Empty, Modal } from 'antd'
import type { CSSProperties } from 'react'
import { formatImageSize, metadataFallbackText, profileCoverAsset } from './productImageAssetModel'
import { imageRoleLabel } from './productImageProfileConstants'
import type { ProductImageProfile, ProfileAsset } from './productImageProfileTypes'
import { SystemImage, useAssetPreviewDetail, useNearViewportEnabled, type AssetMetadataContext } from './ProductImageSystemImage'

export function AssetDetailModal({
  asset,
  metadataContext,
  onClose
}: {
  asset: ProfileAsset | null
  metadataContext: AssetMetadataContext
  onClose: () => void
}) {
  const detail = useAssetPreviewDetail(asset, metadataContext)
  const dimensionText = detail.width && detail.height ? `${detail.width} x ${detail.height} px` : metadataFallbackText(detail.loading)
  const sizeText = typeof detail.sizeBytes === 'number' ? formatImageSize(detail.sizeBytes) : metadataFallbackText(detail.loading)
  const contentTypeText = detail.contentType || metadataFallbackText(detail.loading)

  return (
    <Modal
      className="product-image-profile-asset-detail-modal"
      footer={null}
      onCancel={onClose}
      open={Boolean(asset)}
      title="图片详情"
      width={880}
    >
      <div className="product-image-profile-asset-detail">
        <div className="product-image-profile-asset-detail-preview">
          {detail.previewUrl ? (
            <img src={detail.previewUrl} alt="图片详情" />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={detail.error || '图片读取中'} />
          )}
        </div>
        <dl className="product-image-profile-asset-detail-info">
          <div>
            <dt>图片类型</dt>
            <dd>{asset ? imageRoleLabel[asset.imageRole] : '-'}</dd>
          </div>
          <div>
            <dt>图片尺寸</dt>
            <dd>{dimensionText}</dd>
          </div>
          <div>
            <dt>文件大小</dt>
            <dd>{sizeText}</dd>
          </div>
          <div>
            <dt>文件类型</dt>
            <dd>{contentTypeText}</dd>
          </div>
        </dl>
      </div>
    </Modal>
  )
}

export function AssetThumb({
  asset,
  onNaturalSize,
  onPreview
}: {
  asset: ProfileAsset
  onNaturalSize: (asset: ProfileAsset, widthPx: number, heightPx: number) => void
  onPreview: (asset: ProfileAsset) => void
}) {
  const fallback = (
    <>
      <PictureOutlined />
      <span>{imageRoleLabel[asset.imageRole]}</span>
    </>
  )
  return (
    <button
      className={`product-image-profile-asset-thumb${asset.imageUrl ? ' has-image' : ' is-empty'}`}
      disabled={!asset.imageUrl}
      onClick={() => onPreview(asset)}
      style={{ '--asset-accent': asset.accent } as CSSProperties}
      type="button"
    >
      {asset.imageUrl ? (
        <SystemImage
          src={asset.imageUrl}
          alt={asset.title}
          fallback={fallback}
          onNaturalSize={(widthPx, heightPx) => onNaturalSize(asset, widthPx, heightPx)}
        />
      ) : (
        fallback
      )}
      {asset.imageUrl ? <span className="product-image-profile-asset-thumb-action"><EyeOutlined /> 查看</span> : null}
    </button>
  )
}

export function ProductListThumb({ profile }: { profile: ProductImageProfile }) {
  const asset = profileCoverAsset(profile)
  const { enabled, ref } = useNearViewportEnabled()
  return (
    <span className="product-image-profile-product-thumb" ref={ref}>
      {asset?.imageUrl && enabled ? (
        <SystemImage src={asset.imageUrl} alt={profile.pskuCode} fetchPriority="low" />
      ) : (
        <PictureOutlined />
      )}
    </span>
  )
}
