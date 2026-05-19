import { type ReactNode } from 'react';
import { Alert, Button, Card, Col, Descriptions, Row, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import {
  formatProcurementPriceRange,
  procurement1688SearchKeyword,
  procurementDemandDisplayTitle,
  procurementRequirementText
} from './domain';
import type { ProcurementDemandItem, ProcurementSourcingProgress } from './types';

const { Text } = Typography;

type ProcurementSourcingEntryCardProps = {
  selectedProcurementItem?: ProcurementDemandItem;
  selectedProcurementSourcingProgress?: ProcurementSourcingProgress;
  onOpen1688Search: (item?: ProcurementDemandItem) => void;
  onCopy1688Keyword: (item?: ProcurementDemandItem) => void | Promise<void>;
  onOpenBackfillModal: (item?: ProcurementDemandItem) => void;
};

function ProcurementClampNote(props: { children?: ReactNode; title?: string; color?: string }) {
  const { children, title, color = '#475569' } = props;
  return (
    <div
      title={title}
      style={{
        margin: 0,
        color,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
      }}
    >
      {children}
    </div>
  );
}

export function ProcurementSourcingEntryCard({
  selectedProcurementItem,
  selectedProcurementSourcingProgress,
  onOpen1688Search,
  onCopy1688Keyword,
  onOpenBackfillModal
}: ProcurementSourcingEntryCardProps) {
  return (
    <Card
      size="small"
      variant="borderless"
      style={{
        background: 'linear-gradient(135deg, #fffaf0 0%, #fff7ed 100%)',
        border: '1px solid #fed7aa'
      }}
      title={
        <Space wrap size={[8, 8]}>
          <Text strong style={{ color: '#9a3412' }}>
            1688 找货入口
          </Text>
          <Tag color="orange" style={{ marginInlineEnd: 0 }}>
            运营流程
          </Tag>
        </Space>
      }
      extra={
        <Space wrap size={[8, 8]}>
          <Button type="primary" disabled={!selectedProcurementItem} onClick={() => onOpen1688Search(selectedProcurementItem)}>
            打开 1688 找货页
          </Button>
          <Button disabled={!selectedProcurementItem} onClick={() => void onCopy1688Keyword(selectedProcurementItem)}>
            复制搜索词
          </Button>
          <Button disabled={!selectedProcurementItem} onClick={() => onOpenBackfillModal(selectedProcurementItem)}>
            回填候选池
          </Button>
          {selectedProcurementItem?.sourceUrl ? (
            <Button
              type="link"
              style={{ paddingInline: 0 }}
              onClick={() => window.open(selectedProcurementItem.sourceUrl, '_blank', 'noopener,noreferrer')}
            >
              打开原商品页
            </Button>
          ) : null}
        </Space>
      }
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Text style={{ color: '#9a3412' }}>
          当前先按运营真实流程来：从采购单里直接打开 1688 搜索结果页，看真实商品、价格和供应商，不再要求手动粘贴 HTML 源码。
        </Text>

        <Alert
          type={selectedProcurementItem ? 'info' : 'warning'}
          showIcon
          message={selectedProcurementItem ? procurementDemandDisplayTitle(selectedProcurementItem) : '请先选择一个采购需求'}
          description={
            selectedProcurementItem
              ? '先打开 1688 搜索结果页，再看价格、起订量、发货地和商品详情。当前版本先用浏览器做人工判断，后续再接自动采集与候选回填。'
              : '左侧先选中一条采购需求，系统才知道该为哪一个商品打开 1688 找货页。'
          }
        />

        {selectedProcurementItem ? (
          <Space wrap size={[8, 8]}>
            <Tag color="success" style={{ marginInlineEnd: 0 }}>
              已选采购需求
            </Tag>
            <Tag color={selectedProcurementSourcingProgress?.searchOpenedAt ? 'processing' : 'default'} style={{ marginInlineEnd: 0 }}>
              {selectedProcurementSourcingProgress?.searchOpenedAt
                ? `已打开 1688 · ${dayjs(selectedProcurementSourcingProgress.searchOpenedAt).format('MM-DD HH:mm')}`
                : '待打开 1688'}
            </Tag>
            <Tag color={selectedProcurementSourcingProgress?.keywordCopiedAt ? 'processing' : 'default'} style={{ marginInlineEnd: 0 }}>
              {selectedProcurementSourcingProgress?.keywordCopiedAt
                ? `已复制搜索词 · ${dayjs(selectedProcurementSourcingProgress.keywordCopiedAt).format('MM-DD HH:mm')}`
                : '待复制搜索词'}
            </Tag>
            <Tag color={selectedProcurementSourcingProgress?.lastBackfillAt ? 'success' : 'default'} style={{ marginInlineEnd: 0 }}>
              {selectedProcurementSourcingProgress?.lastBackfillAt
                ? `已回填 ${selectedProcurementSourcingProgress.backfilledCount || 0} 条 · ${dayjs(selectedProcurementSourcingProgress.lastBackfillAt).format('MM-DD HH:mm')}`
                : '待回填候选'}
            </Tag>
          </Space>
        ) : null}

        {selectedProcurementItem ? (
          <Row gutter={[16, 16]}>
            <Col xs={24} xl={14}>
              <Descriptions
                size="small"
                column={1}
                items={[
                  {
                    key: 'keyword',
                    label: '搜索词',
                    children: procurement1688SearchKeyword(selectedProcurementItem)
                  },
                  {
                    key: 'price',
                    label: '目标价',
                    children: formatProcurementPriceRange(
                      selectedProcurementItem.targetPriceMin,
                      selectedProcurementItem.targetPriceMax
                    )
                  },
                  {
                    key: 'quantity',
                    label: '目标量',
                    children: `${selectedProcurementItem.targetQuantity || '-'} 件`
                  },
                  {
                    key: 'site',
                    label: '目标站点',
                    children: selectedProcurementItem.targetSite || '-'
                  },
                  {
                    key: 'requirement',
                    label: '采购要求',
                    children: (
                      <ProcurementClampNote title={procurementRequirementText(selectedProcurementItem.specialRequirement)}>
                        {procurementRequirementText(selectedProcurementItem.specialRequirement)}
                      </ProcurementClampNote>
                    )
                  }
                ]}
              />
            </Col>
            <Col xs={24} xl={10}>
              <div
                style={{
                  height: '100%',
                  padding: 14,
                  borderRadius: 10,
                  border: '1px solid #fed7aa',
                  background: '#fffaf0'
                }}
              >
                <Text strong style={{ display: 'block', color: '#9a3412', marginBottom: 10 }}>
                  当前操作建议
                </Text>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Text style={{ color: '#7c2d12' }}>1. 点“打开 1688 找货页”，直接查看真实搜索结果。</Text>
                  <Text style={{ color: '#7c2d12' }}>2. 先看价格带、起订量、供应商地区和商品外观是否接近。</Text>
                  <Text style={{ color: '#7c2d12' }}>3. 选中值得继续跟进的商品后，回到系统点“回填候选池”。</Text>
                  <Text style={{ color: '#7c2d12' }}>4. 回填后直接在候选池里继续比对、询价和筛选。</Text>
                </Space>
              </div>
            </Col>
          </Row>
        ) : null}

        {selectedProcurementItem ? (
          <Space wrap size={[8, 8]}>
            <Tag color="gold" style={{ marginInlineEnd: 0 }}>
              搜索词 {procurement1688SearchKeyword(selectedProcurementItem)}
            </Tag>
            <Tag color="geekblue" style={{ marginInlineEnd: 0 }}>
              目标价 {formatProcurementPriceRange(selectedProcurementItem.targetPriceMin, selectedProcurementItem.targetPriceMax)}
            </Tag>
            <Tag color="cyan" style={{ marginInlineEnd: 0 }}>
              目标量 {selectedProcurementItem.targetQuantity || '-'} 件
            </Tag>
            <Tag color="default" style={{ marginInlineEnd: 0 }}>
              站点 {selectedProcurementItem.targetSite || '-'}
            </Tag>
          </Space>
        ) : null}
      </Space>
    </Card>
  );
}
