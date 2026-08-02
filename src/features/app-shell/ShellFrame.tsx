import { type Dispatch, type Key, type SetStateAction } from 'react';
import { App as AntdApp, Col, ConfigProvider, Layout, Modal, Row, Typography } from 'antd';
import type { FormInstance, MenuProps, TabsProps } from 'antd';
import { NUONO_PRIMARY } from '../../shared/themePalette';
import { WorkspaceTabsBar, type WorkspaceTabItem } from './WorkspaceTabsBar';
import { ChangePasswordModal, type ChangePasswordFormValues } from '../auth/ChangePasswordModal';
import { AUTHENTICATED_SHELL_THEME } from './authenticatedShellTheme';
import { ReplicaLoginPage } from '../auth/ReplicaLoginPage';
import type { AuthRoleView, AuthSession } from '../auth/session';
import { ShellHeader } from './ShellHeader';
import { ShellSidebar } from './ShellSidebar';
import { ShellWorkspaceContent } from './ShellWorkspaceContent';
import type { SidebarMenuItem } from './SidebarNavigation';
import { WorkspaceErrorBoundary } from './WorkspaceErrorBoundary';
import {
  workspaceMenuContentDensity,
  type AppMenuKey
} from '../route-catalog/RouteCatalog';
import './shell-layout.css';

const { Content } = Layout;
const { Text } = Typography;

type ShellFrameProps = {
  activeMenuKey: AppMenuKey;
  allowedMenuKeySet: ReadonlySet<AppMenuKey>;
  activeMenuPathLabel: string | null;
  activeSidebarOpenKeys: string[];
  activeSidebarRootKey?: string;
  activeWorkspaceTabKey: string;
  changePasswordForm: FormInstance<ChangePasswordFormValues>;
  changePasswordOpen: boolean;
  changePasswordSubmitting: boolean;
  handleRoleViewChange: (nextRoleView: AuthRoleView) => void;
  handleSessionStoreChange: (nextSession: AuthSession) => void;
  handleSidebarMenuClick: ({ key }: { key: Key }) => void;
  handleUserDropdownClick: ({ key }: { key: string }) => void;
  handleWorkspaceTabChange: (key: string) => void;
  handleWorkspaceTabEdit: NonNullable<TabsProps['onEdit']>;
  loginError: string | null;
  loginForm: FormInstance;
  loginSubmitting: boolean;
  logout: () => void;
  logoutConfirmOpen: boolean;
  noMenuPermission: boolean;
  openedWorkspaceTabKeys: AppMenuKey[];
  routeNotFound: boolean;
  setChangePasswordOpen: (open: boolean) => void;
  setLoginError: (message: string | null) => void;
  setLogoutConfirmOpen: (open: boolean) => void;
  setSidebarOpenKeys: Dispatch<SetStateAction<string[]>>;
  shellSession: AuthSession | null;
  shouldRenderWorkspaceTabs: boolean;
  sidebarOpenKeys: string[];
  submitChangePassword: () => void;
  submitLogin: () => void;
  userDropdownItems: MenuProps['items'];
  visibleWorkspaceMenuItems: SidebarMenuItem[];
  workspaceTabItems: WorkspaceTabItem[];
};

export function ShellFrame({
  activeMenuKey,
  allowedMenuKeySet,
  activeMenuPathLabel,
  activeSidebarOpenKeys,
  activeSidebarRootKey,
  activeWorkspaceTabKey,
  changePasswordForm,
  changePasswordOpen,
  changePasswordSubmitting,
  handleRoleViewChange,
  handleSessionStoreChange,
  handleSidebarMenuClick,
  handleUserDropdownClick,
  handleWorkspaceTabChange,
  handleWorkspaceTabEdit,
  loginError,
  loginForm,
  loginSubmitting,
  logout,
  logoutConfirmOpen,
  noMenuPermission,
  openedWorkspaceTabKeys,
  routeNotFound,
  setChangePasswordOpen,
  setLoginError,
  setLogoutConfirmOpen,
  setSidebarOpenKeys,
  shellSession,
  shouldRenderWorkspaceTabs,
  sidebarOpenKeys,
  submitChangePassword,
  submitLogin,
  userDropdownItems,
  visibleWorkspaceMenuItems,
  workspaceTabItems
}: ShellFrameProps) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: NUONO_PRIMARY,
          colorBgLayout: '#f4f7f1',
          borderRadius: 8,
          fontSize: 14
        }
      }}
    >
      <AntdApp>
        {!shellSession ? (
          <Layout style={{ minHeight: '100vh', background: '#eef4ec' }}>
            <Content>
              <ReplicaLoginPage
                errorMessage={loginError}
                form={loginForm}
                submitting={loginSubmitting}
                onInputChange={() => setLoginError(null)}
                onSubmit={() => void submitLogin()}
              />
            </Content>
          </Layout>
        ) : (
          <ConfigProvider theme={AUTHENTICATED_SHELL_THEME}>
            <Layout
              className="nuono-shell-layout nuono-shell-theme-green"
              style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #fbfcfb 0%, #f5f7f6 100%)'
              }}
            >
              <ShellSidebar
                activeMenuKey={activeMenuKey}
                activeSidebarRootKey={activeSidebarRootKey}
                items={visibleWorkspaceMenuItems}
                openKeys={sidebarOpenKeys}
                onMenuClick={handleSidebarMenuClick}
                onMouseLeave={() => setSidebarOpenKeys(activeSidebarOpenKeys)}
                onOpenKeysChange={setSidebarOpenKeys}
              />
              <Layout className="nuono-shell-main" style={{ background: 'transparent' }}>
                <ShellHeader
                  activeMenuPathLabel={routeNotFound ? null : activeMenuPathLabel}
                  session={shellSession}
                  userDropdownItems={userDropdownItems}
                  onRoleViewChange={handleRoleViewChange}
                  onSessionStoreChange={handleSessionStoreChange}
                  onUserDropdownClick={handleUserDropdownClick}
                />
                <Content
                  className="nuono-shell-content"
                  style={{
                    padding: workspaceMenuContentDensity(activeMenuKey) === 'compact'
                      ? '10px 10px 20px'
                      : '16px 16px 24px'
                  }}
                >
                  <div className="nuono-shell-content-inner">
                    {shouldRenderWorkspaceTabs && !routeNotFound ? (
                      <WorkspaceErrorBoundary boundaryName="workspace-tabs">
                        <WorkspaceTabsBar
                          activeKey={activeWorkspaceTabKey}
                          items={workspaceTabItems}
                          renderSingle
                          onChange={handleWorkspaceTabChange}
                          onEdit={handleWorkspaceTabEdit}
                        />
                      </WorkspaceErrorBoundary>
                    ) : null}

                    <Row className="nuono-shell-workspace-row" gutter={[16, 16]} align="top">
                      <Col className="nuono-shell-workspace-col" span={24}>
                        <WorkspaceErrorBoundary boundaryName="main-content">
                          <ShellWorkspaceContent
                            activeMenuKey={activeMenuKey}
                            allowedMenuKeySet={allowedMenuKeySet}
                            noMenuPermission={noMenuPermission}
                            shellSession={shellSession}
                            openedWorkspaceTabKeys={openedWorkspaceTabKeys}
                            routeNotFound={routeNotFound}
                          />
                        </WorkspaceErrorBoundary>
                      </Col>
                    </Row>

                    <Modal
                      title="提示"
                      open={logoutConfirmOpen}
                      width={360}
                      okText="确定"
                      cancelText="取消"
                      okButtonProps={{ 'data-testid': 'logout-confirm-submit-button' }}
                      cancelButtonProps={{ 'data-testid': 'logout-confirm-cancel-button' }}
                      onCancel={() => setLogoutConfirmOpen(false)}
                      onOk={() => {
                        setLogoutConfirmOpen(false);
                        logout();
                      }}
                    >
                      <Text data-testid="logout-confirm-dialog">确认退出登录吗？</Text>
                    </Modal>

                    <ChangePasswordModal
                      form={changePasswordForm}
                      open={changePasswordOpen}
                      submitting={changePasswordSubmitting}
                      onClose={() => setChangePasswordOpen(false)}
                      onSubmit={submitChangePassword}
                    />
                  </div>
                </Content>
              </Layout>
            </Layout>
          </ConfigProvider>
        )}
      </AntdApp>
    </ConfigProvider>
  );
}
