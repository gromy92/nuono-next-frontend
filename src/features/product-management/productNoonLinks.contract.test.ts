import { strict as assert } from 'node:assert';
import { buildNoonCatalogProductUrl } from './utils/noonLinks';

const catalogUrl = buildNoonCatalogProductUrl(
  {
    mode: 'local-db',
    ready: true,
    warnings: [],
    missingCoreTables: [],
    storeContext: {
      projectCode: 'PRJ245027',
      storeCode: 'STR245027-NSA',
      site: 'SA'
    },
    identity: {
      skuParent: 'LOCAL-test1101-BB94AFB3',
      currentZCode: 'LOCAL-test1101-BB94AFB3',
      partnerSku: 'test1101'
    },
    taxonomy: {},
    content: {},
    platformSignals: {},
    keyAttributes: [],
    group: {},
    variants: [],
    pricing: {},
    stock: {},
    siteOffers: []
  },
  {
    skuParent: 'Z969841F40C0A66A4ABDFZ',
    pskuCode: 'a987842bfa49b3fe93e54d7fe663b14a',
    offerCode: 'Z969841F40C0A66A4ABDFZ',
    childSku: 'test1101',
    partnerSku: 'test1101'
  }
);

assert.ok(catalogUrl, 'catalog URL should be generated after real listing returned Noon identifiers');
assert.match(
  catalogUrl,
  /\/en\/catalog\/Z969841F40C0A66A4ABDFZ\/d\?/,
  'catalog URL path must prefer real Noon skuParent over LOCAL draft skuParent'
);
assert.match(
  catalogUrl,
  /(?:\?|&)code=a987842bfa49b3fe93e54d7fe663b14a(?:&|$)/,
  'catalog URL code must use Noon pskuCode, not system PSKU'
);
assert.doesNotMatch(catalogUrl, /LOCAL-test1101-BB94AFB3/, 'catalog URL must not expose LOCAL draft skuParent');
assert.doesNotMatch(catalogUrl, /(?:\?|&)code=test1101(?:&|$)/, 'catalog URL code must not use system PSKU');
