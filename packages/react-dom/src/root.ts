import { createContainer, updateContainer } from 'react-reconciler/src/fiberReconcile'
import type { ReactElementType } from 'shared/ReactType'
import type { Container } from './hostConfig'
import { initEvent } from './SyntheticEvent'

export function createRoot(container: Container) {
    const root = createContainer(container)

    return {
        render(element: ReactElementType) {
            initEvent(container, 'click')
            return updateContainer(element, root)
        },
    }
}
