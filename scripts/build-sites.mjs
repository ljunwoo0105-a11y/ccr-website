import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const rootDir = process.cwd();
const distDir = join(rootDir, "dist");
const serverDir = join(distDir, "server");
const rawServerDir = join(distDir, ".worker-source");
const bundleDir = join(distDir, ".worker-bundle");
const assetsDir = join(distDir, "assets");
const distHostingDir = join(distDir, ".openai");
const openNextDir = join(rootDir, ".open-next");
const hostingConfig = join(rootDir, ".openai", "hosting.json");
const prismaCompiler = join(
  rootDir,
  "node_modules",
  ".prisma",
  "client",
  "query_compiler_bg.wasm",
);
const openNextCli = join(
  rootDir,
  "node_modules",
  "@opennextjs",
  "cloudflare",
  "dist",
  "cli",
  "index.js",
);
const wranglerCli = join(
  rootDir,
  "node_modules",
  "wrangler",
  "bin",
  "wrangler.js",
);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runNpm(args) {
  const npmCli = process.env.npm_execpath;
  if (npmCli) {
    run(process.execPath, [npmCli, ...args]);
    return;
  }

  run(process.platform === "win32" ? "npm.cmd" : "npm", args);
}

if (!existsSync(hostingConfig)) {
  throw new Error(".openai/hosting.json is required for a Sites build.");
}
if (!existsSync(prismaCompiler)) {
  throw new Error("Prisma's generated query compiler is required.");
}

await rm(distDir, { recursive: true, force: true });
runNpm(["run", "build:node"]);
run(process.execPath, [openNextCli, "build", "--skipNextBuild"]);

await mkdir(rawServerDir, { recursive: true });
await mkdir(assetsDir, { recursive: true });
await mkdir(distHostingDir, { recursive: true });

for (const entry of await readdir(openNextDir, { withFileTypes: true })) {
  if (entry.name === "assets" || entry.name === "worker.js") continue;
  await cp(join(openNextDir, entry.name), join(rawServerDir, entry.name), {
    recursive: entry.isDirectory(),
  });
}

await cp(
  join(openNextDir, "worker.js"),
  join(rawServerDir, "open-next-worker.js"),
);
await writeFile(
  join(rawServerDir, "index.js"),
  `import openNextWorker from "./open-next-worker.js";
export * from "./open-next-worker.js";

const runtimeEnvSymbol = Symbol.for("ccr.worker.env");

export default {
  fetch(request, env, ctx) {
    globalThis[runtimeEnvSymbol] = env;
    return openNextWorker.fetch(request, env, ctx);
  },
};
`,
);
const packagedPrismaClient = join(
  rawServerDir,
  "server-functions",
  "default",
  "node_modules",
  ".prisma",
  "client",
);
await mkdir(packagedPrismaClient, { recursive: true });
await cp(prismaCompiler, join(packagedPrismaClient, "query_compiler_bg.wasm"));
await cp(join(openNextDir, "assets"), assetsDir, { recursive: true });

// Sites executes uploaded modules directly. Pre-bundle OpenNext's Node-style
// external packages so production never depends on an ambient CommonJS
// `require`, while preserving Prisma's compiler as a compiled WASM module.
run(process.execPath, [
  wranglerCli,
  "deploy",
  join(rawServerDir, "index.js"),
  "--assets",
  assetsDir,
  "--dry-run",
  "--outdir",
  bundleDir,
]);

await mkdir(serverDir, { recursive: true });
await cp(join(bundleDir, "index.js"), join(serverDir, "index.js"));
for (const entry of await readdir(bundleDir, { withFileTypes: true })) {
  if (
    entry.name === "index.js" ||
    entry.name === "README.md" ||
    entry.name.endsWith(".map")
  ) {
    continue;
  }
  await cp(join(bundleDir, entry.name), join(serverDir, entry.name), {
    recursive: entry.isDirectory(),
  });
}

await rm(rawServerDir, { recursive: true, force: true });
await rm(bundleDir, { recursive: true, force: true });
await cp(hostingConfig, join(distHostingDir, "hosting.json"));
