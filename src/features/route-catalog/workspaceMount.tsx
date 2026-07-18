import { lazy, Suspense, type ComponentType, type FunctionComponent, type ReactNode } from 'react'
import { Card, Spin } from 'antd'

const DYNAMIC_IMPORT_RELOAD_KEY = 'nuono:dynamic-import-reload'

type WorkspaceModule<T extends ComponentType<any>> = { default: T }
type ZeroProps = Record<never, never>

export type WorkspaceMountAdapter = FunctionComponent<ZeroProps>

function isDynamicImportLoadFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '')
  return message.includes('Failed to fetch dynamically imported module')
    || message.includes('Importing a module script failed')
}

export function loadWorkspaceModuleWithRecovery<T extends ComponentType<any>>(
  loader: () => Promise<WorkspaceModule<T>>
) {
  return loader()
    .then((module) => {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(DYNAMIC_IMPORT_RELOAD_KEY)
      }
      return module
    })
    .catch((error) => {
      if (
        isDynamicImportLoadFailure(error)
        && typeof window !== 'undefined'
        && window.sessionStorage.getItem(DYNAMIC_IMPORT_RELOAD_KEY) !== '1'
      ) {
        window.sessionStorage.setItem(DYNAMIC_IMPORT_RELOAD_KEY, '1')
        window.location.reload()
      }
      throw error
    })
}

export function lazyWorkspace<T extends ComponentType<any>>(
  loader: () => Promise<WorkspaceModule<T>>
) {
  return lazy(() => loadWorkspaceModuleWithRecovery(loader))
}

function WorkspaceLoadingFallback() {
  return (
    <Card variant="borderless" style={{ boxShadow: 'none', background: '#ffffff' }}>
      <Spin size="small" />
    </Card>
  )
}

export function LazyWorkspaceBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<WorkspaceLoadingFallback />}>{children}</Suspense>
}

export function createLazyWorkspaceMount(
  loader: () => Promise<WorkspaceModule<WorkspaceMountAdapter>>
): WorkspaceMountAdapter {
  const LazyWorkspace = lazyWorkspace(loader)

  const mountAdapter: WorkspaceMountAdapter = function LazyWorkspaceMountAdapter() {
    return (
      <LazyWorkspaceBoundary>
        <LazyWorkspace />
      </LazyWorkspaceBoundary>
    )
  }

  return Object.freeze(mountAdapter)
}
