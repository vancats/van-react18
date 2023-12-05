import type { FiberNode } from './fiber'

export function renderWithHooks(fiber: FiberNode) {
    const Component = fiber.type
    const props = fiber.pendingProps
    const children = Component(props)
    return children
}
