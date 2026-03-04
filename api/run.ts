import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runAdanCode } from "../server/runner";

const MAX_SOURCE_BYTES = 32 * 1024; // 32 KB source cap

const CORS_ORIGIN = process.env.CORS_ORIGIN || "https://playground.adan.sh";

const setCors = (res: VercelResponse) => {
    res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Always set CORS headers first — even if we throw below
    setCors(res);

    try {
        if (req.method === "OPTIONS") {
            return res.status(204).end();
        }

        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method not allowed." });
        }

        const body = req.body as { code?: unknown } | undefined;
        const code = body?.code;

        if (typeof code !== "string") {
            return res.status(400).json({ error: "Missing or invalid `code` field (expected string)." });
        }

        if (Buffer.byteLength(code, "utf8") > MAX_SOURCE_BYTES) {
            return res.status(400).json({ error: "Source code exceeds 32 KB limit." });
        }

        const result = await runAdanCode(code);
        return res.status(200).json(result);
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[api/run] Unhandled error:", e);
        return res.status(503).json({ error: `Execution failed: ${msg}` });
    }
}
