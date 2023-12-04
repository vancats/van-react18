import type { ElementType, Key, Props, ReactElementType } from 'shared/ReactType'
import type { Container } from 'hostConfig'
import { FunctionComponent, HostComponent, type WorkTag } from './workTags'
import type { Flags } from './fiberFlags'
import { NoFlags } from './fiberFlags'

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
        this.subtreeFlags = NoFlags
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
        wip.subtreeFlags = NoFlags
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