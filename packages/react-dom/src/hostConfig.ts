import type { FiberNode } from 'react-reconciler/src/fiber'
import { HostText } from 'react-reconciler/src/workTags'

export type Container = Element
export type Instance = Element
export type TextInstance = Text

export const createInstance = (type: string): Instance => {
    const element = document.createElement(type)
    // TODO 处理 props
    return element
}

export const createTextInstance = (context: string) => {
    return document.createTextNode(context)
}

export const appendInitialChild = (parent: Instance | Container, child: Instance) => {
    parent.appendChild(child)
}

export const appendChildToContainer = appendInitialChild

export const commitUpdate = (fiber: FiberNode) => {
    switch (fiber.tag) {
        case HostText:
            return commitTextUpdate(fiber.stateNode, fiber.pendingProps.content)
        default:
            if (__DEV__) {
                console.warn('未实现的update类型', fiber)
            }
    }
}

function commitTextUpdate(instance: TextInstance, content: string) {
    instance.textContent = content
}

export function removeChild(child: Instance | TextInstance, container: Container) {
    container.removeChild(child)
}
