import { downloadAdanBinary } from "./adan";
import { existsSync, writeFileSync, chmodSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { spawn } from "child_process";

const BINARY_CACHE_PATH = join(tmpdir(), "adan-nightly");
const SOURCE_FILE_PREFIX = join(tmpdir(), "adan-src-");
const RUN_TIMEOUT_MS = 10_000;
const MAX_OUTPUT_BYTES = 64 * 1024; // 64 KB output cap

let binaryReady: Promise<string> | null = null;

export function warmBinary(): Promise<string> {
    if (!binaryReady) {
        binaryReady = (async () => {
            if (!existsSync(BINARY_CACHE_PATH)) {
                console.log("[runner] Downloading ADAN binary...");
                const bytes = await downloadAdanBinary();
                writeFileSync(BINARY_CACHE_PATH, bytes);
                chmodSync(BINARY_CACHE_PATH, 0o755);
                console.log("[runner] Binary cached at", BINARY_CACHE_PATH);
            } else {
                console.log("[runner] Using cached binary at", BINARY_CACHE_PATH);
            }
            return BINARY_CACHE_PATH;
        })().catch((err) => {
            binaryReady = null;
            throw err;
        });
    }
    return binaryReady;
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
): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> {
    return new Promise((resolve) => {
        const proc = spawn(cmd, args);
        const stdoutChunks: Buffer[] = [];
        const stderrChunks: Buffer[] = [];
        let timedOut = false;

        const timeoutHandle = setTimeout(() => {
            timedOut = true;
            try { proc.kill("SIGKILL"); } catch {}
        }, timeoutMs);

        proc.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
        proc.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

        const decode = (chunks: Buffer[]) => {
            const buf = Buffer.concat(chunks);
            const text = buf.subarray(0, MAX_OUTPUT_BYTES).toString("utf8");
            return buf.byteLength > MAX_OUTPUT_BYTES ? text + "\n[output truncated]" : text;
        };

        proc.on("close", (exitCode) => {
            clearTimeout(timeoutHandle);
            resolve({
                stdout: decode(stdoutChunks),
                stderr: timedOut
                    ? `Process timed out after ${timeoutMs / 1000}s.`
                    : decode(stderrChunks),
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
    const compilerPath = await warmBinary();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const sourceFile = `${SOURCE_FILE_PREFIX}${id}.adn`;
    const outputBinary = join(tmpdir(), `adan-out-${id}`);

    writeFileSync(sourceFile, source, "utf8");

    try {
        const compile = await spawnCollect(
            compilerPath,
            ["--file", sourceFile, "--link", "--bundle-libs", "libs/io", "-o", outputBinary],
            RUN_TIMEOUT_MS,
        );

        if (compile.exitCode !== 0 || compile.timedOut) {
            return {
                stdout: compile.stdout,
                stderr: compile.stderr || "Compilation failed.",
                exitCode: compile.exitCode,
                timedOut: compile.timedOut,
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
        try { unlinkSync(sourceFile); } catch {}
        try { unlinkSync(outputBinary); } catch {}
    }
}