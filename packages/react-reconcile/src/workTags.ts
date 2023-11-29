export type WorkTag =
    | typeof FunctionComponent
    | typeof HostRoot
    | typeof HostComponent
    | typeof HostText

export const FunctionComponent = 1
export const HostRoot = 3
export const HostComponent = 5
export const HostText = 6
