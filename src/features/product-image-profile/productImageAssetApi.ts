import { apiRequestJson } from '../../shared/api';

export type ProductImageAssetContext = {
  ownerUserId?: number;
  storeCode?: string;
  skuParent?: string;
};

export type ProductImageAssetUploadResponse = {
  url?: string;
  filename?: string;
  contentType?: string;
  size?: number;
  assetId?: number;
  sourceUrl?: string;
  warnings?: string[];
};

export async function uploadProductImageAsset(
  file: File,
  context?: ProductImageAssetContext
) {
  const formData = new FormData();
  formData.append('file', file);
  if (context?.ownerUserId) {
    formData.append('ownerUserId', String(context.ownerUserId));
  }
  if (context?.storeCode) {
    formData.append('storeCode', context.storeCode);
  }
  if (context?.skuParent) {
    formData.append('skuParent', context.skuParent);
  }

  return apiRequestJson<ProductImageAssetUploadResponse>(
    '/api/product-master/image-assets',
    { method: 'POST', body: formData },
    '上传图片失败'
  );
}

export async function importProductImageAsset(
  imageUrl: string,
  context?: ProductImageAssetContext
) {
  return apiRequestJson<ProductImageAssetUploadResponse>(
    '/api/product-master/image-assets/import',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: normalizeImageUrlForImport(imageUrl),
        ...(context?.ownerUserId ? { ownerUserId: context.ownerUserId } : {}),
        ...(context?.storeCode ? { storeCode: context.storeCode } : {}),
        ...(context?.skuParent ? { skuParent: context.skuParent } : {})
      })
    },
    '转存图片失败'
  );
}

function normalizeImageUrlForImport(imageUrl: string) {
  return String(imageUrl ?? '')
    .trim()
    .replace(/[\u0000-\u001F\u007F\s\u200B\u200C\u200D\uFEFF]+/g, '');
}
