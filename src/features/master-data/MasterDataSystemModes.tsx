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
import { FormToolbarLayout } from '../../shared/ui/FormToolbarLayout';
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

export function MasterDataSystemModes({ model }: { model: any }) {
  const { mode, loading, panelStyle, listRefreshing, refreshCurrentList, isMerchantAccountView, openUserModal, openRoleModal, openMenuModal, userKeyword, setUserKeyword, userTypeFilter, setUserTypeFilter, userStatusFilter, setUserStatusFilter, filteredUserRows, userManageColumns, teamManageColumns, expandedMerchantId, renderExpandedMerchantStores, roleAssignmentStats, roleAssignmentRows, roleAssignColumns, roles, roleColumns, filteredMenus, menuColumns, menuKeyword, setMenuKeyword, detailOpen, setDetailOpen, detailState, openQuotaModal, confirmSubmitting, confirmDialog, confirmOkDanger, confirmOkDisabled, setConfirmDialog, submitConfirmDialog, userSubmitting, userModalOpen, userModalKind, editingUser, userForm, submitUser, setUserSubmitError, messageApi, userSubmitError, assignableRoleOptions, storeTransferData, watchedRoleAllStores, allOperatorStoreGroupKeys, watchedStoreGroupKeys, setUserModalOpen, storeAssignmentSubmitting, storeAssignmentOpen, storeAssignmentUser, storeAssignmentLoading, setStoreAssignmentOpen, setStoreAssignmentCurrentGroups, setStoreAssignmentError, submitStoreAssignment, storeAssignmentError, storeAssignmentTransferData, storeAssignmentGroupKeys, setStoreAssignmentGroupKeys, quotaSubmitting, quotaModalOpen, quotaTargetStore, quotaTargetUser, setQuotaModalOpen, setQuotaTargetStore, submitQuota, quotaForm, paymentModalOpen, paymentTargetUser, setPaymentModalOpen, setPaymentRecords, paymentRecords, paymentModalLoading, setPaymentAddModalOpen, paymentAddModalOpen, paymentSubmitting, paymentForm, submitPayment, roleSubmitting, roleModalOpen, editingRole, setRoleModalOpen, submitRole, roleForm, roleTreeOptions, menuTreeData, menuSubmitting, menuModalOpen, editingMenu, setMenuModalOpen, submitMenu, menuForm } = model;
  return (
    <>
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
    </>
  );
}
