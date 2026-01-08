import { kv } from "@vercel/kv";

export const runtime = "nodejs";

type Params = { id: string };

async function resolveParams(params: any): Promise<any> {
  // Next (versiones nuevas) puede pasar params como Promise
  if (params && typeof params.then === "function") return await params;
  return params;
}

export default async function SharePage({ params }: { params: Params | Promise<Params> }) {
  const p = await resolveParams(params);
  const id = p?.id;

  if (!id || typeof id !== "string") {
    return (
      <main style={{ maxWidth: 920, margin: "40px auto", padding: 16 }}>
        <h1>Parámetro inválido</h1>
        <pre>{JSON.stringify(p, null, 2)}</pre>
      </main>
    );
  }

  const record = await kv.get<any>(`story:${id}`);

  if (!record) {
    return (
      <main style={{ maxWidth: 920, margin: "40px auto", padding: 16 }}>
        <h1>No encontrada</h1>
        <p>Ese crossover expiró o no existe.</p>
        <p style={{ opacity: 0.7 }}>id: {id}</p>
      </main>
    );
  }

  const title = record.output?.title ?? "Crossover";
  const story = record.output?.story ?? "";
  const tags = record.output?.tags ?? [];
  const notes = record.output?.notes ?? "";
  const lang = record.input?.language ?? "en";

  return (
    <main style={{ maxWidth: 920, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 26, fontWeight: 900 }}>{title}</h1>
      <p style={{ opacity: 0.8, marginTop: 6 }}>
        Lang: <b>{lang}</b> · {record.input?.characterId} → {record.input?.universeId} ·{" "}
        {record.input?.tone} · {record.input?.length}
      </p>

      {tags?.length ? (
        <p style={{ opacity: 0.75, marginTop: 8 }}>Tags: {tags.join(", ")}</p>
      ) : null}

      <hr style={{ margin: "16px 0" }} />

      <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}>{story}</p>

      {notes ? (
        <p style={{ opacity: 0.75, marginTop: 14 }}>
          <b>Notes:</b> {notes}
        </p>
      ) : null}
    </main>
  );
}
