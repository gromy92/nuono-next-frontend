import type { NoonImageDimensions } from '../product-image-profile/noonListingImageRequirements';
import {
  isProductImageAssetUrl,
  resolveProductImageDisplayUrl
} from '../product-image-profile/productImageAssetDisplay';

const IMAGE_PROCESS_TIMEOUT_MS = 15000;

export function validProductImageUrl(value: string) {
  const source = value.trim();
  return /^https?:\/\/\S+$/i.test(source) ||
    /^\/api\/product-master\/image-assets\/[\w.-]+$/i.test(source);
}

export function shouldImportProductImage(value: string) {
  const source = value.trim();
  return /^https?:\/\/\S+$/i.test(source) && !isProductImageAssetUrl(source);
}

export function readProductImageDimensions(imageUrl: string): Promise<NoonImageDimensions> {
  return resolveProductImageDisplayUrl(imageUrl).then(async (display) => {
    try {
      return await withImageProcessTimeout(readImageDimensions(display.displayUrl), '读取图片尺寸');
    } finally {
      display.revoke();
    }
  });
}

export function readFileImageDimensions(file: File): Promise<NoonImageDimensions> {
  const objectUrl = URL.createObjectURL(file);
  return withImageProcessTimeout(readImageDimensions(objectUrl), '读取图片尺寸')
    .finally(() => URL.revokeObjectURL(objectUrl));
}

export async function createNoonReadyImageFile(
  imageUrl: string,
  target: { width: number; height: number }
): Promise<File> {
  const display = await withImageProcessTimeout(resolveProductImageDisplayUrl(imageUrl), '自动适配图片');
  try {
    const image = await withImageProcessTimeout(loadDrawableImage(display.displayUrl), '自动适配图片');
    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('当前浏览器无法处理图片适配');
    }
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, target.width, target.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    const scale = Math.min(target.width / image.naturalWidth, target.height / image.naturalHeight);
    const drawWidth = Math.round(image.naturalWidth * scale);
    const drawHeight = Math.round(image.naturalHeight * scale);
    const offsetX = Math.round((target.width - drawWidth) / 2);
    const offsetY = Math.round((target.height - drawHeight) / 2);
    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

    const blob = await withImageProcessTimeout(canvasToBlob(canvas), '生成适配图片');
    return new File([blob], `noon-ready-${target.width}x${target.height}-${Date.now()}.jpg`, {
      type: 'image/jpeg'
    });
  } finally {
    display.revoke();
  }
}

export function withImageProcessTimeout<T>(promise: Promise<T>, actionLabel: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${actionLabel}超时，请重新上传原图或选择不使用`));
    }, IMAGE_PROCESS_TIMEOUT_MS);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

function readImageDimensions(imageUrl: string): Promise<NoonImageDimensions> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error('未读取到图片尺寸'));
        return;
      }
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => reject(new Error('读取图片尺寸失败'));
    image.src = imageUrl;
  });
}

function loadDrawableImage(imageUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error('未读取到图片尺寸'));
        return;
      }
      resolve(image);
    };
    image.onerror = () => reject(new Error('图片跨域或加载失败，无法自动适配；请重新上传原图或选择不使用'));
    image.src = imageUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('生成适配图片失败'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.92);
    } catch {
      reject(new Error('图片跨域限制，无法生成适配图；请重新上传原图或选择不使用'));
    }
  });
}
