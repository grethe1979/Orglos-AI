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

const TAB_DUGNAD = "dugnad";
const TAB_VERV = "verv";

const duganTypes = [
  { id: "rydding", label: "🧹 Rydding & vedlikehold" },
  { id: "arrangement", label: "🎪 Arrangement / fest" },
  { id: "salg", label: "🥐 Salg & stands" },
  { id: "trening", label: "⚽ Treningsstøtte" },
  { id: "transport", label: "🚌 Transport" },
  { id: "annet", label: "✨ Annet" },
];

const roles = [
  { id: "leder", label: "👑 Leder / styreleder" },
  { id: "kasserer", label: "💰 Kasserer" },
  { id: "trener", label: "🏃 Trener / instruktør" },
  { id: "markedsansvarlig", label: "📣 Markedsansvarlig" },
  { id: "arrangementsansvarlig", label: "🎉 Arrangementsansvarlig" },
  { id: "sekretær", label: "📝 Sekretær" },
  { id: "dugnadsleder", label: "🔨 Dugnadsleder" },
  { id: "annet", label: "✨ Annen rolle" },
];

export default function DugnadAssistent() {
  const [tab, setTab] = useState(TAB_DUGNAD);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  // Dugnad form
  const [dug, setDug] = useState({
    orgName: "", duganType: "", date: "", location: "",
    numVolunteers: "", tasks: "", extraInfo: "",
  });

  // Verv form
  const [verv, setVerv] = useState({
    orgName: "", role: "", responsibilities: "",
    timeCommitment: "", benefits: "", tone: "vennlig",
  });

  const updateDug = (k, v) => setDug(f => ({ ...f, [k]: v }));
  const updateVerv = (k, v) => setVerv(f => ({ ...f, [k]: v }));

  const generate = async () => {
    setLoading(true);
    setResult("");

    let prompt = "";
    if (tab === TAB_DUGNAD) {
      prompt = `Du er en ekspert på frivillig arbeid i norske idrettslag og foreninger. Lag en engasjerende og vennlig dugnadsinnkalling på norsk.

INFORMASJON:
- Organisasjon: ${dug.orgName}
- Type dugnad: ${dug.duganType}
- Dato/tidspunkt: ${dug.date}
- Sted: ${dug.location}
- Antall frivillige som trengs: ${dug.numVolunteers}
- Oppgaver: ${dug.tasks}
- Tilleggsinformasjon: ${dug.extraInfo || "Ingen"}

Skriv:
1. En fengende overskrift
2. En varm og motiverende innledning (hvorfor dette er viktig for laget)
3. Praktisk info (dato, sted, oppmøtetid)
4. Liste over konkrete oppgaver fordelt på roller/grupper
5. Hva som skjer etterpå (f.eks. mat, sosialt)
6. Tydelig påmeldingsoppfordring med entusiasme

Tonen skal være varm, inkluderende og positiv – dugnad skal føles som fellesskap, ikke plikt.`;
    } else {
      prompt = `Du er en ekspert på rekruttering til frivillige organisasjoner i Norge. Skriv en engasjerende verveannonse for en frivillig rolle.

INFORMASJON:
- Organisasjon: ${verv.orgName}
- Rolle: ${verv.role}
- Ansvarsområder: ${verv.responsibilities}
- Tidsbruk: ${verv.timeCommitment}
- Hva man får igjen: ${verv.benefits || "Erfaring, nettverk og glede av å bidra"}
- Tone: ${verv.tone}

Skriv en verveannonse med:
1. Engasjerende tittel
2. Hvem vi er (kort og fengende om organisasjonen)
3. Hva rollen innebærer (konkret men ikke overveldende)
4. Hvem vi ser etter (personlighet og motivasjon, ikke bare CV)
5. Hva du får igjen
6. Tydelig call-to-action med kontaktinfo-plassholder

Gjør det menneskelig, varmt og ekte. Frivillighet handler om fellesskap – ikke bare oppgaver.`;
    }

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
      const text = data.content?.map(b => b.text || "").join("\n") || "Noe gikk galt.";
      setResult(text);
    } catch {
      setResult("Kunne ikke generere tekst. Prøv igjen.");
    }
    setLoading(false);
  };

  const canGenerate = tab === TAB_DUGNAD
    ? dug.orgName && dug.duganType && dug.date && dug.numVolunteers
    : verv.orgName && verv.role && verv.responsibilities;

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: G.warm,
      fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .tab-btn:hover { background: ${G.light} !important; }
        .gen-btn:hover:not(:disabled) { background: ${G.mid} !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,74,46,0.25) !important; }
        .chip:hover { border-color: ${G.mid} !important; background: ${G.light} !important; }
        textarea:focus, input:focus { border-color: ${G.mid} !important; outline: none; box-shadow: 0 0 0 3px ${G.light}; }
      `}</style>

      {/* Header */}
      <div style={{ background: G.dark, padding: "16px 28px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width:32, height:32, borderRadius:"50%", border:"2px solid #fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M4 10l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div style={{ color:"#fff", fontWeight:"700", fontSize:"1.1rem", letterSpacing:"0.08em" }}>ORGLOS</div>
          <div style={{ color:"rgba(255,255,255,0.55)", fontSize:"0.65rem", letterSpacing:"0.05em", fontFamily:"sans-serif" }}>Frivillig innsats gjort enkelt</div>
        </div>
        <div style={{ marginLeft:"auto", background:"rgba(255,255,255,0.12)", borderRadius:20, padding:"4px 14px", color:"rgba(255,255,255,0.85)", fontSize:"0.75rem", fontFamily:"sans-serif" }}>
          🤝 Dugnad & Rekruttering
        </div>
      </div>

      <div style={{ maxWidth:700, margin:"0 auto", padding:"36px 20px 60px", animation:"fadeUp 0.5s ease" }}>

        {/* Hero */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <h1 style={{ color:G.dark, fontSize:"2rem", fontWeight:"700", margin:"0 0 10px", letterSpacing:"-0.03em" }}>
            Dugnad & Verv
          </h1>
          <p style={{ color:G.muted, fontSize:"0.95rem", fontFamily:"sans-serif", margin:0 }}>
            AI skriver dugnadsinnkallinger og verveannonser — på sekunder
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", background:"#fff", borderRadius:14, padding:5, marginBottom:28, boxShadow:"0 2px 12px rgba(26,74,46,0.08)", border:`1px solid ${G.light}` }}>
          {[
            { id: TAB_DUGNAD, label: "🔨 Dugnadsinnkalling" },
            { id: TAB_VERV, label: "📣 Verveannonse" },
          ].map(t => (
            <button key={t.id} className="tab-btn" onClick={() => { setTab(t.id); setResult(""); }} style={{
              flex:1, padding:"11px 16px", borderRadius:10, border:"none", cursor:"pointer",
              background: tab === t.id ? G.dark : "transparent",
              color: tab === t.id ? "#fff" : G.muted,
              fontFamily:"sans-serif", fontWeight: tab === t.id ? "700" : "400",
              fontSize:"0.88rem", transition:"all 0.2s",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Main card */}
        <div style={{ background:"#fff", borderRadius:18, padding:32, boxShadow:"0 4px 28px rgba(26,74,46,0.09)", border:`1px solid ${G.light}` }}>

          {/* DUGNAD FORM */}
          {tab === TAB_DUGNAD && (
            <div style={{ animation:"fadeUp 0.3s ease" }}>
              <SectionLabel>Om dugnaden</SectionLabel>
              <Field label="Organisasjonens navn *" value={dug.orgName} onChange={v => updateDug("orgName", v)} placeholder="f.eks. Våler IF" />
              
              <div style={{ marginBottom:16 }}>
                <label style={labelStyle}>Type dugnad *</label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  {duganTypes.map(d => (
                    <div key={d.id} className="chip" onClick={() => updateDug("duganType", d.label)} style={{
                      padding:"9px 10px", borderRadius:9, cursor:"pointer", textAlign:"center",
                      border:`2px solid ${dug.duganType === d.label ? G.dark : "#e0ece3"}`,
                      background: dug.duganType === d.label ? G.light : "#fafcfb",
                      color: dug.duganType === d.label ? G.dark : "#555",
                      fontSize:"0.75rem", fontFamily:"sans-serif",
                      fontWeight: dug.duganType === d.label ? "700" : "400",
                      transition:"all 0.15s",
                    }}>
                      {d.label}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <Field label="Dato og tidspunkt *" value={dug.date} onChange={v => updateDug("date", v)} placeholder="f.eks. Lørdag 17. mai kl. 10:00" />
                <Field label="Antall frivillige *" value={dug.numVolunteers} onChange={v => updateDug("numVolunteers", v)} placeholder="f.eks. 15" />
              </div>
              <Field label="Sted / oppmøteplass" value={dug.location} onChange={v => updateDug("location", v)} placeholder="f.eks. Klubbhuset, Vålerhallen" />
              <Field label="Oppgaver som skal gjøres" value={dug.tasks} onChange={v => updateDug("tasks", v)} placeholder="f.eks. Rydde uteområde, male gjerder, vaske garderober..." multiline />
              <Field label="Tillegg (mat etterpå, utstyr, etc.)" value={dug.extraInfo} onChange={v => updateDug("extraInfo", v)} placeholder="f.eks. Vi griller pølser etterpå! Ta med arbeidsklær." multiline />
            </div>
          )}

          {/* VERV FORM */}
          {tab === TAB_VERV && (
            <div style={{ animation:"fadeUp 0.3s ease" }}>
              <SectionLabel>Om rollen</SectionLabel>
              <Field label="Organisasjonens navn *" value={verv.orgName} onChange={v => updateVerv("orgName", v)} placeholder="f.eks. Våler Håndballklubb" />
              
              <div style={{ marginBottom:16 }}>
                <label style={labelStyle}>Hvilken rolle rekrutterer dere til? *</label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {roles.map(r => (
                    <div key={r.id} className="chip" onClick={() => updateVerv("role", r.label)} style={{
                      padding:"10px 12px", borderRadius:9, cursor:"pointer",
                      border:`2px solid ${verv.role === r.label ? G.dark : "#e0ece3"}`,
                      background: verv.role === r.label ? G.light : "#fafcfb",
                      color: verv.role === r.label ? G.dark : "#555",
                      fontSize:"0.78rem", fontFamily:"sans-serif",
                      fontWeight: verv.role === r.label ? "700" : "400",
                      transition:"all 0.15s",
                    }}>
                      {r.label}
                    </div>
                  ))}
                </div>
              </div>

              <Field label="Ansvarsområder *" value={verv.responsibilities} onChange={v => updateVerv("responsibilities", v)} placeholder="f.eks. Lede styremøter, koordinere arrangementer, representere laget utad..." multiline />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <Field label="Tidsbruk" value={verv.timeCommitment} onChange={v => updateVerv("timeCommitment", v)} placeholder="f.eks. Ca. 3–5 timer/uke" />
                <div style={{ marginBottom:16 }}>
                  <label style={labelStyle}>Tone</label>
                  <select value={verv.tone} onChange={e => updateVerv("tone", e.target.value)} style={{
                    width:"100%", padding:"10px 14px", border:`1.5px solid #dde8e0`,
                    borderRadius:8, fontSize:"0.88rem", fontFamily:"sans-serif",
                    color:"#222", background:"#fafcfb", boxSizing:"border-box",
                  }}>
                    <option value="vennlig">😊 Vennlig og uformell</option>
                    <option value="entusiastisk">🔥 Entusiastisk og energisk</option>
                    <option value="profesjonell">💼 Profesjonell</option>
                  </select>
                </div>
              </div>
              <Field label="Hva får man igjen?" value={verv.benefits} onChange={v => updateVerv("benefits", v)} placeholder="f.eks. Godt nettverk, kurs og opplæring, stor påvirkning på lokalmiljøet..." multiline />
            </div>
          )}

          {/* Generate button */}
          {!result && !loading && (
            <button className="gen-btn" onClick={generate} disabled={!canGenerate} style={{
              width:"100%", padding:"14px", marginTop:8,
              background: canGenerate ? G.dark : "#ccc",
              color:"#fff", border:"none", borderRadius:10,
              fontSize:"0.95rem", fontFamily:"sans-serif", fontWeight:"700",
              cursor: canGenerate ? "pointer" : "not-allowed",
              transition:"all 0.2s", boxShadow: canGenerate ? "0 4px 16px rgba(26,74,46,0.2)" : "none",
            }}>
              {tab === TAB_DUGNAD ? "✍️ Generer dugnadsinnkalling" : "✍️ Generer verveannonse"}
            </button>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign:"center", padding:"32px 0" }}>
              <div style={{
                width:44, height:44, borderRadius:"50%",
                border:`4px solid ${G.light}`, borderTop:`4px solid ${G.dark}`,
                margin:"0 auto 16px", animation:"spin 0.8s linear infinite",
              }} />
              <p style={{ color:G.muted, fontFamily:"sans-serif", margin:0 }}>
                {tab === TAB_DUGNAD ? "Skriver innkalling..." : "Skriver verveannonse..."}
              </p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={{ animation:"fadeUp 0.4s ease" }}>
              <div style={{
                background: G.pale, borderRadius:12, padding:"22px 24px",
                whiteSpace:"pre-wrap", fontFamily:"sans-serif", fontSize:"0.87rem",
                lineHeight:1.75, color:G.text, maxHeight:400, overflowY:"auto",
                border:`1px solid ${G.accent}44`, marginBottom:16,
              }}>
                {result}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={handleCopy} style={{
                  flex:1, padding:"12px", background: G.dark, color:"#fff",
                  border:"none", borderRadius:9, fontSize:"0.88rem",
                  fontFamily:"sans-serif", fontWeight:"600", cursor:"pointer",
                }}>
                  {copied ? "✓ Kopiert!" : "📋 Kopier tekst"}
                </button>
                <button onClick={() => { setResult(""); }} style={{
                  flex:1, padding:"12px", background:"transparent", color:G.dark,
                  border:`2px solid ${G.dark}`, borderRadius:9, fontSize:"0.88rem",
                  fontFamily:"sans-serif", fontWeight:"600", cursor:"pointer",
                }}>
                  🔄 Generer ny versjon
                </button>
                <button onClick={() => { setResult(""); if(tab===TAB_DUGNAD) setDug({orgName:"",duganType:"",date:"",location:"",numVolunteers:"",tasks:"",extraInfo:""}); else setVerv({orgName:"",role:"",responsibilities:"",timeCommitment:"",benefits:"",tone:"vennlig"}); }} style={{
                  padding:"12px 16px", background:"transparent", color:"#aaa",
                  border:"2px solid #e0e0e0", borderRadius:9, fontSize:"0.88rem",
                  fontFamily:"sans-serif", cursor:"pointer",
                }}>
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        {!result && (
          <div style={{ marginTop:20, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[
              { icon:"💡", title:"Tips: Dugnad", text:"Nevn alltid hva som skjer etterpå – mat og sosialt øker oppmøtet betraktelig!" },
              { icon:"🎯", title:"Tips: Verv", text:"Fokuser på fellesskap og utvikling, ikke bare oppgaver. Folk vil bidra, ikke jobbe." },
            ].map(tip => (
              <div key={tip.title} style={{ background:G.light, borderRadius:12, padding:"16px", border:`1px solid ${G.accent}33` }}>
                <div style={{ fontSize:"1.2rem", marginBottom:6 }}>{tip.icon}</div>
                <div style={{ fontWeight:"700", color:G.dark, fontSize:"0.82rem", fontFamily:"sans-serif", marginBottom:4 }}>{tip.title}</div>
                <div style={{ color:G.muted, fontSize:"0.78rem", fontFamily:"sans-serif", lineHeight:1.5 }}>{tip.text}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign:"center", marginTop:32, color:"#bbb", fontSize:"0.72rem", fontFamily:"sans-serif" }}>
          Drevet av Org.Los · Frivillig innsats gjort enkelt
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display:"block", marginBottom:6, fontSize:"0.8rem", color:G.dark, fontFamily:"sans-serif", fontWeight:"600" };

function SectionLabel({ children }) {
  return <div style={{ fontSize:"0.7rem", fontFamily:"sans-serif", fontWeight:"700", color:G.accent, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:18 }}>{children}</div>;
}

function Field({ label, value, onChange, placeholder, multiline }) {
  const base = {
    width:"100%", padding:"10px 14px", border:"1.5px solid #dde8e0", borderRadius:8,
    fontSize:"0.88rem", fontFamily:"sans-serif", color:"#222", background:"#fafcfb",
    boxSizing:"border-box", transition:"border 0.2s",
  };
  return (
    <div style={{ marginBottom:16 }}>
      <label style={labelStyle}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...base, resize:"vertical" }} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />}
    </div>
  );
}
