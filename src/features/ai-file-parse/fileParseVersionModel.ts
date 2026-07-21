import type { FileParseVersionItemPayload, FileParseVersionSummaryPayload } from './api';
import { readFieldDisplayValue } from './helpers';
import { fileParseItemTypeLabel } from './fileParseResultModel';
import type {
  AiParseChangeType,
  AiParseResultItem,
  AiParseTargetOutputPlan,
  AiParseVersion,
  AiParseVersionSnapshotItem
} from './types';

export type VersionCompareRow = {
  id: string;
  changeType: AiParseChangeType;
  itemTypeLabel: string;
  naturalKey: string;
  baseFields?: AiParseVersionSnapshotItem['fields'];
  targetFields?: AiParseVersionSnapshotItem['fields'];
  changedFieldKeys: string[];
  validationStatus: AiParseResultItem['validationStatus'];
  validationMessage: string;
};

function toDisplayDate(value: string | null | undefined) {
  return value ? value.replace('T', ' ').slice(0, 19) : '-';
}

function normalizeFields(fields: Record<string, unknown> | null | undefined) {
  return Object.fromEntries(Object.entries(fields ?? {}).map(([key, value]) => {
    if (value === null || value === undefined) return [key, null];
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return [key, value];
    return [key, JSON.stringify(value)];
  }));
}

export function mapVersion(version: FileParseVersionSummaryPayload, plan: AiParseTargetOutputPlan | undefined): AiParseVersion {
  const summary = version.summary ?? {};
  return {
    id: String(version.versionId),
    versionNo: version.versionNo,
    targetPlanId: String(version.targetPlanId),
    documentType: plan?.documentType ?? '',
    documentName: plan?.documentName ?? '',
    standardVersion: plan?.standardVersion ?? '',
    storeLabel: plan?.storeLabel ?? '全局',
    businessScopeText: plan?.label ?? '-',
    publishedAt: toDisplayDate(version.publishedAt),
    publisherName: version.publishedBy ? `用户 ${version.publishedBy}` : '-',
    sourceTaskId: version.sourceTaskId ? String(version.sourceTaskId) : '',
    status: version.status,
    inputSummary: '-',
    itemCount: typeof summary.itemCount === 'number' ? summary.itemCount : 0
  };
}

export function mapVersionSnapshotItem(item: FileParseVersionItemPayload): AiParseVersionSnapshotItem {
  return {
    id: String(item.versionItemId),
    versionId: String(item.versionId),
    itemTypeLabel: fileParseItemTypeLabel(item.itemType),
    naturalKey: item.naturalKey,
    fields: normalizeFields(item.fields),
    sourceResultItemId: item.sourceResultItemId == null ? undefined : String(item.sourceResultItemId)
  };
}

export function sortVersionsByPublishedAt(versions: AiParseVersion[]) {
  return [...versions].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export function buildVersionCompareRows(
  snapshots: AiParseVersionSnapshotItem[],
  fieldKeys: string[],
  baseVersion: AiParseVersion | undefined,
  targetVersion: AiParseVersion | undefined
): VersionCompareRow[] {
  if (!baseVersion || !targetVersion) return [];
  const baseMap = new Map(
    snapshots.filter((item) => item.versionId === baseVersion.id).map((item) => [item.naturalKey, item])
  );
  const targetMap = new Map(
    snapshots.filter((item) => item.versionId === targetVersion.id).map((item) => [item.naturalKey, item])
  );
  return Array.from(new Set([...baseMap.keys(), ...targetMap.keys()])).map((naturalKey) => {
    const baseItem = baseMap.get(naturalKey);
    const targetItem = targetMap.get(naturalKey);
    const changedFieldKeys = fieldKeys.filter(
      (key) => readFieldDisplayValue(baseItem?.fields[key]) !== readFieldDisplayValue(targetItem?.fields[key])
    );
    let changeType: AiParseChangeType = 'unchanged';
    if (!baseItem && targetItem) changeType = 'added';
    else if (baseItem && !targetItem) changeType = 'delete_suspected';
    else if (changedFieldKeys.length) changeType = 'changed';
    return {
      id: `${baseVersion.id}-${targetVersion.id}-${naturalKey}`,
      changeType,
      itemTypeLabel: targetItem?.itemTypeLabel ?? baseItem?.itemTypeLabel ?? '-',
      naturalKey,
      baseFields: baseItem?.fields,
      targetFields: targetItem?.fields,
      changedFieldKeys,
      validationStatus: 'pass' as const,
      validationMessage: '-'
    };
  }).filter((row) => row.changeType !== 'unchanged');
}
