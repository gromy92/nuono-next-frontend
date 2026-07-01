import { useCallback, useEffect } from 'react';
import { openProductWorkbenchSnapshot } from '../api';
import { getProductCurrentZCode, mergeGalleryImageUrls, productSummaryTitle } from '../utils';
import type {
  ProductListSummaryPayload,
  ProductMasterSnapshotPayload,
  ProductSummarySurface,
  StoreInitializationPayload
} from '../types';

type UseProductGalleryActionsParams = {
  activeOwnerId?: number;
  applyProductListSummary: (summary?: ProductListSummaryPayload) => void;
  currentProductSkuParent?: string;
  currentProductSummarySurface?: ProductSummarySurface | null;
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
  applyProductListSummary,
  currentProductSkuParent,
  currentProductSummarySurface,
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
      const currentImages = mergeGalleryImageUrls(
        productImageUrls,
        productSnapshotView?.content.mainImageUrl,
        currentProductSummarySurface?.galleryImages,
        currentProductSummarySurface?.imageUrl
      );
      openProductGallery(currentImages, {
        index,
        title:
          typeof productSnapshotView?.content.titleEn === 'string' && productSnapshotView.content.titleEn.trim()
            ? productSnapshotView.content.titleEn
            : currentProductSummarySurface
              ? productSummaryTitle(currentProductSummarySurface)
            : currentProductSkuParent || '商品图片',
        subtitle: currentProductSkuParent
      });
    },
    [currentProductSkuParent, currentProductSummarySurface, openProductGallery, productImageUrls, productSnapshotView]
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
      const currentZCode = getProductCurrentZCode(record);
      const galleryOptions: { title?: string; subtitle?: string } = {};
      const galleryTitle = record.title || record.skuParent;
      if (galleryTitle) {
        galleryOptions.title = galleryTitle;
      }
      if (currentZCode) {
        galleryOptions.subtitle = currentZCode;
      }
      if (galleryImages.length > 1 || !activeOwnerId || !(record.partnerSku || currentZCode)) {
        openProductGallery(galleryImages, galleryOptions);
        return;
      }

      const effectiveStoreCode = record.referenceStoreCode || selectedInitializationStoreCode;
      if (!effectiveStoreCode) {
        openProductGallery(galleryImages, galleryOptions);
        return;
      }

      try {
        const payload = await openProductWorkbenchSnapshot({
          ownerUserId: activeOwnerId,
          storeCode: effectiveStoreCode,
          skuParent: currentZCode,
          currentZCode,
          partnerSku: record.partnerSku,
          pskuCode: record.pskuCode
        });
        if (payload.listSummary) {
          applyProductListSummary(payload.listSummary);
        }
        const fetchedImages = mergeGalleryImageUrls(
          payload.content?.images,
          payload.content?.mainImageUrl,
          payload.listSummary?.galleryImages,
          payload.listSummary?.imageUrl,
          galleryImages
        );
        openProductGallery(fetchedImages.length ? fetchedImages : galleryImages, galleryOptions);
      } catch {
        openProductGallery(galleryImages, galleryOptions);
      }
    },
    [activeOwnerId, applyProductListSummary, openProductGallery, selectedInitializationStoreCode]
  );

  return {
    openProductGallery,
    openCurrentProductGallery,
    stepProductGallery,
    openProductListGallery
  };
}
