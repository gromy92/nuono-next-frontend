import type { OperationsSkinView } from './types'
import { hasConfiguredSkinComponents } from './skinPreview'

const papersayLikeSkin: Pick<OperationsSkinView, 'coverImageUrl' | 'components'> = {
  coverImageUrl: '/operations-skins/papersay-components-final/01-frame-thin.png',
  components: [{
    templateRole: 'HERO_MAIN',
    componentKey: 'FRAME',
    imageUrl: '/api/operations/skin-management/assets/frame.png?storeCode=STR69486-NSA',
    x: 0,
    y: 0,
    width: 1247,
    height: 1706,
    zIndex: 40,
    required: true,
    locked: true
  }]
}

const shouldUseComponentPreview: boolean = hasConfiguredSkinComponents(papersayLikeSkin)

void shouldUseComponentPreview
