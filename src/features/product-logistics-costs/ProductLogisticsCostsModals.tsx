import { Form, Input, InputNumber, Modal, Select, Space } from 'antd';
import { CHARGE_UNIT_OPTIONS } from './productLogisticsCostModels';
import type { ProductLogisticsCostData } from './useProductLogisticsCostData';
import type { ProductLogisticsCostMutations } from './useProductLogisticsCostMutations';

export function ProductLogisticsCostsModals({
  data,
  mutations
}: {
  data: ProductLogisticsCostData;
  mutations: ProductLogisticsCostMutations;
}) {
  return (
    <>
      <Modal
        title="批量维护类别"
        open={mutations.batchCategoryModalOpen}
        onCancel={mutations.closeBatchCategoryModal}
        onOk={() => void mutations.submitBatchCategoryAssignment()}
        okButtonProps={{ disabled: !mutations.batchCategoryCode }}
        confirmLoading={mutations.savingBatchCategory}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Space direction="vertical" size={12} className="product-logistics-costs-page__batch-modal">
          <Space direction="vertical" size={2}>
            <span>{data.routeLabel}</span>
            <span className="product-logistics-costs-page__subtext">
              将为已选 {data.assignableSelectedRows.length} 个商品维护类别和当前报价
            </span>
          </Space>
          <Select
            allowClear
            aria-label="批量类别"
            className="product-logistics-costs-page__batch-modal-select"
            placeholder="选择类别"
            options={data.activeCategoryOptions}
            value={mutations.batchCategoryCode}
            onChange={mutations.setBatchCategoryCode}
          />
        </Space>
      </Modal>

      <Modal
        title="维护线路类别报价"
        open={mutations.rateCardModalOpen}
        onCancel={mutations.closeRateCardModal}
        onOk={() => void mutations.submitRateCard()}
        confirmLoading={mutations.savingRateCard}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Space direction="vertical" size={4} className="product-logistics-costs-page__manual-summary">
          <span>{data.routeLabel}</span>
          <span className="product-logistics-costs-page__subtext">
            {data.assignableSelectedRows.length > 0
              ? `保存后同步维护已选 ${data.assignableSelectedRows.length} 个商品`
              : '维护该路线下某个类别的当前报价'}
          </span>
        </Space>
        <Form form={mutations.rateCardForm} layout="vertical" className="product-logistics-costs-page__manual-form">
          <Form.Item name="cargoCategoryCode" label="类别" rules={[{ required: true, message: '请选择类别' }]}>
            <Select options={data.activeCategoryOptions} onChange={mutations.fillRateCardFormForCategory} />
          </Form.Item>
          <Form.Item name="unitCostCny" label="当前报价" rules={[{ required: true, message: '请输入当前报价' }]}>
            <InputNumber min={0.01} precision={2} step={0.01} className="product-logistics-costs-page__manual-input" />
          </Form.Item>
          <Form.Item name="chargeUnit" label="计费单位" rules={[{ required: true, message: '请选择计费单位' }]}>
            <Select options={CHARGE_UNIT_OPTIONS} />
          </Form.Item>
          <Form.Item name="sourceReference" label="来源">
            <Input maxLength={200} placeholder="例如 ET易通天下物流报价-0604" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="维护当前报价"
        open={!!mutations.manualQuoteRow}
        onCancel={mutations.closeManualQuoteModal}
        onOk={() => void mutations.submitManualQuote()}
        confirmLoading={mutations.savingManualQuote}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Space direction="vertical" size={4} className="product-logistics-costs-page__manual-summary">
          <span>{mutations.manualQuoteRow?.partnerSku || '-'}</span>
          <span className="product-logistics-costs-page__subtext">{data.routeLabel}</span>
        </Space>
        <Form form={mutations.manualQuoteForm} layout="vertical" className="product-logistics-costs-page__manual-form">
          <Form.Item name="cargoCategoryCode" label="类别" rules={[{ required: true, message: '请选择类别' }]}>
            <Select options={data.activeCategoryOptions} onChange={mutations.handleManualQuoteCategoryChange} />
          </Form.Item>
          <Form.Item name="unitCostCny" label="当前报价" rules={[{ required: true, message: '请输入当前报价' }]}>
            <InputNumber min={0.01} precision={2} step={0.01} className="product-logistics-costs-page__manual-input" />
          </Form.Item>
          <Form.Item name="chargeUnit" label="计费单位" rules={[{ required: true, message: '请选择计费单位' }]}>
            <Select options={CHARGE_UNIT_OPTIONS} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
