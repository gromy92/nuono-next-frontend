import { ProfitCalculatorWorkbench } from './components/ProfitCalculatorWorkbench'
import type { ProfitCalculatorPageProps } from './profitPageTypes'

export function ProfitCalculatorPage(props: ProfitCalculatorPageProps) {
  return <ProfitCalculatorWorkbench {...props} />
}
