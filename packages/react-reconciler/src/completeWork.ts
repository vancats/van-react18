import type { Container, Instance } from 'hostConfig'
import { appendInitialChild, createInstance, createTextInstance } from 'hostConfig'
import type { FiberNode } from './fiber'
import { ContextProvider, Fragment, FunctionComponent, HostComponent, HostRoot, HostText } from './workTags'
import { NoFlags, Ref, Update } from './fiberFlags'
import { popProvider } from './fiberContext'

function markUpdate(fiber: FiberNode) {
    fiber.flags |= Update
}

function markRef(fiber: FiberNode) {
    fiber.flags |= Ref
}

export const completeWork = (wip: FiberNode) => {
    const newProps = wip.pendingProps
    const current = wip.alternate
    switch (wip.tag) {
        case HostComponent:
            if (current !== null && wip.stateNode) {
                // TODO 应该要做部分的更新，并且有更新了再标记 Update
                markUpdate(wip)
                // 标记 ref
                if (current.ref !== wip.ref) {
                    markRef(wip)
                }
            }
            else {
                // 1. 构建DOM
                const instance = createInstance(wip.type, newProps)
                // 2. 插入到DOM树
                appendAllChildren(instance, wip)
                wip.stateNode = instance
                // 3. 标记 ref
                if (wip.ref !== null) {
                    markRef(wip)
                }
            }
            bubbleProperties(wip)
            return
        case HostText:
            if (current !== null && wip.stateNode) {
                // update
                const oldText = current.memoizedProps.content
                const newText = newProps.content
                if (oldText !== newText) {
                    markUpdate(wip)
                }
            }
            else {
                // 1. 构建DOM
                const instance = createTextInstance(newProps.content)
                // 不需要再插入子节点
                wip.stateNode = instance
            }
            bubbleProperties(wip)
            return
        case HostRoot:
        case FunctionComponent:
        case Fragment:
            bubbleProperties(wip)
            return
        case ContextProvider:
            popProvider(wip.type._context)
            bubbleProperties(wip)
            return
        default:
            if (__DEV__) {
                console.warn('未实现的类型', wip)
            }
            break
    }
    return null
}

function appendAllChildren(parent: Container | Instance, wip: FiberNode) {
    let node = wip.child
    while (node !== null) {
        if (node.tag === HostComponent || node.tag === HostText) {
            appendInitialChild(parent, node?.stateNode)
        }
        else if (node.child !== null) {
            node.child.return = node
            node = node.child
            continue
        }

        if (node === wip) {
            return
        }

        while (node.sibling === null) {
            if (node.return === null || node.return === wip) {
                return
            }
            node = node.return
        }
        node.sibling.return = node.return
        node = node.sibling
    }
}

function bubbleProperties(wip: FiberNode) {
    let subtreeFlags = NoFlags
    let child = wip.child
    while (child !== null) {
        subtreeFlags |= child.subtreeFlags
        subtreeFlags |= child.flags
        child.return = wip
        child = child.sibling
    }

    wip.subtreeFlags |= subtreeFlags
}
