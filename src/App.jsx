import { useState, useEffect, useRef } from "react";

// WaiBase Brand Colors
const colors = {
  navy: "#0A0F1C",
  cardDark: "#111827",
  cardMedium: "#1A2332",
  brandBlue: "#2563EB",
  skyBlue: "#38BDF8",
  lightBlue: "#60A5FA",
  white: "#FFFFFF",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
};

// Questions for the scan
const questions = [
  {
    id: "team_size",
    question: "Hoe groot is je salesteam?",
    subtitle: "Inclusief accountmanagers en SDR's",
    options: [
      { label: "1-3 personen", value: "small", icon: "👤" },
      { label: "4-10 personen", value: "medium", icon: "👥" },
      { label: "11-25 personen", value: "large", icon: "🏢" },
      { label: "25+ personen", value: "enterprise", icon: "🏗" },
    ],
  },
  {
    id: "follow_up_method",
    question: "Hoe volgen jullie leads nu op?",
    subtitle: "Kies wat het beste past bij jullie huidige werkwijze",
    options: [
      { label: "Handmatig via e-mail en telefoon", value: "manual", icon: "📧" },
      { label: "CRM met reminders", value: "crm_basic", icon: "🔔" },
      { label: "Gedeeltelijk geautomatiseerd", value: "partial", icon: "⚙" },
      { label: "Volledig geautomatiseerd", value: "automated", icon: "🤖" },
    ],
  },
  {
    id: "biggest_pain",
    question: "Wat is jullie grootste uitdaging bij follow-up?",
    subtitle: "Waar verlies je de meeste deals?",
    options: [
      { label: "Leads worden vergeten", value: "forgotten", icon: "🕳" },
      { label: "Opvolging duurt te lang", value: "slow", icon: "⏳" },
      { label: "Berichten zijn te generiek", value: "generic", icon: "📋" },
      { label: "Geen overzicht wie wat doet", value: "no_overview", icon: "🔍" },
    ],
  },
  {
    id: "leads_per_month",
    question: "Hoeveel nieuwe leads komen er maandelijks binnen?",
    subtitle: "Alle kanalen bij elkaar (LinkedIn, website, referrals, etc.)",
    options: [
      { label: "Minder dan 20", value: "few", icon: "📊" },
      { label: "20-50", value: "moderate", icon: "📈" },
      { label: "50-150", value: "many", icon: "🚀" },
      { label: "150+", value: "high_volume", icon: "⚡" },
    ],
  },
  {
    id: "ai_experience",
    question: "Hoe ver zijn jullie met AI in sales?",
    subtitle: "Eerlijk antwoord geeft het beste advies",
    options: [
      { label: "Nog niet mee begonnen", value: "none", icon: "🌱" },
      { label: "ChatGPT/Claude voor losse taken", value: "basic", icon: "💬" },
      { label: "AI in een paar processen", value: "intermediate", icon: "🔧" },
      { label: "AI is core in onze workflow", value: "advanced", icon: "🧠" },
    ],
  },
];

// Generate personalized results based on answers
function generateResults(answers) {
  const score = calculateScore(answers);
  const prompts = generatePrompts(answers);
  const recommendations = generateRecommendations(answers);
  const quickWins = generateQuickWins(answers);
  return { score, prompts, recommendations, quickWins };
}

function calculateScore(answers) {
  let score = 0;
  const methodScores = { manual: 15, crm_basic: 35, partial: 60, automated: 85 };
  score += methodScores[answers.follow_up_method] || 25;
  const aiScores = { none: 5, basic: 15, intermediate: 25, advanced: 15 };
  score += aiScores[answers.ai_experience] || 10;
  if (answers.biggest_pain === "forgotten") score = Math.max(score - 10, 10);
  if (answers.biggest_pain === "slow") score = Math.max(score - 5, 10);
  return Math.min(score, 100);
}

function generatePrompts(answers) {
  const prompts = [];

  // Prompt 1: Pipeline Scanner - always included
  prompts.push({
    title: "Pipeline Scanner",
    description: "Analyseer je pipeline en ontdek welke leads aandacht nodig hebben",
    prompt: `Je bent een senior sales consultant. Ik geef je mijn huidige sales pipeline. Analyseer elke lead en geef me:

1. Een prioriteitenlijst (Hoog/Medium/Laag) op basis van:
   - Tijd sinds laatste contact
   - Fase in het salesproces
   - Signalen van interesse of afhaking

2. Per lead een concrete volgende actie met datum

3. Leads die dreigen koud te worden (meer dan 5 dagen geen contact)

Hier is mijn pipeline:
[PLAK HIER JE PIPELINE DATA - bijv. uit je CRM export, spreadsheet, of typ ze handmatig]

Geef het resultaat als een overzichtelijke tabel met kolommen: Lead | Status | Prioriteit | Volgende Actie | Deadline`,
  });

  // Prompt 2: Personalized follow-up writer
  if (answers.biggest_pain === "generic" || answers.biggest_pain === "forgotten") {
    prompts.push({
      title: "Persoonlijke Follow-Up Schrijver",
      description: "AI schrijft follow-up berichten die niet als template voelen",
      prompt: `Je bent een ervaren B2B sales professional. Schrijf een follow-up bericht voor de volgende lead. Het bericht moet:

- Persoonlijk en warm zijn (geen corporate taal)
- Refereren aan ons eerdere contact
- Een concrete reden geven om te reageren
- Kort zijn (max 5 zinnen)
- Eindigen met een laagdrempelige call-to-action

Lead informatie:
- Naam: [NAAM]
- Bedrijf: [BEDRIJF]
- Laatste contact: [DATUM + WAT BESPROKEN]
- Fase: [bijv. "voorstel verstuurd", "demo gehad", "eerste gesprek gehad"]
- Kanaal: [LinkedIn DM / E-mail / WhatsApp]

Schrijf 2 varianten: een korte (3 zinnen) en een uitgebreide (5 zinnen). Gebruik een informele maar professionele toon.`,
    });
  } else {
    prompts.push({
      title: "Follow-Up Sequence Builder",
      description: "Bouw een complete follow-up sequence voor elke fase",
      prompt: `Je bent een B2B sales automation expert. Maak een follow-up sequence van 4 berichten voor leads in de volgende fase:

Fase: [bijv. "voorstel verstuurd maar nog geen reactie"]
Branche: [BRANCHE VAN DE LEAD]
Kanaal: [LinkedIn DM / E-mail]

Per bericht geef je:
1. Timing (dag X na vorig contact)
2. Onderwerp/hook
3. Volledig uitgeschreven bericht
4. Doel van dit bericht

Regels:
- Elk bericht voegt nieuwe waarde toe (geen "even checken of je mijn mail hebt gezien")
- Toon: informeel-professioneel, geen corporate taal
- Bericht 4 is een break-up mail met open deur
- Maximaal 5 zinnen per bericht`,
    });
  }

  // Prompt 3: Based on team size and volume
  if (answers.leads_per_month === "many" || answers.leads_per_month === "high_volume") {
    prompts.push({
      title: "Lead Prioritering Matrix",
      description: "Laat AI je leads scoren en prioriteren bij hoog volume",
      prompt: `Je bent een sales operations specialist. Ik heb ${answers.leads_per_month === "high_volume" ? "150+" : "50-150"} leads per maand en moet ze slim prioriteren.

Maak een scoring model voor mijn leads op basis van deze criteria. Geef elk criterium een gewicht (totaal = 100 punten):

Mijn ideale klant:
- Branche: [JOUW BRANCHES]
- Bedrijfsgrootte: [AANTAL MEDEWERKERS]
- Budget-indicatie: [RANGE]
- Typische pijnpunten: [LIJST]

Per lead die ik invoer, geef je:
1. Score (0-100)
2. Categorie: Hot (80+), Warm (50-79), Koud (<50)
3. Aanbevolen actie + timing
4. Reden voor de score

Hier zijn mijn leads:
[PLAK HIER JE LEADS]`,
    });
  } else {
    prompts.push({
      title: "Deal Accelerator",
      description: "Versnel deals die vastzitten in je pipeline",
      prompt: `Je bent een senior sales coach. Ik heb een deal die vastzit en ik wil hem versnellen.

Deal informatie:
- Prospect: [BEDRIJF + CONTACTPERSOON]
- Wat we aanbieden: [KORT BESCHRIJVING]
- Huidige fase: [bijv. "wacht op beslissing", "concurrent in beeld", "budget moet goedgekeurd"]
- Blokkade: [Wat houdt de deal tegen?]
- Laatste contact: [DATUM]
- Dealwaarde: [BEDRAG]

Geef me:
1. Analyse: waarom zit deze deal waarschijnlijk vast?
2. Drie concrete acties om de deal los te trekken (met voorbeeldberichten)
3. Een "power move" die ik morgen kan uitvoeren
4. Een eerlijke inschatting: is deze deal het nog waard om na te jagen?`,
    });
  }

  // Prompt 4: AI overview generator
  prompts.push({
    title: "Dagelijks Sales Overzicht",
    description: "Genereer elke ochtend een to-do lijst op basis van je pipeline",
    prompt: `Je bent mijn persoonlijke sales assistent. Op basis van mijn pipeline maak je elke ochtend een actionable overzicht.

Mijn pipeline (kopieer uit je CRM):
[PLAK HIER JE ACTUELE PIPELINE]

Maak dit overzicht:

VANDAAG ACTIE NODIG (leads die je vandaag moet benaderen):
- [Lead] — [Reden] — [Specifieke actie]

DEZE WEEK OPVOLGEN:
- [Lead] — [Volgende stap] — [Deadline]

DREIGEN KOUD TE WORDEN (5+ dagen geen contact):
- [Lead] — [Laatste contact] — [Aanbevolen actie]

GEWONNEN DEZE WEEK:
- [Overzicht]

VERLOREN DEZE WEEK:
- [Lead] — [Reden] — [Wat je ervan kunt leren]

Geef maximaal 5 items per categorie. Prioriteer op dealwaarde en urgentie.`,
  });

  // Prompt 5: Objection handler (conditional)
  if (answers.ai_experience === "none" || answers.ai_experience === "basic") {
    prompts.push({
      title: "Bezwaren Ontmantelen",
      description: "Laat AI de beste reactie schrijven op elk sales bezwaar",
      prompt: `Je bent een expert in B2B sales objection handling. Ik krijg het volgende bezwaar van een prospect:

Bezwaar: "[PLAK HET BEZWAAR HIER]"

Context:
- Prospect: [BEDRIJF + ROL]
- Wat ik aanbied: [KORT]
- Fase: [WAAR IN HET PROCES]

Geef me:
1. Analyse: wat zegt de prospect echt? (het bezwaar achter het bezwaar)
2. Drie reacties: empathisch, direct en challenger
3. De beste vervolgvraag om het gesprek open te houden
4. Een eerlijke check: is dit een echt bezwaar of een afwijzing?

Houd het praktisch — geen theorie, alleen bruikbare antwoorden.`,
    });
  } else {
    prompts.push({
      title: "Win/Loss Analyse",
      description: "Leer van je gewonnen en verloren deals met AI-analyse",
      prompt: `Je bent een sales strategy consultant. Analyseer mijn recente deals om patronen te ontdekken.

GEWONNEN DEALS (laatste 3 maanden):
[Lijst: bedrijf, dealwaarde, doorlooptijd, beslisser, wat de doorslag gaf]

VERLOREN DEALS (laatste 3 maanden):
[Lijst: bedrijf, dealwaarde, fase waarin verloren, reden, concurrent]

Analyseer en geef me:
1. Patronen in gewonnen deals (wat werkt?)
2. Patronen in verloren deals (wat gaat mis?)
3. Mijn ideale klantprofiel op basis van deze data
4. Top 3 verbeteringen voor mijn salesproces
5. Welk type deals moet ik vaker najagen en welke eerder loslaten?`,
    });
  }

  return prompts;
}

function generateRecommendations(answers) {
  const recs = [];

  if (answers.follow_up_method === "manual") {
    recs.push({
      title: "Start met een CRM",
      description: "Zonder systeem verlies je gegarandeerd leads. Zelfs een simpele Airtable of Pipedrive is beter dan e-mail en geheugen.",
      impact: "Hoog",
    });
  }

  if (answers.biggest_pain === "forgotten") {
    recs.push({
      title: "Dagelijkse pipeline review",
      description: "Gebruik de 'Dagelijks Sales Overzicht' prompt elke ochtend. Kost 5 minuten, bespaart je vergeten deals.",
      impact: "Hoog",
    });
  }

  if (answers.biggest_pain === "generic") {
    recs.push({
      title: "Personaliseer met AI",
      description: "Stop met templated opvolging. Gebruik de 'Persoonlijke Follow-Up Schrijver' prompt voor elk bericht. Kost 30 seconden extra, verhoogt je response rate.",
      impact: "Hoog",
    });
  }

  if (answers.ai_experience === "none") {
    recs.push({
      title: "Begin met Claude Projects",
      description: "Maak een Claude Project aan met je salescontext (ICP, producten, tone of voice). Dan hoef je niet elke keer alles opnieuw uit te leggen.",
      impact: "Medium",
    });
  }

  if (answers.leads_per_month === "many" || answers.leads_per_month === "high_volume") {
    recs.push({
      title: "Automatiseer je lead scoring",
      description: "Bij jouw volume is handmatige prioritering niet houdbaar. Overweeg een AI-gestuurde scoring die automatisch draait.",
      impact: "Hoog",
    });
  }

  recs.push({
    title: "Van prompts naar automatisering",
    description: "Deze prompts zijn je startpunt. De echte winst zit in het automatiseren: AI die dagelijks je pipeline scant zonder dat jij eraan hoeft te denken.",
    impact: "Strategisch",
  });

  return recs;
}

function generateQuickWins(answers) {
  return [
    {
      time: "5 min",
      action: "Plak je pipeline in Claude met de Pipeline Scanner prompt",
      result: "Direct overzicht welke leads aandacht nodig hebben",
    },
    {
      time: "2 min",
      action: "Schrijf een follow-up voor je belangrijkste open deal",
      result: "Persoonlijk bericht dat vandaag nog de deur uit kan",
    },
    {
      time: "10 min",
      action: "Maak een Claude Project aan met je sales context",
      result: "AI die je situatie kent en direct relevante antwoorden geeft",
    },
  ];
}

// Components
function Logo({ size = "large" }) {
  const fontSize = size === "large" ? "2.5rem" : "1.25rem";
  return (
    <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize, letterSpacing: "-0.02em" }}>
      <span style={{ color: colors.white }}>W</span>
      <span style={{ color: colors.skyBlue }}>ai</span>
      <span style={{ color: colors.white }}>Base</span>
    </span>
  );
}

function ProgressBar({ current, total }) {
  const pct = ((current + 1) / total) * 100;
  return (
    <div style={{ width: "100%", maxWidth: 480, margin: "0 auto 2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontFamily: "DM Sans, sans-serif", fontSize: "0.85rem", color: colors.gray400 }}>
        <span>Vraag {current + 1} van {total}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: colors.cardMedium }}>
        <div style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${colors.brandBlue}, ${colors.skyBlue})`, width: `${pct}%`, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function QuestionCard({ question, onAnswer, selectedAnswer }) {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", animation: "fadeIn 0.4s ease" }}>
      <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.75rem", fontWeight: 700, color: colors.white, marginBottom: 8, textAlign: "center" }}>
        {question.question}
      </h2>
      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "1rem", color: colors.gray400, marginBottom: 32, textAlign: "center" }}>
        {question.subtitle}
      </p>
      <div style={{ display: "grid", gap: 12 }}>
        {question.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onAnswer(question.id, opt.value)}
            style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "18px 24px", borderRadius: 12,
              background: selectedAnswer === opt.value ? colors.brandBlue + "22" : colors.cardDark,
              border: selectedAnswer === opt.value ? `2px solid ${colors.brandBlue}` : `2px solid ${colors.cardMedium}`,
              color: colors.white, cursor: "pointer",
              fontFamily: "DM Sans, sans-serif", fontSize: "1.05rem",
              transition: "all 0.2s ease", textAlign: "left", width: "100%",
            }}
            onMouseOver={(e) => { if (selectedAnswer !== opt.value) { e.currentTarget.style.borderColor = colors.brandBlue + "66"; e.currentTarget.style.background = colors.cardMedium; }}}
            onMouseOut={(e) => { if (selectedAnswer !== opt.value) { e.currentTarget.style.borderColor = colors.cardMedium; e.currentTarget.style.background = colors.cardDark; }}}
          >
            <span style={{ fontSize: "1.5rem", width: 40, textAlign: "center", flexShrink: 0 }}>{opt.icon}</span>
            <span style={{ fontWeight: 500 }}>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ScoreGauge({ score }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const getColor = (s) => s >= 70 ? "#16A34A" : s >= 40 ? "#D97706" : "#DC2626";
  const getLabel = (s) => s >= 70 ? "Sterk" : s >= 40 ? "Gemiddeld" : "Kwetsbaar";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "2rem 0" }}>
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={radius} fill="none" stroke={colors.cardMedium} strokeWidth="12" />
        <circle cx="100" cy="100" r={radius} fill="none" stroke={getColor(score)} strokeWidth="12"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 100 100)"
          style={{ transition: "stroke-dashoffset 1.5s ease" }} />
        <text x="100" y="90" textAnchor="middle" fill={colors.white} fontFamily="Outfit, sans-serif" fontSize="42" fontWeight="700">{score}</text>
        <text x="100" y="115" textAnchor="middle" fill={colors.gray400} fontFamily="DM Sans, sans-serif" fontSize="14">/100</text>
      </svg>
      <div style={{ marginTop: 8, padding: "6px 20px", borderRadius: 20, background: getColor(score) + "22", border: `1px solid ${getColor(score)}44` }}>
        <span style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 600, color: getColor(score), fontSize: "0.95rem" }}>
          {getLabel(score)}
        </span>
      </div>
    </div>
  );
}

function PromptCard({ prompt, index, copied, onCopy }) {
  return (
    <div style={{
      background: colors.cardDark, borderRadius: 16, padding: 24, marginBottom: 16,
      border: `1px solid ${colors.cardMedium}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{
              background: colors.brandBlue + "33", color: colors.skyBlue,
              fontFamily: "DM Sans, sans-serif", fontSize: "0.75rem", fontWeight: 600,
              padding: "3px 10px", borderRadius: 12,
            }}>
              PROMPT {index + 1}
            </span>
            <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.15rem", fontWeight: 600, color: colors.white, margin: 0 }}>
              {prompt.title}
            </h3>
          </div>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.9rem", color: colors.gray400, margin: 0 }}>
            {prompt.description}
          </p>
        </div>
      </div>
      <div style={{
        background: colors.navy, borderRadius: 10, padding: 16, marginTop: 12,
        fontFamily: "monospace", fontSize: "0.82rem", color: colors.gray300,
        lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 200, overflowY: "auto",
        border: `1px solid ${colors.cardMedium}`,
      }}>
        {prompt.prompt}
      </div>
      <button
        onClick={() => onCopy(index, prompt.prompt)}
        style={{
          marginTop: 12, padding: "10px 24px", borderRadius: 8, border: "none",
          background: copied === index ? "#16A34A" : colors.brandBlue,
          color: colors.white, fontFamily: "DM Sans, sans-serif", fontWeight: 600,
          fontSize: "0.9rem", cursor: "pointer", transition: "all 0.2s ease",
        }}
      >
        {copied === index ? "Gekopieerd!" : "Kopieer prompt"}
      </button>
    </div>
  );
}

function LeadCaptureModal({ show, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: colors.cardDark, borderRadius: 20, padding: 40, maxWidth: 460, width: "100%",
        border: `1px solid ${colors.cardMedium}`,
      }}>
        <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.5rem", fontWeight: 700, color: colors.white, marginBottom: 8 }}>
          Ontvang alle 5 prompts als PDF
        </h3>
        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.95rem", color: colors.gray400, marginBottom: 24 }}>
          Plus een persoonlijk AI-actieplan voor jouw salesproces. Gratis, geen verplichtingen.
        </p>
        {[
          { label: "Naam", value: name, onChange: setName, placeholder: "Voornaam" },
          { label: "E-mail", value: email, onChange: setEmail, placeholder: "naam@bedrijf.nl" },
          { label: "Bedrijf", value: company, onChange: setCompany, placeholder: "Bedrijfsnaam" },
        ].map((field) => (
          <div key={field.label} style={{ marginBottom: 16 }}>
            <label style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.85rem", color: colors.gray400, marginBottom: 6, display: "block" }}>
              {field.label}
            </label>
            <input
              type={field.label === "E-mail" ? "email" : "text"}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={field.placeholder}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 10,
                background: colors.navy, border: `1px solid ${colors.cardMedium}`,
                color: colors.white, fontFamily: "DM Sans, sans-serif", fontSize: "1rem",
                outline: "none", boxSizing: "border-box",
              }}
              onFocus={(e) => { e.target.style.borderColor = colors.brandBlue; }}
              onBlur={(e) => { e.target.style.borderColor = colors.cardMedium; }}
            />
          </div>
        ))}
        <button
          onClick={() => onSubmit({ name, email, company })}
          disabled={!name || !email}
          style={{
            width: "100%", padding: "14px 24px", borderRadius: 10, border: "none",
            background: !name || !email ? colors.gray500 : colors.brandBlue,
            color: colors.white, fontFamily: "DM Sans, sans-serif", fontWeight: 600,
            fontSize: "1rem", cursor: !name || !email ? "not-allowed" : "pointer",
            marginTop: 8, transition: "all 0.2s ease",
          }}
        >
          Verstuur mijn actieplan
        </button>
        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "10px", marginTop: 8, background: "transparent",
            border: "none", color: colors.gray500, fontFamily: "DM Sans, sans-serif",
            fontSize: "0.85rem", cursor: "pointer",
          }}
        >
          Sla over
        </button>
      </div>
    </div>
  );
}

// Main App
export default function ClaudeSalesPilot() {
  const [screen, setScreen] = useState("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(-1);
  const [showModal, setShowModal] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const resultsRef = useRef(null);

  const handleAnswer = (id, value) => {
    const newAnswers = { ...answers, [id]: value };
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(currentQ + 1);
      } else {
        setScreen("analyzing");
        setTimeout(() => {
          setResults(generateResults(newAnswers));
          setScreen("results");
        }, 2500);
      }
    }, 300);
  };

  const handleCopy = (index, text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(index);
    setTimeout(() => setCopied(-1), 2000);
  };

  const handleLeadSubmit = (data) => {
    setLeadCaptured(true);
    setShowModal(false);

    fetch("https://nicowaiboer.app.n8n.cloud/webhook/claude-sales-pilot-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        company: data.company,
        answers: answers,
        score: results?.score || 0,
        timestamp: new Date().toISOString()
      })
    }).catch(() => {});
  };

  return (
    <div style={{
      minHeight: "100vh", background: colors.navy,
      fontFamily: "DM Sans, sans-serif", color: colors.white,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${colors.navy}; }
        ::-webkit-scrollbar-thumb { background: ${colors.cardMedium}; border-radius: 3px; }
        input::placeholder { color: ${colors.gray500}; }
      `}</style>

      {/* Header */}
      <header style={{
        padding: "20px 32px", display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: `1px solid ${colors.cardMedium}`,
      }}>
        <Logo size="small" />
        <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.85rem", color: colors.gray500 }}>
          Gratis Sales AI Scan
        </span>
      </header>

      <main style={{ padding: "40px 24px", maxWidth: 720, margin: "0 auto" }}>

        {/* INTRO SCREEN */}
        {screen === "intro" && (
          <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease" }}>
            <div style={{
              display: "inline-block", padding: "6px 16px", borderRadius: 20,
              background: colors.brandBlue + "22", border: `1px solid ${colors.brandBlue}44`,
              marginBottom: 24,
            }}>
              <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.85rem", fontWeight: 600, color: colors.skyBlue }}>
                Powered by Claude AI
              </span>
            </div>

            <h1 style={{
              fontFamily: "Outfit, sans-serif", fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 800, lineHeight: 1.15, marginBottom: 20,
              background: `linear-gradient(135deg, ${colors.white}, ${colors.skyBlue})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Claude Sales Pilot
            </h1>

            <p style={{
              fontFamily: "DM Sans, sans-serif", fontSize: "1.2rem", color: colors.gray300,
              maxWidth: 520, margin: "0 auto 12px", lineHeight: 1.6,
            }}>
              Ontdek in 60 seconden hoe AI jouw sales follow-up kan verbeteren.
            </p>
            <p style={{
              fontFamily: "DM Sans, sans-serif", fontSize: "1rem", color: colors.gray400,
              maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.6,
            }}>
              Beantwoord 5 vragen over je salesproces en ontvang direct een gepersonaliseerd AI-actieplan met kant-en-klare Claude prompts.
            </p>

            <button
              onClick={() => setScreen("questions")}
              style={{
                padding: "16px 48px", borderRadius: 12, border: "none",
                background: `linear-gradient(135deg, ${colors.brandBlue}, ${colors.skyBlue})`,
                color: colors.white, fontFamily: "DM Sans, sans-serif", fontWeight: 700,
                fontSize: "1.1rem", cursor: "pointer", transition: "transform 0.2s ease",
                boxShadow: `0 4px 24px ${colors.brandBlue}44`,
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Start de scan
            </button>

            <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 48 }}>
              {[
                { num: "5", label: "Vragen" },
                { num: "60s", label: "Tijd" },
                { num: "5", label: "AI Prompts" },
              ].map((item) => (
                <div key={item.label} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.5rem", fontWeight: 700, color: colors.skyBlue }}>{item.num}</div>
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.85rem", color: colors.gray500 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUESTIONS SCREEN */}
        {screen === "questions" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <ProgressBar current={currentQ} total={questions.length} />
            <QuestionCard
              question={questions[currentQ]}
              onAnswer={handleAnswer}
              selectedAnswer={answers[questions[currentQ].id]}
            />
          </div>
        )}

        {/* ANALYZING SCREEN */}
        {screen === "analyzing" && (
          <div style={{ textAlign: "center", animation: "fadeIn 0.4s ease", paddingTop: 80 }}>
            <div style={{ marginBottom: 32 }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{
                  display: "inline-block", width: 12, height: 12, borderRadius: "50%",
                  background: colors.brandBlue, margin: "0 6px",
                  animation: `pulse 1.2s ease ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.5rem", fontWeight: 700, color: colors.white, marginBottom: 12 }}>
              Claude analyseert je salesproces...
            </h2>
            <p style={{ fontFamily: "DM Sans, sans-serif", color: colors.gray400 }}>
              Je persoonlijke AI-actieplan wordt gegenereerd
            </p>
          </div>
        )}

        {/* RESULTS SCREEN */}
        {screen === "results" && results && (
          <div ref={resultsRef} style={{ animation: "fadeIn 0.5s ease" }}>
            {/* Score */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.75rem", fontWeight: 700, color: colors.white, marginBottom: 8 }}>
                Jouw Sales Follow-Up Score
              </h2>
              <ScoreGauge score={results.score} />
            </div>

            {/* Quick Wins */}
            <div style={{
              background: colors.cardDark, borderRadius: 16, padding: 24, marginBottom: 32,
              border: `1px solid ${colors.cardMedium}`,
            }}>
              <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.2rem", fontWeight: 700, color: colors.white, marginBottom: 16 }}>
                Quick Wins — Begin vandaag
              </h3>
              {results.quickWins.map((win, i) => (
                <div key={i} style={{
                  display: "flex", gap: 16, padding: "14px 0",
                  borderBottom: i < results.quickWins.length - 1 ? `1px solid ${colors.cardMedium}` : "none",
                }}>
                  <div style={{
                    minWidth: 56, height: 32, borderRadius: 8,
                    background: colors.brandBlue + "22", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontFamily: "DM Sans, sans-serif", fontSize: "0.8rem",
                    fontWeight: 600, color: colors.skyBlue,
                  }}>
                    {win.time}
                  </div>
                  <div>
                    <div style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 600, color: colors.white, fontSize: "0.95rem" }}>
                      {win.action}
                    </div>
                    <div style={{ fontFamily: "DM Sans, sans-serif", color: colors.gray400, fontSize: "0.85rem", marginTop: 2 }}>
                      {win.result}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Prompts */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.2rem", fontWeight: 700, color: colors.white }}>
                  Jouw gepersonaliseerde Claude prompts
                </h3>
                <span style={{
                  fontFamily: "DM Sans, sans-serif", fontSize: "0.8rem", color: colors.gray500,
                  background: colors.cardDark, padding: "4px 12px", borderRadius: 12,
                }}>
                  {results.prompts.length} prompts
                </span>
              </div>
              {results.prompts.map((prompt, i) => (
                <PromptCard key={i} prompt={prompt} index={i} copied={copied} onCopy={handleCopy} />
              ))}
            </div>

            {/* Recommendations */}
            <div style={{
              background: `linear-gradient(135deg, ${colors.brandBlue}11, ${colors.skyBlue}11)`,
              borderRadius: 16, padding: 24, marginBottom: 32,
              border: `1px solid ${colors.brandBlue}33`,
            }}>
              <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.2rem", fontWeight: 700, color: colors.white, marginBottom: 16 }}>
                Aanbevelingen voor jouw situatie
              </h3>
              {results.recommendations.map((rec, i) => (
                <div key={i} style={{
                  padding: "14px 0",
                  borderBottom: i < results.recommendations.length - 1 ? `1px solid ${colors.cardMedium}` : "none",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 600, color: colors.white, fontSize: "0.95rem" }}>
                      {rec.title}
                    </span>
                    <span style={{
                      fontFamily: "DM Sans, sans-serif", fontSize: "0.75rem", fontWeight: 600,
                      padding: "2px 10px", borderRadius: 10,
                      background: rec.impact === "Hoog" ? "#16A34A22" : rec.impact === "Strategisch" ? colors.brandBlue + "22" : "#D9770622",
                      color: rec.impact === "Hoog" ? "#16A34A" : rec.impact === "Strategisch" ? colors.skyBlue : "#D97706",
                    }}>
                      {rec.impact} impact
                    </span>
                  </div>
                  <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.9rem", color: colors.gray400, lineHeight: 1.5 }}>
                    {rec.description}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{
              background: `linear-gradient(135deg, ${colors.brandBlue}, #1D4ED8)`,
              borderRadius: 16, padding: 32, textAlign: "center", marginBottom: 32,
            }}>
              <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.3rem", fontWeight: 700, color: colors.white, marginBottom: 8 }}>
                Wil je dit volledig automatiseren?
              </h3>
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "1rem", color: "#FFFFFFCC", marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
                Van losse prompts naar een systeem dat dagelijks voor je draait. Zonder dat je eraan hoeft te denken.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                {!leadCaptured && (
                  <button
                    onClick={() => setShowModal(true)}
                    style={{
                      padding: "14px 32px", borderRadius: 10, border: `2px solid ${colors.white}`,
                      background: "transparent", color: colors.white,
                      fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: "0.95rem",
                      cursor: "pointer",
                    }}
                  >
                    Ontvang het volledige playbook
                  </button>
                )}
                <button
                  onClick={() => window.open("https://www.nicowaiboer.nl/strategiegesprek", "_blank")}
                  style={{
                    padding: "14px 32px", borderRadius: 10, border: "none",
                    background: colors.white, color: colors.brandBlue,
                    fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "0.95rem",
                    cursor: "pointer",
                  }}
                >
                  Plan een gratis strategiegesprek
                </button>
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", padding: "24px 0", borderTop: `1px solid ${colors.cardMedium}` }}>
              <Logo size="small" />
              <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.8rem", color: colors.gray500, marginTop: 8 }}>
                AI & Sales Automatisering — waibase.nl
              </p>
            </div>
          </div>
        )}
      </main>

      <LeadCaptureModal show={showModal} onClose={() => setShowModal(false)} onSubmit={handleLeadSubmit} />
    </div>
  );
}
