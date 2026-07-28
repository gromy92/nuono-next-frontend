import {
  DeleteOutlined,
  EyeInvisibleOutlined,
  StarFilled
} from '@ant-design/icons';
import { Alert, Button, Empty, Segmented, Space, Tag, Typography } from 'antd';
import type {
  NoonImageAssetMetadata
} from '../product-image-profile/noonListingImageRequirements';
import { NOON_IMAGE_TARGET_ASPECT_RATIO } from '../product-image-profile/noonListingImageRequirements';
import type { ProductImageUsageRole } from '../product-image-profile/productImageRole';
import { ProductImageAssetPreview } from './ProductImageAssetPreview';
import { imageNumberTargets, type ProductImageManagerState } from './productImageManagerState';
import {
  ProductImageStatusTag,
  productImageRoleLabel
} from './ProductImageStatusTag';
import type { ProductImageAutoAdaptFeedback } from './productImageManagerTypes';

const { Text } = Typography;

export function ProductImageManagerList(props: {
  draftState: ProductImageManagerState;
  imageMetadataByUrl: Record<string, NoonImageAssetMetadata>;
  imageDimensionReadErrorsByUrl: Record<string, string>;
  adaptingImageUrl: string;
  autoAdaptFeedback: ProductImageAutoAdaptFeedback | null;
  onAdapt: (imageUrl: string) => void;
  onMove: (index: number, nextIndex: number) => void;
  onRemove: (index: number) => void;
  onMarkUnused: (index: number) => void;
  onRestoreUnused: (index: number) => void;
  onRemoveUnused: (index: number) => void;
  onSetRole: (index: number, role: ProductImageUsageRole) => void;
}) {
  const {
    adaptingImageUrl,
    autoAdaptFeedback,
    draftState,
    imageDimensionReadErrorsByUrl,
    imageMetadataByUrl
  } = props;
  const draftImages = draftState.activeImages;
  const unusedImages = draftState.unusedImages;

  if (!draftImages.length && !unusedImages.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无图片" />;
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      {draftImages.map((item, index) => {
        const imageMetadata = imageMetadataByUrl[item.imageUrl];
        return (
          <div
            key={`${item.imageUrl}-${index}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '140px minmax(0, 1fr)',
              gap: 12,
              padding: 12,
              border: '1px solid var(--pm-subtle-border)',
              borderRadius: 8,
              background: '#fff'
            }}
          >
            <div
              style={{
                width: 140,
                aspectRatio: NOON_IMAGE_TARGET_ASPECT_RATIO,
                borderRadius: 6,
                overflow: 'hidden',
                background: 'var(--pm-subtle-bg)'
              }}
            >
              <ProductImageAssetPreview
                src={item.imageUrl}
                alt={`商品图 ${index + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space wrap>
                {index === 0
                  ? <Tag icon={<StarFilled />} color="gold">头图</Tag>
                  : <Tag>商品图 {index + 1}</Tag>}
                <ProductImageStatusTag
                  metadata={imageMetadata}
                  errorMessage={imageDimensionReadErrorsByUrl[item.imageUrl]}
                />
                {imageMetadata?.width && imageMetadata.height
                  ? <Tag>{imageMetadata.width}x{imageMetadata.height}</Tag>
                  : null}
                <Button
                  size="small"
                  loading={adaptingImageUrl === item.imageUrl}
                  onClick={() => props.onAdapt(item.imageUrl)}
                >
                  自动适配
                </Button>
                <Button size="small" danger icon={<DeleteOutlined />} onClick={() => props.onRemove(index)}>
                  删除
                </Button>
                <Button size="small" icon={<EyeInvisibleOutlined />} onClick={() => props.onMarkUnused(index)}>
                  不使用
                </Button>
              </Space>
              <Space size={8} wrap>
                <Text style={{ color: 'var(--pm-text-muted)', fontSize: 12 }}>用途</Text>
                {index === 0 ? (
                  <Tag color="gold" style={{ marginInlineEnd: 0 }}>主图</Tag>
                ) : (
                  <Segmented<ProductImageUsageRole>
                    size="small"
                    value={item.imageRole}
                    options={[
                      { label: '尺寸图', value: 'SIZE' },
                      { label: '细节图', value: 'DETAIL' },
                      { label: '场景图', value: 'SCENE' },
                      { label: '包装图', value: 'PACKAGE' }
                    ]}
                    onChange={(value) => props.onSetRole(index, value)}
                  />
                )}
              </Space>
              <Space size={6} wrap>
                <Text style={{ color: 'var(--pm-text-muted)', fontSize: 12 }}>编号</Text>
                {imageNumberTargets(draftState).map((targetIndex) => (
                  <Button
                    key={targetIndex}
                    size="small"
                    type={targetIndex === index ? 'primary' : 'default'}
                    aria-label={`将商品图 ${index + 1} 排到第 ${targetIndex + 1} 位`}
                    onClick={() => props.onMove(index, targetIndex)}
                  >
                    {targetIndex + 1}
                  </Button>
                ))}
              </Space>
              {autoAdaptFeedback?.imageUrl === item.imageUrl ? (
                <Alert
                  type={autoAdaptFeedback.type}
                  message={autoAdaptFeedback.content}
                  showIcon
                  style={{ padding: '4px 8px' }}
                />
              ) : null}
            </Space>
          </div>
        );
      })}
      {unusedImages.length ? (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Text style={{ color: 'var(--pm-text-muted)', fontSize: 12 }}>不使用</Text>
          {unusedImages.map((item, index) => (
            <div
              key={`${item.imageUrl}-unused-${index}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '140px minmax(0, 1fr)',
                gap: 12,
                padding: 12,
                border: '1px dashed var(--pm-subtle-border)',
                borderRadius: 8,
                background: 'var(--pm-subtle-bg)'
              }}
            >
              <div
                style={{
                  width: 140,
                  aspectRatio: NOON_IMAGE_TARGET_ASPECT_RATIO,
                  borderRadius: 6,
                  overflow: 'hidden',
                  background: '#fff'
                }}
              >
                <ProductImageAssetPreview
                  src={item.imageUrl}
                  alt={`不使用图片 ${index + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.55 }}
                />
              </div>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Space wrap>
                  <Tag color="default">不使用</Tag>
                  <Tag>{productImageRoleLabel(item.imageRole)}</Tag>
                  <Button size="small" onClick={() => props.onRestoreUnused(index)}>使用</Button>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => props.onRemoveUnused(index)}
                  >
                    删除
                  </Button>
                </Space>
              </Space>
            </div>
          ))}
        </Space>
      ) : null}
    </Space>
  );
}
