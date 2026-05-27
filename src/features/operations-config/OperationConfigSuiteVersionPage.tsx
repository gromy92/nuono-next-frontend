import type { AuthSession } from '../auth/session'
import { OperationConfigVersionLibraryPage } from './OperationConfigVersionLibraryPage'

type OperationConfigSuiteVersionPageProps = {
  session: AuthSession
}

export function OperationConfigSuiteVersionPage({ session }: OperationConfigSuiteVersionPageProps) {
  return <OperationConfigVersionLibraryPage session={session} />
}

export function BusinessCalendarVersionLibraryPage({ session }: OperationConfigSuiteVersionPageProps) {
  return <OperationConfigVersionLibraryPage session={session} configType="BUSINESS_CALENDAR" title="业务日历" />
}

export function LifecycleVersionLibraryPage({ session }: OperationConfigSuiteVersionPageProps) {
  return <OperationConfigVersionLibraryPage session={session} configType="PRODUCT_LIFECYCLE" title="生命周期配置" />
}
