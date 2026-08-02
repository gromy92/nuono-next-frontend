import { SaveOutlined } from '@ant-design/icons';
import { Button, Empty, Image, Input, Select, Table, Typography } from 'antd';
import type { ShippingOrderLine } from './warehouseShippingOrderTypes';
import { buildYiteMaterialCellModel } from './WarehouseOrderPanel.models';
import {
  isUnknownForwarderEligibility,
  isUnsupportedForwarderEligibility,
  normalizeForwarderEligibilityStatus
} from './warehouseForwarderEligibilityDomain';
import type { EffectiveForwarderEligibilityStatus } from './warehouseForwarderEligibilityDomain';
import {
  hasLineQuotePrice,
  isExactlyNotSubmitted,
  shippingOrderLineImageUrl,
  shippingOrderLineTitleCn
} from './warehouseShippingOrderDomain';
import {
  QUOTE_BILLING_UNIT_OPTIONS,
  YITE_MATERIAL_OPTIONS
} from './warehouseShippingOrderModels';
import { quotePriceSourceLabel } from './warehouseShippingQuoteDomain';
import type { ShippingOrderQuoteActions } from './useShippingOrderQuoteActions';
import type { ShippingOrderQuoteState } from './useShippingOrderQuoteState';
import type { WarehouseShippingOrderData } from './useWarehouseShippingOrderData';

const { Text } = Typography;

const ELIGIBILITY_OPTIONS: Array<{
  value: EffectiveForwarderEligibilityStatus;
  label: string;
  disabled?: boolean;
}> = [
  { value: 'SUPPORTED', label: '可发' },
  { value: 'INQUIRY_REQUIRED', label: '需询价' },
  { value: 'UNSUPPORTED', label: '不接' },
  { value: 'UNKNOWN', label: '状态待确认', disabled: true }
];

function displayEligibilityStatus(line: ShippingOrderLine) {
  return normalizeForwarderEligibilityStatus(line.eligibilityStatus);
}

export function WarehouseShippingOrderLineTable({
  data,
  quote,
  actions
}: {
  data: WarehouseShippingOrderData;
  quote: ShippingOrderQuoteState;
  actions: ShippingOrderQuoteActions;
}) {
  const yiteColumns = quote.showYiteFields ? [
    {
      title: '义特材质',
      dataIndex: 'yiteMaterial',
      width: 100,
      render: (_: unknown, line: ShippingOrderLine) => {
        const cell = buildYiteMaterialCellModel(line);
        const draft = quote.readLineDraft(line);
        return (
          <Select
            size="small"
            allowClear
            placeholder="选择材质"
            options={YITE_MATERIAL_OPTIONS}
            value={draft.yiteMaterial || cell.value}
            disabled={!cell.editable || !quote.detailMutationAllowed
              || !isExactlyNotSubmitted(line.shippingSubmitStatus)}
            onChange={(yiteMaterial) => quote.updateLineDraft(line.id, { yiteMaterial })}
          />
        );
      }
    },
    {
      title: '义特价格',
      dataIndex: 'unitPrice',
      width: 105,
      render: (_: unknown, line: ShippingOrderLine) => (
        <Text type="secondary" className="warehouse-shipping-order-yite-price">
          {buildYiteMaterialCellModel(line).priceText}
        </Text>
      )
    }
  ] : [];

  return (
    <Table<ShippingOrderLine>
      size="small"
      key={quote.activeMaintenanceKey}
      rowKey="id"
      rowSelection={{
        selectedRowKeys: quote.selectedQuoteLineIds,
        onChange: (keys) => quote.setSelectedQuoteLineIds(keys.map(String)),
        getCheckboxProps: (line) => ({
          disabled: !quote.detailMutationAllowed || !isExactlyNotSubmitted(line.shippingSubmitStatus)
        })
      }}
      scroll={{ x: quote.showYiteFields ? 1170 : 960 }}
      pagination={{ pageSize: 20, showSizeChanger: false }}
      columns={[
        {
          title: '商品',
          dataIndex: 'productTitle',
          width: 280,
          render: (_, line) => {
            const imageUrl = shippingOrderLineImageUrl(line);
            const titleCn = shippingOrderLineTitleCn(line);
            return (
              <div className="warehouse-shipping-order-product-cell">
                {imageUrl ? (
                  <Image
                    className="warehouse-shipping-order-product-image"
                    src={imageUrl}
                    alt={titleCn}
                    width={52}
                    height={52}
                    preview={{ src: imageUrl }}
                  />
                ) : <div className="warehouse-shipping-order-product-placeholder" />}
                <div className="warehouse-shipping-order-product-copy">
                  <Text strong className="warehouse-shipping-order-product-title-cn">{titleCn}</Text>
                  <Text type="secondary" className="warehouse-shipping-order-product-identity">
                    <span className="warehouse-shipping-order-product-identity-label">PSKU:</span>
                    <span className="warehouse-shipping-order-product-identity-value">
                      {line.partnerSku || line.pskuCode || '-'}
                    </span>
                  </Text>
                  <Text type="secondary" className="warehouse-shipping-order-product-identity">
                    <span className="warehouse-shipping-order-product-identity-label">Barcode:</span>
                    <span className="warehouse-shipping-order-product-identity-value">{line.barcode || '-'}</span>
                  </Text>
                </div>
              </div>
            );
          }
        },
        {
          title: '来源/数量',
          dataIndex: 'lineMeta',
          width: 180,
          render: (_, line) => (
            <div className="warehouse-shipping-order-line-meta-cell">
              <Text type="secondary" className="warehouse-shipping-order-line-meta-source">
                {line.purchaseOrderTitle || line.purchaseOrderNo || '-'}
              </Text>
              <Text className="warehouse-shipping-order-line-meta-quantity">
                {Number(line.quantity || 0).toLocaleString('zh-CN')} 件
              </Text>
            </div>
          )
        },
        ...yiteColumns,
        {
          title: '承运状态',
          dataIndex: 'eligibilityStatus',
          width: 120,
          render: (_: unknown, line: ShippingOrderLine) => (
            <Select
              size="small"
              className="warehouse-shipping-order-eligibility-select"
              value={displayEligibilityStatus(line)}
              options={ELIGIBILITY_OPTIONS}
              loading={data.actionKey === `line-eligibility:${line.id}`}
              disabled={!quote.detailMutationAllowed || !isExactlyNotSubmitted(line.shippingSubmitStatus)
                || data.actionKey === `line-eligibility:${line.id}`}
              onChange={(status: EffectiveForwarderEligibilityStatus) => {
                if (status !== 'UNKNOWN') void actions.handleSaveEligibility(line, status);
              }}
            />
          )
        },
        {
          title: '报价单价',
          dataIndex: 'unitPrice',
          width: 232,
          render: (_, line) => {
            const draft = quote.readLineDraft(line);
            const priceSourceLabel = quotePriceSourceLabel(line.priceSource);
            return (
              <div className="warehouse-shipping-order-price-cell">
                <div className="warehouse-shipping-order-price-entry">
                  <Input
                    className="warehouse-shipping-order-quote-field"
                    size="small"
                    inputMode="decimal"
                    value={draft.unitPrice}
                    placeholder={isUnsupportedForwarderEligibility(line)
                      ? '该货代不接'
                      : isUnknownForwarderEligibility(line) ? '请先确认承运状态' : '单价'}
                    disabled={!quote.detailMutationAllowed || !isExactlyNotSubmitted(line.shippingSubmitStatus)
                      || isUnsupportedForwarderEligibility(line)
                      || isUnknownForwarderEligibility(line)}
                    onChange={(event) => quote.updateLineDraft(line.id, { unitPrice: event.target.value })}
                  />
                  <Select
                    className="warehouse-shipping-order-billing-unit-select"
                    size="small"
                    value={draft.billingUnit}
                    options={QUOTE_BILLING_UNIT_OPTIONS}
                    disabled={!quote.detailMutationAllowed || !isExactlyNotSubmitted(line.shippingSubmitStatus)
                      || isUnsupportedForwarderEligibility(line)
                      || isUnknownForwarderEligibility(line)}
                    onChange={(billingUnit) => quote.updateLineDraft(line.id, { billingUnit })}
                  />
                </div>
                {priceSourceLabel ? (
                  <Text
                    type={line.priceSource === 'SHIPPING_ORDER_SNAPSHOT' ? 'success' : 'secondary'}
                    className="warehouse-shipping-order-price-source"
                  >
                    {priceSourceLabel}
                  </Text>
                ) : null}
              </div>
            );
          }
        },
        {
          title: '报价操作',
          width: 112,
          render: (_, line) => (
            <Button
              size="small"
              type={hasLineQuotePrice(line) ? 'default' : 'primary'}
              icon={<SaveOutlined />}
              loading={data.actionKey === `line-quote:${line.id}`}
              disabled={!quote.detailMutationAllowed || !isExactlyNotSubmitted(line.shippingSubmitStatus)
                || isUnsupportedForwarderEligibility(line)
                || isUnknownForwarderEligibility(line)}
              onClick={() => void actions.handleSaveLineQuote(line)}
            >
              保存报价
            </Button>
          )
        }
      ]}
      dataSource={quote.visibleLines}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={quote.detailUnitPriceFilter !== 'ALL'
              ? '当前单价与状态筛选下暂无商品'
                : quote.detailLineFilter === 'MISSING_PRICE'
                  ? '暂无缺单价商品'
              : quote.detailLineFilter === 'MISSING_MATERIAL' ? '暂无缺义特材质商品'
                : quote.detailLineFilter === 'UNSUPPORTED' ? '暂无当前货代不接商品'
                  : quote.detailLineFilter === 'ELIGIBILITY_UNKNOWN' ? '暂无承运状态待确认商品'
                  : quote.detailLineFilter === 'INQUIRY_REQUIRED' ? '暂无需询价商品'
                    : '暂无商品'}
          />
        )
      }}
    />
  );
}
