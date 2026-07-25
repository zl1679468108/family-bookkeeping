import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const packageDirs = ['backend', 'frontend', 'taro', 'shared-types', 'shared-utils'];
const dependencyFields = ['dependencies', 'devDependencies'];
const failures = [];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), 'utf8'));
}

function sortedObject(value = {}) {
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)));
}

function expectEqual(description, actual, expected) {
  if (actual !== expected) {
    failures.push(`${description}: expected ${expected}, got ${actual ?? 'missing'}`);
  }
}

for (const dir of packageDirs) {
  const packageJsonPath = `${dir}/package.json`;
  const packageLockPath = `${dir}/package-lock.json`;

  if (!fs.existsSync(path.join(rootDir, packageJsonPath))) {
    failures.push(`${packageJsonPath} is missing.`);
    continue;
  }

  if (!fs.existsSync(path.join(rootDir, packageLockPath))) {
    failures.push(`${packageLockPath} is missing.`);
    continue;
  }

  const packageJson = readJson(packageJsonPath);
  const packageLock = readJson(packageLockPath);
  const rootPackage = packageLock.packages?.[''];

  expectEqual(`${packageLockPath} name`, packageLock.name, packageJson.name);
  expectEqual(`${packageLockPath} version`, packageLock.version, packageJson.version);
  expectEqual(`${packageLockPath} lockfileVersion`, packageLock.lockfileVersion, 3);

  if (!rootPackage) {
    failures.push(`${packageLockPath} is missing packages[""].`);
    continue;
  }

  expectEqual(`${packageLockPath} packages[""].name`, rootPackage.name, packageJson.name);
  expectEqual(`${packageLockPath} packages[""].version`, rootPackage.version, packageJson.version);

  for (const field of dependencyFields) {
    const expected = JSON.stringify(sortedObject(packageJson[field]));
    const actual = JSON.stringify(sortedObject(rootPackage[field]));

    if (actual !== expected) {
      failures.push(`${packageLockPath} packages[""].${field} is out of sync with package.json.`);
    }
  }
}

if (failures.length === 0) {
  console.log(`package lock check ok (${packageDirs.length} packages)`);
  process.exit(0);
}

console.error(`package lock check failed (${failures.length} issues)`);

for (const failure of failures) {
  console.error(`- ${failure}`);
}

process.exit(1);
