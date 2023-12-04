# React-reconcile

> 工作方式: 比较节点的ReactElement和fiberNode，生成子fiberNode和Flags

### FiberNode
1. 实例属性：tag、key、stateNode、type、ref
2. 节点关系：return、sibling、child、index
3. 工作单元：pendingProps、memoizedProps、alternate、flags、subtreeFlags、updateQueue、memoizedState

### FiberRootNode
> createRoot 创建的当前应用统一根节点
1. container: 配置 hostConfig 实现各宿主的不同容器
2. current: hostRootFiber
3. finishedWork: 更新完成之后的 hostRootFiber

### Update
- enqueueUpdate
- processUpdateQueue

### createRoot & render
> ReactDOM.createRoot(rootElement).render(<App />)
> createRoot 时调用 createContainer，render 或者其他更新时调用 updateContainer
- createContainer: 创建 root 和 hostRootFiber
- updateContainer: enqueueUpdate & scheduleUpdateOnFiber
  - 在这里将渲染和更新相连接

# scheduleUpdateOnFiber
- workInProgress
- performUnitOfWork
- completeUnitOfWork



## beginWork
> 1. 通过对比子节点的 current 与 ReactElement，生成相应的 wip
> 2. 只标记结构相关副作用：Placement ChildDeletion
1. HostRoot:
   1. 计算更新后的状态
   2. 创建子 fiberNode
2. HostComponent
   1. 创建子 fiberNode
3. HostText: 没有子节点，不进行 beginWork

#### ChildReconciler
1. 性能优化：首屏渲染时，只有 hostRootFiber 会进行 Placement，其他的都不参与副作用，通过闭包与 placeSingleChild 实现
2. $$typeof
   1. REACT_ELEMENT_TYPE: reconcileSingleElement
   2. HOST_TEXT: reconcileSingleTextNode
   3. TODO 多节点




## completeWork
> 对于 Host 类型 fiberNode 构建离屏 DOM 树
> 标记 Update Flag




## commitWork
1. 共有三个阶段，每个阶段各有一个副作用Mask，判断 finishedWork 的 subtreeFlags 和 flags
   1. beforeMutation
   2. Mutation: commitMutationEffects
   3. Layout
2. 获取 finishedWork 并切换

### commitMutationEffects
1. 向下DFS找到 subtreeFlags 为 NoFlags 的 fiberNode
2. commitMutationEffectsOnFiber
3. 向右向上DFS
   1. 寻找 sibling 再次向下DFS
   2. 处理 return 节点

#### commitMutationEffectsOnFiber
> 拿到对应的副作用，进行增删改
1. commitPlacement
   1. getHostParent 找到父节点的原生节点
      1. HostComponent：stateNode
      2. HostRoot：stateNode.container
   2. appendPlacementNodeIntoContainer
      1. 如果当前 fiber 是 Host 节点，直接 appendChildToContainer(宿主环境方法)
      2. 如果不是，DFS遍历 fiber 的 child 和所有 sibling
