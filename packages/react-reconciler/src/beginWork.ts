import type { ReactElementType } from 'shared/ReactType'
import { mountChildFibers, reconcileChildFibers } from './childFibers'
import type { FiberNode } from './fiber'
import { type UpdateQueue, processUpdateQueue } from './updateQueue'
import { FunctionComponent, HostComponent, HostRoot, HostText } from './workTags'
import { renderWithHooks } from './fiberHooks'

/**
 * 1. 通过对比子节点的 current 与 ReactElement，生成相应的 wip
 * 2. 只标记结构相关副作用：Placement ChildDeletion
 */
export const beginWork = (wip: FiberNode) => {
    switch (wip.tag) {
        case HostRoot:
            return updateHostRoot(wip)
        case HostComponent:
            return updateHostComponent(wip)
        case FunctionComponent:
            return updateFunctionComponent(wip)
        case HostText:
            return null
        default:
            if (__DEV__) {
                console.warn('未支持处理该tag', wip)
            }
    }
    return null
}

function updateHostRoot(wip: FiberNode) {
    // 之前的 state 状态，在 mount 时不存在
    const baseState = wip.memoizedState
    const updateQueue = wip.updateQueue as UpdateQueue<ReactElementType>
    const pending = updateQueue.shared.pending
    updateQueue.shared.pending = null

    // mount 传入的 action 实际上是<App />的ReactElement
    const { memoizedState } = processUpdateQueue(baseState, pending)
    wip.memoizedState = memoizedState

    const nextChildren = memoizedState
    reconcileChildren(wip, nextChildren)
    return wip.child
}

function updateHostComponent(wip: FiberNode) {
    const nextProps = wip.pendingProps
    const nextChildren = nextProps.children
    reconcileChildren(wip, nextChildren)
    return wip.child
}

function updateFunctionComponent(wip: FiberNode) {
    const nextChildren = renderWithHooks(wip)
    reconcileChildren(wip, nextChildren)
    return wip.child
}

function reconcileChildren(wip: FiberNode, nextChildren?: ReactElementType) {
    const current = wip.alternate
    /// 性能优化策略：mount 时之后 hostRootFiber 有 current，所以只会对其添加副作用
    if (current !== null) {
        wip.child = reconcileChildFibers(wip, current, nextChildren)
    }
    else {
        wip.child = mountChildFibers(wip, null, nextChildren)
    }
}
