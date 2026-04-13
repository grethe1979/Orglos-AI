import { useState } from "react";

const G = {
  dark: "#1a4a2e",
  mid: "#2d6e45",
  soft: "#4a7c5f",
  light: "#e8f0eb",
  pale: "#f4f8f5",
  accent: "#7eb897",
  warm: "#f9faf7",
  text: "#1c2b22",
  muted: "#6b8c76",
};

const CHANNELS = [
  { id: "facebook", label: "📘 Facebook-innlegg", icon: "📘" },
  { id: "newsletter", label: "📧 Nyhetsbrev", icon: "📧" },
  { id: "sms", label: "💬 SMS-varsel", icon: "💬" },
  { id: "instagram", label: "📸 Instagram", icon: "📸" },
  { id: "spond", label: "📲 Spond / app-melding", icon: "📲" },
];

const PURPOSES = [
  { id: "event", label: "🎉 Arrangement / aktivitet" },
  { id: "dugnad", label: "🔨 Dugnadsinnkalling" },
  { id: "nyhet", label: "📣 Nyhet fra laget" },
  { id: "rekruttering", label: "🤝 Verv / rekruttering" },
  { id: "resultat", label: "🏆 Resultat / prestasjon" },
  { id: "takk", label: "❤️ Takk til frivillige" },
  { id: "paaminning", label: "⏰ Påminnelse" },
  { id: "sesong", label: "🌱 Sesongstart / -avslutning" },
];

const TONES = [
  { id: "vennlig", label: "😊 Vennlig" },
  { id: "entusiastisk", label: "🔥 Entusiastisk" },
  { id: "profesjonell", label: "💼 Profesjonell" },
  { id: "uformell", label: "🤙 Uformell & morsom" },
];

export default function MedlemsKomm() {
  const [form, setForm] = useState({
    orgName: "",
    channel: "",
    purpose: "",
    tone: "vennlig",
    details: "",
    date: "",
    audience: "",
    emoji: true,
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]); // multiple variants
  const [activeVariant, setActiveVariant] = useState(0);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canGenerate = form.orgName && form.channel && form.purpose && form.details;

  const generate = async () => {
    setLoading(true);
    setResults([]);

    const channelGuide = {
      facebook: "Facebook-innlegg: 100–200 ord, engasjerende åpning, call-to-action, gjerne med emoji. Uformell men tydelig.",
      newsletter: "Nyhetsbrev: 200–350 ord, vennlig hilsen, tydelige avsnitt, avslutt med kontaktinfo-plassholder.",
      sms: "SMS: Maks 160 tegn! Skriv KUN én kort setning med det aller viktigste + lenke-plassholder. Ingen emoji.",
      instagram: "Instagram-bildetekst: 80–150 ord, fengende første linje (vises uten å klikke), 5–8 relevante hashtags på norsk til slutt.",
      spond: "Spond/app-melding: 50–100 ord, direkte og konkret, tydelig hva mottaker skal gjøre.",
    };

    const channelKey = form.channel.toLowerCase().includes("facebook") ? "facebook"
      : form.channel.toLowerCase().includes("nyhetsbrev") ? "newsletter"
      : form.channel.toLowerCase().includes("sms") ? "sms"
      : form.channel.toLowerCase().includes("instagram") ? "instagram"
      : "spond";

    const prompt = `Du er kommunikasjonsekspert for norske frivillige organisasjoner. Lag 2 ulike varianter av en melding.

ORGANISASJON: ${form.orgName}
KANAL: ${form.channel}
KANALGUIDE: ${channelGuide[channelKey]}
FORMÅL: ${form.purpose}
TONE: ${form.tone}
DETALJER: ${form.details}
${form.date ? `DATO/TIDSPUNKT: ${form.date}` : ""}
${form.audience ? `MÅLGRUPPE: ${form.audience}` : ""}
EMOJI: ${form.emoji ? "Bruk gjerne emoji der det passer" : "Ingen emoji"}

Svar KUN med dette JSON-formatet (ingen markdown, ingen forklaring):
{
  "variants": [
    { "label": "Variant A – [kort beskrivelse av vinkel]", "text": "teksten her" },
    { "label": "Variant B – [kort beskrivelse av vinkel]", "text": "teksten her" }
  ]
}

Begge varianter skal passe kanalen perfekt. Gi dem ulike vinkler eller åpninger.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const raw = data.content?.map(b => b.text || "").join("\n") || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResults(parsed.variants || []);
      setActiveVariant(0);
      setHistory(h => [{ channel: form.channel, purpose: form.purpose, variants: parsed.variants }, ...h.slice(0, 4)]);
    } catch {
      setResults([{ label: "Resultat", text: "Noe gikk galt. Prøv igjen." }]);
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(results[activeVariant]?.text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const charCount = results[activeVariant]?.text?.length || 0;

  return (
    <div style={{ minHeight: "100vh", background: G.warm, fontFamily: "'Palatino Linotype','Book Antiqua',Palatino,serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .chip:hover { border-color:${G.mid}!important; background:${G.light}!important; }
        textarea:focus,input:focus { border-color:${G.mid}!important;outline:none;box-shadow:0 0 0 3px ${G.light}; }
        .gen-btn:hover:not(:disabled) { filter:brightness(1.08);transform:translateY(-1px);box-shadow:0 6px 20px rgba(26,74,46,0.28)!important; }
        .var-tab:hover { background:${G.light}!important; }
        .hist-item:hover { background:${G.light}!important; }
      `}</style>

      {/* Header */}
      <div style={{ background: G.dark, padding: "16px 28px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width:32,height:32,borderRadius:"50%",border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M4 10l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div style={{ color:"#fff",fontWeight:"700",fontSize:"1.1rem",letterSpacing:"0.08em" }}>ORGLOS</div>
          <div style={{ color:"rgba(255,255,255,0.5)",fontSize:"0.65rem",letterSpacing:"0.05em",fontFamily:"sans-serif" }}>Frivillig innsats gjort enkelt</div>
        </div>
        <div style={{ marginLeft:"auto",background:"rgba(255,255,255,0.12)",borderRadius:20,padding:"4px 14px",color:"rgba(255,255,255,0.85)",fontSize:"0.75rem",fontFamily:"sans-serif" }}>
          📣 Kommunikasjonsassistent
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "36px 20px 60px" }}>

        <div style={{ textAlign: "center", marginBottom: 32, animation: "fadeUp 0.5s ease" }}>
          <h1 style={{ color:G.dark,fontSize:"2rem",fontWeight:"700",margin:"0 0 8px",letterSpacing:"-0.03em" }}>
            Medlemskommunikasjon
          </h1>
          <p style={{ color:G.muted,fontSize:"0.95rem",fontFamily:"sans-serif",margin:0 }}>
            Skriv det perfekte innlegget, nyhetsbrevet eller SMS-varselet — på sekunder
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

          {/* LEFT – Form */}
          <div style={{ background:"#fff",borderRadius:18,padding:28,boxShadow:"0 4px 28px rgba(26,74,46,0.09)",border:`1px solid ${G.light}`,animation:"fadeUp 0.5s ease" }}>

            <Field label="Organisasjonens navn *" value={form.orgName} onChange={v=>update("orgName",v)} placeholder="f.eks. Halden Musikkorps" />

            {/* Channel */}
            <div style={{ marginBottom:18 }}>
              <label style={lbl}>Kanal *</label>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                {CHANNELS.map(c=>(
                  <div key={c.id} className="chip" onClick={()=>update("channel",c.label)} style={{
                    padding:"10px 12px",borderRadius:9,cursor:"pointer",
                    border:`2px solid ${form.channel===c.label?G.dark:"#e0ece3"}`,
                    background:form.channel===c.label?G.light:"#fafcfb",
                    color:form.channel===c.label?G.dark:"#555",
                    fontSize:"0.78rem",fontFamily:"sans-serif",
                    fontWeight:form.channel===c.label?"700":"400",transition:"all 0.15s",
                  }}>{c.label}</div>
                ))}
              </div>
            </div>

            {/* Purpose */}
            <div style={{ marginBottom:18 }}>
              <label style={lbl}>Hva handler meldingen om? *</label>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                {PURPOSES.map(p=>(
                  <div key={p.id} className="chip" onClick={()=>update("purpose",p.label)} style={{
                    padding:"9px 10px",borderRadius:9,cursor:"pointer",
                    border:`2px solid ${form.purpose===p.label?G.dark:"#e0ece3"}`,
                    background:form.purpose===p.label?G.light:"#fafcfb",
                    color:form.purpose===p.label?G.dark:"#555",
                    fontSize:"0.75rem",fontFamily:"sans-serif",
                    fontWeight:form.purpose===p.label?"700":"400",transition:"all 0.15s",
                  }}>{p.label}</div>
                ))}
              </div>
            </div>

            <Field label="Detaljer og innhold *" value={form.details} onChange={v=>update("details",v)} placeholder="Hva er det viktigste å formidle? Jo mer du skriver, jo bedre melding..." multiline />

            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
              <Field label="Dato / tidspunkt" value={form.date} onChange={v=>update("date",v)} placeholder="f.eks. Lørdag 17. mai kl. 14:00" />
              <Field label="Målgruppe" value={form.audience} onChange={v=>update("audience",v)} placeholder="f.eks. Alle foreldre" />
            </div>

            {/* Tone */}
            <div style={{ marginBottom:18 }}>
              <label style={lbl}>Tone</label>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                {TONES.map(t=>(
                  <div key={t.id} className="chip" onClick={()=>update("tone",t.label)} style={{
                    padding:"8px 14px",borderRadius:20,cursor:"pointer",
                    border:`2px solid ${form.tone===t.label?G.dark:"#e0ece3"}`,
                    background:form.tone===t.label?G.dark:"#fafcfb",
                    color:form.tone===t.label?"#fff":"#555",
                    fontSize:"0.76rem",fontFamily:"sans-serif",
                    fontWeight:form.tone===t.label?"700":"400",transition:"all 0.15s",
                  }}>{t.label}</div>
                ))}
              </div>
            </div>

            {/* Emoji toggle */}
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20 }}>
              <div onClick={()=>update("emoji",!form.emoji)} style={{
                width:40,height:22,borderRadius:11,cursor:"pointer",transition:"background 0.2s",
                background:form.emoji?G.dark:"#ccc",position:"relative",
              }}>
                <div style={{ position:"absolute",top:3,left:form.emoji?20:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left 0.2s" }} />
              </div>
              <span style={{ fontSize:"0.82rem",fontFamily:"sans-serif",color:G.muted }}>Bruk emoji</span>
            </div>

            <button className="gen-btn" onClick={generate} disabled={!canGenerate||loading} style={{
              width:"100%",padding:"14px",
              background:canGenerate&&!loading?G.dark:"#ccc",
              color:"#fff",border:"none",borderRadius:10,
              fontSize:"0.95rem",fontFamily:"sans-serif",fontWeight:"700",
              cursor:canGenerate&&!loading?"pointer":"not-allowed",
              transition:"all 0.2s",boxShadow:canGenerate?"0 4px 16px rgba(26,74,46,0.2)":"none",
            }}>
              {loading ? "Skriver..." : "✍️ Generer 2 varianter"}
            </button>
          </div>

          {/* RIGHT – Result + History */}
          <div style={{ display:"flex",flexDirection:"column",gap:16 }}>

            {/* Result card */}
            <div style={{ background:"#fff",borderRadius:18,padding:24,boxShadow:"0 4px 28px rgba(26,74,46,0.09)",border:`1px solid ${G.light}`,animation:"fadeUp 0.5s ease 0.1s both" }}>

              {loading && (
                <div style={{ textAlign:"center",padding:"32px 0" }}>
                  <div style={{ width:40,height:40,borderRadius:"50%",border:`4px solid ${G.light}`,borderTop:`4px solid ${G.dark}`,margin:"0 auto 14px",animation:"spin 0.8s linear infinite" }} />
                  <p style={{ color:G.muted,fontFamily:"sans-serif",fontSize:"0.85rem",margin:0 }}>Skriver varianter...</p>
                </div>
              )}

              {!loading && results.length === 0 && (
                <div style={{ textAlign:"center",padding:"28px 10px" }}>
                  <div style={{ fontSize:"2.5rem",marginBottom:12 }}>✉️</div>
                  <div style={{ color:G.muted,fontFamily:"sans-serif",fontSize:"0.83rem",lineHeight:1.6 }}>
                    Fyll inn skjemaet og generer to varianter å velge mellom
                  </div>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div style={{ animation:"fadeUp 0.3s ease" }}>
                  {/* Variant tabs */}
                  <div style={{ display:"flex",gap:6,marginBottom:14 }}>
                    {results.map((r,i)=>(
                      <button key={i} className="var-tab" onClick={()=>setActiveVariant(i)} style={{
                        flex:1,padding:"8px 10px",borderRadius:8,border:`2px solid ${activeVariant===i?G.dark:G.light}`,
                        background:activeVariant===i?G.dark:"transparent",
                        color:activeVariant===i?"#fff":G.muted,
                        fontSize:"0.7rem",fontFamily:"sans-serif",fontWeight:activeVariant===i?"700":"400",
                        cursor:"pointer",transition:"all 0.15s",textAlign:"center",
                      }}>
                        {r.label?.split("–")[0]?.trim() || `Variant ${i+1}`}
                      </button>
                    ))}
                  </div>

                  {/* Variant label */}
                  <div style={{ fontSize:"0.68rem",fontFamily:"sans-serif",color:G.accent,fontWeight:"700",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:10 }}>
                    {results[activeVariant]?.label}
                  </div>

                  {/* Text */}
                  <div style={{ background:G.pale,borderRadius:10,padding:"16px",whiteSpace:"pre-wrap",fontFamily:"sans-serif",fontSize:"0.85rem",lineHeight:1.75,color:G.text,minHeight:120,maxHeight:280,overflowY:"auto",border:`1px solid ${G.accent}33`,marginBottom:12 }}>
                    {results[activeVariant]?.text}
                  </div>

                  {/* Char count */}
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
                    <span style={{ fontSize:"0.72rem",fontFamily:"sans-serif",color:G.muted }}>
                      {charCount} tegn {form.channel?.includes("SMS") && charCount > 160 && <span style={{ color:"#e05a2b",fontWeight:"700" }}>⚠️ Over SMS-grense</span>}
                    </span>
                    <span style={{ fontSize:"0.72rem",fontFamily:"sans-serif",color:G.accent }}>
                      {form.channel?.split(" ").slice(1).join(" ")}
                    </span>
                  </div>

                  <div style={{ display:"flex",gap:8 }}>
                    <button onClick={handleCopy} style={{ flex:1,padding:"10px",background:G.dark,color:"#fff",border:"none",borderRadius:8,fontSize:"0.83rem",fontFamily:"sans-serif",fontWeight:"600",cursor:"pointer" }}>
                      {copied?"✓ Kopiert!":"📋 Kopier"}
                    </button>
                    <button onClick={()=>{ setResults([]); }} style={{ padding:"10px 12px",background:"transparent",color:G.dark,border:`2px solid ${G.dark}`,borderRadius:8,fontSize:"0.83rem",fontFamily:"sans-serif",cursor:"pointer" }}>🔄</button>
                  </div>
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div style={{ background:"#fff",borderRadius:18,padding:20,boxShadow:"0 2px 12px rgba(26,74,46,0.06)",border:`1px solid ${G.light}`,animation:"fadeUp 0.5s ease 0.2s both" }}>
                <div style={{ fontSize:"0.68rem",fontFamily:"sans-serif",fontWeight:"700",color:G.accent,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12 }}>Siste genererte</div>
                {history.map((h,i)=>(
                  <div key={i} className="hist-item" onClick={()=>{ setResults(h.variants); setActiveVariant(0); }} style={{
                    padding:"10px 12px",borderRadius:8,cursor:"pointer",
                    marginBottom:6,transition:"background 0.15s",
                    border:`1px solid ${G.light}`,
                  }}>
                    <div style={{ fontSize:"0.78rem",fontFamily:"sans-serif",color:G.dark,fontWeight:"600" }}>{h.purpose}</div>
                    <div style={{ fontSize:"0.7rem",fontFamily:"sans-serif",color:G.muted,marginTop:2 }}>{h.channel}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Tips */}
            <div style={{ background:G.light,borderRadius:14,padding:16,border:`1px solid ${G.accent}33`,animation:"fadeUp 0.5s ease 0.3s both" }}>
              <div style={{ fontSize:"0.68rem",fontFamily:"sans-serif",fontWeight:"700",color:G.soft,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10 }}>Tips per kanal</div>
              {[
                { k:"📘 Facebook", v:"Post på tirsdag–torsdag kl. 10–12 for best rekkevidde" },
                { k:"💬 SMS", v:"Maks 160 tegn. Alltid ett tydelig budskap" },
                { k:"📧 Nyhetsbrev", v:"Emnefeltet avgjør om det leses – gjør det personlig" },
              ].map(t=>(
                <div key={t.k} style={{ marginBottom:8 }}>
                  <span style={{ fontSize:"0.75rem",fontFamily:"sans-serif",color:G.dark,fontWeight:"600" }}>{t.k}: </span>
                  <span style={{ fontSize:"0.75rem",fontFamily:"sans-serif",color:G.muted }}>{t.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ textAlign:"center",marginTop:32,color:"#bbb",fontSize:"0.72rem",fontFamily:"sans-serif" }}>
          Drevet av Org.Los · Frivillig innsats gjort enkelt
        </div>
      </div>
    </div>
  );
}

const lbl = { display:"block",marginBottom:6,fontSize:"0.8rem",color:G.dark,fontFamily:"sans-serif",fontWeight:"600" };

function Field({ label, value, onChange, placeholder, multiline }) {
  const base = { width:"100%",padding:"10px 14px",border:"1.5px solid #dde8e0",borderRadius:8,fontSize:"0.88rem",fontFamily:"sans-serif",color:"#222",background:"#fafcfb",boxSizing:"border-box",transition:"border 0.2s" };
  return (
    <div style={{ marginBottom:16 }}>
      <label style={lbl}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...base,resize:"vertical" }} />
        : <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={base} />}
    </div>
  );
}
