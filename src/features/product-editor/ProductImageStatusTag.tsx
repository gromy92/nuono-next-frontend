import { Tag } from 'antd';
import {
  evaluateNoonImageDimensions,
  type NoonImageAssetMetadata
} from '../product-image-profile/noonListingImageRequirements';
import type { ProductImageUsageRole } from '../product-image-profile/productImageRole';

export function productImageRoleLabel(imageRole: ProductImageUsageRole) {
  if (imageRole === 'MAIN') {
    return '主图';
  }
  if (imageRole === 'SIZE') {
    return '尺寸图';
  }
  if (imageRole === 'SCENE') {
    return '场景图';
  }
  if (imageRole === 'PACKAGE') {
    return '包装图';
  }
  return '细节图';
}

export function ProductImageStatusTag(props: {
  metadata?: NoonImageAssetMetadata;
  errorMessage?: string;
}) {
  const { metadata, errorMessage = '' } = props;
  const evaluation = evaluateNoonImageDimensions(metadata ?? {});
  if (!metadata) {
    return errorMessage
      ? <Tag color="red" title={errorMessage}>读取失败</Tag>
      : <Tag color="default">读取尺寸中</Tag>;
  }
  if (evaluation.status === 'ready') {
    return metadata.sourceTooSmall
      ? <Tag color="gold">已适配 · 原图小</Tag>
      : <Tag color="green">Noon OK</Tag>;
  }
  if (evaluation.code === 'width_too_small') {
    return <Tag color="red">宽度不足</Tag>;
  }
  if (evaluation.code === 'aspect_ratio_mismatch') {
    return <Tag color="red">比例不符</Tag>;
  }
  return <Tag color="default">读取尺寸中</Tag>;
}
