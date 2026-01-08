import { kv } from "@vercel/kv";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const key = `story:${id}`;
  const data = await kv.get(key);

  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json(data);
}
