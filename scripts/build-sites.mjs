import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist");
const openNextDir = join(process.cwd(), ".open-next");
const serverDir = join(distDir, "server");
const hostingConfig = join(process.cwd(), ".openai", "hosting.json");
const distHostingDir = join(distDir, ".openai");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const openNext = process.platform === "win32"
  ? "opennextjs-cloudflare.cmd"
  : "opennextjs-cloudflare";

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

await rm(distDir, { recursive: true, force: true });
await rm(openNextDir, { recursive: true, force: true });

run(npm, ["run", "build:next"]);
run(openNext, ["build"], {
  ...process.env,
  SKIP_NEXT_APP_BUILD: "true",
});

await rm(distDir, { recursive: true, force: true });
await cp(openNextDir, distDir, { recursive: true });
await rm(join(distDir, "server-functions", "default", ".env"), {
  force: true,
});
const prismaClientDir = join(
  distDir,
  "server-functions",
  "default",
  "node_modules",
  ".prisma",
  "client",
);

try {
  const prismaClientFiles = await readdir(prismaClientDir);
  await Promise.all(
    prismaClientFiles
      .filter((name) => name.startsWith("query_engine") || name.startsWith("libquery_engine"))
      .map((name) => rm(join(prismaClientDir, name), { force: true }))
  );
} catch {
  // OpenNext output does not always include Prisma's native engine.
}

await rm(
  join(
    distDir,
    "server-functions",
    "default",
    "node_modules",
    ".prisma",
    "client",
    "query_engine-windows.dll.node",
  ),
  { force: true },
);
await mkdir(distHostingDir, { recursive: true });
await cp(hostingConfig, join(distHostingDir, "hosting.json"));
await mkdir(serverDir, { recursive: true });
await writeFile(
  join(serverDir, "index.js"),
  'export { default } from "../worker.js";\n',
);
