let isFlushingSyncQueue = false
let syncQueue: ((...args: any) => void)[] | null = null

export function scheduleSyncCallback(callback: (...args: any) => void) {
    if (syncQueue === null) {
        syncQueue = [callback]
    }
    else {
        syncQueue.push(callback)
    }
}

export function flushSyncCallbacks() {
    if (!isFlushingSyncQueue && syncQueue) {
        isFlushingSyncQueue = true
        try {
            syncQueue.forEach(callback => callback())
        }
        catch (e) {
            console.warn('flushSyncCallbacks报错', e)
        }
        finally {
            isFlushingSyncQueue = false
            syncQueue = null
        }
    }
}
