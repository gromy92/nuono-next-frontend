import { Alert, App as AntdApp, Button, Form, Input, Modal, Select, Space, Spin, Table, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { firstFormValidationMessage, normalizeError } from '../../shared/api';
import {
  bindStoreSyncStore,
  createStoreSyncStore,
  testStoreSyncConnection
} from '../store-sync/api';
import type { StoreBindingProjectOption, StoreSyncOverviewState, StoreSyncStore } from '../store-sync/types';
import type { LoadStoreSyncOptions } from '../store-sync/useStoreSyncOverviewController';
import { StoreManagementView } from './StoreManagementView';
import { useStoreManagementColumns } from './useStoreManagementColumns';

const { Text } = Typography;

type StoreConnectionTestFeedback = {
  storeCode: string;
  projectName?: string;
  status: 'loading' | 'success' | 'warning' | 'error';
  message: string;
};

type StoreCreateFormValues = {
  projectName?: string;
  projectCode?: string;
  storeCode?: string;
  site?: string;
};

type StoreBindFormValues = Record<string, never>;

type Props = {
  state: StoreSyncOverviewState;
  ownerId?: number;
  selectedOwnerId?: number;
  canSelectOwner: boolean;
  canManageBinding: boolean;
  onOwnerChange: (ownerId: number) => void;
  onRefresh: (ownerId?: number, options?: LoadStoreSyncOptions) => Promise<void> | void;
  onDataChanged?: () => void;
};


export function StoreManagementBoard({
  state,
  ownerId,
  selectedOwnerId,
  canSelectOwner,
  canManageBinding,
  onOwnerChange,
  onRefresh,
  onDataChanged
}: Props) {
  const { message: messageApi } = AntdApp.useApp();
  const [storeConnectionTestFeedback, setStoreConnectionTestFeedback] = useState<StoreConnectionTestFeedback>();
  const [bindingModalOpen, setBindingModalOpen] = useState(false);
  const [bindingSubmitting, setBindingSubmitting] = useState(false);
  const [bindingMode, setBindingMode] = useState<'bind' | 'rebind'>('bind');
  const [bindingStore, setBindingStore] = useState<StoreSyncStore | null>(null);
  const [bindingForm] = Form.useForm<StoreBindFormValues>();
  const [createStoreModalOpen, setCreateStoreModalOpen] = useState(false);
  const [createStoreSubmitting, setCreateStoreSubmitting] = useState(false);
  const [pendingCreateStoreProjects, setPendingCreateStoreProjects] = useState<StoreBindingProjectOption[]>([]);
  const [createStoreForm] = Form.useForm<StoreCreateFormValues>();

  const refresh = async (nextOwnerId?: number, options?: LoadStoreSyncOptions) => {
    if (!options?.preserveConnectionFeedback) {
      setStoreConnectionTestFeedback(undefined);
    }
    await onRefresh(nextOwnerId, { ...options, force: true });
  };

  const storeManagementStats = useMemo(() => {
    if (state.status !== 'success') {
      return [];
    }
    const total = state.data.stores.length;
    const normal = state.data.stores.filter((store) => store.connectionStatus === '正常').length;
    return [
      { label: '共店铺', value: total },
      { label: '正常', value: normal },
      { label: '不正常', value: total - normal }
    ];
  }, [state]);

  const submitBinding = async () => {
    if (!bindingStore || !ownerId) {
      messageApi.error('缺少店铺上下文，无法继续。');
      return;
    }

    try {
      await bindingForm.validateFields();
      setBindingSubmitting(true);

      const payload = await bindStoreSyncStore({
        ownerUserId: ownerId,
        storeCode: bindingStore.storeCode
      });

      messageApi.success(payload.message ?? (bindingMode === 'bind' ? '绑定成功' : '账号已更新'));
      setBindingModalOpen(false);
      setBindingStore(null);
      bindingForm.resetFields();
      await refresh(ownerId);
      onDataChanged?.();
    } catch (error) {
      const validationMessage = firstFormValidationMessage(error);
      if (validationMessage) {
        messageApi.warning(validationMessage);
        return;
      }
      messageApi.error(normalizeError(error, '保存店铺绑定失败'));
    } finally {
      setBindingSubmitting(false);
    }
  };

  const submitCreateStore = async (submittedValues?: StoreCreateFormValues) => {
    if (!ownerId) {
      messageApi.error('缺少老板上下文，无法新增店铺。');
      return;
    }

    try {
      const values = submittedValues ?? await createStoreForm.validateFields();
      setCreateStoreSubmitting(true);
      const selectedProject = pendingCreateStoreProjects.find(
        (project) => project.projectCode === values.projectCode
      );

      const payload = await createStoreSyncStore({
        ownerUserId: ownerId,
        projectName: values.projectName,
        projectCode: selectedProject?.projectCode ?? values.projectCode,
        storeCode: values.storeCode,
        site: values.site,
        orgCode: selectedProject?.orgCode,
        orgName: selectedProject?.orgName
      });

      if (payload.projectList?.length) {
        setPendingCreateStoreProjects(payload.projectList);
        messageApi.info(payload.message ?? '请选择要绑定的 Noon Project');
        return;
      }

      messageApi.success(payload.message ?? '店铺已绑定到当前账号视图');
      setCreateStoreModalOpen(false);
      setPendingCreateStoreProjects([]);
      createStoreForm.resetFields();
      await refresh(ownerId);
      onDataChanged?.();
    } catch (error) {
      const validationMessage = firstFormValidationMessage(error);
      if (validationMessage) {
        messageApi.warning(validationMessage);
        return;
      }
      messageApi.error(normalizeError(error, '新增店铺失败'));
    } finally {
      setCreateStoreSubmitting(false);
    }
  };

  const columns = useStoreManagementColumns({
    bindingForm, canManageBinding, ownerId, refresh,
    setBindingModalOpen, setBindingMode, setBindingStore,
    setStoreConnectionTestFeedback, storeConnectionTestFeedback
  });

  return <StoreManagementView model={{
    state, ownerId, selectedOwnerId, canSelectOwner, canManageBinding, onOwnerChange,
    refresh, storeManagementStats, storeConnectionTestFeedback, columns,
    bindingMode, bindingModalOpen, bindingSubmitting, bindingStore, bindingForm,
    setBindingModalOpen, setBindingStore, submitBinding,
    createStoreModalOpen, createStoreSubmitting, createStoreForm,
    setCreateStoreModalOpen, pendingCreateStoreProjects, setPendingCreateStoreProjects,
    submitCreateStore, messageApi
  }} />;
}
