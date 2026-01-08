import { kv } from "@vercel/kv";

export const runtime = "nodejs";

export async function GET() {
  const ids = (await kv.lrange("stories:latest", 0, 19)) as string[];

  const records = await Promise.all(
    ids.map(async (id) => {
      const rec = await kv.get<any>(`story:${id}`);
      return rec ? { id, ...rec } : null;
    })
  );

  return Response.json({
    ids,
    records: records.filter(Boolean),
  });
}