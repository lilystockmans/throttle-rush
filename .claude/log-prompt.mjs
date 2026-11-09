// Prompt-logboek.
// Claude Code roept dit script aan via twee haken (zie .claude/settings.json):
//   "start" -> bij elke nieuwe prompt: bewaart prompt-tekst en starttijd.
//   "stop"  -> als Claude klaar is: schrijft een regel met de duur naar docs/PROMPT_LOG.md.
// De output van Claude wordt bewust NIET bewaard.

import fs from "node:fs";
import path from "node:path";

const mode = process.argv[2];
const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const pendingFile = path.join(root, ".claude", ".prompt-pending.json");
const logFile = path.join(root, "docs", "PROMPT_LOG.md");

const HEADER =
  "# Prompt-logboek\n\nAlleen prompts en duur. Geen output.\n\n" +
  "| Datum | Start | Einde | Duur | Wie | Prompt |\n|---|---|---|---|---|---|\n";

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

const pad = (n) => String(n).padStart(2, "0");
const dateOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeOf = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

function duration(ms) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}m ${pad(s % 60)}s`;
}

// Eén regel in een tabel: geen enters, geen losse | tekens.
function clean(text) {
  return String(text || "").replace(/\s+/g, " ").replace(/\|/g, "\\|").trim();
}

const input = readStdin();

if (mode === "start") {
  fs.writeFileSync(pendingFile, JSON.stringify({ start: Date.now(), prompt: input.prompt || "" }));
} else if (mode === "stop") {
  if (!fs.existsSync(pendingFile)) process.exit(0);
  const { start, prompt } = JSON.parse(fs.readFileSync(pendingFile, "utf8"));
  const s = new Date(start);
  const e = new Date();
  if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, HEADER);
  const row = `| ${dateOf(s)} | ${timeOf(s)} | ${timeOf(e)} | ${duration(e - s)} | Lily | ${clean(prompt)} |\n`;
  fs.appendFileSync(logFile, row);
  fs.unlinkSync(pendingFile);
}
