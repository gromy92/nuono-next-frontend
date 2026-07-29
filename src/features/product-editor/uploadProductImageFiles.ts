import type { MessageInstance } from 'antd/es/message/interface';
import {
  noonImageMetadataFromDimensions,
  type NoonImageAssetMetadata
} from '../product-image-profile/noonListingImageRequirements';
import { readFileImageDimensions } from './productImageBrowserProcessing';

export async function uploadProductImageFiles(
  files: File[],
  onUploadImage: (file: File) => Promise<string>,
  messageApi: MessageInstance
) {
  const uploadedUrls: string[] = [];
  const uploadedMetadata: NoonImageAssetMetadata[] = [];
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      messageApi.warning(`${file.name} 不是图片文件`);
      continue;
    }
    const dimensions = await readFileImageDimensions(file).catch(() => undefined);
    const uploadedUrl = await onUploadImage(file);
    uploadedUrls.push(uploadedUrl);
    const metadata = dimensions
      ? noonImageMetadataFromDimensions(uploadedUrl, dimensions)
      : undefined;
    if (metadata) {
      uploadedMetadata.push(metadata);
    }
  }
  return { uploadedMetadata, uploadedUrls };
}
