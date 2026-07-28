import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  evaluateNoonImageDimensions,
  noonImageMetadataFromDimensions,
  normalizeNoonImageAssetMetadata,
  type NoonImageAssetMetadata
} from '../product-image-profile/noonListingImageRequirements';
import type { ProductImageUsageRole } from '../product-image-profile/productImageRole';
import {
  readProductImageDimensions,
  validProductImageUrl
} from './productImageBrowserProcessing';
import {
  activeImageRoleAssignments,
  activeImageUrls,
  appendActiveImages,
  moveActiveImageTo,
  moveImageToUnused,
  normalizeImageManagerState,
  removeActiveImage,
  removeUnusedImage,
  restoreUnusedImage,
  setActiveImageRole,
  type ProductImageManagerState
} from './productImageManagerState';
import type {
  ProductImageAutoAdaptFeedback,
  ProductImageManagerDrawerProps
} from './productImageManagerTypes';
import { runProductImageAutoAdapt } from './runProductImageAutoAdapt';
import { uploadProductImageFiles } from './uploadProductImageFiles';
export function useProductImageManagerController(props: ProductImageManagerDrawerProps) {
  const {
    allowEmptyImages = false,
    imageAssetMetadata = [],
    imageRoleAssignments = [],
    open,
    images,
    onSave
  } = props;
  const [draftState, setDraftState] = useState<ProductImageManagerState>(
    () => normalizeImageManagerState([])
  );
  const [imageMetadataByUrl, setImageMetadataByUrl] =
    useState<Record<string, NoonImageAssetMetadata>>({});
  const [imageDimensionReadErrorsByUrl, setImageDimensionReadErrorsByUrl] =
    useState<Record<string, string>>({});
  const [adaptingImageUrl, setAdaptingImageUrl] = useState('');
  const [autoAdaptFeedback, setAutoAdaptFeedback] =
    useState<ProductImageAutoAdaptFeedback | null>(null);
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
      .filter((imageUrl) =>
        validProductImageUrl(imageUrl) &&
        !imageMetadataByUrl[imageUrl] &&
        !imageDimensionReadErrorsByUrl[imageUrl]
      )));
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
          setImageMetadataByUrl((current) =>
            current[imageUrl] ? current : { ...current, [imageUrl]: metadata }
          );
          setImageDimensionReadErrorsByUrl((current) => {
            if (!current[imageUrl]) {
              return current;
            }
            const { [imageUrl]: _removed, ...next } = current;
            return next;
          });
        })
        .catch((error) => {
          if (!cancelled) {
            setImageDimensionReadErrorsByUrl((current) => ({
              ...current,
              [imageUrl]: error instanceof Error ? error.message : '读取图片尺寸失败'
            }));
          }
        });
    });
    return () => {
      cancelled = true;
    };
  }, [
    draftState.activeImages,
    draftState.unusedImages,
    imageDimensionReadErrorsByUrl,
    imageMetadataByUrl,
    open
  ]);
  const applyDraftState = (
    updater: (current: ProductImageManagerState) => ProductImageManagerState
  ) => setDraftState((current) => updater(current));

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
      const { uploadedMetadata, uploadedUrls } = await uploadProductImageFiles(
        files,
        props.onUploadImage,
        props.messageApi
      );
      if (uploadedUrls.length) {
        applyDraftState((current) => appendActiveImages(current, uploadedUrls));
        if (uploadedMetadata.length) {
          setImageMetadataByUrl((current) => ({
            ...current,
            ...metadataMap(uploadedMetadata)
          }));
        }
        setImageDimensionReadErrorsByUrl((current) => {
          const next = { ...current };
          uploadedUrls.forEach((uploadedUrl) => delete next[uploadedUrl]);
          return next;
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
    const invalidIndex = nextImages.findIndex((item) => !validProductImageUrl(item));
    if (invalidIndex >= 0) {
      props.messageApi.warning(`商品图 ${invalidIndex + 1} 不是有效图片 URL`);
      return;
    }
    const nextMetadata = normalizeNoonImageAssetMetadata(
      nextImages,
      Object.values(imageMetadataByUrl)
    );
    const missingMetadataCount = nextImages.filter((item) => !imageMetadataByUrl[item]).length;
    const blockedCount = nextMetadata.filter(
      (item) => evaluateNoonImageDimensions(item).status === 'blocked'
    ).length;
    onSave(nextImages, activeImageRoleAssignments(draftState), nextMetadata);
    if (missingMetadataCount || blockedCount) {
      props.messageApi.warning('部分商品图未满足 Noon 尺寸要求，提交上架 dry-run 会拦截');
    }
    props.messageApi.success('图片已写入当前商品草稿');
  };

  const adaptImageForNoon = async (imageUrl: string) => {
    setAdaptingImageUrl(imageUrl);
    try {
      const result = await runProductImageAutoAdapt({
        imageUrl,
        sourceMetadata: imageMetadataByUrl[imageUrl],
        onImportRemoteImage: props.onImportRemoteImage,
        onUploadImage: props.onUploadImage,
        messageApi: props.messageApi,
        onFeedback: setAutoAdaptFeedback
      });
      if (!result) {
        return;
      }
      const { adaptedMetadata, sourceDimensions, sourceImageUrl, uploadedUrl } = result;
      applyDraftState((current) => normalizeImageManagerState(
        current.activeImages.map((item) =>
          item.imageUrl === imageUrl ? { ...item, imageUrl: uploadedUrl } : item
        ),
        current.unusedImages
      ));
      setImageMetadataByUrl((current) => ({
        ...current,
        [imageUrl]: sourceDimensions,
        ...(sourceImageUrl !== imageUrl
          ? { [sourceImageUrl]: { ...sourceDimensions, imageUrl: sourceImageUrl } }
          : {}),
        ...(adaptedMetadata ? { [uploadedUrl]: adaptedMetadata } : {})
      }));
      setImageDimensionReadErrorsByUrl((current) => {
        const next = { ...current };
        delete next[imageUrl];
        delete next[sourceImageUrl];
        delete next[uploadedUrl];
        return next;
      });
    } finally {
      setAdaptingImageUrl('');
    }
  };

  return {
    adaptingImageUrl,
    autoAdaptFeedback,
    draftState,
    draftImages,
    imageDimensionReadErrorsByUrl,
    imageMetadataByUrl,
    unusedImages,
    uploading,
    uploadInputRef,
    adaptImageForNoon,
    markImageUnused,
    moveImageTo: (index: number, nextIndex: number) =>
      applyDraftState((current) => moveActiveImageTo(current, index, nextIndex)),
    removeImage,
    removeUnused: (index: number) =>
      applyDraftState((current) => removeUnusedImage(current, index)),
    restoreUnused: (index: number) =>
      applyDraftState((current) => restoreUnusedImage(current, index)),
    saveImages,
    setImageRole: (index: number, role: ProductImageUsageRole) =>
      applyDraftState((current) => setActiveImageRole(current, index, role)),
    uploadLocalImages
  };
}

function metadataMap(metadata: NoonImageAssetMetadata[]) {
  return metadata.reduce<Record<string, NoonImageAssetMetadata>>((result, item) => {
    result[item.imageUrl] = item;
    return result;
  }, {});
}
