import { Tag, Typography } from 'antd';
import type {
  PurchaseOrderLogisticsQuoteChannelOption,
  PurchaseOrderLogisticsQuotePublishedPrice,
  PurchaseOrderLogisticsQuoteSurcharge
} from '../../purchase-order/types';
import {
  formatPublishedQuotePrice,
  formatPublishedQuoteSurcharge,
  publishedQuoteConstraintLabels
} from './warehouseShippingQuoteDomain';

const { Text } = Typography;

export function WarehouseShippingOrderPublishedPriceCard({
  channel
}: {
  channel?: PurchaseOrderLogisticsQuoteChannelOption;
}) {
  if (!channel) {
    return (
      <div className="warehouse-shipping-order-published-price-card">
        <Text type="secondary">选择货代后查看线上报价</Text>
      </div>
    );
  }

  const prices = channel.publishedPrices || [];
  const surcharges = channel.surcharges || [];
  const constraints = publishedQuoteConstraintLabels(prices);
  return (
    <div
      className="warehouse-shipping-order-published-price-card"
      data-testid="warehouse-shipping-order-published-price-card"
    >
      <div className="warehouse-shipping-order-published-price-header">
        <Text strong>线上报价</Text>
        {channel.quoteVersionCode ? <Tag>{channel.quoteVersionCode}</Tag> : null}
      </div>
      {prices.length ? (
        <div className="warehouse-shipping-order-published-price-list">
          {prices.map((price, index) => (
            <PublishedPriceItem
              key={price.priceRuleCode || price.cargoCategoryCode || `${price.cargoCategoryName || 'price'}-${index}`}
              price={price}
            />
          ))}
        </div>
      ) : (
        <Text type="warning">暂无线上报价</Text>
      )}
      {surcharges.length ? (
        <div className="warehouse-shipping-order-published-surcharge-list">
          {surcharges.map((fee, index) => (
            <PublishedSurchargeItem
              key={`${fee.feeType || fee.feeName || 'fee'}-${index}`}
              fee={fee}
            />
          ))}
        </div>
      ) : null}
      {constraints.length ? (
        <Text type="secondary" className="warehouse-shipping-order-published-price-constraints">
          {constraints.join(' · ')}
        </Text>
      ) : null}
    </div>
  );
}

function PublishedPriceItem({ price }: { price: PurchaseOrderLogisticsQuotePublishedPrice }) {
  return (
    <div className="warehouse-shipping-order-published-price-item">
      <Text type="secondary">{price.cargoCategoryName || '基础价'}</Text>
      <Text strong>{formatPublishedQuotePrice(price)}</Text>
    </div>
  );
}

function PublishedSurchargeItem({ fee }: { fee: PurchaseOrderLogisticsQuoteSurcharge }) {
  return (
    <div className="warehouse-shipping-order-published-surcharge-item">
      <Text type="secondary">{fee.feeName || '附加费'}</Text>
      <Text>{formatPublishedQuoteSurcharge(fee)}</Text>
      {fee.triggerCondition ? <Text type="secondary">{fee.triggerCondition}</Text> : null}
    </div>
  );
}
