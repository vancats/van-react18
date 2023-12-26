import generatePackageJson from 'rollup-plugin-generate-package-json'
import alias from '@rollup/plugin-alias'
import { getBaseRollupPlugins, getPkgJSON, resolvePkgPath } from './utils'

const { name, module, peerDependencies } = getPkgJSON('react-dom')
// 包路径
const pkgPath = resolvePkgPath(name)
// 产物路径
const pkgDistPath = resolvePkgPath(name, true)

export default [
    // react-dom
    {
        input: `${pkgPath}/${module}`,
        output: [
            {
                // React17
                file: `${pkgDistPath}/index.js`,
                name: 'ReactDOM',
                format: 'umd',
            },
            {
                // React18
                file: `${pkgDistPath}/client.js`,
                name: 'client',
                format: 'umd',
            },
        ],
        // 不打包React中的代码，比如内部数据共享层数据如果打包进来，就会出现两份
        external: [...Object.keys(peerDependencies)],
        plugins: [
            ...getBaseRollupPlugins(),
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
    // react-test-utils
    {
        input: `${pkgPath}/test-utils.ts`,
        output: [
            {
                file: `${pkgDistPath}/test-utils.js`,
                name: 'testUtils',
                format: 'umd',
            },
        ],
        // 对于 test 文件来说，React和ReactDOM都应该是外部依赖，不应该内部引入
        external: ['react', 'react-dom'],
        plugins: [getBaseRollupPlugins()],
    },
]
