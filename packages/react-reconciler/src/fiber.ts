import type { ElementType, Key, Props, ReactElementType } from 'shared/ReactType'
import type { Container } from 'hostConfig'
import { Fragment, FunctionComponent, HostComponent, type WorkTag } from './workTags'
import type { Flags } from './fiberFlags'
import { NoFlags } from './fiberFlags'
import type { Lane, Lanes } from './fiberLanes'
import { NoLane, NoLanes } from './fiberLanes'
import type { Effect } from './fiberHooks'

export class FiberNode {
    tag: WorkTag
    key: Key
    // 如果是FC，就是 FC 函数，如果是元素，则是字符串
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
    subtreeFlags: Flags
    updateQueue: unknown
    // 需要被删除的子节点
    deletions: FiberNode[] | null

    constructor(tag: WorkTag, pendingProps: Props, key: Key) {
        this.tag = tag
        this.key = key || null
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
        this.subtreeFlags = NoFlags
        this.updateQueue = null
        this.deletions = null
    }
}

export interface PendingPassiveEffects {
    update: Effect[]
    unmount: Effect[]
}

export class FiberRootNode {
    container: Container
    current: FiberNode
    finishedWork: FiberNode | null
    pendingLanes: Lanes
    finishedLane: Lane
    pendingPassiveEffects: PendingPassiveEffects

    constructor(container: Container, hostRootFiber: FiberNode) {
        this.container = container
        this.current = hostRootFiber
        hostRootFiber.stateNode = this

        this.finishedWork = null
        this.pendingLanes = NoLanes
        this.finishedLane = NoLane
        this.pendingPassiveEffects = {
            update: [],
            unmount: [],
        }
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
        wip.subtreeFlags = NoFlags
        wip.deletions = null
    }
    // 这里是 updateQueue 中实现了 shared 的原因
    wip.updateQueue = current.updateQueue
    wip.type = current.type
    wip.child = current.child
    wip.memoizedProps = current.memoizedProps
    wip.memoizedState = current.memoizedState
    return wip
}

export function createFiberFromElement(element: ReactElementType) {
    const { type, key, props } = element
    let fiberTag: WorkTag = FunctionComponent

    if (typeof type === 'string') {
        fiberTag = HostComponent
    }
    else if (typeof type !== 'function' && __DEV__) {
        console.warn('未定义的type类型')
    }
    const fiber = new FiberNode(fiberTag, props, key)
    fiber.type = type
    return fiber
}

// Fragment 的 props 就是一个数组
export function createFiberFromFragment(elements: any[], key: Key) {
    const fiber = new FiberNode(Fragment, elements, key)
    return fiber
}
