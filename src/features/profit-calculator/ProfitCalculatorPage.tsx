import { Alert, Button, Card, Col, Form, Input, InputNumber, Row, Space, Table, Tag, Typography } from 'antd';
import type { FormInstance } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  formatMoney,
  formatPercent,
  profitCarryoverFieldLabel,
  profitScenarioColor,
  type ProfitCalculationPayload,
  type ProfitCalculationState,
  type ProfitFormValues,
  type ProfitPendingCarryoverState
} from './domain';

const { Text, Title } = Typography;

type ProfitScenarioRow = ProfitCalculationPayload['scenarios'][number];

type ProfitCalculatorPageProps = {
  form: FormInstance<ProfitFormValues>;
  marketCurrency: string;
  calculationState: ProfitCalculationState;
  pendingCarryoverState: ProfitPendingCarryoverState | null;
  pendingMissingFields: string[];
  pendingRetainedFields: string[];
  onCalculate: () => void | Promise<void>;
  onPendingFieldsChange: (values: Partial<ProfitFormValues>) => void;
  onReset: () => void;
};

const scenarioColumns: ColumnsType<ProfitScenarioRow> = [
  {
    title: '方案',
    dataIndex: 'label',
    key: 'label',
    width: 150
  },
  {
    title: '结算收入',
    dataIndex: 'settlementRevenueRmb',
    key: 'settlementRevenueRmb',
    align: 'right',
    render: (value: number) => `¥${formatMoney(value)}`
  },
  {
    title: '头程',
    dataIndex: 'firstLegFeeRmb',
    key: 'firstLegFeeRmb',
    align: 'right',
    render: (value: number) => `¥${formatMoney(value)}`
  },
  {
    title: '总成本',
    dataIndex: 'totalCostRmb',
    key: 'totalCostRmb',
    align: 'right',
    render: (value: number) => `¥${formatMoney(value)}`
  },
  {
    title: '利润',
    dataIndex: 'profitRmb',
    key: 'profitRmb',
    align: 'right',
    render: (value: number) => (
      <Text strong style={{ color: profitScenarioColor(value) }}>
        ¥{formatMoney(value)}
      </Text>
    )
  },
  {
    title: '利润率',
    dataIndex: 'marginRatePct',
    key: 'marginRatePct',
    align: 'right',
    render: (value: number) => formatPercent(value)
  }
];

function NumberField(props: {
  name: keyof ProfitFormValues;
  label: string;
  addonAfter?: string;
  min?: number;
  step?: number;
}) {
  return (
    <Col xs={24} sm={12} lg={6}>
      <Form.Item name={props.name} label={props.label}>
        <InputNumber min={props.min} step={props.step} addonAfter={props.addonAfter} style={{ width: '100%' }} />
      </Form.Item>
    </Col>
  );
}

function CarryoverNotice(props: {
  state: ProfitPendingCarryoverState | null;
  missingFields: string[];
  retainedFields: string[];
}) {
  const { state, missingFields, retainedFields } = props;
  if (!state) {
    return null;
  }

  return (
    <Alert
      type={missingFields.length ? 'warning' : 'info'}
      showIcon
      message="已带入采购候选参数"
      description={
        <Space direction="vertical" size={4}>
          {retainedFields.length ? (
            <Text>已保留：{retainedFields.map((field) => profitCarryoverFieldLabel(field)).join(' / ')}</Text>
          ) : null}
          {missingFields.length ? (
            <Text>待补：{missingFields.map((field) => profitCarryoverFieldLabel(field)).join(' / ')}</Text>
          ) : null}
        </Space>
      }
    />
  );
}

export function ProfitCalculatorPage(props: ProfitCalculatorPageProps) {
  const {
    form,
    marketCurrency,
    calculationState,
    pendingCarryoverState,
    pendingMissingFields,
    pendingRetainedFields,
    onCalculate,
    onPendingFieldsChange,
    onReset
  } = props;
  const result = calculationState.status === 'success' ? calculationState.data : null;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card variant="borderless" style={{ border: '1px solid #dbe4ea' }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space direction="vertical" size={4}>
            <Title level={4} style={{ margin: 0 }}>
              利润计算
            </Title>
            <Text type="secondary">按站点售价、采购价、体积重量和履约费用测算 FBN / FBP 利润。</Text>
          </Space>

          <CarryoverNotice
            state={pendingCarryoverState}
            missingFields={pendingMissingFields}
            retainedFields={pendingRetainedFields}
          />

          <Form
            form={form}
            layout="vertical"
            onValuesChange={(_, values) => onPendingFieldsChange(values as Partial<ProfitFormValues>)}
          >
            <Row gutter={[12, 0]}>
              <Col xs={24} sm={12} lg={6}>
                <Form.Item name="title" label="商品标题">
                  <Input placeholder="选填" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Form.Item name="site" label="站点">
                  <Input readOnly />
                </Form.Item>
              </Col>
              <NumberField name="salePrice" label={`目标售价 (${marketCurrency})`} min={0} step={0.1} />
              <NumberField name="purchasePrice" label="采购单价 (RMB)" min={0} step={0.1} />
              <NumberField name="lengthCm" label="长" addonAfter="cm" min={0} step={0.1} />
              <NumberField name="widthCm" label="宽" addonAfter="cm" min={0} step={0.1} />
              <NumberField name="heightCm" label="高" addonAfter="cm" min={0} step={0.1} />
              <NumberField name="weightGrams" label="重量" addonAfter="g" min={0} step={1} />
              <NumberField name="exchangeRate" label="汇率" min={0} step={0.0001} />
              <NumberField name="domesticShippingFee" label="国内物流" addonAfter="RMB" min={0} step={0.1} />
              <NumberField name="warehouseDeliveryUnitPrice" label="送仓单价" addonAfter="RMB" min={0} step={0.1} />
              <NumberField name="airFreightUnitPrice" label="空运单价" addonAfter="RMB/kg" min={0} step={0.1} />
              <NumberField name="oceanFreightUnitPrice" label="海运单价" addonAfter="RMB/cbm" min={0} step={1} />
              <NumberField name="fulfillmentFee" label="履约费" addonAfter="RMB" min={0} step={0.1} />
            </Row>
          </Form>

          <Space wrap>
            <Button type="primary" loading={calculationState.status === 'loading'} onClick={() => void onCalculate()}>
              计算利润
            </Button>
            <Button onClick={onReset}>重置</Button>
          </Space>
        </Space>
      </Card>

      {calculationState.status === 'error' ? (
        <Alert type="error" showIcon message="利润计算失败" description={calculationState.message} />
      ) : null}

      {result ? (
        <Card
          variant="borderless"
          title={
            <Space wrap>
              <span>{result.title || '利润测算结果'}</span>
              <Tag>{result.site}</Tag>
              <Tag>{result.marketCurrency}</Tag>
            </Space>
          }
          style={{ border: '1px solid #dbe4ea' }}
        >
          <Table
            rowKey="code"
            columns={scenarioColumns}
            dataSource={result.scenarios}
            pagination={false}
            scroll={{ x: 900 }}
          />
          {result.notes.length ? (
            <Space direction="vertical" size={4} style={{ marginTop: 12 }}>
              {result.notes.map((note) => (
                <Text key={note} type="secondary">
                  {note}
                </Text>
              ))}
            </Space>
          ) : null}
        </Card>
      ) : null}
    </Space>
  );
}
