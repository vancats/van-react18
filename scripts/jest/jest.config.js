const { defaults } = require('jest-config')

module.exports = {
    ...defaults,
    rootDir: process.cwd(),
    // 忽略寻找的位置
    modulePathIgnorePatterns: ['<rootDir>/xxx'],
    // 寻找依赖，React和ReactDOM会优先从dist
    moduleDirectories: [
        'dist/node_modules',
        ...defaults.moduleDirectories,
    ],
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        // 测试专用的 mock 包
        '^scheduler$': '<rootDir>/node_modules/scheduler/unstable_mock.js',
    },
    fakeTimers: {
        enableGlobally: true,
        legacyFakeTimers: true,
    },
    setupFilesAfterEnv: ['./scripts/jest/setupJest.js'],
}
