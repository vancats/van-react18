import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols'
import type { ElementType, Key, Props, ReactElementType, Ref } from 'shared/ReactType'

const ReactElement = function (type: ElementType, key: Key, ref: Ref, props: Props): ReactElementType {
    const element = {
        $$typeof: REACT_ELEMENT_TYPE,
        type,
        key,
        ref,
        props,
        __mark: 'vancats',
    }
    return element
}

export function isValidElement(object: any): object is ReactElementType {
    return (
        typeof object === 'object'
        && object !== null
        && object.$$typeof === REACT_ELEMENT_TYPE
    )
}

export const jsx = (
    type: ElementType,
    config: any,
    ...maybeChildren: any
) => {
    let key: Key = null
    let ref: Ref = null
    const props: Props = {}
    for (const prop in config) {
        const val = config[prop]
        if (val !== undefined) {
            if (prop === 'key') {
                key = String(val)
                continue
            }
            if (prop === 'ref') {
                ref = val
                continue
            }
        }
        if (Object.prototype.hasOwnProperty.call(config, prop)) {
            props[prop] = val
        }
    }
    if (maybeChildren.length === 1) {
        props.children = maybeChildren[0]
    }
    if (maybeChildren.length > 1) {
        props.children = maybeChildren
    }

    return ReactElement(type, key, ref, props)
}

export const jsxDEV = (
    type: ElementType,
    config: any,
) => {
    let key: Key = null
    let ref: Ref = null
    const props: Props = {}
    for (const prop in config) {
        const val = config[prop]
        if (val !== undefined) {
            if (prop === 'key') {
                key = String(val)
                continue
            }
            if (prop === 'ref') {
                ref = val
                continue
            }
        }
        if (Object.prototype.hasOwnProperty.call(config, prop)) {
            props[prop] = val
        }
    }
    return ReactElement(type, key, ref, props)
}

export const Fragment = REACT_FRAGMENT_TYPE
