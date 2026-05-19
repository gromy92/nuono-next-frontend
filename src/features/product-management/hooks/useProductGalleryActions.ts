import { useCallback, useEffect } from 'react';
import { openProductWorkbenchSnapshot } from '../api';
import { mergeGalleryImageUrls } from '../utils';
import type { ProductMasterSnapshotPayload, StoreInitializationPayload } from '../types';

type UseProductGalleryActionsParams = {
  activeOwnerId?: number;
  currentProductSkuParent?: string;
  productGalleryImages: string[];
  productImageUrls: string[];
  productSnapshotView?: ProductMasterSnapshotPayload;
  selectedInitializationStoreCode?: string;
  setProductGalleryOpen: (open: boolean) => void;
  setProductGalleryImages: (images: string[]) => void;
  setProductGalleryIndex: (index: number | ((currentValue: number) => number)) => void;
  setProductGalleryTitle: (title?: string) => void;
  setProductGallerySubtitle: (subtitle?: string) => void;
};

export function useProductGalleryActions({
  activeOwnerId,
  currentProductSkuParent,
  productGalleryImages,
  productImageUrls,
  productSnapshotView,
  selectedInitializationStoreCode,
  setProductGalleryOpen,
  setProductGalleryImages,
  setProductGalleryIndex,
  setProductGalleryTitle,
  setProductGallerySubtitle
}: UseProductGalleryActionsParams) {
  useEffect(() => {
    setProductGalleryOpen(false);
    setProductGalleryImages([]);
    setProductGalleryIndex(0);
    setProductGalleryTitle(undefined);
    setProductGallerySubtitle(undefined);
  }, [
    currentProductSkuParent,
    setProductGalleryImages,
    setProductGalleryIndex,
    setProductGalleryOpen,
    setProductGallerySubtitle,
    setProductGalleryTitle
  ]);

  const openProductGallery = useCallback(
    (
      images: unknown,
      options?: {
        index?: number;
        title?: string;
        subtitle?: string;
      }
    ) => {
      const nextImages = mergeGalleryImageUrls(images);
      if (!nextImages.length) {
        return;
      }
      setProductGalleryImages(nextImages);
      setProductGalleryTitle(options?.title);
      setProductGallerySubtitle(options?.subtitle);
      setProductGalleryIndex(Math.max(0, Math.min(options?.index ?? 0, nextImages.length - 1)));
      setProductGalleryOpen(true);
    },
    [
      setProductGalleryImages,
      setProductGalleryIndex,
      setProductGalleryOpen,
      setProductGallerySubtitle,
      setProductGalleryTitle
    ]
  );

  const openCurrentProductGallery = useCallback(
    (index = 0) => {
      openProductGallery(productImageUrls, {
        index,
        title:
          typeof productSnapshotView?.content.titleEn === 'string' && productSnapshotView.content.titleEn.trim()
            ? productSnapshotView.content.titleEn
            : currentProductSkuParent || '商品图片',
        subtitle: currentProductSkuParent
      });
    },
    [currentProductSkuParent, openProductGallery, productImageUrls, productSnapshotView]
  );

  const stepProductGallery = useCallback(
    (direction: 'prev' | 'next') => {
      if (!productGalleryImages.length) {
        return;
      }

      setProductGalleryIndex((currentValue) => {
        if (direction === 'prev') {
          return currentValue === 0 ? productGalleryImages.length - 1 : currentValue - 1;
        }
        return currentValue === productGalleryImages.length - 1 ? 0 : currentValue + 1;
      });
    },
    [productGalleryImages.length, setProductGalleryIndex]
  );

  const openProductListGallery = useCallback(
    async (record: StoreInitializationPayload['productItems'][number]) => {
      const galleryImages = mergeGalleryImageUrls(record.galleryImages, record.imageUrl);
      openProductGallery(galleryImages, {
        title: record.title || record.skuParent,
        subtitle: record.skuParent
      });
      if (galleryImages.length > 1 || !activeOwnerId || !record.skuParent) {
        return;
      }

      const effectiveStoreCode = record.referenceStoreCode || selectedInitializationStoreCode;
      if (!effectiveStoreCode) {
        return;
      }

      try {
        const payload = await openProductWorkbenchSnapshot({
          ownerUserId: activeOwnerId,
          storeCode: effectiveStoreCode,
          skuParent: record.skuParent,
          partnerSku: record.partnerSku,
          pskuCode: record.pskuCode
        });
        const fetchedImages = mergeGalleryImageUrls(
          payload.content?.images,
          payload.content?.mainImageUrl,
          payload.listSummary?.galleryImages,
          payload.listSummary?.imageUrl,
          galleryImages
        );
        if (fetchedImages.length > galleryImages.length) {
          setProductGalleryImages(fetchedImages);
          setProductGalleryIndex((currentValue) => Math.max(0, Math.min(currentValue, fetchedImages.length - 1)));
        }
      } catch {
        // The existing single image remains usable when live detail hydration is unavailable.
      }
    },
    [activeOwnerId, openProductGallery, selectedInitializationStoreCode, setProductGalleryImages, setProductGalleryIndex]
  );

  return {
    openProductGallery,
    openCurrentProductGallery,
    stepProductGallery,
    openProductListGallery
  };
}
