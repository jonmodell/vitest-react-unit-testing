#!/usr/bin/env node
// Runnable eval harness for the vitest-react-unit-testing skill.
//
// Run it FROM a project that has Vitest installed (e.g. one the skill just bootstrapped) — it
// borrows that project's vitest to run each produced test in an isolated temp dir.
//
//   node <skill>/evals/harness/run.mjs --list
//   node <skill>/evals/harness/run.mjs --case 01 --candidate ./my-priority.test.ts   # grade an existing test
//   node <skill>/evals/harness/run.mjs --agent                                        # produce+grade every case (needs `claude` CLI)
//   node <skill>/evals/harness/run.mjs --case 02 --agent
//
// Grader mode (--candidate) is deterministic and free. Agent mode (--agent) spawns a fresh
// headless agent per case to write the test, then grades it — that costs tokens.
//
// Grading each test has two halves: it must run GREEN on the correct fixture, and it must run RED
// on every buggy fixture in evals/mutants/<id>/ (a "surviving" mutant means the test asserts too
// little to catch that regression). Both must hold for a case to pass.

import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CASES } from "./cases.mjs";
import { runVitest, checkGreps, checkMutants } from "./grade.mjs";
import { writeReports } from "./report.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "..", "fixtures");
const MUTANTS = path.join(__dirname, "..", "mutants");
const REPO = process.cwd();
const TMP = path.join(REPO, ".evals-tmp");

function parseArgs() {
  const a = process.argv.slice(2);
  const val = (flag) => (a.indexOf(flag) >= 0 ? a[a.indexOf(flag) + 1] : undefined);
  return {
    list: a.includes("--list"),
    agent: a.includes("--agent"),
    caseId: val("--case"),
    candidate: val("--candidate"),
    out: val("--out"),
    model: val("--model"),
    provider: val("--provider"),
    producer: val("--producer"),
    golden: val("--golden"),
  };
}

const fixturesFor = (c) => c.fixtures ?? [c.fixture];

function prepCaseDir(id, c) {
  const dir = path.join(TMP, id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fixturesFor(c)) fs.copyFileSync(path.join(FIXTURES, f), path.join(dir, f));
  return dir;
}

const SKILL_MD = path.join(__dirname, "..", "..", "SKILL.md");

// Built-in provider presets. Each returns { cmd, args } WITHOUT the prompt (appended last as a
// positional). CLI flags evolve — override any of these with a raw `--producer` template.
const PRODUCERS = {
  claude: (model) => ({ cmd: "claude", args: ["-p", "--permission-mode", "acceptEdits", ...(model ? ["--model", model] : [])] }),
  openai: (model) => ({ cmd: "codex", args: ["exec", ...(model ? ["--model", model] : [])] }),
  gemini: (model) => ({ cmd: "gemini", args: ["--yolo", ...(model ? ["-m", model] : []), "-p"] }),
  // Copilot CLI: `-p` = non-interactive prompt; `--allow-all` runs tools (incl. file writes)
  // without approval — required for headless. `--model auto` or e.g. gpt-5.4.
  copilot: (model) => ({ cmd: "copilot", args: ["--allow-all", ...(model ? ["--model", model] : []), "-p"] }),
};

// The skill is injected into the prompt so NON-Claude providers (which don't auto-load it) still
// get the methodology — the eval measures the SKILL, so every provider must receive it.
function buildPrompt(c) {
  const skill = fs.readFileSync(SKILL_MD, "utf8");
  return `${skill}\n\n----- TASK -----\n${c.prompt} Write the test file in the current directory. Do not modify the fixture, then stop.`;
}

// Runs a producer, streaming stdout but CAPTURING stderr so a failure's real reason (e.g. an
// "inference HTTP 401" from the API) reaches the report, not just the step log.
function spawnCapture(cmd, args, opts) {
  try {
    execFileSync(cmd, args, { stdio: ["ignore", "inherit", "pipe"], ...opts });
  } catch (e) {
    throw new Error((e.stderr?.toString() ?? e.message ?? String(e)).trim());
  }
}

// Spawns a fresh producer in the case's temp dir to WRITE the test.
function produceWithAgent(dir, c, { provider = "claude", model, producer }) {
  // Custom command template — any CLI/SDK.
  if (producer) {
    const cmdline = producer
      .replaceAll("{model}", model ?? "")
      .replaceAll("{dir}", dir)
      .replaceAll("{prompt}", JSON.stringify(buildPrompt(c)));
    try {
      execSync(cmdline, { cwd: dir, stdio: ["ignore", "inherit", "pipe"] });
    } catch (e) {
      throw new Error((e.stderr?.toString() ?? e.message ?? String(e)).trim());
    }
    return;
  }
  // Agentic CLI providers (claude / openai-codex / gemini). For anything else — including a
  // Copilot CLI or a hosted API — use `--producer "<command template>"`.
  const preset = PRODUCERS[provider];
  if (!preset) throw new Error(`unknown --provider "${provider}" (use claude|openai|gemini|copilot, or --producer "<template>")`);
  const { cmd, args } = preset(model);
  spawnCapture(cmd, [...args, buildPrompt(c)], { cwd: dir });
}

// Best-effort record of exactly what produced the tests, for the report.
function producerVersion(provider, producer) {
  if (producer) return producer.split(/\s+/)[0];
  const cmd = PRODUCERS[provider]?.(undefined)?.cmd ?? provider;
  try {
    return `${cmd} ${execFileSync(cmd, ["--version"], { stdio: "pipe" }).toString().trim()}`;
  } catch {
    return `${cmd} (version unknown)`;
  }
}

const producedTestIn = (dir) => fs.readdirSync(dir).find((f) => /\.test\.tsx?$/.test(f));

function gradeCase(id, c, { candidate, agent, model, provider, producer }) {
  const dir = prepCaseDir(id, c);
  if (candidate) {
    if (!fs.existsSync(candidate)) return { id, pass: false, reasons: [`candidate not found: ${candidate}`] };
    fs.copyFileSync(path.resolve(candidate), path.join(dir, path.basename(candidate)));
  } else if (agent) {
    try {
      produceWithAgent(dir, c, { provider, model, producer });
    } catch (e) {
      const msg = (e.message ?? String(e)).trim().split("\n").filter(Boolean).slice(-2).join(" | ");
      return { id, pass: false, reasons: [`producer failed: ${msg.slice(0, 400)}`] };
    }
  } else {
    return { id, skip: "no candidate — pass --candidate <file> or --agent" };
  }

  const testFile = producedTestIn(dir);
  if (!testFile) return { id, pass: false, reasons: ["no *.test.ts was produced"] };

  const src = fs.readFileSync(path.join(dir, testFile), "utf8");
  const reasons = checkGreps(src, c);
  const rel = path.relative(REPO, path.join(dir, testFile));
  const { green, output } = runVitest(REPO, rel);
  if (!green) {
    reasons.push("vitest run FAILED:\n      " + output.trim().split("\n").slice(-10).join("\n      "));
  } else {
    // Test passes on correct code — now confirm it FAILS on each buggy fixture (rubric R2).
    for (const s of checkMutants(MUTANTS, id, REPO, dir, rel)) {
      reasons.push(`mutant survived (test stayed green on broken code): ${s}`);
    }
  }
  return { id, pass: green && reasons.length === 0, reasons };
}

function main() {
  const { list, agent, caseId, candidate, out, model, provider, producer, golden } = parseArgs();

  if (list) {
    for (const [id, c] of Object.entries(CASES)) console.log(`  ${id}  ${c.unit}`);
    return;
  }
  const ids = caseId ? [caseId] : Object.keys(CASES);
  if (candidate && ids.length !== 1) {
    console.error("--candidate requires exactly one --case <id>");
    process.exit(2);
  }
  if (ids.some((id) => !CASES[id])) {
    console.error(`unknown case; try --list`);
    process.exit(2);
  }

  // Golden mode: grade committed `<golden>/<id>.test.ts` per case — the free, deterministic CI gate.
  const goldenDir = golden ? path.resolve(golden) : null;
  const mode = candidate ? "grader" : goldenDir ? "golden" : agent ? "agent" : "dry";
  const prov = agent ? (provider ?? (producer ? "custom" : "claude")) : null;
  // CI provenance — present only under GitHub Actions; flows into report.json via the {...meta} spread
  // so every published run is self-identifying and links back to the Actions run that produced it.
  const env = process.env;
  const ci = env.GITHUB_ACTIONS
    ? {
        commit: (env.GITHUB_SHA ?? "").slice(0, 7),
        runUrl: `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`,
        ref: env.GITHUB_REF_NAME ?? null,
        actor: env.GITHUB_ACTOR ?? null,
        event: env.GITHUB_EVENT_NAME ?? null,
        workflow: env.GITHUB_WORKFLOW ?? null,
      }
    : {};
  const meta = {
    mode,
    ranAt: new Date().toISOString(),
    provider: prov,
    model: agent ? (model ?? "cli-default") : (model ?? null),
    producerVersion: agent ? producerVersion(provider ?? "claude", producer) : null,
    ...ci,
  };

  console.log(`\nvitest-react-unit-testing evals  (${mode} mode${prov ? `, ${prov} ${meta.model}` : ""})\n`);
  const results = [];
  let failed = 0;
  for (const id of ids) {
    const cand = goldenDir ? path.join(goldenDir, `${id}.test.ts`) : candidate;
    const r = { unit: CASES[id].unit, ...gradeCase(id, CASES[id], { candidate: cand, agent, model, provider, producer }) };
    results.push(r);
    if (r.skip) console.log(`  •  ${id}  SKIP — ${r.skip}`);
    else if (r.pass) console.log(`  ✓  ${id}  PASS`);
    else {
      failed++;
      console.log(`  ✗  ${id}  FAIL\n       ${r.reasons.join("\n       ")}`);
    }
  }
  fs.rmSync(TMP, { recursive: true, force: true });

  const outDir = path.resolve(out ?? "./eval-report");
  const { jsonPath, htmlPath } = writeReports(outDir, meta, results);
  console.log(`\n${failed ? `${failed} failed` : "all passed"}`);
  console.log(`report: ${path.relative(REPO, htmlPath)}  (+ ${path.basename(jsonPath)})\n`);
  process.exit(failed ? 1 : 0);
}

main();
