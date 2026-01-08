import { kv } from "@vercel/kv";

export const runtime = "nodejs";

type Params = { id: string };

async function resolveParams(params: Params | Promise<Params>): Promise<Params> {
  return (params && typeof (params as any).then === "function")
    ? await (params as Promise<Params>)
    : (params as Params);
}

export async function GET(
  _req: Request,
  ctx: { params: Params | Promise<Params> }
) {
  const { id } = await resolveParams(ctx.params);

  const record = await kv.get<any>(`story:${id}`);

  if (!record) {
    return Response.json({ error: "not_found", id }, { status: 404 });
  }

  return Response.json(record);
}
