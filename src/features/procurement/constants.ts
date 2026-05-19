export const procurementBuildRoadmap = [
  {
    key: 'pool',
    title: '采购需求单与候选池',
    status: 'done',
    statusLabel: '已完成',
    color: 'success',
    summary: '采购样本、候选池、意向采购已经能完整跑通。'
  },
  {
    key: 'search',
    title: '1688 找货入口',
    status: 'done',
    statusLabel: '已完成',
    color: 'success',
    summary: '可以直接打开 1688 搜索结果页，并复制当前搜索词。'
  },
  {
    key: 'backfill',
    title: '手工回填候选',
    status: 'done',
    statusLabel: '已完成',
    color: 'success',
    summary: '少量值得继续比对的候选，已经可以结构化追加回采购池。'
  },
  {
    key: 'decision',
    title: '候选比对与意向采购',
    status: 'done',
    statusLabel: '已完成',
    color: 'success',
    summary: '回填后的候选可以继续在决策台里做对比、筛选和意向选择。'
  },
  {
    key: 'semi-auto',
    title: '半自动采集当前 1688 页面',
    status: 'doing',
    statusLabel: '进行中',
    color: 'processing',
    summary: '下一步减少手工录入，把浏览器里看到的候选更快带回系统。'
  },
  {
    key: 'auto',
    title: '自动询价与自动采购',
    status: 'todo',
    statusLabel: '待开始',
    color: 'default',
    summary: '要等半自动链路稳定后，再推进自动询价和自动下单。'
  }
] as const;

export const PROCUREMENT_SEND_PHASE_VALIDATION_CASE = {
  ownerUserId: 10002,
  demandItemId: 41101,
  candidateId: 43101,
  label: '发送链路验证样本 A',
  entryUrl:
    'https://detail.1688.com/offer/798448779771.html?offerId=798448779771&hotSaleSkuId=5613239587877&spm=a260k.home2025.recommendpart.2'
} as const;

export function shouldShowProcurementAutoInquiryDevValidation() {
  if (typeof window === 'undefined') {
    return false;
  }
  return new URLSearchParams(window.location.search).get('devValidation') === '1';
}

export const procurementSearchPreviewMockHtml = `<html>
  <head>
    <title>1688 搜索结果 - 焚香炉</title>
  </head>
  <body>
    <div class="offer-card">
      <a href="https://detail.1688.com/offer/801000000202.html" title="便携式 USB 充电电熏香炉 轻奢礼品款">便携式 USB 充电电熏香炉 轻奢礼品款</a>
      <img src="https://via.placeholder.com/240x240.png?text=1688+1" />
      <div>义乌轻奢香器供应链</div>
      <div>¥12.2-17.5元 180件起 浙江义乌 7-10天交期</div>
      <div>ABS+陶瓷内胆 USB充电 便携小型 轻奢礼盒</div>
      <div>实力商家 深度验厂 7-10天交期</div>
    </div>
    <div class="offer-card">
      <a href="https://detail.1688.com/offer/801000000301.html" title="阿拉伯风迷你陶瓷焚香炉桌面摆件款">阿拉伯风迷你陶瓷焚香炉桌面摆件款</a>
      <img src="https://via.placeholder.com/240x240.png?text=1688+2" />
      <div>潮州陶瓷香器工厂</div>
      <div>¥4.8-7.2元 300件起 广东潮州 48小时发货</div>
      <div>陶瓷 迷你桌面 彩盒装 家居摆件</div>
      <div>诚信通 48小时发货 支持常规打样</div>
    </div>
  </body>
</html>`;
