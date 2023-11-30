# React-reconcile

> 工作方式: 比较节点的ReactElement和fiberNode，生成子fiberNode和Flags

### FiberNode
1. 实例属性：tag、key、stateNode、type、ref
2. 节点关系：return、sibling、child、index
3. 工作单元：pendingProps、memoizedProps、alternate、flags、updateQueue、memoizedState

### FiberRootNode
> createRoot 创建的当前应用统一根节点
1. container: 配置 hostConfig 实现各宿主的不同容器
2. current: hostRootFiber
3. finishedWork: 更新完成之后的 hostRootFiber

## Update
- enqueueUpdate
- processUpdateQueue

### createRoot & render
> ReactDOM.createRoot(rootElement).render(<App />)
> createRoot 时调用 createContainer，render 或者其他更新时调用 updateContainer
- createContainer: 创建 root 和 hostRootFiber
- updateContainer: enqueueUpdate & scheduleUpdateOnFiber
  - 在这里将渲染和更新相连接

## scheduleUpdateOnFiber
- workInProgress
- performUnitOfWork
- completeUnitOfWork
