import { Alert, Button, Empty, Input, Select, Space, Table } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { FormToolbarLayout } from '../../shared/ui/FormToolbarLayout';
import type { MasterDataBoardModel } from './MasterDataBoard';

export function MasterDataUserModes({ model }: { model: MasterDataBoardModel['userModes'] }) {
  const {
    mode,
    listRefreshing,
    refreshCurrentList,
    isMerchantAccountView,
    openUserModal,
    userKeyword,
    setUserKeyword,
    userTypeFilter,
    setUserTypeFilter,
    userStatusFilter,
    setUserStatusFilter,
    filteredUserRows,
    userManageColumns,
    teamManageColumns,
    expandedMerchantId,
    renderExpandedMerchantStores,
    roleAssignmentStats,
    roleAssignmentRows,
    roleAssignColumns
  } = model;
  return (
    <>
      {mode === 'user-account' ? (
        <div className="nuono-legacy-user-manage">
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {!isMerchantAccountView ? (
              <Alert
                type="info"
                showIcon
                message="账号管理这里负责团队成员维护，角色调整和店铺重分配继续在角色分配页完成。"
                style={{ borderRadius: 6, background: '#f8fafc', borderColor: '#dbe4ea' }}
              />
            ) : null}
            <FormToolbarLayout
              className="nuono-legacy-user-toolbar"
              actions={
                <Space size={8}>
                  <Button
                    data-testid="user-list-refresh-button"
                    icon={<ReloadOutlined />}
                    loading={listRefreshing}
                    onClick={() => void refreshCurrentList()}
                  >
                    刷新
                  </Button>
                  <Button
                    data-testid="user-create-button"
                    type="primary"
                    onClick={() => openUserModal(isMerchantAccountView ? 'merchant' : 'member')}
                  >
                    {isMerchantAccountView ? '+ 新建商家' : '+ 添加账号'}
                  </Button>
                </Space>
              }
            >
                <Input.Search
                  data-testid="user-search-input"
                  allowClear
                  placeholder={isMerchantAccountView ? '搜索姓名/手机号/账号' : '搜索账号/姓名/手机号'}
                  style={{ width: 260 }}
                  value={userKeyword}
                  onChange={(event) => setUserKeyword(event.target.value)}
                />
                {isMerchantAccountView ? (
                  <Select
                    data-testid="user-type-filter"
                    allowClear
                    placeholder="类型"
                    style={{ width: 100 }}
                    options={[
                      { label: '内部', value: 'internal' },
                      { label: '外部', value: 'external' }
                    ]}
                    value={userTypeFilter}
                    onChange={(value) => setUserTypeFilter(value)}
                  />
                ) : null}
                <Select
                  data-testid="user-status-filter"
                  allowClear
                  placeholder="状态"
                  style={{ width: 100 }}
                  options={isMerchantAccountView
                    ? [
                        { label: '正常', value: 'normal' },
                        { label: '到期', value: 'expired' }
                      ]
                    : [
                        { label: '正常', value: 'normal' },
                        { label: '禁用', value: 'disabled' }
                      ]}
                  value={userStatusFilter}
                  onChange={(value) => setUserStatusFilter(value)}
                />
            </FormToolbarLayout>

            <Table
              data-testid="user-table"
              className="nuono-legacy-account-table nuono-fit-table nuono-responsive-record-table"
              tableLayout="fixed"
              size="small"
              rowKey="id"
              dataSource={filteredUserRows}
              columns={isMerchantAccountView ? userManageColumns : teamManageColumns}
              scroll={{ x: 1080 }}
              pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
              expandable={
                isMerchantAccountView
                  ? {
                      expandedRowKeys: expandedMerchantId ? [expandedMerchantId] : [],
                      expandedRowRender: renderExpandedMerchantStores,
                      showExpandColumn: false
                    }
                  : undefined
              }
              locale={{ emptyText: <Empty description="当前没有符合条件的用户" /> }}
            />
          </Space>
        </div>
      ) : null}

      {mode === 'user-role' ? (
        <div className="nuono-role-assignment-board">
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div className="nuono-store-management-toolbar nuono-role-assignment-toolbar">
              <Alert
                className="nuono-store-management-hint nuono-role-assignment-hint"
                type="info"
                showIcon
                message="角色或店铺变更后需重新登录生效"
              />

              <div className="nuono-role-assignment-filters">
                <Input.Search
                  data-testid="role-user-search-input"
                  allowClear
                  placeholder="搜索账号/姓名/手机号"
                  style={{ width: 220 }}
                  value={userKeyword}
                  onChange={(event) => setUserKeyword(event.target.value)}
                />
                <Select
                  data-testid="role-user-status-filter"
                  allowClear
                  placeholder="状态"
                  style={{ width: 96 }}
                  options={[
                    { label: '启用', value: 'normal' },
                    { label: '禁用', value: 'disabled' }
                  ]}
                  value={userStatusFilter}
                  onChange={(value) => setUserStatusFilter(value)}
                />
              </div>

              <div className="nuono-masterdata-stat-strip nuono-store-management-stats nuono-role-assignment-stats" data-testid="role-assignment-stats">
                {roleAssignmentStats.map((item) => (
                  <div key={item.label} className="nuono-masterdata-stat-item nuono-store-management-stat-item nuono-role-assignment-stat-item">
                    <span className="nuono-masterdata-stat-label">{item.label}</span>
                    <span className="nuono-masterdata-stat-value">{item.value}</span>
                  </div>
                ))}
              </div>

              <Space className="nuono-store-management-actions nuono-role-assignment-actions" wrap>
                <Button
                  data-testid="role-user-refresh-button"
                  icon={<ReloadOutlined />}
                  loading={listRefreshing}
                  onClick={() => void refreshCurrentList()}
                >
                  刷新
                </Button>
                <Button data-testid="role-user-create-button" type="primary" onClick={() => openUserModal('member')}>
                  + 添加账号
                </Button>
              </Space>
            </div>

            <Table
              data-testid="role-assignment-table"
              className="nuono-role-assignment-table nuono-responsive-record-table"
              tableLayout="fixed"
              size="middle"
              rowKey="id"
              dataSource={roleAssignmentRows}
              columns={roleAssignColumns}
              scroll={{ x: 1360 }}
              pagination={{ pageSize: 20, showSizeChanger: false }}
              locale={{ emptyText: <Empty description="当前还没有可分配角色的用户" /> }}
            />
          </Space>
        </div>
      ) : null}
    </>
  );
}
