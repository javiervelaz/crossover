import { kv } from "@vercel/kv";
import crypto from "crypto";

export const runtime = "nodejs";

function makeId() {
  return crypto.randomBytes(8).toString("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const characterId = body.characterId;
    const universeId = body.universeId;
    const tone = body.tone ?? "dark";
    const length = body.length ?? "short";
    const language = body.language ?? "es";

    if (!characterId || !universeId) {
      return Response.json(
        { error: "characterId and universeId are required" },
        { status: 400 }
      );
    }

    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    const N8N_SHARED_SECRET = process.env.N8N_SHARED_SECRET;

    if (!N8N_WEBHOOK_URL || !N8N_SHARED_SECRET) {
      return Response.json(
        {
          error: "Missing N8N_WEBHOOK_URL or N8N_SHARED_SECRET",
          hasUrl: !!N8N_WEBHOOK_URL,
          hasSecret: !!N8N_SHARED_SECRET,
        },
        { status: 500 }
      );
    }

    const payload = {
      characterId,
      universeId,
      tone,
      length,
      language,
      requestId: makeId(),
    };

    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-shared-secret": N8N_SHARED_SECRET,
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text(); // 👈 SIEMPRE leemos texto primero

    if (!res.ok) {
      return Response.json(
        { error: "n8n_error", status: res.status, details: text },
        { status: 502 }
      );
    }

    // intentar parsear JSON
    let generatedRaw: any;
    try {
      generatedRaw = text ? JSON.parse(text) : null;
    } catch {
      return Response.json(
        { error: "n8n_returned_non_json", details: text },
        { status: 502 }
      );
    }

    const generated = Array.isArray(generatedRaw) ? generatedRaw[0] : generatedRaw;

    if (generated?.error) return Response.json(generated, { status: 400 });

    if (!generated?.title || !generated?.story) {
      return Response.json(
        { error: "bad_response_from_n8n", generatedRaw },
        { status: 502 }
      );
    }

    const id = makeId();

    const record = {
      id,
      createdAt: new Date().toISOString(),
      input: payload,
      output: generated,
    };

    // ⚠️ acá suele romper en localhost si KV no está configurado
    //await kv.set(`story:${id}`, record, { ex: 60 * 60 * 24 * 14 });
    let kvOk = true;
    try {
      await kv.set(`story:${id}`, record, { ex: 60 * 60 * 24 * 14 });
    } catch (e: any) {
      kvOk = false;
      console.error("KV set failed:", e?.message ?? e);
    }
    // Index: últimos 20
    await kv.lpush("stories:latest", id);
    await kv.ltrim("stories:latest", 0, 19);

  
    console.log(id)
    return Response.json({
      id,
      ...generated,
      shareUrl: `/s/${id}`,
    });
  } catch (err: any) {
    // 👇 esto te va a mostrar la verdad en la UI
    return Response.json(
      {
        error: "api_exception",
        message: err?.message ?? String(err),
        stack: err?.stack ?? null,
      },
      { status: 500 }
    );
  }
}
