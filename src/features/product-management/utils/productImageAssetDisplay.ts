import { apiFetch } from '../../../shared/api';

const PRODUCT_IMAGE_ASSET_PREFIX = '/api/product-master/image-assets/';

type ProductImageDisplayUrlOptions = {
  fetcher?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  createObjectURL?: (blob: Blob) => string;
  revokeObjectURL?: (url: string) => void;
};

type ProductImageDisplayUrl = {
  sourceUrl: string;
  displayUrl: string;
  revoke: () => void;
};

export function isProductImageAssetUrl(value: string) {
  return value.trim().startsWith(PRODUCT_IMAGE_ASSET_PREFIX);
}

export async function resolveProductImageDisplayUrl(
  imageUrl: string,
  options: ProductImageDisplayUrlOptions = {}
): Promise<ProductImageDisplayUrl> {
  const sourceUrl = imageUrl.trim();
  if (!isProductImageAssetUrl(sourceUrl)) {
    return {
      sourceUrl,
      displayUrl: sourceUrl,
      revoke: () => undefined
    };
  }

  const response = await (options.fetcher ?? apiFetch)(sourceUrl);
  if (!response.ok) {
    throw new Error(`读取商品图片失败：HTTP ${response.status}`);
  }
  const blob = await response.blob();
  const createObjectURL = options.createObjectURL ?? URL.createObjectURL.bind(URL);
  const revokeObjectURL = options.revokeObjectURL ?? URL.revokeObjectURL.bind(URL);
  const displayUrl = createObjectURL(blob);
  return {
    sourceUrl,
    displayUrl,
    revoke: () => revokeObjectURL(displayUrl)
  };
}
