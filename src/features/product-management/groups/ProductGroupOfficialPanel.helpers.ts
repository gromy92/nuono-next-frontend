import type { ProductWorkbenchPayload } from '../types';
import { normalizeNoonImageUrl, textInputValue } from '../utils';
import type { ProductGroupMemberCardView } from './productGroupMemberTypes';
import type { ProductGroupMemberDraft } from './ProductGroupMemberEditModal';

function contentImages(content: Record<string, unknown>) {
  const images = Array.isArray(content.images) ? content.images : [];
  return [content.mainImageUrl, ...images].map(normalizeNoonImageUrl).filter(Boolean);
}

function firstImage(content: Record<string, unknown>) {
  return contentImages(content)[0];
}

function recordImages(record: Record<string, unknown>) {
  const images = Array.isArray(record.galleryImages) ? record.galleryImages : [];
  return [
    record.imageUrl,
    record.mainImageUrl,
    record.imageKey,
    record.image_key,
    ...images
  ].map(normalizeNoonImageUrl).filter(Boolean);
}

export function attributeValue(snapshot: ProductWorkbenchPayload | undefined, code?: string) {
  if (!code) {
    return '';
  }
  const attribute = snapshot?.keyAttributes.find((item) => textInputValue(item.code) === code);
  if (!attribute) {
    return '';
  }
  const enValue = textInputValue(attribute.enValue || attribute.commonValue);
  const arValue = textInputValue(attribute.arValue);
  return [enValue, arValue].filter(Boolean).join(', ');
}

export function memberRecordKey(record: Record<string, unknown>) {
  return textInputValue(
    record.skuParent ||
    record.parentSku ||
    record.sku ||
    record.zskuParent ||
    record.memberSku ||
    record.childSku ||
    record.partnerSku
  ).trim();
}

export function recordAxisValue(record: Record<string, unknown>, axisCode?: string) {
  if (!axisCode) {
    return '';
  }
  const axisValues = typeof record.axisValues === 'object' && record.axisValues ? record.axisValues as Record<string, unknown> : {};
  const axisSpecificValue = textInputValue(record[axisCode] || axisValues[axisCode]);
  if (axisSpecificValue) {
    return axisSpecificValue;
  }
  return Object.keys(axisValues).length ? '' : textInputValue(record.axisValue);
}

function currentMemberView(
  snapshot: ProductWorkbenchPayload,
  axisLabel?: string,
  axisCode?: string
): ProductGroupMemberCardView {
  return {
    key: textInputValue(snapshot.identity.skuParent),
    skuParent: textInputValue(snapshot.identity.skuParent),
    childSku: textInputValue(snapshot.identity.childSku),
    brand: textInputValue(snapshot.identity.brand),
    title: textInputValue(snapshot.content.titleEn || snapshot.content.fullTitleEn),
    imageUrl: firstImage(snapshot.content),
    galleryImages: contentImages(snapshot.content),
    axisLabel,
    axisValue: attributeValue(snapshot, axisCode),
    current: true
  };
}

export function memberView(
  record: Record<string, unknown>,
  snapshot: ProductWorkbenchPayload,
  axisLabel?: string,
  axisCode?: string
): ProductGroupMemberCardView {
  const skuParent = memberRecordKey(record);
  if (skuParent && skuParent === textInputValue(snapshot.identity.skuParent)) {
    const currentView = currentMemberView(snapshot, axisLabel, axisCode);
    return { ...currentView, axisValue: recordAxisValue(record, axisCode) || currentView.axisValue };
  }
  return {
    key: skuParent || textInputValue(record.childSku || record.partnerSku),
    skuParent,
    childSku: textInputValue(record.childSku || record.skuChild),
    brand: textInputValue(record.brand || snapshot.identity.brand),
    title: textInputValue(record.title || record.titleEn || record.productTitle),
    imageUrl: recordImages(record)[0],
    galleryImages: recordImages(record),
    axisLabel,
    axisValue: recordAxisValue(record, axisCode),
    current: false
  };
}

export function groupAxes(group: Record<string, unknown>) {
  return Array.isArray(group.axes) ? (group.axes as Array<Record<string, unknown>>) : [];
}

export function memberDraftFromView(member: ProductGroupMemberCardView): ProductGroupMemberDraft {
  const axisValues: Record<string, string> = {};
  member.axisRows?.forEach((axis) => {
    if (axis.code) {
      axisValues[axis.code] = textInputValue(axis.value);
    }
  });

  return {
    skuParent: member.skuParent,
    childSku: member.childSku,
    brand: member.brand,
    title: member.title,
    imageUrl: member.imageUrl,
    galleryImages: member.galleryImages,
    axisValue: member.axisValue,
    axisValues,
    axisRows: member.axisRows
  };
}

export function memberRecordFromDraft(
  draft: ProductGroupMemberDraft,
  axisCode: string | undefined,
  group: Record<string, unknown>,
  fallback: Record<string, unknown> = {}
) {
  const axes = groupAxes(group)
    .map((axis) => ({
      code: textInputValue(axis.axisCode),
      label: textInputValue(axis.axisName || axis.axisCode)
    }))
    .filter((axis) => axis.code);
  const nextRecord: Record<string, unknown> = {
    ...fallback,
    skuParent: draft.skuParent,
    childSku: draft.childSku,
    brand: draft.brand,
    title: draft.title,
    groupRef: group.groupRef,
    groupRefCanonical: group.groupRefCanonical
  };
  const axisValue = textInputValue(draft.axisValue);
  if (axisCode) {
    const axisCount = axes.length;
    const axisValues = typeof fallback.axisValues === 'object' && fallback.axisValues ? { ...(fallback.axisValues as Record<string, unknown>) } : {};
    if (axisCount <= 1) {
      nextRecord.axisValue = axisValue;
      nextRecord[axisCode] = axisValue;
      if (axisValue) {
        axisValues[axisCode] = axisValue;
      } else {
        delete axisValues[axisCode];
      }
    } else {
      delete nextRecord.axisValue;
      axes.forEach((axis) => {
        const nextAxisValue = textInputValue(
          draft.axisValues && Object.prototype.hasOwnProperty.call(draft.axisValues, axis.code)
            ? draft.axisValues[axis.code]
            : recordAxisValue(fallback, axis.code)
        );
        nextRecord[axis.code] = nextAxisValue;
        if (nextAxisValue) {
          axisValues[axis.code] = nextAxisValue;
        } else {
          delete axisValues[axis.code];
        }
      });
    }
    nextRecord.axisValues = axisValues;
  }
  return nextRecord;
}
