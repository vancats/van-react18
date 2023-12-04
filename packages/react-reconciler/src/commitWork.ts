/* eslint-disable no-restricted-syntax */
/* eslint-disable no-labels */
import { type Container, appendChildToContainer } from 'hostConfig'
import type { FiberNode, FiberRootNode } from './fiber'
import { MutationMask, NoFlags, Placement } from './fiberFlags'
import { HostComponent, HostRoot, HostText } from './workTags'

let nextEffect: FiberNode | null = null
export function commitMutationEffects(finishedWork: FiberNode) {
    nextEffect = finishedWork
    while (nextEffect !== null) {
        const child: FiberNode | null = nextEffect.child
        // 如果子节点中还含有Mutation阶段副作用，向下
        if ((nextEffect.subtreeFlags & MutationMask) !== NoFlags && child !== null) {
            nextEffect = child
        }
        else {
            up: while (nextEffect !== null) {
                // 对当前节点进行 mutation 操作
                commitMutationEffectsOnFiber(nextEffect)
                // 向右向上遍历
                const sibling: FiberNode | null = nextEffect.sibling
                if (sibling !== null) {
                    nextEffect = sibling
                    break up
                }
                nextEffect = nextEffect.return
            }
        }
    }
}

function commitMutationEffectsOnFiber(finishedWork: FiberNode) {
    const flags = finishedWork.flags
    /// Placement
    if ((flags & Placement) !== NoFlags) {
        commitPlacement(finishedWork)
        // 消除 Placement
        finishedWork.flags &= ~Placement
    }
}

function commitPlacement(finishedWork: FiberNode) {
    if (__DEV__) {
        console.warn('执行Placement操作', finishedWork)
    }
    const parentNode = getHostParent(finishedWork)
    if (parentNode !== null) {
        appendPlacementNodeIntoContainer(finishedWork, parentNode)
    }
}

function getHostParent(fiber: FiberNode): Container | null {
    let parent = fiber.return
    while (parent) {
        if (parent.tag === HostComponent) {
            return parent.stateNode as Container
        }
        if (parent.tag === HostRoot) {
            return (parent.stateNode as FiberRootNode).container
        }
        parent = parent.return
    }
    if (__DEV__) {
        console.warn('未找到parent节点', fiber)
    }
    return null
}

function appendPlacementNodeIntoContainer(finishedWork: FiberNode, parentNode: Container) {
    if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
        appendChildToContainer(parentNode, finishedWork.stateNode)
        return
    }
    const child = finishedWork.child
    // 找到某一层中的 child 和它的 sibling
    if (child) {
        appendPlacementNodeIntoContainer(child, parentNode)
        let sibling = child.sibling
        while (sibling !== null) {
            appendPlacementNodeIntoContainer(sibling, parentNode)
            sibling = sibling.sibling
        }
    }
}
