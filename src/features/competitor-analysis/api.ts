export {
  addCompetitorKeyword,
  addManualCompetitor,
  confirmCompetitorCandidate,
  createCompetitorWatchProduct,
  deleteCompetitorKeyword,
  fetchCompetitorProductBaselines,
  fetchCompetitorProductOptions,
  fetchCompetitorRankHistory,
  fetchCompetitorWatchProductDetail,
  fetchCompetitorWatchProducts,
  ignoreCompetitorCandidate,
  removeCompetitorCandidate,
  updateCompetitorKeyword
} from './api/watchProductTransport'
export { fetchCompetitorDashboard } from './api/dashboardTransport'
export { fetchCompetitorProductChanges } from './api/productChangeTransport'
export {
  fetchCompetitorRefreshRun,
  fetchCompetitorTask,
  requestCompetitorMonitoring,
  requestCompetitorRefresh
} from './api/taskTransport'
export { mapDetail } from './api/watchProductMapper'
export { mapDashboard } from './api/dashboardMapper'
export type {
  CompetitorDashboardQuery,
  CompetitorProductOptionQuery,
  CompetitorRefreshRun,
  CompetitorTask,
  CompetitorWatchProductCreateInput,
  CompetitorWatchProductQuery
} from './api/contracts'
