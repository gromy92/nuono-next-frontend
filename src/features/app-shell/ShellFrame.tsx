import { lazy, Suspense, type Dispatch, type Key, type ReactNode, type SetStateAction } from 'react';
import {
  App as AntdApp,
  Col,
  ConfigProvider,
  Form,
  Input,
  Layout,
  Modal,
  Row,
  Typography
} from 'antd';
import type { FormInstance, MenuProps, TabsProps } from 'antd';
import { WorkspaceTabsBar, type WorkspaceTabItem } from './WorkspaceTabsBar';
import { ReplicaLoginPage } from '../auth/ReplicaLoginPage';
import type { AuthRoleView, AuthSession } from '../auth/session';
import type { RoleManagementWorkspaceTabKey } from '../master-data/RoleManagementWorkspace';
import type { useProductManagementWorkspace } from '../product-management/useProductManagementWorkspace';
import type { OpenProfitCalculatorPrefilled } from '../profit-calculator/useProfitCalculatorWorkspace';
import type { StoreSyncOverviewState } from '../store-sync/types';
import { ShellHeader } from './ShellHeader';
import { ShellSidebar } from './ShellSidebar';
import { ShellWorkspaceContent } from './ShellWorkspaceContent';
import type { SidebarMenuItem } from './SidebarNavigation';
import type { AppMenuKey } from './WorkspaceRouting';
import { WorkspaceErrorBoundary } from './WorkspaceErrorBoundary';
import { isProductWorkspaceMenu } from './WorkspaceMenuRegistry';
import type { LoadStoreSyncOptions } from './useStoreSyncController';

const { Content } = Layout;
const { Text } = Typography;
const LEGACY_PASSWORD_PATTERN = /^[!-~]{6,14}$/;

const ProductManagementWorkspaceModals = lazy(() =>
  import('../product-management/ProductManagementWorkspaceModals').then((module) => ({
    default: module.ProductManagementWorkspaceModals
  }))
);

export type ChangePasswordFormValues = {
  password1: string;
  password2: string;
};

type ProductManagementWorkspace = ReturnType<typeof useProductManagementWorkspace>;

type ShellFrameProps = {
  activeMenuKey: AppMenuKey;
  activeMenuPathLabel: string | null;
  activeOwnerId?: number;
  activeSidebarOpenKeys: string[];
  activeSidebarRootKey?: string;
  activeWorkspaceTabKey: string;
  canManageStoreBinding: boolean;
  canSelectStoreOwner: boolean;
  canShowStoreManagement: boolean;
  changePasswordForm: FormInstance<ChangePasswordFormValues>;
  changePasswordOpen: boolean;
  changePasswordSubmitting: boolean;
  handleRoleViewChange: (nextRoleView: AuthRoleView) => void;
  handleSessionStoreChange: (nextSession: AuthSession) => void;
  handleSidebarMenuClick: ({ key }: { key: Key }) => void;
  handleUserDropdownClick: ({ key }: { key: string }) => void;
  handleWorkspaceTabChange: (key: string) => void;
  handleWorkspaceTabEdit: NonNullable<TabsProps['onEdit']>;
  isProductDetailTab: boolean;
  loadStoreSync: (ownerUserId?: number, options?: LoadStoreSyncOptions) => Promise<void> | void;
  loginError: string | null;
  loginForm: FormInstance;
  loginSubmitting: boolean;
  logout: () => void;
  logoutConfirmOpen: boolean;
  noMenuPermission: boolean;
  notifyRoleManagementDataChanged: (source?: 'store-management') => void;
  onOpenProfitCalculatorPrefilled: OpenProfitCalculatorPrefilled;
  productWorkspace: ProductManagementWorkspace;
  profitBoard: ReactNode;
  roleManagementRefreshSignal: number;
  setChangePasswordOpen: (open: boolean) => void;
  setLoginError: (message: string | null) => void;
  setLogoutConfirmOpen: (open: boolean) => void;
  setSidebarOpenKeys: Dispatch<SetStateAction<string[]>>;
  setStoreSyncOwnerId: Dispatch<SetStateAction<number | undefined>>;
  setUserRoleActiveTabKey: (key: RoleManagementWorkspaceTabKey) => void;
  setActiveMenuKey: (key: AppMenuKey) => void;
  shellSession: AuthSession | null;
  shouldRenderProcurementRequirementConfirmation: boolean;
  shouldRenderWorkspaceTabs: boolean;
  sidebarOpenKeys: string[];
  storeSyncOwnerId?: number;
  storeSyncState: StoreSyncOverviewState;
  submitChangePassword: () => void;
  submitLogin: () => void;
  syncWorkspacePathForMenuKey: (menuKey: AppMenuKey) => void;
  userDropdownItems: MenuProps['items'];
  userRoleActiveTabKey: RoleManagementWorkspaceTabKey;
  visibleWorkspaceMenuItems: SidebarMenuItem[];
  workspaceTabItems: WorkspaceTabItem[];
};

export function ShellFrame({
  activeMenuKey,
  activeMenuPathLabel,
  activeOwnerId,
  activeSidebarOpenKeys,
  activeSidebarRootKey,
  activeWorkspaceTabKey,
  canManageStoreBinding,
  canSelectStoreOwner,
  canShowStoreManagement,
  changePasswordForm,
  changePasswordOpen,
  changePasswordSubmitting,
  handleRoleViewChange,
  handleSessionStoreChange,
  handleSidebarMenuClick,
  handleUserDropdownClick,
  handleWorkspaceTabChange,
  handleWorkspaceTabEdit,
  isProductDetailTab,
  loadStoreSync,
  loginError,
  loginForm,
  loginSubmitting,
  logout,
  logoutConfirmOpen,
  noMenuPermission,
  notifyRoleManagementDataChanged,
  onOpenProfitCalculatorPrefilled,
  productWorkspace,
  profitBoard,
  roleManagementRefreshSignal,
  setChangePasswordOpen,
  setLoginError,
  setLogoutConfirmOpen,
  setSidebarOpenKeys,
  setStoreSyncOwnerId,
  setUserRoleActiveTabKey,
  setActiveMenuKey,
  shellSession,
  shouldRenderProcurementRequirementConfirmation,
  shouldRenderWorkspaceTabs,
  sidebarOpenKeys,
  storeSyncOwnerId,
  storeSyncState,
  submitChangePassword,
  submitLogin,
  syncWorkspacePathForMenuKey,
  userDropdownItems,
  userRoleActiveTabKey,
  visibleWorkspaceMenuItems,
  workspaceTabItems
}: ShellFrameProps) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#5e3cde',
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
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#5e3cde',
                colorBgLayout: '#f5f7fb',
                colorBgContainer: '#ffffff',
                borderRadius: 6,
                fontSize: 14
              },
              components: {
                Menu: {
                  itemHeight: 44,
                  itemBorderRadius: 14,
                  itemColor: '#2b2f42',
                  itemHoverColor: '#5e3cde',
                  itemHoverBg: '#f4efff',
                  itemSelectedColor: '#5e3cde',
                  itemSelectedBg: '#ede6ff',
                  subMenuItemBg: '#f8f8ff',
                  activeBarBorderWidth: 0
                },
                Tabs: {
                  itemColor: '#4b5563',
                  itemSelectedColor: '#5e3cde',
                  itemHoverColor: '#5e3cde',
                  inkBarColor: '#7c5cff'
                }
              }
            }}
          >
            <Layout
              style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #fbfbfd 0%, #f5f7fb 100%)'
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
              <Layout style={{ background: 'transparent' }}>
                <ShellHeader
                  activeMenuPathLabel={activeMenuPathLabel}
                  session={shellSession}
                  userDropdownItems={userDropdownItems}
                  onRoleViewChange={handleRoleViewChange}
                  onSessionStoreChange={handleSessionStoreChange}
                  onUserDropdownClick={handleUserDropdownClick}
                />
                <Content style={{ padding: isProductWorkspaceMenu(activeMenuKey) ? '10px 10px 20px' : '16px 16px 24px' }}>
                  <div style={{ width: '100%' }}>
                    {shouldRenderWorkspaceTabs ? (
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

                    <Row gutter={[16, 16]} align="top">
                      <Col span={24}>
                        <WorkspaceErrorBoundary boundaryName="main-content">
                          <ShellWorkspaceContent
                            activeMenuKey={activeMenuKey}
                            noMenuPermission={noMenuPermission}
                            shouldRenderProcurementRequirementConfirmation={shouldRenderProcurementRequirementConfirmation}
                            shellSession={shellSession}
                            onOpenProfitCalculatorPrefilled={onOpenProfitCalculatorPrefilled}
                            profitBoard={profitBoard}
                            productWorkspace={productWorkspace}
                            activeOwnerId={activeOwnerId}
                            isProductDetailTab={isProductDetailTab}
                            roleManagementTabKey={userRoleActiveTabKey}
                            canShowStoreManagement={canShowStoreManagement}
                            roleManagementRefreshSignal={roleManagementRefreshSignal}
                            storeSyncState={storeSyncState}
                            storeSyncOwnerId={storeSyncOwnerId}
                            canSelectStoreOwner={canSelectStoreOwner}
                            canManageStoreBinding={canManageStoreBinding}
                            onStoreOwnerChange={setStoreSyncOwnerId}
                            onStoreRefresh={loadStoreSync}
                            onRoleManagementDataChanged={notifyRoleManagementDataChanged}
                            onRoleManagementTabChange={(nextKey) => {
                              setUserRoleActiveTabKey(nextKey);
                              setActiveMenuKey(nextKey === 'user-store-noon' ? 'user-store-noon' : 'user-role');
                              syncWorkspacePathForMenuKey(nextKey === 'user-store-noon' ? 'user-store-noon' : 'user-role');
                            }}
                          />
                        </WorkspaceErrorBoundary>
                      </Col>
                    </Row>

                    {isProductWorkspaceMenu(activeMenuKey) ? (
                      <Suspense fallback={null}>
                        <ProductManagementWorkspaceModals workspace={productWorkspace} />
                      </Suspense>
                    ) : null}

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

                    <Modal
                      title="修改密码"
                      open={changePasswordOpen}
                      width={400}
                      destroyOnClose
                      confirmLoading={changePasswordSubmitting}
                      okText="确定"
                      cancelText="取消"
                      okButtonProps={{ 'data-testid': 'change-password-submit-button' }}
                      cancelButtonProps={{ 'data-testid': 'change-password-cancel-button' }}
                      onCancel={() => {
                        if (changePasswordSubmitting) {
                          return;
                        }
                        setChangePasswordOpen(false);
                        changePasswordForm.resetFields();
                      }}
                      onOk={() => void submitChangePassword()}
                    >
                      <Form
                        data-testid="change-password-form"
                        form={changePasswordForm}
                        layout="horizontal"
                        labelCol={{ span: 6 }}
                        wrapperCol={{ span: 18 }}
                        preserve={false}
                        style={{ marginTop: 16 }}
                      >
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
