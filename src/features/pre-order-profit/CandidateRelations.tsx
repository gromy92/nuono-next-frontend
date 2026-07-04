import { useState } from 'react';
import { Button, Card, Empty, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Tag, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { PRE_ORDER_PROFIT_SITE_CONFIGS } from './calculator';
import type {
  PreOrderProfitCompetitor,
  PreOrderProfitInput,
  PreOrderProfitPurchaseOrder,
  PreOrderProfitSiteCode
} from './types';

const { Text } = Typography;

type CompetitorModalState =
  | {
      mode: 'create' | 'edit';
      draft: PreOrderProfitCompetitor;
    }
  | null;

type PurchaseOrderModalState = {
  selectedPurchaseOrderId: string | null;
  newName: string;
  newNotes: string;
  duplicateMessage: string | null;
} | null;

type CandidateRelationsProps = {
  candidate: PreOrderProfitInput;
  purchaseOrders: PreOrderProfitPurchaseOrder[];
  onSaveCompetitor: (competitor: PreOrderProfitCompetitor) => Promise<void> | void;
  onDeleteCompetitor: (competitorId: string) => Promise<void> | void;
  onAddToPurchaseOrder: (purchaseOrderId: string) => Promise<boolean> | boolean;
  onCreatePurchaseOrderAndAdd: (name: string, notes: string) => Promise<void> | void;
};

export function CandidateRelations(props: CandidateRelationsProps) {
  const {
    candidate,
    onAddToPurchaseOrder,
    onCreatePurchaseOrderAndAdd,
    onDeleteCompetitor,
    onSaveCompetitor,
    purchaseOrders
  } = props;
  const [competitorModal, setCompetitorModal] = useCompetitorModalState();
  const [purchaseOrderModal, setPurchaseOrderModal] = usePurchaseOrderModalState();
  const [savingCompetitor, setSavingCompetitor] = useState(false);
  const [savingPurchaseOrder, setSavingPurchaseOrder] = useState(false);
  const linkedPurchaseOrders = candidate.relationsLoaded
    ? candidate.purchaseOrders ?? []
    : purchaseOrders.filter((order) => order.itemCandidateIds?.includes(candidate.id));

  const openCreateCompetitor = () => {
    setCompetitorModal({
      mode: 'create',
      draft: createBlankCompetitor(candidate.site)
    });
  };

  const openEditCompetitor = (competitor: PreOrderProfitCompetitor) => {
    setCompetitorModal({
      mode: 'edit',
      draft: { ...competitor }
    });
  };

  const saveCompetitor = async () => {
    if (!competitorModal) return;
    setSavingCompetitor(true);
    try {
      await onSaveCompetitor({
        ...competitorModal.draft,
        title: competitorModal.draft.title.trim() || '未命名竞品',
        url: competitorModal.draft.url.trim(),
        platform: competitorModal.draft.platform.trim() || 'Noon',
        sellerName: competitorModal.draft.sellerName.trim(),
        notes: competitorModal.draft.notes.trim()
      });
      setCompetitorModal(null);
    } finally {
      setSavingCompetitor(false);
    }
  };

  const openPurchaseOrderModal = () => {
    setPurchaseOrderModal({
      selectedPurchaseOrderId: purchaseOrders[0]?.id ?? null,
      newName: '',
      newNotes: '',
      duplicateMessage: null
    });
  };

  const addToPurchaseOrder = async () => {
    if (!purchaseOrderModal?.selectedPurchaseOrderId) return;
    setSavingPurchaseOrder(true);
    let added = false;
    try {
      added = await onAddToPurchaseOrder(purchaseOrderModal.selectedPurchaseOrderId);
    } finally {
      setSavingPurchaseOrder(false);
    }
    if (added) {
      setPurchaseOrderModal(null);
      return;
    }
    setPurchaseOrderModal({
      ...purchaseOrderModal,
      duplicateMessage: '已在该采购单中'
    });
  };

  const createPurchaseOrderAndAdd = async () => {
    if (!purchaseOrderModal?.newName.trim()) return;
    setSavingPurchaseOrder(true);
    try {
      await onCreatePurchaseOrderAndAdd(purchaseOrderModal.newName, purchaseOrderModal.newNotes);
      setPurchaseOrderModal(null);
    } finally {
      setSavingPurchaseOrder(false);
    }
  };

  return (
    <>
      <Card
        className="pre-order-profit-card"
        title="竞品"
        extra={
          <Button
            size="small"
            icon={<PlusOutlined />}
            data-testid="pre-order-profit-add-competitor"
            onClick={openCreateCompetitor}
          >
            新增竞品
          </Button>
        }
        data-testid="pre-order-profit-competitor-section"
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Tag color="blue" style={{ width: 'fit-content' }}>
            竞品 {candidate.competitors.length}
          </Tag>
          {candidate.competitors.length ? (
            <div className="pre-order-profit-competitor-list">
              {candidate.competitors.map((competitor) => (
                <div
                  className="pre-order-profit-competitor-item"
                  data-testid="pre-order-profit-competitor-item"
                  key={competitor.id}
                >
                  <div>
                    <Text strong>{competitor.title}</Text>
                    <div className="pre-order-profit-muted-line">
                      {competitor.platform} / {PRE_ORDER_PROFIT_SITE_CONFIGS[competitor.site].label} /{' '}
                      {competitor.price.toFixed(2)} {competitor.currency}
                    </div>
                    {competitor.sellerName ? <div className="pre-order-profit-muted-line">{competitor.sellerName}</div> : null}
                    {competitor.notes ? <div className="pre-order-profit-muted-line">{competitor.notes}</div> : null}
                  </div>
                  <Space>
                    <Button
                      size="small"
                      type="text"
                      icon={<EditOutlined />}
                      data-testid="pre-order-profit-edit-competitor"
                      onClick={() => openEditCompetitor(competitor)}
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="删除竞品"
                      description="确认删除这个竞品记录？"
                      okText="确认删除"
                      cancelText="取消"
                      onConfirm={() => onDeleteCompetitor(competitor.id)}
                    >
                      <Button
                        size="small"
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        data-testid="pre-order-profit-delete-competitor"
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              ))}
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无竞品" />
          )}
        </Space>
      </Card>

      <Card
        className="pre-order-profit-card"
        title="采购单"
        extra={
          <Button
            size="small"
            icon={<PlusOutlined />}
            data-testid="pre-order-profit-add-to-purchase-order"
            onClick={openPurchaseOrderModal}
          >
            加入采购单
          </Button>
        }
        data-testid="pre-order-profit-purchase-order-section"
      >
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <Tag color={linkedPurchaseOrders.length ? 'green' : 'default'} style={{ width: 'fit-content' }}>
            采购单 {linkedPurchaseOrders.length}
          </Tag>
          {linkedPurchaseOrders.length ? (
            <div className="pre-order-profit-purchase-order-list">
              {linkedPurchaseOrders.map((order) => (
                <div className="pre-order-profit-purchase-order-item" key={order.id}>
                  <Text strong>{order.name}</Text>
                  {order.notes ? <div className="pre-order-profit-muted-line">{order.notes}</div> : null}
                </div>
              ))}
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="尚未加入采购单" />
          )}
        </Space>
      </Card>

      <CompetitorEditorModal
        modalState={competitorModal}
        onChange={(patch) => {
          setCompetitorModal((current) => (current ? { ...current, draft: { ...current.draft, ...patch } } : current));
        }}
        onCancel={() => setCompetitorModal(null)}
        onSave={saveCompetitor}
        saving={savingCompetitor}
      />

      <PurchaseOrderPickerModal
        modalState={purchaseOrderModal}
        purchaseOrders={purchaseOrders}
        onChange={(patch) => {
          setPurchaseOrderModal((current) => (current ? { ...current, ...patch, duplicateMessage: null } : current));
        }}
        onCancel={() => setPurchaseOrderModal(null)}
        onAdd={addToPurchaseOrder}
        onCreate={createPurchaseOrderAndAdd}
        saving={savingPurchaseOrder}
      />
    </>
  );
}

function useCompetitorModalState() {
  return useState<CompetitorModalState>(null);
}

function usePurchaseOrderModalState() {
  return useState<PurchaseOrderModalState>(null);
}

function createBlankCompetitor(site: PreOrderProfitSiteCode): PreOrderProfitCompetitor {
  const currency = PRE_ORDER_PROFIT_SITE_CONFIGS[site].currency;

  return {
    id: `competitor-${Date.now()}`,
    title: '',
    url: '',
    platform: 'Noon',
    site,
    price: 0,
    currency,
    sellerName: '',
    notes: ''
  };
}

function CompetitorEditorModal(props: {
  modalState: CompetitorModalState;
  onChange: (patch: Partial<PreOrderProfitCompetitor>) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const { modalState, onCancel, onChange, onSave, saving } = props;
  const competitor = modalState?.draft;
  const canSave = Boolean(competitor?.title.trim());

  return (
    <Modal
      title={modalState?.mode === 'edit' ? '编辑竞品' : '新增竞品'}
      open={Boolean(competitor)}
      destroyOnClose
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="save"
          type="primary"
          data-testid="pre-order-profit-competitor-save"
          disabled={!canSave}
          loading={saving}
          onClick={onSave}
        >
          保存
        </Button>
      ]}
    >
      {competitor ? (
        <Form layout="vertical" className="pre-order-profit-modal-form">
          <Form.Item label="竞品标题" data-testid="pre-order-profit-competitor-title">
            <Input value={competitor.title} onChange={(event) => onChange({ title: event.target.value })} />
          </Form.Item>
          <Form.Item label="平台" data-testid="pre-order-profit-competitor-platform">
            <Input value={competitor.platform} onChange={(event) => onChange({ platform: event.target.value })} />
          </Form.Item>
          <Form.Item className="is-wide" label="竞品链接" data-testid="pre-order-profit-competitor-url">
            <Input value={competitor.url} onChange={(event) => onChange({ url: event.target.value })} />
          </Form.Item>
          <Form.Item label="站点">
            <Select
              value={competitor.site}
              options={[
                { value: 'SA', label: '沙特' },
                { value: 'AE', label: '阿联酋' }
              ]}
              onChange={(site) => {
                onChange({
                  site,
                  currency: PRE_ORDER_PROFIT_SITE_CONFIGS[site].currency
                });
              }}
            />
          </Form.Item>
          <Form.Item label="售价" data-testid="pre-order-profit-competitor-price">
            <InputNumber
              min={0}
              precision={2}
              value={competitor.price}
              onChange={(value) => onChange({ price: Number(value) || 0 })}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="卖家" data-testid="pre-order-profit-competitor-seller">
            <Input value={competitor.sellerName} onChange={(event) => onChange({ sellerName: event.target.value })} />
          </Form.Item>
          <Form.Item className="is-wide" label="备注" data-testid="pre-order-profit-competitor-notes">
            <Input.TextArea
              rows={3}
              value={competitor.notes}
              onChange={(event) => onChange({ notes: event.target.value })}
            />
          </Form.Item>
        </Form>
      ) : null}
    </Modal>
  );
}

function PurchaseOrderPickerModal(props: {
  modalState: PurchaseOrderModalState;
  purchaseOrders: PreOrderProfitPurchaseOrder[];
  onChange: (patch: Partial<NonNullable<PurchaseOrderModalState>>) => void;
  onCancel: () => void;
  onAdd: () => void;
  onCreate: () => void;
  saving: boolean;
}) {
  const { modalState, onAdd, onCancel, onChange, onCreate, purchaseOrders, saving } = props;

  return (
    <Modal
      title="加入采购单"
      open={Boolean(modalState)}
      destroyOnClose
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="add"
          type="primary"
          data-testid="pre-order-profit-purchase-order-save"
          disabled={!modalState?.selectedPurchaseOrderId}
          loading={saving}
          onClick={onAdd}
        >
          加入选中采购单
        </Button>
      ]}
    >
      {modalState ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {modalState.duplicateMessage ? <Tag color="orange">{modalState.duplicateMessage}</Tag> : null}
          <Form layout="vertical">
            <Form.Item label="已有采购单" data-testid="pre-order-profit-purchase-order-select">
              <Select
                value={modalState.selectedPurchaseOrderId}
                options={purchaseOrders.map((order) => ({
                  value: order.id,
                  label: order.name
                }))}
                placeholder="选择已有采购单"
                onChange={(selectedPurchaseOrderId) => onChange({ selectedPurchaseOrderId })}
              />
            </Form.Item>
          </Form>
          <div className="pre-order-profit-modal-divider" />
          <Form layout="vertical" className="pre-order-profit-modal-form">
            <Form.Item label="新采购单名称" data-testid="pre-order-profit-new-purchase-order-name">
              <Input value={modalState.newName} onChange={(event) => onChange({ newName: event.target.value })} />
            </Form.Item>
            <Form.Item className="is-wide" label="备注" data-testid="pre-order-profit-new-purchase-order-notes">
              <Input.TextArea
                rows={3}
                value={modalState.newNotes}
                onChange={(event) => onChange({ newNotes: event.target.value })}
              />
            </Form.Item>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              data-testid="pre-order-profit-create-purchase-order"
              disabled={!modalState.newName.trim()}
              loading={saving}
              onClick={onCreate}
            >
              新建采购单并加入
            </Button>
          </Form>
        </Space>
      ) : null}
    </Modal>
  );
}
