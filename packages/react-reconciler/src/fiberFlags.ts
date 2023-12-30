import type { FiberNode } from './fiber'

export type Flags = number
export type Mask = number

export const NoFlags = 0b00000000000
export const Placement = 0b00000000001
export const Update = 0b00000000010
export const ChildDeletion = 0b00000000100
export const PassiveEffect = 0b00000001000

export const MutationMask = Placement | Update | ChildDeletion
export const PassiveMask = PassiveEffect | ChildDeletion

export function hasMask(fiber: FiberNode, mask: Mask) {
    return (fiber.subtreeFlags & mask) !== NoFlags || (fiber.flags & mask) !== NoFlags
}
