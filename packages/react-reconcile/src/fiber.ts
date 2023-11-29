import type { ElementType, Key, Props } from 'shared/ReactType'
import type { WorkTag } from './workTags'
import type { Flags } from './fiberFlags'
import { NoFlags } from './fiberFlags'

export class FiberNode {
    tag: WorkTag
    key: Key
    type: ElementType
    ref: any

    return: FiberNode | null
    sibling: FiberNode | null
    child: FiberNode | null
    index: number

    pendingProps: Props
    memoizedProps: Props | null
    alternate: FiberNode | null
    flags: Flags

    constructor(tag: WorkTag, pendingProps: Props, key: Key) {
        this.tag = tag
        this.key = key
        this.type = null
        this.ref = null

        this.return = null
        this.sibling = null
        this.child = null
        this.index = 0

        this.pendingProps = pendingProps
        this.memoizedProps = null
        this.alternate = null
        this.flags = NoFlags
    }
}
