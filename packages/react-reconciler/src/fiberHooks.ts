import internals from 'shared/internals'
import type { Dispatch, Dispatcher } from 'react/src/currentDispatcher'
import type { Action } from 'shared/ReactType'
import type { FiberNode } from './fiber'
import type { UpdateQueue } from './updateQueue'
import { createUpdate, createUpdateQueue, enqueueUpdate, processUpdateQueue } from './updateQueue'
import { scheduleUpdateOnFiber } from './workLoop'
import { requestUpdateLane } from './fiberLanes'

interface Hook {
    memoizedState: any
    updateQueue: unknown
    next: Hook | null
}

let currentlyRenderingFiber: FiberNode | null = null
let workInProgressHook: Hook | null = null
let currentHook: Hook | null = null

const { currentDispatcher } = internals

export function renderWithHooks(wip: FiberNode) {
    // 设置当前环境
    currentlyRenderingFiber = wip
    // 重置链表头
    wip.memoizedState = null

    const current = wip.alternate
    if (current !== null) {
        // update
        currentDispatcher.current = HooksDispatcherOnUpdate
    }
    else {
        // mount
        currentDispatcher.current = HooksDispatcherOnMount
    }

    const Component = wip.type
    const props = wip.pendingProps
    const children = Component(props)

    // 重置当前环境
    currentlyRenderingFiber = null
    workInProgressHook = null
    currentHook = null
    return children
}

const HooksDispatcherOnMount: Dispatcher = {
    useState: mountState,
}

const HooksDispatcherOnUpdate: Dispatcher = {
    useState: updateState,
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

function updateState<State>(): [State, Dispatch<State>] {
    const hook = updateWorkInProgressHook()
    const updateQueue = hook.updateQueue as UpdateQueue<State>
    const pending = updateQueue.shared.pending
    if (pending !== null) {
        const { memoizedState } = processUpdateQueue(hook.memoizedState, pending)
        hook.memoizedState = memoizedState
    }

    return [hook.memoizedState, updateQueue.dispatch!]
}

function dispatchSetState<State>(
    fiber: FiberNode,
    updateQueue: UpdateQueue<State>,
    action: Action<State>,
) {
    const lane = requestUpdateLane()
    const update = createUpdate(action, lane)
    enqueueUpdate(updateQueue, update)
    scheduleUpdateOnFiber(fiber, lane)
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

function updateWorkInProgressHook(): Hook {
    // TODO render 阶段触发的更新
    let nextCurrentHook: Hook | null = null
    if (currentHook === null) {
        // 链表头
        const current = currentlyRenderingFiber?.alternate
        if (current !== null) {
            nextCurrentHook = current?.memoizedState
        }
        else {
            nextCurrentHook = null
        }
    }
    else {
        nextCurrentHook = currentHook.next
    }

    if (nextCurrentHook === null) {
        if (__DEV__) {
            throw new Error(`组件${currentlyRenderingFiber?.type}本次的hook比上次的多`)
        }
    }

    currentHook = nextCurrentHook

    const newHook: Hook = {
        memoizedState: currentHook?.memoizedState,
        updateQueue: currentHook?.updateQueue,
        next: null,
    }

    if (workInProgressHook === null) {
        if (currentlyRenderingFiber === null) {
            throw new Error('Invalid hook call. Hooks can only be called inside of the body of a function component')
        }
        workInProgressHook = newHook
        // 链表头赋值
        currentlyRenderingFiber.memoizedState = workInProgressHook
    }
    else {
        workInProgressHook = workInProgressHook.next = newHook
    }
    return newHook
}
