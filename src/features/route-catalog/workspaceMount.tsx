import { lazy, Suspense, type ComponentType, type FunctionComponent, type ReactNode } from 'react'
import { Card, Spin } from 'antd'
import type { AuthSession } from '../auth/session'

const DYNAMIC_IMPORT_RELOAD_KEY = 'nuono:dynamic-import-reload'

type WorkspaceModule<T extends ComponentType<any>> = { default: T }

export type WorkspaceMountProps = {
  readonly active: boolean
  readonly session: AuthSession
}

export type WorkspaceMountAdapter = FunctionComponent<WorkspaceMountProps>

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
): WorkspaceMountAdapter
export function createLazyWorkspaceMount<PageProps extends object>(
  loader: () => Promise<WorkspaceModule<ComponentType<PageProps>>>,
  mapProps: (props: WorkspaceMountProps) => PageProps
): WorkspaceMountAdapter
export function createLazyWorkspaceMount(
  loader: () => Promise<WorkspaceModule<ComponentType<any>>>,
  mapProps?: (props: WorkspaceMountProps) => object
): WorkspaceMountAdapter {
  const LazyWorkspace = lazyWorkspace(loader)

  const mountAdapter: WorkspaceMountAdapter = function LazyWorkspaceMountAdapter(props) {
    const pageProps = mapProps ? mapProps(props) : props
    return (
      <LazyWorkspaceBoundary>
        <LazyWorkspace {...pageProps} />
      </LazyWorkspaceBoundary>
    )
  }

  return Object.freeze(mountAdapter)
}
