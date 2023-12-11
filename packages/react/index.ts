import type { Dispatcher } from './src/currentDispatcher'
import currentDispatcher, { resolveDispatcher } from './src/currentDispatcher'
import { isValidElement as isValidElementFn, jsx, jsxDEV } from './src/jsx'

export const useState: Dispatcher['useState'] = (initialState) => {
    const dispatcher = resolveDispatcher()
    return dispatcher.useState(initialState)
}

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
    currentDispatcher,
}

export const version = '0.0.0'
export const isValidElement = isValidElementFn
// TODO 根据不同环境导出不同的包
export const createElement = jsx
