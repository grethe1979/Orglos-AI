import { useState } from "react";

const ORGLOS_GREEN = "#1a4a2e";
const ORGLOS_LIGHT = "#e8f0eb";
const ORGLOS_MID = "#4a7c5f";
const ORGLOS_ACCENT = "#2d6e45";

const fundingSources = [
  "Norsk Tipping – Grasrotandelen",
  "Norsk Tipping – Lokale aktivitetsmidler (LAM)",
  "Kulturdepartementet",
  "Kommunale tilskudd",
  "Sparebankstiftelsen",
  "Extrastiftelsen (helse og rehabilitering)",
  "Frifond",
  "NIF / Særforbund",
  "Annet / vet ikke",
];

const steps = [
  { id: 1, label: "Om organisasjonen" },
  { id: 2, label: "Prosjektet" },
  { id: 3, label: "Tilskuddsordning" },
  { id: 4, label: "Generer søknad" },
];

export default function OrgLosSoknad() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    orgName: "",
    orgType: "",
    memberCount: "",
    location: "",
    description: "",
    projectName: "",
    projectGoal: "",
    targetGroup: "",
    budget: "",
    timeline: "",
    fundingSource: "",
    previousGrants: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const generateApplication = async () => {
    setLoading(true);
    setResult("");
    const prompt = `Du er en ekspert på å skrive støttesøknader for norske frivillige organisasjoner. Skriv en profesjonell og overbevisende støttesøknad på norsk basert på følgende informasjon:

ORGANISASJON:
- Navn: ${form.orgName}
- Type: ${form.orgType}
- Antall medlemmer: ${form.memberCount}
- Lokasjon: ${form.location}
- Kort beskrivelse: ${form.description}

PROSJEKT:
- Prosjektnavn: ${form.projectName}
- Mål: ${form.projectGoal}
- Målgruppe: ${form.targetGroup}
- Budsjett: ${form.budget} kr
- Tidsplan: ${form.timeline}

TILSKUDDSORDNING: ${form.fundingSource}
TIDLIGERE TILSKUDD: ${form.previousGrants || "Ingen oppgitt"}

Skriv en komplett søknad med:
1. Innledning om organisasjonen
2. Prosjektbeskrivelse med klare mål
3. Målgruppe og samfunnsnytte
4. Budsjett og finansieringsplan
5. Avslutning med sterk begrunnelse

Søknaden skal være varm, engasjert og profesjonell. Fremhev frivillighetens verdi og lokale forankring.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      const text = data.content?.map((b) => b.text || "").join("\n") || "Noe gikk galt. Prøv igjen.";
      setResult(text);
    } catch (e) {
      setResult("Kunne ikke generere søknad. Sjekk tilkoblingen og prøv igjen.");
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canProceed = () => {
    if (step === 1) return form.orgName && form.orgType && form.location;
    if (step === 2) return form.projectName && form.projectGoal && form.budget;
    if (step === 3) return form.fundingSource;
    return true;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${ORGLOS_LIGHT} 0%, #f5f9f6 60%, #e0ece4 100%)`,
      fontFamily: "'Georgia', 'Times New Roman', serif",
      padding: "0",
    }}>
      {/* Header */}
      <div style={{
        background: ORGLOS_GREEN,
        padding: "18px 32px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        boxShadow: "0 2px 16px rgba(26,74,46,0.18)",
      }}>
        {/* Logo mark */}
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "2.5px solid #fff",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 10l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div style={{ color: "#fff", fontWeight: "700", fontSize: "1.2rem", letterSpacing: "0.08em" }}>ORGLOS</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.7rem", letterSpacing: "0.06em" }}>Frivillig innsats gjort enkelt</div>
        </div>
        <div style={{ marginLeft: "auto", color: "rgba(255,255,255,0.75)", fontSize: "0.8rem", fontFamily: "sans-serif" }}>
          Støttesøknad-assistent
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px 60px" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{
            color: ORGLOS_GREEN, fontSize: "1.9rem", fontWeight: "700",
            margin: "0 0 8px", letterSpacing: "-0.02em",
          }}>
            Skriv støttesøknad med AI
          </h1>
          <p style={{ color: ORGLOS_MID, fontSize: "1rem", margin: 0, fontFamily: "sans-serif" }}>
            Fyll inn informasjon om laget ditt, så skriver vi søknaden for deg
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 0, marginBottom: 36, background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 8px rgba(26,74,46,0.1)" }}>
          {steps.map((s, i) => (
            <div key={s.id} style={{
              flex: 1, padding: "12px 8px", textAlign: "center",
              background: step === s.id ? ORGLOS_GREEN : step > s.id ? ORGLOS_MID : "#fff",
              color: step >= s.id ? "#fff" : "#999",
              fontSize: "0.72rem", fontFamily: "sans-serif", fontWeight: step === s.id ? "700" : "400",
              borderRight: i < steps.length - 1 ? "1px solid #e8f0eb" : "none",
              transition: "background 0.3s",
              cursor: step > s.id ? "pointer" : "default",
            }} onClick={() => step > s.id && setStep(s.id)}>
              <div style={{ fontSize: "1rem", marginBottom: 2 }}>
                {step > s.id ? "✓" : s.id}
              </div>
              {s.label}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: "#fff", borderRadius: 16, padding: "32px",
          boxShadow: "0 4px 24px rgba(26,74,46,0.10)",
          border: `1px solid ${ORGLOS_LIGHT}`,
        }}>

          {/* Step 1 */}
          {step === 1 && (
            <div>
              <h2 style={headingStyle}>Om organisasjonen</h2>
              <Field label="Organisasjonens navn *" value={form.orgName} onChange={v => update("orgName", v)} placeholder="f.eks. Våler IL" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Type organisasjon *" value={form.orgType} onChange={v => update("orgType", v)} placeholder="f.eks. Idrettslag" />
                <Field label="Antall medlemmer" value={form.memberCount} onChange={v => update("memberCount", v)} placeholder="f.eks. 350" />
              </div>
              <Field label="Kommune / sted *" value={form.location} onChange={v => update("location", v)} placeholder="f.eks. Våler, Viken" />
              <Field label="Kort beskrivelse av organisasjonen" value={form.description} onChange={v => update("description", v)} placeholder="Hva driver dere med? Hva er deres formål?" multiline />
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <h2 style={headingStyle}>Om prosjektet</h2>
              <Field label="Prosjektnavn *" value={form.projectName} onChange={v => update("projectName", v)} placeholder="f.eks. Nytt klubbhus for ungdomsavdelingen" />
              <Field label="Hva er målet med prosjektet? *" value={form.projectGoal} onChange={v => update("projectGoal", v)} placeholder="Beskriv hva dere ønsker å oppnå..." multiline />
              <Field label="Hvem er målgruppen?" value={form.targetGroup} onChange={v => update("targetGroup", v)} placeholder="f.eks. Barn og unge 6–16 år i lokalmiljøet" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Søknadsbeløp (kr) *" value={form.budget} onChange={v => update("budget", v)} placeholder="f.eks. 50000" />
                <Field label="Tidsplan" value={form.timeline} onChange={v => update("timeline", v)} placeholder="f.eks. Januar–juni 2025" />
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <h2 style={headingStyle}>Tilskuddsordning</h2>
              <p style={{ color: "#666", fontSize: "0.9rem", fontFamily: "sans-serif", marginBottom: 20 }}>
                Hvilken ordning søker dere?
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                {fundingSources.map(f => (
                  <div key={f} onClick={() => update("fundingSource", f)} style={{
                    padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                    border: `2px solid ${form.fundingSource === f ? ORGLOS_GREEN : "#e8f0eb"}`,
                    background: form.fundingSource === f ? ORGLOS_LIGHT : "#fafafa",
                    color: form.fundingSource === f ? ORGLOS_GREEN : "#444",
                    fontSize: "0.82rem", fontFamily: "sans-serif", fontWeight: form.fundingSource === f ? "600" : "400",
                    transition: "all 0.2s",
                  }}>
                    {form.fundingSource === f && <span style={{ marginRight: 6 }}>✓</span>}
                    {f}
                  </div>
                ))}
              </div>
              <Field label="Har dere fått tilskudd fra denne ordningen tidligere?" value={form.previousGrants} onChange={v => update("previousGrants", v)} placeholder="f.eks. Ja, 30 000 kr i 2023 til utstyrskjøp" multiline />
            </div>
          )}

          {/* Step 4 – Generate */}
          {step === 4 && (
            <div>
              <h2 style={headingStyle}>Din støttesøknad</h2>
              {!result && !loading && (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: "3rem", marginBottom: 16 }}>📝</div>
                  <p style={{ color: "#666", fontFamily: "sans-serif", marginBottom: 24 }}>
                    Klar til å generere søknad for <strong>{form.orgName}</strong> til <strong>{form.fundingSource}</strong>
                  </p>
                  <button onClick={generateApplication} style={primaryBtn}>
                    Generer søknad med AI
                  </button>
                </div>
              )}
              {loading && (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    border: `4px solid ${ORGLOS_LIGHT}`,
                    borderTop: `4px solid ${ORGLOS_GREEN}`,
                    margin: "0 auto 20px",
                    animation: "spin 0.9s linear infinite",
                  }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <p style={{ color: ORGLOS_MID, fontFamily: "sans-serif" }}>Skriver søknaden din...</p>
                </div>
              )}
              {result && (
                <div>
                  <div style={{
                    background: ORGLOS_LIGHT, borderRadius: 12, padding: "24px",
                    whiteSpace: "pre-wrap", fontFamily: "sans-serif", fontSize: "0.88rem",
                    lineHeight: 1.7, color: "#2a2a2a", maxHeight: 420, overflowY: "auto",
                    border: `1px solid ${ORGLOS_MID}22`,
                  }}>
                    {result}
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <button onClick={handleCopy} style={primaryBtn}>
                      {copied ? "✓ Kopiert!" : "Kopier søknaden"}
                    </button>
                    <button onClick={() => { setResult(""); setStep(1); setForm({ orgName:"",orgType:"",memberCount:"",location:"",description:"",projectName:"",projectGoal:"",targetGroup:"",budget:"",timeline:"",fundingSource:"",previousGrants:"" }); }} style={secondaryBtn}>
                      Ny søknad
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          {step < 4 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
              {step > 1
                ? <button onClick={() => setStep(s => s - 1)} style={secondaryBtn}>← Tilbake</button>
                : <div />}
              <button
                onClick={() => step === 3 ? setStep(4) : setStep(s => s + 1)}
                disabled={!canProceed()}
                style={{ ...primaryBtn, opacity: canProceed() ? 1 : 0.45, cursor: canProceed() ? "pointer" : "not-allowed" }}
              >
                {step === 3 ? "Generer søknad →" : "Neste →"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 32, color: "#aaa", fontSize: "0.75rem", fontFamily: "sans-serif" }}>
          Drevet av Org.Los · Frivillig innsats gjort enkelt
        </div>
      </div>
    </div>
  );
}

const headingStyle = {
  color: ORGLOS_GREEN, fontSize: "1.2rem", fontWeight: "700",
  marginTop: 0, marginBottom: 20, letterSpacing: "-0.01em",
};

const primaryBtn = {
  background: ORGLOS_GREEN, color: "#fff", border: "none",
  padding: "12px 24px", borderRadius: 8, fontSize: "0.9rem",
  fontFamily: "sans-serif", fontWeight: "600", cursor: "pointer",
  transition: "background 0.2s",
};

const secondaryBtn = {
  background: "transparent", color: ORGLOS_GREEN,
  border: `2px solid ${ORGLOS_GREEN}`,
  padding: "10px 22px", borderRadius: 8, fontSize: "0.9rem",
  fontFamily: "sans-serif", fontWeight: "600", cursor: "pointer",
};

function Field({ label, value, onChange, placeholder, multiline }) {
  const base = {
    width: "100%", padding: "10px 14px",
    border: "1.5px solid #dde8e0", borderRadius: 8,
    fontSize: "0.9rem", fontFamily: "sans-serif",
    color: "#222", background: "#fafcfb",
    boxSizing: "border-box", outline: "none",
    transition: "border 0.2s",
  };
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", marginBottom: 6, fontSize: "0.82rem", color: ORGLOS_GREEN, fontFamily: "sans-serif", fontWeight: "600" }}>
        {label}
      </label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...base, resize: "vertical" }} onFocus={e => e.target.style.border = `1.5px solid ${ORGLOS_MID}`} onBlur={e => e.target.style.border = "1.5px solid #dde8e0"} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} onFocus={e => e.target.style.border = `1.5px solid ${ORGLOS_MID}`} onBlur={e => e.target.style.border = "1.5px solid #dde8e0"} />
      }
    </div>
  );
}
