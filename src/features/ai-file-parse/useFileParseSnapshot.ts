import { useEffect, useMemo, useState } from 'react';
import { App as AntdApp } from 'antd';
import {
  fetchFileParseOverviewItems,
  fetchFileParseProcessingItems,
  fetchFileParseTaskDetail,
  fetchFileParseVersionItems,
  fetchFileParseVersions
} from './api';
import { deriveTaskStatus, getDisplayResultFields, getTableVisibleFields, isBlockingItem } from './helpers';
import { mapColumnsToFields, mapOverviewItem, mapProcessingItem } from './fileParseResultModel';
import { mergeTaskDetail } from './fileParseTaskModel';
import {
  buildVersionCompareRows,
  mapVersion,
  mapVersionSnapshotItem,
  sortVersionsByPublishedAt
} from './fileParseVersionModel';
import type {
  AiParseDocumentStandard,
  AiParseResultItem,
  AiParseStandardField,
  AiParseTargetOutputPlan,
  AiParseTask,
  AiParseVersion,
  AiParseVersionSnapshotItem
} from './types';

type AppContext = ReturnType<typeof AntdApp.useApp>;

type SnapshotInput = {
  messageApi: AppContext['message'];
  targetPlans: AiParseTargetOutputPlan[];
  tasks: AiParseTask[];
  setTasks: React.Dispatch<React.SetStateAction<AiParseTask[]>>;
  selectedTaskId: string;
  viewMode: 'list' | 'detail';
};

export function useFileParseSnapshot(input: SnapshotInput) {
  const { messageApi, selectedTaskId, setTasks, targetPlans, tasks, viewMode } = input;
  const [items, setItems] = useState<AiParseResultItem[]>([]);
  const [overviewItems, setOverviewItems] = useState<AiParseResultItem[]>([]);
  const [versions, setVersions] = useState<AiParseVersion[]>([]);
  const [snapshots, setSnapshots] = useState<AiParseVersionSnapshotItem[]>([]);
  const [resultFields, setResultFields] = useState<AiParseStandardField[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailLoadRevision, setDetailLoadRevision] = useState(0);
  const [detailTab, setDetailTab] = useState('processing');
  const [compareBaseVersionId, setCompareBaseVersionId] = useState('');
  const [compareTargetVersionId, setCompareTargetVersionId] = useState('');

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? tasks[0],
    [selectedTaskId, tasks]
  );
  const selectedTargetPlan = useMemo(
    () => targetPlans.find((plan) => plan.id === selectedTask?.targetPlanId),
    [selectedTask?.targetPlanId, targetPlans]
  );
  const selectedStandard = useMemo<AiParseDocumentStandard | undefined>(() => {
    if (!selectedTask || !resultFields.length) return undefined;
    return {
      id: selectedTargetPlan?.standardId ?? `standard-${selectedTask.targetPlanId}`,
      documentType: selectedTask.documentType,
      documentName: selectedTask.documentName,
      standardVersion: selectedTask.standardVersion,
      description: selectedTargetPlan?.description ?? '',
      active: true,
      supportedInputs: ['EXCEL', 'PDF', 'IMAGE', 'OCR_TEXT', 'MANUAL_TEXT'],
      businessScopeFields: [],
      resultFields,
      itemTypes: selectedTargetPlan?.itemTypes ?? [],
      publishAdapterLabel: '解析版本'
    };
  }, [resultFields, selectedTargetPlan, selectedTask]);
  const selectedItems = useMemo(
    () => items.filter((item) => item.taskId === selectedTask?.id),
    [items, selectedTask?.id]
  );
  const blockingItems = useMemo(() => selectedItems.filter(isBlockingItem), [selectedItems]);
  const selectedVersions = useMemo(
    () => versions.filter((version) => version.targetPlanId === selectedTask?.targetPlanId),
    [selectedTask?.targetPlanId, versions]
  );
  const sortedVersions = useMemo(() => sortVersionsByPublishedAt(selectedVersions), [selectedVersions]);
  const selectedBaseVersion = sortedVersions.find((version) => version.id === compareBaseVersionId)
    ?? sortedVersions[1]
    ?? sortedVersions[0];
  const selectedTargetVersion = sortedVersions.find((version) => version.id === compareTargetVersionId)
    ?? sortedVersions[0];
  const allResultFields = getDisplayResultFields(selectedStandard);
  const visibleFields = getTableVisibleFields(selectedStandard);
  const versionCompareRows = useMemo(
    () => buildVersionCompareRows(
      snapshots,
      allResultFields.map((field) => field.key),
      selectedBaseVersion,
      selectedTargetVersion
    ),
    [allResultFields, selectedBaseVersion, selectedTargetVersion, snapshots]
  );

  const loadDetailData = async (taskId: string) => {
    setDetailLoadRevision((current) => current + 1);
    setDetailLoading(true);
    try {
      const detail = await fetchFileParseTaskDetail(taskId);
      const detailTask = mergeTaskDetail(tasks.find((task) => task.id === taskId), detail);
      setTasks((current) => current.some((task) => task.id === detailTask.id)
        ? current.map((task) => task.id === detailTask.id ? { ...task, ...detailTask, stats: task.stats } : task)
        : [detailTask, ...current]);
      const hasResults = !['reading', 'parsing', 'retry_waiting', 'failed'].includes(detailTask.status);
      if (!hasResults) {
        const versionView = await fetchFileParseVersions(detailTask.targetPlanId).catch(() => null);
        setVersions(versionView?.items.map((version) => mapVersion(
          version,
          targetPlans.find((plan) => plan.id === String(version.targetPlanId))
        )) ?? []);
        setItems([]);
        setOverviewItems([]);
        setResultFields([]);
        setSnapshots([]);
        return;
      }
      const [processingView, overviewView, versionView] = await Promise.all([
        fetchFileParseProcessingItems(taskId),
        fetchFileParseOverviewItems(taskId),
        fetchFileParseVersions(detailTask.targetPlanId)
      ]);
      const nextVersions = versionView.items.map((version) => mapVersion(
        version,
        targetPlans.find((plan) => plan.id === String(version.targetPlanId))
      ));
      const snapshotViews = await Promise.all(
        nextVersions.map((version) => fetchFileParseVersionItems(version.id).catch(() => null))
      );
      const nextItems = processingView.items.map(mapProcessingItem);
      setItems(nextItems);
      setOverviewItems(overviewView.items.map(mapOverviewItem));
      setResultFields(mapColumnsToFields(processingView.columns.length ? processingView.columns : overviewView.columns));
      setVersions(nextVersions);
      setSnapshots(snapshotViews.flatMap((view) => view?.items ?? []).map(mapVersionSnapshotItem));
      setTasks((current) => current.map((task) => task.id === detailTask.id ? {
        ...task,
        status: deriveTaskStatus(nextItems, detailTask.status),
        stats: {
          total: nextItems.filter((item) => item.changeType !== 'delete_suspected').length,
          pending: nextItems.filter((item) => item.reviewStatus === 'pending' && item.changeType !== 'delete_suspected').length,
          needsFix: nextItems.filter((item) => item.reviewStatus === 'needs_fix').length,
          conflicts: nextItems.filter((item) => item.changeType === 'conflict').length,
          deleteSuspected: nextItems.filter((item) => item.changeType === 'delete_suspected').length,
          hardErrors: nextItems.filter((item) => item.reviewStatus === 'hard_error').length,
          confirmed: nextItems.filter((item) => item.reviewStatus === 'confirmed' || item.reviewStatus === 'keep_old').length
        }
      } : task));
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载解析详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'detail' && selectedTaskId && targetPlans.length) void loadDetailData(selectedTaskId);
  }, [selectedTaskId, targetPlans.length, viewMode]);

  useEffect(() => {
    const targetId = sortedVersions[0]?.id ?? '';
    const baseId = sortedVersions[1]?.id ?? targetId;
    setCompareBaseVersionId((current) => sortedVersions.some((version) => version.id === current) ? current : baseId);
    setCompareTargetVersionId((current) => sortedVersions.some((version) => version.id === current) ? current : targetId);
  }, [sortedVersions.map((version) => version.id).join('|')]);

  useEffect(() => {
    if (detailTab === 'result') setDetailTab('processing');
  }, [detailTab]);

  return {
    selectedTask,
    selectedTargetPlan,
    selectedStandard,
    selectedItems,
    blockingItems,
    overviewItems,
    detailLoading,
    detailLoadRevision,
    detailTab,
    setDetailTab,
    allResultFields,
    visibleFields,
    sortedVersions,
    selectedBaseVersion,
    selectedTargetVersion,
    setCompareBaseVersionId,
    setCompareTargetVersionId,
    versionCompareRows,
    loadDetailData
  };
}
