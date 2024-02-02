import { unstable_IdlePriority, unstable_ImmediatePriority, unstable_NormalPriority, unstable_UserBlockingPriority, unstable_getCurrentPriorityLevel } from 'scheduler'
import type { FiberRootNode } from './fiber'

export type Lanes = number
export type Lane = number

export const NoLanes = 0b00000000

export const NoLane = 0b00000000
export const SyncLane = 0b00000001
export const InputContinuousLane = 0b00000010
export const DefaultLane = 0b00000100
export const IdleLane = 0b00001000

export function mergeLanes(laneA: Lane, laneB: Lane) {
    return laneA | laneB
}

export function requestUpdateLane() {
    const currentSchedulerPriority = unstable_getCurrentPriorityLevel()
    return schedulerPriorityToLane(currentSchedulerPriority)
}

export function getHighestPriorityLane(lanes: Lanes) {
    return lanes & -lanes
}

export function isSubsetOfLanes(set: Lanes, subset: Lane) {
    return (set & subset) === subset
}

export function markRootFinished(root: FiberRootNode, lane: Lane) {
    root.pendingLanes &= ~lane
}

export function lanesToSchedulerPriority(lanes: Lanes) {
    const lane = getHighestPriorityLane(lanes)
    if (lane === SyncLane) {
        return unstable_ImmediatePriority
    }
    if (lane === InputContinuousLane) {
        return unstable_UserBlockingPriority
    }
    if (lane === DefaultLane) {
        return unstable_NormalPriority
    }
    return unstable_IdlePriority
}

export function schedulerPriorityToLane(schedulerPriority: number) {
    if (schedulerPriority === unstable_ImmediatePriority) {
        return SyncLane
    }
    if (schedulerPriority === unstable_UserBlockingPriority) {
        return InputContinuousLane
    }
    if (schedulerPriority === unstable_NormalPriority) {
        return DefaultLane
    }
    return NoLane
}
