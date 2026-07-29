export function logisticsActivationFixture() {
  return {
    targetPlanId: 4005,
    targetPlanCode: 'logistics_yite',
    targetPlanLabel: '物流-义特',
    versionId: 5005,
    versionNo: 'ET-KSA-FBN-2026-05',
    ownerUserId: 1,
    selectedChannelKeys: ['ET KSA cargo air'],
    channels: [
      {
        versionItemId: 5101,
        naturalKey: 'ET|KSA|FBN|cargo_air|warehouse_to_fbn|Riyadh FBN warehouse',
        channelKey: 'ET KSA cargo air',
        country: 'KSA',
        city: 'Riyadh FBN warehouse',
        shippingMethod: 'cargo_air',
        feeItem: 'warehouse_to_fbn',
        billingRule: 'weekly',
        leadTime: '3-5 days',
        selected: true,
        fields: {
          itemType: 'logistics_service_line',
          relatedItemCounts: {
            logistics_cargo_category: 1,
            logistics_base_price: 1,
            logistics_surcharge: 1,
            logistics_billing_rule: 1,
            logistics_warehouse_service_fee: 1,
            logistics_restriction: 1
          }
        }
      }
    ]
  };
}

export function buildTask(options: {
  id: number;
  title: string;
  status: string;
  resultId?: number;
  totalCount?: number;
  pendingCount?: number;
  failureMessage?: string;
  nextRunAt?: string;
}) {
  return {
    id: options.id,
    taskNo: `TASK-${options.id}`,
    documentTitle: options.title,
    targetPlanId: options.title.includes('物流') ? 4005 : 4001,
    targetPlanCode: options.title.includes('物流') ? 'logistics_yite' : 'commission_ksa',
    targetPlanLabel: options.title.includes('物流') ? '物流-义特' : '佣金-KSA',
    documentType: options.title.includes('物流') ? 'logistics_rule' : 'official_fee',
    documentName: options.title.includes('物流') ? '物流渠道规则' : '佣金规则',
    standardVersion: options.title.includes('物流') ? 'STD-LOGISTICS-2026-05' : 'STD-COMMISSION-2026-05',
    currentVersion: 'V2026.05',
    status: options.status,
    dataScopeType: 'global',
    dataScopeKey: 'global',
    documentGroupId: options.id,
    iterationNo: 1,
    resultId: options.resultId ?? null,
    failureMessage: options.failureMessage ?? null,
    nextRunAt: options.nextRunAt ?? null,
    totalCount: options.totalCount ?? 0,
    pendingCount: options.pendingCount ?? 0,
    needsFixCount: 0,
    hardErrorCount: 0,
    conflictCount: 0,
    deleteSuspectedCount: 0,
    confirmedCount: options.totalCount ? Math.max(options.totalCount - (options.pendingCount ?? 0), 0) : 0,
    rejectedCount: 0,
    keepOldCount: 0,
    createdAt: '2026-05-20T10:00:00',
    updatedAt: '2026-05-20T10:30:00',
    availableActions: {
      canCreateTask: true,
      canProcess: true,
      canPublish: true,
      canManageStandard: true,
      canActivateLogisticsChannels: true
    }
  };
}

export function taskFixtures() {
  return [
    withInputItems(buildTask({ id: 2001, title: '佣金-KSA 解析中心验收', status: 'review_required', resultId: 9001, totalCount: 2, pendingCount: 1 }), 'Noon佣金表.xlsx'),
    withInputItems(buildTask({ id: 2002, title: '佣金-UAE 解析中样本', status: 'parsing' }), 'Noon UAE 佣金表.pdf'),
    buildTask({ id: 2003, title: '出仓费失败样本', status: 'failed', failureMessage: 'AI provider timeout' }),
    withInputItems(buildTask({ id: 2004, title: '物流-义特等待重试样本', status: 'failed', nextRunAt: '2026-05-20T18:30:00' }), 'ET物流报价-20260414入仓生效.pdf'),
    withInputItems(buildTask({ id: 2005, title: '已发布佣金文档', status: 'published', resultId: 9005, totalCount: 1, pendingCount: 0 }), '已发布佣金表.xlsx')
  ];
}

function withInputItems(task: ReturnType<typeof buildTask>, displayName: string) {
  return {
    ...task,
    inputItems: [
      {
        id: Number(task.id) + 5000,
        inputType: displayName.endsWith('.pdf') ? 'pdf' : 'excel',
        inputRole: 'primary_source',
        fileAssetId: Number(task.id) + 6000,
        displayName,
        downloadUrl: `/api/file-management/parse/files/${Number(task.id) + 6000}/download`,
        sortNo: 1
      }
    ]
  };
}

export function commissionColumns() {
  return [
    { key: 'country', label: '国家', type: 'text', tableVisible: true, width: 100 },
    { key: 'categoryPath', label: '类目路径', type: 'text', tableVisible: true, width: 220 },
    { key: 'brandRestriction', label: '品牌限制', type: 'text', tableVisible: true, width: 160 },
    { key: 'commissionRate', label: '佣金率', type: 'text', tableVisible: true, width: 100 },
    { key: 'effectiveDate', label: '生效日期', type: 'date', tableVisible: true, width: 140 }
  ];
}
