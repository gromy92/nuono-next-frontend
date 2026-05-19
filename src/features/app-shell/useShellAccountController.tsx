import { useCallback, useMemo, useState } from 'react';
import { Form, message } from 'antd';
import type { MenuProps } from 'antd';
import { LockOutlined, LogoutOutlined } from '@ant-design/icons';
import type { AuthRoleView, AuthSession } from '../auth/session';
import type { ProductWorkspaceTabKey } from '../product-management/types';
import { currentAppPathname } from '../../runtimePaths';
import type { ChangePasswordFormValues } from './ShellFrame';
import { SESSION_STORAGE_KEY } from './ShellSessionStorage';
import {
  type AppMenuKey,
  canSwitchBossRoleView,
  normalizeSessionRoleView,
  resolveSessionAllowedMenuKeys,
  resolveSessionLandingMenuKey,
  resolveWorkspaceMenuKeyFromLocation,
  resolveWorkspacePathForMenuKey,
  withCurrentWorkspaceDevQuery
} from './WorkspaceRouting';

type UseShellAccountControllerParams = {
  activeMenuKey: AppMenuKey;
  resetProductWorkspace: () => void;
  resetStoreSync: () => void;
  session: AuthSession | null;
  setActiveMenuKey: (key: AppMenuKey) => void;
  setActiveProductWorkspaceTabKey: (key: ProductWorkspaceTabKey) => void;
  setSelectedInitializationStoreCodeOverride: (storeCode?: string) => void;
  setSession: (session: AuthSession | null) => void;
  setStoreSyncOwnerId: (ownerId?: number) => void;
  syncWorkspacePathForMenuKey: (menuKey: AppMenuKey) => void;
};

export function useShellAccountController({
  activeMenuKey,
  resetProductWorkspace,
  resetStoreSync,
  session,
  setActiveMenuKey,
  setActiveProductWorkspaceTabKey,
  setSelectedInitializationStoreCodeOverride,
  setSession,
  setStoreSyncOwnerId,
  syncWorkspacePathForMenuKey
}: UseShellAccountControllerParams) {
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginForm] = Form.useForm();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changePasswordSubmitting, setChangePasswordSubmitting] = useState(false);
  const [changePasswordForm] = Form.useForm<ChangePasswordFormValues>();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const submitLogin = useCallback(async () => {
    try {
      setLoginError(null);
      const values = await loginForm.validateFields();
      setLoginSubmitting(true);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountNo: values.accountNo,
          password: values.password
        })
      });

      if (!response.ok) {
        let backendMessage = `后端返回 ${response.status}`;
        try {
          const errorPayload = (await response.json()) as { message?: string; error?: string };
          backendMessage = errorPayload.message || errorPayload.error || backendMessage;
        } catch {
          // ignore json parse failure
        }
        throw new Error(backendMessage);
      }

      const payload = (await response.json()) as { session: AuthSession };
      const nextSession = normalizeSessionRoleView(payload.session);
      const requestedMenuKey =
        typeof window !== 'undefined' ? resolveWorkspaceMenuKeyFromLocation(currentAppPathname()) : null;
      const nextMenuKey = resolveSessionLandingMenuKey(
        nextSession,
        resolveSessionAllowedMenuKeys(nextSession),
        requestedMenuKey
      );
      setSession(nextSession);
      if (nextMenuKey) {
        setActiveMenuKey(nextMenuKey);
        setActiveProductWorkspaceTabKey('product-manage');
      }
      setStoreSyncOwnerId(nextSession.defaultOwnerUserId);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
        if (nextMenuKey && currentAppPathname().startsWith('/login')) {
          window.history.replaceState({}, '', withCurrentWorkspaceDevQuery(resolveWorkspacePathForMenuKey(nextMenuKey)));
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }
      message.success(`欢迎回来，${nextSession.realName || nextSession.accountNo}`);
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      setLoginError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoginSubmitting(false);
    }
  }, [loginForm, setActiveMenuKey, setActiveProductWorkspaceTabKey, setSession, setStoreSyncOwnerId]);

  const submitChangePassword = useCallback(async () => {
    if (!session) {
      message.warning('请先登录后再修改密码');
      return;
    }

    try {
      const values = await changePasswordForm.validateFields();
      if (values.password1 !== values.password2) {
        message.error('两次密码不一致');
        return;
      }

      setChangePasswordSubmitting(true);
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: session.userId,
          newPassword: values.password1
        })
      });

      if (!response.ok) {
        let backendMessage = `后端返回 ${response.status}`;
        try {
          const errorPayload = (await response.json()) as { message?: string; error?: string };
          backendMessage = errorPayload.message || errorPayload.error || backendMessage;
        } catch {
          // ignore json parse failure
        }
        throw new Error(backendMessage);
      }

      const payload = (await response.json()) as { message?: string };
      message.success(payload.message ?? '密码修改成功');
      setChangePasswordOpen(false);
      changePasswordForm.resetFields();
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      const errorMessage = error instanceof Error ? error.message : '修改密码失败';
      message.error(errorMessage);
    } finally {
      setChangePasswordSubmitting(false);
    }
  }, [changePasswordForm, session]);

  const handleSessionStoreChange = useCallback((nextSession: AuthSession) => {
    setSession(normalizeSessionRoleView(nextSession));
    setSelectedInitializationStoreCodeOverride(nextSession.currentStore?.storeCode);
  }, [setSelectedInitializationStoreCodeOverride, setSession]);

  const handleRoleViewChange = useCallback((nextRoleView: AuthRoleView) => {
    if (!session || !canSwitchBossRoleView(session)) {
      return;
    }

    const nextSession = normalizeSessionRoleView({
      ...session,
      activeRoleView: nextRoleView
    });
    const nextAllowedMenuKeys = resolveSessionAllowedMenuKeys(nextSession);
    const nextMenuKey = resolveSessionLandingMenuKey(
      nextSession,
      nextAllowedMenuKeys,
      nextRoleView === 'operator' ? activeMenuKey : null
    );

    setSession(nextSession);
    if (nextMenuKey && nextMenuKey !== activeMenuKey) {
      setActiveMenuKey(nextMenuKey);
      if (nextMenuKey === 'product-manage') {
        setActiveProductWorkspaceTabKey('product-manage');
      }
      syncWorkspacePathForMenuKey(nextMenuKey);
    }
  }, [activeMenuKey, session, setActiveMenuKey, setActiveProductWorkspaceTabKey, setSession, syncWorkspacePathForMenuKey]);

  const logout = useCallback(() => {
    void fetch('/api/auth/logout', { method: 'POST' }).catch(() => {
      // Cookie cleanup is best-effort; local state is still cleared below.
    });
    setSession(null);
    setActiveMenuKey('purchase-order');
    setLoginError(null);
    resetStoreSync();
    resetProductWorkspace();
    setActiveProductWorkspaceTabKey('product-manage');
    loginForm.resetFields();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    message.success('已退出当前登录');
  }, [loginForm, resetProductWorkspace, resetStoreSync, setActiveMenuKey, setActiveProductWorkspaceTabKey, setSession]);

  const requestLogout = useCallback(() => {
    if (session) {
      setLogoutConfirmOpen(true);
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    window.history.replaceState({}, '', withCurrentWorkspaceDevQuery('/login'));
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, [session]);

  const userDropdownItems = useMemo<MenuProps['items']>(
    () => [
      session
        ? {
            key: 'password',
            label: (
              <span data-testid="change-password-button" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <LockOutlined />
                修改密码
              </span>
            )
          }
        : null,
      session ? { type: 'divider' } : null,
      {
        key: 'logout',
        label: (
          <span data-testid="logout-button" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <LogoutOutlined />
            {session ? '退出登录' : '返回登录'}
          </span>
        )
      }
    ].filter(Boolean) as MenuProps['items'],
    [session]
  );

  const handleUserDropdownClick = useCallback(
    ({ key }: { key: string }) => {
      if (key === 'password') {
        setChangePasswordOpen(true);
        return;
      }
      if (key === 'logout') {
        requestLogout();
      }
    },
    [requestLogout]
  );

  return {
    changePasswordForm,
    changePasswordOpen,
    changePasswordSubmitting,
    handleRoleViewChange,
    handleSessionStoreChange,
    handleUserDropdownClick,
    loginError,
    loginForm,
    loginSubmitting,
    logout,
    logoutConfirmOpen,
    setChangePasswordOpen,
    setLoginError,
    setLogoutConfirmOpen,
    submitChangePassword,
    submitLogin,
    userDropdownItems
  };
}
