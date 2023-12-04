import generatePackageJson from 'rollup-plugin-generate-package-json'
import alias from '@rollup/plugin-alias'
import { getBaseRollupPlugins, getPkgJSON, resolvePkgPath } from './utils'

const { name, module } = getPkgJSON('react-dom')
// 包路径
const pkgPath = resolvePkgPath(name)
// 产物路径
const pkgDistPath = resolvePkgPath(name, true)

export default [
    {
        input: `${pkgPath}/${module}`,
        output: [
            {
                // React17
                file: `${pkgDistPath}/index.js`,
                name: 'index.js',
                format: 'umd',
            },
            {
                // React18
                file: `${pkgDistPath}/client.js`,
                name: 'client.js',
                format: 'umd',
            },
        ],
        plugins: [
            ...getBaseRollupPlugins(),
            alias({
                entries: {
                    // tsConfig 中添加的路径只是为了类型检查吗，这里需要重新指定 hostConfig 位置
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
