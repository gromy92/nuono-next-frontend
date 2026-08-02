import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Button, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import type {
  OrderLogisticsQuoteChannelOption,
  OrderLogisticsQuotePublishedPrice
} from '../../logistics-quote/types';
import { formatPublishedQuotePrice } from './warehouseShippingQuoteDomain';

const { Text } = Typography;

export function WarehouseShippingOrderPublishedPriceCard({
  channel
}: {
  channel?: OrderLogisticsQuoteChannelOption;
}) {
  const [seaPricesExpanded, setSeaPricesExpanded] = useState(false);

  useEffect(() => {
    setSeaPricesExpanded(false);
  }, [channel?.routeCode]);

  if (!channel) {
    return (
      <div className="warehouse-shipping-order-published-price-card">
        <Text type="secondary">选择货代后查看线上报价</Text>
      </div>
    );
  }

  const prices = channel.publishedPrices || [];
  const isSea = (channel.transportMode || '').toUpperCase() === 'SEA';
  const showPrices = !isSea || seaPricesExpanded;
  return (
    <div
      className="warehouse-shipping-order-published-price-card"
      data-testid="warehouse-shipping-order-published-price-card"
    >
      <div className="warehouse-shipping-order-published-price-header">
        <Text strong>线上报价</Text>
        {channel.quoteVersionCode ? <Tag>{channel.quoteVersionCode}</Tag> : null}
        {isSea && prices.length ? (
          <Button
            className="warehouse-shipping-order-sea-price-toggle"
            type="link"
            size="small"
            icon={seaPricesExpanded ? <UpOutlined /> : <DownOutlined />}
            onClick={() => setSeaPricesExpanded((expanded) => !expanded)}
          >
            {seaPricesExpanded ? '收起海运报价' : `展开海运报价 ${prices.length} 项`}
          </Button>
        ) : null}
      </div>
      {prices.length && showPrices ? (
        <div className={`warehouse-shipping-order-published-price-list${isSea ? ' warehouse-shipping-order-published-price-list--expanded' : ''}`}>
          {prices.map((price, index) => (
            <PublishedPriceItem
              key={price.priceRuleCode || price.cargoCategoryCode || `${price.cargoCategoryName || 'price'}-${index}`}
              price={price}
            />
          ))}
        </div>
      ) : !prices.length ? (
        <Text type="warning">暂无线上报价</Text>
      ) : null}
    </div>
  );
}

function PublishedPriceItem({ price }: { price: OrderLogisticsQuotePublishedPrice }) {
  return (
    <div className="warehouse-shipping-order-published-price-item">
      <Text type="secondary">{price.cargoCategoryName || '基础价'}</Text>
      <Text strong>{formatPublishedQuotePrice(price)}</Text>
    </div>
  );
}
