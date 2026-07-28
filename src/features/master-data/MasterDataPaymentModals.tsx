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

export function MasterDataPaymentModals({ model }: { model: any }) {
  const { mode, loading, panelStyle, listRefreshing, refreshCurrentList, isMerchantAccountView, openUserModal, openRoleModal, openMenuModal, userKeyword, setUserKeyword, userTypeFilter, setUserTypeFilter, userStatusFilter, setUserStatusFilter, filteredUserRows, userManageColumns, teamManageColumns, expandedMerchantId, renderExpandedMerchantStores, roleAssignmentStats, roleAssignmentRows, roleAssignColumns, roles, roleColumns, filteredMenus, menuColumns, menuKeyword, setMenuKeyword, detailOpen, setDetailOpen, detailState, openQuotaModal, confirmSubmitting, confirmDialog, confirmOkDanger, confirmOkDisabled, setConfirmDialog, submitConfirmDialog, userSubmitting, userModalOpen, userModalKind, editingUser, userForm, submitUser, setUserSubmitError, messageApi, userSubmitError, assignableRoleOptions, storeTransferData, watchedRoleAllStores, allOperatorStoreGroupKeys, watchedStoreGroupKeys, setUserModalOpen, storeAssignmentSubmitting, storeAssignmentOpen, storeAssignmentUser, storeAssignmentLoading, setStoreAssignmentOpen, setStoreAssignmentCurrentGroups, setStoreAssignmentError, submitStoreAssignment, storeAssignmentError, storeAssignmentTransferData, storeAssignmentGroupKeys, setStoreAssignmentGroupKeys, quotaSubmitting, quotaModalOpen, quotaTargetStore, quotaTargetUser, setQuotaModalOpen, setQuotaTargetStore, submitQuota, quotaForm, paymentModalOpen, paymentTargetUser, setPaymentModalOpen, setPaymentRecords, paymentRecords, paymentModalLoading, setPaymentAddModalOpen, paymentAddModalOpen, paymentSubmitting, paymentForm, submitPayment, roleSubmitting, roleModalOpen, editingRole, setRoleModalOpen, submitRole, roleForm, roleTreeOptions, menuTreeData, menuSubmitting, menuModalOpen, editingMenu, setMenuModalOpen, submitMenu, menuForm } = model;
  return (
    <>
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
    </>
  );
}
