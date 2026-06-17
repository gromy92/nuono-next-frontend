import type { OfficialWarehouseAsn } from './api'
import { buildFbnTransferPrintHtml, buildFbnTransferPrintModel, buildFbnTransferQrValue } from './printFbnTransferPdf'

const scheduledAsn: OfficialWarehouseAsn = {
  id: '500033',
  inboundNo: 'OWA-500033',
  localAsnNo: 'OWA-500033',
  storeCode: 'STR108065-NAE',
  storeName: 'canman',
  siteCode: 'AE',
  projectCode: 'PRJ108065',
  partnerId: '108065',
  status: 'LINES_CREATED',
  asnNo: 'A05546141PN',
  noonAsnNr: 'A05546141PN',
  noonUser: 'gromy92@163.com',
  productCount: 2,
  totalQuantity: 20,
  selectedWarehouseCode: 'W00816026AE',
  selectedWarehousePartnerCode: 'AUH01S',
  selectedWarehouseName: 'AUH01S',
  createdAt: '2026-06-17 09:45:51',
  updatedAt: '2026-06-17 09:55:20',
  appointment: {
    id: '610027',
    asnId: '500033',
    localAsnNo: 'OWA-500033',
    noonAsnNr: 'A05546141PN',
    storeCode: 'STR108065-NAE',
    siteCode: 'AE',
    status: 'SCHEDULED',
    warehouseFrom: 'CHICSONGCANGAE',
    warehouseToPartnerCode: 'AUH01S',
    warehouseToCode: 'W00816026AE',
    apStartDate: '2026-06-17',
    apEndDate: '2026-06-26',
    appointmentDate: '2026-06-19',
    appointmentSlotId: 60,
    appointmentTime: '8pm-9pm',
    gate: 'Gate 2 Truck Entry',
    docks: '36,37,38,39,40,41,42',
    createdAt: '2026-06-17 09:46:20',
    updatedAt: '2026-06-17 09:55:20'
  },
  lines: [
    {
      id: '510005',
      productVariantId: '53600',
      skuParent: 'Z1ADA2A4C5647118A02B8Z',
      partnerSku: 'PAPERSAYSB372',
      childSku: 'Z1ADA2A4C5647118A02B8Z-1',
      pskuCode: 'ae25f97755ca08c4ae0e987a6d0ba0ca',
      noonSku: 'Z1ADA2A4C5647118A02B8Z-1',
      title: '10个白色纸品',
      titleEn: 'White Paper Board Set',
      brand: 'PAPERSAYS',
      imageUrl: 'https://example.test/product-1.jpeg',
      quantity: 10,
      cubicFeet: 0.02924,
      storageTypeCode: 'standard',
      noonClusterCode: 'yalla_pick',
      lineStatus: 'CREATED'
    }
  ]
}

const model = buildFbnTransferPrintModel(scheduledAsn, {
  qrCodeDataUrl: 'data:image/png;base64,qr'
})

if (model.asnNo !== 'A05546141PN') {
  throw new Error('expected Noon ASN number in print model')
}

if (model.asnNo.includes('OWA-')) {
  throw new Error('print model must not expose local OWA number')
}

const qrValue = buildFbnTransferQrValue(scheduledAsn)
if (qrValue !== 'A05546141PN') {
  throw new Error(`expected QR code to encode ASN only, got: ${qrValue}`)
}

if (qrValue.includes('fbn.noon.partners')) {
  throw new Error('QR code must not encode Noon detail URL')
}

const html = buildFbnTransferPrintHtml(model)
const visibleText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

for (const expected of [
  'FBN Transfers',
  'ASN : A05546141PN',
  'Printed by : gromy92@163.com',
  'Partner : canman',
  'Partner ID : 108065',
  'To : AUH01S',
  'Status : scheduled',
  'Created At : 2026-06-17',
  'Scheduled at : 2026-06-19',
  'Schedule slot : 8pm-9pm',
  'Gate : Gate 2 Truck Entry',
  'Docks : 36,37,38,39,40,41,42',
  'Partner Barcode',
  'Partner SKU',
  'SKU',
  'Quantity',
  'White Paper Board Set',
  'PAPERSAYS',
  'PAPERSAYSB372',
  'Z1ADA2A4C5647118A02B8Z-1'
]) {
  if (!visibleText.includes(expected)) {
    throw new Error(`expected generated print HTML to include: ${expected}`)
  }
}

for (const unexpected of ['10个白色纸品', 'yalla_pick']) {
  if (visibleText.includes(unexpected)) {
    throw new Error(`expected generated print HTML not to include: ${unexpected}`)
  }
}
