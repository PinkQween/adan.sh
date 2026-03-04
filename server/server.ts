import { warmBinary, warmClang, runAdanCode } from "./runner";

const PORT = Number(process.env.PORT) || 3000;
const MAX_SOURCE_BYTES = 32 * 1024; // 32 KB source cap

const CORS_HEADERS: Record<string, string> = {
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "https://playground.adan.sh",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });

const err = (message: string, status = 400) => json({ error: message }, status);

Bun.serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);

        if (req.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: CORS_HEADERS });
        }

        if (req.method === "POST" && url.pathname === "/run") {
            let body: { code?: unknown };

            try {
                body = await req.json() as { code?: unknown };
            } catch {
                return err("Invalid JSON body.");
            }

            if (typeof body.code !== "string") {
                return err("Missing or invalid `code` field (expected string).");
            }

            const source = body.code;

            if (new TextEncoder().encode(source).byteLength > MAX_SOURCE_BYTES) {
                return err("Source code exceeds 32 KB limit.");
            }

            try {
                const result = await runAdanCode(source);
                return json(result);
            } catch (e) {
                console.error("[server] Run error:", e);
                return err("Failed to execute code. The compiler may be temporarily unavailable.", 503);
            }
        }

        if (req.method === "GET" && url.pathname === "/health") {
            return json({ ok: true });
        }

        return err("Not found.", 404);
    },
    error(e) {
        console.error("[server] Unhandled error:", e);
        return new Response("Internal server error", { status: 500 });
    },
});

console.log(`[server] Listening on http://localhost:${PORT}`);

warmBinary().catch((e) => console.warn("[server] Binary pre-warm failed:", e));
warmClang().catch((e) => console.warn("[server] Clang pre-warm failed:", e));
