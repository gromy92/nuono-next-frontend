import { Component, type ReactNode } from 'react'
import { Alert } from 'antd'

type WorkspaceErrorBoundaryProps = {
  boundaryName: string
  children?: ReactNode
}

type WorkspaceErrorBoundaryState = {
  error: Error | null
}

export class WorkspaceErrorBoundary extends Component<
  WorkspaceErrorBoundaryProps,
  WorkspaceErrorBoundaryState
> {
  constructor(props: WorkspaceErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error(`[workspace-error-boundary:${this.props.boundaryName}]`, error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <Alert
          type="error"
          showIcon
          message="页面暂时没有正常渲染"
          description={`${this.props.boundaryName} 触发了渲染错误：${this.state.error.message}`}
        />
      )
    }

    return this.props.children
  }
}
