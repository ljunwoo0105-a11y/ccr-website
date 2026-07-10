import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist");
const openNextDir = join(process.cwd(), ".open-next");
const serverDir = join(distDir, "server");
const openNext = process.platform === "win32"
  ? "opennextjs-cloudflare.cmd"
  : "opennextjs-cloudflare";

await rm(distDir, { recursive: true, force: true });
await rm(openNextDir, { recursive: true, force: true });

const result = spawnSync(openNext, ["build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

await rm(distDir, { recursive: true, force: true });
await cp(openNextDir, distDir, { recursive: true });
await rm(join(distDir, "server-functions", "default", ".env"), {
  force: true,
});
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
await mkdir(serverDir, { recursive: true });
await writeFile(
  join(serverDir, "index.js"),
  'export { default } from "../worker.js";\n',
);
