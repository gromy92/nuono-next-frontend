import { Alert, Button, Card, Empty, Space, Spin, Table, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { fetchMasterDataMenus, fetchMasterDataRoles } from './api';
import type { MasterDataMenu, MasterDataRole } from './types';

const { Text } = Typography;

type State =
  | { status: 'loading' }
  | { status: 'success'; roles: MasterDataRole[]; menus: MasterDataMenu[] }
  | { status: 'error'; message: string };

type Props = {
  operatorRoleLevel?: number;
  refreshSignal?: number;
};

export function PermissionOverviewBoard({ operatorRoleLevel, refreshSignal }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const lastRefreshSignalRef = useRef(refreshSignal);

  const loadPermissionOverview = useCallback(
    async (cancelledRef?: { cancelled: boolean }) => {
      setState({ status: 'loading' });
      try {
        const [roles, menus] = await Promise.all([fetchMasterDataRoles(), fetchMasterDataMenus()]);
        if (!cancelledRef?.cancelled) {
          setState({ status: 'success', roles, menus });
        }
      } catch (error) {
        if (!cancelledRef?.cancelled) {
          setState({ status: 'error', message: error instanceof Error ? error.message : '权限总览暂时不可用' });
        }
      }
    },
    []
  );

  useEffect(() => {
    const cancelledRef = { cancelled: false };
    void loadPermissionOverview(cancelledRef);
    return () => {
      cancelledRef.cancelled = true;
    };
  }, [loadPermissionOverview]);

  useEffect(() => {
    if (refreshSignal == null || refreshSignal === lastRefreshSignalRef.current) {
      return;
    }
    lastRefreshSignalRef.current = refreshSignal;
    void loadPermissionOverview();
  }, [loadPermissionOverview, refreshSignal]);

  const visibleRoles = useMemo(() => {
    if (state.status !== 'success') {
      return [] as MasterDataRole[];
    }
    if (operatorRoleLevel == null) {
      return state.roles;
    }
    return state.roles.filter((role) => role.level == null || role.level >= operatorRoleLevel);
  }, [operatorRoleLevel, state]);

  const visibleMenus = useMemo(() => {
    if (state.status !== 'success') {
      return [] as MasterDataMenu[];
    }
    return state.menus.filter((menu) => visibleRoles.some((role) => role.menuIds.includes(menu.id)));
  }, [state, visibleRoles]);

  const columns = useMemo<ColumnsType<MasterDataRole>>(() => {
    const base: ColumnsType<MasterDataRole> = [
      {
        title: '角色',
        key: 'role',
        dataIndex: 'name',
        fixed: 'left',
        width: 160,
        render: (value: string, record) => (
          <Space direction="vertical" size={2}>
            <Text strong>{value}</Text>
            <Tag color="default" style={{ marginInlineEnd: 0 }}>
              {record.code}
            </Tag>
          </Space>
        )
      }
    ];

    return [
      ...base,
      ...visibleMenus.map((menu) => ({
        title: menu.name,
        key: `menu-${menu.id}`,
        width: 88,
        align: 'center' as const,
        render: (_: unknown, record: MasterDataRole) =>
          record.menuIds.includes(menu.id) ? (
            <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
          ) : (
            <span style={{ color: '#cbd5e1' }}>-</span>
          )
      }))
    ];
  }, [visibleMenus]);
  const tableScrollX = useMemo(() => Math.max(960, 160 + visibleMenus.length * 88), [visibleMenus.length]);

  return (
    <Card
      data-testid="permission-overview-board"
      bordered={false}
      style={{ border: '1px solid #ece7ff', borderRadius: 8, boxShadow: 'none', maxWidth: '100%', overflow: 'hidden' }}
    >
      <div className="nuono-board-action-row">
        <Button
          data-testid="permission-overview-refresh-button"
          icon={<ReloadOutlined />}
          loading={state.status === 'loading'}
          onClick={() => void loadPermissionOverview()}
        >
          刷新
        </Button>
      </div>
      {state.status === 'loading' ? (
        <Space size={12}>
          <Spin size="small" />
          <Text>正在读取权限总览...</Text>
        </Space>
      ) : null}

      {state.status === 'error' ? (
        <Alert type="warning" showIcon message="权限总览暂时不可用" description={state.message} />
      ) : null}

      {state.status === 'success' ? (
        visibleRoles.length && visibleMenus.length ? (
          <Table
            data-testid="permission-overview-table"
            className="nuono-fit-table"
            size="small"
            rowKey="id"
            columns={columns}
            dataSource={visibleRoles}
            pagination={false}
            scroll={{ x: tableScrollX, y: 'calc(100vh - 360px)' }}
          />
        ) : (
          <Empty data-testid="permission-overview-empty" description="当前没有可展示的权限矩阵" />
        )
      ) : null}
    </Card>
  );
}
