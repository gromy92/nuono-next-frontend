import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Checkbox, Popconfirm, Select, Tag, Tooltip, Typography } from 'antd'
import { AssetThumb } from './ProductImageAssetPreview'
import {
  assetComplianceMeta,
  assetDimensionText,
  isSelectableAsset,
  samePhysicalAsset
} from './productImageAssetModel'
import { imageRoleSelectOptions } from './productImageProfileConstants'
import type { ImageRole, ProfileAsset } from './productImageProfileTypes'

const { Text } = Typography

type ProductImageAssetCardProps = {
  allAssets: ProfileAsset[]
  asset: ProfileAsset
  changingRole: boolean
  removing: boolean
  selected: boolean
  onChangeRole: (assetId: string, imageRole: ImageRole) => void
  onNaturalSize: (asset: ProfileAsset, widthPx: number, heightPx: number) => void
  onOpenProcessing: (asset: ProfileAsset) => void
  onOpenReuse: (asset: ProfileAsset) => void
  onPreview: (asset: ProfileAsset) => void
  onRemove: (asset: ProfileAsset) => void
  onSelect: (assetId: string, checked: boolean) => void
}

export function ProductImageAssetCard({
  allAssets,
  asset,
  changingRole,
  removing,
  selected,
  onChangeRole,
  onNaturalSize,
  onOpenProcessing,
  onOpenReuse,
  onPreview,
  onRemove,
  onSelect
}: ProductImageAssetCardProps) {
  const compliance = assetComplianceMeta(asset)
  const usedRoles = new Set(allAssets
    .filter((candidate) => candidate.id !== asset.id && samePhysicalAsset(candidate, asset))
    .map((candidate) => candidate.imageRole))
  const roleOptions = imageRoleSelectOptions(asset.imageRole).map((option) => ({
    ...option,
    disabled: option.disabled || usedRoles.has(option.value)
  }))
  const removeUsageOnly = Boolean(asset.usageId && usedRoles.size)

  return (
    <div className={`product-image-profile-asset-card${selected ? ' is-selected' : ''}`}>
      <Checkbox
        checked={selected}
        className="product-image-profile-asset-select"
        disabled={!isSelectableAsset(asset) || removing}
        onChange={(event) => onSelect(asset.id, event.target.checked)}
        onClick={(event) => event.stopPropagation()}
      />
      <AssetThumb asset={asset} onNaturalSize={onNaturalSize} onPreview={onPreview} />
      <div className="product-image-profile-asset-status-row">
        <Text>{assetDimensionText(asset)}</Text>
        <Tooltip title={compliance.detail}>
          <Tag color={compliance.color}>{compliance.label}</Tag>
        </Tooltip>
      </div>
      <div className="product-image-profile-asset-processing-row">
        <Tag color={asset.processingStatus === 'PROCESSED' ? 'success' : 'default'}>
          {asset.processingStatus === 'PROCESSED' ? '已处理' : '待处理'}
        </Tag>
        <Text ellipsis={{ tooltip: asset.processingNote || '暂无处理意见' }} type="secondary">
          {asset.processingNote || '暂无处理意见'}
        </Text>
      </div>
      <div className="product-image-profile-asset-meta">
        <Select
          disabled={changingRole}
          loading={changingRole}
          size="small"
          options={roleOptions}
          value={asset.imageRole}
          onChange={(value) => onChangeRole(asset.id, value)}
        />
      </div>
      <div className="product-image-profile-asset-actions">
        <Button icon={<CopyOutlined />} size="small" type="text" onClick={() => onOpenReuse(asset)}>
          复用
        </Button>
        <Button icon={<EditOutlined />} size="small" type="text" onClick={() => onOpenProcessing(asset)}>
          处理意见
        </Button>
        <Popconfirm
          cancelText="取消"
          okButtonProps={{ danger: true, loading: removing }}
          okText="移除"
          onConfirm={() => onRemove(asset)}
          title={removeUsageOnly ? '确定移除当前图片用途吗？原图和其他用途会保留。' : '确定从素材池移除这张图片吗？'}
        >
          <Button danger disabled={removing} size="small" type="text" icon={<DeleteOutlined />}>
            移除
          </Button>
        </Popconfirm>
      </div>
    </div>
  )
}
