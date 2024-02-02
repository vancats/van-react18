/* eslint-disable no-restricted-syntax */
/* eslint-disable no-labels */
import { type Container, type Instance, appendChildToContainer, commitUpdate, insertChildToContainer, removeChild } from 'hostConfig'
import type { FiberNode, FiberRootNode, PendingPassiveEffects } from './fiber'
import { ChildDeletion, MutationMask, NoFlags, PassiveEffect, PassiveMask, Placement, Update } from './fiberFlags'
import { FunctionComponent, HostComponent, HostRoot, HostText } from './workTags'
import type { Effect, FCUpdateQueue } from './fiberHooks'
import type { HookFlags } from './hookEffectTags'
import { HasEffect } from './hookEffectTags'

let nextEffect: FiberNode | null = null
export function commitMutationEffects(finishedWork: FiberNode, root: FiberRootNode) {
    nextEffect = finishedWork
    while (nextEffect !== null) {
        const child: FiberNode | null = nextEffect.child
        // 如果子节点中还含有Mutation阶段副作用，向下
        if ((nextEffect.subtreeFlags & (MutationMask | PassiveMask)) !== NoFlags && child !== null) {
            nextEffect = child
        }
        else {
            up: while (nextEffect !== null) {
                // 对当前节点进行 mutation 操作
                commitMutationEffectsOnFiber(nextEffect, root)
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

function commitMutationEffectsOnFiber(finishedWork: FiberNode, root: FiberRootNode) {
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
            deletions.forEach(deletion => commitDeletion(deletion, root))
        }
        // 消除副作用
        finishedWork.flags &= ~ChildDeletion
    }

    /// PassiveEffect
    if ((flags & PassiveEffect) !== NoFlags) {
        commitPassiveEffect(finishedWork, root, 'update')
        finishedWork.flags &= ~PassiveEffect
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

function commitDeletion(childToDelete: FiberNode, root: FiberRootNode) {
    if (__DEV__) {
        console.warn('执行Deletion操作', childToDelete)
    }

    // 由于Fragment的存在，可能需要删除多个同级节点，因此在找到第一个子节点后，后续的节点需要判断是否为同级，如果同级，则也要被删除
    const rootChildrenToDelete: FiberNode[] = []

    commitNestedComponent(childToDelete, unmountFiber => {
        switch (unmountFiber.tag) {
            case HostComponent:
                recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber)
                // TODO 解绑ref
                break
            case HostText:
                recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber)

                break
            case FunctionComponent:
                commitPassiveEffect(unmountFiber, root, 'unmount')
                // TODO 解绑ref
                break
            default:
                if (__DEV__) {
                    console.warn('未处理的unmount类型', unmountFiber.tag)
                }
        }
    })

    if (rootChildrenToDelete.length) {
        const hostParent = getHostParent(childToDelete)
        if (hostParent !== null) {
            rootChildrenToDelete.forEach(node => {
                removeChild(node.stateNode, hostParent)
            })
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

function recordHostChildrenToDelete(childrenToDelete: FiberNode[], unmountFiber: FiberNode) {
    // 1. 找到最后一个 rootHost 节点
    const lastOne = childrenToDelete[childrenToDelete.length - 1]
    if (!lastOne) {
        childrenToDelete.push(unmountFiber)
    }
    else {
        // 2. 每找到一个节点，判断它是不是第一步的兄弟节点
        let node = lastOne.sibling
        while (node !== null) {
            if (unmountFiber === node) {
                childrenToDelete.push(unmountFiber)
            }
            node = node.sibling
        }
    }
}

function commitPassiveEffect(finishedWork: FiberNode, root: FiberRootNode, type: keyof PendingPassiveEffects) {
    if (finishedWork.tag !== FunctionComponent || (type === 'update' && (finishedWork.flags & PassiveEffect) === NoFlags)) {
        return
    }
    const updateQueue = finishedWork.updateQueue as FCUpdateQueue<any>
    if (updateQueue !== null) {
        if (updateQueue.lastEffect === null && __DEV__) {
            console.error('当FC 存在PassiveEffect，不应该不存在effect')
        }
        root.pendingPassiveEffects[type].push(updateQueue.lastEffect!)
    }
}

function commitHookEffectList(flags: HookFlags, lastEffect: Effect, callback: (effect: Effect) => void) {
    let effect = lastEffect.next!
    do {
        if ((effect.tag & flags) === flags) {
            callback(effect)
        }
        effect = effect.next!
    } while (effect !== lastEffect.next)
}

export function commitHookEffectListUnmount(flags: HookFlags, lastEffect: Effect) {
    commitHookEffectList(flags, lastEffect, effect => {
        const destroy = effect.destroy
        if (typeof destroy === 'function') {
            destroy()
        }
        effect.tag &= ~HasEffect
    })
}

export function commitHookEffectListDestroy(flags: HookFlags, lastEffect: Effect) {
    commitHookEffectList(flags, lastEffect, effect => {
        const destroy = effect.destroy
        if (typeof destroy === 'function') {
            destroy()
        }
    })
}

export function commitHookEffectListCreate(flags: HookFlags, lastEffect: Effect) {
    commitHookEffectList(flags, lastEffect, effect => {
        const create = effect.create
        if (typeof create === 'function') {
            effect.destroy = create()
        }
    })
}
