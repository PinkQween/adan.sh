import { downloadAdanBinary } from "./adan";
import { existsSync, writeFileSync, chmodSync, unlinkSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { spawn } from "child_process";

const BINARY_CACHE_PATH = join(tmpdir(), "adan-nightly");
const SOURCE_FILE_PREFIX = join(tmpdir(), "adan-src-");
const RUN_TIMEOUT_MS = 10_000;
const MAX_OUTPUT_BYTES = 64 * 1024; // 64 KB output cap

const BUNDLED_ZIG = join(process.cwd(), "bin", "zig-dist", "zig");
const BUNDLED_ZIG_LIB = join(process.cwd(), "bin", "zig-dist", "lib");
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
            if (!existsSync(BUNDLED_ZIG)) {
                throw new Error(
                    `zig binary not found at ${BUNDLED_ZIG}. ` +
                    "Run 'bash scripts/prepare-zig.sh' locally, or ensure it was built by Vercel."
                );
            }
            console.log("[runner] Using bundled zig at", BUNDLED_ZIG);

            mkdirSync(CLANG_WRAP_DIR, { recursive: true });
            writeFileSync(
                CLANG_WRAP_PATH,
                `#!/bin/sh\nexec env ZIG_LIB_DIR="${BUNDLED_ZIG_LIB}" ZIG_GLOBAL_CACHE_DIR="/tmp/zig-global-cache" ZIG_LOCAL_CACHE_DIR="/tmp/zig-local-cache" "${BUNDLED_ZIG}" cc -march=x86_64 "$@"\n`,
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
            RUN_TIMEOUT_MS,
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
