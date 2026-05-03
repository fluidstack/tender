#!/usr/bin/env node
// Wrapper around `playwright test` that injects libgbm onto LD_LIBRARY_PATH
// when needed (Nix-based dev shells do not expose it system-wide). The
// libgbm path is resolved at runtime via several portable strategies, so the
// script survives Nix channel updates and works on non-Nix machines too.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function resolveMesaLibgbmDir() {
  if (process.env.MESA_LIBGBM_DIR && existsSync(process.env.MESA_LIBGBM_DIR)) {
    return process.env.MESA_LIBGBM_DIR;
  }
  const probes = [
    ["nix-build", ["--no-out-link", "<nixpkgs>", "-A", "mesa.libgbm"]],
    ["nix", ["eval", "--raw", "nixpkgs#mesa.libgbm"]],
  ];
  for (const [cmd, args] of probes) {
    const r = spawnSync(cmd, args, { encoding: "utf8", timeout: 30_000 });
    if (r.status === 0) {
      const out = r.stdout.trim().split("\n").pop();
      if (out && existsSync(`${out}/lib`)) return `${out}/lib`;
    }
  }
  // Fallback: scan the local Nix store for any mesa-libgbm derivation that
  // ships libgbm.so. Avoids hard-coding a hash and survives channel updates.
  if (existsSync("/nix/store")) {
    try {
      const entries = readdirSync("/nix/store");
      for (const name of entries) {
        if (!/mesa-libgbm/.test(name)) continue;
        const libDir = join("/nix/store", name, "lib");
        if (
          existsSync(libDir) &&
          statSync(libDir).isDirectory() &&
          readdirSync(libDir).some((f) => f.startsWith("libgbm.so"))
        ) {
          return libDir;
        }
      }
    } catch {
      // ignore
    }
  }
  return null;
}

const env = { ...process.env };
const dir = resolveMesaLibgbmDir();
if (dir) {
  env.LD_LIBRARY_PATH = env.LD_LIBRARY_PATH ? `${dir}:${env.LD_LIBRARY_PATH}` : dir;
} else {
  console.warn(
    "[test:a11y] could not resolve mesa libgbm; relying on existing LD_LIBRARY_PATH",
  );
}

// pnpm run forwards `--` literally; strip it so playwright doesn't treat it
// as a test-file regex.
const args = process.argv.slice(2).filter((a) => a !== "--");
const r = spawnSync("pnpm", ["exec", "playwright", "test", ...args], {
  stdio: "inherit",
  env,
});
process.exit(r.status ?? 1);
