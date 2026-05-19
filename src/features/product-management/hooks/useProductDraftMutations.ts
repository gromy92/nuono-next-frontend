import { useCallback } from 'react';
import { createSiteOfferColumns } from '../productDetailColumns';
import {
  cloneRecord,
  cloneRecordList,
  cloneSnapshotPayload,
  siteOfferCode,
  splitMultilineValue,
  textInputValue
} from '../utils';
import type {
  ProductMasterSnapshotPayload,
  ProductWorkbenchPayload,
  ProductWorkbenchState,
  ProductWorkbenchSurfaceReadyState
} from '../types';

type ReadyWorkbenchUpdater = (
  updater: (current: ProductWorkbenchSurfaceReadyState) => {
    workbench: ProductWorkbenchState;
    payloadOverrides?: Partial<ProductWorkbenchPayload>;
    recentActions?: Array<Record<string, unknown>>;
  } | null
) => void;

type UseProductDraftMutationsParams = {
  activeSiteOfferCode?: string;
  dirtySiteOfferCodes: string[];
  updateReadyProductWorkbenchSurface: ReadyWorkbenchUpdater;
};

export function useProductDraftMutations({
  activeSiteOfferCode,
  dirtySiteOfferCodes,
  updateReadyProductWorkbenchSurface
}: UseProductDraftMutationsParams) {
  const updateProductDraft = useCallback(
    (updater: (draft: ProductMasterSnapshotPayload) => void) => {
      updateReadyProductWorkbenchSurface((currentValue) => {
        const nextDraft = cloneSnapshotPayload(currentValue.workbench.draft);
        updater(nextDraft);
        return {
          workbench: {
            ...currentValue.workbench,
            draft: nextDraft
          }
        };
      });
    },
    [updateReadyProductWorkbenchSurface]
  );

  const discardProductDraftToBaseline = useCallback(
    (options?: { onlyQuickOpen?: boolean; note?: string }) => {
      updateReadyProductWorkbenchSurface((currentValue) => {
        if (options?.onlyQuickOpen && currentValue.context.source !== 'quick-open') {
          return null;
        }
        const nextDraft = cloneSnapshotPayload(currentValue.workbench.baseline);
        const nextWorkbench: ProductWorkbenchState = {
          ...currentValue.workbench,
          draft: nextDraft,
          syncStatus: 'synced',
          note: options?.note ?? currentValue.workbench.note
        };
        return {
          workbench: nextWorkbench,
          payloadOverrides: {
            syncStatus: nextWorkbench.syncStatus,
            note: nextWorkbench.note
          }
        };
      });
    },
    [updateReadyProductWorkbenchSurface]
  );

  const updateProductSectionField = useCallback(
    (section: 'identity' | 'taxonomy' | 'content' | 'group', field: string, value: unknown) => {
      updateProductDraft((draft) => {
        const nextSection = cloneRecord(draft[section] as Record<string, unknown>);
        nextSection[field] = value;
        draft[section] = nextSection;
      });
    },
    [updateProductDraft]
  );

  const updateProductMultilineField = useCallback(
    (field: 'highlightsEn' | 'highlightsAr' | 'images', value: string) => {
      updateProductSectionField('content', field, splitMultilineValue(value));
    },
    [updateProductSectionField]
  );

  const updateProductAxes = useCallback(
    (value: string) => {
      updateProductDraft((draft) => {
        const currentGroup = cloneRecord(draft.group);
        const currentAxes = Array.isArray(currentGroup.axes)
          ? (currentGroup.axes as Array<Record<string, unknown>>)
          : [];
        const nextAxes = splitMultilineValue(value).map((axisName, index) => ({
          axisCode: textInputValue(currentAxes[index]?.axisCode) || `axis_${index + 1}`,
          axisName
        }));
        currentGroup.axes = nextAxes;
        draft.group = currentGroup;
      });
    },
    [updateProductDraft]
  );

  const updateProductVariant = useCallback(
    (index: number, field: 'childSku' | 'sizeEn' | 'sizeAr', value: string) => {
      updateProductDraft((draft) => {
        const nextVariants = cloneRecordList(draft.variants);
        const target = cloneRecord(nextVariants[index] ?? {});
        target[field] = value;
        nextVariants[index] = target;
        draft.variants = nextVariants;
      });
    },
    [updateProductDraft]
  );

  const addProductVariant = useCallback(() => {
    updateProductDraft((draft) => {
      const nextVariants = cloneRecordList(draft.variants);
      nextVariants.push({
        childSku: `NEW-${nextVariants.length + 1}`,
        sizeEn: '',
        sizeAr: '',
        variantIndex: nextVariants.length + 1
      });
      draft.variants = nextVariants;
    });
  }, [updateProductDraft]);

  const removeProductVariant = useCallback(
    (index: number) => {
      updateProductDraft((draft) => {
        const nextVariants = cloneRecordList(draft.variants)
          .filter((_, currentIndex) => currentIndex !== index)
          .map((item, currentIndex) => ({
            ...item,
            variantIndex: currentIndex + 1
          }));
        draft.variants = nextVariants;
      });
    },
    [updateProductDraft]
  );

  const updateProductAttributeField = useCallback(
    (code: string, field: string, value: string) => {
      updateProductDraft((draft) => {
        draft.keyAttributes = cloneRecordList(draft.keyAttributes).map((item) => {
          if (String(item.code) !== code) {
            return item;
          }

          return {
            ...item,
            [field]: value
          };
        });
      });
    },
    [updateProductDraft]
  );

  const updateSiteOfferField = useCallback(
    (storeCode: string, field: string, value: unknown) => {
      updateProductDraft((draft) => {
        draft.siteOffers = cloneRecordList(draft.siteOffers).map((item) => {
          if (siteOfferCode(item) !== storeCode) {
            return item;
          }

          return {
            ...item,
            [field]: value
          };
        });
      });
    },
    [updateProductDraft]
  );

  const siteOfferColumns = createSiteOfferColumns({
    dirtySiteOfferCodes,
    activeSiteOfferCode
  });

  return {
    updateProductDraft,
    discardProductDraftToBaseline,
    updateProductSectionField,
    updateProductMultilineField,
    updateProductAxes,
    updateProductVariant,
    addProductVariant,
    removeProductVariant,
    updateProductAttributeField,
    updateSiteOfferField,
    siteOfferColumns
  };
}
