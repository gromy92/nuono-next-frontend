export const FBN_TRANSFER_PRINT_STYLES = `
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
`
