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
  gold: "#c4963a",
  goldLight: "#fdf6e8",
};

const MONTHS = ["Januar","Februar","Mars","April","Mai","Juni","Juli","August","September","Oktober","November","Desember"];

const ORG_TYPES = [
  { id: "idrettslag", label: "⚽ Idrettslag" },
  { id: "korps", label: "🎺 Korps / kor" },
  { id: "velforening", label: "🏘️ Velforening" },
  { id: "helse", label: "❤️ Helseorganisasjon" },
  { id: "ungdom", label: "🧒 Ungdomsorganisasjon" },
  { id: "annet", label: "✨ Annen forening" },
];

const MEETING_TYPES = [
  { id: "arsmote", label: "📋 Årsmøte" },
  { id: "styremote", label: "🗂️ Styremøte" },
  { id: "planmote", label: "🗓️ Planleggingsmøte" },
  { id: "evalueringsmote", label: "🔍 Evalueringsmøte" },
  { id: "dugnadsmote", label: "🔨 Dugnadsmøte" },
  { id: "ekstraordinaert", label: "⚡ Ekstraordinært møte" },
];

const TAB_AARSHJUL = "aarshjul";
const TAB_AGENDA = "agenda";
const TAB_PROTOKOLL = "protokoll";

export default function AarshjulAssistent() {
  const [tab, setTab] = useState(TAB_AARSHJUL);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeMonth, setActiveMonth] = useState(null);

  const [aarshjul, setAarshjul] = useState({
    orgName: "", orgType: "", numMembers: "", activities: "",
    hasSeasons: false, seasonStart: "August", seasonEnd: "Mai",
  });

  const [agenda, setAgenda] = useState({
    orgName: "", meetingType: "", date: "", location: "",
    topics: "", duration: "60", attendees: "",
  });

  const [protokoll, setProtokoll] = useState({
    orgName: "", meetingType: "", date: "", attendees: "",
    decisions: "", nextMeeting: "",
  });

  const [generatedCalendar, setGeneratedCalendar] = useState(null);

  const updateA = (k, v) => setAarshjul(f => ({ ...f, [k]: v }));
  const updateAg = (k, v) => setAgenda(f => ({ ...f, [k]: v }));
  const updateP = (k, v) => setProtokoll(f => ({ ...f, [k]: v }));

  const generate = async () => {
    setLoading(true);
    setResult("");
    setGeneratedCalendar(null);

    let prompt = "";

    if (tab === TAB_AARSHJUL) {
      prompt = `Du er ekspert på norske frivillige organisasjoner. Lag et detaljert årshjul for organisasjonen nedenfor. Svar KUN med et JSON-objekt, ingen markdown, ingen forklaring.

ORGANISASJON:
- Navn: ${aarshjul.orgName}
- Type: ${aarshjul.orgType}
- Antall medlemmer: ${aarshjul.numMembers || "ukjent"}
- Aktiviteter/særtrekk: ${aarshjul.activities || "typisk for organisasjonstypen"}
- Sesong: ${aarshjul.hasSeasons ? `${aarshjul.seasonStart}–${aarshjul.seasonEnd}` : "Helårlig"}

Returner dette JSON-formatet (ikke noe annet):
{
  "months": [
    {
      "month": "Januar",
      "tasks": ["oppgave 1", "oppgave 2", "oppgave 3"],
      "meetings": ["møte 1"],
      "focus": "kort fokusord"
    }
  ]
}

Lag 12 måneder med 2-4 oppgaver og 0-2 møter per måned. Tilpass nøye til organisasjonstypen.`;
    } else if (tab === TAB_AGENDA) {
      prompt = `Du er ekspert på møteledelse i norske frivillige organisasjoner. Lag en profesjonell møteagenda på norsk.

MØTEINFO:
- Organisasjon: ${agenda.orgName}
- Møtetype: ${agenda.meetingType}
- Dato: ${agenda.date}
- Sted: ${agenda.location || "Ikke oppgitt"}
- Varighet: ${agenda.duration} minutter
- Deltakere: ${agenda.attendees || "Styremedlemmer"}
- Saker som skal behandles: ${agenda.topics}

Skriv en ryddig og komplett agenda med:
1. Møteinfo øverst (dato, sted, deltakere)
2. Nummererte agendapunkter med tidsanvisning
3. Ansvarlig for hvert punkt
4. Plass til vedtak/notater under hvert punkt
5. Avslutning og neste møte

Formater det slik at det kan brukes direkte, klart og profesjonelt.`;
    } else {
      prompt = `Du er ekspert på organisasjonsdrift i Norge. Lag en ferdig styreprotokoll på norsk.

MØTEINFO:
- Organisasjon: ${protokoll.orgName}
- Møtetype: ${protokoll.meetingType}
- Dato: ${protokoll.date}
- Til stede: ${protokoll.attendees}
- Saker og vedtak: ${protokoll.decisions}
- Neste møte: ${protokoll.nextMeeting || "Ikke fastsatt"}

Skriv en komplett og formell protokoll med:
1. Møteinfo (dato, sted, til stede, møteleder, referent)
2. Godkjenning av innkalling og forrige protokoll
3. Nummererte saker med vedtakstekst
4. Eventuelt
5. Underskriftslinjer
6. Dato for neste møte

Bruk korrekt norsk organisasjonsspråk. Vedtakene skal stå i kursiv/tydelig format.`;
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

      if (tab === TAB_AARSHJUL) {
        try {
          const clean = text.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(clean);
          setGeneratedCalendar(parsed.months);
          setActiveMonth(0);
        } catch {
          setResult(text);
        }
      } else {
        setResult(text);
      }
    } catch {
      setResult("Kunne ikke generere. Prøv igjen.");
    }
    setLoading(false);
  };

  const canGenerate = () => {
    if (tab === TAB_AARSHJUL) return aarshjul.orgName && aarshjul.orgType;
    if (tab === TAB_AGENDA) return agenda.orgName && agenda.meetingType && agenda.date && agenda.topics;
    return protokoll.orgName && protokoll.meetingType && protokoll.date && protokoll.decisions;
  };

  const handleCopy = () => {
    let text = result;
    if (generatedCalendar) {
      text = generatedCalendar.map(m =>
        `## ${m.month} – ${m.focus}\nOppgaver:\n${m.tasks.map(t => `• ${t}`).join("\n")}${m.meetings?.length ? `\nMøter:\n${m.meetings.map(mt => `• ${mt}`).join("\n")}` : ""}`
      ).join("\n\n");
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: TAB_AARSHJUL, label: "📅 Årshjul" },
    { id: TAB_AGENDA, label: "📋 Møteagenda" },
    { id: TAB_PROTOKOLL, label: "📝 Protokoll" },
  ];

  return (
    <div style={{ minHeight:"100vh", background: G.warm, fontFamily:"'Palatino Linotype','Book Antiqua',Palatino,serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.6} }
        .month-btn:hover { background: ${G.light} !important; }
        .chip:hover { border-color: ${G.mid} !important; }
        textarea:focus, input:focus, select:focus { border-color:${G.mid}!important;outline:none;box-shadow:0 0 0 3px ${G.light}; }
        .gen-btn:hover:not(:disabled) { filter:brightness(1.08);transform:translateY(-1px); }
      `}</style>

      {/* Header */}
      <div style={{ background:G.dark, padding:"16px 28px", display:"flex", alignItems:"center", gap:12 }}>
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
          📅 Årshjul & Møter
        </div>
      </div>

      <div style={{ maxWidth:740, margin:"0 auto", padding:"36px 20px 60px", animation:"fadeUp 0.5s ease" }}>

        <div style={{ textAlign:"center", marginBottom:32 }}>
          <h1 style={{ color:G.dark,fontSize:"2rem",fontWeight:"700",margin:"0 0 8px",letterSpacing:"-0.03em" }}>
            Årshjul & Møteassistent
          </h1>
          <p style={{ color:G.muted,fontSize:"0.95rem",fontFamily:"sans-serif",margin:0 }}>
            Planlegg året, skriv agendaer og protokoller — automatisk
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex",background:"#fff",borderRadius:14,padding:5,marginBottom:28,boxShadow:"0 2px 12px rgba(26,74,46,0.08)",border:`1px solid ${G.light}` }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setResult(""); setGeneratedCalendar(null); }} style={{
              flex:1,padding:"11px 8px",borderRadius:10,border:"none",cursor:"pointer",
              background: tab===t.id ? G.dark : "transparent",
              color: tab===t.id ? "#fff" : G.muted,
              fontFamily:"sans-serif",fontWeight:tab===t.id?"700":"400",
              fontSize:"0.82rem",transition:"all 0.2s",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Card */}
        <div style={{ background:"#fff",borderRadius:18,padding:32,boxShadow:"0 4px 28px rgba(26,74,46,0.09)",border:`1px solid ${G.light}` }}>

          {/* ÅRSHJUL */}
          {tab === TAB_AARSHJUL && !generatedCalendar && (
            <div style={{ animation:"fadeUp 0.3s ease" }}>
              <Label>Om organisasjonen</Label>
              <Field label="Organisasjonens navn *" value={aarshjul.orgName} onChange={v=>updateA("orgName",v)} placeholder="f.eks. Råde Tennisklubb" />
              <div style={{ marginBottom:16 }}>
                <label style={lbl}>Type organisasjon *</label>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
                  {ORG_TYPES.map(o => (
                    <div key={o.id} className="chip" onClick={()=>updateA("orgType",o.label)} style={{
                      padding:"9px 10px",borderRadius:9,cursor:"pointer",textAlign:"center",
                      border:`2px solid ${aarshjul.orgType===o.label?G.dark:"#e0ece3"}`,
                      background:aarshjul.orgType===o.label?G.light:"#fafcfb",
                      color:aarshjul.orgType===o.label?G.dark:"#555",
                      fontSize:"0.75rem",fontFamily:"sans-serif",
                      fontWeight:aarshjul.orgType===o.label?"700":"400",transition:"all 0.15s",
                    }}>{o.label}</div>
                  ))}
                </div>
              </div>
              <Field label="Antall medlemmer" value={aarshjul.numMembers} onChange={v=>updateA("numMembers",v)} placeholder="f.eks. 120" />
              <Field label="Viktige aktiviteter / særtrekk" value={aarshjul.activities} onChange={v=>updateA("activities",v)} placeholder="f.eks. Cupturneringer om høsten, sommerleir i juli, styremøter månedlig..." multiline />
              <div style={{ marginBottom:16 }}>
                <label style={lbl}>Sesongbasert?</label>
                <div style={{ display:"flex",gap:10 }}>
                  {[{v:false,l:"🌍 Helårlig"},{v:true,l:"🍂 Ja, sesong"}].map(o=>(
                    <div key={String(o.v)} className="chip" onClick={()=>updateA("hasSeasons",o.v)} style={{
                      padding:"10px 18px",borderRadius:9,cursor:"pointer",
                      border:`2px solid ${aarshjul.hasSeasons===o.v?G.dark:"#e0ece3"}`,
                      background:aarshjul.hasSeasons===o.v?G.light:"#fafcfb",
                      color:aarshjul.hasSeasons===o.v?G.dark:"#555",
                      fontSize:"0.82rem",fontFamily:"sans-serif",
                      fontWeight:aarshjul.hasSeasons===o.v?"700":"400",transition:"all 0.15s",
                    }}>{o.l}</div>
                  ))}
                </div>
              </div>
              {aarshjul.hasSeasons && (
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
                  {["seasonStart","seasonEnd"].map((k,i)=>(
                    <div key={k} style={{ marginBottom:16 }}>
                      <label style={lbl}>{i===0?"Sesong starter":"Sesong slutter"}</label>
                      <select value={aarshjul[k]} onChange={e=>updateA(k,e.target.value)} style={{ width:"100%",padding:"10px 14px",border:"1.5px solid #dde8e0",borderRadius:8,fontSize:"0.88rem",fontFamily:"sans-serif",color:"#222",background:"#fafcfb",boxSizing:"border-box" }}>
                        {MONTHS.map(m=><option key={m}>{m}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ÅRSHJUL RESULT */}
          {tab === TAB_AARSHJUL && generatedCalendar && (
            <div style={{ animation:"fadeUp 0.4s ease" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
                <div style={{ fontSize:"0.7rem",fontFamily:"sans-serif",fontWeight:"700",color:G.accent,letterSpacing:"0.1em",textTransform:"uppercase" }}>
                  Årshjul for {aarshjul.orgName}
                </div>
                <button onClick={()=>{ setGeneratedCalendar(null); setResult(""); }} style={{ background:"transparent",border:`1px solid ${G.light}`,borderRadius:6,padding:"4px 10px",fontSize:"0.75rem",fontFamily:"sans-serif",color:G.muted,cursor:"pointer" }}>
                  ← Endre
                </button>
              </div>

              {/* Month selector */}
              <div style={{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4,marginBottom:20 }}>
                {generatedCalendar.map((m,i)=>(
                  <button key={m.month} className="month-btn" onClick={()=>setActiveMonth(i)} style={{
                    padding:"8px 4px",borderRadius:8,border:`2px solid ${activeMonth===i?G.dark:G.light}`,
                    background:activeMonth===i?G.dark:"#fafcfb",
                    color:activeMonth===i?"#fff":G.muted,
                    fontSize:"0.7rem",fontFamily:"sans-serif",fontWeight:activeMonth===i?"700":"400",
                    cursor:"pointer",transition:"all 0.15s",textAlign:"center",
                  }}>
                    {m.month.slice(0,3)}
                  </button>
                ))}
              </div>

              {/* Active month detail */}
              {activeMonth !== null && generatedCalendar[activeMonth] && (
                <div style={{ background:G.pale,borderRadius:14,padding:24,border:`1px solid ${G.accent}33`,animation:"fadeUp 0.25s ease" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16 }}>
                    <div>
                      <div style={{ fontSize:"1.3rem",fontWeight:"700",color:G.dark }}>{generatedCalendar[activeMonth].month}</div>
                      <div style={{ fontSize:"0.78rem",fontFamily:"sans-serif",color:G.accent,fontWeight:"600",marginTop:2 }}>
                        Fokus: {generatedCalendar[activeMonth].focus}
                      </div>
                    </div>
                    <div style={{ display:"flex",gap:8 }}>
                      <button onClick={()=>setActiveMonth(i=>Math.max(0,i-1))} disabled={activeMonth===0} style={{ background:"transparent",border:`1px solid ${G.light}`,borderRadius:6,padding:"4px 10px",cursor:activeMonth===0?"not-allowed":"pointer",color:G.muted,fontSize:"0.8rem",fontFamily:"sans-serif" }}>←</button>
                      <button onClick={()=>setActiveMonth(i=>Math.min(11,i+1))} disabled={activeMonth===11} style={{ background:G.dark,border:"none",borderRadius:6,padding:"4px 10px",cursor:activeMonth===11?"not-allowed":"pointer",color:"#fff",fontSize:"0.8rem",fontFamily:"sans-serif" }}>→</button>
                    </div>
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
                    <div>
                      <div style={{ fontSize:"0.72rem",fontFamily:"sans-serif",fontWeight:"700",color:G.soft,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10 }}>Oppgaver</div>
                      {generatedCalendar[activeMonth].tasks?.map((t,i)=>(
                        <div key={i} style={{ display:"flex",gap:8,marginBottom:8,alignItems:"flex-start" }}>
                          <div style={{ width:20,height:20,borderRadius:6,border:`2px solid ${G.accent}`,flexShrink:0,marginTop:1 }} />
                          <span style={{ fontSize:"0.83rem",fontFamily:"sans-serif",color:G.text,lineHeight:1.4 }}>{t}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize:"0.72rem",fontFamily:"sans-serif",fontWeight:"700",color:G.soft,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10 }}>Møter</div>
                      {generatedCalendar[activeMonth].meetings?.length > 0
                        ? generatedCalendar[activeMonth].meetings.map((m,i)=>(
                          <div key={i} style={{ display:"flex",gap:8,marginBottom:8,alignItems:"flex-start" }}>
                            <div style={{ fontSize:"1rem",flexShrink:0 }}>📋</div>
                            <span style={{ fontSize:"0.83rem",fontFamily:"sans-serif",color:G.text,lineHeight:1.4 }}>{m}</span>
                          </div>
                        ))
                        : <div style={{ fontSize:"0.83rem",fontFamily:"sans-serif",color:G.muted }}>Ingen planlagte møter</div>
                      }
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display:"flex",gap:10,marginTop:16 }}>
                <button onClick={handleCopy} style={{ flex:1,padding:"12px",background:G.dark,color:"#fff",border:"none",borderRadius:9,fontSize:"0.88rem",fontFamily:"sans-serif",fontWeight:"600",cursor:"pointer" }}>
                  {copied ? "✓ Kopiert!" : "📋 Kopier årshjul"}
                </button>
                <button onClick={()=>{ setGeneratedCalendar(null); generate(); }} style={{ padding:"12px 16px",background:"transparent",color:G.dark,border:`2px solid ${G.dark}`,borderRadius:9,fontSize:"0.88rem",fontFamily:"sans-serif",fontWeight:"600",cursor:"pointer" }}>
                  🔄 Ny versjon
                </button>
              </div>
            </div>
          )}

          {/* AGENDA FORM */}
          {tab === TAB_AGENDA && !result && (
            <div style={{ animation:"fadeUp 0.3s ease" }}>
              <Label>Om møtet</Label>
              <Field label="Organisasjonens navn *" value={agenda.orgName} onChange={v=>updateAg("orgName",v)} placeholder="f.eks. Moss Fotballklubb" />
              <div style={{ marginBottom:16 }}>
                <label style={lbl}>Møtetype *</label>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                  {MEETING_TYPES.map(m=>(
                    <div key={m.id} className="chip" onClick={()=>updateAg("meetingType",m.label)} style={{
                      padding:"10px 12px",borderRadius:9,cursor:"pointer",
                      border:`2px solid ${agenda.meetingType===m.label?G.dark:"#e0ece3"}`,
                      background:agenda.meetingType===m.label?G.light:"#fafcfb",
                      color:agenda.meetingType===m.label?G.dark:"#555",
                      fontSize:"0.78rem",fontFamily:"sans-serif",
                      fontWeight:agenda.meetingType===m.label?"700":"400",transition:"all 0.15s",
                    }}>{m.label}</div>
                  ))}
                </div>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
                <Field label="Dato *" value={agenda.date} onChange={v=>updateAg("date",v)} placeholder="f.eks. 15. mai 2025, kl. 18:00" />
                <Field label="Varighet (min)" value={agenda.duration} onChange={v=>updateAg("duration",v)} placeholder="60" />
              </div>
              <Field label="Sted" value={agenda.location} onChange={v=>updateAg("location",v)} placeholder="f.eks. Klubbhuset" />
              <Field label="Deltakere" value={agenda.attendees} onChange={v=>updateAg("attendees",v)} placeholder="f.eks. Hele styret + daglig leder" />
              <Field label="Saker som skal behandles *" value={agenda.topics} onChange={v=>updateAg("topics",v)} placeholder="f.eks. Budsjett 2025, ny trener, sommerarrangement, utstyrskjøp..." multiline />
            </div>
          )}

          {/* PROTOKOLL FORM */}
          {tab === TAB_PROTOKOLL && !result && (
            <div style={{ animation:"fadeUp 0.3s ease" }}>
              <Label>Møteinfo</Label>
              <Field label="Organisasjonens navn *" value={protokoll.orgName} onChange={v=>updateP("orgName",v)} placeholder="f.eks. Halden Volleyballklubb" />
              <div style={{ marginBottom:16 }}>
                <label style={lbl}>Møtetype *</label>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                  {MEETING_TYPES.map(m=>(
                    <div key={m.id} className="chip" onClick={()=>updateP("meetingType",m.label)} style={{
                      padding:"10px 12px",borderRadius:9,cursor:"pointer",
                      border:`2px solid ${protokoll.meetingType===m.label?G.dark:"#e0ece3"}`,
                      background:protokoll.meetingType===m.label?G.light:"#fafcfb",
                      color:protokoll.meetingType===m.label?G.dark:"#555",
                      fontSize:"0.78rem",fontFamily:"sans-serif",
                      fontWeight:protokoll.meetingType===m.label?"700":"400",transition:"all 0.15s",
                    }}>{m.label}</div>
                  ))}
                </div>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
                <Field label="Dato *" value={protokoll.date} onChange={v=>updateP("date",v)} placeholder="f.eks. 10. april 2025" />
                <Field label="Neste møte" value={protokoll.nextMeeting} onChange={v=>updateP("nextMeeting",v)} placeholder="f.eks. 12. mai 2025" />
              </div>
              <Field label="Til stede *" value={protokoll.attendees} onChange={v=>updateP("attendees",v)} placeholder="f.eks. Kari Holm (leder), Per Olsen (kasserer), Lise Dahl..." />
              <Field label="Saker og vedtak *" value={protokoll.decisions} onChange={v=>updateP("decisions",v)} placeholder="f.eks. Sak 1: Budsjett – vedtatt med 5 mot 0. Sak 2: Ny trener ansatt fra august..." multiline />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign:"center",padding:"40px 0" }}>
              <div style={{ width:44,height:44,borderRadius:"50%",border:`4px solid ${G.light}`,borderTop:`4px solid ${G.dark}`,margin:"0 auto 16px",animation:"spin 0.8s linear infinite" }} />
              <p style={{ color:G.muted,fontFamily:"sans-serif",margin:0 }}>
                {tab===TAB_AARSHJUL?"Bygger årshjulet ditt...":tab===TAB_AGENDA?"Skriver agenda...":"Skriver protokoll..."}
              </p>
            </div>
          )}

          {/* Text result (agenda / protokoll) */}
          {result && !generatedCalendar && (
            <div style={{ animation:"fadeUp 0.4s ease" }}>
              <div style={{ background:G.pale,borderRadius:12,padding:"22px 24px",whiteSpace:"pre-wrap",fontFamily:"sans-serif",fontSize:"0.87rem",lineHeight:1.75,color:G.text,maxHeight:420,overflowY:"auto",border:`1px solid ${G.accent}44`,marginBottom:16 }}>
                {result}
              </div>
              <div style={{ display:"flex",gap:10 }}>
                <button onClick={handleCopy} style={{ flex:1,padding:"12px",background:G.dark,color:"#fff",border:"none",borderRadius:9,fontSize:"0.88rem",fontFamily:"sans-serif",fontWeight:"600",cursor:"pointer" }}>
                  {copied?"✓ Kopiert!":"📋 Kopier"}
                </button>
                <button onClick={()=>{ setResult(""); generate(); }} style={{ flex:1,padding:"12px",background:"transparent",color:G.dark,border:`2px solid ${G.dark}`,borderRadius:9,fontSize:"0.88rem",fontFamily:"sans-serif",fontWeight:"600",cursor:"pointer" }}>
                  🔄 Ny versjon
                </button>
                <button onClick={()=>setResult("")} style={{ padding:"12px 16px",background:"transparent",color:"#aaa",border:"2px solid #e0e0e0",borderRadius:9,fontSize:"0.88rem",fontFamily:"sans-serif",cursor:"pointer" }}>✕</button>
              </div>
            </div>
          )}

          {/* Generate button */}
          {!result && !loading && !generatedCalendar && (
            <button className="gen-btn" onClick={generate} disabled={!canGenerate()} style={{
              width:"100%",padding:"14px",marginTop:8,
              background:canGenerate()?G.dark:"#ccc",
              color:"#fff",border:"none",borderRadius:10,
              fontSize:"0.95rem",fontFamily:"sans-serif",fontWeight:"700",
              cursor:canGenerate()?"pointer":"not-allowed",
              transition:"all 0.2s",boxShadow:canGenerate()?"0 4px 16px rgba(26,74,46,0.2)":"none",
            }}>
              {tab===TAB_AARSHJUL?"📅 Generer årshjul":tab===TAB_AGENDA?"📋 Generer møteagenda":"📝 Generer protokoll"}
            </button>
          )}
        </div>

        {/* Info cards */}
        {!result && !generatedCalendar && !loading && (
          <div style={{ marginTop:20,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
            {[
              { icon:"📅", t:"Årshjul", d:"12-måneders visuell plan tilpasset din organisasjonstype" },
              { icon:"📋", t:"Agenda", d:"Profesjonell møteplan med tidsrammer og ansvarlige" },
              { icon:"📝", t:"Protokoll", d:"Ferdig styreprotokoll klar for underskrift" },
            ].map(c=>(
              <div key={c.t} style={{ background:G.light,borderRadius:12,padding:"16px",border:`1px solid ${G.accent}33`,textAlign:"center" }}>
                <div style={{ fontSize:"1.4rem",marginBottom:6 }}>{c.icon}</div>
                <div style={{ fontWeight:"700",color:G.dark,fontSize:"0.8rem",fontFamily:"sans-serif",marginBottom:4 }}>{c.t}</div>
                <div style={{ color:G.muted,fontSize:"0.73rem",fontFamily:"sans-serif",lineHeight:1.5 }}>{c.d}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign:"center",marginTop:28,color:"#bbb",fontSize:"0.72rem",fontFamily:"sans-serif" }}>
          Drevet av Org.Los · Frivillig innsats gjort enkelt
        </div>
      </div>
    </div>
  );
}

const lbl = { display:"block",marginBottom:6,fontSize:"0.8rem",color:G.dark,fontFamily:"sans-serif",fontWeight:"600" };

function Label({ children }) {
  return <div style={{ fontSize:"0.7rem",fontFamily:"sans-serif",fontWeight:"700",color:G.accent,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:18 }}>{children}</div>;
}

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
