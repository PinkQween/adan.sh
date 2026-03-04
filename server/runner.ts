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

export async function runAdanCode(source: string): Promise<RunResult> {
    const binaryPath = await warmBinary();

    const sourceFile = `${SOURCE_FILE_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}.adn`;
    writeFileSync(sourceFile, source, "utf8");

    return new Promise((resolve) => {
        const proc = spawn(binaryPath, ["-f", sourceFile]);

        const stdoutChunks: Buffer[] = [];
        const stderrChunks: Buffer[] = [];
        let timedOut = false;

        const timeoutHandle = setTimeout(() => {
            timedOut = true;
            try { proc.kill("SIGKILL"); } catch {}
        }, RUN_TIMEOUT_MS);

        proc.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
        proc.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

        proc.on("close", (exitCode) => {
            clearTimeout(timeoutHandle);
            try { unlinkSync(sourceFile); } catch {}

            const decode = (chunks: Buffer[]) => {
                const buf = Buffer.concat(chunks);
                const text = buf.subarray(0, MAX_OUTPUT_BYTES).toString("utf8");
                return buf.byteLength > MAX_OUTPUT_BYTES
                    ? text + "\n[output truncated]"
                    : text;
            };

            resolve({
                stdout: decode(stdoutChunks),
                stderr: timedOut
                    ? `Execution timed out after ${RUN_TIMEOUT_MS / 1000}s.`
                    : decode(stderrChunks),
                exitCode: exitCode ?? (timedOut ? -1 : 0),
                timedOut,
            });
        });

        proc.on("error", (err) => {
            clearTimeout(timeoutHandle);
            try { unlinkSync(sourceFile); } catch {}
            resolve({
                stdout: "",
                stderr: `Failed to start compiler: ${err.message}`,
                exitCode: -1,
                timedOut: false,
            });
        });
    });
}