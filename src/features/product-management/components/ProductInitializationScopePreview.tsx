import { Col, List, Row, Space, Tag, Typography } from 'antd';
import type { ProductManagementWorkspace } from '../workspaceTypes';

const { Paragraph, Text } = Typography;

type ProductInitializationScopePreviewProps = {
  workspace: ProductManagementWorkspace;
};

export function ProductInitializationScopePreview({ workspace }: ProductInitializationScopePreviewProps) {
  const { selectedInitializationStore, selectedInitializationStoreCode } = workspace;

  if (!selectedInitializationStore) {
    return null;
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={9}>
        <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 8, background: '#ffffff', height: '100%' }}>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>
            本次会拉什么
          </Text>
          <List
            size="small"
            dataSource={[
              `项目 ${selectedInitializationStore.projectName || selectedInitializationStore.projectCode || selectedInitializationStore.storeCode}`,
              `站点 ${selectedInitializationStore.siteCount ?? selectedInitializationStore.siteStores.length} 个`,
              '商品清单索引',
              '商品主档基线（标题 / 图片 / 品牌 / 类目）',
              '站点价格与经营（价格 / 库存 / 启用状态）'
            ]}
            renderItem={(item) => (
              <List.Item style={{ paddingInline: 0 }}>
                <Text style={{ color: '#334155' }}>{item}</Text>
              </List.Item>
            )}
          />
        </div>
      </Col>
      <Col xs={24} xl={15}>
        <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 8, background: '#ffffff', height: '100%' }}>
          <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text strong>当前店铺范围</Text>
            <Text style={{ color: '#64748b' }}>
              参考站点 {selectedInitializationStoreCode || selectedInitializationStore.storeCode} · 共{' '}
              {selectedInitializationStore.siteCount ?? selectedInitializationStore.siteStores.length} 个站点
            </Text>
          </Space>
          <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
            {selectedInitializationStore.siteStores.map((siteStore) => (
              <Tag key={siteStore.storeCode} color={siteStore.isAuthorized ? 'success' : 'default'} style={{ marginInlineEnd: 0 }}>
                {siteStore.site || '未标注'} · {siteStore.storeCode}
              </Tag>
            ))}
          </Space>
          <Paragraph style={{ margin: 0, color: '#475569' }}>
            初始化完成后，这家店会直接进入商品管理，不再停在空壳页面里。
          </Paragraph>
        </div>
      </Col>
    </Row>
  );
}
