import type { ReactElementType } from 'shared/ReactType'

/// 对于 test 文件来说，React和ReactDOM都应该是外部依赖，不应该内部引入
// @ts-ignore
import { createRoot } from 'react-dom'

export function renderIntoDocument(element: ReactElementType) {
    const div = document.createElement('div')
    return createRoot(div).render(element)
}
