import { kv } from "@vercel/kv";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const key = `story:${params.id}`;
  const data = await kv.get(key);

  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json(data);
}
