import { beginWork } from './beginWork'
import { completeWork } from './completeWork'
import { type FiberNode, type FiberRootNode, createWorkInProgress } from './fiber'
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

    do {
        try {
            workLoop()
            break
        }
        catch (e) {
            if (__DEV__) {
                console.warn('work loop failed', e)
            }
            workInProgress = null
        }
    } while (true)
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
