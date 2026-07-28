import { buildCandidate } from './mockCandidateFactory'

export function createEditingCandidates() {
  return [
    buildCandidate({
      id: 'cand-01', offerId: '798448779771', rankNo: 1, title: '便携电香炉礼盒款',
      tags: ['默认入池', '图搜最接近'], warnings: [], inquiryStatus: 'IN_POOL_WAITING_REPLY',
      replySummary: '首条询价已发出，等待供应商回复。',
      nextFollowUpAt: '15 分钟后若无回复，自动补发“在吗亲”。'
    }),
    buildCandidate({
      id: 'cand-02', offerId: '798448779772', rankNo: 2, title: '阿拉伯风熏香炉礼品套装',
      tags: ['礼盒完整', '价格可谈'], inquiryStatus: 'FOLLOW_UP_1_SENT',
      replySummary: '15 分钟未回复，已发送第一次催发“在吗亲”。', nextFollowUpAt: '30 分钟后'
    }),
    buildCandidate({
      id: 'cand-03', offerId: '798448779773', rankNo: 3, title: 'USB 电热熏香炉香薰套装',
      moqText: '30 件', tags: ['MOQ 友好', '可直接询价'], inquiryStatus: 'REPLIED',
      replySummary: '已回复：单价 21.3 RMB，MOQ 30 件，可支持礼盒贴牌。',
      latestReplyAt: '2026-04-28 16:12', quotePrice: '21.3 RMB', quoteMoq: '30 件', quoteDelivery: '3 天发货'
    }),
    buildCandidate({
      id: 'cand-04', offerId: '798448779774', rankNo: 4, title: '高脚金属香炉礼盒版',
      deliveryText: '48 小时内发货', tags: ['发货快', '包装完整'], inquiryStatus: 'IN_POOL_WAITING_REPLY',
      replySummary: '首条询价已发出，等待供应商回复。',
      nextFollowUpAt: '15 分钟后若无回复，自动补发“在吗亲”。'
    }),
    buildCandidate({
      id: 'cand-05', offerId: '798448779775', rankNo: 5, title: '中东礼品电香炉香薰炉',
      warnings: ['详情页参数图不完整'], inquiryStatus: 'IN_POOL_WAITING_SEND',
      replySummary: '已进入待选池，等待发送首条询价。', nextFollowUpAt: '待系统首发'
    }),
    buildCandidate({ id: 'cand-06', offerId: '798448779776', rankNo: 6, title: '桌面香薰炉电热款', inPool: false, poolRankNo: null }),
    buildCandidate({ id: 'cand-07', offerId: '798448779777', rankNo: 7, title: '可充电便携熏香炉', inPool: false, poolRankNo: null }),
    buildCandidate({
      id: 'cand-08', offerId: '798448779778', rankNo: 8, title: '香炉礼盒电镀金款',
      inPool: false, poolRankNo: null, warnings: ['价格略高', '外箱信息不完整']
    }),
    buildCandidate({
      id: 'cand-09', offerId: '798448779779', rankNo: 9, title: '豪华礼盒香炉 1688 样品款',
      inPool: false, poolRankNo: null, priceText: '32 - 35 RMB'
    }),
    buildCandidate({
      id: 'cand-10', offerId: '798448779780', rankNo: 10, title: '入门款小型电香炉',
      inPool: false, poolRankNo: null, moqText: '200 件', warnings: ['MOQ 偏高']
    })
  ]
}

export function createRunningCandidates() {
  return [
    buildCandidate({
      id: 'cand-11', offerId: '798448779811', rankNo: 1, title: '礼盒便携电香炉升级款',
      inquiryStatus: 'IN_POOL_WAITING_REPLY', replySummary: '首条询价已发出，等待供应商回复。',
      nextFollowUpAt: '2026-04-28 16:55', finalPick: null
    }),
    buildCandidate({
      id: 'cand-12', offerId: '798448779812', rankNo: 2, title: '中东礼品香炉便携套装',
      inquiryStatus: 'FOLLOW_UP_1_SENT', replySummary: '15 分钟未回复，已发送第一次催发“在吗亲”。',
      nextFollowUpAt: '2026-04-28 17:25'
    }),
    buildCandidate({
      id: 'cand-13', offerId: '798448779813', rankNo: 3, title: '电热香炉大礼盒款',
      inquiryStatus: 'REPLIED', replySummary: '已回复：可做礼盒定制，单价 21.5 RMB，MOQ 60 件。',
      latestReplyAt: '2026-04-28 16:08', quotePrice: '21.5 RMB', quoteMoq: '60 件', quoteDelivery: '3 天发货'
    }),
    buildCandidate({
      id: 'cand-14', offerId: '798448779814', rankNo: 4, title: '铝合金桌面香炉礼品版',
      inquiryStatus: 'PARTIAL_REPLY', replySummary: '已回复，但仅给出 MOQ 和材质，未明确报价。',
      latestReplyAt: '2026-04-28 15:42', quoteMoq: '80 件'
    }),
    buildCandidate({
      id: 'cand-15', offerId: '798448779815', rankNo: 5, title: '跨境电香炉礼盒样品',
      inquiryStatus: 'FOLLOW_UP_2_SENT', replySummary: '30 分钟后第二次催发已发出，仍待回复。',
      nextFollowUpAt: '2026-04-28 20:30'
    }),
    ...backupCandidates('cand-run')
  ]
}

export function createSummaryReadyCandidates() {
  return [
    buildCandidate({
      id: 'cand-21', offerId: '798448779821', rankNo: 1, title: '礼盒电香炉现货款',
      inquiryStatus: 'CLOSED', replySummary: '已回复：报价 20.8 RMB，MOQ 50 件，72 小时发货。',
      latestReplyAt: '2026-04-27 18:12', quotePrice: '20.8 RMB', quoteMoq: '50 件',
      quoteDelivery: '72 小时', finalPick: 'PRIMARY'
    }),
    buildCandidate({
      id: 'cand-22', offerId: '798448779822', rankNo: 2, title: '中东礼盒香炉金边款',
      inquiryStatus: 'CLOSED', replySummary: '已回复：报价 21.4 RMB，MOQ 60 件，可支持礼盒贴牌。',
      latestReplyAt: '2026-04-27 18:55', quotePrice: '21.4 RMB', quoteMoq: '60 件',
      quoteDelivery: '4 天', finalPick: 'BACKUP'
    }),
    buildCandidate({
      id: 'cand-23', offerId: '798448779823', rankNo: 3, title: '便携熏香炉礼品款',
      inquiryStatus: 'CLOSED', replySummary: '已回复：单价合理，但包装工艺一般。',
      latestReplyAt: '2026-04-27 17:32', quotePrice: '19.9 RMB', quoteMoq: '100 件', quoteDelivery: '3 天'
    }),
    buildCandidate({
      id: 'cand-24', offerId: '798448779824', rankNo: 4, title: '香薰炉家居礼盒版',
      inquiryStatus: 'NO_REPLY_HANDOFF', replySummary: '24 小时无回复，已要求人工介入。'
    }),
    buildCandidate({
      id: 'cand-25', offerId: '798448779825', rankNo: 5, title: '桌面电热香炉礼盒升级款',
      inquiryStatus: 'REPLY_PARSE_FAILED', replySummary: '供应商回复有图片和语音，结构化报价解析失败。'
    }),
    ...backupCandidates('cand-sum')
  ]
}

function backupCandidates(prefix: string) {
  return createEditingCandidates()
    .slice(5)
    .map((item, index) => ({
      ...item,
      id: `${prefix}-${index + 6}`,
      rankNo: index + 6,
      inPool: false,
      poolRankNo: null
    }))
}
