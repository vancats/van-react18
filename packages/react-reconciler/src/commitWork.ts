/* eslint-disable no-restricted-syntax */
/* eslint-disable no-labels */
import { type Container, type Instance, appendChildToContainer, commitUpdate, insertChildToContainer, removeChild } from 'hostConfig'
import type { FiberNode, FiberRootNode } from './fiber'
import { ChildDeletion, MutationMask, NoFlags, Placement, Update } from './fiberFlags'
import { FunctionComponent, HostComponent, HostRoot, HostText } from './workTags'

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
        // 消除副作用
        finishedWork.flags &= ~Placement
    }

    /// Update
    if ((flags & Update) !== NoFlags) {
        commitUpdate(finishedWork)
        // 消除副作用
        finishedWork.flags &= ~Update
    }

    /// ChildDeletion
    if ((flags & ChildDeletion) !== NoFlags) {
        const deletions = finishedWork.deletions
        if (deletions !== null) {
            deletions.forEach(commitDeletion)
        }
        // 消除副作用
        finishedWork.flags &= ~ChildDeletion
    }
}

function commitDeletion(childToDelete: FiberNode) {
    if (__DEV__) {
        console.warn('执行Deletion操作', childToDelete)
    }

    let rootHostNode: FiberNode | null = null

    commitNestedComponent(childToDelete, unmountFiber => {
        switch (unmountFiber.tag) {
            case HostComponent:
                if (rootHostNode === null) {
                    rootHostNode = unmountFiber
                }
                // TODO 解绑ref
                break
            case HostText:
                if (rootHostNode === null) {
                    rootHostNode = unmountFiber
                }
                break
            case FunctionComponent:
                // TODO 解绑ref
                // TODO useEffect unmount
                break
            default:
                if (__DEV__) {
                    console.warn('未处理的unmount类型', unmountFiber.tag)
                }
        }
    })

    if (rootHostNode !== null) {
        const hostParent = getHostParent(childToDelete)
        if (hostParent !== null) {
            removeChild((rootHostNode as FiberNode).stateNode, hostParent)
        }
    }

    // 重置
    childToDelete.return = null
    childToDelete.child = null
}

function commitNestedComponent(
    root: FiberNode,
    onCommitUnmount: (fiber: FiberNode) => void,
) {
    let node: FiberNode | null = root
    while (node !== null) {
        onCommitUnmount(node)
        if (node.child !== null) {
            node.child.return = node
            node = node.child
            continue
        }
        if (node === root) {
            return
        }
        while (node.sibling === null) {
            if (node.return === null || node.return === root) {
                return
            }
            node = node.return
        }
        node.sibling.return = node.return
        node = node.sibling
    }
}

function commitPlacement(finishedWork: FiberNode) {
    if (__DEV__) {
        console.warn('执行Placement操作', finishedWork)
    }
    const hostParent = getHostParent(finishedWork)
    const hostSibling = getHostSibling(finishedWork)

    if (hostParent !== null) {
        insertOrAppendPlacementNodeIntoContainer(finishedWork, hostParent, hostSibling)
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

function getHostSibling(finishedWork: FiberNode): Instance | null {
    let node: FiberNode = finishedWork

    findSibling: while (true) {
        while (node.sibling === null) {
            const parent = node.return
            if (
                parent === null
                || parent.tag === HostComponent
                || parent.tag === HostRoot
            ) {
                // 如果是元素节点或者根节点，则不用再找它的兄弟节点了
                return null
            }
            node = parent
        }

        node.sibling.return = node.return
        node = node.sibling

        while (node?.tag !== HostText && node.tag !== HostComponent) {
            if ((node.flags & Placement) !== NoFlags) {
                continue findSibling
            }
            if (node.child === null) {
                continue findSibling
            }
            else {
                node.child.return = node
                node = node.child
            }
        }

        if ((node.flags & Placement) === NoFlags) {
            return node.stateNode
        }
    }
}

function insertOrAppendPlacementNodeIntoContainer(
    finishedWork: FiberNode,
    hostParent: Container,
    hostSibling?: Instance | null,
) {
    if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
        if (hostSibling) {
            insertChildToContainer(finishedWork.stateNode, hostParent, hostSibling)
        }
        else {
            appendChildToContainer(hostParent, finishedWork.stateNode)
        }
        return
    }
    const child = finishedWork.child
    // 找到某一层中的 child 和它的 sibling
    if (child) {
        insertOrAppendPlacementNodeIntoContainer(child, hostParent)
        let sibling = child.sibling
        while (sibling !== null) {
            insertOrAppendPlacementNodeIntoContainer(sibling, hostParent)
            sibling = sibling.sibling
        }
    }
}
