import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const srcRoot = path.join(projectRoot, "src");
const packageJsonPath = path.join(projectRoot, "package.json");

const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const declaredDeps = new Set([
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.devDependencies || {}),
]);

const importRegex =
  /(?:import|export)\s+(?:[^"'`]*?\s+from\s+)?["'`]([^"'`]+)["'`]|import\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g;

const sourceFiles = [];

function collectFiles(dirPath) {
  for (const entry of readdirSync(dirPath)) {
    const fullPath = path.join(dirPath, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      collectFiles(fullPath);
      continue;
    }

    if (/\.(js|jsx|ts|tsx|mjs|cjs)$/.test(entry)) {
      sourceFiles.push(fullPath);
    }
  }
}

function getPackageName(specifier) {
  if (
    !specifier ||
    specifier.startsWith(".") ||
    specifier.startsWith("/") ||
    specifier.startsWith("@/") ||
    specifier.startsWith("virtual:") ||
    specifier.startsWith("data:") ||
    specifier.startsWith("http://") ||
    specifier.startsWith("https://")
  ) {
    return null;
  }

  if (specifier.startsWith("@")) {
    const [scope, name] = specifier.split("/");
    return scope && name ? `${scope}/${name}` : specifier;
  }

  return specifier.split("/")[0];
}

collectFiles(srcRoot);

const missing = new Map();

for (const filePath of sourceFiles) {
  const contents = readFileSync(filePath, "utf8");

  for (const match of contents.matchAll(importRegex)) {
    const specifier = match[1] || match[2];
    const packageName = getPackageName(specifier);

    if (!packageName || declaredDeps.has(packageName)) {
      continue;
    }

    const relativePath = path.relative(projectRoot, filePath);
    if (!missing.has(packageName)) {
      missing.set(packageName, new Set());
    }
    missing.get(packageName).add(relativePath);
  }
}

if (missing.size > 0) {
  console.error("Missing package declarations detected:\n");

  for (const [packageName, files] of missing.entries()) {
    console.error(`- ${packageName}`);
    for (const file of files) {
      console.error(`  used in ${file}`);
    }
  }

  process.exit(1);
}

console.log(`Dependency check passed for ${sourceFiles.length} source files.`);
