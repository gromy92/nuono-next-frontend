import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { App as AntdApp, Form } from 'antd';
import type { UploadFile } from 'antd';
import {
  createFileParseIdempotencyKey,
  createFileParseTask,
  runFileParseTask,
  uploadFileParseInput
} from './api';
import type { CreateBatchFormValues } from './AiFileParseOverlays';
import type { AiParseTargetOutputPlan, AiParseTask } from './types';

type AppContext = ReturnType<typeof AntdApp.useApp>;

type SourceWorkflowInput = {
  messageApi: AppContext['message'];
  targetPlans: AiParseTargetOutputPlan[];
  selectedTask: AiParseTask | undefined;
  canProcess: boolean;
  setSelectedTaskId: Dispatch<SetStateAction<string>>;
  setViewMode: Dispatch<SetStateAction<'list' | 'detail'>>;
  setDetailTab: Dispatch<SetStateAction<string>>;
  setActionLoading: Dispatch<SetStateAction<boolean>>;
  loadTasks: (selectedTaskId?: string) => Promise<AiParseTask[]>;
  loadDetailData: (taskId: string) => Promise<void>;
};

export function useFileParseSourceWorkflow(input: SourceWorkflowInput) {
  const {
    loadDetailData,
    loadTasks,
    messageApi,
    canProcess,
    selectedTask,
    setActionLoading,
    setDetailTab,
    setSelectedTaskId,
    setViewMode,
    targetPlans
  } = input;
  const [form] = Form.useForm<CreateBatchFormValues>();
  const [open, setOpen] = useState(false);
  const [parentTask, setParentTask] = useState<AiParseTask | null>(null);
  const [targetPlanId, setTargetPlanId] = useState('');
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const targetPlan = useMemo(
    () => targetPlans.find((plan) => plan.id === targetPlanId) ?? targetPlans[0],
    [targetPlanId, targetPlans]
  );

  useEffect(() => {
    const defaultId = targetPlans.find((plan) => plan.availableActions?.canCreateTask)?.id ?? targetPlans[0]?.id ?? '';
    setTargetPlanId((current) => targetPlans.some((plan) => plan.id === current) ? current : defaultId);
  }, [targetPlans]);

  useEffect(() => {
    if (open && targetPlan) form.setFieldsValue({ targetPlanId: targetPlan.id });
  }, [form, open, targetPlan]);

  const reset = () => {
    setOpen(false);
    setParentTask(null);
    form.resetFields();
    setUploadFiles([]);
  };

  const openCreate = () => {
    if (!targetPlans.length) {
      messageApi.warning('暂无可用目标输出方案');
      return;
    }
    setParentTask(null);
    form.resetFields();
    setUploadFiles([]);
    setOpen(true);
  };

  const openUpdate = (task: AiParseTask) => {
    const plan = targetPlans.find((item) => item.id === task.targetPlanId);
    if (!plan?.availableActions?.canCreateTask) {
      messageApi.warning('当前账号没有发起解析权限');
      return;
    }
    setParentTask(task);
    setTargetPlanId(task.targetPlanId);
    form.resetFields();
    form.setFieldsValue({
      documentTitle: task.documentTitle,
      targetPlanId: task.targetPlanId,
      remark: `基于第 ${task.iterationNo ?? 1} 次解析更新源文件`
    });
    setUploadFiles([]);
    setOpen(true);
  };

  const showRunResult = async (taskId: string, messageKey: string, replaceError = false) => {
    try {
      const result = await runFileParseTask(taskId);
      await loadTasks(taskId);
      await loadDetailData(taskId);
      if (result.status === 'failed') {
        messageApi.open({ key: messageKey, type: 'error', content: result.message || '解析失败，请稍后重试', duration: 5 });
      } else if (result.status === 'parsing' || result.status === 'retry_waiting') {
        messageApi.open({ key: messageKey, type: 'info', content: result.message || '文档正在解析中', duration: 4 });
      } else {
        messageApi.open({ key: messageKey, type: 'success', content: '解析完成，请处理结果', duration: 3 });
      }
    } catch (error) {
      const content = error instanceof Error ? error.message : '解析失败，请稍后重试';
      if (replaceError) {
        messageApi.open({ key: messageKey, type: 'error', content, duration: 5 });
      } else {
        messageApi.destroy(messageKey);
        messageApi.error(content);
      }
    }
  };

  const submit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      if (!uploadFiles.length && !values.ocrText?.trim() && !values.manualText?.trim()) {
        messageApi.warning('请至少上传一个文件，或填写 OCR 文本/人工补充文案');
        return;
      }
      const plan = targetPlans.find((item) => item.id === values.targetPlanId) ?? targetPlan;
      if (!plan) {
        messageApi.warning('请选择目标输出方案');
        return;
      }
      if (!plan.availableActions?.canCreateTask) {
        messageApi.warning('当前账号没有发起解析权限');
        return;
      }
      const fileInputs = await Promise.all(uploadFiles.map(async (file, index) => {
        const rawFile = file.originFileObj as File | undefined;
        if (!rawFile) throw new Error(`文件 ${file.name} 缺少原始内容，请重新选择`);
        const upload = await uploadFileParseInput(plan.id, rawFile);
        return {
          inputType: 'file',
          inputRole: 'primary_source',
          fileAssetId: upload.fileId,
          displayName: upload.originalFileName,
          sortNo: index + 1
        };
      }));
      const textInputs = [
        values.ocrText?.trim() ? {
          inputType: 'ocr_text', inputRole: 'supplement', textContent: values.ocrText.trim(),
          displayName: 'OCR 文本', sortNo: fileInputs.length + 1
        } : null,
        values.manualText?.trim() ? {
          inputType: 'manual_text', inputRole: 'supplement', textContent: values.manualText.trim(),
          displayName: '人工补充文案', sortNo: fileInputs.length + 2
        } : null
      ].filter(Boolean) as Array<{
        inputType: string; inputRole: string; textContent: string; displayName: string; sortNo: number;
      }>;
      const created = await createFileParseTask({
        documentTitle: values.documentTitle,
        targetPlanId: Number(plan.id),
        parentTaskId: parentTask ? Number(parentTask.id) : undefined,
        inputItems: [...fileInputs, ...textInputs],
        remark: values.remark?.trim() || undefined
      }, createFileParseIdempotencyKey('create-file-parse'));
      reset();
      await loadTasks(String(created.id));
      setSelectedTaskId(String(created.id));
      setViewMode('detail');
      setDetailTab('processing');
      messageApi.open({
        key: 'file-parse-create-run', type: 'loading', content: '已创建解析文档，正在解析...', duration: 0
      });
      void showRunResult(String(created.id), 'file-parse-create-run');
    } catch (error) {
      messageApi.destroy('file-parse-create-run');
      if (!Array.isArray((error as { errorFields?: unknown[] }).errorFields)) {
        messageApi.error(error instanceof Error ? error.message : '创建解析文档失败');
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const runSelected = async () => {
    if (!selectedTask) return;
    if (!canProcess) {
      messageApi.warning('当前角色没有结果处理权限');
      return;
    }
    if (selectedTask.status !== 'failed' && selectedTask.status !== 'reading') {
      messageApi.warning('当前文档状态不能重新解析');
      return;
    }
    setActionLoading(true);
    messageApi.open({ key: 'file-parse-rerun', type: 'loading', content: '正在解析...', duration: 0 });
    try {
      await showRunResult(selectedTask.id, 'file-parse-rerun', true);
    } finally {
      setActionLoading(false);
    }
  };

  return {
    form,
    open,
    parentTask,
    submitting,
    targetPlan,
    targetPlanId,
    setTargetPlanId,
    uploadFiles,
    setUploadFiles,
    openCreate,
    openUpdate,
    close: reset,
    submit: () => void submit(),
    runSelected: () => void runSelected()
  };
}
