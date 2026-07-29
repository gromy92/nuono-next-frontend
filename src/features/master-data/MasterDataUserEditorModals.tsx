import {
  Alert,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Transfer,
  Typography
} from 'antd';
import { firstFormValidationMessage } from '../../shared/api';
import { roleNameLabel } from './display';
import {
  confirmDialogContent,
  confirmDialogOkText,
  confirmDialogTitle
} from './MasterDataConfirmDialog';
import type { MasterDataBoardModel } from './MasterDataBoard';

const { Text } = Typography;

export function MasterDataUserEditorModals({ model }: { model: MasterDataBoardModel['userEditorModals'] }) {
  const {
    confirmSubmitting,
    confirmDialog,
    confirmOkDanger,
    confirmOkDisabled,
    setConfirmDialog,
    submitConfirmDialog,
    userSubmitting,
    userModalOpen,
    userModalKind,
    editingUser,
    userForm,
    submitUser,
    setUserSubmitError,
    messageApi,
    userSubmitError,
    assignableRoleOptions,
    storeTransferData,
    watchedRoleAllStores,
    allOperatorStoreGroupKeys,
    watchedStoreGroupKeys,
    setUserModalOpen
  } = model;
  return (
    <>
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
    </>
  );
}
