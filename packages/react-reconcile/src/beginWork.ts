import type { FiberNode } from './fiber'

/**
 * 1. 通过对比子节点的 current 与 ReactElement，生成相应的 wip
 * 2. 只标记结构相关副作用：Placement ChildDeletion
 */
export const beginWork = (wip: FiberNode) => {
    return wip
}
