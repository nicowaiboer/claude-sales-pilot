import PDFDocument from "pdfkit";

// WaiBase brand colors
const C = {
  navy: [10, 15, 28],
  brandBlue: [37, 99, 235],
  skyBlue: [56, 189, 248],
  nearBlack: [17, 24, 39],
  gray400: [156, 163, 175],
  gray500: [107, 114, 128],
  lightGray: [229, 231, 235],
  white: [255, 255, 255],
  tipGreenBg: [240, 253, 244],
  tipGreen: [22, 163, 74],
  red: [239, 68, 68],
  orange: [245, 158, 11],
  green: [22, 163, 74],
};

function scoreColor(score) {
  if (score < 40) return C.red;
  if (score < 60) return C.orange;
  if (score < 80) return C.green;
  return C.brandBlue;
}

function scoreLabel(score) {
  if (score < 40) return "Laag";
  if (score < 60) return "Gemiddeld";
  if (score < 80) return "Goed";
  return "Uitstekend";
}

function volumeText(val) {
  const map = {
    few: "minder dan 20 leads per maand",
    moderate: "20-50 leads per maand",
    many: "50-150 leads per maand",
    high_volume: "meer dan 150 leads per maand",
  };
  return map[val] || "een wisselend aantal leads per maand";
}

// Helpers
function hex(arr) {
  return "#" + arr.map((v) => v.toString(16).padStart(2, "0")).join("");
}

function drawLogo(doc, x, y, size) {
  doc.font("Helvetica-Bold").fontSize(size);
  doc.fillColor(C.nearBlack).text("W", x, y, { continued: true });
  doc.fillColor(C.skyBlue).text("ai", { continued: true });
  doc.fillColor(C.nearBlack).text("Base", { continued: false });
}

function drawLine(doc, y) {
  doc
    .moveTo(72, y)
    .lineTo(523, y)
    .strokeColor(C.brandBlue)
    .lineWidth(2)
    .stroke();
}

function drawThinLine(doc, y) {
  doc
    .moveTo(72, y)
    .lineTo(523, y)
    .strokeColor(C.lightGray)
    .lineWidth(0.5)
    .stroke();
}

function promptBlock(doc, num, title, description, promptText) {
  // Check if we need a new page (need ~300pt minimum)
  if (doc.y > 520) doc.addPage();

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(C.brandBlue)
    .text(`PROMPT ${num}`, 72, doc.y + 10);

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(C.nearBlack)
    .text(title, 72, doc.y + 4);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(C.gray500)
    .text(description, 72, doc.y + 4, { width: 451 });

  doc.moveDown(0.5);

  // Prompt text box
  const boxY = doc.y;
  const textOpts = { width: 419 };
  const textHeight = doc.heightOfString(promptText, textOpts) + 24;

  doc
    .roundedRect(72, boxY, 451, textHeight, 6)
    .fillColor([245, 247, 250])
    .fill();

  doc
    .font("Courier")
    .fontSize(8.5)
    .fillColor(C.nearBlack)
    .text(promptText, 88, boxY + 12, { width: 419, lineGap: 3 });

  doc.y = boxY + textHeight + 12;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { name, email, company, score, label, answers } = req.body || {};
  if (!name || !email)
    return res.status(400).json({ error: "name and email are required" });

  const finalScore = score || 0;
  const finalLabel = label || scoreLabel(finalScore);
  const sColor = scoreColor(finalScore);
  const firstName = name.split(" ")[0];

  const doc = new PDFDocument({ size: "A4", margin: 72 });
  const buffers = [];
  doc.on("data", (chunk) => buffers.push(chunk));

  const done = new Promise((resolve) => doc.on("end", resolve));

  // ===== PAGE 1: Title =====
  drawLogo(doc, 72, 72, 28);
  doc.moveDown(2);

  doc
    .font("Helvetica-Bold")
    .fontSize(32)
    .fillColor(C.nearBlack)
    .text("Sales AI Playbook", 72, doc.y);

  doc
    .font("Helvetica")
    .fontSize(13)
    .fillColor(C.gray500)
    .text(
      "5 kant-en-klare Claude prompts voor jouw salesproces",
      72,
      doc.y + 6
    );

  doc.moveDown(1);
  drawLine(doc, doc.y);
  doc.moveDown(1.5);

  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor(C.gray400)
    .text("Speciaal voor:", 72, doc.y);
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(C.nearBlack)
    .text(name, 72, doc.y + 4);
  if (company) {
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor(C.gray500)
      .text(company, 72, doc.y + 2);
  }

  doc.moveDown(2);
  drawThinLine(doc, doc.y);
  doc.moveDown(1.5);

  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor(C.gray400)
    .text("Jouw Sales Follow-Up Score", { align: "center" });

  doc.moveDown(1);

  // Score circle area
  const scoreY = doc.y;
  doc
    .font("Helvetica-Bold")
    .fontSize(64)
    .fillColor(sColor)
    .text(String(finalScore), 72, scoreY, { align: "center" });
  doc
    .font("Helvetica")
    .fontSize(16)
    .fillColor(C.gray400)
    .text("/100", 72, doc.y - 4, { align: "center" });
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor(sColor)
    .text(finalLabel, 72, doc.y + 8, { align: "center" });

  doc.moveDown(3);
  drawThinLine(doc, doc.y);
  doc.moveDown(2);

  // Footer info
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(C.gray500)
    .text("Nico Waiboer  \u2022  WaiBase  \u2022  April 2026", { align: "center" });
  doc.text("nico@waibase.nl  \u2022  06 33434426  \u2022  waibase.nl", {
    align: "center",
  });

  // ===== PAGE 2: Quick Wins + Prompt 1 =====
  doc.addPage();

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(C.nearBlack)
    .text("Quick Wins \u2014 Begin vandaag", 72, 72);
  doc.moveDown(0.8);

  const quickWins = [
    {
      time: "5 min",
      action: "Plak je pipeline in Claude met de Pipeline Scanner prompt",
      detail:
        "Kopieer je open deals uit je CRM en plak ze in Claude. Je krijgt direct een prioriteitenlijst met concrete volgende stappen per lead.",
    },
    {
      time: "2 min",
      action: "Schrijf een follow-up voor je belangrijkste open deal",
      detail:
        "Gebruik Prompt 2 om een persoonlijk follow-up bericht te genereren voor de deal waar je het meeste van verwacht.",
    },
    {
      time: "10 min",
      action: "Maak een Claude Project aan met je sales context",
      detail:
        "Geef Claude achtergrond over je bedrijf, ICP en product. Vanaf dat moment geeft elke prompt direct relevante antwoorden.",
    },
  ];

  for (const win of quickWins) {
    const wy = doc.y;
    doc
      .roundedRect(72, wy, 50, 22, 4)
      .fillColor(C.brandBlue)
      .fill();
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(C.white)
      .text(win.time, 74, wy + 6, { width: 46, align: "center" });

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(C.nearBlack)
      .text(win.action, 132, wy, { width: 391 });
    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(C.gray500)
      .text(win.detail, 132, doc.y + 2, { width: 391 });
    doc.moveDown(0.8);
  }

  doc.moveDown(0.5);

  // Prompt 1
  promptBlock(
    doc,
    1,
    "Pipeline Scanner",
    "Analyseer je volledige pipeline en krijg per lead een concrete volgende actie",
    `Je bent een senior sales consultant. Ik geef je mijn huidige sales pipeline. Analyseer elke lead en geef me:

1. Een prioriteitenlijst (Hoog/Medium/Laag) op basis van:
   - Tijd sinds laatste contact
   - Fase in het salesproces
   - Signalen van interesse of afhaking

2. Per lead een concrete volgende actie met datum

3. Welke leads ik deze week NIET moet benaderen (en waarom)

Mijn pipeline:
[PLAK HIER JE PIPELINE UIT JE CRM]`
  );

  // ===== PAGE 3: Prompt 2 =====
  doc.addPage();

  promptBlock(
    doc,
    2,
    "Follow-Up Sequence Builder",
    "Bouw een complete follow-up sequence voor elke fase",
    `Je bent een B2B sales automation expert. Maak een follow-up sequence van 4 berichten voor leads in de volgende fase:

Fase: [bijv. "voorstel verstuurd maar nog geen reactie"]
Branche: [BRANCHE VAN DE LEAD]
Kanaal: [LinkedIn DM / E-mail]

Per bericht geef je:
1. Timing (dag X na vorig contact)
2. Onderwerpregel (als e-mail)
3. Het volledige bericht (max 5 zinnen)
4. Doel van dit bericht (awareness/nudge/urgentie/break-up)

Regels:
- Bericht 1 is een zachte check-in
- Bericht 2 voegt nieuwe waarde toe
- Bericht 3 creëert urgentie
- Bericht 4 is een break-up mail met open deur
- Maximaal 5 zinnen per bericht`
  );

  // ===== PAGE 4: Prompt 3 + 4 =====
  doc.addPage();

  const volume = volumeText(answers?.leads_per_month);

  promptBlock(
    doc,
    3,
    "Lead Prioritering Matrix",
    "Laat AI je leads scoren en prioriteren",
    `Je bent een sales operations specialist. Ik heb ${volume} en moet ze slim prioriteren.

Maak een scoring model voor mijn leads op basis van deze criteria. Geef elk criterium een gewicht (totaal = 100 punten):

Mijn ideale klant:
- Branche: [JOUW BRANCHES]
- Bedrijfsgrootte: [AANTAL MEDEWERKERS]
- Functie beslisser: [GEWENSTE FUNCTIES]
- Budget-indicatie: [RANGE]

Geef me:
1. Het scoring model als tabel (criterium, gewicht, scoring)
2. Drie voorbeeldleads gescoord met dit model
3. Drempelwaardes: wanneer direct bellen, wanneer sequence, wanneer niet opvolgen`
  );

  promptBlock(
    doc,
    4,
    "Dagelijks Sales Overzicht",
    "Genereer elke ochtend een actionable to-do lijst",
    `Je bent mijn persoonlijke sales assistent. Op basis van mijn pipeline maak je elke ochtend een actionable overzicht.

Mijn pipeline (kopieer uit je CRM):
[PLAK HIER JE ACTUELE PIPELINE]

Maak dit overzicht:

VANDAAG ACTIE NODIG (leads die je vandaag moet benaderen):
- Lead, reden, voorgestelde actie

DEZE WEEK OPVOLGEN:
- Lead, deadline, type actie

RISICO'S (deals die je kunt verliezen):
- Lead, signaal, aanbevolen actie

WINS (positieve signalen):
- Lead, signaal

Sluit af met de 3 belangrijkste acties voor vandaag, in volgorde van impact.`
  );

  // ===== PAGE 5: Prompt 5 =====
  doc.addPage();

  promptBlock(
    doc,
    5,
    "Objection Handler",
    "De beste reactie op elk sales bezwaar",
    `Je bent een expert in B2B sales objection handling. Ik krijg het volgende bezwaar van een prospect:

Bezwaar: "[PLAK HET BEZWAAR HIER]"

Context:
- Prospect: [BEDRIJF + ROL]
- Wat ik aanbied: [KORT]
- Fase: [WAAR IN HET PROCES]

Geef me:
1. Waarom dit bezwaar waarschijnlijk komt (de echte reden)
2. Een antwoord in max 3 zinnen (empathisch, niet pushy)
3. Een vervolgvraag die het gesprek opent
4. Een alternatief antwoord als het eerste niet werkt
5. Wanneer ik dit bezwaar moet accepteren (niet elk bezwaar is te weerleggen)`
  );

  // ===== PAGE 6: CTA =====
  doc.addPage();

  doc.moveDown(2);
  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor(C.nearBlack)
    .text("Wil je dit volledig automatiseren?", 72, doc.y, {
      align: "center",
    });

  doc.moveDown(1);
  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor(C.gray500)
    .text(
      "Deze prompts zijn je startpunt. Maar de echte winst zit in het automatiseren: AI die dagelijks je pipeline scant, leads scoort, en follow-ups verstuurt \u2014 zonder dat jij eraan hoeft te denken.",
      72,
      doc.y,
      { width: 451, align: "center", lineGap: 4 }
    );

  doc.moveDown(1.5);

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(C.nearBlack)
    .text("Wat WaiBase voor je kan bouwen:", 72, doc.y);
  doc.moveDown(0.5);

  const features = [
    ["AI-gedreven leadscoring", "Automatisch je beste leads bovenaan"],
    [
      "Geautomatiseerde follow-up sequences",
      "De juiste boodschap op het juiste moment",
    ],
    [
      "Dagelijkse pipeline-intelligentie",
      "Elke ochtend een actieoverzicht",
    ],
    ["CRM-integratie", "Alles gekoppeld aan je bestaande tools"],
  ];

  for (const [title, desc] of features) {
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(C.brandBlue)
      .text("\u2022  ", 72, doc.y, { continued: true })
      .fillColor(C.nearBlack)
      .text(title, { continued: true })
      .font("Helvetica")
      .fillColor(C.gray500)
      .text(` \u2014 ${desc}`);
    doc.moveDown(0.3);
  }

  doc.moveDown(1.5);
  drawLine(doc, doc.y);
  doc.moveDown(1.5);

  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(C.nearBlack)
    .text("Plan een gratis strategiegesprek", { align: "center" });
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(C.gray500)
    .text("30 minuten. Geen verplichtingen. Concreet advies.", {
      align: "center",
    });

  doc.moveDown(1);
  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(C.brandBlue)
    .text("nicowaiboer.nl/strategiegesprek", { align: "center" });

  doc.moveDown(2);
  drawLine(doc, doc.y);
  doc.moveDown(1.5);

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(C.nearBlack)
    .text("Groet Nico", { align: "center" });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(C.brandBlue)
    .text("waibase.nl", { align: "center" });

  doc.moveDown(2);
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(C.gray400)
    .text(
      "\u00A9 2026 WaiBase \u2022 waibase.nl",
      { align: "center" }
    );

  doc.end();
  await done;

  const pdfBuffer = Buffer.concat(buffers);
  const pdfBase64 = pdfBuffer.toString("base64");

  return res.status(200).json({
    success: true,
    pdf_base64: pdfBase64,
    filename: `WaiBase-Sales-AI-Playbook-${firstName}.pdf`,
  });
}
