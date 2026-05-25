import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import type { ECharts, EChartsCoreOption } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { Alert, Empty, Spin, Typography } from 'antd'

const { Text } = Typography

echarts.use([LineChart, BarChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

export type EChartPanelState = 'ready' | 'loading' | 'empty' | 'error'

export type EChartPanelProps = {
  option?: EChartsCoreOption | null
  state?: EChartPanelState
  title?: ReactNode
  emptyText?: string
  errorText?: string
  height?: number
  testId: string
  ariaLabel: string
  className?: string
  style?: CSSProperties
}

const CHART_FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif'

export function EChartPanel({
  option,
  state: requestedState = 'ready',
  title,
  emptyText = '暂无图表数据',
  errorText = '图表加载失败',
  height = 300,
  testId,
  ariaLabel,
  className,
  style
}: EChartPanelProps) {
  const chartRef = useRef<HTMLDivElement | null>(null)
  const state: EChartPanelState = requestedState === 'ready' && !option ? 'empty' : requestedState
  const resolvedAriaLabel = ariaLabel

  useEffect(() => {
    if (state !== 'ready' || !option || !chartRef.current) return undefined

    const chart: ECharts = echarts.init(chartRef.current)
    chart.setOption({
      backgroundColor: 'transparent',
      textStyle: {
        fontFamily: CHART_FONT_FAMILY
      },
      ...option
    })

    const handleResize = () => chart.resize()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(handleResize)
    observer?.observe(chartRef.current)
    window.addEventListener('resize', handleResize)
    const initialResize = window.requestAnimationFrame(handleResize)

    return () => {
      window.cancelAnimationFrame(initialResize)
      observer?.disconnect()
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [option, state])

  return (
    <div className={className} style={style}>
      {title ? (
        <Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
          {title}
        </Text>
      ) : null}
      {state === 'loading' ? (
        <div
          data-testid={testId}
          role="status"
          aria-label={resolvedAriaLabel}
          style={stateContainerStyle(height)}
        >
          <Spin size="small" />
          <Text type="secondary">加载中</Text>
        </div>
      ) : null}
      {state === 'empty' ? (
        <div
          data-testid={testId}
          role="img"
          aria-label={resolvedAriaLabel}
          style={stateContainerStyle(height)}
        >
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
        </div>
      ) : null}
      {state === 'error' ? (
        <div
          data-testid={testId}
          role="img"
          aria-label={resolvedAriaLabel}
          style={stateContainerStyle(height)}
        >
          <Alert type="error" showIcon message={errorText} />
        </div>
      ) : null}
      {state === 'ready' ? (
        <div
          ref={chartRef}
          data-testid={testId}
          role="img"
          aria-label={resolvedAriaLabel}
          style={{ width: '100%', height, minWidth: 0 }}
        />
      ) : null}
    </div>
  )
}

function stateContainerStyle(height: number): CSSProperties {
  return {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    height,
    justifyContent: 'center',
    minWidth: 0,
    width: '100%'
  }
}
