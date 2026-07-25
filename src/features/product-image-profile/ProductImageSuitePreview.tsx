import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EyeOutlined, FileImageOutlined } from '@ant-design/icons'
import { Button, Empty, Modal, Popconfirm, Select, Tooltip } from 'antd'
import type { CSSProperties } from 'react'
import type { ProductImageSuite, ProductImageSuiteAsset } from './productImageProfileTypes'
import { SystemImage, useSystemImagePreviewUrl } from './ProductImageSystemImage'

export function SuitePreviewModal({ asset, onClose }: { asset: ProductImageSuiteAsset | null; onClose: () => void }) {
  const previewUrl = useSystemImagePreviewUrl(asset?.imageUrl)

  return (
    <Modal
      className="product-image-profile-suite-preview-modal"
      footer={null}
      onCancel={onClose}
      open={Boolean(asset)}
      title={asset?.title || 'AI 套图'}
      width="min(920px, calc(100vw - 32px))"
    >
      <div className="product-image-profile-suite-preview">
        {previewUrl ? (
          <img src={previewUrl} alt={asset?.title || 'AI 套图'} />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="图片读取中" />
        )}
      </div>
    </Modal>
  )
}

export function SuiteThumb({
  asset,
  canMoveDown,
  canMoveUp,
  moving,
  onMove,
  onMoveToSuite,
  onPreview,
  onRemove,
  otherSuites
}: {
  asset: ProductImageSuiteAsset
  canMoveDown: boolean
  canMoveUp: boolean
  moving?: boolean
  onMove: (targetIndex: number) => void
  onMoveToSuite: (targetSuiteId: number) => void
  onPreview: (asset: ProductImageSuiteAsset) => void
  onRemove: () => void
  otherSuites: ProductImageSuite[]
}) {
  return (
    <div
      className={`product-image-profile-suite-thumb${asset.imageUrl ? ' has-image' : ''}`}
      style={{ '--asset-accent': asset.accent } as CSSProperties}
    >
      <button
        className="product-image-profile-suite-thumb-preview"
        disabled={!asset.imageUrl || moving}
        onClick={() => onPreview(asset)}
        type="button"
      >
        {asset.imageUrl ? <SystemImage src={asset.imageUrl} alt={asset.title} fallback={<FileImageOutlined />} /> : null}
        <span><EyeOutlined /> {asset.title}</span>
      </button>
      <div className="product-image-profile-suite-thumb-actions">
        <Tooltip title="上移">
          <Button
            disabled={!canMoveUp || moving}
            icon={<ArrowUpOutlined />}
            size="small"
            type="text"
            onClick={() => onMove(-1)}
          />
        </Tooltip>
        <Tooltip title="下移">
          <Button
            disabled={!canMoveDown || moving}
            icon={<ArrowDownOutlined />}
            size="small"
            type="text"
            onClick={() => onMove(1)}
          />
        </Tooltip>
        <Select
          className="product-image-profile-suite-thumb-move-select"
          disabled={!otherSuites.length || moving}
          options={otherSuites.map((suite) => ({ label: suite.suiteName, value: suite.backendId ?? 0 })).filter((option) => option.value)}
          placeholder="移动到"
          size="small"
          value={undefined}
          onChange={onMoveToSuite}
        />
        <Popconfirm
          cancelText="取消"
          okText="删除"
          okButtonProps={{ danger: true }}
          title="确定删除这张套图图片吗？"
          onConfirm={onRemove}
        >
          <Button danger disabled={moving} icon={<DeleteOutlined />} size="small" type="text" />
        </Popconfirm>
      </div>
    </div>
  )
}
