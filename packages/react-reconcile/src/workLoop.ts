import { beginWork } from './beginWork'
import { completeWork } from './completeWork'
import type { FiberNode } from './fiber'

let workInProgress: FiberNode | null = null

function prepareFreshStack(root: FiberNode) {
    workInProgress = root
}

export function renderRoot(root: FiberNode) {
    prepareFreshStack(root)

    try {
        workLoop()
    }
    catch (error) {
        console.warn('work loop failed')
        workInProgress = null
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
