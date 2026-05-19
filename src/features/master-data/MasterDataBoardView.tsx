import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Transfer,
  TreeSelect,
  Typography
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { firstFormValidationMessage } from '../../shared/api';
import { FormToolbarLayout } from '../app-shell/FormToolbarLayout';
import {
  bindingStatusColor,
  bindingStatusLabel,
  formatDateOnly,
  isAllStoresRole,
  roleLevelLabel,
  roleNameLabel
} from './display';
import {
  confirmDialogContent,
  confirmDialogOkText,
  confirmDialogTitle
} from './MasterDataConfirmDialog';

const { Text } = Typography;

export function MasterDataBoardView({ model }: { model: any }) {
  const { mode, loading, panelStyle, listRefreshing, refreshCurrentList, isMerchantAccountView, openUserModal, openRoleModal, openMenuModal, userKeyword, setUserKeyword, userTypeFilter, setUserTypeFilter, userStatusFilter, setUserStatusFilter, filteredUserRows, userManageColumns, teamManageColumns, expandedMerchantId, renderExpandedMerchantStores, roleAssignmentStats, roleAssignmentRows, roleAssignColumns, roles, roleColumns, filteredMenus, menuColumns, menuKeyword, setMenuKeyword, detailOpen, setDetailOpen, detailState, openQuotaModal, confirmSubmitting, confirmDialog, confirmOkDanger, confirmOkDisabled, setConfirmDialog, submitConfirmDialog, userSubmitting, userModalOpen, userModalKind, editingUser, userForm, submitUser, setUserSubmitError, messageApi, userSubmitError, assignableRoleOptions, storeTransferData, watchedRoleAllStores, allOperatorStoreGroupKeys, watchedStoreGroupKeys, setUserModalOpen, storeAssignmentSubmitting, storeAssignmentOpen, storeAssignmentUser, storeAssignmentLoading, setStoreAssignmentOpen, setStoreAssignmentCurrentGroups, setStoreAssignmentError, submitStoreAssignment, storeAssignmentError, storeAssignmentTransferData, storeAssignmentGroupKeys, setStoreAssignmentGroupKeys, quotaSubmitting, quotaModalOpen, quotaTargetStore, quotaTargetUser, setQuotaModalOpen, setQuotaTargetStore, submitQuota, quotaForm, paymentModalOpen, paymentTargetUser, setPaymentModalOpen, setPaymentRecords, paymentRecords, paymentModalLoading, setPaymentAddModalOpen, paymentAddModalOpen, paymentSubmitting, paymentForm, submitPayment, roleSubmitting, roleModalOpen, editingRole, setRoleModalOpen, submitRole, roleForm, roleTreeOptions, menuTreeData, menuSubmitting, menuModalOpen, editingMenu, setMenuModalOpen, submitMenu, menuForm } = model;

  if (loading) {
    return (
      <Card data-testid={`master-data-loading-${mode}`} bordered={false} style={panelStyle}>
        <Space size={12}>
          <Spin size="small" />
          <Text>正在读取主数据管理页...</Text>
        </Space>
      </Card>
    );
  }

  return (
    <Space data-testid={`master-data-board-${mode}`} direction="vertical" size={16} style={{ width: '100%' }}>
      {mode === 'user-account' ? (
        <div className="nuono-legacy-user-manage">
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {!isMerchantAccountView ? (
              <Alert
                type="info"
                showIcon
                message="账号管理这里负责团队成员维护，角色调整和店铺重分配继续在角色分配页完成。"
                style={{ borderRadius: 6, background: '#f8fafc', borderColor: '#dbe4ea' }}
              />
            ) : null}
            <FormToolbarLayout
              className="nuono-legacy-user-toolbar"
              actions={
                <Space size={8}>
                  <Button
                    data-testid="user-list-refresh-button"
                    icon={<ReloadOutlined />}
                    loading={listRefreshing}
                    onClick={() => void refreshCurrentList()}
                  >
                    刷新
                  </Button>
                  <Button
                    data-testid="user-create-button"
                    type="primary"
                    onClick={() => openUserModal(isMerchantAccountView ? 'merchant' : 'member')}
                  >
                    {isMerchantAccountView ? '+ 新建商家' : '+ 添加账号'}
                  </Button>
                </Space>
              }
            >
                <Input.Search
                  data-testid="user-search-input"
                  allowClear
                  placeholder={isMerchantAccountView ? '搜索姓名/手机号/账号' : '搜索账号/姓名/手机号'}
                  style={{ width: 260 }}
                  value={userKeyword}
                  onChange={(event) => setUserKeyword(event.target.value)}
                />
                {isMerchantAccountView ? (
                  <Select
                    data-testid="user-type-filter"
                    allowClear
                    placeholder="类型"
                    style={{ width: 100 }}
                    options={[
                      { label: '内部', value: 'internal' },
                      { label: '外部', value: 'external' }
                    ]}
                    value={userTypeFilter}
                    onChange={(value) => setUserTypeFilter(value)}
                  />
                ) : null}
                <Select
                  data-testid="user-status-filter"
                  allowClear
                  placeholder="状态"
                  style={{ width: 100 }}
                  options={isMerchantAccountView
                    ? [
                        { label: '正常', value: 'normal' },
                        { label: '到期', value: 'expired' }
                      ]
                    : [
                        { label: '正常', value: 'normal' },
                        { label: '禁用', value: 'disabled' }
                      ]}
                  value={userStatusFilter}
                  onChange={(value) => setUserStatusFilter(value)}
                />
            </FormToolbarLayout>

            <Table
              data-testid="user-table"
              className="nuono-legacy-account-table nuono-fit-table nuono-responsive-record-table"
              tableLayout="fixed"
              size="small"
              rowKey="id"
              dataSource={filteredUserRows}
              columns={isMerchantAccountView ? userManageColumns : teamManageColumns}
              scroll={{ x: 1080 }}
              pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
              expandable={
                isMerchantAccountView
                  ? {
                      expandedRowKeys: expandedMerchantId ? [expandedMerchantId] : [],
                      expandedRowRender: renderExpandedMerchantStores,
                      showExpandColumn: false
                    }
                  : undefined
              }
              locale={{ emptyText: <Empty description="当前没有符合条件的用户" /> }}
            />
          </Space>
        </div>
      ) : null}

      {mode === 'user-role' ? (
        <div className="nuono-role-assignment-board">
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div className="nuono-store-management-toolbar nuono-role-assignment-toolbar">
              <Alert
                className="nuono-store-management-hint nuono-role-assignment-hint"
                type="info"
                showIcon
                message="角色或店铺变更后需重新登录生效"
              />

              <div className="nuono-role-assignment-filters">
                <Input.Search
                  data-testid="role-user-search-input"
                  allowClear
                  placeholder="搜索账号/姓名/手机号"
                  style={{ width: 220 }}
                  value={userKeyword}
                  onChange={(event) => setUserKeyword(event.target.value)}
                />
                <Select
                  data-testid="role-user-status-filter"
                  allowClear
                  placeholder="状态"
                  style={{ width: 96 }}
                  options={[
                    { label: '启用', value: 'normal' },
                    { label: '禁用', value: 'disabled' }
                  ]}
                  value={userStatusFilter}
                  onChange={(value) => setUserStatusFilter(value)}
                />
              </div>

              <div className="nuono-masterdata-stat-strip nuono-store-management-stats nuono-role-assignment-stats" data-testid="role-assignment-stats">
                {roleAssignmentStats.map((item: any) => (
                  <div key={item.label} className="nuono-masterdata-stat-item nuono-store-management-stat-item nuono-role-assignment-stat-item">
                    <span className="nuono-masterdata-stat-label">{item.label}</span>
                    <span className="nuono-masterdata-stat-value">{item.value}</span>
                  </div>
                ))}
              </div>

              <Space className="nuono-store-management-actions nuono-role-assignment-actions" wrap>
                <Button
                  data-testid="role-user-refresh-button"
                  icon={<ReloadOutlined />}
                  loading={listRefreshing}
                  onClick={() => void refreshCurrentList()}
                >
                  刷新
                </Button>
                <Button data-testid="role-user-create-button" type="primary" onClick={() => openUserModal('member')}>
                  + 添加账号
                </Button>
              </Space>
            </div>

            <Table
              data-testid="role-assignment-table"
              className="nuono-role-assignment-table nuono-responsive-record-table"
              tableLayout="fixed"
              size="middle"
              rowKey="id"
              dataSource={roleAssignmentRows}
              columns={roleAssignColumns}
              scroll={{ x: 1360 }}
              pagination={{ pageSize: 20, showSizeChanger: false }}
              locale={{ emptyText: <Empty description="当前还没有可分配角色的用户" /> }}
            />
          </Space>
        </div>
      ) : null}

      {mode === 'system-role' ? (
        <Card bordered={false} style={panelStyle}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <FormToolbarLayout
              title={
                <Text strong style={{ fontSize: 16, color: '#0f172a' }}>
                  角色管理
                </Text>
              }
              actions={
                <Space size={8}>
                  <Button
                    data-testid="role-list-refresh-button"
                    icon={<ReloadOutlined />}
                    loading={listRefreshing}
                    onClick={() => void refreshCurrentList()}
                  >
                    刷新
                  </Button>
                  <Button data-testid="role-create-button" type="primary" onClick={() => openRoleModal()}>
                    新增角色
                  </Button>
                </Space>
              }
            />

            <Table
              data-testid="role-table"
              className="nuono-fit-table nuono-system-role-table"
              tableLayout="fixed"
              size="small"
              rowKey="id"
              dataSource={roles}
              columns={roleColumns}
              scroll={{ x: 1330 }}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              locale={{ emptyText: <Empty description="当前还没有角色样本" /> }}
            />
          </Space>
        </Card>
      ) : null}

      {mode === 'system-menu' ? (
        <Card bordered={false} style={panelStyle}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <FormToolbarLayout
              title={
                <Text strong style={{ fontSize: 16, color: '#0f172a' }}>
                  菜单维护
                </Text>
              }
              actions={
                <Space size={8}>
                  <Button
                    data-testid="menu-list-refresh-button"
                    icon={<ReloadOutlined />}
                    loading={listRefreshing}
                    onClick={() => void refreshCurrentList()}
                  >
                    刷新
                  </Button>
                  <Button data-testid="menu-create-button" type="primary" onClick={() => openMenuModal()}>
                    新增菜单
                  </Button>
                </Space>
              }
            >
                <Input.Search
                  data-testid="menu-search-input"
                  allowClear
                  placeholder="按菜单名称搜索"
                  style={{ width: 220 }}
                  value={menuKeyword}
                  onChange={(event) => setMenuKeyword(event.target.value)}
                />
            </FormToolbarLayout>

            <Table
              data-testid="menu-table"
              className="nuono-fit-table nuono-system-menu-table"
              tableLayout="fixed"
              size="small"
              rowKey="id"
              dataSource={filteredMenus}
              columns={menuColumns}
              scroll={{ x: 1500 }}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              locale={{ emptyText: <Empty description="当前还没有菜单样本" /> }}
            />
          </Space>
        </Card>
      ) : null}

      <Modal
        open={detailOpen}
        width={980}
        title="用户详情"
        footer={[
          <Button data-testid="user-detail-close-button" key="close" onClick={() => setDetailOpen(false)}>
            关闭
          </Button>
        ]}
        onCancel={() => setDetailOpen(false)}
      >
        {detailState.status === 'loading' ? (
          <Space size={12}>
            <Spin size="small" />
            <Text>正在读取用户详情...</Text>
          </Space>
        ) : null}

        {detailState.status === 'error' ? (
          <Alert type="warning" showIcon message="用户详情暂时不可用" description={detailState.message} />
        ) : null}

        {detailState.status === 'success' ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="登录账号">{detailState.data.accountNo}</Descriptions.Item>
              <Descriptions.Item label="姓名">{detailState.data.realName || '-'}</Descriptions.Item>
              <Descriptions.Item label="角色">{roleNameLabel(detailState.data.roleName)}</Descriptions.Item>
              <Descriptions.Item label="状态">{detailState.data.status === 1 ? '正常' : '禁用'}</Descriptions.Item>
              <Descriptions.Item label="手机号">{detailState.data.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{detailState.data.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="公司">{detailState.data.companyName || '-'}</Descriptions.Item>
              <Descriptions.Item label="负责站点">{detailState.data.sites || '-'}</Descriptions.Item>
              <Descriptions.Item label="账号类型">{detailState.data.accountType || '-'}</Descriptions.Item>
              <Descriptions.Item label="角色层级">
                {detailState.data.roleLevel != null ? roleLevelLabel(detailState.data.roleLevel) : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Card
              size="small"
              title="店铺挂载详情"
              bordered={false}
              style={{ background: '#fafaff', border: '1px solid #ece7ff', borderRadius: 12, boxShadow: 'none' }}
            >
              {detailState.data.storeLinks.length ? (
                <Table<any>
                  data-testid="user-store-link-table"
                  size="small"
                  rowKey="id"
                  pagination={false}
                  dataSource={detailState.data.storeLinks}
                  columns={[
                    {
                      title: '逻辑店铺',
                      key: 'project',
                      render: (_: unknown, record: any) => record.projectName || record.projectCode || record.storeCode
                    },
                    {
                      title: '组织',
                      key: 'org',
                      render: (_: unknown, record: any) => record.orgName || record.orgCode || '-'
                    },
                    {
                      title: '站点店铺',
                      dataIndex: 'storeCode',
                      key: 'storeCode'
                    },
                    {
                      title: '站点',
                      dataIndex: 'site',
                      key: 'site',
                      render: (value: string | undefined) => value || '-'
                    },
                    {
                      title: '授权状态',
                      dataIndex: 'authorized',
                      key: 'authorized',
                      render: (value: boolean | undefined) => (
                        <Tag color={value ? 'success' : 'default'} bordered={false} style={{ marginInlineEnd: 0 }}>
                          {value ? '已授权' : '未授权'}
                        </Tag>
                      )
                    }
                  ]}
                />
              ) : (
                <Empty description="当前没有挂载店铺" />
              )}
            </Card>

            {isMerchantAccountView ? (
              <Card
                size="small"
                title="额度配置"
                extra={
                    <Button
                    data-testid="quota-edit-button"
                    type="link"
                    size="small"
                    style={{ paddingInline: 0 }}
                    onClick={() =>
                      openQuotaModal(
                        {
                          id: detailState.data.id,
                          accountNo: detailState.data.accountNo,
                          realName: detailState.data.realName,
                          listLimit: detailState.data.listLimit,
                          collectLimit: detailState.data.collectLimit,
                          whApLimit: detailState.data.whApLimit,
                          chatgptTranslateLimit: detailState.data.chatgptTranslateLimit,
                          bindingStatus: detailState.data.bindingStatus
                        },
                        detailState.data
                      )
                    }
                  >
                    修改额度
                  </Button>
                }
                bordered={false}
                style={{ background: '#fafaff', border: '1px solid #ece7ff', borderRadius: 12, boxShadow: 'none' }}
              >
                <Descriptions size="small" column={4}>
                  <Descriptions.Item label="采集额度">{detailState.data.collectLimit ?? 0}</Descriptions.Item>
                  <Descriptions.Item label="翻译额度">{detailState.data.chatgptTranslateLimit ?? 0}</Descriptions.Item>
                  <Descriptions.Item label="上架额度">{detailState.data.listLimit ?? 0}</Descriptions.Item>
                  <Descriptions.Item label="月约仓额度">{detailState.data.whApLimit ?? 0}</Descriptions.Item>
                </Descriptions>
              </Card>
            ) : null}

            <Card
              size="small"
              title="Noon 绑定详情"
              bordered={false}
              style={{ background: '#fafaff', border: '1px solid #ece7ff', borderRadius: 12, boxShadow: 'none' }}
            >
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="绑定状态">
                  <Tag color={bindingStatusColor(detailState.data.bindingStatus)} bordered={false} style={{ marginInlineEnd: 0 }}>
                    {bindingStatusLabel(detailState.data.bindingStatus)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Noon 登录账号">{detailState.data.noonPartnerUser || '-'}</Descriptions.Item>
                {detailState.data.noonPartnerProjectUser
                  && detailState.data.noonPartnerProjectUser !== detailState.data.noonPartnerUser ? (
                    <Descriptions.Item label="Noon 项目账号">{detailState.data.noonPartnerProjectUser}</Descriptions.Item>
                  ) : null}
                <Descriptions.Item label="Noon Partner ID">{detailState.data.noonPartnerId || '-'}</Descriptions.Item>
                <Descriptions.Item label="Noon 用户编码">{detailState.data.noonPartnerUserCode || '-'}</Descriptions.Item>
                <Descriptions.Item label="邮箱授权码">{detailState.data.noonPartnerMailAuthCode || '-'}</Descriptions.Item>
                <Descriptions.Item label="Cookie 更新时间">{detailState.data.cookieGenerateTime || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Space>
        ) : null}
      </Modal>

      <Modal
        destroyOnClose
        confirmLoading={confirmSubmitting}
        open={Boolean(confirmDialog)}
        title={confirmDialogTitle(confirmDialog)}
        okText={confirmDialogOkText(confirmDialog)}
        cancelText="取消"
        okButtonProps={{ danger: Boolean(confirmOkDanger), disabled: Boolean(confirmOkDisabled), 'data-testid': 'confirm-submit-button' }}
        cancelButtonProps={{ 'data-testid': 'confirm-cancel-button' }}
        onCancel={() => setConfirmDialog(null)}
        onOk={() => void submitConfirmDialog()}
      >
        <Text data-testid="confirm-dialog">{confirmDialogContent(confirmDialog)}</Text>
      </Modal>

      <Modal
        destroyOnClose
        confirmLoading={userSubmitting}
        open={userModalOpen}
        title={
          userModalKind === 'merchant'
            ? editingUser
              ? `编辑商家 - ${editingUser.realName || editingUser.accountNo}`
              : '新建商家'
            : editingUser
              ? `编辑成员 - ${editingUser.realName || editingUser.accountNo}`
              : '添加账号'
        }
        width={620}
        okText={editingUser ? '保存' : '创建'}
        cancelText="取消"
        okButtonProps={{ 'data-testid': 'user-submit-button', form: 'master-data-user-form', htmlType: 'submit' }}
        cancelButtonProps={{ 'data-testid': 'user-cancel-button' }}
        onCancel={() => {
          if (userSubmitting) {
            return;
          }
          setUserSubmitError(undefined);
          setUserModalOpen(false);
        }}
      >
        <Form
          id="master-data-user-form"
          data-testid="user-form"
          form={userForm}
          layout="vertical"
          style={{ marginTop: 16 }}
          onFinish={() => void submitUser()}
          onFinishFailed={(info) => {
            const validationMessage = firstFormValidationMessage(info) || '请检查账号表单。';
            setUserSubmitError(validationMessage);
            messageApi.warning(validationMessage);
          }}
        >
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            {userSubmitError ? (
              <Alert
                data-testid="user-submit-error"
                type="error"
                showIcon
                message={editingUser ? '保存账号失败' : '创建账号失败'}
                description={userSubmitError}
              />
            ) : null}
            <Form.Item label="登录账号" name="accountNo" rules={[{ required: true, message: '请输入登录账号' }]}>
              <Input data-testid="user-account-input" placeholder="请输入登录账号" disabled={Boolean(editingUser)} />
            </Form.Item>
            <Form.Item label={userModalKind === 'merchant' ? '姓名 / 商家名' : '姓名'} name="realName">
              <Input data-testid="user-real-name-input" placeholder={userModalKind === 'merchant' ? '请输入商家姓名' : '请输入成员姓名'} />
            </Form.Item>
            <Form.Item label="手机号" name="phone">
              <Input data-testid="user-phone-input" placeholder="请输入手机号" maxLength={11} />
            </Form.Item>
            {userModalKind === 'merchant' ? (
              <>
                <Form.Item label="邮箱" name="email">
                  <Input data-testid="user-email-input" placeholder="请输入邮箱" />
                </Form.Item>
                <Form.Item label="账号类型" name="accountType" rules={[{ required: true, message: '请选择账号类型' }]}>
                  <Select
                    data-testid="user-account-type-select"
                    options={[
                      { label: '内部', value: 'internal' },
                      { label: '外部', value: 'external' }
                    ]}
                  />
                </Form.Item>
                <Form.Item label="公司名称" name="companyName">
                  <Input data-testid="user-company-input" placeholder="可选，默认沿用当前样本值" />
                </Form.Item>
                <Form.Item label="服务到期日" name="expiredTime">
                  <DatePicker
                    data-testid="user-expired-date-picker"
                    allowClear
                    format="YYYY-MM-DD"
                    placeholder="请选择服务到期日"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </>
            ) : (
              <>
                {!editingUser ? (
                  <>
                    <Form.Item label="角色" name="roleId" rules={[{ required: true, message: '请选择角色' }]}>
                      <Select data-testid="user-role-select" allowClear options={assignableRoleOptions} placeholder="请选择角色" />
                    </Form.Item>
                    <Form.Item name="storeGroupKeys" hidden>
                      <Select mode="multiple" />
                    </Form.Item>
                    <Form.Item label="负责店铺">
                      <div data-testid="user-store-select" className="nuono-transfer-responsive">
                        <Transfer
                          dataSource={storeTransferData}
                          disabled={watchedRoleAllStores}
                          showSearch
                          titles={['可分配店铺', '已负责店铺']}
                          targetKeys={watchedRoleAllStores ? allOperatorStoreGroupKeys : watchedStoreGroupKeys}
                          render={(item) => `${item.title}${item.description ? ` · ${item.description}` : ''}`}
                          listStyle={{ width: 250, height: 260 }}
                          locale={{
                            itemUnit: '项',
                            itemsUnit: '项',
                            searchPlaceholder: '搜索店铺',
                            notFoundContent: storeTransferData.length ? '没有匹配店铺' : '当前登录账号还没有可分配店铺'
                          }}
                          onChange={(keys) => userForm.setFieldValue('storeGroupKeys', keys.map(String))}
                        />
                      </div>
                    </Form.Item>
                  </>
                ) : (
                  <Form.Item label="当前角色">
                    <Input value={roleNameLabel(editingUser.roleName)} disabled />
                  </Form.Item>
                )}
              </>
            )}
            <Form.Item
              label={editingUser ? '密码（留空表示不修改）' : '初始密码'}
              name="password"
              rules={!editingUser ? [{ required: true, message: '请设置初始密码' }] : []}
            >
              <Input.Password data-testid="user-password-input" placeholder={editingUser ? '留空则不修改' : '请输入初始密码'} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal
        destroyOnClose
        confirmLoading={storeAssignmentSubmitting}
        open={storeAssignmentOpen}
        title={`编辑负责店铺 - ${storeAssignmentUser?.realName || storeAssignmentUser?.accountNo || ''}`}
        className="nuono-store-assignment-modal"
        width={920}
        okText="保存"
        cancelText="取消"
        okButtonProps={{ 'data-testid': 'store-assignment-submit-button', disabled: storeAssignmentLoading }}
        cancelButtonProps={{ 'data-testid': 'store-assignment-cancel-button' }}
        onCancel={() => {
          setStoreAssignmentOpen(false);
          setStoreAssignmentCurrentGroups([]);
          setStoreAssignmentError(null);
        }}
        onOk={() => void submitStoreAssignment()}
      >
        {storeAssignmentLoading ? (
          <Space size={12}>
            <Spin size="small" />
            <Text>正在读取当前店铺分配...</Text>
          </Space>
        ) : (
          <Form data-testid="store-assignment-form" layout="vertical" style={{ marginTop: 16 }}>
            {storeAssignmentError ? (
              <Alert
                data-testid="store-assignment-error"
                type="error"
                showIcon
                message="保存负责店铺失败"
                description={storeAssignmentError}
                style={{ marginBottom: 12 }}
              />
            ) : null}
            <Form.Item label="负责店铺">
              <div data-testid="store-assignment-select" className="nuono-transfer-responsive">
                <Transfer
                  dataSource={storeAssignmentTransferData}
                  disabled={isAllStoresRole(storeAssignmentUser)}
                  showSearch
                  titles={['可分配店铺', '已负责店铺']}
                  targetKeys={storeAssignmentGroupKeys}
                  render={(item) => `${item.title}${item.description ? ` · ${item.description}` : ''}`}
                  listStyle={{ width: 380, height: 320 }}
                  locale={{
                    itemUnit: '项',
                    itemsUnit: '项',
                    searchPlaceholder: '搜索店铺',
                    notFoundContent: storeAssignmentTransferData.length ? '没有匹配店铺' : '当前账号还没有可分配店铺'
                  }}
                  onChange={(keys) => {
                    setStoreAssignmentError(null);
                    setStoreAssignmentGroupKeys(keys.map(String));
                  }}
                />
              </div>
            </Form.Item>
            {!isAllStoresRole(storeAssignmentUser) ? (
              <Button danger ghost size="small" onClick={() => setConfirmDialog({ type: 'clear-stores' })}>
                清空负责店铺
              </Button>
            ) : null}
            <Alert
              type="info"
              showIcon
              message="保存后会同步重建该账号的 user_store 挂载关系"
              description="如果清空全部店铺，系统会移除当前负责店铺。角色本身不会被移除。"
            />
          </Form>
        )}
      </Modal>

      <Modal
        destroyOnClose
        confirmLoading={quotaSubmitting}
        open={quotaModalOpen}
        title={`修改额度 - ${
          quotaTargetStore
            ? quotaTargetStore.projectName || quotaTargetStore.projectCode || quotaTargetStore.storeCode
            : quotaTargetUser?.realName || quotaTargetUser?.accountNo || ''
        }`}
        width={560}
        okButtonProps={{ 'data-testid': 'quota-submit-button' }}
        cancelButtonProps={{ 'data-testid': 'quota-cancel-button' }}
        onCancel={() => {
          setQuotaModalOpen(false);
          setQuotaTargetStore(null);
        }}
        onOk={() => void submitQuota()}
      >
        <Form data-testid="quota-form" form={quotaForm} layout="vertical" style={{ marginTop: 16 }}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              message={quotaTargetStore ? '当前维护店铺级额度' : '当前维护商家默认额度'}
              description={
                quotaTargetStore
                  ? '保存后只更新当前这一家店铺的额度，不会同步覆盖同一商家下的其它店铺。'
                  : '这组额度作为商家账号默认额度，不会覆盖已单独维护的店铺级额度。'
              }
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <Form.Item label="采集额度" name="collectLimit">
                <InputNumber data-testid="quota-collect-input" min={0} style={{ width: '100%' }} placeholder="次" />
              </Form.Item>
              <Form.Item label="翻译额度" name="chatgptTranslateLimit">
                <InputNumber data-testid="quota-translate-input" min={0} style={{ width: '100%' }} placeholder="次" />
              </Form.Item>
              <Form.Item label="上架额度" name="listLimit">
                <InputNumber data-testid="quota-list-input" min={0} style={{ width: '100%' }} placeholder="次" />
              </Form.Item>
              <Form.Item label="月约仓额度" name="whApLimit">
                <InputNumber data-testid="quota-wh-ap-input" min={0} style={{ width: '100%' }} placeholder="次/月" />
              </Form.Item>
            </div>
          </Space>
        </Form>
      </Modal>

      <Modal
        destroyOnClose
        footer={null}
        open={paymentModalOpen}
        title={`费用记录 - ${paymentTargetUser?.realName || paymentTargetUser?.accountNo || ''}`}
        width={640}
        onCancel={() => {
          setPaymentModalOpen(false);
          setPaymentRecords([]);
        }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <FormToolbarLayout
            title={
              <Text style={{ color: '#475569' }}>
                累计付费：
                <Text strong style={{ color: '#1677ff', fontSize: 16 }}>
                  {' '}
                  ¥{paymentRecords.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0).toFixed(2)}
                </Text>
              </Text>
            }
            actions={
              <Button data-testid="payment-create-button" type="primary" onClick={() => setPaymentAddModalOpen(true)}>
                + 添加记录
              </Button>
            }
          />
          <Table
            data-testid="payment-table"
            size="small"
            rowKey="id"
            loading={paymentModalLoading}
            pagination={false}
            dataSource={paymentRecords}
            columns={[
              {
                title: '付费金额',
                dataIndex: 'amount',
                key: 'amount',
                width: 140,
                render: (value: number) => <Text strong style={{ color: '#1677ff' }}>¥{Number(value || 0).toFixed(2)}</Text>
              },
              {
                title: '付费日期',
                dataIndex: 'paymentDate',
                key: 'paymentDate',
                width: 140,
                render: (value: string) => formatDateOnly(value)
              },
              {
                title: '备注',
                dataIndex: 'remark',
                key: 'remark',
                render: (value?: string) => value || '-'
              }
            ]}
            locale={{ emptyText: <Empty description="当前还没有费用记录" /> }}
          />
        </Space>
      </Modal>

      <Modal
        destroyOnClose
        confirmLoading={paymentSubmitting}
        open={paymentAddModalOpen}
        title="添加费用记录"
        width={460}
        okButtonProps={{ 'data-testid': 'payment-submit-button' }}
        cancelButtonProps={{ 'data-testid': 'payment-cancel-button' }}
        onCancel={() => {
          setPaymentAddModalOpen(false);
          paymentForm.resetFields();
        }}
        onOk={() => void submitPayment()}
      >
        <Form data-testid="payment-form" form={paymentForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="付费金额" name="amount" rules={[{ required: true, message: '请输入付费金额' }]}>
            <InputNumber data-testid="payment-amount-input" min={0} precision={2} style={{ width: '100%' }} placeholder="如 5000" />
          </Form.Item>
          <Form.Item label="付费日期" name="paymentDate" rules={[{ required: true, message: '请选择付费日期' }]}>
            <DatePicker data-testid="payment-date-picker" allowClear format="YYYY-MM-DD" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea data-testid="payment-remark-input" rows={3} placeholder="如：年费续费、额度充值" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        destroyOnClose
        confirmLoading={roleSubmitting}
        open={roleModalOpen}
        title={editingRole ? '编辑角色' : '新增角色'}
        width={640}
        okButtonProps={{ 'data-testid': 'role-submit-button' }}
        cancelButtonProps={{ 'data-testid': 'role-cancel-button' }}
        onCancel={() => setRoleModalOpen(false)}
        onOk={() => void submitRole()}
      >
        <Form data-testid="role-form" form={roleForm} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }} style={{ marginTop: 16 }}>
          <Form.Item label="角色名称" name="name" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input data-testid="role-name-input" placeholder="请输入角色名称" />
          </Form.Item>
          {!editingRole ? (
            <Form.Item label="角色编码" name="code" rules={[{ required: true, message: '请输入角色编码' }]}>
              <Input data-testid="role-code-input" placeholder="建议大写英文下划线，如 OPS_ASSIST" />
            </Form.Item>
          ) : null}
          <Form.Item label="说明" name="description">
            <Input data-testid="role-description-input" placeholder="请输入角色说明" />
          </Form.Item>
          <Form.Item label="上级角色" name="parentId">
            <Select data-testid="role-parent-select" allowClear options={roleTreeOptions} placeholder="请选择上级角色（顶级可不选）" />
          </Form.Item>
	          <Form.Item label="层级" name="level">
	            <InputNumber
	              data-testid="role-level-input"
	              min={0}
	              max={3}
	              disabled={Boolean(editingRole)}
	              style={{ width: '100%' }}
	              placeholder="0=超管 1=老板 2=主管 3=员工"
	            />
          </Form.Item>
          <Form.Item label="菜单权限" name="menuIds">
            <TreeSelect
              data-testid="role-menu-tree-select"
              allowClear
              treeCheckable
              showCheckedStrategy={TreeSelect.SHOW_PARENT}
              style={{ width: '100%' }}
              placeholder="请选择菜单权限"
              treeData={menuTreeData}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        destroyOnClose
        confirmLoading={menuSubmitting}
        open={menuModalOpen}
        title={editingMenu ? '编辑菜单' : '新增菜单'}
        width={560}
        okButtonProps={{ 'data-testid': 'menu-submit-button' }}
        cancelButtonProps={{ 'data-testid': 'menu-cancel-button' }}
        onCancel={() => setMenuModalOpen(false)}
        onOk={() => void submitMenu()}
      >
        <Form data-testid="menu-form" form={menuForm} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }} style={{ marginTop: 16 }}>
          <Form.Item label="菜单名称" name="name" rules={[{ required: true, message: '请输入菜单名称' }]}>
            <Input data-testid="menu-name-input" placeholder="请输入菜单名称" />
          </Form.Item>
          <Form.Item label="父菜单" name="parentId">
            <TreeSelect
              data-testid="menu-parent-tree-select"
              allowClear
              treeDefaultExpandAll
              placeholder="请选择父菜单（不选则为顶级）"
              treeData={menuTreeData}
            />
          </Form.Item>
          <Form.Item label="接口路径" name="urlPath">
            <Input data-testid="menu-url-path-input" placeholder="如 /system/menu 或 /api/xxx" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
