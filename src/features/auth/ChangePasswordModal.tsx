import { Form, Input, Modal } from 'antd';
import type { FormInstance } from 'antd';
import type { ChangePasswordFormValues } from './changePassword';

export type { ChangePasswordFormValues } from './changePassword';

const LEGACY_PASSWORD_PATTERN = /^[!-~]{6,14}$/;

type ChangePasswordModalProps = {
  form: FormInstance<ChangePasswordFormValues>;
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

export function ChangePasswordModal({
  form,
  open,
  submitting,
  onClose,
  onSubmit
}: ChangePasswordModalProps) {
  return (
    <Modal
      title="修改密码"
      open={open}
      width={400}
      destroyOnClose
      confirmLoading={submitting}
      okText="确定"
      cancelText="取消"
      okButtonProps={{ 'data-testid': 'change-password-submit-button' }}
      cancelButtonProps={{ 'data-testid': 'change-password-cancel-button' }}
      onCancel={() => {
        if (submitting) {
          return;
        }
        onClose();
        form.resetFields();
      }}
      onOk={() => void onSubmit()}
    >
      <Form
        data-testid="change-password-form"
        form={form}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        preserve={false}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          label="当前密码"
          name="currentPassword"
          rules={[{ required: true, message: '请输入当前密码' }]}
        >
          <Input.Password
            data-testid="change-password-current-input"
            placeholder="请输入当前密码"
            autoComplete="current-password"
          />
        </Form.Item>
        <Form.Item
          label="新密码"
          name="password1"
          rules={[
            { required: true, message: '请输入新密码' },
            {
              pattern: LEGACY_PASSWORD_PATTERN,
              message: '密码需为 6-14 位，不能包含空格或中文'
            }
          ]}
        >
          <Input.Password data-testid="change-password-new-input" placeholder="请输入新密码" autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label="确认密码"
          name="password2"
          rules={[
            { required: true, message: '请输入确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password1') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次密码不一致'));
              }
            })
          ]}
        >
          <Input.Password data-testid="change-password-confirm-input" placeholder="请输入确认密码" autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
