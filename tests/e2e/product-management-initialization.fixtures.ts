export function buildStoreOverviewPayload() {
  return {
    mode: 'local-db',
    ready: true,
    selectedOwnerId: 307,
    summary: {
      totalStores: 1,
      connectedStores: 1,
      pendingStores: 0,
      totalSiteStores: 2,
      connectedSiteStores: 2,
      managerLinks: 0
    },
    ownerOptions: [],
    stores: [
      {
        id: 301,
        projectName: 'canman',
        projectCode: 'PRJ108065',
        storeCode: 'PRJ108065',
        siteCount: 2,
        connectedSiteCount: 2,
        isAuthorized: true,
        noonUser: 'canman',
        noonPartnerId: 'PRJ108065',
        connectionStatus: 'CONNECTED',
        siteStores: [
          {
            id: 301,
            storeCode: 'STR108065-NAE',
            site: 'AE',
            isAuthorized: true,
            connectionStatus: 'CONNECTED'
          },
          {
            id: 305,
            storeCode: 'STR108065-NSA',
            site: 'SA',
            isAuthorized: true,
            connectionStatus: 'CONNECTED'
          }
        ],
        managers: []
      }
    ],
    syncedRules: [],
    missingCoreTables: []
  };
}

export function buildInitializationPayload(
  storeCode: string,
  status: 'FAILED' | 'IDLE' | 'RUNNING' | 'READY'
) {
  return {
    mode: 'local-db',
    ready: status === 'READY',
    status,
    message:
      status === 'FAILED'
        ? '当前 Noon 账号未授权 canman / PRJ108065：project.list 未返回目标项目；本次不会写入商品正式数据面。'
        : '正在准备当前店铺商品摘要。',
    ownerUserId: 307,
    projectName: 'canman',
    projectCode: 'PRJ108065',
    storeCode,
    siteCount: 2,
    uniqueProductCount: 0,
    siteOfferCount: 0,
    progressPercent: status === 'READY' ? 100 : 50,
    phaseLabel: status === 'READY' ? '已完成' : '准备中',
    canEnterProductWorkbench: status === 'READY',
    missingCoreTables: [],
    warnings: [],
    steps: [],
    siteSummaries: [],
    sampleProducts: [],
    productItems: []
  };
}
