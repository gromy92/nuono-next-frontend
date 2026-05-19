import type { LogisticsQuoteBundleDetailDto, LogisticsQuoteBundleListItemDto } from './types'

export const mockLogisticsQuoteBundles: LogisticsQuoteBundleListItemDto[] = [
  {
    id: 91001,
    bundleName: '义特-沙特海运双清-2026-04',
    forwarderName: '义特',
    analysisStatus: 'READY_FOR_REVIEW',
    latestVersionNo: '2026-04-v1',
    latestVersionStatus: 'DRAFT',
    recommendationLevel: 'B',
    fileCount: 2,
    noteCount: 3,
    updatedAt: '2026-05-07 15:20'
  },
  {
    id: 91002,
    bundleName: '易通-仓到仓报价包-2026-04',
    forwarderName: '易通 / ET',
    analysisStatus: 'ANALYZED',
    latestVersionNo: '2026-04-v1',
    latestVersionStatus: 'PUBLISHED',
    recommendationLevel: 'B',
    fileCount: 1,
    noteCount: 2,
    updatedAt: '2026-05-06 18:12'
  },
  {
    id: 91003,
    bundleName: '众鸫-沙特空海运报价-2026-04',
    forwarderName: '众鸫',
    analysisStatus: 'DRAFT',
    latestVersionNo: '未生成',
    latestVersionStatus: 'SOURCE_ONLY',
    recommendationLevel: 'C',
    fileCount: 1,
    noteCount: 1,
    updatedAt: '2026-05-05 10:38'
  }
]

export const mockLogisticsQuoteBundleDetails: LogisticsQuoteBundleDetailDto[] = [
  {
    id: 91001,
    bundleName: '义特-沙特海运双清-2026-04',
    analysisStatus: 'READY_FOR_REVIEW',
    analysisSummary: '沙特海运双清报价，含微信口头补充“单品分别加 240/方”。',
    sourceReadbackHint: 'mock：该详情用于确认列表、文件归档、版本管理的信息架构。',
    selectedNoteId: 93001,
    selectedFileId: 92001,
    forwarder: {
      id: 501,
      name: '义特',
      alias: 'Yite',
      notes: '当前先做文件归档与版本补充文案管理，不自动解析报价文件。'
    },
    quoteVersion: {
      id: 94001,
      versionNo: '2026-04-v1',
      status: 'DRAFT',
      effectiveFrom: '2026-04-11',
      summary: '沙特海运双清报价草稿，等待人工确认后发布。'
    },
    files: [
      {
        id: 92001,
        fileName: '沙特价格表.pdf',
        fileType: 'pdf',
        filePath: 'archive://logistics-quotes/91001/92001-沙特价格表.pdf',
        sourceLabel: '已归档原件',
        archived: true,
        archiveUrl: '#'
      },
      {
        id: 92002,
        fileName: '义特微信补充截图.png',
        fileType: 'image',
        filePath: 'archive://logistics-quotes/91001/92002-义特微信补充截图.png',
        sourceLabel: '已归档原件',
        archived: true,
        archiveUrl: '#'
      }
    ],
    notes: [
      {
        id: 93001,
        noteType: 'manual_note',
        sourceChannel: 'wechat',
        content: '单品需要分别加240/方，直接计入字段价格。'
      },
      {
        id: 93002,
        noteType: 'manual_note',
        sourceChannel: 'buyer_confirm',
        content: '海运和空运需要人工确认，不做自动发布。'
      },
      {
        id: 93003,
        noteType: 'analysis_note',
        sourceChannel: 'operator',
        content: '该报价适合先作为沙特海运版本草稿，后续再拆空运版本。'
      }
    ],
    services: [
      {
        serviceName: '沙特海运双清包税',
        countryCode: 'SA',
        routeCode: 'CN-SA',
        transportMode: 'SEA',
        businessType: 'B2B',
        serviceScope: 'FIRST_LEG',
        transitTimeText: '45-60 天',
        remarks: '按方计费，部分品类有附加费。'
      }
    ],
    rules: [
      {
        serviceName: '沙特海运双清包税',
        ruleName: '单品附加费',
        ruleType: 'MANUAL_SURCHARGE',
        cargoCategory: '单品',
        billingUnit: 'CBM',
        currency: 'CNY',
        unitPrice: 240,
        calcBasis: 'PER_CBM',
        summary: '微信补充说明：单品分别加 240/方。'
      }
    ],
    restrictions: [
      {
        serviceName: '沙特海运双清包税',
        restrictionType: 'MANUAL_CONFIRM_REQUIRED',
        severity: 'SOFT',
        description: '海运方案发布前需要人工确认。'
      }
    ],
    evidences: [
      {
        targetType: 'RULE',
        targetName: '单品附加费',
        sourceType: 'NOTE',
        sourceName: 'wechat',
        locator: '补充文案 #93001',
        evidenceText: '单品需要分别加240/方。'
      }
    ],
    reputationSnapshot: {
      overallScore: 74,
      complianceScore: 76,
      timelinessScore: 72,
      priceTransparencyScore: 70,
      claimsScore: 71,
      serviceScore: 78,
      recommendationLevel: 'B',
      recentRiskSummary: 'mock：公开风评未接入，当前以内部资料完整度作为临时展示。',
      analysisSummary: '资料可整理，需人工确认价格口径。'
    },
    reputationSignals: [
      {
        signalType: 'INTERNAL',
        polarity: 'POSITIVE',
        severity: 'LOW',
        sourceType: 'MOCK',
        topic: '资料完整度',
        evidenceText: '文件与微信补充均已归档。'
      }
    ]
  },
  {
    id: 91002,
    bundleName: '易通-仓到仓报价包-2026-04',
    analysisStatus: 'ANALYZED',
    analysisSummary: '仓到仓报价包，先展示已发布版本状态。',
    sourceReadbackHint: 'mock：用于展示已发布版本的详情页形态。',
    selectedNoteId: 93011,
    selectedFileId: 92011,
    forwarder: { id: 502, name: '易通', alias: 'ET' },
    quoteVersion: {
      id: 94011,
      versionNo: '2026-04-v1',
      status: 'PUBLISHED',
      effectiveFrom: '2026-04-14',
      summary: '沙特 / 阿联酋仓到仓主报价版本。'
    },
    files: [
      {
        id: 92011,
        fileName: 'ET物流报价-20260414入仓生效.pdf',
        fileType: 'pdf',
        sourceLabel: '已归档原件',
        archived: true,
        archiveUrl: '#'
      }
    ],
    notes: [
      { id: 93011, noteType: 'analysis_note', sourceChannel: 'operator', content: 'PDF 主体是规则表，需要人工复核后发布。' },
      { id: 93012, noteType: 'manual_note', sourceChannel: 'wechat', content: '仓到仓报价按目的国拆版本维护。' }
    ],
    services: [
      {
        serviceName: '中国到沙特仓到仓',
        countryCode: 'SA',
        routeCode: 'CN-SA',
        transportMode: 'SEA',
        businessType: 'B2B',
        serviceScope: 'FIRST_LEG_WITH_DELIVERY',
        transitTimeText: '约45天',
        remarks: '仓到仓。'
      }
    ],
    rules: [],
    restrictions: [],
    evidences: [],
    reputationSnapshot: {
      overallScore: 76,
      recommendationLevel: 'B',
      recentRiskSummary: 'mock：待接入外部风评。',
      analysisSummary: '作为稳定备选。'
    },
    reputationSignals: []
  },
  {
    id: 91003,
    bundleName: '众鸫-沙特空海运报价-2026-04',
    analysisStatus: 'DRAFT',
    analysisSummary: '沙特空运和海运混合报价，待拆版本。',
    sourceReadbackHint: 'mock：用于展示待整理状态。',
    selectedNoteId: 93021,
    selectedFileId: 92021,
    forwarder: { id: 503, name: '众鸫' },
    quoteVersion: {
      versionNo: '未生成',
      status: 'SOURCE_ONLY'
    },
    files: [
      {
        id: 92021,
        fileName: '深圳市众鸫供应链报价单2026.4.11.xlsx',
        fileType: 'excel',
        sourceLabel: '已归档原件',
        archived: true,
        archiveUrl: '#'
      }
    ],
    notes: [
      { id: 93021, noteType: 'analysis_note', sourceChannel: 'operator', content: '需要先按空运 / 海运拆成两个报价版本。' }
    ],
    services: [],
    rules: [],
    restrictions: [],
    evidences: [],
    reputationSnapshot: {
      overallScore: 62,
      recommendationLevel: 'C',
      recentRiskSummary: 'mock：资料还未拆分，暂不进入推荐。',
      analysisSummary: '先整理文件和版本。'
    },
    reputationSignals: []
  }
]

export function findMockLogisticsQuoteBundleDetail(bundleId?: number | null) {
  return mockLogisticsQuoteBundleDetails.find((item) => item.id === bundleId) ?? null
}
