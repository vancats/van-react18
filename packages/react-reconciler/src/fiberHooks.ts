import internals from 'shared/internals'
import type { Dispatch, Dispatcher } from 'react/src/currentDispatcher'
import type { Action } from 'shared/ReactType'
import type { FiberNode } from './fiber'
import type { UpdateQueue } from './updateQueue'
import { createUpdate, createUpdateQueue, enqueueUpdate } from './updateQueue'
import { scheduleUpdateOnFiber } from './workLoop'

interface Hook {
    memoizedState: any
    updateQueue: unknown
    next: Hook | null
}

let currentlyRenderingFiber: FiberNode | null = null
let workInProgressHook: Hook | null = null

const { currentDispatcher } = internals

export function renderWithHooks(wip: FiberNode) {
    // 设置当前环境
    currentlyRenderingFiber = wip
    // 重置链表头
    wip.memoizedState = null

    const current = wip.alternate
    if (current === null) {
        // mount
        currentDispatcher.current = HooksDispatcherOnMount
    }
    else {
        // update
    }

    const Component = wip.type
    const props = wip.pendingProps
    const children = Component(props)

    // 重置当前环境
    currentlyRenderingFiber = null
    return children
}

const HooksDispatcherOnMount: Dispatcher = {
    useState: mountState,
}

function mountState<State>(initialState: State | (() => State)): [State, Dispatch<State>] {
    const hook = mountWorkInProgressHook()
    let memoizedState: State | null = null
    if (initialState instanceof Function) {
        memoizedState = initialState()
    }
    else {
        memoizedState = initialState
    }
    hook.memoizedState = memoizedState

    const updateQueue = createUpdateQueue() as UpdateQueue<State>
    hook.updateQueue = updateQueue

    // @ts-ignore
    const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, updateQueue)
    updateQueue.dispatch = dispatch
    return [memoizedState, dispatch]
}

function dispatchSetState<State>(
    fiber: FiberNode,
    updateQueue: UpdateQueue<State>,
    action: Action<State>,
) {
    const update = createUpdate(action)
    enqueueUpdate(updateQueue, update)
    scheduleUpdateOnFiber(fiber)
}

function mountWorkInProgressHook(): Hook {
    const hook: Hook = {
        memoizedState: null,
        updateQueue: null,
        next: null,
    }
    if (workInProgressHook === null) {
        if (currentlyRenderingFiber === null) {
            throw new Error('Invalid hook call. Hooks can only be called inside of the body of a function component')
        }
        workInProgressHook = hook
        // 链表头赋值
        currentlyRenderingFiber.memoizedState = workInProgressHook
    }
    else {
        workInProgressHook = workInProgressHook.next = hook
    }
    return hook
}
