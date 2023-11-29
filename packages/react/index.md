# React（宿主环境无关）

## 实现 JSX

`编译时：由 babel 自动转换，无需手动实现`
### 运行时: jsx 方法或者 React.createElement 方法
1. 实现该方法
2. 实现打包流程
3. 实现调试打包结果的环境

### 状态驱动原理
1. 描述UI的方法（JSX / 模板语法）
2. 可能存在编译优化:
    1. React 是纯运行时框架，没有编译优化
3. 运行时核心模块（reconcile / renderer）
4. 宿主环境API
5. 显示真实UI

### 核心模块如何消费JSX
1. ReactElement 无法表达节点的关系且不易于扩展
2. FiberNode：
   1. 介于 ReactElement 与真实节点之间
   2. 能表达节点间关系
   3. 易于扩展，不仅做储存单元，也能做工作单元（表达这个节点的作用）
