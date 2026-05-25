import type {
  AiParseDocumentStandard,
  AiParseStoreOption,
  AiParseTargetOutputPlan
} from './types';

export const aiParseStandards: AiParseDocumentStandard[] = [
  {
    id: 'std-official-commission-v202605',
    documentType: 'OFFICIAL_COMMISSION',
    documentName: '官方佣金方案',
    standardVersion: 'STD-2026.05',
    description: '按国家、平台、类目和金额阶梯归一佣金规则。',
    active: true,
    supportedInputs: ['EXCEL', 'PDF', 'IMAGE', 'OCR_TEXT', 'MANUAL_TEXT'],
    businessScopeFields: [
      { key: 'country', label: '国家', type: 'enum', options: ['SA', 'AE'], required: true },
      { key: 'platform', label: '平台', type: 'enum', options: ['Noon', 'Amazon'], required: true },
      { key: 'feeStage', label: '费用阶段', type: 'enum', options: ['FBN', 'FBP', '平台基础费'], required: true }
    ],
    resultFields: [
      { key: 'country', label: '国家', type: 'enum', options: ['KSA', 'UAE'], tableVisible: true, width: 88 },
      { key: 'platform', label: '平台', type: 'enum', options: ['Noon'], tableVisible: true, width: 90 },
      { key: 'fulfillmentType', label: '履约方式', type: 'enum', options: ['FBN', 'FBP'], tableVisible: true, width: 100 },
      { key: 'parentCategoryName', label: '一级类目', type: 'text', tableVisible: true, width: 150 },
      { key: 'categoryName', label: '类目', type: 'text', required: true, tableVisible: true, width: 220 },
      { key: 'categoryPath', label: '类目路径', type: 'text', tableVisible: false, width: 260 },
      { key: 'brandRestriction', label: '品牌限制', type: 'text', tableVisible: true, width: 150 },
      { key: 'amountRangeLabel', label: '计佣金额区间', type: 'text', required: true, tableVisible: true, width: 150 },
      { key: 'amountCurrency', label: '币种', type: 'enum', options: ['SAR', 'AED'], required: true, tableVisible: true, width: 90 },
      { key: 'commissionRate', label: '佣金率', type: 'text', required: true, tableVisible: true, width: 100 },
      { key: 'effectiveDate', label: '生效日期', type: 'date', tableVisible: true, width: 130 },
      { key: 'amountMin', label: '金额下限', type: 'number', tableVisible: false },
      { key: 'amountMinInclusive', label: '下限含边界', type: 'boolean', tableVisible: false },
      { key: 'amountMax', label: '金额上限', type: 'number', tableVisible: false },
      { key: 'amountMaxInclusive', label: '上限含边界', type: 'boolean', tableVisible: false }
    ],
    itemTypes: [
      { value: 'commission_rule', label: '佣金规则' },
      { value: 'platform_fee', label: '平台费用' }
    ],
    publishAdapterLabel: '官方费用版本'
  },
  {
    id: 'std-logistics-rule-v202605',
    documentType: 'LOGISTICS_RULE',
    documentName: '物流规则方案',
    standardVersion: 'STD-2026.05',
    description: '按国家、履约方式、运输方式和费用项归一物流计费规则。',
    active: true,
    supportedInputs: ['EXCEL', 'PDF', 'IMAGE', 'OCR_TEXT', 'MANUAL_TEXT'],
    businessScopeFields: [
      { key: 'country', label: '国家', type: 'enum', options: ['SA', 'AE'], required: true },
      { key: 'fulfillmentMode', label: '履约方式', type: 'enum', options: ['FBN', 'FBP', '海外仓'], required: true },
      { key: 'warehouseCity', label: '仓库城市', type: 'enum', options: ['迪拜', '利雅得', '吉达'], required: true }
    ],
    resultFields: [
      { key: 'transportMode', label: '运输方式', type: 'enum', options: ['海运', '空运', '快递', '海外仓'], tableVisible: true, width: 100 },
      { key: 'feeItem', label: '费用项', type: 'text', required: true, tableVisible: true, width: 140 },
      { key: 'billingFormula', label: '计费内容', type: 'text', required: true, tableVisible: true, width: 220 },
      { key: 'currency', label: '币种', type: 'enum', options: ['CNY', 'AED', 'SAR', 'USD'], tableVisible: true, width: 86 },
      { key: 'minCharge', label: '最低收费', type: 'money', tableVisible: false }
    ],
    itemTypes: [
      { value: 'base_price', label: '基础价格' },
      { value: 'surcharge', label: '附加费用' },
      { value: 'calculation_rule', label: '计费规则' }
    ],
    publishAdapterLabel: '物流规则版本'
  },
  {
    id: 'std-outbound-fee-v202605',
    documentType: 'OFFICIAL_OUTBOUND_FEE',
    documentName: '官方出仓费方案',
    standardVersion: 'STD-2026.05',
    description: '按国家、平台、履约方式、规格分类、重量费用和计算策略归一官方出仓费规则。',
    active: true,
    supportedInputs: ['EXCEL', 'PDF', 'IMAGE', 'OCR_TEXT', 'MANUAL_TEXT'],
    businessScopeFields: [
      { key: 'country', label: '国家', type: 'enum', options: ['SA', 'AE'], required: true },
      { key: 'platform', label: '平台', type: 'enum', options: ['Noon'], required: true },
      { key: 'feeStage', label: '费用阶段', type: 'enum', options: ['出仓费'], required: true }
    ],
    resultFields: [
      { key: 'country', label: '国家', type: 'enum', options: ['SA', 'AE'], tableVisible: true, width: 88 },
      { key: 'classificationName', label: '规格分类', type: 'text', required: true, tableVisible: true, width: 140 },
      { key: 'longestSideMaxCm', label: '最长边上限', type: 'number', tableVisible: true, width: 120 },
      { key: 'maxShippingWeightGrams', label: '最大发货重量', type: 'number', tableVisible: true, width: 140 },
      { key: 'packagingWeightGrams', label: '包装重量', type: 'number', tableVisible: true, width: 110 },
      { key: 'weightMaxGrams', label: '重量上限', type: 'number', tableVisible: true, width: 110 },
      { key: 'standardFeeAmount', label: '标准费用', type: 'money', required: true, tableVisible: true, width: 110 },
      { key: 'highAspFeeAmount', label: '高客单价费用', type: 'money', tableVisible: true, width: 130 },
      { key: 'currency', label: '币种', type: 'enum', options: ['SAR', 'AED'], tableVisible: true, width: 86 },
      { key: 'shippingWeightFormula', label: '发货重量公式', type: 'text', tableVisible: true, width: 180 },
      { key: 'effectiveDate', label: '生效日期', type: 'date', tableVisible: false }
    ],
    itemTypes: [
      { value: 'outbound_fee_rule', label: '出仓费规则' },
      { value: 'outbound_size_classification_rule', label: '出仓费规格分级' },
      { value: 'outbound_fee_weight_slab_rule', label: '出仓费重量费用' },
      { value: 'outbound_fee_calculation_policy', label: '出仓费计算策略' }
    ],
    publishAdapterLabel: '官方出仓费版本'
  }
];

export const aiParseStores: AiParseStoreOption[] = [
  {
    id: 'store-xingyao',
    projectName: 'xingyao',
    projectCode: 'PRJ245027',
    ownerName: '系统管理员',
    sites: ['SA', 'AE']
  },
  {
    id: 'store-canman',
    projectName: 'canman',
    projectCode: 'PRJ108065',
    ownerName: '毕翠红',
    sites: ['SA', 'AE']
  },
  {
    id: 'store-miya',
    projectName: 'miya',
    projectCode: 'PRJ56726',
    ownerName: 'Miya',
    sites: ['SA']
  }
];

export const aiParseTargetOutputPlans: AiParseTargetOutputPlan[] = [
  {
    id: 'plan-commission-ksa',
    label: '佣金-KSA',
    documentType: 'OFFICIAL_COMMISSION',
    documentName: '官方佣金方案',
    standardId: 'std-official-commission-v202605',
    standardVersion: 'STD-2026.05',
    storeId: 'store-xingyao',
    storeLabel: 'xingyao / PRJ245027',
    businessScope: {
      country: 'SA',
      platform: 'Noon',
      feeStage: 'FBN'
    },
    currentVersion: 'COMM-2026-04-xingyao-KSA',
    description: 'Noon KSA FBN 官方佣金输出'
  },
  {
    id: 'plan-commission-uae',
    label: '佣金-UAE',
    documentType: 'OFFICIAL_COMMISSION',
    documentName: '官方佣金方案',
    standardId: 'std-official-commission-v202605',
    standardVersion: 'STD-2026.05',
    storeId: 'store-xingyao',
    storeLabel: 'xingyao / PRJ245027',
    businessScope: {
      country: 'AE',
      platform: 'Noon',
      feeStage: 'FBN'
    },
    currentVersion: 'COMM-2026-04-xingyao',
    description: 'Noon UAE FBN 官方佣金输出'
  },
  {
    id: 'plan-outbound-fee-ksa',
    label: '出仓费-KSA',
    documentType: 'OFFICIAL_OUTBOUND_FEE',
    documentName: '官方出仓费方案',
    standardId: 'std-outbound-fee-v202605',
    standardVersion: 'STD-2026.05',
    storeId: 'store-xingyao',
    storeLabel: 'xingyao / PRJ245027',
    businessScope: {
      country: 'SA',
      platform: 'Noon',
      feeStage: '出仓费'
    },
    currentVersion: 'OUTBOUND-2026-04-xingyao-KSA',
    description: 'Noon KSA 官方出仓费输出'
  },
  {
    id: 'plan-outbound-fee-uae',
    label: '出仓费-UAE',
    documentType: 'OFFICIAL_OUTBOUND_FEE',
    documentName: '官方出仓费方案',
    standardId: 'std-outbound-fee-v202605',
    standardVersion: 'STD-2026.05',
    storeId: 'store-xingyao',
    storeLabel: 'xingyao / PRJ245027',
    businessScope: {
      country: 'AE',
      platform: 'Noon',
      feeStage: '出仓费'
    },
    currentVersion: 'OUTBOUND-2026-04-xingyao-UAE',
    description: 'Noon UAE 官方出仓费输出'
  },
  {
    id: 'plan-logistics-yite',
    label: '物流-义特',
    documentType: 'LOGISTICS_RULE',
    documentName: '物流规则方案',
    standardId: 'std-logistics-rule-v202605',
    standardVersion: 'STD-2026.05',
    storeId: 'store-canman',
    storeLabel: 'canman / PRJ108065',
    businessScope: {
      country: 'AE',
      fulfillmentMode: 'FBN',
      warehouseCity: '迪拜'
    },
    currentVersion: 'LOGI-YITE-2026-05',
    description: '义特物流报价规则输出'
  }
];
