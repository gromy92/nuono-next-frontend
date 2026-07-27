import { Button, Popover, Tag, Typography } from 'antd';
import type { WarehouseOrderJourney } from './warehouseOrderJourney';
import { warehouseOrderJourneyStatusMeta } from './warehouseOrderJourney';

const { Text } = Typography;

function JourneyRow({ journey }: { journey: WarehouseOrderJourney }) {
  const status = warehouseOrderJourneyStatusMeta(journey.status);
  return (
    <div className="warehouse-order-journey-row">
      <Text>{journey.shippingBatchNo}</Text>
      <Tag color={status.color}>{status.label}</Tag>
    </div>
  );
}

export function WarehouseOrderJourneyCell({ journeys }: { journeys: WarehouseOrderJourney[] }) {
  if (!journeys.length) {
    return <Text type="secondary">尚未进入发运</Text>;
  }
  const visibleJourneys = journeys.slice(0, 2);
  return (
    <div className="warehouse-order-journey-cell">
      {visibleJourneys.map((journey) => (
        <JourneyRow key={journey.shippingBatchId} journey={journey} />
      ))}
      {journeys.length > visibleJourneys.length ? (
        <Popover
          placement="bottomLeft"
          title="全部关联发运"
          content={(
            <div className="warehouse-order-journey-popover">
              {journeys.map((journey) => (
                <JourneyRow key={journey.shippingBatchId} journey={journey} />
              ))}
            </div>
          )}
        >
          <Button type="link" size="small">共 {journeys.length} 个发运批次</Button>
        </Popover>
      ) : null}
    </div>
  );
}
