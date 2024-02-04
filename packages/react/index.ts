import type { Dispatcher } from './src/currentDispatcher'
import currentDispatcher, { resolveDispatcher } from './src/currentDispatcher'
import currentBatchConfig from './src/currentBatchConfig'
import {
    createElement as createElementFn,
    isValidElement as isValidElementFn,
} from './src/jsx'

export const useState: Dispatcher['useState'] = (initialState) => {
    const dispatcher = resolveDispatcher()
    return dispatcher.useState(initialState)
}

export const useEffect: Dispatcher['useEffect'] = (create, deps) => {
    const dispatcher = resolveDispatcher()
    return dispatcher.useEffect(create, deps)
}

export const useTransition: Dispatcher['useTransition'] = () => {
    const dispatcher = resolveDispatcher()
    return dispatcher.useTransition()
}

export const useRef: Dispatcher['useRef'] = (initialValue) => {
    const dispatcher = resolveDispatcher()
    return dispatcher.useRef(initialValue)
}

export const useContext: Dispatcher['useContext'] = (context) => {
    const dispatcher = resolveDispatcher()
    return dispatcher.useContext(context)
}

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
    currentDispatcher,
    currentBatchConfig,
}

export { REACT_FRAGMENT_TYPE as Fragment } from 'shared/ReactSymbols'
export { createContext } from './src/context'
export const version = '0.0.0'
export const isValidElement = isValidElementFn
// TODO 根据不同环境导出不同的包
export const createElement = createElementFn
