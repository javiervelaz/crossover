"use client";

import { useEffect, useState } from "react";

type Character = { id: string; name: string; origin: string };
type Universe = { id: string; name: string; tone: string };

type Result = {
  id: string;
  title: string;
  story: string;
  tags?: string[];
  notes?: string;
  shareUrl: string;
};

export default function Home() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [universes, setUniverses] = useState<Universe[]>([]);

  const [characterId, setCharacterId] = useState("walter_white");
  const [universeId, setUniverseId] = useState("stranger_things");
  const [tone, setTone] = useState("dark");
  const [length, setLength] = useState("short");
  const [language, setLanguage] = useState<"en" | "es" | "pt">("en");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [latest, setLatest] = useState<any[]>([]);


  useEffect(() => {
    (async () => {
      const res = await fetch("/api/catalog");
      const data = await res.json();
      setCharacters(data.characters || []);
      setUniverses(data.universes || []);
    })();
    (async () => {
        const res = await fetch("/api/catalog");
        const data = await res.json();
        setCharacters(data.characters || []);
        setUniverses(data.universes || []);

        const latestRes = await fetch("/api/stories/latest", { cache: "no-store" });
        const latestData = await latestRes.json();
        setLatest(latestData.records || []);
      })();

  }, []);

  async function generate() {
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await fetch("/api/crossover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId, universeId, tone, length, language }),
    });

    const raw = await res.text();
    let data: any = null;

    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = { error: "non_json_response", raw };
    }
   
    if (!res.ok) {
      setError(JSON.stringify(data, null, 2));
      setLoading(false);
      return;
    }

    setResult(data);
    setLoading(false);
    const latestRes = await fetch("/api/stories/latest", { cache: "no-store" });
    const latestData = await latestRes.json();
    setLatest(latestData.records || []);

  }

  async function copyLink() {
    if (!result) return;
    const full = `${window.location.origin}${result.shareUrl}`;
    await navigator.clipboard.writeText(full);
    alert("Link copiado ✅");
  }

  return (
    <main style={{ maxWidth: 920, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Crossover Engine</h1>
      <p style={{ opacity: 0.8, marginTop: 6 }}>
        Elegís personaje + universo + idioma, y n8n te genera un crossover consistente.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginTop: 18,
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          Personaje
          <select
            value={characterId}
            onChange={(e) => setCharacterId(e.target.value)}
            style={{ padding: 10 }}
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.origin}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Universo destino
          <select
            value={universeId}
            onChange={(e) => setUniverseId(e.target.value)}
            style={{ padding: 10 }}
          >
            {universes.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {u.tone}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Idioma
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            style={{ padding: 10 }}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="pt">Português</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Tono
          <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ padding: 10 }}>
            <option value="dark">Oscuro</option>
            <option value="comedic">Cómico seco</option>
            <option value="tragic">Trágico</option>
            <option value="action">Acción</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Longitud
          <select value={length} onChange={(e) => setLength(e.target.value)} style={{ padding: 10 }}>
            <option value="short">Corta</option>
            <option value="medium">Media</option>
          </select>
        </label>

        <div style={{ display: "flex", alignItems: "end" }}>
          <button
            onClick={generate}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 14px",
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Generando..." : "Generar crossover"}
          </button>
        </div>
      </div>

      {error && (
        <pre style={{ marginTop: 16, padding: 12, background: "#111", color: "#ff6b6b", overflowX: "auto" }}>
          {error}
        </pre>
      )}

      {result && (
        <section style={{ marginTop: 22 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{result.title}</h2>
            <a href={result.shareUrl} style={{ textDecoration: "underline" }}>
              Abrir link
            </a>
            <button onClick={copyLink} style={{ padding: "8px 10px", fontWeight: 700 }}>
              Copiar link
            </button>
          </div>

          {result.tags?.length ? (
            <p style={{ opacity: 0.75, marginTop: 8 }}>
              Tags: {result.tags.join(", ")}
            </p>
          ) : null}

          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.65, marginTop: 12 }}>
            {result.story}
          </p>

          {result.notes ? (
            <p style={{ opacity: 0.75, marginTop: 12 }}>
              <b>Notes:</b> {result.notes}
            </p>
          ) : null}
        </section>
      )}

      <section style={{ marginTop: 28 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>Últimos crossovers</h3>

        {latest.length === 0 ? (
          <p style={{ opacity: 0.7 }}>Todavía no hay historias guardadas.</p>
        ) : (
          <ul style={{ paddingLeft: 18, lineHeight: 1.6 }}>
            {latest.map((r) => (
              <li key={r.id}>
                <a href={`/s/${r.id}`} style={{ textDecoration: "underline" }}>
                  {r.output?.title ?? r.id}
                </a>{" "}
                <span style={{ opacity: 0.7 }}>
                  — {r.input?.characterId} → {r.input?.universeId} · {r.input?.language ?? "en"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

    </main>
  );
}
