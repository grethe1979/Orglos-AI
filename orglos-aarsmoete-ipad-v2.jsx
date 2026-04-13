import { useState, useEffect } from "react";

const G = {
  dark: "#1a4a2e", mid: "#2d6e45", soft: "#4a7c5f",
  light: "#e8f0eb", pale: "#f4f8f5", accent: "#7eb897",
  warm: "#fafaf7", text: "#1c2b22", muted: "#6b8c76",
  gold: "#b87d2e", goldLight: "#fdf6e8", goldBorder: "#e8c97a",
  red: "#c0392b", redLight: "#fdf0ef",
  green: "#16a34a", greenLight: "#f0fdf4",
  blue: "#2563a8", blueLight: "#eef4fd",
};

function uid() { return Math.random().toString(36).slice(2, 7); }
function now() { return new Date().toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" }); }

const TYPE_ACCLAMATION = "acclamation";
const TYPE_VOTE = "vote";
const TYPE_ELECTION = "election";
const VS_PENDING = "pending";
const VS_ACCLAMATION_OPEN = "acclamation_open";
const VS_VOTE_OPEN = "vote_open";
const VS_PASSED_ACCLAMATION = "passed_acclamation";
const VS_CLOSED = "closed";

const MEMBERS = [
  { id: "m1", name: "Kari Holm", initials: "KH" },
  { id: "m2", name: "Per Dahl", initials: "PD" },
  { id: "m3", name: "Lise Berg", initials: "LB" },
  { id: "m4", name: "Jonas Øie", initials: "JØ" },
  { id: "m5", name: "Marte Lund", initials: "ML" },
  { id: "m6", name: "Tor Bakke", initials: "TB" },
];

const makeAgenda = () => [
  { id: uid(), nr: 1, title: "Godkjenning av innkalling", description: "Innkallingen ble sendt 14 dager i forveien.", type: TYPE_ACCLAMATION, voteState: VS_PENDING, proposal: "Innkallingen og dagsorden godkjennes.", objections: [], options: [], log: [] },
  { id: uid(), nr: 2, title: "Årsberetning 2024", description: "Styrets årsberetning legges frem til godkjenning.", type: TYPE_ACCLAMATION, voteState: VS_PENDING, proposal: "Årsberetningen for 2024 godkjennes.", objections: [], options: [], log: [] },
  {
    id: uid(), nr: 3, title: "Fastsettelse av kontingent", description: "Styret foreslår økning fra 400 til 450 kr.", type: TYPE_VOTE, voteState: VS_PENDING, proposal: "Kontingenten settes til 450 kr for 2025.", objections: [],
    options: [{ id: uid(), label: "For (450 kr)", votes: [] }, { id: uid(), label: "Mot", votes: [] }, { id: uid(), label: "Avholdende", votes: [] }], log: []
  },
  {
    id: uid(), nr: 4, title: "Valg av styreleder", description: "Valgkomiteen innstiller på kandidater.", type: TYPE_ELECTION, voteState: VS_PENDING, proposal: "", objections: [],
    options: [{ id: uid(), label: "Kari Holm (gjenvalg)", votes: [] }, { id: uid(), label: "Jonas Øie (ny)", votes: [] }], log: []
  },
];

const MODE_SPLIT = "split";    // Side-by-side demo (iPad landscape)
const MODE_ADMIN = "admin";    // Full admin
const MODE_MEMBER = "member";  // Full member

export default function Aarsmoete() {
  const [mode, setMode] = useState(MODE_SPLIT);
  const [activeMemberId, setActiveMemberId] = useState("m2");
  const [agenda, setAgenda] = useState(makeAgenda());
  const [currentSakId, setCurrentSakId] = useState(null);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [speakerList, setSpeakerList] = useState([]);
  const [log, setLog] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [adminTab, setAdminTab] = useState("sak");
  const [memberTab, setMemberTab] = useState("sak");

  const activeMember = MEMBERS.find(m => m.id === activeMemberId);
  const currentSak = agenda.find(s => s.id === currentSakId) || agenda[0];
  const currentIdx = agenda.findIndex(s => s.id === (currentSakId || agenda[0]?.id));

  useEffect(() => { if (!currentSakId && agenda.length) setCurrentSakId(agenda[0].id); }, []);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      const sak = agenda.find(s => s.id === currentSakId);
      if (sak?.objections?.length === 0) passAcclamation(currentSakId);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const addLog = (text) => setLog(l => [{ id: uid(), time: now(), text }, ...l.slice(0, 29)]);
  const updateSak = (id, changes) => setAgenda(a => a.map(s => s.id === id ? { ...s, ...changes } : s));

  const openAcclamation = (sakId) => {
    updateSak(sakId, { voteState: VS_ACCLAMATION_OPEN, objections: [] });
    setCountdown(30);
    const sak = agenda.find(s => s.id === sakId);
    addLog(`👐 Akklamasjon åpnet: ${sak?.title}`);
  };
  const passAcclamation = (sakId) => {
    setCountdown(null);
    const sak = agenda.find(s => s.id === sakId);
    updateSak(sakId, { voteState: VS_PASSED_ACCLAMATION });
    addLog(`✅ Vedtatt ved akklamasjon: ${sak?.title}`);
  };
  const escalateToVote = (sakId) => {
    setCountdown(null);
    const sak = agenda.find(s => s.id === sakId);
    const opts = sak.options?.length > 0 ? sak.options : [
      { id: uid(), label: "For", votes: [] },
      { id: uid(), label: "Mot", votes: [] },
      { id: uid(), label: "Avholdende", votes: [] },
    ];
    updateSak(sakId, { voteState: VS_VOTE_OPEN, options: opts });
    addLog(`⚡ Eskalert til votering: ${sak?.title}`);
  };
  const raiseObjection = (sakId, memberId, reason) => {
    const name = MEMBERS.find(m => m.id === memberId)?.name;
    setAgenda(a => a.map(s => s.id === sakId
      ? { ...s, objections: [...(s.objections || []), { id: uid(), memberId, memberName: name, reason }] }
      : s
    ));
    addLog(`⚠️ Innsigelse fra ${name}: "${reason || 'ingen begrunnelse'}"`);
  };
  const withdrawObjection = (sakId, memberId) => {
    setAgenda(a => a.map(s => s.id === sakId
      ? { ...s, objections: s.objections.filter(o => o.memberId !== memberId) }
      : s
    ));
  };
  const openVote = (sakId) => {
    const sak = agenda.find(s => s.id === sakId);
    updateSak(sakId, { voteState: VS_VOTE_OPEN });
    addLog(`🗳️ Votering åpnet: ${sak?.title}`);
  };
  const castVote = (sakId, optId, memberId) => {
    setAgenda(a => a.map(s => s.id !== sakId ? s : {
      ...s,
      options: s.options.map(o => ({
        ...o,
        votes: o.id === optId
          ? [...o.votes.filter(v => v !== memberId), memberId]
          : o.votes.filter(v => v !== memberId),
      })),
    }));
  };
  const closeVote = (sakId) => {
    const sak = agenda.find(s => s.id === sakId);
    const top = [...(sak.options || [])].sort((a, b) => b.votes.length - a.votes.length)[0];
    updateSak(sakId, { voteState: VS_CLOSED });
    addLog(`🔒 Vedtak: "${top?.label}" (${top?.votes.length} stemmer)`);
  };
  const addOption = (sakId, label) => {
    setAgenda(a => a.map(s => s.id === sakId
      ? { ...s, options: [...(s.options || []), { id: uid(), label, votes: [] }] }
      : s
    ));
    addLog(`Benkeforslag: "${label}"`);
  };

  const hasObjection = (sak) => sak.objections?.some(o => o.memberId === activeMemberId);
  const getMemberVote = (sak) => { for (const o of (sak.options || [])) if (o.votes?.includes(activeMemberId)) return o.id; return null; };
  const totalVotes = (sak) => (sak.options || []).reduce((s, o) => s + (o.votes?.length || 0), 0);
  const isDone = (s) => [VS_PASSED_ACCLAMATION, VS_CLOSED].includes(s.voteState);
  const doneCount = agenda.filter(isDone).length;

  const sharedProps = {
    agenda, currentSak, currentIdx, meetingOpen, countdown, speakerList, log,
    activeMember, activeMemberId, hasObjection: hasObjection(currentSak),
    myVote: getMemberVote(currentSak), totalVotes: totalVotes(currentSak),
    memberCount: MEMBERS.length, doneCount,
    onOpenAcclamation: () => openAcclamation(currentSak.id),
    onPassAcclamation: () => passAcclamation(currentSak.id),
    onEscalate: () => escalateToVote(currentSak.id),
    onOpenVote: () => openVote(currentSak.id),
    onCloseVote: () => closeVote(currentSak.id),
    onAddOption: (l) => addOption(currentSak.id, l),
    onObjection: (r) => raiseObjection(currentSak.id, activeMemberId, r),
    onWithdrawObjection: () => withdrawObjection(currentSak.id, activeMemberId),
    onVote: (optId) => castVote(currentSak.id, optId, activeMemberId),
    onGoTo: (id) => setCurrentSakId(id),
    onStartMeeting: () => { setMeetingOpen(true); addLog("Møtet åpnet"); },
    onAddSpeaker: () => { if (!speakerList.find(s => s.id === activeMemberId)) setSpeakerList(l => [...l, activeMember]); },
    onRemoveSpeaker: (id) => setSpeakerList(l => l.filter(s => s.id !== id)),
    onManualAddSpeaker: (m) => setSpeakerList(l => [...l, m]),
    isInSpeakerList: speakerList.some(s => s.id === activeMemberId),
    speakerPos: speakerList.findIndex(s => s.id === activeMemberId),
  };

  return (
    <div style={{ minHeight: "100vh", background: "#111", fontFamily: "'Georgia','Times New Roman',serif" }}>
      <GS />

      {/* ── TOP BAR ── */}
      <div style={{ background: G.dark, height: 52, padding: "0 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 200 }}>
        <Logo />
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 20, display: "flex", gap: 2, padding: 3 }}>
            {[
              { id: MODE_SPLIT, label: "⬛⬜ Demo" },
              { id: MODE_ADMIN, label: "👑 Leder" },
              { id: MODE_MEMBER, label: "🙋 Deltaker" },
            ].map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} style={{ padding: "5px 12px", borderRadius: 16, border: "none", background: mode === m.id ? "#fff" : "transparent", color: mode === m.id ? G.dark : "rgba(255,255,255,0.6)", fontFamily: "sans-serif", fontSize: "0.72rem", fontWeight: mode === m.id ? "700" : "400", cursor: "pointer", transition: "all 0.15s" }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {(mode === MODE_MEMBER || mode === MODE_SPLIT) && (
          <button onClick={() => setShowMemberPicker(true)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 20, padding: "5px 12px", color: "rgba(255,255,255,0.8)", fontFamily: "sans-serif", fontSize: "0.72rem", cursor: "pointer" }}>
            {activeMember.initials} ▾
          </button>
        )}
      </div>

      {/* Member picker */}
      {showMemberPicker && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowMemberPicker(false)}>
          <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 20px 40px", width: "100%", maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: G.light, margin: "0 auto 16px" }} />
            <div style={{ fontSize: "0.7rem", fontFamily: "sans-serif", fontWeight: "700", color: G.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Du er pålogget som</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {MEMBERS.map(m => (
                <button key={m.id} onClick={() => { setActiveMemberId(m.id); setShowMemberPicker(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", borderRadius: 12, border: `2px solid ${activeMemberId === m.id ? G.dark : G.light}`, background: activeMemberId === m.id ? G.light : "#fff", cursor: "pointer" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: activeMemberId === m.id ? G.dark : G.pale, color: activeMemberId === m.id ? "#fff" : G.muted, fontFamily: "sans-serif", fontWeight: "700", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{m.initials}</div>
                  <span style={{ fontFamily: "sans-serif", fontWeight: "600", fontSize: "0.85rem", color: G.text }}>{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT ── */}
      {mode === MODE_SPLIT ? (
        // SPLITSCREEN
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "calc(100vh - 52px)", overflow: "hidden" }}>
          <div style={{ borderRight: `2px solid rgba(255,255,255,0.08)`, overflowY: "auto", background: "#0e1a14" }}>
            <div style={{ background: "rgba(255,255,255,0.04)", padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontFamily: "sans-serif", fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>👑 Møteleder</span>
            </div>
            <div style={{ padding: "16px" }}>
              <AdminPanel {...sharedProps} tab={adminTab} setTab={setAdminTab} compact />
            </div>
          </div>
          <div style={{ overflowY: "auto", background: G.warm }}>
            <div style={{ background: G.dark, padding: "8px 16px", borderBottom: `1px solid ${G.light}`, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: G.accent }} />
              <span style={{ fontFamily: "sans-serif", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em" }}>🙋 Deltaker — {activeMember.name}</span>
            </div>
            <div style={{ padding: "16px" }}>
              <MemberPanel {...sharedProps} tab={memberTab} setTab={setMemberTab} compact />
            </div>
          </div>
        </div>
      ) : mode === MODE_ADMIN ? (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 0 80px", background: G.warm, minHeight: "calc(100vh - 52px)" }}>
          <div style={{ padding: "16px" }}>
            <AdminPanel {...sharedProps} tab={adminTab} setTab={setAdminTab} />
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 0 80px", background: G.warm, minHeight: "calc(100vh - 52px)" }}>
          <div style={{ padding: "16px" }}>
            <MemberPanel {...sharedProps} tab={memberTab} setTab={setMemberTab} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ agenda, currentSak, currentIdx, meetingOpen, countdown, speakerList, log, totalVotes, memberCount, doneCount, tab, setTab, compact,
  onOpenAcclamation, onPassAcclamation, onEscalate, onOpenVote, onCloseVote, onAddOption, onGoTo, onStartMeeting, onRemoveSpeaker, onManualAddSpeaker }) {

  const [newOption, setNewOption] = useState("");
  const isDone = (s) => [VS_PASSED_ACCLAMATION, VS_CLOSED].includes(s.voteState);

  const tabs = [
    { id: "sak", label: "🗳️ Sak" },
    { id: "dagsorden", label: "📋 Dagsorden" },
    { id: "talere", label: "🎤 Talere" },
    { id: "logg", label: "📝 Logg" },
  ];

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, background: "#fff", borderRadius: 12, padding: 4, border: `1px solid ${G.light}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "none", background: tab === t.id ? G.dark : "transparent", color: tab === t.id ? "#fff" : G.muted, fontFamily: "sans-serif", fontSize: compact ? "0.65rem" : "0.72rem", fontWeight: tab === t.id ? "700" : "400", cursor: "pointer", transition: "all 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Not started */}
      {!meetingOpen && (
        <div style={{ background: G.goldLight, border: `1px solid ${G.goldBorder}`, borderRadius: 12, padding: "14px 16px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontFamily: "sans-serif", fontSize: "0.82rem", color: G.gold, fontWeight: "600" }}>⏳ Møtet er ikke åpnet</span>
          <button onClick={onStartMeeting} style={{ ...btnPrimary, padding: "8px 16px", fontSize: "0.8rem" }}>▶ Åpne møtet</button>
        </div>
      )}

      {/* SAK TAB */}
      {tab === "sak" && (
        <div>
          {/* Nav */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <button onClick={() => currentIdx > 0 && onGoTo(agenda[currentIdx - 1].id)} disabled={currentIdx === 0} style={{ ...btnGhost, opacity: currentIdx === 0 ? 0.3 : 1, padding: "8px 14px", fontSize: "0.8rem" }}>← Forrige</button>
            <span style={{ fontFamily: "sans-serif", fontSize: "0.75rem", color: G.muted }}>Sak {currentSak.nr} av {agenda.length}</span>
            <button onClick={() => currentIdx < agenda.length - 1 && onGoTo(agenda[currentIdx + 1].id)} disabled={currentIdx === agenda.length - 1} style={{ ...btnGhost, opacity: currentIdx === agenda.length - 1 ? 0.3 : 1, padding: "8px 14px", fontSize: "0.8rem" }}>Neste →</button>
          </div>

          {/* Sak card */}
          <div style={crd}>
            <TypeTag type={currentSak.type} />
            <div style={{ fontSize: "1rem", fontWeight: "700", color: G.dark, margin: "8px 0 6px", lineHeight: 1.35 }}>{currentSak.title}</div>
            {currentSak.description && <div style={{ fontFamily: "sans-serif", fontSize: "0.78rem", color: G.muted, lineHeight: 1.6, marginBottom: 8 }}>{currentSak.description}</div>}
            {currentSak.proposal && (
              <div style={{ background: G.pale, borderRadius: 9, padding: "10px 12px", border: `1px solid ${G.light}` }}>
                <div style={{ fontFamily: "sans-serif", fontSize: "0.6rem", color: G.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Forslag til vedtak</div>
                <div style={{ fontFamily: "sans-serif", fontSize: "0.82rem", fontWeight: "600", color: G.text }}>{currentSak.proposal}</div>
              </div>
            )}
          </div>

          {/* ACCLAMATION CONTROLS */}
          {currentSak.type === TYPE_ACCLAMATION && currentSak.voteState === VS_PENDING && (
            <button onClick={onOpenAcclamation} disabled={!meetingOpen} style={{ ...btnPrimary, width: "100%", padding: "16px", fontSize: "0.95rem", opacity: meetingOpen ? 1 : 0.4, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span style={{ fontSize: "1.2rem" }}>👐</span> Start akklamasjon
            </button>
          )}

          {currentSak.voteState === VS_ACCLAMATION_OPEN && (
            <div style={crd}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: countdown > 10 ? G.greenLight : G.goldLight, border: `3px solid ${countdown > 10 ? G.green : G.gold}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "1.3rem", fontWeight: "700", fontFamily: "sans-serif", color: countdown > 10 ? G.green : G.gold }}>{countdown}</span>
                </div>
                <div>
                  <div style={{ fontFamily: "sans-serif", fontWeight: "700", color: G.dark, fontSize: "0.88rem" }}>Innsigelsesvindu åpent</div>
                  <div style={{ fontFamily: "sans-serif", fontSize: "0.72rem", color: G.muted, marginTop: 2 }}>Deltakere kan nå melde innsigelse</div>
                </div>
              </div>
              {currentSak.objections?.length > 0 && (
                <div style={{ background: G.redLight, borderRadius: 9, padding: "10px 12px", marginBottom: 12, border: `1px solid ${G.red}22` }}>
                  <div style={{ fontFamily: "sans-serif", fontWeight: "700", fontSize: "0.78rem", color: G.red, marginBottom: 6 }}>⚠️ {currentSak.objections.length} innsigelse(r)</div>
                  {currentSak.objections.map(o => (
                    <div key={o.id} style={{ fontFamily: "sans-serif", fontSize: "0.75rem", color: G.text, marginBottom: 3 }}><strong>{o.memberName}:</strong> {o.reason || "ingen begrunnelse"}</div>
                  ))}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button onClick={onPassAcclamation} style={{ ...btnPrimary, background: G.green, padding: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <span>✅</span> Vedtatt
                </button>
                <button onClick={onEscalate} style={{ ...btnPrimary, background: G.red, padding: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <span>⚡</span> Til votering
                </button>
              </div>
            </div>
          )}

          {currentSak.voteState === VS_PASSED_ACCLAMATION && (
            <div style={{ ...crd, background: G.greenLight, border: `2px solid ${G.green}44`, textAlign: "center" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: 6 }}>✅</div>
              <div style={{ fontFamily: "sans-serif", fontWeight: "700", color: G.green }}>Vedtatt ved akklamasjon</div>
            </div>
          )}

          {/* VOTE PANEL */}
          {[TYPE_VOTE, TYPE_ELECTION].includes(currentSak.type) || [VS_VOTE_OPEN, VS_CLOSED].includes(currentSak.voteState) ? (
            <div style={crd}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontFamily: "sans-serif", fontWeight: "700", color: G.dark, fontSize: "0.85rem" }}>Stemmealternativer</div>
                <div style={{ fontFamily: "sans-serif", fontSize: "0.72rem", color: G.muted }}>{totalVotes}/{memberCount} stemt</div>
              </div>
              {(currentSak.options || []).map((opt, i) => {
                const tot = Math.max(totalVotes, 1);
                const pct = Math.round((opt.votes.length / tot) * 100);
                const leading = currentSak.voteState === VS_CLOSED && opt.votes.length === Math.max(...currentSak.options.map(o => o.votes.length)) && opt.votes.length > 0;
                return (
                  <div key={opt.id} style={{ marginBottom: 10, padding: "10px 12px", borderRadius: 9, background: leading ? G.greenLight : G.pale, border: `1px solid ${leading ? G.green + "44" : G.light}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "sans-serif", fontSize: "0.82rem", fontWeight: "600", color: G.text, marginBottom: currentSak.voteState !== VS_PENDING ? 6 : 0 }}>
                      <span>{leading ? "★ " : ""}{opt.label}</span>
                      {currentSak.voteState !== VS_PENDING && <span style={{ color: G.muted }}>{opt.votes.length}</span>}
                    </div>
                    {currentSak.voteState !== VS_PENDING && (
                      <div style={{ height: 5, borderRadius: 3, background: G.light }}>
                        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: leading ? G.green : G.accent, transition: "width 0.5s ease" }} />
                      </div>
                    )}
                  </div>
                );
              })}
              {currentSak.voteState !== VS_CLOSED && (
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input value={newOption} onChange={e => setNewOption(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newOption.trim()) { onAddOption(newOption.trim()); setNewOption(""); } }} placeholder={currentSak.voteState === VS_VOTE_OPEN ? "⚡ Benkeforslag…" : "Legg til alternativ…"} style={{ flex: 1, padding: "9px 12px", border: `1.5px solid ${G.light}`, borderRadius: 9, fontFamily: "sans-serif", fontSize: "0.82rem", background: "#fff", outline: "none" }} />
                  <button onClick={() => { if (newOption.trim()) { onAddOption(newOption.trim()); setNewOption(""); } }} style={{ ...btnSmall, opacity: newOption.trim() ? 1 : 0.4 }}>+</button>
                </div>
              )}
              <div style={{ marginTop: 12 }}>
                {currentSak.voteState === VS_PENDING && (
                  <button onClick={onOpenVote} disabled={!meetingOpen || (currentSak.options || []).length < 2} style={{ ...btnPrimary, width: "100%", padding: "13px", opacity: meetingOpen && (currentSak.options || []).length >= 2 ? 1 : 0.4 }}>🗳️ Åpne votering</button>
                )}
                {currentSak.voteState === VS_VOTE_OPEN && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: G.greenLight, borderRadius: 9, padding: "9px 12px", marginBottom: 10, border: `1px solid ${G.green}44` }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: G.green, animation: "pulse 1.2s infinite" }} />
                      <span style={{ fontFamily: "sans-serif", fontSize: "0.8rem", color: G.green, fontWeight: "700" }}>{totalVotes} av {memberCount} stemt</span>
                    </div>
                    <button onClick={onCloseVote} style={{ ...btnPrimary, width: "100%", background: G.red, padding: "13px" }}>🔒 Lukk og tell opp</button>
                  </div>
                )}
                {currentSak.voteState === VS_CLOSED && (
                  <ResultCard sak={currentSak} />
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* DAGSORDEN TAB */}
      {tab === "dagsorden" && (
        <div>
          {agenda.map(sak => (
            <button key={sak.id} onClick={() => { onGoTo(sak.id); setTab("sak"); }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px", borderRadius: 12, marginBottom: 8, border: `2px solid ${sak.id === currentSak.id ? G.dark : G.light}`, background: sak.id === currentSak.id ? G.pale : "#fff", cursor: "pointer", textAlign: "left" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: isDone(sak) ? G.green : sak.id === currentSak.id ? G.dark : G.light, color: isDone(sak) || sak.id === currentSak.id ? "#fff" : G.muted, fontFamily: "sans-serif", fontWeight: "700", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {isDone(sak) ? "✓" : sak.nr}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "sans-serif", fontWeight: "600", fontSize: "0.85rem", color: G.text }}>{sak.title}</div>
                <div style={{ marginTop: 4 }}><TypeTag type={sak.type} mini /></div>
              </div>
              {sak.voteState === VS_ACCLAMATION_OPEN && <div style={{ width: 8, height: 8, borderRadius: "50%", background: G.gold }} />}
              {sak.voteState === VS_VOTE_OPEN && <div style={{ width: 8, height: 8, borderRadius: "50%", background: G.green }} />}
            </button>
          ))}
        </div>
      )}

      {/* TALERE TAB */}
      {tab === "talere" && (
        <div>
          {speakerList.length === 0
            ? <EmptyState icon="🎤" text="Ingen i talelisten" />
            : speakerList.map((sp, i) => (
              <div key={sp.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px", borderRadius: 12, marginBottom: 8, background: i === 0 ? G.light : "#fff", border: `1px solid ${i === 0 ? G.accent : G.light}` }}>
                <InitialsCircle m={sp} active={i === 0} />
                <div style={{ flex: 1, fontFamily: "sans-serif", fontWeight: "600", fontSize: "0.88rem", color: G.text }}>{sp.name}{i === 0 && <span style={{ color: G.accent, fontWeight: "700" }}> — har ordet</span>}</div>
                <button onClick={() => onRemoveSpeaker(sp.id)} style={{ background: "transparent", border: `1px solid ${G.light}`, borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontFamily: "sans-serif", color: G.muted, fontSize: "0.9rem" }}>×</button>
              </div>
            ))
          }
          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: "sans-serif", fontSize: "0.68rem", color: G.accent, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Legg til taler</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {MEMBERS.filter(m => !speakerList.find(s => s.id === m.id)).map(m => (
                <button key={m.id} onClick={() => onManualAddSpeaker(m)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px", borderRadius: 10, border: `1px solid ${G.light}`, background: "#fff", cursor: "pointer" }}>
                  <InitialsCircle m={m} small />
                  <span style={{ fontFamily: "sans-serif", fontSize: "0.78rem", color: G.text, fontWeight: "600" }}>{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LOGG TAB */}
      {tab === "logg" && (
        <div>
          {log.length === 0
            ? <EmptyState icon="📋" text="Ingen hendelser ennå" />
            : log.map(e => (
              <div key={e.id} style={{ padding: "10px 14px", borderRadius: 9, marginBottom: 8, background: "#fff", border: `1px solid ${G.light}`, display: "flex", gap: 10 }}>
                <span style={{ fontFamily: "sans-serif", fontSize: "0.68rem", color: G.muted, flexShrink: 0, marginTop: 1 }}>{e.time}</span>
                <span style={{ fontFamily: "sans-serif", fontSize: "0.78rem", color: G.text }}>{e.text}</span>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ─── MEMBER PANEL ─────────────────────────────────────────────────────────────
function MemberPanel({ agenda, currentSak, meetingOpen, hasObjection, myVote, speakerList, activeMember, doneCount, tab, setTab, compact,
  onObjection, onWithdrawObjection, onVote, onAddSpeaker, isInSpeakerList, speakerPos }) {

  const [objText, setObjText] = useState("");
  const [showObjInput, setShowObjInput] = useState(false);
  const isDone = (s) => [VS_PASSED_ACCLAMATION, VS_CLOSED].includes(s.voteState);

  const tabs = [
    { id: "sak", label: "🗳️ Sak" },
    { id: "status", label: "📊 Status" },
    { id: "talere", label: "🎤 Talere" },
  ];

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, background: G.pale, borderRadius: 12, padding: 4, border: `1px solid ${G.light}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "none", background: tab === t.id ? G.dark : "transparent", color: tab === t.id ? "#fff" : G.muted, fontFamily: "sans-serif", fontSize: compact ? "0.65rem" : "0.72rem", fontWeight: tab === t.id ? "700" : "400", cursor: "pointer", transition: "all 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* SAK TAB */}
      {tab === "sak" && (
        <div>
          {/* Identity bar */}
          <div style={{ background: G.dark, borderRadius: 12, padding: "12px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <InitialsCircle m={activeMember} white />
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontFamily: "sans-serif", fontWeight: "700", fontSize: "0.85rem" }}>{activeMember.name}</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontFamily: "sans-serif", fontSize: "0.68rem" }}>Stemmeberettiget</div>
            </div>
            <div style={{ fontFamily: "sans-serif", fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>{doneCount}/{agenda.length} saker</div>
          </div>

          {/* Sak info */}
          <div style={crd}>
            <TypeTag type={currentSak.type} />
            <div style={{ fontSize: "0.98rem", fontWeight: "700", color: G.dark, margin: "8px 0 6px", lineHeight: 1.35 }}>{currentSak.title}</div>
            {currentSak.description && <div style={{ fontFamily: "sans-serif", fontSize: "0.78rem", color: G.muted, lineHeight: 1.6, marginBottom: 8 }}>{currentSak.description}</div>}
            {currentSak.proposal && (
              <div style={{ background: G.pale, borderRadius: 9, padding: "10px 12px", border: `1px solid ${G.light}` }}>
                <div style={{ fontFamily: "sans-serif", fontSize: "0.6rem", color: G.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Forslag til vedtak</div>
                <div style={{ fontFamily: "sans-serif", fontSize: "0.82rem", fontWeight: "600", color: G.text }}>{currentSak.proposal}</div>
              </div>
            )}
          </div>

          {/* ── STATE-BASED CONTENT ── */}

          {/* Waiting */}
          {!meetingOpen && (
            <div style={{ ...crd, textAlign: "center", padding: "24px 16px" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>⏳</div>
              <div style={{ fontFamily: "sans-serif", fontWeight: "700", color: G.muted, fontSize: "0.88rem" }}>Venter på at møteleder åpner møtet</div>
            </div>
          )}

          {meetingOpen && currentSak.voteState === VS_PENDING && (
            <div style={{ ...crd, background: G.pale }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: G.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>⏳</div>
                <div>
                  <div style={{ fontFamily: "sans-serif", fontWeight: "700", color: G.dark, fontSize: "0.85rem" }}>Venter på møteleder</div>
                  <div style={{ fontFamily: "sans-serif", fontSize: "0.72rem", color: G.muted, marginTop: 2 }}>Du vil se knapper her når møteleder åpner saken</div>
                </div>
              </div>
            </div>
          )}

          {/* ── AKKLAMASJON ÅPEN — HOVEDDELEN ── */}
          {meetingOpen && currentSak.voteState === VS_ACCLAMATION_OPEN && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              {/* Big status banner */}
              <div style={{ background: G.goldLight, border: `2px solid ${G.goldBorder}`, borderRadius: 14, padding: "16px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: G.gold, animation: "pulse 1s infinite" }} />
                  <div style={{ fontFamily: "sans-serif", fontWeight: "700", color: G.gold, fontSize: "0.9rem" }}>Akklamasjon pågår nå!</div>
                </div>
                <div style={{ fontFamily: "sans-serif", fontSize: "0.78rem", color: "#7a5a20", lineHeight: 1.6 }}>
                  Møteleder spør om noen har innsigelser til forslaget. Si fra her hvis du er uenig.
                </div>
              </div>

              {!hasObjection ? (
                <div>
                  <div style={{ fontFamily: "sans-serif", fontWeight: "700", color: G.dark, fontSize: "0.9rem", marginBottom: 14, textAlign: "center" }}>
                    Har du innsigelser til dette forslaget?
                  </div>

                  {!showObjInput ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                      {/* No objection — passive, just visual */}
                      <div style={{ padding: "20px 14px", borderRadius: 14, background: G.greenLight, border: `2px solid ${G.green}44`, textAlign: "center" }}>
                        <div style={{ fontSize: "2rem", marginBottom: 6 }}>👍</div>
                        <div style={{ fontFamily: "sans-serif", fontWeight: "700", color: G.green, fontSize: "0.82rem" }}>Ingen innsigelse</div>
                        <div style={{ fontFamily: "sans-serif", fontSize: "0.68rem", color: G.muted, marginTop: 4, lineHeight: 1.4 }}>Gjør ingenting — forslaget vedtas automatisk</div>
                      </div>

                      {/* Raise objection */}
                      <button onClick={() => setShowObjInput(true)} style={{ padding: "20px 14px", borderRadius: 14, background: G.redLight, border: `2px solid ${G.red}33`, textAlign: "center", cursor: "pointer" }}>
                        <div style={{ fontSize: "2rem", marginBottom: 6 }}>✋</div>
                        <div style={{ fontFamily: "sans-serif", fontWeight: "700", color: G.red, fontSize: "0.82rem" }}>Meld innsigelse</div>
                        <div style={{ fontFamily: "sans-serif", fontSize: "0.68rem", color: G.muted, marginTop: 4, lineHeight: 1.4 }}>Trykk her for å protestere</div>
                      </button>
                    </div>
                  ) : (
                    <div style={crd}>
                      <div style={{ fontFamily: "sans-serif", fontWeight: "700", color: G.red, fontSize: "0.88rem", marginBottom: 10 }}>✋ Meld innsigelse</div>
                      <textarea
                        value={objText}
                        onChange={e => setObjText(e.target.value)}
                        placeholder="Forklar din innsigelse kort (valgfritt)…"
                        autoFocus
                        rows={3}
                        style={{ width: "100%", padding: "10px 12px", border: `2px solid ${G.red}44`, borderRadius: 10, fontFamily: "sans-serif", fontSize: "0.85rem", resize: "none", outline: "none", boxSizing: "border-box", marginBottom: 10, background: G.redLight }}
                      />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <button onClick={() => { onObjection(objText); setObjText(""); setShowObjInput(false); }} style={{ ...btnPrimary, background: G.red, padding: "13px", fontSize: "0.88rem" }}>
                          ✋ Send innsigelse
                        </button>
                        <button onClick={() => { setShowObjInput(false); setObjText(""); }} style={{ ...btnGhost, padding: "13px", fontSize: "0.88rem" }}>
                          Avbryt
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ ...crd, background: G.redLight, border: `2px solid ${G.red}33` }}>
                  <div style={{ fontFamily: "sans-serif", fontWeight: "700", color: G.red, marginBottom: 10, fontSize: "0.9rem" }}>
                    ✋ Du har meldt innsigelse
                  </div>
                  <div style={{ fontFamily: "sans-serif", fontSize: "0.78rem", color: G.muted, marginBottom: 12 }}>
                    Møteleder er varslet. Saken vil trolig gå til formell votering.
                  </div>
                  <button onClick={onWithdrawObjection} style={{ ...btnGhost, fontSize: "0.78rem", padding: "8px 14px" }}>
                    Trekk tilbake innsigelse
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Passed acclamation */}
          {currentSak.voteState === VS_PASSED_ACCLAMATION && (
            <div style={{ ...crd, background: G.greenLight, border: `2px solid ${G.green}44`, textAlign: "center", padding: "24px" }}>
              <div style={{ fontSize: "2.2rem", marginBottom: 8 }}>✅</div>
              <div style={{ fontFamily: "sans-serif", fontWeight: "700", color: G.green, fontSize: "1rem" }}>Vedtatt ved akklamasjon</div>
              <div style={{ fontFamily: "sans-serif", fontSize: "0.75rem", color: G.muted, marginTop: 6, lineHeight: 1.6 }}>{currentSak.proposal}</div>
            </div>
          )}

          {/* Formal vote */}
          {currentSak.voteState === VS_VOTE_OPEN && (
            <div style={crd}>
              {!myVote ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: G.greenLight, borderRadius: 10, padding: "10px 12px", marginBottom: 14, border: `1px solid ${G.green}44` }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: G.green, animation: "pulse 1.2s infinite" }} />
                    <span style={{ fontFamily: "sans-serif", fontSize: "0.82rem", color: G.green, fontWeight: "700" }}>Votering åpen — stem nå!</span>
                  </div>
                  {(currentSak.options || []).map(opt => (
                    <button key={opt.id} onClick={() => onVote(opt.id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "16px 14px", borderRadius: 12, marginBottom: 8, border: `2px solid ${G.light}`, background: G.pale, cursor: "pointer", textAlign: "left" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${G.accent}`, flexShrink: 0 }} />
                      <span style={{ fontFamily: "sans-serif", fontWeight: "700", fontSize: "0.9rem", color: G.text }}>{opt.label}</span>
                    </button>
                  ))}
                  <div style={{ fontFamily: "sans-serif", fontSize: "0.68rem", color: G.muted, textAlign: "center", marginTop: 8 }}>🔒 Hemmelig stemmegivning</div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "18px 0" }}>
                  <div style={{ fontSize: "2.2rem", marginBottom: 8 }}>✅</div>
                  <div style={{ fontFamily: "sans-serif", fontWeight: "700", color: G.green, fontSize: "0.95rem" }}>Stemme registrert!</div>
                  <div style={{ fontFamily: "sans-serif", fontSize: "0.75rem", color: G.muted, marginTop: 6 }}>Venter på at møteleder lukker votering…</div>
                </div>
              )}
            </div>
          )}

          {currentSak.voteState === VS_CLOSED && (
            <div style={crd}><ResultCard sak={currentSak} /></div>
          )}

          {/* Speaker list button */}
          <div style={{ ...crd, marginTop: 6 }}>
            <div style={{ fontFamily: "sans-serif", fontSize: "0.68rem", fontWeight: "700", color: G.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Taleliste</div>
            {!isInSpeakerList
              ? <button onClick={onAddSpeaker} style={{ ...btnPrimary, width: "100%", padding: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span>🙋</span> Tegn meg til talelisten
                </button>
              : <div style={{ background: G.light, borderRadius: 10, padding: "10px 14px", fontFamily: "sans-serif", fontSize: "0.82rem", color: G.dark, fontWeight: "600", textAlign: "center" }}>
                  ✓ Du er på plass {speakerPos + 1} i talelisten
                </div>
            }
          </div>
        </div>
      )}

      {/* STATUS TAB */}
      {tab === "status" && (
        <div>
          <div style={{ fontFamily: "sans-serif", fontSize: "0.68rem", fontWeight: "700", color: G.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Alle saker</div>
          {agenda.map(sak => (
            <div key={sak.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, marginBottom: 8, background: sak.id === currentSak.id ? G.light : "#fff", border: `1px solid ${sak.id === currentSak.id ? G.accent : G.light}` }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: isDone(sak) ? G.green : sak.id === currentSak.id ? G.dark : G.light, color: isDone(sak) || sak.id === currentSak.id ? "#fff" : G.muted, fontFamily: "sans-serif", fontWeight: "700", fontSize: "0.72rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {isDone(sak) ? "✓" : sak.nr}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "sans-serif", fontWeight: "600", fontSize: "0.82rem", color: G.text }}>{sak.title}</div>
                <div style={{ fontFamily: "sans-serif", fontSize: "0.68rem", color: G.muted, marginTop: 2 }}>
                  {isDone(sak) ? "✅ Ferdig" : sak.id === currentSak.id ? "▶ Behandles nå" : "Venter"}
                </div>
              </div>
              {sak.voteState === VS_ACCLAMATION_OPEN && <div style={{ width: 8, height: 8, borderRadius: "50%", background: G.gold, animation: "pulse 1s infinite" }} />}
              {sak.voteState === VS_VOTE_OPEN && <div style={{ width: 8, height: 8, borderRadius: "50%", background: G.green, animation: "pulse 1s infinite" }} />}
            </div>
          ))}
        </div>
      )}

      {/* TALERE TAB */}
      {tab === "talere" && (
        <div>
          {speakerList.length === 0
            ? <EmptyState icon="🎤" text="Ingen i talelisten ennå" />
            : speakerList.map((sp, i) => (
              <div key={sp.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px", borderRadius: 12, marginBottom: 8, background: i === 0 ? G.light : "#fff", border: `1px solid ${i === 0 ? G.accent : G.light}` }}>
                <InitialsCircle m={sp} active={i === 0} />
                <div style={{ flex: 1, fontFamily: "sans-serif", fontWeight: "600", fontSize: "0.85rem", color: G.text }}>{sp.name}{i === 0 && <span style={{ color: G.accent }}> — har ordet</span>}</div>
              </div>
            ))
          }
          {!isInSpeakerList && (
            <button onClick={onAddSpeaker} style={{ ...btnPrimary, width: "100%", marginTop: 12, padding: "13px" }}>🙋 Tegn meg til talelisten</button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── RESULT CARD ──────────────────────────────────────────────────────────────
function ResultCard({ sak }) {
  const sorted = [...(sak.options || [])].sort((a, b) => b.votes.length - a.votes.length);
  const total = sorted.reduce((s, o) => s + o.votes.length, 0);
  return (
    <div style={{ background: G.greenLight, border: `1px solid ${G.green}44`, borderRadius: 12, padding: 16 }}>
      <div style={{ fontFamily: "sans-serif", fontWeight: "700", color: G.dark, marginBottom: 12, fontSize: "0.9rem" }}>
        {sak.type === TYPE_ELECTION ? `🏅 Valgt: ${sorted[0]?.label}` : `✅ Vedtak: ${sorted[0]?.label}`}
      </div>
      {sorted.map((opt, i) => {
        const pct = total > 0 ? Math.round((opt.votes.length / total) * 100) : 0;
        return (
          <div key={opt.id} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "sans-serif", fontSize: "0.78rem", fontWeight: i === 0 ? "700" : "400", color: i === 0 ? G.dark : G.muted, marginBottom: 4 }}>
              <span>{opt.label}</span><span>{opt.votes.length} ({pct}%)</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: G.light }}>
              <div style={{ width: `${pct}%`, height: "100%", background: i === 0 ? G.green : G.accent, borderRadius: 3, transition: "width 0.5s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SHARED ───────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <span style={{ color: "#fff", fontWeight: "700", fontSize: "0.9rem", letterSpacing: "0.08em", fontFamily: "sans-serif" }}>ORGLOS</span>
    </div>
  );
}

function TypeTag({ type, mini }) {
  const map = {
    [TYPE_ACCLAMATION]: { label: "👐 Akklamasjon", color: G.green },
    [TYPE_VOTE]: { label: "🗳️ Votering", color: G.blue },
    [TYPE_ELECTION]: { label: "🏅 Valg", color: G.gold },
  };
  const t = map[type] || { label: "💬 Diskusjon", color: G.muted };
  return <span style={{ display: "inline-block", background: t.color + "18", borderRadius: 20, padding: mini ? "2px 8px" : "3px 10px", fontSize: mini ? "0.62rem" : "0.7rem", fontFamily: "sans-serif", color: t.color, fontWeight: "700" }}>{t.label}</span>;
}

function InitialsCircle({ m, active, white, small }) {
  const size = small ? 28 : 36;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: white ? "rgba(255,255,255,0.15)" : active ? G.dark : G.pale, color: white || active ? "#fff" : G.muted, fontFamily: "sans-serif", fontWeight: "700", fontSize: small ? "0.6rem" : "0.72rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {m.initials}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return <div style={{ textAlign: "center", padding: "32px 20px", color: G.muted, fontFamily: "sans-serif", fontSize: "0.85rem" }}><div style={{ fontSize: "1.8rem", marginBottom: 8 }}>{icon}</div>{text}</div>;
}

function GS() {
  return <style>{`
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
    input:focus,textarea:focus{outline:none;border-color:${G.mid}!important;}
    button{-webkit-appearance:none;transition:all 0.15s;}
    button:active{transform:scale(0.97);}
  `}</style>;
}

const crd = { background: "#fff", borderRadius: 14, padding: "14px 14px", border: `1px solid ${G.light}`, marginBottom: 12, boxShadow: "0 1px 6px rgba(26,74,46,0.04)" };
const btnPrimary = { background: G.dark, color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", fontFamily: "sans-serif", fontWeight: "700", fontSize: "0.88rem", cursor: "pointer" };
const btnGhost = { background: "transparent", color: G.dark, border: `1.5px solid ${G.light}`, borderRadius: 12, padding: "10px 16px", fontFamily: "sans-serif", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" };
const btnSmall = { background: G.dark, color: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", fontFamily: "sans-serif", fontWeight: "700", fontSize: "0.8rem", cursor: "pointer" };
