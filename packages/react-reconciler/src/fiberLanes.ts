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
