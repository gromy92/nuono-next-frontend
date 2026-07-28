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

export function MasterDataUserDetailModal({ model }: { model: any }) {
  const { mode, loading, panelStyle, listRefreshing, refreshCurrentList, isMerchantAccountView, openUserModal, openRoleModal, openMenuModal, userKeyword, setUserKeyword, userTypeFilter, setUserTypeFilter, userStatusFilter, setUserStatusFilter, filteredUserRows, userManageColumns, teamManageColumns, expandedMerchantId, renderExpandedMerchantStores, roleAssignmentStats, roleAssignmentRows, roleAssignColumns, roles, roleColumns, filteredMenus, menuColumns, menuKeyword, setMenuKeyword, detailOpen, setDetailOpen, detailState, openQuotaModal, confirmSubmitting, confirmDialog, confirmOkDanger, confirmOkDisabled, setConfirmDialog, submitConfirmDialog, userSubmitting, userModalOpen, userModalKind, editingUser, userForm, submitUser, setUserSubmitError, messageApi, userSubmitError, assignableRoleOptions, storeTransferData, watchedRoleAllStores, allOperatorStoreGroupKeys, watchedStoreGroupKeys, setUserModalOpen, storeAssignmentSubmitting, storeAssignmentOpen, storeAssignmentUser, storeAssignmentLoading, setStoreAssignmentOpen, setStoreAssignmentCurrentGroups, setStoreAssignmentError, submitStoreAssignment, storeAssignmentError, storeAssignmentTransferData, storeAssignmentGroupKeys, setStoreAssignmentGroupKeys, quotaSubmitting, quotaModalOpen, quotaTargetStore, quotaTargetUser, setQuotaModalOpen, setQuotaTargetStore, submitQuota, quotaForm, paymentModalOpen, paymentTargetUser, setPaymentModalOpen, setPaymentRecords, paymentRecords, paymentModalLoading, setPaymentAddModalOpen, paymentAddModalOpen, paymentSubmitting, paymentForm, submitPayment, roleSubmitting, roleModalOpen, editingRole, setRoleModalOpen, submitRole, roleForm, roleTreeOptions, menuTreeData, menuSubmitting, menuModalOpen, editingMenu, setMenuModalOpen, submitMenu, menuForm } = model;
  return (
    <>
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
    </>
  );
}
