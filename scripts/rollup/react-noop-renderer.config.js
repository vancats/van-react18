import generatePackageJson from 'rollup-plugin-generate-package-json'
import alias from '@rollup/plugin-alias'
import { getBaseRollupPlugins, getPkgJSON, resolvePkgPath } from './utils'

const { name, module, peerDependencies } = getPkgJSON('react-noop-renderer')
console.log('name: ', name)
// 包路径
const pkgPath = resolvePkgPath(name)
// 产物路径
const pkgDistPath = resolvePkgPath(name, true)

export default [
    // react-noop-renderer
    {
        input: `${pkgPath}/${module}`,
        output: [
            {
                file: `${pkgDistPath}/index.js`,
                name: 'ReactNoopRenderer',
                format: 'umd',
            },
        ],
        // 不打包React中的代码，比如内部数据共享层数据如果打包进来，就会出现两份
        external: [...Object.keys(peerDependencies), 'scheduler'],
        plugins: [
            ...getBaseRollupPlugins({
                typescript: {
                    tsconfigOverride: {
                        // 和 tsconfig 中的 includes 字段冲突，需要把 react-dom 排除
                        exclude: ['./packages/react-dom/**/*'],
                        compilerOptions: {
                            paths: {
                                hostConfig: [`./${name}/src/hostConfig.ts`],
                            },
                        },
                    },
                },
            }),
            alias({
                entries: {
                    // tsConfig 中添加的路径只是为了类型检查，这里需要重新指定 hostConfig 位置
                    hostConfig: `${pkgPath}/src/hostConfig.ts`,
                },
            }),
            generatePackageJson({
                inputFolder: pkgPath,
                outputFolder: pkgDistPath,
                baseContents: ({ name, description, version, license }) => ({
                    name,
                    description,
                    version,
                    peerDependencies: {
                        react: version,
                    },
                    license,
                    main: 'index.js',
                }),
            })],
    },
]
