import type { Container } from 'hostConfig'
import type { ReactElementType } from 'shared/ReactTypes'
import { unstable_ImmediatePriority, unstable_runWithPriority } from 'scheduler'
import { FiberNode, FiberRootNode } from './fiber'
import { HostRoot } from './workTags'
import type { UpdateQueue } from './updateQueue'
import { createUpdate, createUpdateQueue, enqueueUpdate } from './updateQueue'
import { scheduleUpdateOnFiber } from './workLoop'
import { requestUpdateLane } from './fiberLanes'

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
    // 默认改成同步更新
    unstable_runWithPriority(unstable_ImmediatePriority, () => {
        const hostRootFiber = root.current
        const lane = requestUpdateLane()
        const update = createUpdate<ReactElementType | null>(element, lane)
        enqueueUpdate(
            hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
            update,
        )
        scheduleUpdateOnFiber(root.current, lane)
    })

    return element
}
