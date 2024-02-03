import { scheduleMicroTask } from 'hostConfig'
import type { CallbackNode } from 'scheduler'
import {
    unstable_NormalPriority,
    unstable_cancelCallback,
    unstable_scheduleCallback,
    unstable_shouldYield,
} from 'scheduler'
import { beginWork } from './beginWork'
import { commitHookEffectListCreate, commitHookEffectListDestroy, commitHookEffectListUnmount, commitMutationEffects } from './commitWork'
import { completeWork } from './completeWork'
import type { FiberNode, FiberRootNode, PendingPassiveEffects } from './fiber'
import { createWorkInProgress } from './fiber'
import { MutationMask, PassiveMask, hasMask } from './fiberFlags'
import { type Lane, NoLane, SyncLane, getHighestPriorityLane, lanesToSchedulerPriority, markRootFinished, mergeLanes } from './fiberLanes'
import { flushSyncCallbacks, scheduleSyncCallback } from './syncTaskQueue'
import { HostRoot } from './workTags'
import { HasEffect, Passive } from './hookEffectTags'

type RootExistStatus = number
const RootInComplete = 1 // 中断执行
const RootCompleted = 2 // 执行完毕
// TODO 执行过程中报错

let workInProgress: FiberNode | null = null
let wipRootRenderLane: Lane = NoLane
let rootDoesHasPassiveEffect = false

function prepareFreshStack(root: FiberRootNode, lane: Lane) {
    root.finishedLane = NoLane
    root.finishedWork = null
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

    // 如果当前的任务是 NoLane，初始化状态后返回
    const existingCallbackNode = root.callbackNode
    if (updateLane === NoLane) {
        if (existingCallbackNode !== null) {
            unstable_cancelCallback(existingCallbackNode)
        }
        root.callbackNode = null
        root.callbackPriority = NoLane
        return
    }

    const curPriority = updateLane
    const prevPriority = root.callbackPriority
    // 优先级相同，这里不需要执行，会在 performConcurrentWorkOnRoot 中进行重复工作
    if (curPriority === prevPriority) {
        return
    }

    // 从这里开始，是执行更高优先级的任务了
    if (existingCallbackNode !== null) {
        unstable_cancelCallback(existingCallbackNode)
    }

    if (__DEV__) {
        console.log(
            `在${updateLane === SyncLane ? '微' : '宏'}任务中调度，优先级：`,
            updateLane,
        )
    }

    let newCallbackNode: CallbackNode | null = null
    if (updateLane === SyncLane) {
        // 同步任务优先级，走微任务调度
        scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root))
        // 调度微任务
        scheduleMicroTask(flushSyncCallbacks)
    }
    else {
        // 其他优先级宏任务调度
        const schedulerPriority = lanesToSchedulerPriority(updateLane)
        newCallbackNode = unstable_scheduleCallback(
            schedulerPriority,
            performConcurrentWorkOnRoot.bind(null, root),
        )
    }

    root.callbackNode = newCallbackNode
    root.callbackPriority = curPriority
}

function performConcurrentWorkOnRoot(root: FiberRootNode, didTimeout: boolean) {
    const curCallbackNode = root.callbackNode
    // 保证 useEffect 的回调都已执行
    const didFlushPassiveEffect = flushPassiveEffects(root.pendingPassiveEffects)
    if (didFlushPassiveEffect) {
        // 如果 root 上的值不相等，代表这个值被更新到更高优先级了，已经有更高优先级的任务在执行，不需要再调度了
        if (root.callbackNode !== curCallbackNode) {
            return null
        }
    }
    const lane = getHighestPriorityLane(root.pendingLanes)
    if (lane === NoLane) {
        return null
    }

    const needSync = lane === SyncLane || didTimeout
    // render阶段
    const existStatus = renderRoot(root, lane, !needSync)

    ensureRootIsScheduled(root)

    if (existStatus === RootInComplete) {
        // 中断，插入了更高优先级的任务
        if (root.callbackNode !== curCallbackNode) {
            // 不需要做更多操作，因为上面已经开启了 schedule
            return null
        }
        return performConcurrentWorkOnRoot.bind(null, root)
    }
    if (existStatus === RootCompleted) {
        const finishedWork = root.current.alternate
        root.finishedWork = finishedWork
        root.finishedLane = lane
        wipRootRenderLane = NoLane
        commitRoot(root)
    }
    else if (__DEV__) {
        console.error('还未实现并发更新结束状态')
    }
}

function performSyncWorkOnRoot(root: FiberRootNode) {
    const nextLane = getHighestPriorityLane(root.pendingLanes)
    if (nextLane !== SyncLane) {
        ensureRootIsScheduled(root)
        return
    }

    const existStatus = renderRoot(root, nextLane, false)
    if (existStatus === RootCompleted) {
        // 这个就是 wip
        const finishedWork = root.current.alternate
        root.finishedWork = finishedWork
        root.finishedLane = nextLane
        wipRootRenderLane = NoLane
        commitRoot(root)
    }
    else if (__DEV__) {
        console.error('还未实现同步更新结束状态')
    }
}

function renderRoot(root: FiberRootNode, lane: Lane, shouldTimeSlice: boolean) {
    if (__DEV__) {
        console.log(`开始${shouldTimeSlice ? '并发' : '同步'}更新`, root)
    }

    // 两者相等时是并发更新时的中断重新执行
    if (wipRootRenderLane !== lane) {
        prepareFreshStack(root, lane)
    }

    try {
        shouldTimeSlice ? workLoopConcurrent() : workLoopSync()
    }
    catch (e) {
        if (__DEV__) {
            console.warn('work loop failed', e)
        }
        workInProgress = null
    }

    // 中断执行
    if (shouldTimeSlice && workInProgress !== null) {
        return RootInComplete
    }
    // render 阶段执行完
    if (!shouldTimeSlice && workInProgress !== null && __DEV__) {
        console.warn('render阶段结束wip不应该不是null', workInProgress)
    }
    // TODO 报错

    return RootCompleted
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

    // Passive 阶段
    if (hasMask(finishedWork, PassiveMask)) {
        if (!rootDoesHasPassiveEffect) {
            rootDoesHasPassiveEffect = true
            // 调度副作用
            unstable_scheduleCallback(unstable_NormalPriority, () => {
                flushPassiveEffects(root.pendingPassiveEffects)
                return undefined
            })
        }
    }

    // Mutation 阶段
    if (hasMask(finishedWork, MutationMask | PassiveMask)) {
        commitMutationEffects(finishedWork, root)
        // 需要进行节点树切换
        root.current = finishedWork
    }
    else {
        root.current = finishedWork
    }

    // 重置操作
    rootDoesHasPassiveEffect = false
    ensureRootIsScheduled(root)
}

function workLoopSync() {
    while (workInProgress !== null) {
        performUnitOfWork(workInProgress)
    }
}

function workLoopConcurrent() {
    while (workInProgress !== null && !unstable_shouldYield()) {
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

function flushPassiveEffects(pendingPassiveEffects: PendingPassiveEffects) {
    let didFlushPassiveEffect = false

    pendingPassiveEffects.unmount.forEach(effect => {
        didFlushPassiveEffect = true
        commitHookEffectListUnmount(Passive, effect)
    })
    pendingPassiveEffects.unmount = []

    pendingPassiveEffects.update.forEach(effect => {
        didFlushPassiveEffect = true
        commitHookEffectListDestroy(Passive | HasEffect, effect)
    })
    pendingPassiveEffects.update.forEach(effect => {
        didFlushPassiveEffect = true
        commitHookEffectListCreate(Passive | HasEffect, effect)
    })
    pendingPassiveEffects.update = []

    // 有可能在执行 effect 的时候又进行了 setState，需要再触发下
    flushSyncCallbacks()
    return didFlushPassiveEffect
}
