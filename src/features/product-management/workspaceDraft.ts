import {
  areSnapshotPartsEqual,
  cloneRecord,
  cloneRecordList,
  cloneSnapshotPayload,
  collectSiteOfferValidationIssues,
  collectUnsupportedProductPublishIssues,
  formatSnapshotValue,
  nowSyncTime,
  siteOfferCode,
  siteOfferEditableFieldsEqual,
  textInputValue
} from './utils';
import type { ProductMasterSnapshotPayload, ProductWorkbenchState } from './types';

export function productSharedSnapshot(payload: ProductMasterSnapshotPayload) {
  return {
    identity: payload.identity,
    taxonomy: payload.taxonomy,
    content: payload.content,
    keyAttributes: payload.keyAttributes,
    group: payload.group,
    variants: payload.variants
  };
}

export function validateProductDraft(
  draft: ProductMasterSnapshotPayload,
  mode: 'current' | 'all',
  currentSiteCode?: string,
  baseline?: ProductMasterSnapshotPayload
) {
  const errors: string[] = [];

  const titleEn = textInputValue(draft.content.titleEn).trim();
  const brand = textInputValue(draft.identity.brand).trim();
  const fulltype = textInputValue(draft.taxonomy.productFulltype).trim();
  const images = Array.isArray(draft.content.images)
    ? (draft.content.images as string[]).filter((item) => String(item).trim())
    : [];

  if (!titleEn) {
    errors.push('商品信息缺少标题 EN。');
  }
  if (!brand) {
    errors.push('商品信息缺少品牌。');
  }
  if (!fulltype) {
    errors.push('商品信息缺少 Fulltype。');
  }
  if (!images.length) {
    errors.push('商品信息至少需要保留 1 张图片。');
  }

  const offers =
    mode === 'all'
      ? draft.siteOffers
      : draft.siteOffers.filter((item) => siteOfferCode(item) === currentSiteCode);
  const baselineOfferMap = new Map(
    (baseline?.siteOffers ?? []).map((item) => [siteOfferCode(item), item] as const)
  );

  offers.forEach((offer) => {
    const baselineOffer = baselineOfferMap.get(siteOfferCode(offer));
    if (baselineOffer && siteOfferEditableFieldsEqual(offer, baselineOffer)) {
      return;
    }
    const label = `${formatSnapshotValue(offer.site)} / ${siteOfferCode(offer)}`;
    errors.push(...collectSiteOfferValidationIssues(offer, label));
  });

  if (baseline) {
    errors.push(...collectUnsupportedProductPublishIssues(draft, baseline, currentSiteCode));
  }

  return errors;
}

export function buildMockPublishState(
  currentValue: ProductWorkbenchState,
  currentSiteCode?: string
) {
  const nextBaseline = cloneSnapshotPayload(currentValue.baseline);
  const nextDraft = cloneSnapshotPayload(currentValue.draft);

  nextBaseline.identity = cloneRecord(nextDraft.identity);
  nextBaseline.taxonomy = cloneRecord(nextDraft.taxonomy);
  nextBaseline.content = cloneRecord(nextDraft.content);
  nextBaseline.keyAttributes = cloneRecordList(nextDraft.keyAttributes);
  nextBaseline.group = cloneRecord(nextDraft.group);
  nextBaseline.variants = cloneRecordList(nextDraft.variants);

  nextBaseline.siteOffers = cloneRecordList(currentValue.baseline.siteOffers).map((item) => {
    if (siteOfferCode(item) === currentSiteCode) {
      const matchedDraft = nextDraft.siteOffers.find((draftItem) => siteOfferCode(draftItem) === siteOfferCode(item));
      return matchedDraft ? cloneRecord(matchedDraft) : item;
    }
    return item;
  });

  const fetchedAt = nowSyncTime();
  nextBaseline.storeContext = {
    ...nextBaseline.storeContext,
    fetchedAt
  };
  nextDraft.storeContext = {
    ...nextDraft.storeContext,
    fetchedAt
  };

  return {
    baseline: nextBaseline,
    draft: nextDraft,
    syncStatus: areSnapshotPartsEqual(nextBaseline, nextDraft) ? 'synced' : 'draft',
    lastSyncedAt: fetchedAt,
    note: '已发布当前修改；系统会按改动字段更新当前内容，其它未改站点保持不动。',
    keyContentHistory: currentValue.keyContentHistory,
    pendingKeyContentHistoryCount: currentValue.pendingKeyContentHistoryCount,
    pendingKeyContentHistoryVisibleAfter: currentValue.pendingKeyContentHistoryVisibleAfter
  } satisfies ProductWorkbenchState;
}
