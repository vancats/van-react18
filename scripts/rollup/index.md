
# Rollup

## 1. 安装
1. rollup-plugin-typescript2
2. @rollup/plugin-commonjs
3. rollup-plugin-generate-package-json

## 配置
1. --bundleConfigAsCjs 将 config 文件作为 CommonJS 模块导出
2. --config 指定文件
3. pnpm link --global + pnpm link [package] --global 指定为全局依赖包，必须在对应目录下进行
