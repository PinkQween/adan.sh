import type { VercelRequest, VercelResponse } from "@vercel/node";
import { warmBinary, warmClang } from "../server/runner";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
    try {
        await Promise.all([warmBinary(), warmClang()]);
        return res.status(200).json({ ok: true });
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return res.status(500).json({ ok: false, error: msg });
    }
}
