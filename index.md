# React18

## 依赖
1. workspace + pnpm init
2. tsconfig
3. eslintrc
4. 限制提交规范
   1. husky
      1. npx husky install
      2. npx husky add .husky/pre-commit "pnpm run lint:fix && git add ."
   2. commitlint @commitlint/cli + @commitlint/config-conventional
      1. npx husky add .husky/commit-msg 'npx --no-install commitlint -e $HUSKY_GIT_PARAMS'
5. 开发环境标识__DEV__: @rollup/plugin-replace
6. 别名: @rollup/plugin-alias
7. --force 代表不会走预编译，不走缓存


## 调试
1. pnpm link --global + pnpm link [package] --global 指定为全局依赖包，必须在对应目录下进行
2. 利用 vite 进行调试，需要处理引入路径的区别，不需要每次都重新打包
