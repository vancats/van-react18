# React-reconcile

###
1. fiberRootNode: createRoot 创建出的整个应用的根节点
2. hostRootFiber: rootElement 对应的 fiber 节点

fiberRootNode.current = hostRootFiber
hostRootFiber.stateNode = fiberRootNode
