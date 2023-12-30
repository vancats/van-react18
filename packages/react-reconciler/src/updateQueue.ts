import type { Dispatch } from 'react/src/currentDispatcher'
import type { Action } from 'shared/ReactTypes'
import type { Lane } from './fiberLanes'

export interface Update<State> {
    action: Action<State>
    lane: Lane
    next: Update<any> | null
}

export interface UpdateQueue<State> {
    shared: {
        pending: Update<State> | null
    }
    dispatch: Dispatch<State> | null
}

export function createUpdate<State>(action: Action<State>, lane: Lane): Update<State> {
    return {
        action,
        lane,
        next: null,
    }
}

export function createUpdateQueue<State>() {
    return {
        shared: {
            pending: null,
        },
        dispatch: null,
    } as UpdateQueue<State>
}

export function enqueueUpdate<State>(
    updateQueue: UpdateQueue<State>,
    update: Update<State>,
) {
    const pending = updateQueue.shared.pending
    if (pending === null) {
        // 这是第一个 Update
        update.next = update
    }
    else {
        update.next = pending.next
        pending.next = update
    }
    // 会形成一个 c -> a -> b -> c 的环状链表，pending 指向新插入的 update，pending.next 指向第一个 update
    updateQueue.shared.pending = update
}

export function processUpdateQueue<State>(
    baseState: State,
    pendingUpdate: Update<State> | null,
    renderLane: Lane,
): { memoizedState: State } {
    const result: ReturnType<typeof processUpdateQueue<State>> = {
        memoizedState: baseState,
    }

    if (pendingUpdate !== null) {
        const first = pendingUpdate.next
        let pending = pendingUpdate.next!
        do {
            const updateLane = pending.lane
            if (updateLane === renderLane) {
                const action = pendingUpdate.action
                if (action instanceof Function) {
                    baseState = action(baseState)
                }
                else {
                    baseState = action
                }
            }
            else {
                if (__DEV__) {
                    console.error('不应该进入updateLane !== renderLane这个逻辑')
                }
            }
            pending = pending.next!
        } while (pending !== first)
        result.memoizedState = baseState
    }

    return result
}
