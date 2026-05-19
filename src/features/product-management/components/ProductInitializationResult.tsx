import { Alert, Col, List, Row, Space, Spin, Table, Tag, Typography } from 'antd';
import type { ProductManagementWorkspace } from '../workspaceTypes';

const { Text } = Typography;

type ProductInitializationResultProps = {
  workspace: ProductManagementWorkspace;
};

export function ProductInitializationResult({ workspace }: ProductInitializationResultProps) {
  const { storeInitializationState, initializationStatusMeta, storeInitializationStepColor } = workspace;

  if (storeInitializationState.status === 'loading') {
    return (
      <Space size={12}>
        <Spin size="small" />
        <Text>正在读取新店初始化状态...</Text>
      </Space>
    );
  }

  if (storeInitializationState.status === 'error') {
    return (
      <Alert
        type="warning"
        showIcon
        message="新店初始化状态暂时不可用"
        description="当前没有取回初始化状态，请稍后刷新或检查后端接入服务。"
      />
    );
  }

  if (storeInitializationState.status !== 'success') {
    return null;
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type={storeInitializationState.data.status === 'FAILED' ? 'warning' : 'success'}
        showIcon
        message={storeInitializationState.data.phaseLabel ? `当前阶段：${storeInitializationState.data.phaseLabel}` : '当前还没开始初始化'}
        description={storeInitializationState.data.message ?? '等待启动初始化任务'}
      />

      {storeInitializationState.data.missingCoreTables.length ? (
        <Space wrap size={[8, 8]}>
          {storeInitializationState.data.missingCoreTables.map((table) => (
            <Tag key={table} color="warning" style={{ marginInlineEnd: 0 }}>
              {table}
            </Tag>
          ))}
        </Space>
      ) : null}

      <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 8, background: '#ffffff' }}>
        <Space wrap size={[12, 12]} style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
          <Space wrap size={[8, 8]}>
            <Tag color={initializationStatusMeta.color} style={{ marginInlineEnd: 0 }}>
              {initializationStatusMeta.label}
            </Tag>
            {storeInitializationState.data.lastInitializedAt ? (
              <Text style={{ color: '#475569' }}>最近初始化 {storeInitializationState.data.lastInitializedAt}</Text>
            ) : null}
            {storeInitializationState.data.startedAt ? (
              <Text style={{ color: '#64748b' }}>开始于 {storeInitializationState.data.startedAt}</Text>
            ) : null}
          </Space>
          <Text style={{ color: '#0f172a', fontWeight: 600 }}>{storeInitializationState.data.progressPercent ?? 0}%</Text>
        </Space>

        <div style={{ height: 8, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ width: `${storeInitializationState.data.progressPercent ?? 0}%`, height: '100%', background: '#0f766e' }} />
        </div>

        <List
          size="small"
          dataSource={storeInitializationState.data.steps}
          renderItem={(item) => (
            <List.Item style={{ paddingInline: 0 }}>
              <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Space wrap size={[8, 8]}>
                  <Tag color={storeInitializationStepColor(item.status)} style={{ marginInlineEnd: 0 }}>
                    {item.label}
                  </Tag>
                  <Text style={{ color: '#475569' }}>
                    {item.status === 'completed' ? '已完成' : item.status === 'running' ? '进行中' : item.status === 'failed' ? '失败' : '待执行'}
                  </Text>
                </Space>
                {item.message ? <Text style={{ color: '#64748b', maxWidth: 560 }}>{item.message}</Text> : null}
              </Space>
            </List.Item>
          )}
        />
      </div>

      {(storeInitializationState.data.uniqueProductCount || storeInitializationState.data.siteOfferCount || storeInitializationState.data.siteCount) ? (
        <Row gutter={[12, 12]}>
          {[
            ['共享商品', storeInitializationState.data.uniqueProductCount ?? 0],
            ['经营站点', storeInitializationState.data.siteOfferCount ?? 0],
            ['识别站点', storeInitializationState.data.siteCount ?? 0]
          ].map(([label, value]) => (
            <Col xs={12} md={8} key={label}>
              <div style={{ padding: 14, borderRadius: 8, border: '1px solid #dbe4ea', background: '#ffffff' }}>
                <div style={{ color: '#64748b', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#0f172a' }}>{value}</div>
              </div>
            </Col>
          ))}
        </Row>
      ) : null}

      {storeInitializationState.data.siteSummaries.length ? (
        <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 8, background: '#ffffff' }}>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>
            站点结果
          </Text>
          <Table
            dataSource={storeInitializationState.data.siteSummaries}
            rowKey={(record) => `${record.storeCode}-${record.site}`}
            size="small"
            pagination={false}
            columns={[
              {
                title: '站点',
                dataIndex: 'site',
                key: 'site',
                width: 160,
                render: (value: string | undefined, record) => (
                  <Space wrap size={[6, 6]}>
                    <Tag color="processing" style={{ marginInlineEnd: 0 }}>
                      {value || '-'}
                    </Tag>
                    <Text>{record.storeCode}</Text>
                  </Space>
                )
              },
              { title: '状态', dataIndex: 'liveStatus', key: 'liveStatus', width: 160, render: (value: string | undefined) => value || '-' },
              { title: '商品数', dataIndex: 'productCount', key: 'productCount', width: 120, render: (value: number | undefined) => value ?? '-' }
            ]}
          />
        </div>
      ) : null}

      {storeInitializationState.data.warnings.length ? (
        <Alert
          type="warning"
          showIcon
          message="初始化提醒"
          description={
            <List
              size="small"
              dataSource={storeInitializationState.data.warnings}
              renderItem={(item) => (
                <List.Item style={{ paddingInline: 0 }}>
                  <Text style={{ color: '#334155' }}>{item}</Text>
                </List.Item>
              )}
            />
          }
        />
      ) : null}
    </Space>
  );
}
