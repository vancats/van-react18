import type { FiberNode } from 'react-reconciler/src/fiber'
import { HostComponent, HostText } from 'react-reconciler/src/workTags'
import type { Props } from 'shared/ReactType'
import type { DOMElement } from './SyntheticEvent'
import { updateFiberProps } from './SyntheticEvent'

export type Container = Element
export type Instance = Element
export type TextInstance = Text

export const createInstance = (type: string, props: Props): Instance => {
    const element = document.createElement(type) as unknown
    updateFiberProps(element as DOMElement, props)
    return element as DOMElement
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
        case HostComponent:
            // TODO 处理一些更新Props的流程
            return
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

export function insertChildToContainer(
    child: Instance,
    container: Container,
    before: Instance,
) {
    container.insertBefore(child, before)
}

export const scheduleMicroTask
    = typeof queueMicrotask === 'function'
        ? queueMicrotask
        : typeof Promise === 'function'
            ? (callback: (...args: any) => void) => Promise.resolve(null).then(callback)
            : setTimeout
