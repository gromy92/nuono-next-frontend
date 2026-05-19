import { Col, Progress, Row, Space, Tag, Typography } from 'antd';
import {
  formatProcurementPriceRange,
  procurementDemandDisplayTitle,
  procurementImageModeMeta,
  procurementRequirementText,
  procurementSearchModeLabel,
  procurementTaskStatusMeta
} from './domain';
import { ProcurementGeneratedThumb } from './preview';
import type { ProcurementDemandItem, ProcurementPreviewFrame } from './types';

const { Paragraph, Text } = Typography;

type ProcurementSelectedDemandSummaryProps = {
  item: ProcurementDemandItem;
  sourceMainFrame?: ProcurementPreviewFrame;
};

export function ProcurementSelectedDemandSummary({ item, sourceMainFrame }: ProcurementSelectedDemandSummaryProps) {
  return (
    <>
      <div
        style={{
          padding: 16,
          borderRadius: 10,
          background: '#f8fafc',
          border: '1px solid #e2e8f0'
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 8 }}>
              {procurementDemandDisplayTitle(item)}
            </Text>
            <Space wrap size={[8, 8]} style={{ marginBottom: 8 }}>
              <Tag color="geekblue" style={{ marginInlineEnd: 0 }}>
                目标价 {formatProcurementPriceRange(item.targetPriceMin, item.targetPriceMax)}
              </Tag>
              <Tag color="cyan" style={{ marginInlineEnd: 0 }}>
                目标量 {item.targetQuantity || '-'}
              </Tag>
              <Tag color="default" style={{ marginInlineEnd: 0 }}>
                站点 {item.targetSite || '-'}
              </Tag>
              {sourceMainFrame ? (
                <Tag color={procurementImageModeMeta(sourceMainFrame.imageMode).color} style={{ marginInlineEnd: 0 }}>
                  {procurementImageModeMeta(sourceMainFrame.imageMode).label}
                </Tag>
              ) : null}
            </Space>
            <Paragraph style={{ margin: 0, color: '#475569' }}>
              {procurementRequirementText(item.specialRequirement)}
            </Paragraph>
          </Col>

          {sourceMainFrame ? (
            <Col>
              {sourceMainFrame.imageMode === 'real' && sourceMainFrame.imageUrl ? (
                <div
                  style={{
                    width: 112,
                    height: 112,
                    overflow: 'hidden',
                    borderRadius: 14,
                    border: '1px solid #dbe4ea',
                    background: '#ffffff'
                  }}
                >
                  <img
                    src={sourceMainFrame.imageUrl}
                    alt={procurementDemandDisplayTitle(item)}
                    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <ProcurementGeneratedThumb frame={sourceMainFrame} sectionLabel="原商品" width={112} height={112} />
              )}
            </Col>
          ) : null}
        </Row>
      </div>

      {item.task ? (
        <div
          style={{
            padding: 16,
            borderRadius: 10,
            background: '#ffffff',
            border: '1px solid #e2e8f0'
          }}
        >
          <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: 'space-between', marginBottom: 10 }}>
            <Space wrap size={[8, 8]}>
              <Text strong>异步任务状态</Text>
              <Tag color={procurementTaskStatusMeta(item.task.status).color} style={{ marginInlineEnd: 0 }}>
                {procurementTaskStatusMeta(item.task.status).label}
              </Tag>
              <Tag color="default" style={{ marginInlineEnd: 0 }}>
                {procurementSearchModeLabel(item.task.searchMode)}
              </Tag>
              {item.task.searchMode === 'SEARCH_PAGE_HTML' ? (
                <Tag color="default" style={{ marginInlineEnd: 0 }}>
                  页面导入候选 {item.task.resultCount || 0} 条
                </Tag>
              ) : (
                <Tag color="default" style={{ marginInlineEnd: 0 }}>
                  搜索图片 {item.task.selectedImageCount || 0} 张
                </Tag>
              )}
            </Space>
            <Text style={{ color: '#64748b' }}>
              回收候选 {item.task.resultCount || 0} 条 / 高推荐 {item.task.recommendedCount || 0} 条
            </Text>
          </Space>
          <Progress percent={item.task.progressPercent || 0} strokeColor="#0f766e" size="small" />
          <Paragraph style={{ margin: '10px 0 0', color: '#475569' }}>
            {item.task.message || '当前任务正在处理中。'}
          </Paragraph>
        </div>
      ) : null}
    </>
  );
}
