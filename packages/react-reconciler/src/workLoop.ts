import { scheduleMicroTask } from 'hostConfig'
import { beginWork } from './beginWork'
import { commitMutationEffects } from './commitWork'
import { completeWork } from './completeWork'
import { type FiberNode, type FiberRootNode, createWorkInProgress } from './fiber'
import { MutationMask, NoFlags } from './fiberFlags'
import { type Lane, NoLane, SyncLane, getHighestPriorityLane, markRootFinished, mergeLanes } from './fiberLanes'
import { flushSyncCallbacks, scheduleSyncCallback } from './syncTaskQueue'
import { HostRoot } from './workTags'

let workInProgress: FiberNode | null = null
let wipRootRenderLane: Lane = NoLane

function prepareFreshStack(root: FiberRootNode, lane: Lane) {
    // 创建/更新 wip
    workInProgress = createWorkInProgress(root.current, {})
    wipRootRenderLane = lane
}

function markUpdateFromFiberToRoot(fiber: FiberNode) {
    let node: FiberNode | null = fiber
    let parent = fiber.return
    while (parent !== null) {
        node = parent
        parent = node.return
    }
    if (node.tag === HostRoot) {
        return node.stateNode
    }
    return null
}

function markRootUpdated(root: FiberRootNode, lane: Lane) {
    root.pendingLanes = mergeLanes(root.pendingLanes, lane)
}

export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
    // 找到根节点
    const root = markUpdateFromFiberToRoot(fiber)
    // 在根节点的 Lane 集合上添加当前的 Lane
    markRootUpdated(root, lane)
    ensureRootIsScheduled(root)
}

function ensureRootIsScheduled(root: FiberRootNode) {
    const updateLane = getHighestPriorityLane(root.pendingLanes)
    if (updateLane === NoLane) {
        return
    }

    if (updateLane === SyncLane) {
        // 同步任务优先级，走微任务调度
        if (__DEV__) {
            console.warn('当前是微任务调度，优先级：', updateLane)
        }
        // 入队
        scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root, updateLane))
        // 调度微任务
        scheduleMicroTask(flushSyncCallbacks)
    }
    else {
        // 其他优先级宏任务调度
    }
}

function performSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
    const nextLane = getHighestPriorityLane(root.pendingLanes)
    if (nextLane !== SyncLane) {
        ensureRootIsScheduled(root)
        return
    }

    if (__DEV__) {
        console.warn('render阶段开始', root)
    }

    prepareFreshStack(root, lane)

    try {
        workLoop()
    }
    catch (e) {
        if (__DEV__) {
            console.warn('work loop failed', e)
        }
        workInProgress = null
    }

    // 这个就是 wip
    const finishedWork = root.current.alternate
    root.finishedWork = finishedWork
    root.finishedLane = lane
    wipRootRenderLane = NoLane

    commitRoot(root)
}

function commitRoot(root: FiberRootNode) {
    const finishedWork = root.finishedWork
    if (finishedWork === null) {
        return
    }
    if (__DEV__) {
        console.warn('commit阶段开始', finishedWork)
    }

    const lane = root.finishedLane
    if (lane === NoLane && __DEV__) {
        console.error('commit阶段finishedLane不应该是NoLane')
    }

    // 重置操作
    root.finishedWork = null
    root.finishedLane = NoLane

    markRootFinished(root, lane)

    const subtreeHasEffect = (finishedWork.subtreeFlags & MutationMask) !== NoFlags
    const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags

    // Mutation 阶段
    if (subtreeHasEffect || rootHasEffect) {
        commitMutationEffects(finishedWork)
        // 需要进行节点树切换
        root.current = finishedWork
    }
    else {
        root.current = finishedWork
    }
}

function workLoop() {
    while (workInProgress !== null) {
        performUnitOfWork(workInProgress)
    }
}

function performUnitOfWork(fiber: FiberNode) {
    const next = beginWork(fiber, wipRootRenderLane)
    // beginWork 执行后，pendingProps可以更新为memoizedProps
    fiber.memoizedProps = fiber.pendingProps

    if (next === null) {
        completeUnitOfWork(fiber)
    }
    else {
        workInProgress = next
    }
}

function completeUnitOfWork(fiber: FiberNode) {
    let node: FiberNode | null = fiber
    do {
        completeWork(node)
        if (node.sibling) {
            workInProgress = node.sibling
            return
        }
        else {
            node = node.return
            workInProgress = node
        }
    } while (node !== null)
}
