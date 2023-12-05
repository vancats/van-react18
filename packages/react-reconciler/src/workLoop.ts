import { beginWork } from './beginWork'
import { commitMutationEffects } from './commitWork'
import { completeWork } from './completeWork'
import { type FiberNode, type FiberRootNode, createWorkInProgress } from './fiber'
import { MutationMask, NoFlags } from './fiberFlags'
import { HostRoot } from './workTags'

let workInProgress: FiberNode | null = null
function prepareFreshStack(root: FiberRootNode) {
    // 创建/更新 wip
    workInProgress = createWorkInProgress(root.current, {})
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
    // 找到根节点
    const root = markUpdateFromFiberToRoot(fiber)
    renderRoot(root)
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

function renderRoot(root: FiberRootNode) {
    prepareFreshStack(root)

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

    // 重置操作
    root.finishedWork = null

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
    const next = beginWork(fiber)
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
