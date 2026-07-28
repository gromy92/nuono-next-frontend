import type { MessageInstance } from 'antd/es/message/interface';
import {
  noonImageMetadataFromDimensions,
  selectNoonImageAdaptTarget,
  type NoonImageAssetMetadata
} from '../product-image-profile/noonListingImageRequirements';
import {
  createNoonReadyImageFile,
  readProductImageDimensions,
  shouldImportProductImage,
  withImageProcessTimeout
} from './productImageBrowserProcessing';
import type { ProductImageAutoAdaptFeedback } from './productImageManagerTypes';

export async function runProductImageAutoAdapt(props: {
  imageUrl: string;
  sourceMetadata?: NoonImageAssetMetadata;
  onImportRemoteImage?: (imageUrl: string) => Promise<string>;
  onUploadImage: (file: File) => Promise<string>;
  messageApi: MessageInstance;
  onFeedback: (feedback: ProductImageAutoAdaptFeedback) => void;
}) {
  const { imageUrl, messageApi, onFeedback } = props;
  const messageKey = `product-image-auto-adapt-${Date.now()}`;
  onFeedback({ imageUrl, content: '正在自动适配商品图...', type: 'info' });
  messageApi.loading({ key: messageKey, content: '正在自动适配商品图...', duration: 0 });
  try {
    let sourceImageUrl = imageUrl;
    let sourceDimensions = props.sourceMetadata;
    if (shouldImportProductImage(imageUrl) && props.onImportRemoteImage) {
      onFeedback({ imageUrl, content: '正在转存外部商品图...', type: 'info' });
      messageApi.loading({ key: messageKey, content: '正在转存外部商品图...', duration: 0 });
      sourceImageUrl = await withImageProcessTimeout(
        props.onImportRemoteImage(imageUrl),
        '转存外部商品图'
      );
    }
    sourceDimensions = sourceDimensions ??
      noonImageMetadataFromDimensions(
        sourceImageUrl,
        await readProductImageDimensions(sourceImageUrl)
      );
    if (!sourceDimensions?.width || !sourceDimensions.height) {
      const content = '未读取到图片尺寸，无法自动适配';
      onFeedback({ imageUrl, content, type: 'warning' });
      messageApi.warning({ key: messageKey, content, duration: 3 });
      return null;
    }
    const target = selectNoonImageAdaptTarget(sourceDimensions);
    const adaptedFile = await createNoonReadyImageFile(sourceImageUrl, target);
    onFeedback({ imageUrl, content: '正在上传适配后的商品图...', type: 'info' });
    messageApi.loading({ key: messageKey, content: '正在上传适配后的商品图...', duration: 0 });
    const uploadedUrl = await withImageProcessTimeout(
      props.onUploadImage(adaptedFile),
      '上传适配图片'
    );
    const successMessage = target.sourceTooSmall
      ? '已适配为 660x904，请检查清晰度'
      : `已适配为 ${target.width}x${target.height}`;
    const adaptedMetadata = noonImageMetadataFromDimensions(
      uploadedUrl,
      { width: target.width, height: target.height },
      {
        sourceWidth: sourceDimensions.width,
        sourceHeight: sourceDimensions.height,
        adapted: true,
        adaptationTargetWidth: target.width,
        adaptationTargetHeight: target.height,
        sourceTooSmall: target.sourceTooSmall
      }
    );
    onFeedback({ imageUrl: uploadedUrl, content: successMessage, type: 'success' });
    messageApi.success({ key: messageKey, content: successMessage, duration: 3 });
    return {
      adaptedMetadata,
      sourceDimensions,
      sourceImageUrl,
      uploadedUrl
    };
  } catch (error) {
    const content = error instanceof Error ? error.message : '自动适配图片失败';
    onFeedback({ imageUrl, content, type: 'error' });
    messageApi.error({ key: messageKey, content, duration: 4 });
    return null;
  }
}
