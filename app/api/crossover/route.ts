import { kv } from "@vercel/kv";
import crypto from "crypto";

export const runtime = "nodejs";

function makeId() {
  return crypto.randomBytes(8).toString("hex");
}

export async function POST(req: Request) {
  const { characterId, universeId, tone = "dark", length = "short" } =
    await req.json();

  if (!characterId || !universeId) {
    return Response.json(
      { error: "characterId and universeId are required" },
      { status: 400 }
    );
  }

  const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL!;
  const N8N_SHARED_SECRET = process.env.N8N_SHARED_SECRET!;
  if (!N8N_WEBHOOK_URL || !N8N_SHARED_SECRET) {
    return Response.json(
      { error: "Missing N8N_WEBHOOK_URL or N8N_SHARED_SECRET" },
      { status: 500 }
    );
  }

  const payload = {
    characterId,
    universeId,
    tone,
    length,
    requestId: makeId(),
  };

  // Simple auth header (rápido y suficiente para MVP)
  const res = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-shared-secret": N8N_SHARED_SECRET,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    return Response.json(
      { error: "n8n_error", details: text },
      { status: 502 }
    );
  }

  const generated = await res.json();
  // expected from n8n: { title, story, meta }
  const id = makeId();

  const record = {
    id,
    createdAt: new Date().toISOString(),
    input: payload,
    output: generated,
  };

  await kv.set(`story:${id}`, record, { ex: 60 * 60 * 24 * 14 }); // 14 días

  return Response.json({
    id,
    ...generated,
    shareUrl: `/s/${id}`,
  });
}
