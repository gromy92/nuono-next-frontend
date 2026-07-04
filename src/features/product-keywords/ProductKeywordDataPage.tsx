import type { AuthSession } from '../auth/session'

type ProductKeywordDataPageProps = {
  session: AuthSession
}

export function ProductKeywordDataPage({ session }: ProductKeywordDataPageProps) {
  const currentStore = session.currentStore?.storeCode || session.currentStore?.projectCode || ''

  return (
    <section data-testid="product-keyword-data-page">
      <div data-testid="product-keyword-store-filter">{currentStore}</div>
    </section>
  )
}
