import type { Dispatch } from 'react/src/currentDispatcher'
import type { Action } from 'shared/ReactTypes'
import { type Lane, NoLane, isSubsetOfLanes } from './fiberLanes'

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
): {
    memoizedState: State
    baseState: State
    baseQueue: Update<State> | null
} {
    const result: ReturnType<typeof processUpdateQueue<State>> = {
        memoizedState: baseState,
        baseState,
        baseQueue: null,
    }

    if (pendingUpdate !== null) {
        const first = pendingUpdate.next
        let pending = pendingUpdate.next!

        let newState = baseState
        let newBaseState = baseState
        let newBaseQueueFirst: Update<State> | null = null
        let newBaseQueueLast: Update<State> | null = null

        do {
            const updateLane = pending.lane
            if (!isSubsetOfLanes(renderLane, updateLane)) {
                // 优先级不够被跳过
                const clone = createUpdate(pending.action, pending.lane)
                if (newBaseQueueLast === null) {
                    newBaseQueueFirst = clone
                    newBaseQueueLast = clone
                    newBaseState = newState
                }
                else {
                    newBaseQueueLast.next = clone
                    newBaseQueueLast = clone
                }
            }
            else {
                if (newBaseQueueLast !== null) {
                    // update 的优先级被降低到 NoLane
                    const clone = createUpdate(pending.action, NoLane)
                    newBaseQueueLast.next = clone
                    newBaseQueueLast = clone
                }

                const action = pendingUpdate.action
                if (action instanceof Function) {
                    newState = action(baseState)
                }
                else {
                    newState = action
                }
            }
            pending = pending.next!
        } while (pending !== first)

        if (newBaseQueueLast === null) {
            // 本次计算没有 update 被跳过
            newBaseState = newState
        }
        else {
            newBaseQueueLast.next = newBaseQueueFirst
        }

        result.memoizedState = newState
        result.baseState = newBaseState
        result.baseQueue = newBaseQueueLast
    }

    return result
}
