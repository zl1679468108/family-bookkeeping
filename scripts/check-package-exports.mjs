import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const packageRoot = path.resolve(process.cwd(), process.argv[2] ?? '.');
const srcDir = path.join(packageRoot, 'src');
const packageJsonPath = path.join(packageRoot, 'package.json');
const indexPath = path.join(srcDir, 'index.ts');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const indexSource = fs.readFileSync(indexPath, 'utf8');
const sourceModules = fs
  .readdirSync(srcDir)
  .filter((file) => file.endsWith('.ts'))
  .map((file) => path.basename(file, '.ts'))
  .filter((name) => name !== 'index')
  .sort();

const expectedExports = {
  '.': './src/index.ts',
  ...Object.fromEntries(sourceModules.map((name) => [`./${name}`, `./src/${name}.ts`])),
};

const actualExports = packageJson.exports ?? {};
const expectedEntries = Object.entries(expectedExports);
const actualEntries = Object.entries(actualExports);
const expectedKeys = expectedEntries.map(([key]) => key);
const actualKeys = actualEntries.map(([key]) => key);

const missing = expectedKeys.filter((key) => !Object.hasOwn(actualExports, key));
const stale = actualKeys.filter((key) => !Object.hasOwn(expectedExports, key));
const wrongTargets = expectedEntries
  .filter(([key, target]) => Object.hasOwn(actualExports, key) && actualExports[key] !== target)
  .map(([key, target]) => ({ key, expected: target, actual: actualExports[key] }));
const wrongOrder = expectedKeys.some((key, index) => actualKeys[index] !== key);
const barrelExports = new Set(
  [...indexSource.matchAll(/export\s+\*\s+from\s+['"]\.\/(.+?)['"]/g)].map((match) =>
    match[1].replace(/\.ts$/, ''),
  ),
);
const missingBarrelExports = sourceModules.filter((name) => !barrelExports.has(name));
const staleBarrelExports = [...barrelExports].filter((name) => !sourceModules.includes(name)).sort();

if (
  missing.length === 0 &&
  stale.length === 0 &&
  wrongTargets.length === 0 &&
  !wrongOrder &&
  missingBarrelExports.length === 0 &&
  staleBarrelExports.length === 0
) {
  console.log(`${packageJson.name} exports ok (${sourceModules.length} subpaths + barrel exports)`);
  process.exit(0);
}

console.error(`${packageJson.name} exports check failed`);

if (missing.length > 0) {
  console.error(`Missing exports:\n${missing.map((key) => `  ${key}`).join('\n')}`);
}

if (stale.length > 0) {
  console.error(`Stale exports:\n${stale.map((key) => `  ${key}`).join('\n')}`);
}

if (wrongTargets.length > 0) {
  console.error(
    `Wrong export targets:\n${wrongTargets
      .map(({ key, expected, actual }) => `  ${key}: expected ${expected}, got ${actual}`)
      .join('\n')}`,
  );
}

if (wrongOrder) {
  console.error(`Export order should be:\n${expectedKeys.map((key) => `  ${key}`).join('\n')}`);
}

if (missingBarrelExports.length > 0) {
  console.error(
    `Missing barrel exports:\n${missingBarrelExports.map((name) => `  ./${name}`).join('\n')}`,
  );
}

if (staleBarrelExports.length > 0) {
  console.error(
    `Stale barrel exports:\n${staleBarrelExports.map((name) => `  ./${name}`).join('\n')}`,
  );
}

process.exit(1);
