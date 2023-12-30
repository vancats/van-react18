import type { FiberRootNode } from './fiber'

export type Lanes = number
export type Lane = number

export const NoLanes = 0b00000000

export const NoLane = 0b00000000
export const SyncLane = 0b00000001

export function mergeLanes(laneA: Lane, laneB: Lane) {
    return laneA | laneB
}

export function requestUpdateLane() {
    return SyncLane
}

export function getHighestPriorityLane(lanes: Lanes) {
    return lanes & -lanes
}

export function markRootFinished(root: FiberRootNode, lane: Lane) {
    root.pendingLanes &= ~lane
}