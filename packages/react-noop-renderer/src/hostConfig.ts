import type { FiberNode } from 'react-reconciler/src/fiber'
import { HostComponent, HostText } from 'react-reconciler/src/workTags'
import type { Props } from 'shared/ReactType'

export interface Container {
    rootId: number
    children: Array<Instance | TextInstance>
}

export interface Instance {
    id: number
    type: string
    children: Array<Instance | TextInstance>
    parent: number
    props: Props
}

export interface TextInstance {
    text: string
    id: number
    parent: number
}

let instanceCounter = 0
export const createInstance = (type: string, props: Props): Instance => {
    return {
        id: instanceCounter++,
        type,
        children: [],
        parent: -1,
        props,
    }
}

export const createTextInstance = (context: string) => {
    return {
        text: context,
        id: instanceCounter++,
        parent: -1,
    }
}

export const appendInitialChild = (parent: Instance | Container, child: Instance) => {
    const prevParentId = child.parent
    const parentId = 'rootId' in parent ? parent.rootId : parent.id
    if (prevParentId !== -1 && prevParentId !== parentId) {
        throw new Error('不能重复挂在child')
    }
    child.parent = parentId
    parent.children.push(child)
}

export const appendChildToContainer = (parent: Container, child: Instance) => {
    const prevParentId = child.parent
    if (prevParentId !== -1 && prevParentId !== parent.rootId) {
        throw new Error('不能重复挂在child')
    }
    child.parent = parent.rootId
    parent.children.push(child)
}

export const commitUpdate = (fiber: FiberNode) => {
    switch (fiber.tag) {
        case HostText:
            return commitTextUpdate(fiber.stateNode, fiber.memoizedProps?.content)
        default:
            if (__DEV__) {
                console.warn('未实现的update类型', fiber)
            }
    }
}

function commitTextUpdate(instance: TextInstance, content: string) {
    instance.text = content
}

export function removeChild(child: Instance | TextInstance, container: Container) {
    const index = container.children.indexOf(child)
    if (index === -1) {
        throw new Error('child不存在 ')
    }
    container.children.splice(index, 1)
}

export function insertChildToContainer(
    child: Instance,
    container: Container,
    before: Instance,
) {
    const beforeIndex = container.children.indexOf(before)
    if (beforeIndex === -1) {
        throw new Error('before不存在')
    }
    const index = container.children.indexOf(child)
    if (index === -1) {
        container.children.splice(index, 1)
    }
    container.children.splice(beforeIndex, 0, child)
}

export const scheduleMicroTask
    = typeof queueMicrotask === 'function'
        ? queueMicrotask
        : typeof Promise === 'function'
            ? (callback: (...args: any) => void) => Promise.resolve(null).then(callback)
            : setTimeout
