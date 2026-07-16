import {
  DeleteOutlined,
  EyeInvisibleOutlined,
  StarFilled,
  UploadOutlined
} from '@ant-design/icons';
import { Alert, Button, Drawer, Empty, Segmented, Space, Tag, Typography } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  activeImageUrls,
  activeImageRoleAssignments,
  appendActiveImages,
  imageNumberTargets,
  moveActiveImageTo,
  moveImageToUnused,
  normalizeImageManagerState,
  removeActiveImage,
  removeUnusedImage,
  restoreUnusedImage,
  setActiveImageRole,
  type ProductImageManagerState
} from './productImageManagerState';
import { ProductImageAssetPreview } from './ProductImageAssetPreview';
import type {
  ProductImageRoleAssignment,
  ProductImageUsageRole
} from '../types/productImageRole';
import {
  evaluateNoonImageDimensions,
  noonImageMetadataFromDimensions,
  normalizeNoonImageAssetMetadata,
  selectNoonImageAdaptTarget,
  type NoonImageAssetMetadata,
  type NoonImageDimensions
} from '../utils/noonImageRequirements';
import { isProductImageAssetUrl, resolveProductImageDisplayUrl } from '../utils/productImageAssetDisplay';

const { Text } = Typography;
const IMAGE_PROCESS_TIMEOUT_MS = 15000;

type ProductImageManagerDrawerProps = {
  open: boolean;
  images: string[];
  imageRoleAssignments?: ProductImageRoleAssignment[];
  imageAssetMetadata?: NoonImageAssetMetadata[];
  onClose: () => void;
  onSave: (
    images: string[],
    imageRoleAssignments: ProductImageRoleAssignment[],
    imageAssetMetadata: NoonImageAssetMetadata[]
  ) => void;
  onUploadImage: (file: File) => Promise<string>;
  onImportRemoteImage?: (imageUrl: string) => Promise<string>;
  messageApi: MessageInstance;
  allowEmptyImages?: boolean;
};

type AutoAdaptFeedback = {
  imageUrl: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'error';
};

function validImageUrl(value: string) {
  const source = value.trim();
  return /^https?:\/\/\S+$/i.test(source) || /^\/api\/product-master\/image-assets\/[\w.-]+$/i.test(source);
}

function shouldImportRemoteImage(value: string) {
  const source = value.trim();
  return /^https?:\/\/\S+$/i.test(source) && !isProductImageAssetUrl(source);
}

export function ProductImageManagerDrawer(props: ProductImageManagerDrawerProps) {
  const { allowEmptyImages = false, imageAssetMetadata = [], imageRoleAssignments = [], open, images, onClose, onSave } = props;
  const [draftState, setDraftState] = useState<ProductImageManagerState>(() => normalizeImageManagerState([]));
  const [imageMetadataByUrl, setImageMetadataByUrl] = useState<Record<string, NoonImageAssetMetadata>>({});
  const [imageDimensionReadErrorsByUrl, setImageDimensionReadErrorsByUrl] = useState<Record<string, string>>({});
  const [adaptingImageUrl, setAdaptingImageUrl] = useState('');
  const [autoAdaptFeedback, setAutoAdaptFeedback] = useState<AutoAdaptFeedback | null>(null);
  const [uploading, setUploading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);
  const draftImages = draftState.activeImages;
  const unusedImages = draftState.unusedImages;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setDraftState(normalizeImageManagerState(images, [], imageRoleAssignments));
      setImageMetadataByUrl(metadataMap(normalizeNoonImageAssetMetadata(images, imageAssetMetadata)));
      setImageDimensionReadErrorsByUrl({});
      setAutoAdaptFeedback(null);
    }
    wasOpenRef.current = open;
  }, [imageAssetMetadata, imageRoleAssignments, images, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    const urls = Array.from(new Set([...draftState.activeImages, ...draftState.unusedImages]
      .map((item) => item.imageUrl)
      .filter((imageUrl) => validImageUrl(imageUrl) && !imageMetadataByUrl[imageUrl] && !imageDimensionReadErrorsByUrl[imageUrl])));
    urls.forEach((imageUrl) => {
      readProductImageDimensions(imageUrl)
        .then((dimensions) => {
          if (cancelled) {
            return;
          }
          const metadata = noonImageMetadataFromDimensions(imageUrl, dimensions);
          if (!metadata) {
            return;
          }
          setImageMetadataByUrl((current) => current[imageUrl] ? current : { ...current, [imageUrl]: metadata });
          setImageDimensionReadErrorsByUrl((current) => {
            if (!current[imageUrl]) {
              return current;
            }
            const { [imageUrl]: _removed, ...next } = current;
            return next;
          });
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }
          setImageDimensionReadErrorsByUrl((current) => ({
            ...current,
            [imageUrl]: error instanceof Error ? error.message : '读取图片尺寸失败'
          }));
        });
    });
    return () => {
      cancelled = true;
    };
  }, [draftState.activeImages, draftState.unusedImages, imageDimensionReadErrorsByUrl, imageMetadataByUrl, open]);

  const applyDraftState = (updater: (current: ProductImageManagerState) => ProductImageManagerState) => {
    setDraftState((current) => {
      const nextState = updater(current);
      return nextState;
    });
  };

  const moveImageTo = (index: number, nextIndex: number) => {
    applyDraftState((current) => moveActiveImageTo(current, index, nextIndex));
  };

  const setMainImage = (index: number) => {
    moveImageTo(index, 0);
  };

  const setImageRole = (index: number, imageRole: ProductImageUsageRole) => {
    applyDraftState((current) => setActiveImageRole(current, index, imageRole));
  };

  const removeImage = (index: number) => {
    if (!allowEmptyImages && draftImages.length <= 1) {
      props.messageApi.warning('商品至少需要保留 1 张图片');
      return;
    }
    applyDraftState((current) => removeActiveImage(current, index));
  };

  const markImageUnused = (index: number) => {
    if (!allowEmptyImages && draftImages.length <= 1) {
      props.messageApi.warning('商品至少需要保留 1 张图片');
      return;
    }
    applyDraftState((current) => moveImageToUnused(current, index));
  };

  const uploadLocalImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) {
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      const uploadedMetadata: NoonImageAssetMetadata[] = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          props.messageApi.warning(`${file.name} 不是图片文件`);
          continue;
        }
        const dimensions = await readFileImageDimensions(file).catch(() => undefined);
        const uploadedUrl = await props.onUploadImage(file);
        uploadedUrls.push(uploadedUrl);
        const metadata = dimensions ? noonImageMetadataFromDimensions(uploadedUrl, dimensions) : undefined;
        if (metadata) {
          uploadedMetadata.push(metadata);
        }
      }
      if (uploadedUrls.length) {
        applyDraftState((current) => appendActiveImages(current, uploadedUrls));
        if (uploadedMetadata.length) {
          setImageMetadataByUrl((current) => ({ ...current, ...metadataMap(uploadedMetadata) }));
        }
        setImageDimensionReadErrorsByUrl((current) => {
          let changed = false;
          const next = { ...current };
          uploadedUrls.forEach((uploadedUrl) => {
            if (next[uploadedUrl]) {
              delete next[uploadedUrl];
              changed = true;
            }
          });
          return changed ? next : current;
        });
        props.messageApi.success(`已上传 ${uploadedUrls.length} 张图片`);
      }
    } catch (error) {
      props.messageApi.error(error instanceof Error ? error.message : '上传图片失败');
    } finally {
      setUploading(false);
    }
  };

  const saveImages = () => {
    const nextImages = activeImageUrls(draftState);
    if (!allowEmptyImages && !nextImages.length) {
      props.messageApi.warning('商品至少需要保留 1 张图片');
      return;
    }
    const invalidIndex = nextImages.findIndex((item) => !validImageUrl(item));
    if (invalidIndex >= 0) {
      props.messageApi.warning(`商品图 ${invalidIndex + 1} 不是有效图片 URL`);
      return;
    }
    const nextImageAssetMetadata = normalizeNoonImageAssetMetadata(nextImages, Object.values(imageMetadataByUrl));
    const missingMetadataCount = nextImages.filter((item) => !imageMetadataByUrl[item]).length;
    const blockedCount = nextImageAssetMetadata.filter((item) => evaluateNoonImageDimensions(item).status === 'blocked').length;
    onSave(nextImages, activeImageRoleAssignments(draftState), nextImageAssetMetadata);
    if (missingMetadataCount || blockedCount) {
      props.messageApi.warning('部分商品图未满足 Noon 尺寸要求，提交上架 dry-run 会拦截');
    }
    props.messageApi.success('图片已写入当前商品草稿');
  };

  const adaptImageForNoon = async (imageUrl: string) => {
    const adaptMessageKey = `product-image-auto-adapt-${Date.now()}`;
    setAdaptingImageUrl(imageUrl);
    setAutoAdaptFeedback({ imageUrl, content: '正在自动适配商品图...', type: 'info' });
    props.messageApi.loading({ key: adaptMessageKey, content: '正在自动适配商品图...', duration: 0 });
    try {
      let sourceImageUrl = imageUrl;
      let sourceDimensions = imageMetadataByUrl[imageUrl];
      if (shouldImportRemoteImage(imageUrl) && props.onImportRemoteImage) {
        setAutoAdaptFeedback({ imageUrl, content: '正在转存外部商品图...', type: 'info' });
        props.messageApi.loading({ key: adaptMessageKey, content: '正在转存外部商品图...', duration: 0 });
        sourceImageUrl = await withImageProcessTimeout(props.onImportRemoteImage(imageUrl), '转存外部商品图');
        if (sourceDimensions) {
          const importedMetadata = noonImageMetadataFromDimensions(sourceImageUrl, sourceDimensions);
          if (importedMetadata) {
            setImageMetadataByUrl((current) => ({ ...current, [sourceImageUrl]: importedMetadata }));
          }
        }
      }
      sourceDimensions = sourceDimensions
        ?? noonImageMetadataFromDimensions(sourceImageUrl, await readProductImageDimensions(sourceImageUrl));
      if (!sourceDimensions?.width || !sourceDimensions.height) {
        setAutoAdaptFeedback({ imageUrl, content: '未读取到图片尺寸，无法自动适配', type: 'warning' });
        props.messageApi.warning({ key: adaptMessageKey, content: '未读取到图片尺寸，无法自动适配', duration: 3 });
        return;
      }
      const target = selectNoonImageAdaptTarget(sourceDimensions);
      const adaptedFile = await createNoonReadyImageFile(sourceImageUrl, target);
      setAutoAdaptFeedback({ imageUrl, content: '正在上传适配后的商品图...', type: 'info' });
      props.messageApi.loading({ key: adaptMessageKey, content: '正在上传适配后的商品图...', duration: 0 });
      const uploadedUrl = await withImageProcessTimeout(props.onUploadImage(adaptedFile), '上传适配图片');
      const successMessage = target.sourceTooSmall ? '已适配为 660x904，请检查清晰度' : `已适配为 ${target.width}x${target.height}`;
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
      applyDraftState((current) => normalizeImageManagerState(
        current.activeImages.map((item) => item.imageUrl === imageUrl ? { ...item, imageUrl: uploadedUrl } : item),
        current.unusedImages
      ));
      setImageMetadataByUrl((current) => ({
        ...current,
        [imageUrl]: sourceDimensions,
        ...(sourceImageUrl !== imageUrl ? { [sourceImageUrl]: { ...sourceDimensions, imageUrl: sourceImageUrl } } : {}),
        ...(adaptedMetadata ? { [uploadedUrl]: adaptedMetadata } : {})
      }));
      setImageDimensionReadErrorsByUrl((current) => {
        const next = { ...current };
        delete next[imageUrl];
        delete next[sourceImageUrl];
        delete next[uploadedUrl];
        return next;
      });
      setAutoAdaptFeedback({ imageUrl: uploadedUrl, content: successMessage, type: 'success' });
      props.messageApi.success({
        key: adaptMessageKey,
        content: successMessage,
        duration: 3
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '自动适配图片失败';
      setAutoAdaptFeedback({ imageUrl, content: errorMessage, type: 'error' });
      props.messageApi.error({
        key: adaptMessageKey,
        content: errorMessage,
        duration: 4
      });
    } finally {
      setAdaptingImageUrl('');
    }
  };

  return (
    <Drawer
      title="图片管理"
      width={860}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={saveImages}>
            保存到草稿
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <Space>
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={uploadLocalImages}
          />
          <Button type="primary" icon={<UploadOutlined />} loading={uploading} onClick={() => uploadInputRef.current?.click()}>
            上传本地图片
          </Button>
        </Space>

        {draftImages.length || unusedImages.length ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {draftImages.map((item, index) => {
              const imageMetadata = imageMetadataByUrl[item.imageUrl];
              const imageDimensionReadError = imageDimensionReadErrorsByUrl[item.imageUrl];
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
                  <div style={{ height: 140, borderRadius: 6, overflow: 'hidden', background: 'var(--pm-subtle-bg)' }}>
                    <ProductImageAssetPreview
                      src={item.imageUrl}
                      alt={`商品图 ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Space wrap>
                      {index === 0 ? <Tag icon={<StarFilled />} color="gold">头图</Tag> : <Tag>商品图 {index + 1}</Tag>}
                      {noonImageStatusTag(imageMetadata, imageDimensionReadError)}
                      {imageMetadata?.width && imageMetadata.height ? <Tag>{imageMetadata.width}x{imageMetadata.height}</Tag> : null}
                      <Button size="small" disabled={index === 0} onClick={() => setMainImage(index)}>
                        设为头图
                      </Button>
                      <Button
                        size="small"
                        loading={adaptingImageUrl === item.imageUrl}
                        onClick={() => adaptImageForNoon(item.imageUrl)}
                      >
                        自动适配
                      </Button>
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeImage(index)}>
                        删除
                      </Button>
                      <Button size="small" icon={<EyeInvisibleOutlined />} onClick={() => markImageUnused(index)}>
                        不使用
                      </Button>
                    </Space>
                    <Space size={8} wrap>
                      <Text style={{ color: 'var(--pm-text-muted)', fontSize: 12 }}>用途</Text>
                      <Segmented<ProductImageUsageRole>
                        size="small"
                        value={item.imageRole}
                        options={[
                          { label: '主图', value: 'MAIN' },
                          { label: '尺寸图', value: 'SIZE' },
                          { label: '细节图', value: 'DETAIL' },
                          { label: '包装图', value: 'PACKAGE' }
                        ]}
                        onChange={(value) => setImageRole(index, value)}
                      />
                    </Space>
                    <Space size={6} wrap>
                      <Text style={{ color: 'var(--pm-text-muted)', fontSize: 12 }}>编号</Text>
                      {imageNumberTargets(draftState).map((targetIndex) => (
                        <Button
                          key={targetIndex}
                          size="small"
                          type={targetIndex === index ? 'primary' : 'default'}
                          aria-label={`将商品图 ${index + 1} 排到第 ${targetIndex + 1} 位`}
                          onClick={() => moveImageTo(index, targetIndex)}
                        >
                          {targetIndex + 1}
                        </Button>
                      ))}
                    </Space>
                    <Text copyable style={{ color: item.imageUrl && !validImageUrl(item.imageUrl) ? '#b91c1c' : 'var(--pm-text-faint)' }}>
                      {item.imageUrl}
                    </Text>
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
                    <div style={{ height: 140, borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                      <ProductImageAssetPreview
                        src={item.imageUrl}
                        alt={`不使用图片 ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
                      />
                    </div>
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <Space wrap>
                        <Tag color="default">不使用</Tag>
                        <Tag>{imageRoleLabel(item.imageRole)}</Tag>
                        <Button size="small" onClick={() => applyDraftState((current) => restoreUnusedImage(current, index))}>
                          使用
                        </Button>
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => applyDraftState((current) => removeUnusedImage(current, index))}>
                          删除
                        </Button>
                      </Space>
                      <Text copyable style={{ color: item.imageUrl && !validImageUrl(item.imageUrl) ? '#b91c1c' : 'var(--pm-text-faint)' }}>
                        {item.imageUrl}
                      </Text>
                    </Space>
                  </div>
                ))}
              </Space>
            ) : null}
          </Space>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无图片" />
        )}
      </Space>
    </Drawer>
  );
}

function imageRoleLabel(imageRole: ProductImageUsageRole) {
  if (imageRole === 'MAIN') {
    return '主图';
  }
  if (imageRole === 'SIZE') {
    return '尺寸图';
  }
  if (imageRole === 'PACKAGE') {
    return '包装图';
  }
  return '细节图';
}

function noonImageStatusTag(metadata: NoonImageAssetMetadata | undefined, errorMessage = '') {
  const evaluation = evaluateNoonImageDimensions(metadata ?? {});
  if (!metadata) {
    if (errorMessage) {
      return <Tag color="red" title={errorMessage}>读取失败</Tag>;
    }
    return <Tag color="default">读取尺寸中</Tag>;
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

function metadataMap(metadata: NoonImageAssetMetadata[]) {
  return metadata.reduce<Record<string, NoonImageAssetMetadata>>((result, item) => {
    result[item.imageUrl] = item;
    return result;
  }, {});
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

async function readProductImageDimensions(imageUrl: string): Promise<NoonImageDimensions> {
  const display = await withImageProcessTimeout(resolveProductImageDisplayUrl(imageUrl), '读取图片尺寸');
  try {
    return await withImageProcessTimeout(readImageDimensions(display.displayUrl), '读取图片尺寸');
  } finally {
    display.revoke();
  }
}

function readFileImageDimensions(file: File): Promise<NoonImageDimensions> {
  const objectUrl = URL.createObjectURL(file);
  return withImageProcessTimeout(readImageDimensions(objectUrl), '读取图片尺寸')
    .finally(() => URL.revokeObjectURL(objectUrl));
}

async function createNoonReadyImageFile(
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

function withImageProcessTimeout<T>(promise: Promise<T>, actionLabel: string): Promise<T> {
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
