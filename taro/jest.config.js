/**
 * Taro 单元测试配置
 * - 仅对纯 TS 工具/逻辑做单测（不渲染 Taro 组件，避免 jsdom + Taro 运行时耦合）
 * - 测试文件位于 tests/ 目录，不进入 src/，不污染生产构建与 tsc 全量检查
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tarojs/taro$': '<rootDir>/tests/mocks/taro.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { tsconfig: 'tsconfig.json' },
    ],
  },
};
