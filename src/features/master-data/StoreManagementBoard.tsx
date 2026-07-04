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
import type { LoadStoreSyncOptions } from '../app-shell/useStoreSyncController';

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

function storeConnectionStatusColor(connectionStatus?: string) {
  if (connectionStatus === '正常') {
    return 'success';
  }
  if (connectionStatus === '部分站点待补绑定') {
    return 'warning';
  }
  return 'default';
}

function renderCompactStoreText(value?: string, fallback = '-', strong = false) {
  const textValue = value || fallback;
  if (!value) {
    return <Text style={{ color: '#94a3b8' }}>{fallback}</Text>;
  }
  return (
    <span
      className={`nuono-store-compact-text${strong ? ' nuono-store-compact-text-strong' : ''}`}
      title={textValue}
    >
      {textValue}
    </span>
  );
}

function managerRoleMatches(manager: StoreSyncStore['managers'][number], roleKind: 'ops' | 'warehouse' | 'purchase') {
  const roleName = (manager.role || '').trim();
  if (roleKind === 'ops') {
    return roleName.includes('运营');
  }
  if (roleKind === 'warehouse') {
    return roleName.includes('仓管') || roleName.toUpperCase().includes('WAREHOUSE');
  }
  return roleName.includes('采购') || roleName.toUpperCase().includes('PURCHASE');
}

function renderStoreManagers(managers: StoreSyncStore['managers'], roleKind: 'ops' | 'warehouse' | 'purchase') {
  const scopedManagers = managers.filter((manager) => managerRoleMatches(manager, roleKind));
  if (!scopedManagers.length) {
    return <Text style={{ color: '#94a3b8' }}>-</Text>;
  }
  const title = scopedManagers
    .map((manager) => `${manager.name}${manager.role === '运营主管' ? '（主管）' : ''}`)
    .join('、');

  const color =
    roleKind === 'warehouse'
      ? 'cyan'
      : roleKind === 'purchase'
        ? 'green'
        : 'blue';

  return (
    <div className="nuono-store-manager-tags" title={title}>
      {scopedManagers.map((manager) => (
        <Tag
          key={`${manager.id}-${manager.role}`}
          color={manager.role === '运营主管' ? 'purple' : color}
          className="nuono-store-manager-tag"
        >
          {manager.name}
          {manager.role === '运营主管' ? '（主管）' : ''}
        </Tag>
      ))}
    </div>
  );
}

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

  const columns = useMemo<ColumnsType<StoreSyncStore>>(() => {
    const baseColumns: ColumnsType<StoreSyncStore> = [
      {
        title: '店铺名称',
        dataIndex: 'projectName',
        key: 'projectName',
        width: 250,
        render: (value: string | undefined, record) => (
          renderCompactStoreText(value || record.storeCode, '-', true)
        )
      },
      {
        title: '店铺Code',
        dataIndex: 'storeCode',
        key: 'storeCode',
        width: 116,
        render: (value: string | undefined) => renderCompactStoreText(value)
      },
      {
        title: '站点',
        dataIndex: 'siteStores',
        key: 'siteStores',
        width: 92,
        render: (siteStores: StoreSyncStore['siteStores']) => {
          if (!siteStores.length) {
            return <Text style={{ color: '#94a3b8' }}>-</Text>;
          }
          const siteLabels = Array.from(new Set(siteStores.map((siteStore) => siteStore.site || '未标注站点')));
          return renderCompactStoreText(siteLabels.join(' / '));
        }
      },
      {
        title: '运营负责人',
        dataIndex: 'managers',
        key: 'opsManagers',
        width: 150,
        render: (managers: StoreSyncStore['managers']) => renderStoreManagers(managers, 'ops')
      },
      {
        title: '仓管负责人',
        dataIndex: 'managers',
        key: 'warehouseManagers',
        width: 138,
        render: (managers: StoreSyncStore['managers']) => renderStoreManagers(managers, 'warehouse')
      },
      {
        title: '采购负责人',
        dataIndex: 'managers',
        key: 'purchaseManagers',
        width: 126,
        render: (managers: StoreSyncStore['managers']) => renderStoreManagers(managers, 'purchase')
      },
      {
        title: 'Noon后台邮箱',
        dataIndex: 'noonUser',
        key: 'noonUser',
        width: 300,
        render: (value: string | undefined) => renderCompactStoreText(value, '未绑定')
      },
      {
        title: '店铺ID',
        dataIndex: 'noonPartnerId',
        key: 'noonPartnerId',
        width: 96,
        render: (value: string | undefined) => renderCompactStoreText(value)
      },
      {
        title: '连通状态',
        dataIndex: 'connectionStatus',
        key: 'connectionStatus',
        width: 96,
        render: (value: string | undefined) => (
          <Tag
            color={storeConnectionStatusColor(value)}
            style={{ marginInlineEnd: 0, fontWeight: value === '正常' ? 600 : 400 }}
          >
            {value || '未绑定'}
          </Tag>
        )
      }
    ];

    if (!canManageBinding) {
      return baseColumns;
    }

    return [
      ...baseColumns,
      {
        title: '操作',
        key: 'actions',
        width: 178,
        fixed: 'right' as const,
        render: (_: unknown, record) => (
          <Space className="nuono-row-actions" wrap={false} size={10}>
            <Button
              data-testid="store-bind-button"
              type="link"
              size="small"
              style={{ paddingInline: 0 }}
              onClick={() => {
                bindingForm.resetFields();
                setBindingMode(record.isAuthorized ? 'rebind' : 'bind');
                setBindingStore(record);
                bindingForm.setFieldsValue({});
                setBindingModalOpen(true);
              }}
            >
              {record.isAuthorized ? '修改账号' : '绑定账号'}
            </Button>
            <Button
              data-testid="store-test-connection-button"
              data-store-code={record.storeCode}
              type="link"
              size="small"
              loading={storeConnectionTestFeedback?.storeCode === record.storeCode && storeConnectionTestFeedback.status === 'loading'}
              disabled={
                !record.isAuthorized ||
                (storeConnectionTestFeedback?.storeCode === record.storeCode && storeConnectionTestFeedback.status === 'loading')
              }
              style={{ paddingInline: 0, color: record.isAuthorized ? undefined : '#94a3b8' }}
              onClick={async () => {
                if (!record.isAuthorized || !ownerId) {
                  return;
                }

                setStoreConnectionTestFeedback({
                  storeCode: record.storeCode,
                  projectName: record.projectName || record.storeCode,
                  status: 'loading',
                  message: `正在测试 ${record.projectName || record.storeCode} 的 Noon 连通状态...`
                });
                try {
                  const payload = await testStoreSyncConnection(ownerId, record.storeCode);
                  if (payload.connected) {
                    setStoreConnectionTestFeedback({
                      storeCode: record.storeCode,
                      projectName: record.projectName || record.storeCode,
                      status: 'success',
                      message: `店铺“${record.projectName || record.storeCode}”${payload.message ?? '连接正常'}`
                    });
                  } else {
                    setStoreConnectionTestFeedback({
                      storeCode: record.storeCode,
                      projectName: record.projectName || record.storeCode,
                      status: 'warning',
                      message: payload.message ?? '连接失败，请重新绑定账号'
                    });
                  }
                  await refresh(ownerId, { preserveConnectionFeedback: true });
                } catch (error) {
                  const errorMessage =
                    error instanceof DOMException && error.name === 'TimeoutError'
                      ? '连接超时，请稍后重试或重新绑定账号'
                      : normalizeError(error, '测试连通失败');
                  setStoreConnectionTestFeedback({
                    storeCode: record.storeCode,
                    projectName: record.projectName || record.storeCode,
                    status: 'error',
                    message: errorMessage.includes('连接') ? errorMessage : `连接失败：${errorMessage}`
                  });
                }
              }}
            >
              {storeConnectionTestFeedback?.storeCode === record.storeCode && storeConnectionTestFeedback.status === 'loading'
                ? '测试中'
                : record.isAuthorized
                  ? '测试连通'
                  : '未绑定'}
            </Button>
          </Space>
        )
      }
    ];
  }, [bindingForm, canManageBinding, onRefresh, ownerId, storeConnectionTestFeedback]);

  return (
    <div data-testid="store-management-board" style={{ width: '100%' }}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {state.status === 'loading' ? (
          <Space size={12}>
            <Spin size="small" />
            <Text>正在读取店铺管理视图...</Text>
          </Space>
        ) : null}

        {state.status === 'error' ? (
          <Alert
            type="warning"
            showIcon
            message="店铺管理视图暂时不可用"
            description={state.message}
          />
        ) : null}

        {state.status === 'success' ? (
          <>
            <div className="nuono-store-management-toolbar">
              <Alert
                className="nuono-store-management-hint"
                type="info"
                showIcon
                message="绑定 Noon 后自动同步店铺信息"
              />

              <div className="nuono-masterdata-stat-strip nuono-store-management-stats" data-testid="store-management-stats">
                {storeManagementStats.map((item) => (
                  <div
                    key={item.label}
                    className={`nuono-masterdata-stat-item nuono-store-management-stat-item ${
                      item.label === '正常'
                        ? 'nuono-store-management-stat-normal'
                        : item.label === '不正常'
                          ? 'nuono-store-management-stat-abnormal'
                          : 'nuono-store-management-stat-total'
                    }`}
                  >
                    <span className="nuono-masterdata-stat-label">{item.label}</span>
                    <span className="nuono-masterdata-stat-value">{item.value}</span>
                  </div>
                ))}
              </div>

              <Space className="nuono-store-management-actions" wrap>
                <Button
                  data-testid="store-list-refresh-button"
                  icon={<ReloadOutlined />}
                  onClick={() => void refresh(ownerId, { preserveConnectionFeedback: true })}
                >
                  刷新
                </Button>
                {canManageBinding ? (
                  <Button
                    data-testid="store-create-button"
                    type="primary"
                    onClick={() => {
                      createStoreForm.resetFields();
                      setPendingCreateStoreProjects([]);
                      setCreateStoreModalOpen(true);
                    }}
                  >
                    + 创建店铺
                  </Button>
                ) : null}
                {canSelectOwner ? (
                  <Select
                    data-testid="store-owner-select"
                    style={{ minWidth: 260 }}
                    value={state.data.selectedOwnerId ?? selectedOwnerId}
                    options={state.data.ownerOptions.map((item) => ({
                      label: `${item.realName || item.accountNo} · ${item.accountNo}`,
                      value: item.id
                    }))}
                    placeholder="选择店铺负责人"
                    onChange={(value) => {
                      onOwnerChange(value);
                      void refresh(value);
                    }}
                  />
                ) : null}
              </Space>
            </div>

            {state.data.missingCoreTables.length ? (
              <Space wrap size={[8, 8]}>
                {state.data.missingCoreTables.map((table) => (
                  <Tag key={table} color="warning" style={{ marginInlineEnd: 0 }}>
                    {table}
                  </Tag>
                ))}
              </Space>
            ) : null}

            {storeConnectionTestFeedback ? (
              <Alert
                data-testid="store-test-connection-feedback"
                showIcon
                type={
                  storeConnectionTestFeedback.status === 'success'
                    ? 'success'
                    : storeConnectionTestFeedback.status === 'warning'
                      ? 'warning'
                      : storeConnectionTestFeedback.status === 'loading'
                        ? 'info'
                        : 'error'
                }
                message={storeConnectionTestFeedback.message}
              />
            ) : null}

            <Table
              data-testid="store-table"
              className="nuono-store-management-table"
              tableLayout="fixed"
              columns={columns}
              dataSource={state.data.stores}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: canManageBinding ? 1542 : 1364, y: 'calc(100vh - 308px)' }}
            />
          </>
        ) : null}
      </Space>

      <Modal
        title={bindingMode === 'bind' ? '绑定 Noon 商家后台' : '修改 Noon 商家后台登录'}
        open={bindingModalOpen}
        onCancel={() => {
          if (bindingSubmitting) {
            return;
          }
          setBindingModalOpen(false);
          setBindingStore(null);
          bindingForm.resetFields();
        }}
        onOk={() => void submitBinding()}
        confirmLoading={bindingSubmitting}
        okButtonProps={{ 'data-testid': 'store-bind-submit-button' }}
        cancelButtonProps={{ 'data-testid': 'store-bind-cancel-button' }}
        okText={bindingMode === 'bind' ? '确认绑定' : '保存修改'}
        cancelText="取消"
        destroyOnClose
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {bindingStore ? (
            <Alert
              type="info"
              showIcon
              message={bindingStore.projectName || bindingStore.storeCode}
              description="系统会使用统一配置的 Noon 商家后台邮箱连接该店铺，并按 Noon 返回的 Project 自动匹配店铺 ID、站点和 Partner ID。"
            />
          ) : null}

          <Form data-testid="store-bind-form" form={bindingForm} layout="vertical" preserve={false} />
        </Space>
      </Modal>

      <Modal
        title="创建店铺"
        open={createStoreModalOpen}
        zIndex={4200}
        onCancel={() => {
          if (createStoreSubmitting) {
            return;
          }
          setCreateStoreModalOpen(false);
          setPendingCreateStoreProjects([]);
          createStoreForm.resetFields();
        }}
        onOk={() => createStoreForm.submit()}
        confirmLoading={createStoreSubmitting}
        okButtonProps={{ 'data-testid': 'store-create-submit-button' }}
        cancelButtonProps={{ 'data-testid': 'store-create-cancel-button' }}
        okText={createStoreSubmitting ? '正在创建' : '确认创建'}
        cancelText="取消"
        destroyOnClose
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="绑定 Noon 商家后台账号后，店铺信息将自动获取"
            description="填写店铺名称、站点店铺Code和站点；系统会使用统一配置的 Noon 商家后台邮箱连接并校验 Project。"
          />

          <Form
            data-testid="store-create-form"
            form={createStoreForm}
            layout="vertical"
            preserve={false}
            onFinish={(values) => void submitCreateStore(values)}
            onFinishFailed={({ errorFields }) => {
              const firstError = errorFields.flatMap((field) => field.errors ?? []).find(Boolean);
              messageApi.warning(firstError || '请检查创建店铺表单。');
            }}
          >
            <Form.Item
              label="店铺名称"
              name="projectName"
              rules={[{ required: true, message: '请输入店铺名称' }]}
            >
              <Input data-testid="store-create-name-input" placeholder="例如：星耀迪拜店" maxLength={100} />
            </Form.Item>
            <Form.Item
              label="站点店铺Code"
              name="storeCode"
              rules={[{ required: true, message: '请输入站点店铺Code' }]}
            >
              <Input data-testid="store-create-store-code-input" placeholder="例如：STR245027-NAE" maxLength={64} />
            </Form.Item>
            <Form.Item
              label="站点"
              name="site"
              rules={[{ required: true, message: '请选择站点' }]}
            >
              <Select
                data-testid="store-create-site-select"
                placeholder="选择站点"
                options={[
                  { label: 'AE', value: 'AE' },
                  { label: 'SA', value: 'SA' }
                ]}
              />
            </Form.Item>
            {pendingCreateStoreProjects.length ? (
              <Form.Item
                label="选择 Noon Project"
                name="projectCode"
                rules={[{ required: true, message: '请选择要绑定的 Noon Project' }]}
              >
                <Select
                  data-testid="store-create-project-select"
                  placeholder="选择要绑定的 Noon Project"
                  options={pendingCreateStoreProjects.map((project) => ({
                    label: `${project.projectName || project.projectCode} · ${project.projectCode}`,
                    value: project.projectCode
                  }))}
                />
              </Form.Item>
            ) : null}
          </Form>
        </Space>
      </Modal>
    </div>
  );
}
