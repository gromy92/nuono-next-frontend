import { Alert, Button, Form, Input, Modal, Select, Space, Spin, Table, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { StoreManagementBoardModel } from './StoreManagementBoard';

const { Text } = Typography;

export function StoreManagementView({ model }: { model: StoreManagementBoardModel }) {
  const {
    state, ownerId, selectedOwnerId, canSelectOwner, canManageBinding, onOwnerChange,
    refresh, storeManagementStats, storeConnectionTestFeedback, columns,
    bindingMode, bindingModalOpen, bindingSubmitting, bindingStore, bindingForm,
    setBindingModalOpen, setBindingStore, submitBinding,
    createStoreModalOpen, createStoreSubmitting, createStoreForm,
    setCreateStoreModalOpen,
    submitCreateStore, messageApi
  } = model;

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
                {storeManagementStats.map((item: { label: string; value: number }) => (
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
                    options={state.data.ownerOptions.map((item: { id: number; realName?: string; accountNo: string }) => ({
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
                {state.data.missingCoreTables.map((table: string) => (
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
              label="Noon Project Code"
              name="projectCode"
              rules={[{ required: true, message: '请输入 Noon Project Code' }]}
            >
              <Input data-testid="store-create-project-code-input" placeholder="例如：PRJ245027" maxLength={64} />
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
          </Form>
        </Space>
      </Modal>
    </div>
  );
}
