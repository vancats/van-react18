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
