#!/usr/bin/env node
// Inference producer for GitHub Models. Single-shot: sends the skill + task to the Models API,
// extracts the returned test file, writes it into the current dir. Spawned by run.mjs (so the
// runner stays sync) and used by CI. Auth is the runner's GITHUB_TOKEN (needs `models: read`).
//
//   GITHUB_TOKEN=… SKILL_MD=/path/to/SKILL.md \
//     node github-models.mjs --model openai/gpt-4o --unit priority.ts "<task prompt>"
//
// Works with any OpenAI-compatible endpoint via --endpoint / GITHUB_MODELS_ENDPOINT.

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const val = (f) => (args.indexOf(f) >= 0 ? args[args.indexOf(f) + 1] : undefined);

const model = val("--model") ?? "openai/gpt-4o";
const unit = val("--unit");
const endpoint = val("--endpoint") ?? process.env.GITHUB_MODELS_ENDPOINT ?? "https://models.github.ai/inference/chat/completions";
const task = args[args.length - 1];
const token = process.env.GITHUB_TOKEN || process.env.GITHUB_MODELS_TOKEN;

if (!token) { console.error("GITHUB_TOKEN (or GITHUB_MODELS_TOKEN) is not set."); process.exit(3); }
if (!unit) { console.error("--unit <fixture file> is required."); process.exit(3); }

const base = unit.replace(/\.tsx?$/, "");
const unitSrc = fs.readFileSync(path.join(process.cwd(), unit), "utf8");
const skill = process.env.SKILL_MD && fs.existsSync(process.env.SKILL_MD) ? fs.readFileSync(process.env.SKILL_MD, "utf8") : "";

const messages = [
  { role: "system", content: `${skill}\n\nOutput ONLY one TypeScript Vitest test file inside a single \`\`\`ts code block. No explanation before or after.` },
  { role: "user", content: `${task}\nThe file under test is ./${base} — import it with a relative path. Its source:\n\n\`\`\`ts\n${unitSrc}\n\`\`\`` },
];

const res = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ model, messages, temperature: 0 }),
});
if (!res.ok) { console.error(`inference HTTP ${res.status}: ${await res.text()}`); process.exit(4); }

const data = await res.json();
const content = data.choices?.[0]?.message?.content ?? "";
const m = content.match(/```(?:ts|typescript|tsx|js|javascript)?\s*\n([\s\S]*?)```/);
const code = m ? `${m[1].trim()}\n` : content.includes("import") ? `${content.trim()}\n` : "";
if (!code) { console.error("No code block found in the model response."); process.exit(5); }

fs.writeFileSync(path.join(process.cwd(), `${base}.test.ts`), code);
console.log(`wrote ${base}.test.ts via ${model}`);
