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

export function MasterDataStoreQuotaModals({ model }: { model: any }) {
  const { mode, loading, panelStyle, listRefreshing, refreshCurrentList, isMerchantAccountView, openUserModal, openRoleModal, openMenuModal, userKeyword, setUserKeyword, userTypeFilter, setUserTypeFilter, userStatusFilter, setUserStatusFilter, filteredUserRows, userManageColumns, teamManageColumns, expandedMerchantId, renderExpandedMerchantStores, roleAssignmentStats, roleAssignmentRows, roleAssignColumns, roles, roleColumns, filteredMenus, menuColumns, menuKeyword, setMenuKeyword, detailOpen, setDetailOpen, detailState, openQuotaModal, confirmSubmitting, confirmDialog, confirmOkDanger, confirmOkDisabled, setConfirmDialog, submitConfirmDialog, userSubmitting, userModalOpen, userModalKind, editingUser, userForm, submitUser, setUserSubmitError, messageApi, userSubmitError, assignableRoleOptions, storeTransferData, watchedRoleAllStores, allOperatorStoreGroupKeys, watchedStoreGroupKeys, setUserModalOpen, storeAssignmentSubmitting, storeAssignmentOpen, storeAssignmentUser, storeAssignmentLoading, setStoreAssignmentOpen, setStoreAssignmentCurrentGroups, setStoreAssignmentError, submitStoreAssignment, storeAssignmentError, storeAssignmentTransferData, storeAssignmentGroupKeys, setStoreAssignmentGroupKeys, quotaSubmitting, quotaModalOpen, quotaTargetStore, quotaTargetUser, setQuotaModalOpen, setQuotaTargetStore, submitQuota, quotaForm, paymentModalOpen, paymentTargetUser, setPaymentModalOpen, setPaymentRecords, paymentRecords, paymentModalLoading, setPaymentAddModalOpen, paymentAddModalOpen, paymentSubmitting, paymentForm, submitPayment, roleSubmitting, roleModalOpen, editingRole, setRoleModalOpen, submitRole, roleForm, roleTreeOptions, menuTreeData, menuSubmitting, menuModalOpen, editingMenu, setMenuModalOpen, submitMenu, menuForm } = model;
  return (
    <>
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
    </>
  );
}
