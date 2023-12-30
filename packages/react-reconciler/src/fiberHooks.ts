import internals from 'shared/internals'
import type { Dispatch, Dispatcher } from 'react/src/currentDispatcher'
import type { Action } from 'shared/ReactTypes'
import type { FiberNode } from './fiber'
import type { UpdateQueue } from './updateQueue'
import { createUpdate, createUpdateQueue, enqueueUpdate, processUpdateQueue } from './updateQueue'
import { scheduleUpdateOnFiber } from './workLoop'
import type { Lane } from './fiberLanes'
import { NoLane, requestUpdateLane } from './fiberLanes'
import { PassiveEffect } from './fiberFlags'
import type { HookFlags } from './hookEffectTags'
import { HasEffect, Passive } from './hookEffectTags'

interface Hook {
    memoizedState: any
    updateQueue: unknown
    next: Hook | null
}

type EffectCallback = () => void
type EffectDeps = any[] | void | null
export interface Effect {
    tag: HookFlags
    create: EffectCallback | void
    destroy: EffectCallback | void
    deps: EffectDeps
    next: Effect | null
}

export interface FCUpdateQueue<State> extends UpdateQueue<State> {
    lastEffect: Effect | null
}

let currentlyRenderingFiber: FiberNode | null = null
let workInProgressHook: Hook | null = null
let currentHook: Hook | null = null
let renderLane: Lane = NoLane

const { currentDispatcher } = internals

export function renderWithHooks(wip: FiberNode, lane: Lane) {
    // 设置当前环境
    currentlyRenderingFiber = wip
    // 重置 hook 链表
    wip.memoizedState = null
    // 重置 effect 链表
    wip.updateQueue = null
    renderLane = lane

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
    renderLane = NoLane
    return children
}

const HooksDispatcherOnMount: Dispatcher = {
    useState: mountState,
    useEffect: mountEffect,
}

const HooksDispatcherOnUpdate: Dispatcher = {
    useState: updateState,
    useEffect: updateEffect,
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
    updateQueue.shared.pending = null

    if (pending !== null) {
        const { memoizedState } = processUpdateQueue(
            hook.memoizedState,
            pending,
            renderLane,
        )
        hook.memoizedState = memoizedState
    }

    return [hook.memoizedState, updateQueue.dispatch!]
}

function mountEffect(create: EffectCallback, deps: EffectDeps) {
    const hook = mountWorkInProgressHook()
    const nextDeps = deps === undefined ? null : deps

    // 标识当前的 fiber 后续需要执行 useEffect
    currentlyRenderingFiber!.flags |= PassiveEffect
    hook.memoizedState = pushEffect(Passive | HasEffect, create, undefined, nextDeps)
}

function updateEffect(create: EffectCallback, deps: EffectDeps) {
    const hook = updateWorkInProgressHook()
    const nextDeps = deps === undefined ? null : deps

    if (currentHook !== null) {
        // 获取当前的 hook 中的 effect
        const prevEffect = currentHook.memoizedState as Effect
        const destroy = prevEffect.destroy
        if (areHookInputsEqual(prevEffect.deps, nextDeps)) {
            hook.memoizedState = pushEffect(
                Passive,
                create, destroy, nextDeps,
            )
        }
        else {
            currentlyRenderingFiber!.flags |= PassiveEffect
            hook.memoizedState = pushEffect(
                Passive | HasEffect,
                create, destroy, nextDeps,
            )
        }
    }
}

function pushEffect(tag: HookFlags, create: EffectCallback | void, destroy: EffectCallback | void, deps: EffectDeps) {
    const effect: Effect = { tag, create, destroy, deps, next: null }

    const fiber = currentlyRenderingFiber!
    let updateQueue = fiber.updateQueue as FCUpdateQueue<any>
    if (updateQueue === null) {
        updateQueue = createFCUpdateQueue()
        fiber.updateQueue = updateQueue
        effect.next = effect
    }
    else {
        const lastEffect = updateQueue.lastEffect
        if (lastEffect === null) {
            effect.next = effect
        }
        else {
            const firstEffect = lastEffect.next
            lastEffect.next = effect
            effect.next = firstEffect
        }
    }
    updateQueue.lastEffect = effect
    return effect
}

function areHookInputsEqual(prevDeps: EffectDeps, nextDeps: EffectDeps) {
    if (!prevDeps || !nextDeps || prevDeps.length !== nextDeps.length) {
        return false
    }
    for (let i = 0; i < prevDeps.length; i++) {
        if (Object.is(prevDeps[i], nextDeps[i])) {
            continue
        }
        return false
    }
    return true
}

function createFCUpdateQueue<State>() {
    const updateQueue = createUpdateQueue<State>() as FCUpdateQueue<State>
    updateQueue.lastEffect = null
    return updateQueue
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
