import { strict as assert } from 'node:assert';
import type { FormInstance } from 'antd';
import type { ReactNode } from 'react';
import { ChangePasswordModal } from './ChangePasswordModal';
import {
  buildChangePasswordRequest,
  type ChangePasswordFormValues
} from './changePassword';

assert.deepEqual(
  buildChangePasswordRequest({
    currentPassword: 'old-password',
    password1: 'new-password',
    password2: 'new-password'
  }),
  {
    currentPassword: 'old-password',
    newPassword: 'new-password'
  },
  '改密请求只允许携带当前密码和新密码'
);

const modal = ChangePasswordModal({
  form: {} as FormInstance<ChangePasswordFormValues>,
  open: true,
  submitting: false,
  onClose: () => undefined,
  onSubmit: () => undefined
});

function findElement(
  node: ReactNode,
  predicate: (props: Record<string, unknown>) => boolean
): Record<string, unknown> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, predicate);
      if (match) return match;
    }
    return null;
  }
  if (!node || typeof node !== 'object' || !('props' in node)) {
    return null;
  }
  const props = (node as { props: Record<string, unknown> }).props;
  if (predicate(props)) {
    return props;
  }
  return findElement(props.children as ReactNode, predicate);
}

const currentPasswordField = findElement(
  modal,
  (props) => props.name === 'currentPassword'
);
assert.ok(currentPasswordField, '改密弹窗必须包含当前密码字段');
assert.deepEqual(currentPasswordField.rules, [
  { required: true, message: '请输入当前密码' }
]);

const currentPasswordInput = findElement(
  modal,
  (props) => props['data-testid'] === 'change-password-current-input'
);
assert.ok(currentPasswordInput, '当前密码输入框必须提供稳定测试标识');
assert.equal(currentPasswordInput.autoComplete, 'current-password');
