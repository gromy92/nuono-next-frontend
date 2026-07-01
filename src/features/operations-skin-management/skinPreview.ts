import type { OperationsSkinComponentView, OperationsSkinView } from './types'
import { HERO_MAIN_TEMPLATE_ROLE } from './skinDetailSuites'

export function hasConfiguredSkinComponents(row: Pick<OperationsSkinView, 'components'>) {
  return hasComponentImage(row.components, HERO_MAIN_TEMPLATE_ROLE)
}

function hasComponentImage(components?: OperationsSkinComponentView[] | null, templateRole?: string) {
  return (components ?? []).some((component) =>
    (!templateRole || component.templateRole === templateRole) && component.imageUrl?.trim()
  )
}
