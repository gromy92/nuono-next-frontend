import type { LoadProductListDatasetOptions } from '../hooks/useProductListDatasetLoader'

type LoadProductListDataset = (
  storeCode: string,
  ownerUserId?: number,
  options?: LoadProductListDatasetOptions
) => Promise<void>

export async function recoverProductDeleteFailure({
  error,
  loadProductListDataset,
  notify,
  ownerUserId,
  storeCode
}: {
  error: unknown
  loadProductListDataset: LoadProductListDataset
  notify: (content: string) => void
  ownerUserId: number
  storeCode: string
}) {
  const errorMessage = error instanceof Error ? error.message : '删除商品失败'
  notify(`删除请求未确认提交，正在刷新商品状态。${errorMessage}`)
  await loadProductListDataset(storeCode, ownerUserId, { force: true })
}
