export const importPreviewWithErrors = {
  importBatchId: 56010,
  mode: 'local-db',
  ready: true,
  status: 'has_errors',
  fileName: '错误在途.csv',
  totalRowCount: 1,
  validRowCount: 0,
  errorCount: 1,
  warningCount: 1,
  willCreateBatchCount: 1,
  willUpsertLineCount: 1,
  issues: [
    {
      level: 'error',
      code: 'transport_mode_invalid',
      message: '运输方式只支持海运或空运。',
      rowNumber: 2,
      field: 'transportMode'
    },
    {
      level: 'warning',
      code: 'forwarder_unmatched',
      message: '货代未归一，确认导入后会保留原始货代名称。',
      rowNumber: 2,
      field: 'rawForwarderName'
    }
  ],
  batches: [
    {
      batchKey: 'BATCH-ERR',
      batchReferenceNo: 'BATCH-ERR',
      rawForwarderName: '历史货代X',
      forwarderQualityStatus: 'forwarder_unmatched',
      transportMode: null,
      targetStoreCode: 'DB',
      targetSiteCode: null,
      targetWarehouseName: 'FBN-DXB',
      lines: [
        {
          rowNumber: 2,
          boxNo: 'XGGEUAE04029-1',
          psku: 'PSKU-ERR',
          sku: 'SKU-ERR',
          shippedQuantity: null,
          receivedQuantity: 0,
          issues: [
            {
              level: 'error',
              code: 'transport_mode_invalid',
              message: '运输方式只支持海运或空运。',
              rowNumber: 2,
              field: 'transportMode'
            }
          ]
        }
      ],
      issues: []
    }
  ]
}

export const importPreviewReady = {
  importBatchId: 56011,
  mode: 'local-db',
  ready: true,
  status: 'ready',
  fileName: '历史在途.csv',
  totalRowCount: 2,
  validRowCount: 2,
  errorCount: 0,
  warningCount: 0,
  willCreateBatchCount: 1,
  willUpsertLineCount: 2,
  issues: [],
  batches: [
    {
      batchKey: 'BATCH-IMP',
      batchReferenceNo: 'BATCH-IMP',
      rawForwarderName: '义特',
      standardForwarderId: 51001,
      standardForwarderName: '义特',
      forwarderQualityStatus: 'forwarder_matched',
      transportMode: 'SEA',
      targetStoreCode: 'DB',
      targetSiteCode: null,
      targetWarehouseName: 'FBN-DXB',
      etaDate: '2026-06-20',
      trackingNo: 'TRK-IMP',
      lines: [
        {
          rowNumber: 2,
          boxNo: 'XGGEUAE04029-1',
          psku: 'PSKU-IMP-001',
          sku: 'SKU-IMP-001',
          shippedQuantity: 10,
          receivedQuantity: 0,
          issues: []
        },
        {
          rowNumber: 3,
          boxNo: 'XGGEUAE04029-2',
          psku: 'PSKU-IMP-002',
          sku: 'SKU-IMP-002',
          shippedQuantity: 8,
          receivedQuantity: 2,
          issues: []
        }
      ],
      issues: []
    }
  ]
}
