import { Alert, Button, Card, Col, Descriptions, Empty, Row, Space, Spin, Tag, Typography } from 'antd';
import {
  procurementAutoInquiryBusinessAction,
  procurementAutoInquiryBusinessMeta,
  procurementCandidateInquiryPathMeta,
  procurementPageBusinessDescription
} from './autoInquiry';
import {
  procurementCandidateDisplayTitle,
  procurementCandidateLevelMeta,
  procurementCandidateMoqText,
  procurementCandidatePriceText,
  procurementDemandDisplayTitle,
  procurementDisplayText,
  procurementItemStatusMeta
} from './domain';
import type { ProcurementAutoInquiryWorkbenchState, ProcurementCandidate, ProcurementDemandItem, ProcurementState } from './types';

const { Text } = Typography;

type ProcurementAcceptanceBoardProps = {
  procurementState: ProcurementState;
  selectedProcurementItem?: ProcurementDemandItem;
  filteredProcurementCandidates: ProcurementCandidate[];
  comparingProcurementCandidate?: ProcurementCandidate;
  procurementCandidatePathMetaMap: Record<number, ReturnType<typeof procurementCandidateInquiryPathMeta>>;
  currentProcurementAutoInquiryBusinessState?: ProcurementAutoInquiryWorkbenchState;
  currentProcurementAutoInquiryBusinessAction: ReturnType<typeof procurementAutoInquiryBusinessAction>;
  currentProcurementAutoInquiryBusinessMeta: ReturnType<typeof procurementAutoInquiryBusinessMeta>;
  nextProcurementAutoInquiryCandidate?: ProcurementCandidate;
  onSelectDemandItem: (demandItemId: number) => void;
  onSelectCandidate: (candidateId: number) => void;
  onStartCandidateAutoInquiry: (demandItem?: ProcurementDemandItem, candidate?: ProcurementCandidate) => void | Promise<void>;
  onLoadCandidateAutoInquiry: (demandItem?: ProcurementDemandItem, candidate?: ProcurementCandidate) => void | Promise<void>;
};

export function ProcurementAcceptanceBoard({
  procurementState,
  selectedProcurementItem,
  filteredProcurementCandidates,
  comparingProcurementCandidate,
  procurementCandidatePathMetaMap,
  currentProcurementAutoInquiryBusinessState,
  currentProcurementAutoInquiryBusinessAction,
  currentProcurementAutoInquiryBusinessMeta,
  nextProcurementAutoInquiryCandidate,
  onSelectDemandItem,
  onSelectCandidate,
  onStartCandidateAutoInquiry,
  onLoadCandidateAutoInquiry
}: ProcurementAcceptanceBoardProps) {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card variant="borderless" style={{ border: '1px solid #dbe4ea' }}>
        {procurementState.status === 'loading' ? (
          <Space size={12}>
            <Spin size="small" />
            <Text>正在读取采购需求与候选结果...</Text>
          </Space>
        ) : null}

        {procurementState.status === 'error' ? (
          <Alert type="warning" showIcon message="采购候选池暂时不可用" description={procurementState.message} />
        ) : null}

        {procurementState.status === 'success' ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              type={procurementState.data.ready ? 'info' : 'warning'}
              showIcon
              message={procurementState.data.order?.title || '采购样本已接入'}
              description={procurementState.data.ready
                ? procurementPageBusinessDescription(procurementState.data.message)
                : procurementState.data.message || '当前采购样本还没完全就绪。'}
            />

            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>采购需求</div>
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                {procurementState.data.demandItems.map((item) => {
                  const selected = selectedProcurementItem?.id === item.id;
                  const itemStatusMeta = procurementItemStatusMeta(item.status);
                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        border: selected ? '1px solid #0f766e' : '1px solid #dbe4ea',
                        background: selected ? '#f0fdf4' : '#ffffff'
                      }}
                    >
                      <Space size={[8, 8]} wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ color: '#0f172a', fontWeight: 600, marginBottom: 6 }}>
                            {procurementDemandDisplayTitle(item)}
                          </div>
                          <div style={{ color: '#475569', fontSize: 13 }}>
                            目标价 {item.targetPriceMin?.toFixed(2)} - {item.targetPriceMax?.toFixed(2)} · 目标量 {item.targetQuantity} · 站点 {item.targetSite || '-'}
                          </div>
                        </div>
                        <Space size={[8, 8]} wrap>
                          <Tag color={itemStatusMeta.color} style={{ marginInlineEnd: 0 }}>
                            {itemStatusMeta.label}
                          </Tag>
                          <Button
                            type={selected ? 'primary' : 'default'}
                            onClick={() => onSelectDemandItem(item.id)}
                          >
                            {selected ? '当前需求' : '查看需求'}
                          </Button>
                        </Space>
                      </Space>
                    </div>
                  );
                })}
              </Space>
            </div>
          </Space>
        ) : null}
      </Card>

      {selectedProcurementItem ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={10}>
            <Card
              variant="borderless"
              style={{ border: '1px solid #dbe4ea', height: '100%' }}
              title="候选商品"
            >
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {filteredProcurementCandidates.length ? (
                  filteredProcurementCandidates.map((candidate) => {
                    const selected = comparingProcurementCandidate?.id === candidate.id;
                    const candidateMeta = procurementCandidateLevelMeta(candidate.level);
                    const candidatePathMeta =
                      procurementCandidatePathMetaMap[candidate.id] ??
                      procurementCandidateInquiryPathMeta(candidate, undefined);
                    return (
                      <div
                        key={candidate.id}
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          border: selected ? '1px solid #0f766e' : '1px solid #dbe4ea',
                          background: selected ? '#f0fdf4' : '#ffffff'
                        }}
                      >
                        <Space size={[8, 8]} wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ color: '#0f172a', fontWeight: 600, marginBottom: 6 }}>
                              {procurementCandidateDisplayTitle(candidate)}
                            </div>
                            <div style={{ color: '#475569', fontSize: 13, marginBottom: 4 }}>
                              {procurementDisplayText(candidate.supplierName)} · {procurementCandidatePriceText(candidate)} · {procurementCandidateMoqText(candidate)}
                            </div>
                            <div style={{ color: '#64748b', fontSize: 12 }}>
                              {candidatePathMeta.helperText}
                            </div>
                          </div>
                          <Space size={[8, 8]} wrap>
                            <Tag color={candidateMeta.color} style={{ marginInlineEnd: 0 }}>
                              {candidateMeta.label}
                            </Tag>
                            <Tag color={candidatePathMeta.tagColor} style={{ marginInlineEnd: 0 }}>
                              {candidatePathMeta.label}
                            </Tag>
                            <Button
                              type={selected ? 'primary' : 'default'}
                              onClick={() => onSelectCandidate(candidate.id)}
                            >
                              {selected ? '当前候选' : '切换候选'}
                            </Button>
                          </Space>
                        </Space>
                      </div>
                    );
                  })
                ) : (
                  <Empty description="当前需求还没有候选商品" />
                )}
              </Space>
            </Card>
          </Col>

          <Col xs={24} xl={14}>
            <Card
              variant="borderless"
              style={{ border: '1px solid #dbe4ea', height: '100%' }}
              title="自动询价结果"
              extra={
                <Space wrap size={[8, 8]}>
                  <Button
                    type="primary"
                    loading={currentProcurementAutoInquiryBusinessState?.status === 'loading'}
                    disabled={currentProcurementAutoInquiryBusinessAction.disabled}
                    onClick={() =>
                      void onStartCandidateAutoInquiry(
                        selectedProcurementItem,
                        comparingProcurementCandidate
                      )
                    }
                  >
                    {currentProcurementAutoInquiryBusinessAction.label}
                  </Button>
                  <Button
                    onClick={() =>
                      void onLoadCandidateAutoInquiry(
                        selectedProcurementItem,
                        comparingProcurementCandidate
                      )
                    }
                  >
                    刷新询价结果
                  </Button>
                </Space>
              }
            >
              {comparingProcurementCandidate ? (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Alert
                    type={currentProcurementAutoInquiryBusinessMeta.alertType}
                    showIcon
                    message={`当前状态：${currentProcurementAutoInquiryBusinessMeta.businessStatus}`}
                    description={currentProcurementAutoInquiryBusinessMeta.summary}
                  />

                  {currentProcurementAutoInquiryBusinessAction.disabled && nextProcurementAutoInquiryCandidate ? (
                    <Alert
                      type="info"
                      showIcon
                      message={
                        currentProcurementAutoInquiryBusinessMeta.businessStatus === '已发送' ||
                        currentProcurementAutoInquiryBusinessMeta.businessStatus === '询价中'
                          ? '当前候选已完成询价'
                          : '当前候选暂不适合直接发起自动询价'
                      }
                      description={
                        <Space wrap size={[8, 8]}>
                          <span>
                            {currentProcurementAutoInquiryBusinessMeta.businessStatus === '已发送' ||
                            currentProcurementAutoInquiryBusinessMeta.businessStatus === '询价中'
                              ? `如果你要继续发起新的自动询价，可以切换到“${procurementCandidateDisplayTitle(nextProcurementAutoInquiryCandidate)}”。`
                              : `系统已帮你找到更适合直接发起的一条候选：“${procurementCandidateDisplayTitle(nextProcurementAutoInquiryCandidate)}”。`}
                          </span>
                          <Button onClick={() => onSelectCandidate(nextProcurementAutoInquiryCandidate.id)}>
                            切换到可发起候选
                          </Button>
                        </Space>
                      }
                    />
                  ) : null}

                  <Descriptions
                    bordered
                    size="small"
                    column={1}
                    items={[
                      {
                        key: 'demand',
                        label: '当前采购需求',
                        children: procurementDemandDisplayTitle(selectedProcurementItem)
                      },
                      {
                        key: 'candidate',
                        label: '当前候选商品',
                        children: procurementCandidateDisplayTitle(comparingProcurementCandidate)
                      },
                      {
                        key: 'supplier',
                        label: '询价供应商',
                        children: currentProcurementAutoInquiryBusinessMeta.supplierName
                      },
                      {
                        key: 'sentAt',
                        label: '发送时间',
                        children: currentProcurementAutoInquiryBusinessMeta.sentAt || '-'
                      },
                      {
                        key: 'status',
                        label: '当前业务状态',
                        children: currentProcurementAutoInquiryBusinessMeta.businessStatus
                      },
                      {
                        key: 'summary',
                        label: '询价摘要',
                        children: (
                          <div style={{ whiteSpace: 'pre-wrap', color: '#475569' }}>
                            {currentProcurementAutoInquiryBusinessMeta.inquirySummary}
                          </div>
                        )
                      },
                      ...(currentProcurementAutoInquiryBusinessMeta.failureReason
                        ? [
                            {
                              key: 'failureReason',
                              label: '业务失败原因',
                              children: currentProcurementAutoInquiryBusinessMeta.failureReason
                            }
                          ]
                        : [])
                    ]}
                  />
                </Space>
              ) : (
                <Empty description="先从左侧候选里选一条，再发起自动询价" />
              )}
            </Card>
          </Col>
        </Row>
      ) : null}
    </Space>
  );
}
