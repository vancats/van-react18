import type { ElementType, Key, Props } from 'shared/ReactType'
import type { Container } from 'hostConfig'
import type { WorkTag } from './workTags'
import type { Flags } from './fiberFlags'
import { NoFlags } from './fiberFlags'

export class FiberNode {
    tag: WorkTag
    key: Key
    type: ElementType
    stateNode: any
    ref: any

    return: FiberNode | null
    sibling: FiberNode | null
    child: FiberNode | null
    index: number

    pendingProps: Props
    memoizedProps: Props | null
    memoizedState: any
    alternate: FiberNode | null
    flags: Flags // 副作用
    updateQueue: unknown

    constructor(tag: WorkTag, pendingProps: Props, key: Key) {
        this.tag = tag
        this.key = key
        this.stateNode = null
        this.type = null
        this.ref = null

        this.return = null
        this.sibling = null
        this.child = null
        this.index = 0

        this.pendingProps = pendingProps
        this.memoizedProps = null
        this.memoizedState = null
        this.alternate = null
        this.flags = NoFlags
        this.updateQueue = null
    }
}

export class FiberRootNode {
    container: Container
    current: FiberNode
    finishedWork: FiberNode | null

    constructor(container: Container, hostRootFiber: FiberNode) {
        this.container = container
        this.current = hostRootFiber
        this.finishedWork = null
        hostRootFiber.stateNode = this
    }
}

export function createWorkInProgress(
    current: FiberNode,
    pendingProps: Props,
): FiberNode {
    let wip = current.alternate
    if (wip === null) {
        // mount
        wip = new FiberNode(current.tag, pendingProps, current.key)

        wip.stateNode = current.stateNode
        wip.alternate = current
        current.alternate = wip
    }
    else {
        // update
        wip.pendingProps = pendingProps
        wip.flags = NoFlags
    }
    // 这里是 updateQueue 中实现了 shared 的原因
    wip.updateQueue = current.updateQueue
    wip.type = current.type
    wip.child = current.child
    wip.memoizedProps = current.memoizedProps
    wip.memoizedState = current.memoizedState
    return wip
}
