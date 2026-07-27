import assert from 'node:assert/strict';
import type { ProductLogisticsRateCardRow } from './productLogisticsCostModels';
import {
  forwarderOptionsFromRateCards,
  routeOptionsFromRateCards,
  transportOptionsForForwarder
} from './productLogisticsCostRouteDomain';

const rateCards: ProductLogisticsRateCardRow[] = [
  {
    id: 912001,
    siteCode: 'SA',
    forwarderCode: 'ZD',
    forwarderName: '众鸫供应链',
    transportMode: 'AIR',
    feeType: 'HEADHAUL',
    cargoCategoryCode: 'ZD-SAU-AIR-FBN-RUH-CAT-001',
    cargoCategoryName: '沙特空运（普货）',
    chargeUnit: 'KG',
    unitCostCny: 65,
    sourceType: 'PUBLISHED_FORWARDER_QUOTE'
  },
  {
    id: 912003,
    siteCode: 'SA',
    forwarderCode: 'ZD',
    forwarderName: '众鸫供应链',
    transportMode: 'SEA',
    feeType: 'HEADHAUL',
    cargoCategoryCode: 'ZD-SAU-SEA-WH-RUH-CAT-003',
    cargoCategoryName: '沙特海运（A类）',
    chargeUnit: 'CBM',
    unitCostCny: 1550,
    sourceType: 'PUBLISHED_FORWARDER_QUOTE'
  },
  {
    id: 430001,
    siteCode: 'SA',
    forwarderCode: 'YITE',
    forwarderName: '义特',
    transportMode: 'SEA',
    feeType: 'HEADHAUL',
    cargoCategoryCode: 'A',
    cargoCategoryName: 'A类别运费',
    chargeUnit: 'CBM',
    unitCostCny: 1390,
    sourceType: 'MANUAL_RATE_CARD'
  }
];

const routes = routeOptionsFromRateCards(rateCards);

assert.deepEqual(
  forwarderOptionsFromRateCards(rateCards),
  [
    { label: '义特', value: 'YITE' },
    { label: 'ZD · 众鸫供应链', value: 'ZD' }
  ],
  'forwarder options should be derived from available rate cards and include ZD'
);

assert.deepEqual(
  transportOptionsForForwarder('ZD', routes).map((option) => option.value),
  ['SEA', 'AIR'],
  'ZD should expose both published Saudi air and sea routes'
);

assert.deepEqual(
  transportOptionsForForwarder('YITE', routes).map((option) => option.value),
  ['SEA'],
  'existing forwarders should keep only their available transport modes'
);
