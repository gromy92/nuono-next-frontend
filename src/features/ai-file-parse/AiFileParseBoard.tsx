import { useEffect, useMemo, useRef, useState } from 'react';
import {
  App as AntdApp,
  Form
} from 'antd';
import type { UploadFile } from 'antd';
import { aiParseStandards } from './mockData';
import {
  batchAcceptFileParseItems,
  createFileParseIdempotencyKey,
  createFileParseTask,
  deleteFileParseTask,
  downloadFileParseOverview,
  fetchFileParseLogisticsActivations,
  fetchFileParseOverviewItems,
  fetchFileParseProcessingItems,
  fetchFileParseTargetPlans,
  fetchFileParseTaskDetail,
  fetchFileParseTasks,
  fetchFileParseVersionItems,
  fetchFileParseVersions,
  fetchFileParseWorkflow,
  publishFileParseTask,
  reviewFileParseItem,
  runFileParseTask,
  saveFileParseLogisticsActivations,
  uploadFileParseInput,
  type FileParseLogisticsActivationPayload,
  type FileParseWorkflowPayload
} from './api';
import type { CreateBatchFormValues, EditResultFormValues } from './AiFileParseOverlays';
import { AiFileParseBoardView } from './AiFileParseBoardView';
import {
  buildVersionCompareRows,
  isLogisticsTargetPlan,
  mapColumnsToFields,
  mapOverviewItem,
  mapProcessingItem,
  mapTargetPlan,
  mapTaskFromList,
  mapVersion,
  mapVersionSnapshotItem,
  mergeTaskDetail,
  sortVersionsByPublishedAt
} from './boardTransforms';
import {
  deriveTaskStatus,
  getDisplayResultFields,
  getTableVisibleFields,
  isBlockingItem
} from './helpers';
import type {
  AiParseResultItem,
  AiParseReviewStatus,
  AiParseRolePermission,
  AiParseStandardField,
  AiParseTaskFilters,
  AiParseTargetOutputPlan,
  AiParseTask,
  AiParseVersion,
  AiParseVersionSnapshotItem
} from './types';
import './aiFileParse.css';

const EMPTY_TASK_FILTERS: AiParseTaskFilters = {
  targetPlanId: '',
  status: '',
  keyword: ''
};

function taskFiltersToQuery(filters: AiParseTaskFilters) {
  const keyword = filters.keyword.trim();
  return {
    targetPlanId: filters.targetPlanId ? Number(filters.targetPlanId) : undefined,
    status: filters.status || undefined,
    keyword: keyword || undefined
  };
}

export function AiFileParseBoard() {
  const { message: messageApi, modal } = AntdApp.useApp();
  const [targetPlans, setTargetPlans] = useState<AiParseTargetOutputPlan[]>([]);
  const [tasks, setTasks] = useState<AiParseTask[]>([]);
  const [items, setItems] = useState<AiParseResultItem[]>([]);
  const [overviewItems, setOverviewItems] = useState<AiParseResultItem[]>([]);
  const [versions, setVersions] = useState<AiParseVersion[]>([]);
  const [versionSnapshots, setVersionSnapshots] = useState<AiParseVersionSnapshotItem[]>([]);
  const [workflow, setWorkflow] = useState<FileParseWorkflowPayload | null>(null);
  const [resultFields, setResultFields] = useState<AiParseStandardField[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [taskFilters, setTaskFilters] = useState<AiParseTaskFilters>(EMPTY_TASK_FILTERS);
  const [detailTab, setDetailTab] = useState('processing');
  const [reviewFilter, setReviewFilter] = useState<AiParseReviewStatus | 'ALL'>('ALL');
  const [selectedProcessingItemIds, setSelectedProcessingItemIds] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createParentTask, setCreateParentTask] = useState<AiParseTask | null>(null);
  const [createTargetPlanId, setCreateTargetPlanId] = useState('');
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [editingItem, setEditingItem] = useState<AiParseResultItem | null>(null);
  const [comparingItem, setComparingItem] = useState<AiParseResultItem | null>(null);
  const [compareBaseVersionId, setCompareBaseVersionId] = useState('');
  const [compareTargetVersionId, setCompareTargetVersionId] = useState('');
  const [logisticsActivation, setLogisticsActivation] = useState<FileParseLogisticsActivationPayload | null>(null);
  const [logisticsVersionId, setLogisticsVersionId] = useState('');
  const [selectedLogisticsChannelKeys, setSelectedLogisticsChannelKeys] = useState<string[]>([]);
  const [logisticsLoading, setLogisticsLoading] = useState(false);
  const [createForm] = Form.useForm<CreateBatchFormValues>();
  const [editForm] = Form.useForm<EditResultFormValues>();
  const createSubmittingRef = useRef(false);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? tasks[0],
    [selectedTaskId, tasks]
  );
  const selectedTargetPlan = useMemo(
    () => targetPlans.find((plan) => plan.id === selectedTask?.targetPlanId),
    [selectedTask?.targetPlanId, targetPlans]
  );
  const isLogisticsPlan = isLogisticsTargetPlan(selectedTargetPlan);
  const permission = useMemo<AiParseRolePermission>(
    () => ({
      role: 'admin',
      label: '当前账号',
      scope: '当前可见范围',
      canDraftEdit: Boolean(selectedTask?.availableActions?.canProcess ?? selectedTargetPlan?.availableActions?.canProcess),
      canPublish: Boolean(selectedTask?.availableActions?.canPublish ?? selectedTargetPlan?.availableActions?.canPublish),
      canActivateLogisticsChannels: Boolean(
        selectedTask?.availableActions?.canActivateLogisticsChannels ?? selectedTargetPlan?.availableActions?.canActivateLogisticsChannels
      ),
      canManageStandard: Boolean(selectedTask?.availableActions?.canManageStandard ?? selectedTargetPlan?.availableActions?.canManageStandard)
    }),
    [selectedTargetPlan, selectedTask]
  );
  const selectedStandard = useMemo(
    () => {
      const fallbackStandard =
        aiParseStandards.find((standard) => standard.id === selectedTargetPlan?.standardId) ??
        aiParseStandards.find((standard) => standard.documentName === selectedTask?.documentName);
      if (!resultFields.length) {
        return fallbackStandard;
      }
      return {
        id: fallbackStandard?.id ?? `standard-${selectedTask?.targetPlanId ?? 'current'}`,
        documentType: selectedTask?.documentType ?? fallbackStandard?.documentType ?? '',
        documentName: selectedTask?.documentName ?? fallbackStandard?.documentName ?? '',
        standardVersion: selectedTask?.standardVersion ?? fallbackStandard?.standardVersion ?? '',
        description: fallbackStandard?.description ?? '',
        active: true,
        supportedInputs: fallbackStandard?.supportedInputs ?? ['EXCEL', 'PDF', 'IMAGE', 'OCR_TEXT', 'MANUAL_TEXT'],
        businessScopeFields: fallbackStandard?.businessScopeFields ?? [],
        resultFields,
        itemTypes: selectedTargetPlan?.itemTypes?.length ? selectedTargetPlan.itemTypes : (fallbackStandard?.itemTypes ?? []),
        publishAdapterLabel: fallbackStandard?.publishAdapterLabel ?? '解析版本'
      };
    },
    [resultFields, selectedTargetPlan?.itemTypes, selectedTargetPlan?.standardId, selectedTask?.documentName, selectedTask?.documentType, selectedTask?.standardVersion, selectedTask?.targetPlanId]
  );
  const selectedItems = useMemo(
    () => items.filter((item) => item.taskId === selectedTask?.id),
    [items, selectedTask?.id]
  );
  const filteredItems = useMemo(
    () => selectedItems.filter((item) => reviewFilter === 'ALL' || item.reviewStatus === reviewFilter),
    [reviewFilter, selectedItems]
  );
  const blockingItems = useMemo(() => selectedItems.filter((item) => isBlockingItem(item)), [selectedItems]);
  const selectedVersions = useMemo(
    () =>
      versions.filter(
        (version) => version.targetPlanId === selectedTask?.targetPlanId
      ),
    [selectedTask?.targetPlanId, versions]
  );
  const sortedSelectedVersions = useMemo(() => sortVersionsByPublishedAt(selectedVersions), [selectedVersions]);
  const selectedVersionIds = useMemo(() => sortedSelectedVersions.map((version) => version.id).join('|'), [sortedSelectedVersions]);
  const selectedBaseVersion = useMemo(
    () => sortedSelectedVersions.find((version) => version.id === compareBaseVersionId) ?? sortedSelectedVersions[1] ?? sortedSelectedVersions[0],
    [compareBaseVersionId, sortedSelectedVersions]
  );
  const selectedTargetVersion = useMemo(
    () => sortedSelectedVersions.find((version) => version.id === compareTargetVersionId) ?? sortedSelectedVersions[0],
    [compareTargetVersionId, sortedSelectedVersions]
  );
  const createTargetPlan = useMemo(
    () => targetPlans.find((plan) => plan.id === createTargetPlanId) ?? targetPlans[0],
    [createTargetPlanId, targetPlans]
  );
  const visibleFields = getTableVisibleFields(selectedStandard);
  const allResultFields = getDisplayResultFields(selectedStandard);
  const versionCompareRows = useMemo(
    () =>
      buildVersionCompareRows(
        versionSnapshots,
        allResultFields.map((field) => field.key),
        selectedBaseVersion,
        selectedTargetVersion
      ),
    [allResultFields, selectedBaseVersion, selectedTargetVersion, versionSnapshots]
  );

  const loadTasks = async (nextSelectedTaskId?: string, filtersOverride = taskFilters) => {
    const taskList = await fetchFileParseTasks({
      ...taskFiltersToQuery(filtersOverride),
      page: 1,
      pageSize: 50
    });
    const mappedTasks = taskList.items.map(mapTaskFromList);
    setTasks((currentTasks) =>
      mappedTasks.map((task) => ({
        ...task,
        inputItems: currentTasks.find((currentTask) => currentTask.id === task.id)?.inputItems ?? task.inputItems
      }))
    );
    const requestedSelectedId = nextSelectedTaskId && mappedTasks.some((task) => task.id === nextSelectedTaskId)
      ? nextSelectedTaskId
      : '';
    const currentSelectedId = selectedTaskId && mappedTasks.some((task) => task.id === selectedTaskId)
      ? selectedTaskId
      : '';
    const resolvedSelectedId = requestedSelectedId || currentSelectedId || mappedTasks[0]?.id || '';
    if (resolvedSelectedId) {
      setSelectedTaskId(resolvedSelectedId);
    } else {
      setSelectedTaskId('');
      setViewMode('list');
    }
    return mappedTasks;
  };

  const loadDetailData = async (taskId: string) => {
    setDetailLoading(true);
    setSelectedProcessingItemIds([]);
    try {
      const detail = await fetchFileParseTaskDetail(taskId);
      const detailTask = mergeTaskDetail(tasks.find((task) => task.id === taskId), detail);
      setTasks((currentTasks) => {
        const exists = currentTasks.some((task) => task.id === detailTask.id);
        return exists
          ? currentTasks.map((task) => (task.id === detailTask.id ? { ...task, ...detailTask, stats: task.stats } : task))
          : [detailTask, ...currentTasks];
      });

      const workflowView = await fetchFileParseWorkflow(taskId).catch(() => null);
      setWorkflow(workflowView);

      const shouldLoadResultTabs = !['reading', 'parsing', 'retry_waiting', 'failed'].includes(detailTask.status);
      if (shouldLoadResultTabs) {
        const [processingView, overviewView, versionView] = await Promise.all([
          fetchFileParseProcessingItems(taskId),
          fetchFileParseOverviewItems(taskId),
          fetchFileParseVersions(detailTask.targetPlanId)
        ]);
        const nextItems = processingView.items.map(mapProcessingItem);
        const nextOverviewItems = overviewView.items.map(mapOverviewItem);
        const nextFields = mapColumnsToFields(processingView.columns.length ? processingView.columns : overviewView.columns);
        const taskPlans = targetPlans;
        const nextVersions = versionView.items.map((version) =>
          mapVersion(version, taskPlans.find((plan) => plan.id === String(version.targetPlanId)))
        );
        const snapshotViews = await Promise.all(
          nextVersions.map((version) => fetchFileParseVersionItems(version.id).catch(() => null))
        );
        setItems(nextItems);
        setOverviewItems(nextOverviewItems);
        setResultFields(nextFields);
        setVersions(nextVersions);
        setVersionSnapshots(
          snapshotViews
            .flatMap((view) => view?.items ?? [])
            .map(mapVersionSnapshotItem)
        );
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === detailTask.id
              ? {
                  ...task,
                  stats: {
                    total: nextItems.filter((item) => item.changeType !== 'delete_suspected').length,
                    pending: nextItems.filter((item) => item.reviewStatus === 'pending' && item.changeType !== 'delete_suspected').length,
                    needsFix: nextItems.filter((item) => item.reviewStatus === 'needs_fix').length,
                    conflicts: nextItems.filter((item) => item.changeType === 'conflict').length,
                    deleteSuspected: nextItems.filter((item) => item.changeType === 'delete_suspected').length,
                    hardErrors: nextItems.filter((item) => item.reviewStatus === 'hard_error').length,
                    confirmed: nextItems.filter((item) => item.reviewStatus === 'confirmed' || item.reviewStatus === 'keep_old').length
                  },
                  status: deriveTaskStatus(nextItems, detailTask.status)
                }
              : task
          )
        );
      } else {
        setItems([]);
        setOverviewItems([]);
        setResultFields([]);
        const versionView = await fetchFileParseVersions(detailTask.targetPlanId).catch(() => null);
        setVersions(
          versionView?.items.map((version) =>
            mapVersion(version, targetPlans.find((plan) => plan.id === String(version.targetPlanId)))
          ) ?? []
        );
        setVersionSnapshots([]);
      }
    } catch (error) {
      setWorkflow(null);
      messageApi.error(error instanceof Error ? error.message : '加载解析详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    setPageLoading(true);
    Promise.all([fetchFileParseTargetPlans(), fetchFileParseTasks({ page: 1, pageSize: 50 })])
      .then(([plansPayload, tasksPayload]) => {
        if (!active) {
          return;
        }
        const nextPlans = plansPayload.map(mapTargetPlan);
        const nextTasks = tasksPayload.items.map(mapTaskFromList);
        setTargetPlans(nextPlans);
        setTasks(nextTasks);
        setCreateTargetPlanId(nextPlans.find((plan) => plan.availableActions?.canCreateTask)?.id ?? nextPlans[0]?.id ?? '');
        setSelectedTaskId(nextTasks[0]?.id ?? '');
      })
      .catch((error) => {
        if (active) {
          messageApi.error(error instanceof Error ? error.message : '加载文件管理解析数据失败');
        }
      })
      .finally(() => {
        if (active) {
          setPageLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [messageApi]);

  useEffect(() => {
    if (viewMode !== 'detail' || !selectedTaskId || !targetPlans.length) {
      return;
    }
    void loadDetailData(selectedTaskId);
  }, [selectedTaskId, targetPlans.length, viewMode]);

  useEffect(() => {
    if (!createOpen || !createTargetPlan) {
      return;
    }
    createForm.setFieldsValue({
      targetPlanId: createTargetPlan.id
    });
  }, [createForm, createOpen, createTargetPlan]);

  useEffect(() => {
    if (!editingItem) {
      return;
    }
    editForm.setFieldsValue({ fields: { ...editingItem.fields } });
  }, [editForm, editingItem]);

  useEffect(() => {
    if (!sortedSelectedVersions.length) {
      setCompareBaseVersionId('');
      setCompareTargetVersionId('');
      return;
    }
    const defaultTargetId = sortedSelectedVersions[0].id;
    const defaultBaseId = sortedSelectedVersions[1]?.id ?? sortedSelectedVersions[0].id;
    setCompareBaseVersionId((current) =>
      sortedSelectedVersions.some((version) => version.id === current) ? current : defaultBaseId
    );
    setCompareTargetVersionId((current) =>
      sortedSelectedVersions.some((version) => version.id === current) ? current : defaultTargetId
    );
  }, [selectedVersionIds, sortedSelectedVersions]);

  useEffect(() => {
    if (!isLogisticsPlan || !sortedSelectedVersions.length) {
      setLogisticsVersionId('');
      setLogisticsActivation(null);
      setSelectedLogisticsChannelKeys([]);
      return;
    }
    const defaultVersionId = sortedSelectedVersions.find((version) => version.status === 'active')?.id ?? sortedSelectedVersions[0].id;
    setLogisticsVersionId((current) =>
      sortedSelectedVersions.some((version) => version.id === current) ? current : defaultVersionId
    );
  }, [isLogisticsPlan, selectedVersionIds, sortedSelectedVersions]);

  useEffect(() => {
    if (detailTab !== 'versions' || !isLogisticsPlan || !selectedTargetPlan || !logisticsVersionId) {
      return;
    }
    let active = true;
    setLogisticsLoading(true);
    fetchFileParseLogisticsActivations(selectedTargetPlan.id, logisticsVersionId)
      .then((payload) => {
        if (!active) {
          return;
        }
        setLogisticsActivation(payload);
        setSelectedLogisticsChannelKeys(
          payload.selectedChannelKeys.length
            ? payload.selectedChannelKeys
            : payload.channels.filter((channel) => channel.selected).map((channel) => channel.channelKey)
        );
      })
      .catch((error) => {
        if (active) {
          messageApi.error(error instanceof Error ? error.message : '加载物流服务线生效配置失败');
          setLogisticsActivation(null);
          setSelectedLogisticsChannelKeys([]);
        }
      })
      .finally(() => {
        if (active) {
          setLogisticsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [detailTab, isLogisticsPlan, logisticsVersionId, messageApi, selectedTargetPlan]);

  useEffect(() => {
    if (detailTab === 'result') {
      setDetailTab('processing');
    }
  }, [detailTab]);

  const openCreateDrawer = () => {
    if (!targetPlans.length) {
      messageApi.warning('暂无可用目标输出方案');
      return;
    }
    setCreateParentTask(null);
    createForm.resetFields();
    setUploadFiles([]);
    setCreateOpen(true);
  };

  const openUpdateSourceDrawer = (task: AiParseTask) => {
    const targetPlan = targetPlans.find((item) => item.id === task.targetPlanId);
    if (!targetPlan?.availableActions?.canCreateTask) {
      messageApi.warning('当前账号没有发起解析权限');
      return;
    }
    setCreateParentTask(task);
    setCreateTargetPlanId(task.targetPlanId);
    createForm.resetFields();
    createForm.setFieldsValue({
      documentTitle: task.documentTitle,
      targetPlanId: task.targetPlanId,
      remark: `基于第 ${task.iterationNo ?? 1} 次解析更新源文件`
    });
    setUploadFiles([]);
    setCreateOpen(true);
  };

  const handleSubmitCreate = async () => {
    if (actionLoading || createSubmittingRef.current) {
      return;
    }
    createSubmittingRef.current = true;
    setActionLoading(true);
    try {
      const values = await createForm.validateFields();
      if (!uploadFiles.length && !values.ocrText?.trim() && !values.manualText?.trim()) {
        messageApi.warning('请至少上传一个文件，或填写 OCR 文本/人工补充文案');
        return;
      }
      const targetPlan = targetPlans.find((item) => item.id === values.targetPlanId) ?? createTargetPlan;
      if (!targetPlan) {
        messageApi.warning('请选择目标输出方案');
        return;
      }
      if (!targetPlan.availableActions?.canCreateTask) {
        messageApi.warning('当前账号没有发起解析权限');
        return;
      }

      const fileInputs = await Promise.all(
        uploadFiles.map(async (file, index) => {
          const rawFile = file.originFileObj as File | undefined;
          if (!rawFile) {
            throw new Error(`文件 ${file.name} 缺少原始内容，请重新选择`);
          }
          const upload = await uploadFileParseInput(targetPlan.id, rawFile);
          return {
            inputType: 'file',
            inputRole: 'primary_source',
            fileAssetId: upload.fileId,
            displayName: upload.originalFileName,
            sortNo: index + 1
          };
        })
      );
      const textInputs = [
        values.ocrText?.trim()
          ? {
              inputType: 'ocr_text',
              inputRole: 'supplement',
              textContent: values.ocrText.trim(),
              displayName: 'OCR 文本',
              sortNo: fileInputs.length + 1
            }
          : null,
        values.manualText?.trim()
          ? {
              inputType: 'manual_text',
              inputRole: 'supplement',
              textContent: values.manualText.trim(),
              displayName: '人工补充文案',
              sortNo: fileInputs.length + 2
            }
          : null
      ].filter(Boolean) as Array<{
        inputType: string;
        inputRole: string;
        textContent: string;
        displayName: string;
        sortNo: number;
      }>;
      const created = await createFileParseTask(
        {
          documentTitle: values.documentTitle,
          targetPlanId: Number(targetPlan.id),
          parentTaskId: createParentTask ? Number(createParentTask.id) : undefined,
          inputItems: [...fileInputs, ...textInputs],
          remark: values.remark?.trim() || undefined
        },
        createFileParseIdempotencyKey('create-file-parse')
      );
      setCreateOpen(false);
      setCreateParentTask(null);
      createForm.resetFields();
      setUploadFiles([]);
      await loadTasks(String(created.id));
      setSelectedTaskId(String(created.id));
      setViewMode('detail');
      setDetailTab('processing');
      messageApi.open({
        key: 'file-parse-create-run',
        type: 'loading',
        content: '已创建解析文档，正在解析...',
        duration: 0
      });
      const runResult = await runFileParseTask(created.id);
      await loadTasks(String(created.id));
      await loadDetailData(String(created.id));
      if (runResult.status === 'failed') {
        messageApi.open({
          key: 'file-parse-create-run',
          type: 'error',
          content: runResult.message || '解析失败，请稍后重试',
          duration: 5
        });
        return;
      }
      if (runResult.status === 'parsing') {
        messageApi.open({
          key: 'file-parse-create-run',
          type: 'info',
          content: runResult.message || '文档正在解析中',
          duration: 4
        });
        return;
      }
      messageApi.open({
        key: 'file-parse-create-run',
        type: 'success',
        content: '解析完成，请处理结果',
        duration: 3
      });
    } catch (error) {
      messageApi.destroy('file-parse-create-run');
      if (Array.isArray((error as { errorFields?: unknown[] }).errorFields)) {
        return;
      }
      messageApi.error(error instanceof Error ? error.message : '创建解析文档失败');
    } finally {
      createSubmittingRef.current = false;
      setActionLoading(false);
    }
  };

  const openDetail = (task: AiParseTask, tab = 'processing') => {
    setSelectedTaskId(task.id);
    setDetailTab(tab);
    setViewMode('detail');
  };

  const openEditDrawer = (item: AiParseResultItem) => {
    setEditingItem(item);
  };

  const reloadTasksWithFilters = async (nextFilters: AiParseTaskFilters) => {
    setTaskFilters(nextFilters);
    setPageLoading(true);
    try {
      await loadTasks(undefined, nextFilters);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '加载解析文档列表失败');
    } finally {
      setPageLoading(false);
    }
  };

  const handleTaskFiltersChange = (nextFilters: AiParseTaskFilters) => {
    void reloadTasksWithFilters(nextFilters);
  };

  const handleTaskFiltersReset = () => {
    void reloadTasksWithFilters({ ...EMPTY_TASK_FILTERS });
  };

  const handleDeleteTask = (task: AiParseTask) => {
    modal.confirm({
      title: '删除解析文档',
      content: '会删除该文档及其解析记录、已发布版本和当前生效业务结果，删除后不会自动恢复上一版。',
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        setActionLoading(true);
        try {
          await deleteFileParseTask(task.id);
          if (selectedTaskId === task.id) {
            setViewMode('list');
          }
          await loadTasks();
          messageApi.success('已删除解析文档');
        } catch (error) {
          messageApi.error(error instanceof Error ? error.message : '删除解析文档失败');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleReviewItem = async (
    item: AiParseResultItem,
    action: 'accept' | 'reject' | 'keep-old',
    successMessage: string
  ) => {
    if (!selectedTask?.resultId) {
      messageApi.warning('当前解析结果不可处理');
      return;
    }
    if (!permission.canDraftEdit) {
      messageApi.warning('当前角色只能查看解析结果');
      return;
    }
    setActionLoading(true);
    try {
      await reviewFileParseItem(
        selectedTask.id,
        item.id,
        action,
        { expectedResultId: Number(selectedTask.resultId) },
        createFileParseIdempotencyKey(`review-${action}`)
      );
      await loadTasks(selectedTask.id);
      await loadDetailData(selectedTask.id);
      messageApi.success(successMessage);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '处理解析结果失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmItem = (item: AiParseResultItem) => {
    if (item.validationStatus === 'hard_error') {
      messageApi.warning('硬错误必须先编辑修正');
      return;
    }
    void handleReviewItem(item, 'accept', '已确认');
  };

  const handleBatchConfirmItems = () => {
    if (!selectedTask?.resultId) {
      messageApi.warning('当前解析结果不可处理');
      return;
    }
    if (!permission.canDraftEdit) {
      messageApi.warning('当前角色只能查看解析结果');
      return;
    }
    const selectedIdSet = new Set(selectedProcessingItemIds);
    const confirmableItems = filteredItems.filter(
      (item) =>
        selectedIdSet.has(item.id)
        && item.validationStatus !== 'hard_error'
        && item.reviewStatus !== 'confirmed'
        && item.reviewStatus !== 'keep_old'
        && item.reviewStatus !== 'rejected'
    );
    if (!confirmableItems.length) {
      messageApi.warning('请先选择可确认的解析结果');
      return;
    }
    modal.confirm({
      title: '批量确认解析结果',
      content: `确认选中的 ${confirmableItems.length} 条解析结果？确认后会计入待发布版本。`,
      okText: '批量确认',
      cancelText: '取消',
      onOk: async () => {
        setActionLoading(true);
        try {
          const result = await batchAcceptFileParseItems(
            selectedTask.id,
            {
              expectedResultId: Number(selectedTask.resultId),
              itemIds: confirmableItems.map((item) => Number(item.id)),
              remark: '批量确认'
            },
            createFileParseIdempotencyKey('batch-review-accept')
          );
          setSelectedProcessingItemIds([]);
          await loadTasks(selectedTask.id);
          await loadDetailData(selectedTask.id);
          messageApi.success(`已确认 ${result.successCount} 条解析结果`);
        } catch (error) {
          messageApi.error(error instanceof Error ? error.message : '批量确认失败');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleRejectItem = (item: AiParseResultItem) => {
    void handleReviewItem(item, 'reject', '已驳回');
  };

  const handleKeepOld = (item: AiParseResultItem) => {
    void handleReviewItem(item, 'keep-old', '已保留旧值');
  };

  const handleRunSelectedTask = async () => {
    if (!selectedTask) {
      return;
    }
    if (!permission.canDraftEdit) {
      messageApi.warning('当前角色没有解析处理权限');
      return;
    }
    if (selectedTask.status !== 'failed' && selectedTask.status !== 'reading') {
      messageApi.warning('当前文档状态不能重新解析');
      return;
    }
    setActionLoading(true);
    messageApi.open({
      key: 'file-parse-rerun',
      type: 'loading',
      content: '正在解析...',
      duration: 0
    });
    try {
      const runResult = await runFileParseTask(selectedTask.id);
      await loadTasks(selectedTask.id);
      await loadDetailData(selectedTask.id);
      if (runResult.status === 'failed') {
        messageApi.open({
          key: 'file-parse-rerun',
          type: 'error',
          content: runResult.message || '解析失败，请稍后重试',
          duration: 5
        });
        return;
      }
      if (runResult.status === 'parsing') {
        messageApi.open({
          key: 'file-parse-rerun',
          type: 'info',
          content: runResult.message || '文档正在解析中',
          duration: 4
        });
        return;
      }
      messageApi.open({
        key: 'file-parse-rerun',
        type: 'success',
        content: '解析完成，请处理结果',
        duration: 3
      });
    } catch (error) {
      messageApi.open({
        key: 'file-parse-rerun',
        type: 'error',
        content: error instanceof Error ? error.message : '解析失败，请稍后重试',
        duration: 5
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !selectedStandard || !selectedTask?.resultId) {
      return;
    }
    const values = await editForm.validateFields();
    const requiredFields = selectedStandard.resultFields.filter((field) => field.required);
    const missingFields = requiredFields.filter((field) => {
      const value = values.fields[field.key];
      return value === undefined || value === null || value === '';
    });
    if (missingFields.length) {
      messageApi.warning(`必填字段缺失：${missingFields.map((field) => field.label).join('、')}`);
      return;
    }
    setActionLoading(true);
    try {
      await reviewFileParseItem(
        selectedTask.id,
        editingItem.id,
        'edit',
        {
          expectedResultId: Number(selectedTask.resultId),
          fields: values.fields
        },
        createFileParseIdempotencyKey('edit-file-parse-item')
      );
      setEditingItem(null);
      editForm.resetFields();
      await loadTasks(selectedTask.id);
      await loadDetailData(selectedTask.id);
      messageApi.success('已保存，待确认后才能发布');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '保存解析结果失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = () => {
    if (!selectedTask) {
      return;
    }
    if (!selectedTask.resultId) {
      messageApi.warning('当前文档还没有可发布的解析结果');
      return;
    }
    if (!permission.canPublish) {
      messageApi.warning('当前角色没有发布权限');
      return;
    }
    if (selectedTask.status !== 'ready_to_publish') {
      messageApi.warning('当前文档还不能发布');
      return;
    }
    if (blockingItems.length) {
      messageApi.warning('仍有待处理项，不能发布');
      return;
    }
    modal.confirm({
      title: '发布为新版本',
      content: `确认发布 ${selectedTask.documentTitle} 的 ${selectedItems.length} 条结果？发布后会成为当前生效版本。`,
      okText: '确认发布',
      cancelText: '取消',
      onOk: async () => {
        setActionLoading(true);
        try {
          await publishFileParseTask(
            selectedTask.id,
            {
              expectedResultId: Number(selectedTask.resultId),
              confirmMessage: '确认发布解析结果',
              remark: selectedTask.remark
            },
            createFileParseIdempotencyKey('publish-file-parse')
          );
          await loadTasks(selectedTask.id);
          await loadDetailData(selectedTask.id);
          messageApi.success('已发布为新版本');
        } catch (error) {
          messageApi.error(error instanceof Error ? error.message : '发布失败');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleToggleLogisticsChannel = (channelKey: string, checked: boolean) => {
    setSelectedLogisticsChannelKeys((current) => {
      if (checked) {
        return current.includes(channelKey) ? current : [...current, channelKey];
      }
      return current.filter((key) => key !== channelKey);
    });
  };

  const handleSaveLogisticsActivation = async () => {
    if (!selectedTargetPlan || !logisticsVersionId) {
      messageApi.warning('请选择要生效的物流版本');
      return;
    }
    if (!permission.canActivateLogisticsChannels) {
      messageApi.warning('当前角色没有物流服务线生效权限');
      return;
    }
    setActionLoading(true);
    try {
      const payload = await saveFileParseLogisticsActivations({
        targetPlanId: Number(selectedTargetPlan.id),
        versionId: Number(logisticsVersionId),
        selectedChannelKeys: selectedLogisticsChannelKeys
      });
      setLogisticsActivation(payload);
      setSelectedLogisticsChannelKeys(
        payload.selectedChannelKeys.length
          ? payload.selectedChannelKeys
          : payload.channels.filter((channel) => channel.selected).map((channel) => channel.channelKey)
      );
      messageApi.success('已保存物流服务线生效选择');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '保存物流服务线生效选择失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportOverview = () => {
    if (!selectedTask) {
      return;
    }
    void downloadFileParseOverview(selectedTask.id)
      .then(({ blob, fileName }) => {
        const href = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = href;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(href);
      })
      .catch((error) => {
        messageApi.error(error instanceof Error ? error.message : '导出解析总览失败');
      });
  };

  const closeCreateDrawer = () => {
    setCreateOpen(false);
    setCreateParentTask(null);
    createForm.resetFields();
    setUploadFiles([]);
  };

  const closeEditDrawer = () => {
    setEditingItem(null);
    editForm.resetFields();
  };

  return (
    <AiFileParseBoardView
      actionLoading={actionLoading}
      allResultFields={allResultFields}
      blockingItems={blockingItems}
      comparingItem={comparingItem}
      createForm={createForm}
      createOpen={createOpen}
      createParentTask={createParentTask}
      createTargetPlan={createTargetPlan}
      detailLoading={detailLoading}
      detailTab={detailTab}
      editForm={editForm}
      editingItem={editingItem}
      filteredItems={filteredItems}
      isLogisticsPlan={isLogisticsPlan}
      logisticsActivation={logisticsActivation}
      logisticsLoading={logisticsLoading}
      logisticsVersionId={logisticsVersionId}
      onBackToList={() => setViewMode('list')}
      onCompareBaseVersionChange={setCompareBaseVersionId}
      onCompareClose={() => setComparingItem(null)}
      onCompareItem={setComparingItem}
      onCompareTargetVersionChange={setCompareTargetVersionId}
      onBatchConfirmItems={handleBatchConfirmItems}
      onConfirmItem={handleConfirmItem}
      onCreateClose={closeCreateDrawer}
      onCreateSubmit={() => void handleSubmitCreate()}
      onCreateTargetPlanChange={setCreateTargetPlanId}
      onDeleteTask={handleDeleteTask}
      onDetailTabChange={setDetailTab}
      onEditClose={closeEditDrawer}
      onEditSave={() => void handleSaveEdit()}
      onExportOverview={handleExportOverview}
      onKeepOld={handleKeepOld}
      onLogisticsVersionChange={setLogisticsVersionId}
      onOpenCreate={openCreateDrawer}
      onOpenUpdateSource={openUpdateSourceDrawer}
      onOpenDetail={openDetail}
      onOpenEdit={openEditDrawer}
      onPublish={handlePublish}
      onRejectItem={handleRejectItem}
      onReviewFilterChange={setReviewFilter}
      onRunSelectedTask={() => void handleRunSelectedTask()}
      onSaveLogisticsActivation={() => void handleSaveLogisticsActivation()}
      onTaskFiltersChange={handleTaskFiltersChange}
      onTaskFiltersReset={handleTaskFiltersReset}
      onToggleLogisticsChannel={handleToggleLogisticsChannel}
      onProcessingSelectionChange={setSelectedProcessingItemIds}
      onUploadFilesChange={setUploadFiles}
      overviewItems={overviewItems}
      pageLoading={pageLoading}
      permission={permission}
      reviewFilter={reviewFilter}
      selectedBaseVersion={selectedBaseVersion}
      selectedProcessingItemIds={selectedProcessingItemIds}
      selectedLogisticsChannelKeys={selectedLogisticsChannelKeys}
      selectedStandard={selectedStandard}
      selectedTargetVersion={selectedTargetVersion}
      selectedTask={selectedTask}
      sortedSelectedVersions={sortedSelectedVersions}
      taskFilters={taskFilters}
      targetPlans={targetPlans}
      tasks={tasks}
      uploadFiles={uploadFiles}
      versionCompareRows={versionCompareRows}
      viewMode={viewMode}
      visibleFields={visibleFields}
      workflow={workflow}
    />
  );
}
