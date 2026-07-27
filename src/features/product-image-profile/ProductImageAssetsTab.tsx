import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Empty, Popconfirm, Space, Typography } from 'antd'
import type { ReactNode } from 'react'
import type { ProductImageAssetRoleGroup } from './assetRoleSections'
import type { ProfileAsset } from './productImageProfileTypes'

const { Text } = Typography

export type ProductImageAssetsTabProps = {
  allAssetsSelected: boolean
  assetGroups: ProductImageAssetRoleGroup<ProfileAsset>[]
  assets: ProfileAsset[]
  profileReady: boolean
  removing: boolean
  selectableAssets: ProfileAsset[]
  selectedAssets: ProfileAsset[]
  onClearSelection: () => void
  onOpenImport: () => void
  onRemoveAssets: (assets: ProfileAsset[]) => void
  onSelectAssets: (assets: ProfileAsset[]) => void
  renderAsset: (asset: ProfileAsset) => ReactNode
}

export function ProductImageAssetsTab({
  allAssetsSelected,
  assetGroups,
  assets,
  profileReady,
  removing,
  selectableAssets,
  selectedAssets,
  onClearSelection,
  onOpenImport,
  onRemoveAssets,
  onSelectAssets,
  renderAsset
}: ProductImageAssetsTabProps) {
  return (
    <div className="product-image-profile-tab-body">
      <div className="product-image-profile-tab-actions">
        <Button disabled={!profileReady} icon={<PlusOutlined />} onClick={onOpenImport}>
          添加基础图
        </Button>
        <Space className="product-image-profile-batch-actions" wrap>
          <Text type={selectedAssets.length ? undefined : 'secondary'}>已选 {selectedAssets.length} 张</Text>
          <Button
            disabled={!profileReady || !selectableAssets.length || allAssetsSelected || removing}
            size="small"
            onClick={() => onSelectAssets(selectableAssets)}
          >
            全选
          </Button>
          <Button
            disabled={!profileReady || !selectedAssets.length || removing}
            size="small"
            onClick={onClearSelection}
          >
            取消选择
          </Button>
          <Popconfirm
            cancelText="取消"
            okButtonProps={{ danger: true, loading: removing }}
            okText="移除"
            onConfirm={() => onRemoveAssets(selectedAssets)}
            title={`确定移除选中的 ${selectedAssets.length} 张图片吗？`}
          >
            <Button
              danger
              disabled={!profileReady || !selectedAssets.length}
              icon={<DeleteOutlined />}
              loading={removing}
              size="small"
            >
              批量移除
            </Button>
          </Popconfirm>
        </Space>
      </div>
      {assets.length ? (
        <div className="product-image-profile-asset-sections">
          {assetGroups.map((section) => (
            <section className="product-image-profile-asset-section" key={section.role}>
              <div className="product-image-profile-asset-section-head">
                <strong>{section.label}</strong>
                <Text type="secondary">{section.assets.length} 张</Text>
              </div>
              {section.assets.length ? (
                <div className="product-image-profile-asset-grid">
                  {section.assets.map(renderAsset)}
                </div>
              ) : (
                <div className="product-image-profile-asset-section-empty">暂无{section.label}</div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无基础图" />
      )}
    </div>
  )
}
