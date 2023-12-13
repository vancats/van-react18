# ReactDOM

## 合成事件
> 合成事件和宿主环境强相关，应该与 react-reconcile 完全解耦

1. 在创建和更新时，需要存放与更新 props(更新操作暂时借有completeWork中直接更新)
2. 初始化事件
   1. 在根节点 container 上直接添加事件，屏蔽默认操作
   2. 首先拿到了当前的操作节点，向上收集沿途的所有事件直到 container
   3. 创建一个自己的合成事件 syntheticEvent，要自行实现 stopProgation 方法
   4. 遍历 capture 和 bubble，注意如果 stop 了就不进行后续操作了
