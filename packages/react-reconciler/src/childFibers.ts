import type { Key, Props, ReactElementType } from 'shared/ReactTypes'
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols'
import { FiberNode, createFiberFromElement, createFiberFromFragment, createWorkInProgress } from './fiber'
import { ChildDeletion, Placement } from './fiberFlags'
import { Fragment, HostText } from './workTags'

type ExistingChildren = Map<string | number, FiberNode>

function ChildReconciler(shouldTrackEffects: boolean) {
    function placeSingleChild(fiber: FiberNode) {
        // 代表是 mount
        if (shouldTrackEffects && fiber.alternate === null) {
            fiber.flags |= Placement
        }
        return fiber
    }

    function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
        if (!shouldTrackEffects) {
            return
        }
        const deletions = returnFiber.deletions
        if (deletions === null) {
            returnFiber.deletions = [childToDelete]
            returnFiber.flags |= ChildDeletion
        }
        else {
            deletions.push(childToDelete)
        }
    }

    function deleteRemainingChildren(returnFiber: FiberNode, currentFirstChild: FiberNode | null) {
        if (!shouldTrackEffects) {
            return
        }
        let childToDelete = currentFirstChild
        while (childToDelete !== null) {
            deleteChild(returnFiber, childToDelete)
            childToDelete = childToDelete.sibling
        }
    }

    function reconcileSingleElement(
        returnFiber: FiberNode,
        currentFiber: FiberNode | null,
        element: ReactElementType,
    ) {
        while (currentFiber !== null) {
            // 只有 key 和 type 都相同时进行复用，其他情况都直接删除重建
            if (element.key === currentFiber.key) {
                if (element.$$typeof === REACT_ELEMENT_TYPE) {
                    if (element.type === currentFiber.type) {
                        // 找到可复用节点
                        let props = element.props
                        if (element.type === REACT_FRAGMENT_TYPE) {
                            // 对于Fragment，props 就是 props.children
                            props = element.props.children
                        }
                        const existing = useFiber(currentFiber, props)
                        existing.return = returnFiber
                        deleteRemainingChildren(returnFiber, currentFiber.sibling)
                        return existing
                    }
                    // key 相同，type 不同，删除所有节点
                    deleteRemainingChildren(returnFiber, currentFiber)
                    break
                }
                else {
                    if (__DEV__) {
                        console.warn('暂未实现该类型', element)
                        break
                    }
                }
            }
            else {
                // key 不同直接删
                deleteChild(returnFiber, currentFiber)
                currentFiber = currentFiber.sibling
            }
        }

        let fiber: FiberNode
        if (element.type === REACT_FRAGMENT_TYPE) {
            fiber = createFiberFromFragment(element.props.children, element.key)
        }
        else {
            fiber = createFiberFromElement(element)
        }

        fiber.return = returnFiber
        return fiber
    }

    function reconcileSingleTextNode(
        returnFiber: FiberNode,
        currentFiber: FiberNode | null,
        content: string | number,
    ) {
        while (currentFiber !== null) {
            if (currentFiber.tag === HostText) {
                const existing = useFiber(currentFiber, { content })
                existing.return = returnFiber
                deleteRemainingChildren(returnFiber, currentFiber.sibling)
                return existing
            }
            else {
                deleteChild(returnFiber, currentFiber)
                currentFiber = currentFiber.sibling
            }
        }
        const fiber = new FiberNode(HostText, { content }, null)
        fiber.return = returnFiber
        return fiber
    }

    function reconcileChildrenArray(
        returnFiber: FiberNode,
        currentFirstChild: FiberNode | null,
        newChild: any[],
    ) {
        let lastPlacedIndex = 0
        let lastNewFiber: FiberNode | null = null
        let firstNewFiber: FiberNode | null = null

        // 1. 将 current 保存到 map 中
        const existingChildren: ExistingChildren = new Map()
        let current = currentFirstChild
        while (current !== null) {
            const keyToUse = current.key !== null ? current.key : current.index
            existingChildren.set(keyToUse, current)
            current = current.sibling
        }

        // 2. 遍历 newChild，寻找复用节点
        for (let i = 0; i < newChild.length; i++) {
            const after = newChild[i]
            const newFiber = updateFromMap(returnFiber, existingChildren, i, after)

            if (newFiber === null) {
                // 这时候返回的是 null false 等类型
                continue
            }

            // 3. 标记移动或者插入
            newFiber.index = i
            newFiber.return = returnFiber

            if (lastNewFiber === null) {
                lastNewFiber = newFiber
                firstNewFiber = newFiber
            }
            else {
                lastNewFiber.sibling = newFiber
                lastNewFiber = lastNewFiber.sibling
            }

            if (!shouldTrackEffects) {
                continue
            }

            // 找到当前 current 的 index，并比较
            const current = newFiber.alternate
            if (current !== null) {
                const oldIndex = current.index
                // 当老下标比现在的下标小，那么左右位置发生变化了
                if (oldIndex < lastPlacedIndex) {
                    newFiber.flags |= Placement
                    continue
                }
                else {
                    lastPlacedIndex = oldIndex
                }
            }
            else {
                // mount
                newFiber.flags |= Placement
            }
        }

        // 4. 将 map 中剩下的都标记删除
        existingChildren.forEach(fiber => {
            deleteChild(returnFiber, fiber)
        })

        return firstNewFiber
    }

    function updateFromMap(
        returnFiber: FiberNode,
        existingChildren: ExistingChildren,
        index: number,
        element: any,
    ) {
        const keyToUse = element.key !== null ? element.key : index
        const before = existingChildren.get(keyToUse)

        if (typeof element === 'string' || typeof element === 'number') {
            // HostText
            if (before && before.tag === HostText) {
                existingChildren.delete(keyToUse)
                return useFiber(before, { content: String(element) })
            }
            return new FiberNode(HostText, { content: String(element) }, null)
        }

        if (typeof element === 'object' && element !== null) {
            switch (element.$$typeof) {
                case REACT_ELEMENT_TYPE:
                    if (element.type === REACT_FRAGMENT_TYPE) {
                        return updateFragment(
                            returnFiber,
                            before,
                            element, // 这时候的 element 就是Fragment的 children 数组
                            keyToUse,
                            existingChildren,
                        )
                    }
                    if (before && element.type === before.type) {
                        existingChildren.delete(keyToUse)
                        return useFiber(before, element.props)
                    }
                    return createFiberFromElement(element)
            }
        }

        if (Array.isArray(element)) {
            // 直接传入数组的情况，直接当作Fragment处理
            return updateFragment(returnFiber, before, element, keyToUse, existingChildren)
        }

        return null
    }

    return function (
        returnFiber: FiberNode,
        currentFiber: FiberNode | null,
        newChild?: any,
    ) {
        // 根节点就是Fragment的组件
        const isUnKeyedTopLevelFragment = typeof newChild === 'object'
            && newChild !== null
            && newChild.type === REACT_FRAGMENT_TYPE
            && newChild.key === null

        if (isUnKeyedTopLevelFragment) {
            // 新的子节点就是它的 props.children
            newChild = newChild.props.children
        }

        if (typeof newChild === 'object' && newChild !== null) {
            if (Array.isArray(newChild)) {
                // 多节点
                return reconcileChildrenArray(returnFiber, currentFiber, newChild)
            }

            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                    return placeSingleChild(reconcileSingleElement(returnFiber, currentFiber, newChild))
                default:
                    if (__DEV__) {
                        console.warn('未实现的reconcile类型', newChild)
                    }
            }
        }

        if (typeof newChild === 'string' || typeof newChild === 'number') {
            return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFiber, newChild))
        }

        // 兜底删除操作
        if (currentFiber !== null) {
            deleteRemainingChildren(returnFiber, currentFiber)
        }

        if (__DEV__) {
            console.warn('未实现的reconcile类型', newChild)
        }

        return null
    }
}

function useFiber(fiber: FiberNode, pendingProps: Props) {
    const clone = createWorkInProgress(fiber, pendingProps)
    clone.index = 0
    clone.sibling = null
    return clone
}

function updateFragment(
    returnFiber: FiberNode,
    current: FiberNode | undefined,
    elements: any[],
    key: Key,
    existingChildren: ExistingChildren,
) {
    let fiber: FiberNode
    if (!current || current.tag !== Fragment) {
        fiber = createFiberFromFragment(elements, key)
    }
    else {
        existingChildren.delete(key)
        fiber = useFiber(current, elements)
    }
    fiber.return = returnFiber
    return fiber
}

export const reconcileChildFibers = ChildReconciler(true)
export const mountChildFibers = ChildReconciler(false)
