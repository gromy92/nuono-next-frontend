import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { App as AntdApp, Form } from 'antd';
import {
  batchAcceptFileParseItems,
  createFileParseIdempotencyKey,
  publishFileParseTask,
  reviewFileParseItem
} from './api';
import type { EditResultFormValues } from './AiFileParseOverlays';
import type {
  AiParseDocumentStandard,
  AiParseResultItem,
  AiParseReviewStatus,
  AiParseRolePermission,
  AiParseTask
} from './types';

type AppContext = ReturnType<typeof AntdApp.useApp>;

type ReviewWorkflowInput = {
  messageApi: AppContext['message'];
  modal: AppContext['modal'];
  selectedTask: AiParseTask | undefined;
  selectedItems: AiParseResultItem[];
  blockingItems: AiParseResultItem[];
  selectedStandard: AiParseDocumentStandard | undefined;
  permission: AiParseRolePermission;
  setActionLoading: Dispatch<SetStateAction<boolean>>;
  loadTasks: (selectedTaskId?: string) => Promise<AiParseTask[]>;
  loadDetailData: (taskId: string) => Promise<void>;
};

export function useFileParseReviewWorkflow(input: ReviewWorkflowInput) {
  const {
    blockingItems,
    loadDetailData,
    loadTasks,
    messageApi,
    modal,
    permission,
    selectedItems,
    selectedStandard,
    selectedTask,
    setActionLoading
  } = input;
  const [editForm] = Form.useForm<EditResultFormValues>();
  const [editingItem, setEditingItem] = useState<AiParseResultItem | null>(null);
  const [comparingItem, setComparingItem] = useState<AiParseResultItem | null>(null);
  const [reviewFilter, setReviewFilter] = useState<AiParseReviewStatus | 'ALL'>('ALL');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const filteredItems = useMemo(
    () => selectedItems.filter((item) => reviewFilter === 'ALL' || item.reviewStatus === reviewFilter),
    [reviewFilter, selectedItems]
  );

  useEffect(() => {
    if (editingItem) editForm.setFieldsValue({ fields: { ...editingItem.fields } });
  }, [editForm, editingItem]);

  useEffect(() => {
    setSelectedItemIds([]);
  }, [selectedTask?.id]);

  const reload = async () => {
    if (!selectedTask) return;
    setSelectedItemIds([]);
    await loadTasks(selectedTask.id);
    await loadDetailData(selectedTask.id);
  };

  const review = async (
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
      await reload();
      messageApi.success(successMessage);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '处理解析结果失败');
    } finally {
      setActionLoading(false);
    }
  };

  const confirm = (item: AiParseResultItem) => {
    if (item.validationStatus === 'hard_error') {
      messageApi.warning('硬错误必须先编辑修正');
      return;
    }
    void review(item, 'accept', '已确认');
  };

  const batchConfirm = () => {
    if (!selectedTask?.resultId) {
      messageApi.warning('当前解析结果不可处理');
      return;
    }
    if (!permission.canDraftEdit) {
      messageApi.warning('当前角色只能查看解析结果');
      return;
    }
    const selectedIds = new Set(selectedItemIds);
    const confirmable = filteredItems.filter((item) =>
      selectedIds.has(item.id)
      && item.validationStatus !== 'hard_error'
      && item.reviewStatus !== 'confirmed'
      && item.reviewStatus !== 'keep_old'
      && item.reviewStatus !== 'rejected'
    );
    if (!confirmable.length) {
      messageApi.warning('请先选择可确认的解析结果');
      return;
    }
    modal.confirm({
      title: '批量确认解析结果',
      content: `确认选中的 ${confirmable.length} 条解析结果？确认后会计入待发布版本。`,
      okText: '批量确认',
      cancelText: '取消',
      onOk: async () => {
        setActionLoading(true);
        try {
          const result = await batchAcceptFileParseItems(
            selectedTask.id,
            {
              expectedResultId: Number(selectedTask.resultId),
              itemIds: confirmable.map((item) => Number(item.id)),
              remark: '批量确认'
            },
            createFileParseIdempotencyKey('batch-review-accept')
          );
          setSelectedItemIds([]);
          await reload();
          messageApi.success(`已确认 ${result.successCount} 条解析结果`);
        } catch (error) {
          messageApi.error(error instanceof Error ? error.message : '批量确认失败');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const saveEdit = async () => {
    if (!editingItem || !selectedStandard || !selectedTask?.resultId) return;
    const values = await editForm.validateFields();
    const missing = selectedStandard.resultFields.filter((field) => {
      const value = values.fields[field.key];
      return field.required && (value === undefined || value === null || value === '');
    });
    if (missing.length) {
      messageApi.warning(`必填字段缺失：${missing.map((field) => field.label).join('、')}`);
      return;
    }
    setActionLoading(true);
    try {
      await reviewFileParseItem(
        selectedTask.id,
        editingItem.id,
        'edit',
        { expectedResultId: Number(selectedTask.resultId), fields: values.fields },
        createFileParseIdempotencyKey('edit-file-parse-item')
      );
      setEditingItem(null);
      editForm.resetFields();
      await reload();
      messageApi.success('已保存，待确认后才能发布');
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '保存解析结果失败');
    } finally {
      setActionLoading(false);
    }
  };

  const publish = () => {
    if (!selectedTask) return;
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
          await reload();
          messageApi.success('已发布为新版本');
        } catch (error) {
          messageApi.error(error instanceof Error ? error.message : '发布失败');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const closeEdit = () => {
    setEditingItem(null);
    editForm.resetFields();
  };

  return {
    editForm,
    editingItem,
    setEditingItem,
    comparingItem,
    setComparingItem,
    reviewFilter,
    setReviewFilter,
    selectedItemIds,
    setSelectedItemIds,
    filteredItems,
    confirm,
    reject: (item: AiParseResultItem) => void review(item, 'reject', '已驳回'),
    keepOld: (item: AiParseResultItem) => void review(item, 'keep-old', '已保留旧值'),
    batchConfirm,
    saveEdit: () => void saveEdit(),
    closeEdit,
    publish
  };
}
