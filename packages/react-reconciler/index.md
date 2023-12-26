# React-reconcile

> 工作方式: 比较节点的 ReactElement 和 FiberNode ，生成子 FiberNode 和 Flags

### FiberNode
1. 实例属性: tag、key、stateNode、type、ref
2. 节点关系: return、sibling、child、index
3. 工作单元: pendingProps、memoizedProps、alternate、flags、subtreeFlags、updateQueue、memoizedState、deletions

### FiberRootNode
> createRoot 创建的当前应用统一根节点
1. container: 配置 hostConfig 实现各宿主的不同容器
2. current: hostRootFiber
3. finishedWork: 更新完成之后的 hostRootFiber
4. pendingLanes: 所有没被消费的 Lane 的集合
5. finishedLane: 本次更新消费的 Lane


### UpdateQueue
- enqueueUpdate
  - 需要实现成链表结构
- processUpdateQueue


### createRoot & render
> ReactDOM.createRoot(rootElement).render(<App />)
> createRoot 时调用 createContainer，render 或者其他更新时调用 updateContainer
- createContainer: 创建 root 和 hostRootFiber
- updateContainer: enqueueUpdate & scheduleUpdateOnFiber
  - 在这里将渲染和更新相连接

# scheduleUpdateOnFiber
> workInProgress: 当前节点的替换树

- markUpdateFromFiberToRoot: 找到根节点
- markRootUpdate: 添加 Lane 到根节点的集合
- renderRoot
  - prepareFreshStack: 创建/更新 wip
  - workLoop: render 阶段
    - performUnitOfWork: 存在 wip 时一直进行递归操作
      - beginWork
      - completeUnitOfWork -> completeWork
  - 更新 root 上的数据
  - commitRoot: 根据 finishedWork 的 subtreeFlags 和 flags 确定三个阶段的执行
    - Mutation 阶段: commitMutationEffects
    - 此时进行节点树切换



## beginWork
> 1. 通过对比子节点的 current 与 ReactElement，生成相应的 wip
> 2. 只标记结构相关副作用: Placement ChildDeletion
- HostRoot: updateHostRoot
   - *计算更新后的状态*
   - 对比 wip 和更新后生成的 memoizedState 生成子 FiberNode
- HostComponent: updateHostComponent
   - 对比 wip 和 pendingProps.children 生成子 FiberNode
- FunctionComponent: updateFunctionComponent
  - 对比 wip 和跑完 type 方法后生成的 children 生成子 FiberNode
- Fragment: updateFragment
   - 对比 wip 和 pendingProps 生成子 FiberNode
- HostText: 没有子节点，不进行 beginWork


#### ChildReconciler: beginWork 中的对比方法
> 性能优化: 首屏渲染时，只有 hostRootFiber 会进行 Placement，其他的都不参与副作用，通过闭包与 placeSingleChild 实现
- 复用逻辑: useFiber 能复用就复用，不能复用再创建
- 在这里进行 Placement 和 ChildDeletion 副作用的添加
  - placeSingleChild
  - deleteChild / deleteRemainingChildren

1. REACT_ELEMENT_TYPE: reconcileSingleElement
2. HOST_TEXT: reconcileSingleTextNode
3. 多节点: reconcileChildrenArray
   1. 将 current 保存到 map 中
   2. 遍历 newChild，寻找复用节点，不能复用再进行重新创建: updateFromMap
      1. HostText
      2. ReactElement
      3. 数组类型
      4. Fragment
   3. 标记移动或者插入
   4. 将 map 中剩下的标记删除




## completeWork
> 根据 HostComponent 和 HostText 的 FiberNode 构建离屏 DOM 树

- HostComponent
  - 没有节点: 创建DOM并插入到DOM树中
    - appendAllChildren: 需要筛选出所有的 HostText 和 HostComponent 插入
  - 已有节点: 更新 Props 属性，标记 Update
- HostText
  - 没有节点: 创建DOM，只需要绑定到 stateNode，不需要进行插入操作
  - 已有节点: 更新 content 属性，标记 Update
- bubbleProperties: 需要将所有的副作用向上冒泡



## commitWork
1. 共有三个阶段，每个阶段各有一个副作用Mask，判断 finishedWork 的 subtreeFlags 和 flags
   1. beforeMutation
   2. Mutation: commitMutationEffects
   3. Layout
2. 获取 finishedWork 并切换

### commitMutationEffects
1. 向下DFS找到 subtreeFlags 为 NoFlags 的 FiberNode
2. commitMutationEffectsOnFiber
3. 向右向上DFS
   1. 寻找 sibling 再次向下DFS
   2. 处理 return 节点

#### commitMutationEffectsOnFiber
> 拿到对应的副作用，进行增删改
1. commitPlacement
   1. getHostParent 找到父节点的原生节点
      1. HostComponent: 返回 stateNode
      2. HostRoot: 返回 stateNode.container
   2. getHostSibling 找到第一个Host类型兄弟节点，如果找到了，那代表是一个插入操作
   3. appendPlacementNodeIntoContainer
      1. 如果当前 fiber 是 Host 节点，直接 appendChildToContainer(宿主环境方法)
      2. 如果不是，DFS遍历 fiber 的 child 和所有 sibling
2. commitUpdate
   1. 在 hostConfig 中进行更新，判断为元素或文本等
3. commitDeletion
   1. 取出 fiber 中的 deletions 并 commit 每一项
   2. commitNestedComponent
      1. 递归遍历每一项，每次都需要执行参数中的 onCommitUnmount
      2. 在回调中统一执行一些卸载和解绑操作，并更新获得该子节点的 host 节点
   3. 移除该 host 节点的DOM




## Hooks 架构
> hook 怎么感知上下文，以及感知 mount 还是 update
> React 导出的 hooks，但是实现在 reconciler 中
>   React 中创建一个内部数据共享层，在 shared 中流通
1. 在不同的时期，mount update 时，会创建不同的 hooks 集合，react 中使用的是这个集合，而不是直接调用 hooks

### Dispatcher
- currentDispatcher: hooks 的集合
- resolveDispatcher: 获取 currentDispatcher.current
- hooks: 直接在React包中导出
  - Dispatcher: 所有的 hooks 的类型定义

### memoizedState
- FC 中的指向 hooks 链表
- 每个 Hooks 中存储 hook 数据
- HostRoot 中存储的是 <App /> 的ReactElement

### 实现 Hooks结构
1. currentlyRenderingFiber: 当前正在活动的 fiber
2. workInProgressHook: 当前正在处理的 hook
3. currentHook: current 中对应的 hook
4. HooksDispatcherOnMount: mount 时的 hooks 集合
   1. mountState
      1. mountWorkInProgressHook: 创建当前的 hook
      2. dispatchSetState: 将 hooks 接入现有的更新流程中，并且保存到 updateQueue 中以便更新时获取
5. HooksDispatcherOnUpdate: update 时的 hooks 集合
   1. updateState
      1. updateWorkInProgressHook: 从 current 中获取到 hook 以及相应数据




## 如何实现批处理
> 1. 需要实现一套优先级机制，每个更新拥有自己的优先级
> 2. 能够合并一次宏任务/微任务中的所有更新
> 3. 需要一套算法来决定哪个优先级进入 render 阶段

### Lane
> Lane: 优先级
    > NoLane
    > SyncLane
> Lanes: Lane的集合
    > NoLanes

1. 创建 Update 时就已经确定了 Lane 的优先级
2. 在 FiberRootNode 上新增
   1. 所有未被消费的 Lane 的集合
   2. 本次需要被消费的 Lane
3. 操作流程
   1. 在创建 Update 时在 FiberRootNode 的 Lane 集合中添加对应 Lane
   2. 在 schedule 阶段选出一个 Lane 进行后续的 render 和 commit
   3. 在 commit 阶段结束后，从 FiberRootNode 中移除这个 Lane

**方法**
1. mergeLanes: 创建Lane的集合
2. requestUpdateLane: 生成一个对应的 Lane
3. getHighestPriorityLane: 获取当前优先级最高的 Lane
   1. 约定: 值越小优先级越高
