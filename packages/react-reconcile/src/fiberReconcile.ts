import type { Container } from 'hostConfig'
import type { ReactElementType } from 'shared/ReactType'
import { FiberNode, FiberRootNode } from './fiber'
import { HostRoot } from './workTags'
import type { UpdateQueue } from './updateQueue'
import { createUpdate, createUpdateQueue, enqueueUpdate } from './updateQueue'
import { scheduleUpdateOnFiber } from './workLoop'

export function createContainer(container: Container) {
    const hostRootFiber = new FiberNode(HostRoot, {}, null)
    const root = new FiberRootNode(container, hostRootFiber)
    hostRootFiber.updateQueue = createUpdateQueue()
    return root
}

export function updateContainer(
    element: ReactElementType,
    root: FiberRootNode,
) {
    const hostRootFIber = root.current
    const update = createUpdate<ReactElementType | null>(element)
    enqueueUpdate(
        hostRootFIber.updateQueue as UpdateQueue<ReactElementType | null>,
        update,
    )
    scheduleUpdateOnFiber(root.current)

    return element
}
