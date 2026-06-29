import QRCode from 'qrcode'
import type { OfficialWarehouseAsn, OfficialWarehouseAsnLine } from './api'
import { officialWarehousePublicAsnNo } from './domain'

const DEFAULT_QR_CODE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
const NOON_LOGO_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTczIiBoZWlnaHQ9IjQ4IiB2aWV3Qm94PSIwIDAgMTczIDQ4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTYxLjcwNiA5LjY3ODMzQzE1OC42MzkgOS42NzgzMyAxNTUuODU1IDEwLjY3NiAxNTMuNzIgMTIuNTEyOEwxNTMuMTA1IDEwLjMzNTdIMTQ3LjY5MlYzNy43MDYzSDE1NC41NzNWMjIuODM0NUMxNTQuNTczIDE5LjY2OSAxNTYuNjk1IDE2LjQ2MTUgMTYwLjc0NiAxNi40NjE1QzE2My45MTYgMTYuNDYxNSAxNjUuODA0IDE4LjY5NDYgMTY1LjgwNCAyMi40Mjg5VjM3LjcxMUgxNzIuNjg1VjIxLjkyNTRDMTcyLjY4NSAxNC40ODQ5IDE2OC4zNzggOS42NzgzMyAxNjEuNzA2IDkuNjc4MzNaTTEwNi43MDkgMjRDMTA2LjcwOSAyOC4zNjgzIDEwMy44NiAzMS41Mzg1IDk5LjkzMDEgMzEuNTM4NUM5NiAzMS41Mzg1IDkzLjE1MTUgMjguMzY4MyA5My4xNTE1IDI0QzkzLjE1MTUgMTkuNjMxNyA5NiAxNi40NjE1IDk5LjkzMDEgMTYuNDYxNUMxMDMuODU1IDE2LjQ2MTUgMTA2LjcwOSAxOS42MzE3IDEwNi43MDkgMjRaTTk5LjkyNTQgOS42NzgzM0M5Mi4yMDk4IDkuNjc4MzMgODYuMTYzMiAxNS45Njc0IDg2LjE2MzIgMjMuOTk1M0M4Ni4xNjMyIDMyLjAyMzMgOTIuMjA1MSAzOC4zMTcgOTkuOTI1NCAzOC4zMTdDMTA3LjY0MSAzOC4zMTcgMTEzLjY4OCAzMi4wMjggMTEzLjY4OCAyMy45OTUzQzExMy42ODggMTUuOTY3NCAxMDcuNjQ2IDkuNjc4MzMgOTkuOTI1NCA5LjY3ODMzWk0xMzYuNzc5IDI0QzEzNi43NzkgMjguMzY4MyAxMzMuOTI1IDMxLjUzODUgMTMwIDMxLjUzODVDMTI2LjA3NSAzMS41Mzg1IDEyMy4yMjEgMjguMzY4MyAxMjMuMjIxIDI0QzEyMy4yMjEgMTkuNjMxNyAxMjYuMDc1IDE2LjQ2MTUgMTMwIDE2LjQ2MTVDMTMzLjkzIDE2LjQ2MTUgMTM2Ljc3OSAxOS42MzE3IDEzNi43NzkgMjRaTTEzMCA5LjY3ODMzQzEyMi4yODQgOS42NzgzMyAxMTYuMjM4IDE1Ljk2NzQgMTE2LjIzOCAyMy45OTUzQzExNi4yMzggMzIuMDIzMyAxMjIuMjggMzguMzE3IDEzMCAzOC4zMTdDMTM3LjcxNiAzOC4zMTcgMTQzLjc2MiAzMi4wMjggMTQzLjc2MiAyMy45OTUzQzE0My43NjIgMTUuOTY3NCAxMzcuNzIgOS42NzgzMyAxMzAgOS42NzgzM1pNNzEuMjU4NyA5LjY3ODMzQzY4LjE5NTggOS42NzgzMyA2NS40MDc5IDEwLjY3NiA2My4yNjgxIDEyLjUxMjhMNjIuNjUyNyAxMC4zMzU3SDU3LjI0NDhWMzcuNzA2M0g2NC4xMjU5VjIyLjgzNDVDNjQuMTI1OSAxOS42NjkgNjYuMjQ3MSAxNi40NjE1IDcwLjI5ODQgMTYuNDYxNUM3My40Njg1IDE2LjQ2MTUgNzUuMzU2NiAxOC42OTQ2IDc1LjM1NjYgMjIuNDI4OVYzNy43MTFIODIuMjM3N1YyMS45MjU0QzgyLjIzNzcgMTQuNDg0OSA3Ny45MzAxIDkuNjc4MzMgNzEuMjU4NyA5LjY3ODMzWiIgZmlsbD0iIzQwNDU1MyIvPgo8cGF0aCBkPSJNMCAyNS4xMzc1QzAgMzguMDA0NyAxMC45MzcxIDQ4IDIzLjY1MDMgNDhDMzYuOTYwNCA0OCA0Ny43NDgyIDM3LjI2MzQgNDcuNzQ4MiAyNC4xNDkyQzQ3Ljc0ODIgMTYuNDgwMiA0NC4wMzczIDkuNzQ4MjUgMzguNTQ1NSA1LjI0OTQyTDM0LjUzNjEgMTIuMTc3MkMzNy44NTA4IDE0Ljk5NzcgNDAuMTI1OSAxOS4zNTIgNDAuMTI1OSAyNC4yNTE3QzQwLjEyNTkgMzMuMTU2MiAzMi43NTUyIDQwLjQ4MDIgMjMuNjUwMyA0MC40ODAyQzE0LjU5NjcgNDAuNDgwMiA3LjIyMTQ0IDMzLjE1NjIgNy4yMjE0NCAyNC4wMDQ3QzcuMjIxNDQgMjIuOTEzOCA3LjMxOTM1IDIxLjgyNzUgNy41MTk4MSAyMC43ODc5TDAgMjUuMTM3NVpNMzEuMDcyMyAxLjE4ODgxQzI4Ljc5NzIgMC4zNDQ5ODggMjYuNzY5MiAwIDI0Ljc0MTMgMEMyMy4yMDc1IDAgMjEuODY5NSAwLjE5NTgwNCAyMC44ODExIDAuMzk2MjdMMTUuNzM0MyA5LjMwMDdDMTcuNjEzMSA4LjIxNDQ1IDIwLjAzNzMgNy42MTc3MiAyMi42NjIgNy42MTc3MkMyNC4xOTU4IDcuNjE3NzIgMjUuNTgwNCA3LjgxMzUyIDI3LjAxNjMgOC4yMDk3OUwzMS4wNzIzIDEuMTg4ODFaIiBmaWxsPSIjNDA0NTUzIi8+Cjwvc3ZnPgo='

export type FbnTransferPrintOptions = {
  printedBy?: string
  qrCodeDataUrl?: string
}

export type FbnTransferPrintLine = {
  name: string
  subLabel: string
  imageUrl?: string
  partnerBarcode: string
  partnerSku: string
  noonSku: string
  quantity: number
}

export type FbnTransferPrintModel = {
  title: string
  asnNo: string
  printedBy: string
  partner: string
  partnerId: string
  date: string
  toWarehouse: string
  status: string
  createdAt: string
  scheduledAt: string
  scheduleSlot: string
  gate: string
  docks: string
  qrCodeDataUrl: string
  lines: FbnTransferPrintLine[]
}

export function buildFbnTransferPrintModel(
  asn: OfficialWarehouseAsn,
  options: FbnTransferPrintOptions = {}
): FbnTransferPrintModel {
  const appointment = asn.appointment
  const asnNo = officialWarehousePublicAsnNo(asn)
  return {
    title: 'FBN Transfers',
    asnNo,
    printedBy: textOrDash(options.printedBy || asn.noonUser),
    partner: textOrDash(asn.storeName || asn.storeCode),
    partnerId: textOrDash(asn.partnerId),
    date: dateOnly(asn.createdAt || appointment?.appointmentDate || appointment?.createdAt),
    toWarehouse: textOrDash(appointment?.warehouseToPartnerCode || asn.selectedWarehousePartnerCode || asn.selectedWarehouseName),
    status: normalizeStatus(appointment?.status || asn.status),
    createdAt: dateOnly(asn.createdAt || asn.submittedAt || appointment?.createdAt),
    scheduledAt: dateOnly(appointment?.appointmentDate),
    scheduleSlot: textOrDash(appointment?.appointmentTime),
    gate: textOrDash(appointment?.gate),
    docks: textOrDash(appointment?.docks),
    qrCodeDataUrl: options.qrCodeDataUrl || DEFAULT_QR_CODE,
    lines: (asn.lines || []).map(toPrintLine)
  }
}

export function buildFbnTransferPrintHtml(model: FbnTransferPrintModel) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>FBN print</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 13mm 16mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      color: #303846;
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 14px;
      line-height: 1.35;
    }
    .fbn-page {
      width: 100%;
      max-width: 1074px;
      margin: 0 auto;
      border: 1px solid #e2e5ea;
      background: #ffffff;
    }
    .fbn-logo {
      height: 112px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 1px solid #e2e5ea;
    }
    .fbn-logo-image {
      width: 173px;
      height: 48px;
      display: block;
    }
    .fbn-transfer-head {
      min-height: 144px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 26px 38px;
      border-bottom: 1px solid #e2e5ea;
    }
    .fbn-title {
      font-size: 34px;
      font-weight: 400;
      color: #424957;
    }
    .fbn-qr {
      width: 116px;
      height: 116px;
      object-fit: contain;
    }
    .fbn-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 72px;
      padding: 18px 16px 34px;
      border-bottom: 1px solid #e2e5ea;
    }
    .fbn-field {
      display: grid;
      grid-template-columns: 156px minmax(0, 1fr);
      align-items: baseline;
      min-height: 28px;
      color: #303846;
    }
    .fbn-label {
      font-weight: 700;
      color: #444b58;
      white-space: nowrap;
    }
    .fbn-value {
      overflow-wrap: anywhere;
      text-align: right;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    thead th {
      color: #444b58;
      background: #eeeeee;
      font-size: 16px;
      font-weight: 700;
      text-align: left;
      white-space: normal;
      padding: 18px 14px;
      border-right: none;
      border-bottom: 1px solid #e2e5ea;
    }
    tbody td {
      min-height: 118px;
      padding: 18px 16px;
      vertical-align: middle;
      color: #303846;
      border-right: none;
      border-bottom: 1px solid #e7e9ee;
      overflow-wrap: anywhere;
    }
    .fbn-name-column {
      width: 39%;
    }
    .fbn-barcode-column {
      width: 13%;
    }
    .fbn-partner-sku-column {
      width: 12%;
    }
    .fbn-sku-column {
      width: 24%;
    }
    .fbn-quantity-column {
      width: 12%;
    }
    .fbn-product {
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr);
      gap: 12px;
      align-items: center;
    }
    .fbn-product-image {
      width: 40px;
      height: 54px;
      border: none;
      object-fit: contain;
      background: #f7f9fc;
    }
    .fbn-image-placeholder {
      width: 40px;
      height: 54px;
      border: 1px solid #e2e5ea;
      background: #f7f9fc;
    }
    .fbn-product-title {
      font-weight: 400;
      color: #424957;
      margin-bottom: 6px;
    }
    .fbn-product-sub {
      color: #424957;
      font-size: 14px;
    }
    .fbn-quantity {
      text-align: center;
      font-weight: 400;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .fbn-page {
        max-width: none;
        margin: 0 auto;
      }
    }
  </style>
</head>
<body>
  <div class="fbn-page">
    <div class="fbn-logo">
      <img class="fbn-logo-image" src="${escapeAttribute(NOON_LOGO_DATA_URL)}" alt="noon" />
    </div>
    <div class="fbn-transfer-head">
      <div class="fbn-title">${escapeHtml(model.title)}</div>
      <img class="fbn-qr" src="${escapeAttribute(model.qrCodeDataUrl)}" alt="ASN QR Code" />
    </div>
    <section class="fbn-info">
      ${infoField('ASN', model.asnNo)}
      ${infoField('To', model.toWarehouse)}
      ${infoField('Printed by', model.printedBy)}
      ${infoField('Status', model.status)}
      ${infoField('Partner', model.partner)}
      ${infoField('Created At', model.createdAt)}
      ${infoField('Partner ID', model.partnerId)}
      ${infoField('Scheduled at', model.scheduledAt)}
      ${infoField('Date', model.date)}
      ${infoField('Schedule slot', model.scheduleSlot)}
      <div></div>
      ${infoField('Gate', model.gate)}
      <div></div>
      ${infoField('Docks', model.docks)}
    </section>
    <table>
      <thead>
        <tr>
          <th class="fbn-name-column">Name</th>
          <th class="fbn-barcode-column">Partner Barcode</th>
          <th class="fbn-partner-sku-column">Partner SKU</th>
          <th class="fbn-sku-column">SKU</th>
          <th class="fbn-quantity-column">Quantity</th>
        </tr>
      </thead>
      <tbody>
        ${model.lines.length ? model.lines.map(lineHtml).join('') : emptyLineHtml()}
      </tbody>
    </table>
  </div>
  <script>
    window.addEventListener('load', function () {
      var images = Array.prototype.slice.call(document.images || []);
      var waits = images.map(function (image) {
        if (image.complete) return Promise.resolve();
        return new Promise(function (resolve) {
          image.onload = resolve;
          image.onerror = resolve;
        });
      });
      Promise.all(waits).then(function () {
        window.setTimeout(function () {
          window.focus();
          window.print();
        }, 250);
      });
    });
  </script>
</body>
</html>`
}

export async function printFbnTransferPdf(
  asn: OfficialWarehouseAsn,
  options: Omit<FbnTransferPrintOptions, 'qrCodeDataUrl'> = {}
) {
  const printWindow = window.open('', '_blank', 'width=1080,height=760')
  if (!printWindow) {
    throw new Error('浏览器阻止了 PDF 打印窗口，请允许弹窗后重试。')
  }
  printWindow.document.open()
  printWindow.document.write(buildPrintLoadingHtml())
  printWindow.document.close()

  const qrCodeDataUrl = await QRCode.toDataURL(buildFbnTransferQrValue(asn), {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 148
  })
  const model = buildFbnTransferPrintModel(asn, { ...options, qrCodeDataUrl })
  printWindow.document.open()
  printWindow.document.write(buildFbnTransferPrintHtml(model))
  printWindow.document.close()
  return model
}

function buildPrintLoadingHtml() {
  return `<!doctype html><html><head><meta charset="utf-8" /><title>FBN print</title></head><body style="font-family: Arial, Helvetica, sans-serif; color: #303846;">Loading FBN print...</body></html>`
}

function toPrintLine(line: OfficialWarehouseAsnLine): FbnTransferPrintLine {
  const partnerSku = textOrDash(line.partnerSku)
  return {
    name: textOrDash(line.titleEn || line.title || line.partnerSku || line.noonSku || line.childSku),
    subLabel: textOrDash(line.brand),
    imageUrl: line.imageUrl,
    partnerBarcode: partnerSku === '-' ? textOrDash(line.pskuCode) : partnerSku,
    partnerSku,
    noonSku: textOrDash(line.noonSku || line.childSku),
    quantity: line.quantity || 0
  }
}

function infoField(label: string, value: string) {
  return `<div class="fbn-field"><span class="fbn-label">${escapeHtml(label)} :</span><span class="fbn-value">${escapeHtml(value)}</span></div>`
}

function lineHtml(line: FbnTransferPrintLine) {
  const image = line.imageUrl
    ? `<img class="fbn-product-image" src="${escapeAttribute(line.imageUrl)}" alt="" />`
    : '<div class="fbn-image-placeholder"></div>'
  return `<tr>
    <td>
      <div class="fbn-product">
        ${image}
        <div>
          <div class="fbn-product-title">${escapeHtml(line.name)}</div>
          <div class="fbn-product-sub">${escapeHtml(line.subLabel)}</div>
        </div>
      </div>
    </td>
    <td>${escapeHtml(line.partnerBarcode)}</td>
    <td>${escapeHtml(line.partnerSku)}</td>
    <td>${escapeHtml(line.noonSku)}</td>
    <td class="fbn-quantity">${escapeHtml(String(line.quantity))}</td>
  </tr>`
}

function emptyLineHtml() {
  return `<tr><td colspan="5">No product lines</td></tr>`
}

function textOrDash(value?: string | number | null) {
  const text = value == null ? '' : String(value).trim()
  return text || '-'
}

function dateOnly(value?: string | null) {
  const text = textOrDash(value)
  if (text === '-') {
    return text
  }
  return text.slice(0, 10)
}

function normalizeStatus(value?: string) {
  const text = textOrDash(value)
  if (text === '-') {
    return text
  }
  return text.toLowerCase()
}

export function buildFbnTransferQrValue(asn: OfficialWarehouseAsn) {
  const asnNo = officialWarehousePublicAsnNo(asn)
  if (asnNo && asnNo !== '-') {
    return asnNo
  }
  return JSON.stringify({ asnId: asn.id, storeCode: asn.storeCode, siteCode: asn.siteCode })
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, '&#96;')
}
