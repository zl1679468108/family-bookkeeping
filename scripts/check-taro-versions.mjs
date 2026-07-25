import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const taroDir = path.join(rootDir, 'taro');
const packageJsonPath = path.join(taroDir, 'package.json');
const packageLockPath = path.join(taroDir, 'package-lock.json');
const exactVersionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?$/;

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
const rootLockPackage = packageLock.packages?.[''] ?? {};
const rootLockDependencies = {
  ...(rootLockPackage.dependencies ?? {}),
  ...(rootLockPackage.devDependencies ?? {}),
};
const declaredDependencies = {
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.devDependencies ?? {}),
};
const taroDependencies = Object.entries(declaredDependencies)
  .filter(([name]) => name.startsWith('@tarojs/'))
  .sort(([left], [right]) => left.localeCompare(right));
const failures = [];

if (taroDependencies.length === 0) {
  failures.push('No declared @tarojs/* dependencies were found in taro/package.json.');
}

for (const [name, version] of taroDependencies) {
  if (!exactVersionPattern.test(version)) {
    failures.push(`${name} must use an exact version, got ${version}.`);
  }
}

const declaredVersions = [...new Set(taroDependencies.map(([, version]) => version))];
const expectedTaroVersion = declaredVersions[0];

if (declaredVersions.length > 1) {
  failures.push(
    `Declared @tarojs/* dependencies must stay on one version line, got ${declaredVersions.join(
      ', ',
    )}.`,
  );
}

for (const [name, version] of taroDependencies) {
  const lockedRootVersion = rootLockDependencies[name];
  const packageEntry = packageLock.packages?.[`node_modules/${name}`];

  if (lockedRootVersion !== version) {
    failures.push(
      `taro/package-lock.json root entry for ${name} must be ${version}, got ${
        lockedRootVersion ?? 'missing'
      }.`,
    );
  }

  if (!packageEntry) {
    failures.push(`taro/package-lock.json is missing node_modules/${name}.`);
    continue;
  }

  if (packageEntry.version !== version) {
    failures.push(
      `Lockfile package node_modules/${name} must resolve to ${version}, got ${packageEntry.version}.`,
    );
  }
}

if (expectedTaroVersion && exactVersionPattern.test(expectedTaroVersion)) {
  const [expectedMajor] = expectedTaroVersion.split('.');

  for (const [packagePath, packageEntry] of Object.entries(packageLock.packages ?? {})) {
    if (!packagePath.startsWith('node_modules/@tarojs/') || !packageEntry.version) {
      continue;
    }

    const [actualMajor] = packageEntry.version.split('.');

    if (actualMajor === expectedMajor && packageEntry.version !== expectedTaroVersion) {
      failures.push(
        `Taro lockfile package ${packagePath} is on ${packageEntry.version}; expected ${expectedTaroVersion}.`,
      );
    }
  }
}

if (failures.length === 0) {
  console.log(
    `taro version check ok (${taroDependencies.length} declared @tarojs/* packages at ${expectedTaroVersion})`,
  );
  process.exit(0);
}

console.error(`taro version check failed (${failures.length} issues)`);

for (const failure of failures) {
  console.error(`- ${failure}`);
}

process.exit(1);
