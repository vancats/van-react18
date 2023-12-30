import type { Action } from 'shared/ReactType'

export interface Dispatcher {
    useState: <T>(
        initialState: (() => T) | T
    ) => [T, Dispatch<T>]
    useEffect: (
        create: (() => void) | void,
        deps: any[] | void | null
    ) => void
}

export type Dispatch<State> = (action: Action<State>) => void

const currentDispatcher: { current: Dispatcher | null } = {
    current: null,
}

export function resolveDispatcher() {
    const dispatcher = currentDispatcher.current
    if (dispatcher === null) {
        throw new Error('Invalid hook call. Hooks can only be called inside of the body of a function component')
    }
    return dispatcher
}

export default currentDispatcher
