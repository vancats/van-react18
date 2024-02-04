import type { ReactElementType } from 'shared/ReactTypes'
import { mountChildFibers, reconcileChildFibers } from './childFibers'
import type { FiberNode } from './fiber'
import { type UpdateQueue, processUpdateQueue } from './updateQueue'
import { ContextProvider, Fragment, FunctionComponent, HostComponent, HostRoot, HostText } from './workTags'
import { renderWithHooks } from './fiberHooks'
import type { Lane } from './fiberLanes'
import { Ref } from './fiberFlags'
import { pushProvider } from './fiberContext'

/**
 * 1. 通过对比子节点的 current 与 ReactElement，生成相应的 wip
 * 2. 只标记结构相关副作用：Placement ChildDeletion
 */
export const beginWork = (wip: FiberNode, renderLane: Lane) => {
    switch (wip.tag) {
        case HostRoot:
            return updateHostRoot(wip, renderLane)
        case HostComponent:
            return updateHostComponent(wip)
        case FunctionComponent:
            return updateFunctionComponent(wip, renderLane)
        case Fragment:
            return updateFragment(wip)
        case ContextProvider:
            return updateContextProvider(wip)
        case HostText:
            return null
        default:
            if (__DEV__) {
                console.warn('未支持处理该tag', wip)
            }
    }
    return null
}

function updateHostRoot(wip: FiberNode, renderLane: Lane) {
    // 之前的 state 状态，在 mount 时不存在
    const baseState = wip.memoizedState
    const updateQueue = wip.updateQueue as UpdateQueue<ReactElementType>
    const pending = updateQueue.shared.pending
    updateQueue.shared.pending = null

    // mount 传入的 action 实际上是<App />的ReactElement
    const { memoizedState } = processUpdateQueue(baseState, pending, renderLane)
    wip.memoizedState = memoizedState

    const nextChildren = memoizedState
    reconcileChildren(wip, nextChildren)
    return wip.child
}

function updateHostComponent(wip: FiberNode) {
    const nextProps = wip.pendingProps
    const nextChildren = nextProps.children
    markRef(wip.alternate, wip)
    reconcileChildren(wip, nextChildren)
    return wip.child
}

function updateFunctionComponent(wip: FiberNode, renderLane: Lane) {
    const nextChildren = renderWithHooks(wip, renderLane)
    reconcileChildren(wip, nextChildren)
    return wip.child
}

function updateFragment(wip: FiberNode) {
    // Fragment的children就在它的pendingProps上
    const nextChildren = wip.pendingProps
    reconcileChildren(wip, nextChildren)
    return wip.child
}

function updateContextProvider(wip: FiberNode) {
    const providerType = wip.type
    const context = providerType._context
    const newProps = wip.pendingProps

    pushProvider(context, newProps.value)

    const nextChildren = newProps.children
    reconcileChildren(wip, nextChildren)
    return wip.child
}

function reconcileChildren(wip: FiberNode, nextChildren?: ReactElementType) {
    const current = wip.alternate
    /// 性能优化策略：mount 时之后 hostRootFiber 有 current，所以只会对其添加副作用
    if (current !== null) {
        wip.child = reconcileChildFibers(wip, current.child, nextChildren)
    }
    else {
        wip.child = mountChildFibers(wip, null, nextChildren)
    }
}

function markRef(current: FiberNode | null, wip: FiberNode) {
    const ref = wip.ref
    if (
        // mount 时存在 ref
        (current === null && ref !== null)
        // update 时 ref 变化
        || (current !== null && current.ref !== ref)
    ) {
        wip.flags |= Ref
    }
}
