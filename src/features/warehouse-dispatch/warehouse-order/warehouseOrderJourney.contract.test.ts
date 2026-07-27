import { strict as assert } from 'node:assert';
import { filterShippingOrders } from './warehouseShippingOrderDomain';
import {
  groupWarehouseOrderJourneys,
  warehouseOrderJourneyStatusMeta
} from './warehouseOrderJourney';

const order = {
  id: '290008',
  shippingOrderNo: 'SO-290008',
  title: '0710',
  status: 'DRAFT',
  purchaseOrderCount: 2,
  lineCount: 49,
  skuCount: 49,
  totalQuantity: 2125,
  quoteStatus: 'CONFIRMED',
  shippingSubmitStatus: 'SUBMITTED'
};
const journey = {
  warehouseOrderId: '290008',
  shippingBatchId: '700044',
  shippingBatchNo: '0718-海运-2581件-44',
  status: 'PACKED'
};

const grouped = groupWarehouseOrderJourneys([journey]);
assert.deepEqual(filterShippingOrders([order], '0718', grouped), [order]);

assert.equal(warehouseOrderJourneyStatusMeta('PACKED').label, '待物流交接');
