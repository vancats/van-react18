import type { Props, ReactElementType } from 'shared/ReactType'
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'
import { FiberNode, createFiberFromElement, createWorkInProgress } from './fiber'
import { ChildDeletion, Placement } from './fiberFlags'
import { HostText } from './workTags'

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

    function reconcileSingleElement(
        returnFiber: FiberNode,
        currentFiber: FiberNode | null,
        element: ReactElementType,
    ) {
        if (currentFiber !== null) {
            // 只有 key 和 type 都相同时进行复用，其他情况都直接删除重建
            if (element.key === currentFiber.key) {
                if (element.$$typeof === REACT_ELEMENT_TYPE) {
                    if (element.type === currentFiber.type) {
                        const existing = useFiber(currentFiber, element.props)
                        existing.return = returnFiber
                        return existing
                    }
                    deleteChild(returnFiber, currentFiber)
                }
                else {
                    if (__DEV__) {
                        console.warn('暂未实现该类型', element)
                    }
                }
            }
            else {
                deleteChild(returnFiber, currentFiber)
            }
        }

        const fiber = createFiberFromElement(element)
        fiber.return = returnFiber
        return fiber
    }

    function reconcileSingleTextNode(
        returnFiber: FiberNode,
        currentFiber: FiberNode | null,
        content: string | number,
    ) {
        if (currentFiber !== null) {
            if (currentFiber.tag === HostText) {
                const existing = useFiber(currentFiber, { content })
                existing.return = returnFiber
                return existing
            }
            else {
                deleteChild(returnFiber, currentFiber)
            }
        }
        const fiber = new FiberNode(HostText, { content }, null)
        fiber.return = returnFiber
        return fiber
    }

    return function (
        returnFiber: FiberNode,
        currentFiber: FiberNode | null,
        newChild?: ReactElementType,
    ) {
        if (typeof newChild === 'object' && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                    return placeSingleChild(reconcileSingleElement(returnFiber, currentFiber, newChild))
                default:
                    if (__DEV__) {
                        console.warn('未实现的reconcile类型', newChild)
                    }
            }
        }

        // TODO 多节点

        if (typeof newChild === 'string' || typeof newChild === 'number') {
            return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFiber, newChild))
        }

        // 兜底删除操作
        if (currentFiber !== null) {
            deleteChild(returnFiber, currentFiber)
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

export const reconcileChildFibers = ChildReconciler(true)
export const mountChildFibers = ChildReconciler(false)
