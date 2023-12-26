import type { Dispatch } from 'react/src/currentDispatcher'
import type { Action } from 'shared/ReactType'

export interface Update<State> {
    action: Action<State>
    next: Update<any> | null
}

export interface UpdateQueue<State> {
    shared: {
        pending: Update<State> | null
    }
    dispatch: Dispatch<State> | null
}

export function createUpdate<State>(action: Action<State>): Update<State> {
    return {
        action,
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
        // 会形成一个 c -> a -> b -> c 的环状链表，pending 指向新插入的 update，pending.next 指向第一个 update
        update.next = pending.next
        pending.next = update
    }
    updateQueue.shared.pending = update
}

export function processUpdateQueue<State>(
    baseState: State,
    pendingUpdate: Update<State> | null,
): { memoizedState: State } {
    const result: ReturnType<typeof processUpdateQueue<State>> = {
        memoizedState: baseState,
    }

    if (pendingUpdate !== null) {
        const action = pendingUpdate.action
        if (action instanceof Function) {
            result.memoizedState = action(baseState)
        }
        else {
            result.memoizedState = action
        }
    }

    return result
}
