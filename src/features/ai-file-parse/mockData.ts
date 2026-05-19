import type {
  AiParseDocumentStandard,
  AiParseInputRole,
  AiParseInputType,
  AiParseResultItem,
  AiParseStoreOption,
  AiParseTask,
  AiParseTaskInput,
  AiParseTaskStats,
  AiParseVersion,
  AiParseVersionSnapshotItem
} from './types';
import { initialParseLogs } from './mockLogs';

const nowLabel = '2026-05-09 16:20';

export { aiParseStandards, aiParseStores, aiParseTargetOutputPlans } from './mockCatalog';

const taskInputs: Record<string, AiParseTaskInput[]> = {
  'TASK-20260509-0001': [
    {
      id: 'input-001',
      inputType: 'EXCEL',
      inputRole: 'PRIMARY_SOURCE',
      displayName: 'Noon佣金表-2026-05.xlsx',
      detail: 'Sheet: AE_FBN, SA_FBN'
    },
    {
      id: 'input-002',
      inputType: 'PDF',
      inputRole: 'REFERENCE',
      displayName: 'Noon费用公告.pdf',
      detail: '第 3-5 页'
    },
    {
      id: 'input-003',
      inputType: 'IMAGE',
      inputRole: 'SUPPLEMENT',
      displayName: '佣金截图-手机壳.png',
      detail: '图片 OCR 区域 A2'
    },
    {
      id: 'input-004',
      inputType: 'MANUAL_TEXT',
      inputRole: 'SUPPLEMENT',
      displayName: '运营补充说明',
      detail: '运营确认 AE FBN 只看迪拜仓'
    }
  ],
  'TASK-20260509-0002': [
    {
      id: 'input-021',
      inputType: 'EXCEL',
      inputRole: 'PRIMARY_SOURCE',
      displayName: 'Noon出仓费-2026-05.xlsx',
      detail: 'Sheet: UAE_OUTBOUND, KSA_OUTBOUND'
    },
    {
      id: 'input-022',
      inputType: 'PDF',
      inputRole: 'REFERENCE',
      displayName: 'Noon仓储费用公告.pdf',
      detail: '第 2-3 页'
    }
  ],
  'TASK-20260508-0007': [
    {
      id: 'input-031',
      inputType: 'PDF',
      inputRole: 'PRIMARY_SOURCE',
      displayName: '义特沙特阿联酋FBN报价.pdf',
      detail: '第 1-2 页'
    },
    {
      id: 'input-032',
      inputType: 'EXCEL',
      inputRole: 'PARSED_FILE',
      displayName: '义特FBN报价解析后.xlsx',
      detail: '系统归档解析文件'
    }
  ]
};

export function buildTaskStats(items: AiParseResultItem[]): AiParseTaskStats {
  return {
    total: items.filter((item) => item.changeType !== 'delete_suspected').length,
    pending: items.filter((item) => item.reviewStatus === 'pending' && item.changeType !== 'delete_suspected').length,
    needsFix: items.filter((item) => item.reviewStatus === 'needs_fix').length,
    conflicts: items.filter(
      (item) => item.changeType === 'conflict' && !['confirmed', 'rejected', 'keep_old'].includes(item.reviewStatus)
    ).length,
    deleteSuspected: items.filter((item) => item.changeType === 'delete_suspected').length,
    hardErrors: items.filter((item) => item.reviewStatus === 'hard_error' || item.validationStatus === 'hard_error').length,
    confirmed: items.filter((item) => item.reviewStatus === 'confirmed').length
  };
}

export const initialParseItems: AiParseResultItem[] = [
  {
    id: 'item-001',
    taskId: 'TASK-20260509-0001',
    resultId: 'RESULT-20260509-0001-R1',
    itemType: 'commission_rule',
    itemTypeLabel: '佣金规则',
    naturalKey: 'AE + FBN + 手机壳',
    changeType: 'changed',
    reviewStatus: 'pending',
    confidence: 'high',
    summary: '手机壳佣金从 8% 调整为 9.5%',
    validationStatus: 'pass',
    validationMessage: '-',
    evidence: 'Noon佣金表-2026-05.xlsx / AE_FBN / 第 12 行',
    sourceInputIds: ['input-001'],
    fields: {
      country: 'AE',
      category: '手机壳',
      feeType: '佣金',
      commissionRate: 9.5,
      effectiveDate: '2026-05-15'
    },
    oldFields: {
      country: 'AE',
      category: '手机壳',
      feeType: '佣金',
      commissionRate: 8,
      effectiveDate: '2026-04-01'
    },
    changedFieldKeys: ['commissionRate', 'effectiveDate']
  },
  {
    id: 'item-002',
    taskId: 'TASK-20260509-0001',
    resultId: 'RESULT-20260509-0001-R1',
    itemType: 'platform_fee',
    itemTypeLabel: '平台费用',
    naturalKey: 'SA + FBN + 电子配件处理费',
    changeType: 'added',
    reviewStatus: 'confirmed',
    confidence: 'high',
    summary: '新增电子配件处理费 1.2 SAR/件',
    validationStatus: 'pass',
    validationMessage: '-',
    evidence: 'Noon费用公告.pdf / 第 4 页',
    sourceInputIds: ['input-002'],
    fields: {
      country: 'SA',
      category: '电子配件',
      feeType: '处理费',
      commissionRate: 1.2,
      effectiveDate: '2026-05-20'
    },
    changedFieldKeys: ['新增记录']
  },
  {
    id: 'item-003',
    taskId: 'TASK-20260509-0001',
    resultId: 'RESULT-20260509-0001-R1',
    itemType: 'commission_rule',
    itemTypeLabel: '佣金规则',
    naturalKey: 'AE + FBN + 儿童玩具',
    changeType: 'conflict',
    reviewStatus: 'needs_fix',
    confidence: 'medium',
    summary: '两个输入源识别出的佣金不一致',
    validationStatus: 'warning',
    validationMessage: 'Excel 为 12%，PDF 公告为 10%，需要人工选择。',
    evidence: 'Excel 第 18 行 / PDF 第 5 页',
    sourceInputIds: ['input-001', 'input-002'],
    fields: {
      country: 'AE',
      category: '儿童玩具',
      feeType: '佣金',
      commissionRate: 12,
      effectiveDate: '2026-05-15'
    },
    oldFields: {
      country: 'AE',
      category: '儿童玩具',
      feeType: '佣金',
      commissionRate: 10,
      effectiveDate: '2026-04-01'
    },
    changedFieldKeys: ['commissionRate']
  },
  {
    id: 'item-004',
    taskId: 'TASK-20260509-0001',
    resultId: 'RESULT-20260509-0001-R1',
    itemType: 'commission_rule',
    itemTypeLabel: '佣金规则',
    naturalKey: 'SA + FBN + 未识别类目',
    changeType: 'changed',
    reviewStatus: 'hard_error',
    confidence: 'low',
    summary: '缺少类目名称，不能发布',
    validationStatus: 'hard_error',
    validationMessage: '必填字段“类目”缺失。',
    evidence: '佣金截图-手机壳.png / OCR 区域 A2',
    sourceInputIds: ['input-003'],
    fields: {
      country: 'SA',
      category: '',
      feeType: '佣金',
      commissionRate: 7.5,
      effectiveDate: '2026-05-15'
    },
    oldFields: {
      country: 'SA',
      category: '未分类',
      feeType: '佣金',
      commissionRate: 7,
      effectiveDate: '2026-04-01'
    },
    changedFieldKeys: ['category', 'commissionRate']
  },
  {
    id: 'item-005',
    taskId: 'TASK-20260509-0001',
    resultId: 'RESULT-20260509-0001-R1',
    itemType: 'commission_rule',
    itemTypeLabel: '佣金规则',
    naturalKey: 'AE + FBN + 充电器',
    changeType: 'unchanged',
    reviewStatus: 'confirmed',
    confidence: 'high',
    summary: '充电器佣金保持 8%',
    validationStatus: 'pass',
    validationMessage: '-',
    evidence: 'Noon佣金表-2026-05.xlsx / AE_FBN / 第 21 行',
    sourceInputIds: ['input-001'],
    fields: {
      country: 'AE',
      category: '充电器',
      feeType: '佣金',
      commissionRate: 8,
      effectiveDate: '2026-04-01'
    },
    oldFields: {
      country: 'AE',
      category: '充电器',
      feeType: '佣金',
      commissionRate: 8,
      effectiveDate: '2026-04-01'
    },
    changedFieldKeys: []
  },
  {
    id: 'item-021',
    taskId: 'TASK-20260509-0002',
    resultId: 'RESULT-20260509-0002-R1',
    itemType: 'outbound_fee_rule',
    itemTypeLabel: '出仓费规则',
    naturalKey: 'AE + Noon + 标准件出仓费',
    changeType: 'added',
    reviewStatus: 'confirmed',
    confidence: 'high',
    summary: '新增 UAE 标准件出仓费 1.2 AED/件',
    validationStatus: 'pass',
    validationMessage: '-',
    evidence: 'Noon出仓费-2026-05.xlsx / UAE_OUTBOUND / 第 6 行',
    sourceInputIds: ['input-021'],
    fields: {
      country: 'AE',
      feeItem: '标准件出仓费',
      chargeMode: '按件',
      amount: 1.2,
      currency: 'AED',
      effectiveDate: '2026-05-20'
    },
    changedFieldKeys: ['新增记录']
  },
  {
    id: 'item-022',
    taskId: 'TASK-20260509-0002',
    resultId: 'RESULT-20260509-0002-R1',
    itemType: 'outbound_fee_rule',
    itemTypeLabel: '出仓费规则',
    naturalKey: 'SA + Noon + 大件出仓费',
    changeType: 'changed',
    reviewStatus: 'pending',
    confidence: 'medium',
    summary: 'KSA 大件出仓费从 6 SAR 调整为 7 SAR',
    validationStatus: 'warning',
    validationMessage: 'PDF 与 Excel 金额一致，生效日期需要人工确认。',
    evidence: 'Noon仓储费用公告.pdf / 第 3 页',
    sourceInputIds: ['input-022'],
    fields: {
      country: 'SA',
      feeItem: '大件出仓费',
      chargeMode: '按件',
      amount: 7,
      currency: 'SAR',
      effectiveDate: '2026-05-20'
    },
    oldFields: {
      country: 'SA',
      feeItem: '大件出仓费',
      chargeMode: '按件',
      amount: 6,
      currency: 'SAR',
      effectiveDate: '2026-04-01'
    },
    changedFieldKeys: ['amount', 'effectiveDate']
  },
  {
    id: 'item-031',
    taskId: 'TASK-20260508-0007',
    resultId: 'RESULT-20260508-0007-R1',
    itemType: 'base_price',
    itemTypeLabel: '基础价格',
    naturalKey: 'AE + FBN + 海运 + 普货',
    changeType: 'changed',
    reviewStatus: 'confirmed',
    confidence: 'high',
    summary: '海运普货 26 CNY/KG，最低 12KG',
    validationStatus: 'pass',
    validationMessage: '-',
    evidence: '义特沙特阿联酋FBN报价.pdf / 第 1 页',
    sourceInputIds: ['input-031'],
    fields: {
      transportMode: '海运',
      feeItem: '普货',
      billingFormula: '26 CNY/KG，最低计费 12KG',
      currency: 'CNY',
      minCharge: 12
    },
    oldFields: {
      transportMode: '海运',
      feeItem: '普货',
      billingFormula: '24 CNY/KG，最低计费 10KG',
      currency: 'CNY',
      minCharge: 10
    },
    changedFieldKeys: ['billingFormula', 'minCharge']
  },
  {
    id: 'item-032',
    taskId: 'TASK-20260508-0007',
    resultId: 'RESULT-20260508-0007-R1',
    itemType: 'surcharge',
    itemTypeLabel: '附加费用',
    naturalKey: 'AE + FBN + 海外仓 + 标准件',
    changeType: 'added',
    reviewStatus: 'confirmed',
    confidence: 'high',
    summary: '新增海外仓标准件入仓处理费 1.2 AED/件',
    validationStatus: 'pass',
    validationMessage: '-',
    evidence: '义特FBN报价解析后.xlsx / 入仓处理费 / 第 6 行',
    sourceInputIds: ['input-032'],
    fields: {
      transportMode: '海外仓',
      feeItem: '标准件入仓处理费',
      billingFormula: '1.2 AED/件，最低收费 15 AED',
      currency: 'AED',
      minCharge: 15
    },
    changedFieldKeys: ['新增记录']
  }
];

export const initialParseTasks: AiParseTask[] = [
  {
    id: 'TASK-20260509-0001',
    documentTitle: 'Noon 佣金 2026-05',
    targetPlanId: 'plan-commission-uae',
    documentType: 'OFFICIAL_COMMISSION',
    documentName: '官方佣金方案',
    standardVersion: 'STD-2026.05',
    storeId: 'store-xingyao',
    storeLabel: 'xingyao / PRJ245027',
    businessScope: {
      country: 'AE',
      platform: 'Noon',
      feeStage: 'FBN'
    },
    inputItems: taskInputs['TASK-20260509-0001'],
    resultId: 'RESULT-20260509-0001-R1',
    status: 'review_required',
    stats: buildTaskStats(initialParseItems.filter((item) => item.taskId === 'TASK-20260509-0001')),
    currentVersion: 'COMM-2026-04-xingyao',
    createdAt: '2026-05-09 15:40',
    updatedAt: nowLabel,
    remark: '佣金表五月更新，补充 PDF 公告和截图。'
  },
  {
    id: 'TASK-20260509-0002',
    documentTitle: 'Noon 出仓费 2026-05',
    targetPlanId: 'plan-outbound-fee-uae',
    documentType: 'OFFICIAL_OUTBOUND_FEE',
    documentName: '官方出仓费方案',
    standardVersion: 'STD-2026.05',
    storeId: 'store-xingyao',
    storeLabel: 'xingyao / PRJ245027',
    businessScope: {
      country: 'AE',
      platform: 'Noon',
      feeStage: '出仓费'
    },
    inputItems: taskInputs['TASK-20260509-0002'],
    resultId: 'RESULT-20260509-0002-R1',
    status: 'review_required',
    stats: buildTaskStats(initialParseItems.filter((item) => item.taskId === 'TASK-20260509-0002')),
    currentVersion: 'OUTBOUND-2026-04-xingyao-UAE',
    createdAt: '2026-05-09 14:18',
    updatedAt: '2026-05-09 15:05',
    remark: 'Noon 五月出仓费更新，补充费用公告 PDF。'
  },
  {
    id: 'TASK-20260508-0007',
    documentTitle: '义特 FBN 报价 2026-05',
    targetPlanId: 'plan-logistics-yite',
    documentType: 'LOGISTICS_RULE',
    documentName: '物流规则方案',
    standardVersion: 'STD-2026.05',
    storeId: 'store-canman',
    storeLabel: 'canman / PRJ108065',
    businessScope: {
      country: 'AE',
      fulfillmentMode: 'FBN',
      warehouseCity: '迪拜'
    },
    inputItems: taskInputs['TASK-20260508-0007'],
    resultId: 'RESULT-20260508-0007-R1',
    status: 'published',
    stats: buildTaskStats(initialParseItems.filter((item) => item.taskId === 'TASK-20260508-0007')),
    currentVersion: 'LOGI-YITE-2026-05',
    createdAt: '2026-05-08 13:30',
    updatedAt: '2026-05-08 16:20',
    remark: '已发布的物流规则样例，用于验证版本历史和追溯。'
  },
  {
    id: 'TASK-20260509-0003',
    documentTitle: 'Noon KSA 佣金补充 2026-05',
    targetPlanId: 'plan-commission-ksa',
    documentType: 'OFFICIAL_COMMISSION',
    documentName: '官方佣金方案',
    standardVersion: 'STD-2026.05',
    storeId: 'store-xingyao',
    storeLabel: 'xingyao / PRJ245027',
    businessScope: {
      country: 'SA',
      platform: 'Noon',
      feeStage: 'FBN'
    },
    inputItems: [
      {
        id: 'input-041',
        inputType: 'PDF',
        inputRole: 'PRIMARY_SOURCE',
        displayName: 'NoonKSA佣金补充.pdf',
        detail: '解析队列中'
      }
    ],
    resultId: '',
    status: 'parsing',
    stats: buildTaskStats([]),
    currentVersion: 'COMM-2026-04-xingyao-KSA',
    createdAt: '2026-05-09 16:30',
    updatedAt: '2026-05-09 16:32'
  },
  {
    id: 'TASK-20260509-0004',
    documentTitle: '义特报价截图补充',
    targetPlanId: 'plan-logistics-yite',
    documentType: 'LOGISTICS_RULE',
    documentName: '物流规则方案',
    standardVersion: 'STD-2026.05',
    storeId: 'store-canman',
    storeLabel: 'canman / PRJ108065',
    businessScope: {
      country: 'AE',
      fulfillmentMode: 'FBN',
      warehouseCity: '迪拜'
    },
    inputItems: [
      {
        id: 'input-051',
        inputType: 'IMAGE',
        inputRole: 'PRIMARY_SOURCE',
        displayName: '义特报价截图.png',
        detail: '图片过低清晰度'
      }
    ],
    resultId: '',
    status: 'failed',
    stats: buildTaskStats([]),
    currentVersion: 'LOGI-YITE-2026-05',
    createdAt: '2026-05-09 16:10',
    updatedAt: '2026-05-09 16:14',
    remark: '图片分辨率不足，未生成解析结果。'
  }
];

export const initialParseVersions: AiParseVersion[] = [
  {
    id: 'version-001',
    versionNo: 'COMM-2026-04-xingyao',
    targetPlanId: 'plan-commission-uae',
    documentType: 'OFFICIAL_COMMISSION',
    documentName: '官方佣金方案',
    standardVersion: 'STD-2026.04',
    storeLabel: 'xingyao / PRJ245027',
    businessScopeText: '佣金-UAE',
    publishedAt: '2026-04-16 10:30',
    publisherName: '系统管理员',
    sourceTaskId: 'TASK-20260416-0003',
    status: 'active',
    inputSummary: '2 个文件，1 段补充文案',
    itemCount: 42
  },
  {
    id: 'version-001-history',
    versionNo: 'COMM-2026-03-xingyao',
    targetPlanId: 'plan-commission-uae',
    documentType: 'OFFICIAL_COMMISSION',
    documentName: '官方佣金方案',
    standardVersion: 'STD-2026.03',
    storeLabel: 'xingyao / PRJ245027',
    businessScopeText: '佣金-UAE',
    publishedAt: '2026-03-18 11:20',
    publisherName: '系统管理员',
    sourceTaskId: 'TASK-20260318-0008',
    status: 'history',
    inputSummary: '1 个 Excel，1 段补充文案',
    itemCount: 39
  },
  {
    id: 'version-001-ksa',
    versionNo: 'COMM-2026-04-xingyao-KSA',
    targetPlanId: 'plan-commission-ksa',
    documentType: 'OFFICIAL_COMMISSION',
    documentName: '官方佣金方案',
    standardVersion: 'STD-2026.04',
    storeLabel: 'xingyao / PRJ245027',
    businessScopeText: '佣金-KSA',
    publishedAt: '2026-04-18 09:30',
    publisherName: '系统管理员',
    sourceTaskId: 'TASK-20260418-0009',
    status: 'active',
    inputSummary: '1 个 Excel，1 个 PDF',
    itemCount: 31
  },
  {
    id: 'version-001-ksa-history',
    versionNo: 'COMM-2026-03-xingyao-KSA',
    targetPlanId: 'plan-commission-ksa',
    documentType: 'OFFICIAL_COMMISSION',
    documentName: '官方佣金方案',
    standardVersion: 'STD-2026.03',
    storeLabel: 'xingyao / PRJ245027',
    businessScopeText: '佣金-KSA',
    publishedAt: '2026-03-16 14:20',
    publisherName: '系统管理员',
    sourceTaskId: 'TASK-20260316-0006',
    status: 'history',
    inputSummary: '1 个 Excel',
    itemCount: 30
  },
  {
    id: 'version-002',
    versionNo: 'OUTBOUND-2026-04-xingyao-UAE',
    targetPlanId: 'plan-outbound-fee-uae',
    documentType: 'OFFICIAL_OUTBOUND_FEE',
    documentName: '官方出仓费方案',
    standardVersion: 'STD-2026.04',
    storeLabel: 'xingyao / PRJ245027',
    businessScopeText: '出仓费-UAE',
    publishedAt: '2026-04-21 18:12',
    publisherName: '系统管理员',
    sourceTaskId: 'TASK-20260421-0011',
    status: 'active',
    inputSummary: '1 个 Excel，1 个 PDF',
    itemCount: 16
  },
  {
    id: 'version-002-history',
    versionNo: 'OUTBOUND-2026-03-xingyao-UAE',
    targetPlanId: 'plan-outbound-fee-uae',
    documentType: 'OFFICIAL_OUTBOUND_FEE',
    documentName: '官方出仓费方案',
    standardVersion: 'STD-2026.03',
    storeLabel: 'xingyao / PRJ245027',
    businessScopeText: '出仓费-UAE',
    publishedAt: '2026-03-20 17:05',
    publisherName: '系统管理员',
    sourceTaskId: 'TASK-20260320-0012',
    status: 'history',
    inputSummary: '1 个 Excel',
    itemCount: 14
  },
  {
    id: 'version-003',
    versionNo: 'LOGI-YITE-2026-05',
    targetPlanId: 'plan-logistics-yite',
    documentType: 'LOGISTICS_RULE',
    documentName: '物流规则方案',
    standardVersion: 'STD-2026.05',
    storeLabel: 'canman / PRJ108065',
    businessScopeText: '物流-义特',
    publishedAt: '2026-05-08 16:25',
    publisherName: '系统管理员',
    sourceTaskId: 'TASK-20260508-0007',
    status: 'active',
    inputSummary: '1 个 PDF，1 个解析后 Excel',
    itemCount: 36
  },
  {
    id: 'version-003-history',
    versionNo: 'LOGI-YITE-2026-04',
    targetPlanId: 'plan-logistics-yite',
    documentType: 'LOGISTICS_RULE',
    documentName: '物流规则方案',
    standardVersion: 'STD-2026.04',
    storeLabel: 'canman / PRJ108065',
    businessScopeText: '物流-义特',
    publishedAt: '2026-04-11 10:30',
    publisherName: '系统管理员',
    sourceTaskId: 'TASK-20260411-0005',
    status: 'history',
    inputSummary: '1 个 PDF',
    itemCount: 34
  }
];

export const initialVersionSnapshotItems: AiParseVersionSnapshotItem[] = [
  {
    id: 'snap-comm-uae-202603-phone',
    versionId: 'version-001-history',
    itemTypeLabel: '佣金规则',
    naturalKey: 'AE + FBN + 手机壳',
    fields: {
      country: 'AE',
      category: '手机壳',
      feeType: '佣金',
      commissionRate: 7.5,
      effectiveDate: '2026-03-01'
    }
  },
  {
    id: 'snap-comm-uae-202604-phone',
    versionId: 'version-001',
    itemTypeLabel: '佣金规则',
    naturalKey: 'AE + FBN + 手机壳',
    fields: {
      country: 'AE',
      category: '手机壳',
      feeType: '佣金',
      commissionRate: 8,
      effectiveDate: '2026-04-01'
    }
  },
  {
    id: 'snap-comm-uae-202603-toy',
    versionId: 'version-001-history',
    itemTypeLabel: '佣金规则',
    naturalKey: 'AE + FBN + 儿童玩具',
    fields: {
      country: 'AE',
      category: '儿童玩具',
      feeType: '佣金',
      commissionRate: 9,
      effectiveDate: '2026-03-01'
    }
  },
  {
    id: 'snap-comm-uae-202604-toy',
    versionId: 'version-001',
    itemTypeLabel: '佣金规则',
    naturalKey: 'AE + FBN + 儿童玩具',
    fields: {
      country: 'AE',
      category: '儿童玩具',
      feeType: '佣金',
      commissionRate: 10,
      effectiveDate: '2026-04-01'
    }
  },
  {
    id: 'snap-comm-uae-202604-charger',
    versionId: 'version-001',
    itemTypeLabel: '佣金规则',
    naturalKey: 'AE + FBN + 充电器',
    fields: {
      country: 'AE',
      category: '充电器',
      feeType: '佣金',
      commissionRate: 8,
      effectiveDate: '2026-04-01'
    }
  },
  {
    id: 'snap-comm-ksa-202603-accessory',
    versionId: 'version-001-ksa-history',
    itemTypeLabel: '佣金规则',
    naturalKey: 'SA + FBN + 电子配件',
    fields: {
      country: 'SA',
      category: '电子配件',
      feeType: '佣金',
      commissionRate: 6,
      effectiveDate: '2026-03-01'
    }
  },
  {
    id: 'snap-comm-ksa-202604-accessory',
    versionId: 'version-001-ksa',
    itemTypeLabel: '佣金规则',
    naturalKey: 'SA + FBN + 电子配件',
    fields: {
      country: 'SA',
      category: '电子配件',
      feeType: '佣金',
      commissionRate: 6.5,
      effectiveDate: '2026-04-01'
    }
  },
  {
    id: 'snap-comm-ksa-202604-home',
    versionId: 'version-001-ksa',
    itemTypeLabel: '佣金规则',
    naturalKey: 'SA + FBN + 家居',
    fields: {
      country: 'SA',
      category: '家居',
      feeType: '佣金',
      commissionRate: 8,
      effectiveDate: '2026-04-01'
    }
  },
  {
    id: 'snap-outbound-uae-202603-standard',
    versionId: 'version-002-history',
    itemTypeLabel: '出仓费规则',
    naturalKey: 'AE + Noon + 标准件出仓费',
    fields: {
      country: 'AE',
      feeItem: '标准件出仓费',
      chargeMode: '按件',
      amount: 1,
      currency: 'AED',
      effectiveDate: '2026-03-01'
    }
  },
  {
    id: 'snap-outbound-uae-202604-standard',
    versionId: 'version-002',
    itemTypeLabel: '出仓费规则',
    naturalKey: 'AE + Noon + 标准件出仓费',
    fields: {
      country: 'AE',
      feeItem: '标准件出仓费',
      chargeMode: '按件',
      amount: 1.2,
      currency: 'AED',
      effectiveDate: '2026-04-01'
    }
  },
  {
    id: 'snap-logi-yite-202604-sea',
    versionId: 'version-003-history',
    itemTypeLabel: '基础价格',
    naturalKey: 'AE + FBN + 海运 + 普货',
    fields: {
      transportMode: '海运',
      feeItem: '普货',
      billingFormula: '24 CNY/KG，最低计费 10KG',
      currency: 'CNY',
      minCharge: 10
    }
  },
  {
    id: 'snap-logi-yite-202605-sea',
    versionId: 'version-003',
    itemTypeLabel: '基础价格',
    naturalKey: 'AE + FBN + 海运 + 普货',
    fields: {
      transportMode: '海运',
      feeItem: '普货',
      billingFormula: '26 CNY/KG，最低计费 12KG',
      currency: 'CNY',
      minCharge: 12
    }
  },
  {
    id: 'snap-logi-yite-202605-warehouse',
    versionId: 'version-003',
    itemTypeLabel: '附加费用',
    naturalKey: 'AE + FBN + 海外仓 + 标准件',
    fields: {
      transportMode: '海外仓',
      feeItem: '标准件入仓处理费',
      billingFormula: '1.2 AED/件，最低收费 15 AED',
      currency: 'AED',
      minCharge: 15
    }
  }
];

export { initialParseLogs } from './mockLogs';

export function cloneParseTasks() {
  return initialParseTasks.map((task) => ({
    ...task,
    businessScope: { ...task.businessScope },
    inputItems: task.inputItems.map((input) => ({ ...input })),
    stats: { ...task.stats }
  }));
}

export function cloneParseItems() {
  return initialParseItems.map((item) => ({
    ...item,
    sourceInputIds: [...item.sourceInputIds],
    fields: { ...item.fields },
    oldFields: item.oldFields ? { ...item.oldFields } : undefined,
    changedFieldKeys: [...item.changedFieldKeys]
  }));
}

export function cloneParseVersions() {
  return initialParseVersions.map((version) => ({ ...version }));
}

export function cloneVersionSnapshotItems() {
  return initialVersionSnapshotItems.map((item) => ({
    ...item,
    fields: { ...item.fields }
  }));
}

export function cloneParseLogs() {
  return initialParseLogs.map((log) => ({ ...log }));
}

export function inputTypeLabel(inputType: AiParseInputType) {
  const labelMap: Record<AiParseInputType, string> = {
    FILE: '文件',
    IMAGE: '图片',
    EXCEL: 'Excel',
    PDF: 'PDF',
    OCR_TEXT: 'OCR文本',
    MANUAL_TEXT: '人工文案'
  };
  return labelMap[inputType];
}

export function inputRoleLabel(inputRole: AiParseInputRole) {
  const labelMap: Record<AiParseInputRole, string> = {
    PRIMARY_SOURCE: '主来源',
    PARSED_FILE: '解析后文件',
    SUPPLEMENT: '补充',
    REFERENCE: '参考'
  };
  return labelMap[inputRole];
}

export function createAcceptanceTask(
  taskNo: number,
  documentTitle: string,
  targetPlanId: string,
  standard: AiParseDocumentStandard,
  store: AiParseStoreOption,
  businessScope: Record<string, string>,
  uploadNames: string[],
  ocrText?: string,
  manualText?: string,
  remark?: string
) {
  const taskId = `TASK-20260509-${String(taskNo).padStart(4, '0')}`;
  const resultId = `RESULT-20260509-${String(taskNo).padStart(4, '0')}-R1`;
  const fileInputs = uploadNames.map<AiParseTaskInput>((name, index) => {
    const lowerName = name.toLowerCase();
    const inputType: AiParseInputType = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')
      ? 'EXCEL'
      : lowerName.endsWith('.pdf')
        ? 'PDF'
        : lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')
          ? 'IMAGE'
          : 'FILE';
    return {
      id: `${taskId}-input-${index + 1}`,
      inputType,
      inputRole: index === 0 ? 'PRIMARY_SOURCE' : 'REFERENCE',
      displayName: name,
      detail: '本次上传'
    };
  });

  const textInputs: AiParseTaskInput[] = [];
  if (ocrText?.trim()) {
    textInputs.push({
      id: `${taskId}-input-ocr`,
      inputType: 'OCR_TEXT',
      inputRole: 'SUPPLEMENT',
      displayName: 'OCR文本',
      detail: ocrText.trim().slice(0, 40)
    });
  }
  if (manualText?.trim()) {
    textInputs.push({
      id: `${taskId}-input-manual`,
      inputType: 'MANUAL_TEXT',
      inputRole: 'SUPPLEMENT',
      displayName: '人工补充文案',
      detail: manualText.trim().slice(0, 40)
    });
  }

  const task: AiParseTask = {
    id: taskId,
    documentTitle,
    targetPlanId,
    documentType: standard.documentType,
    documentName: standard.documentName,
    standardVersion: standard.standardVersion,
    storeId: store.id,
    storeLabel: `${store.projectName} / ${store.projectCode}`,
    businessScope,
    inputItems: [...fileInputs, ...textInputs],
    resultId,
    status: 'review_required',
    stats: {
      total: 0,
      pending: 0,
      needsFix: 0,
      conflicts: 0,
      deleteSuspected: 0,
      hardErrors: 0,
      confirmed: 0
    },
    currentVersion: '-',
    createdAt: nowLabel,
    updatedAt: nowLabel,
    remark
  };

  const firstVisibleField = standard.resultFields.find((field) => field.tableVisible) ?? standard.resultFields[0];
  const secondVisibleField = standard.resultFields.find(
    (field) => field.tableVisible && field.key !== firstVisibleField?.key
  );
  const initialFields = Object.fromEntries(
    standard.resultFields.map((field) => {
      if (field.options?.length) {
        return [field.key, field.options[0]];
      }
      if (field.type === 'number' || field.type === 'money') {
        return [field.key, 0];
      }
      if (field.type === 'boolean') {
        return [field.key, false];
      }
      if (field.type === 'date') {
        return [field.key, '2026-05-20'];
      }
      return [field.key, field.required ? '待人工确认' : '-'];
    })
  );

  const item: AiParseResultItem = {
    id: `${taskId}-item-1`,
    taskId,
    resultId,
    itemType: standard.itemTypes[0]?.value ?? 'default_item',
    itemTypeLabel: standard.itemTypes[0]?.label ?? '结果项',
    naturalKey: `${store.projectName} + ${standard.documentName} + 样例记录`,
    changeType: 'added',
    reviewStatus: 'pending',
    confidence: 'medium',
    summary: `${standard.documentName} 新增 1 条待确认记录`,
    validationStatus: 'warning',
    validationMessage: `${firstVisibleField?.label ?? '字段'}、${secondVisibleField?.label ?? '字段'} 需要人工复核。`,
    evidence: fileInputs[0]?.displayName ? `${fileInputs[0].displayName} / 自动识别` : '人工文案 / 自动识别',
    sourceInputIds: [...fileInputs, ...textInputs].map((input) => input.id),
    fields: initialFields,
    changedFieldKeys: ['新增记录']
  };

  task.stats = buildTaskStats([item]);
  return { task, items: [item] };
}
