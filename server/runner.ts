import { downloadAdanBinary } from "./adan";
import { existsSync, writeFileSync, chmodSync, unlinkSync, mkdirSync, renameSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { spawn } from "child_process";

const BINARY_CACHE_PATH = join(tmpdir(), "adan-nightly");
const SOURCE_FILE_PREFIX = join(tmpdir(), "adan-src-");
const RUN_TIMEOUT_MS = 10_000;
const WARM_TIMEOUT_MS = 60_000; // 60s for cold-start downloads
const MAX_OUTPUT_BYTES = 64 * 1024; // 64 KB output cap

const ZIG_VERSION = "0.13.0";
const ZIG_ARCH_NAME = `zig-linux-x86_64-${ZIG_VERSION}`;
const ZIG_URL = `https://ziglang.org/download/${ZIG_VERSION}/${ZIG_ARCH_NAME}.tar.xz`;
const ZIG_CACHE_PATH = join(tmpdir(), "adan-zig-bin");
const CLANG_WRAP_DIR = join(tmpdir(), "adan-clang-wrap");
const CLANG_WRAP_PATH = join(CLANG_WRAP_DIR, "clang");

let binaryReady: Promise<string> | null = null;
let clangReady: Promise<string> | null = null;

export function warmBinary(): Promise<string> {
    if (!binaryReady) {
        binaryReady = (async () => {
            if (!existsSync(BINARY_CACHE_PATH)) {
                console.log("[runner] Downloading ADAN binary...");
                const bytes = await downloadAdanBinary();
                writeFileSync(BINARY_CACHE_PATH, bytes);
                chmodSync(BINARY_CACHE_PATH, 0o755);
                console.log("[runner] ADAN binary cached at", BINARY_CACHE_PATH);
            } else {
                console.log("[runner] Using cached ADAN binary");
            }
            return BINARY_CACHE_PATH;
        })().catch((err) => { binaryReady = null; throw err; });
    }
    return binaryReady;
}

export function warmClang(): Promise<string> {
    if (!clangReady) {
        clangReady = (async () => {
            if (!existsSync(ZIG_CACHE_PATH)) {
                console.log("[runner] Downloading zig (bundled clang)...");

                const res = await fetch(ZIG_URL);
                if (!res.ok) throw new Error(`zig download failed: ${res.status} ${res.statusText}`);

                const tarPath = join(tmpdir(), "adan-zig.tar.xz");
                writeFileSync(tarPath, Buffer.from(await res.arrayBuffer()));
                console.log("[runner] zig archive written, extracting...");

                // Vercel Lambda's PATH is minimal — resolve tar by full path.
                const tarBin = ["/usr/bin/tar", "/bin/tar"].find(existsSync) ?? "tar";

                await new Promise<void>((resolve, reject) => {
                    const proc = spawn(tarBin, [
                        "xJf", tarPath,
                        "-C", tmpdir(),
                        "--strip-components=1",
                        `${ZIG_ARCH_NAME}/zig`,
                    ]);
                    const errChunks: Uint8Array[] = [];
                    proc.stderr?.on("data", (c: Uint8Array) => errChunks.push(c));
                    proc.on("close", (code) => {
                        if (code === 0) return resolve();
                        reject(new Error(`tar failed (${code}): ${Buffer.concat(errChunks).toString()}`));
                    });
                    proc.on("error", reject);
                });

                try { unlinkSync(tarPath); } catch { }

                const extracted = join(tmpdir(), "zig");
                renameSync(extracted, ZIG_CACHE_PATH);
                chmodSync(ZIG_CACHE_PATH, 0o755);
                console.log("[runner] zig cached at", ZIG_CACHE_PATH);
            } else {
                console.log("[runner] Using cached zig binary");
            }

            mkdirSync(CLANG_WRAP_DIR, { recursive: true });
            writeFileSync(
                CLANG_WRAP_PATH,
                `#!/bin/sh\nexec "${ZIG_CACHE_PATH}" cc "$@"\n`,
                { mode: 0o755 },
            );

            return CLANG_WRAP_DIR;
        })().catch((err) => { clangReady = null; throw err; });
    }
    return clangReady;
}

export interface RunResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    timedOut: boolean;
}

function spawnCollect(
    cmd: string,
    args: string[],
    timeoutMs: number,
    env?: NodeJS.ProcessEnv,
): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> {
    return new Promise((resolve) => {
        const proc = spawn(cmd, args, env ? { env } : undefined);
        const stdoutChunks: Uint8Array[] = [];
        const stderrChunks: Uint8Array[] = [];
        let timedOut = false;

        const timeoutHandle = setTimeout(() => {
            timedOut = true;
            try { proc.kill("SIGKILL"); } catch { }
        }, timeoutMs);

        proc.stdout.on("data", (chunk: Uint8Array) => stdoutChunks.push(chunk));
        proc.stderr.on("data", (chunk: Uint8Array) => stderrChunks.push(chunk));

        const decode = (chunks: Uint8Array[]) => {
            const buf = Buffer.concat(chunks);
            const text = buf.subarray(0, MAX_OUTPUT_BYTES).toString("utf8");
            return buf.byteLength > MAX_OUTPUT_BYTES ? text + "\n[output truncated]" : text;
        };

        proc.on("close", (exitCode) => {
            clearTimeout(timeoutHandle);
            resolve({
                stdout: decode(stdoutChunks),
                stderr: timedOut ? `Process timed out after ${timeoutMs / 1000}s.` : decode(stderrChunks),
                exitCode: exitCode ?? (timedOut ? -1 : 0),
                timedOut,
            });
        });

        proc.on("error", (err) => {
            clearTimeout(timeoutHandle);
            resolve({ stdout: "", stderr: err.message, exitCode: -1, timedOut: false });
        });
    });
}

export async function runAdanCode(source: string): Promise<RunResult> {
    const [compilerPath, clangWrapDir] = await Promise.all([warmBinary(), warmClang()]);

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const sourceFile = `${SOURCE_FILE_PREFIX}${id}.adn`;
    const outputBinary = join(tmpdir(), `adan-out-${id}`);

    writeFileSync(sourceFile, source, "utf8");

    const env: NodeJS.ProcessEnv = {
        ...process.env,
        PATH: `${clangWrapDir}:${process.env.PATH || "/usr/bin:/bin"}`,
    };

    try {
        const compile = await spawnCollect(
            compilerPath,
            ["--file", sourceFile, "--link", "--bundle-libs", "libs/io", "-o", outputBinary],
            WARM_TIMEOUT_MS,
            env,
        );

        if (compile.exitCode !== 0 || compile.timedOut) {
            return {
                stdout: compile.stdout,
                stderr: compile.stderr || "Compilation failed.",
                exitCode: compile.exitCode,
                timedOut: compile.timedOut,
            };
        }

        if (!existsSync(outputBinary)) {
            return {
                stdout: compile.stdout,
                stderr: (compile.stderr || "") + "\nLinking failed: output binary was not produced.",
                exitCode: 1,
                timedOut: false,
            };
        }

        chmodSync(outputBinary, 0o755);
        const run = await spawnCollect(outputBinary, [], RUN_TIMEOUT_MS);

        return {
            stdout: run.stdout,
            stderr: run.stderr,
            exitCode: run.exitCode,
            timedOut: run.timedOut,
        };
    } finally {
        try { unlinkSync(sourceFile); } catch { }
        try { unlinkSync(outputBinary); } catch { }
    }
}
