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
  onChartClick?: (params: { dataIndex?: number; name?: string; seriesName?: string }) => void
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
  style,
  onChartClick
}: EChartPanelProps) {
  const chartRef = useRef<HTMLDivElement | null>(null)
  const chartInstanceRef = useRef<ECharts | null>(null)
  const onChartClickRef = useRef(onChartClick)
  const state: EChartPanelState = requestedState === 'ready' && !option ? 'empty' : requestedState
  const resolvedAriaLabel = ariaLabel

  useEffect(() => {
    onChartClickRef.current = onChartClick
  }, [onChartClick])

  useEffect(() => {
    if (state !== 'ready' || !chartRef.current) return undefined
    const chart: ECharts = echarts.init(chartRef.current)
    chartInstanceRef.current = chart

    const handleChartClick = (params: unknown) => {
      const clickHandler = onChartClickRef.current
      if (!clickHandler || typeof params !== 'object' || !params) return
      const event = params as { dataIndex?: number; name?: string; seriesName?: string }
      clickHandler({
        dataIndex: event.dataIndex,
        name: event.name,
        seriesName: event.seriesName
      })
    }
    const handleResize = () => chart.resize()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(handleResize)
    observer?.observe(chartRef.current)
    window.addEventListener('resize', handleResize)
    chart.on('click', handleChartClick)
    const initialResize = window.requestAnimationFrame(handleResize)

    return () => {
      window.cancelAnimationFrame(initialResize)
      chart.off('click', handleChartClick)
      observer?.disconnect()
      window.removeEventListener('resize', handleResize)
      chart.dispose()
      if (chartInstanceRef.current === chart) {
        chartInstanceRef.current = null
      }
    }
  }, [state])

  useEffect(() => {
    if (state !== 'ready' || !option || !chartInstanceRef.current) return
    chartInstanceRef.current.setOption({
      backgroundColor: 'transparent',
      textStyle: {
        fontFamily: CHART_FONT_FAMILY
      },
      ...option
    }, true)
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
