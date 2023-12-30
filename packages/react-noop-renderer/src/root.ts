import { createContainer, updateContainer } from 'react-reconciler/src/fiberReconciler'
import type { ReactElementType } from 'shared/ReactTypes'
import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols'
import type { Container, Instance } from './hostConfig'

let idCounter = 0

export function createRoot() {
    const container: Container = {
        rootId: idCounter++,
        children: [],
    }

    // @ts-ignore 因为 ts 指向的是 react-dom 的 hostConfig，不影响使用
    const root = createContainer(container)

    function getChildren(parent: Container | Instance) {
        return parent?.children || null
    }

    function getChildrenAsJSX(root: Container) {
        const children = childToJSX(getChildren(root))
        // 如果是一个 Fragment
        if (Array.isArray(children)) {
            return {
                $$typeof: REACT_ELEMENT_TYPE,
                type: REACT_FRAGMENT_TYPE,
                key: null,
                ref: null,
                props: { children },
                __mark: 'vancats',
            }
        }
        return children
    }

    function childToJSX(child: any) {
        // 文本节点
        if (typeof child === 'string' || typeof child === 'number') {
            return child
        }

        // 数组
        if (Array.isArray(child)) {
            if (child.length === 0) {
                return null
            }
            if (child.length === 1) {
                return childToJSX(child[0])
            }
            const children = child.map(childToJSX)
            // 全是文本进行拼接
            if (children.every(c => typeof c === 'string' || typeof c === 'number')) {
                return children.join('')
            }
            return children
        }

        // Instance
        if (Array.isArray(child.children)) {
            const instance: Instance = child
            const children = childToJSX(instance.children)
            const props = instance.props

            if (children !== null) {
                props.children = children
            }
            return {
                $$typeof: REACT_ELEMENT_TYPE,
                type: instance.type,
                key: null,
                ref: null,
                props,
                __mark: 'vancats',
            }
        }

        // TextInstance
        return child
    }

    return {
        render(element: ReactElementType) {
            return updateContainer(element, root)
        },
        getChildren() {
            return getChildren(container)
        },
        getChildrenAsJSX() {
            return getChildrenAsJSX(container)
        },
    }
}
