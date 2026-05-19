import { Alert, Button, Card, Empty, Popover, Space, Spin, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchMasterDataOrgTree } from './api';
import type { MasterDataOrgNode } from './types';

const { Text } = Typography;

type State =
  | { status: 'loading' }
  | { status: 'success'; data: MasterDataOrgNode[] }
  | { status: 'error'; message: string };

type Props = {
  operatorUserId?: number;
  operatorRoleLevel?: number;
  refreshSignal?: number;
};

type OrgLaneNode = {
  node: MasterDataOrgNode;
  parentId?: number;
};

function roleColor(level?: number) {
  if (level === 0) return '#7c3aed';
  if (level === 1) return '#6d28d9';
  if (level === 2) return '#ea580c';
  return '#2563eb';
}

function roleTone(level?: number) {
  if (level === 0) return 'admin';
  if (level === 1) return 'boss';
  if (level === 2) return 'lead';
  return 'ops';
}

function splitStoreSummary(summary?: string) {
  if (!summary || summary === '未分配店铺') {
    return [];
  }
  return Array.from(new Set(summary
    .split('、')
    .map((item) => item.trim())
    .filter(Boolean)));
}

function StoreSummaryPreview({ summary }: { summary?: string }) {
  const stores = splitStoreSummary(summary);
  if (!stores.length) {
    return <Text className="nuono-org-store-empty">店铺:0</Text>;
  }

  const content = (
    <div className="nuono-org-store-popover">
      {stores.map((store) => (
        <div key={store} className="nuono-org-store-popover-item">{store}</div>
      ))}
    </div>
  );
  const summaryNode = (
    <div className="nuono-org-store-summary">
      <span className="nuono-org-store-trigger">店铺:{stores.length}</span>
    </div>
  );

  return (
    <Popover
      title="负责店铺"
      content={content}
      placement="top"
      trigger="hover"
      overlayClassName="nuono-org-store-popover-shell"
    >
      {summaryNode}
    </Popover>
  );
}

function countOrgMembers(nodes: MasterDataOrgNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countOrgMembers(node.children || []), 0);
}

function buildOrgLanes(nodes: MasterDataOrgNode[]) {
  const lanes: OrgLaneNode[][] = [];
  const visit = (node: MasterDataOrgNode, depth: number, parentId?: number) => {
    if (!lanes[depth]) {
      lanes[depth] = [];
    }
    lanes[depth].push({ node, parentId });
    (node.children || []).forEach((child) => visit(child, depth + 1, node.id));
  };
  nodes.forEach((node) => visit(node, 0));
  return lanes;
}

function orgLaneLabel(index: number) {
  if (index === 0) return '老板';
  if (index === 1) return '主管';
  if (index === 2) return '成员';
  return `第 ${index + 1} 层`;
}

function OrgNodeCard({ node }: { node: MasterDataOrgNode }) {
  return (
    <div
      data-testid="org-tree-node"
      className="nuono-org-node"
    >
      <div className={`nuono-org-node-card nuono-org-node-card-${roleTone(node.roleLevel)}`}>
        <div className="nuono-org-node-content">
          <div className="nuono-org-node-main-row">
            <Text strong className="nuono-org-node-name">
              {node.realName || node.accountNo}
            </Text>
            <span className="nuono-org-role-inline" style={{ color: roleColor(node.roleLevel) }}>
              {node.roleName || '未分配角色'}
            </span>
          </div>
          <StoreSummaryPreview summary={node.storeSummary} />
        </div>
      </div>
    </div>
  );
}

export function OrgTreeBoard({ operatorUserId, operatorRoleLevel, refreshSignal }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const lastRefreshSignalRef = useRef(refreshSignal);

  const loadOrgTree = useCallback(
    async (cancelledRef?: { cancelled: boolean }) => {
      setState({ status: 'loading' });
      try {
        const payload = await fetchMasterDataOrgTree({
          operatorUserId,
          operatorRoleLevel
        });
        if (!cancelledRef?.cancelled) {
          setState({ status: 'success', data: payload });
        }
      } catch (error) {
        if (!cancelledRef?.cancelled) {
          setState({ status: 'error', message: error instanceof Error ? error.message : '组织架构暂时不可用' });
        }
      }
    },
    [operatorRoleLevel, operatorUserId]
  );

  useEffect(() => {
    const cancelledRef = { cancelled: false };
    void loadOrgTree(cancelledRef);
    return () => {
      cancelledRef.cancelled = true;
    };
  }, [loadOrgTree]);

  useEffect(() => {
    if (refreshSignal == null || refreshSignal === lastRefreshSignalRef.current) {
      return;
    }
    lastRefreshSignalRef.current = refreshSignal;
    void loadOrgTree();
  }, [loadOrgTree, refreshSignal]);

  const totalMembers = useMemo(
    () => state.status === 'success' ? countOrgMembers(state.data) : 0,
    [state]
  );
  const orgLanes = useMemo(
    () => state.status === 'success' ? buildOrgLanes(state.data) : [],
    [state]
  );

  return (
    <Card data-testid="org-tree-board" bordered={false} className="nuono-org-tree-board">
      <div className="nuono-org-board-toolbar">
        <div className="nuono-org-board-summary">
          <Text strong>组织架构</Text>
          {state.status === 'success' ? <Text type="secondary">共 {totalMembers} 个账号</Text> : null}
        </div>
        <Button
          data-testid="org-tree-refresh-button"
          icon={<ReloadOutlined />}
          loading={state.status === 'loading'}
          onClick={() => void loadOrgTree()}
        >
          刷新
        </Button>
      </div>
      {state.status === 'loading' ? (
        <Space size={12}>
          <Spin size="small" />
          <Text>正在读取组织架构...</Text>
        </Space>
      ) : null}

      {state.status === 'error' ? (
        <Alert type="warning" showIcon message="组织架构暂时不可用" description={state.message} />
      ) : null}

      {state.status === 'success' ? (
        state.data.length ? (
          <div className="nuono-org-tree-scroll">
            {orgLanes.map((lane, index) => (
              <div className="nuono-org-lane" key={index}>
                <div className="nuono-org-lane-label">{orgLaneLabel(index)}</div>
                <div className="nuono-org-lane-track">
                  {lane.map(({ node, parentId }) => (
                    <OrgNodeCard key={`${parentId ?? 'root'}-${node.id}`} node={node} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty data-testid="org-tree-empty" description="当前还没有组织架构样本" />
        )
      ) : null}
    </Card>
  );
}
