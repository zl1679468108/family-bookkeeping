import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const failures = [];

function readText(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function expectIncludes(file, source, expected) {
  if (!source.includes(expected)) {
    failures.push(`${file} should include: ${expected}`);
  }
}

function expectNotIncludes(file, source, stale) {
  if (source.includes(stale)) {
    failures.push(`${file} still includes stale text: ${stale}`);
  }
}

function expectEqual(description, actual, expected) {
  if (actual !== expected) {
    failures.push(`${description}: expected ${expected}, got ${actual ?? 'missing'}`);
  }
}

const readme = readText('README.md');
const agents = readText('AGENTS.md');
const prd = readText('docs/PRD.md');
const ciWorkflow = readText('.github/workflows/ci.yml');
const appModule = readText('backend/src/app.module.ts');
const backendPackage = readJson('backend/package.json');
const frontendPackage = readJson('frontend/package.json');
const taroPackage = readJson('taro/package.json');
const sharedPackageNames = ['@family-bookkeeping/shared-types', '@family-bookkeeping/shared-utils'];

expectNotIncludes('README.md', readme, 'CRA');
expectNotIncludes('AGENTS.md', agents, '无共享包');
expectNotIncludes('AGENTS.md', agents, '模块（13 个）');
expectIncludes('README.md', readme, 'React 18 + Vite');
expectIncludes('README.md', readme, 'shared-types/');
expectIncludes('README.md', readme, 'shared-utils/');
expectIncludes('AGENTS.md', agents, 'shared-types');
expectIncludes('AGENTS.md', agents, 'shared-utils');
expectIncludes('AGENTS.md', agents, 'file:../...');
expectIncludes('docs/PRD.md', prd, 'shared-types/');
expectIncludes('docs/PRD.md', prd, 'shared-utils/');
expectIncludes('docs/PRD.md', prd, 'file:../...');
expectIncludes('AGENTS.md', agents, 'Ocr');
expectIncludes('AGENTS.md', agents, 'Wechat');
expectIncludes('docs/PRD.md', prd, '/api/ocr');
expectIncludes('docs/PRD.md', prd, 'Mail（邮件验证码/重置密码）');
expectIncludes('docs/PRD.md', prd, 'Wechat（小程序内容安全检测）');
expectIncludes('backend/src/app.module.ts', appModule, 'OcrModule');
expectIncludes('backend/src/app.module.ts', appModule, 'WechatModule');
expectNotIncludes('docs/PRD.md', prd, '无 CI/CD');
expectNotIncludes('docs/PRD.md', prd, 'Docker 容器部署');
expectIncludes('AGENTS.md', agents, 'source-quality');
expectIncludes('AGENTS.md', agents, 'backend / frontend / taro / shared-types / shared-utils');
expectIncludes('docs/PRD.md', prd, '五项目类型检查与生产构建');
expectIncludes('.github/workflows/ci.yml', ciWorkflow, 'source-quality:');
expectIncludes('.github/workflows/ci.yml', ciWorkflow, 'project: [backend, frontend, taro, shared-types, shared-utils]');
expectIncludes('.github/workflows/ci.yml', ciWorkflow, 'npm run build:h5');
expectIncludes('.github/workflows/ci.yml', ciWorkflow, 'Run backend unit tests');
expectIncludes('.github/workflows/ci.yml', ciWorkflow, 'Run Taro unit tests');
expectEqual('backend test script', backendPackage.scripts?.test, 'jest --runInBand');
expectEqual(
  'backend integration test script',
  backendPackage.scripts?.['test:integration'],
  'jest --config jest.integration.config.js --runInBand',
);
expectEqual('backend app integration exclusion', backendPackage.jest?.testPathIgnorePatterns?.[0], '/app\\.spec\\.ts$');

for (const packageName of sharedPackageNames) {
  const localPath = packageName.endsWith('shared-types') ? 'file:../shared-types' : 'file:../shared-utils';

  expectEqual(
    `frontend dependency ${packageName}`,
    frontendPackage.dependencies?.[packageName],
    localPath,
  );
  expectEqual(`taro dependency ${packageName}`, taroPackage.dependencies?.[packageName], localPath);
}

expectEqual('taro script dev:weapp', taroPackage.scripts?.['dev:weapp'], 'taro build --type weapp --watch');
expectEqual('taro script dev:h5', taroPackage.scripts?.['dev:h5'], 'taro build --type h5 --watch');

if (failures.length === 0) {
  console.log('project consistency check ok');
  process.exit(0);
}

console.error(`project consistency check failed (${failures.length} issues)`);

for (const failure of failures) {
  console.error(`- ${failure}`);
}

process.exit(1);
