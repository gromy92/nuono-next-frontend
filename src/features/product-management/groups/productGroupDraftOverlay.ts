import type { ProductListRowPayload } from '../types';
import { textInputValue } from '../utils';

export type ProductGroupDraftOverlay = {
  groupKey: string;
  skuGroup?: string;
  groupRef?: string;
  groupRefCanonical?: string;
  memberSkuParents: string[];
};

function firstText(...values: Array<unknown>) {
  return values.map((value) => textInputValue(value).trim()).find(Boolean);
}

function memberSkuParent(member: Record<string, unknown>) {
  return firstText(
    member.skuParent,
    member.parentSku,
    member.sku,
    member.zskuParent,
    member.memberSku,
    member.childSku,
    member.partnerSku
  );
}

export function buildProductGroupDraftOverlay(
  group: Record<string, unknown> | undefined,
  members: Array<Record<string, unknown>>
): ProductGroupDraftOverlay | undefined {
  const groupKey = firstText(group?.skuGroup, group?.groupRefCanonical, group?.groupRef);
  if (!groupKey) {
    return undefined;
  }

  return {
    groupKey,
    skuGroup: firstText(group?.skuGroup),
    groupRef: firstText(group?.groupRef, group?.groupRefCanonical, group?.skuGroup),
    groupRefCanonical: firstText(group?.groupRefCanonical),
    memberSkuParents: members.map(memberSkuParent).filter((item): item is string => Boolean(item))
  };
}

export function sameProductGroupDraftOverlay(left?: ProductGroupDraftOverlay, right?: ProductGroupDraftOverlay) {
  if (!left || !right) {
    return left === right;
  }
  if (
    left.groupKey !== right.groupKey ||
    left.skuGroup !== right.skuGroup ||
    left.groupRef !== right.groupRef ||
    left.groupRefCanonical !== right.groupRefCanonical ||
    left.memberSkuParents.length !== right.memberSkuParents.length
  ) {
    return false;
  }
  const leftMembers = new Set(left.memberSkuParents);
  return right.memberSkuParents.every((item) => leftMembers.has(item));
}

export function applyProductGroupDraftOverlays(
  sourceItems: ProductListRowPayload[],
  overlays: ProductGroupDraftOverlay[]
) {
  const activeOverlays = overlays.filter((overlay) => overlay.groupKey);
  if (!activeOverlays.length) {
    return sourceItems;
  }
  const overlayGroupKeys = new Set(activeOverlays.map((overlay) => overlay.groupKey));
  const overlayMembersByGroup = new Map(
    activeOverlays.map((overlay) => [overlay.groupKey, new Set(overlay.memberSkuParents)] as const)
  );

  let changed = false;
  const nextItems = sourceItems.map((item) => {
    const skuParent = textInputValue(item.skuParent).trim();
    const projectedGroupKey = firstText(item.skuGroup, item.groupRefCanonical, item.groupRef);
    const targetOverlay = activeOverlays.find((overlay) => overlayMembersByGroup.get(overlay.groupKey)?.has(skuParent));

    if (targetOverlay && projectedGroupKey !== targetOverlay.groupKey) {
      changed = true;
      return {
        ...item,
        skuGroup: targetOverlay.skuGroup,
        groupRef: targetOverlay.groupRef,
        groupRefCanonical: targetOverlay.groupRefCanonical
      };
    }

    if (!targetOverlay && projectedGroupKey && overlayGroupKeys.has(projectedGroupKey)) {
      changed = true;
      return {
        ...item,
        skuGroup: undefined,
        groupRefCanonical: undefined,
        groupRef: undefined
      };
    }

    return item;
  });

  return changed ? nextItems : sourceItems;
}
