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
      
      <header
        style={{
          marginBottom: 40,
          padding: "32px 28px",
          borderRadius: 12,
          background:
            "linear-gradient(135deg, rgba(109,94,246,0.12), rgba(109,94,246,0.03))",
          border: "1px solid rgba(109,94,246,0.25)",
        }}
      >
        <h1
          style={{
            fontSize: 38,
            fontWeight: 900,
            lineHeight: 1.2,
            margin: 0,
            color: "#111",
          }}
        >
          ¿Qué pasaría si un personaje
          <br />
          entrara en otro universo?
        </h1>

        <p
          style={{
            marginTop: 14,
            fontSize: 18,
            opacity: 0.85,
            maxWidth: 640,
          }}
        >
          Un experimento creativo donde el carácter, las reglas del mundo y el tono
          importan.  
          Elegí el cruce. El resto lo escribe la historia.
        </p>
      </header>


      <div
        style={{
          padding: 24,
          borderRadius: 12,
          border: "1px solid #e5e5e5",
          background: "#fafafa",
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
              padding: "14px 16px",
              fontSize: 16,
              fontWeight: 800,
              borderRadius: 8,
              background: loading
                ? "linear-gradient(135deg, #b8b3fa, #d6d4fd)"
                : "linear-gradient(135deg, #6D5EF6, #8A7CFA)",
              color: "#fff",
              border: "none",
              boxShadow: "0 6px 18px rgba(109,94,246,0.25)",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? "Abriendo un portal entre universos…" : "Generar historia"}
          </button>


        </div>
      </div>

      {error && (
        <pre style={{ marginTop: 16, padding: 12, background: "#111", color: "#ff6b6b", overflowX: "auto" }}>
          {error}
        </pre>
      )}

      {result && (
        <section
            style={{
              marginTop: 48,
              paddingTop: 32,
              borderTop: "2px solid rgba(109,94,246,0.25)",
            }}
          >
          <h2 style={{ fontSize: 28, fontWeight: 900 }}>{result.title}</h2>

          {result.tags?.length ? (
            <p style={{ opacity: 0.6, marginTop: 6 }}>
              {result.tags.join(" · ")}
            </p>
          ) : null}

          <article
            style={{
              marginTop: 20,
              fontSize: 17,
              lineHeight: 1.75,
              whiteSpace: "pre-wrap",
              maxWidth: 720,
            }}
          >
            {result.story}
          </article>

          <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
            <a href={result.shareUrl} style={{ textDecoration: "underline" }}>
              Abrir link
            </a>
            <button onClick={copyLink}>Copiar link</button>
          </div>
        </section>

      )}

      <section style={{ marginTop: 48 }}>
        <h3 style={{ fontSize: 20, fontWeight: 800 }}>Últimos crossovers</h3>

        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {latest.map((r) => (
            <a
              key={r.id}
              href={`/s/${r.id}`}
              style={{
                padding: 14,
                border: "1px solid #ddd",
                borderRadius: 8,
                textDecoration: "none",
                color: "inherit",
                background: "#fff",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f7f7ff";
                e.currentTarget.style.borderColor = "#6D5EF6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = "#ddd";
              }}

            >
              <strong>{r.output?.title ?? r.id}</strong>
              <div style={{ opacity: 0.7, fontSize: 14, marginTop: 4 }}>
                {r.input?.characterId} → {r.input?.universeId} · {r.input?.language}
              </div>
            </a>
          ))}
        </div>
      </section>


    </main>
  );
}
