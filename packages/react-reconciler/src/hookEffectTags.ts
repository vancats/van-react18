export type HookFlags = number

export const NoFlags = 0b0000

export const HasEffect = 0b0001 // 当前的 Effect 有副作用需要执行 create
export const Insertion = 0b0010 // 标记这是一个 useInsertionEffect
export const Layout = 0b0100 // 标记这是一个 useLayoutEffect
export const Passive = 0b1000 // 标记这是一个 useEffect
