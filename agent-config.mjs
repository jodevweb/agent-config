#!/usr/bin/env node
// Agent Config Generator. Copyright (c) 2026 Jordan Usoulet. All rights reserved. Free to use: see LICENSE.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
// src/types.ts
var LLM_OPTIONS = [
	{
		id: "claude",
		label: "Claude",
		tool: "Claude Code"
	},
	{
		id: "openai",
		label: "GPT",
		tool: "Codex CLI"
	},
	{
		id: "gemini",
		label: "Gemini",
		tool: "Gemini CLI"
	},
	{
		id: "mistral",
		label: "Mistral",
		tool: "Mistral Vibe"
	},
	{
		id: "cursor",
		label: "Cursor",
		tool: "Cursor"
	},
	{
		id: "copilot",
		label: "Copilot",
		tool: "GitHub Copilot"
	},
	{
		id: "other",
		label: "Other / local",
		tool: "AGENTS.md (Zed, Aider, Ollama…)"
	}
];
var COMMAND_FIELDS = [
	{
		id: "install",
		label: "Install",
		placeholder: "npm install"
	},
	{
		id: "dev",
		label: "Run locally",
		placeholder: "npm run dev"
	},
	{
		id: "build",
		label: "Build",
		placeholder: "npm run build"
	},
	{
		id: "test",
		label: "Test",
		placeholder: "npm test"
	},
	{
		id: "lint",
		label: "Lint",
		placeholder: "npm run lint"
	},
	{
		id: "typecheck",
		label: "Type check",
		placeholder: "npx tsc --noEmit"
	},
	{
		id: "format",
		label: "Format",
		placeholder: "npx prettier --write ."
	}
];
var PLATFORM_KEYWORDS = {
	"claude-code": [
		"claude code",
		"claude code",
		".claude",
		"cloude.md",
		"prompt folder"
	],
	"multi": [
		"multi-platform",
		"multiculturel",
		"cross-platform",
		"polyvalent",
		"universal"
	],
	"langchain": [
		"langchain",
		"langgraph",
		"langfuse",
		"langsmith"
	],
	"crewai": [
		"crewai",
		"crew ai",
		"multi-agent",
		"agents multi",
		"collaboration"
	],
	"generic": []
};
var PROVIDER_KEYWORDS = {
	openai: [
		"openai",
		"gpt",
		"chatgpt",
		"o1",
		"o3"
	],
	anthropic: [
		"anthropic",
		"claude",
		"sonnet",
		"haiku",
		"opus"
	],
	google: [
		"google",
		"gemini",
		"bard"
	],
	mistral: ["mistral", "ministral"],
	local: [
		"ollama",
		"local",
		"llama",
		"open-source",
		"self-hosted"
	]
};
var CAPABILITY_KEYWORDS = {
	webSearch: [
		"web search",
		"search web",
		"recherche web",
		"moteur recherche",
		"exa",
		"brave",
		"tavily"
	],
	fileAccess: [
		"file access",
		"acces fichiers",
		"filesystem",
		"lecture fichier",
		"ecriture fichier"
	],
	mcpServers: [
		"mcp",
		"model context protocol",
		"server mcp",
		"tool server"
	],
	subagents: [
		"subagent",
		"sub-agent",
		"sous-agent",
		"specialized agent",
		"agent specialise"
	],
	testing: [
		"test",
		"testing",
		"ecrire tests",
		"verifier",
		"validation"
	],
	deployment: [
		"deploy",
		"deploiement",
		"release",
		"publish",
		"production"
	],
	securityAudit: [
		"security",
		"securite",
		"audit",
		"vulnerability",
		"sweep"
	],
	documentation: [
		"docs",
		"documentation",
		"documenter",
		"readme",
		"wikis"
	],
	codingConventions: [
		"convention",
		"style guide",
		"coding standard",
		"convention code"
	],
	commitConvention: [
		"commit",
		"conventional commit",
		"message commit"
	],
	pythonDeps: [
		"python",
		"requirements",
		"pip",
		"dependance python",
		"numpy",
		"pandas",
		"pytorch"
	],
	github: [
		"github",
		"pull request",
		"pull requests"
	]
};
var DEFAULT_SKILL_KEYWORDS = {
	codeReview: [
		"code review",
		"revue code",
		"review code",
		"audit code"
	],
	testWriting: [
		"test writing",
		"ecrire tests",
		"generation tests",
		"tests"
	],
	deploy: [
		"deploy",
		"deploiement",
		"release"
	],
	refactor: [
		"refactor",
		"refactoring",
		"refonte code"
	],
	documentation: [
		"docs",
		"documentation",
		"documenter"
	],
	securityAudit: [
		"security",
		"securite",
		"audit securit"
	]
};
var AGENT_ROLE_KEYWORDS = {
	"assistant": [
		"assistant",
		"aide",
		"helper"
	],
	"coder": [
		"coder",
		"developer",
		"developpeur",
		"programmation",
		"coding agent"
	],
	"researcher": [
		"research",
		"recherche",
		"explorer"
	],
	"writer": [
		"content writing",
		"technical writing",
		"redaction",
		"content writer"
	],
	"reviewer": [
		"review",
		"revue",
		"audit",
		"critique"
	],
	"coder-agent": [
		"coding agent",
		"agent de code",
		"developer agent",
		"agent developpeur"
	],
	"researcher-agent": [
		"researcher agent",
		"agent de recherche",
		"exploration agent"
	],
	"writer-agent": [
		"writer agent",
		"agent redacteur",
		"content agent"
	],
	"planner": [
		"planner",
		"planificateur",
		"roadmap",
		"strategie"
	],
	"executor": [
		"executor",
		"executeur",
		"run task",
		"tache runner"
	]
};
// src/engine/importer.ts
/** Files worth reading. Everything else is only used through its path. */
var INTERESTING_FILES = [
	"package.json",
	"pyproject.toml",
	"requirements.txt",
	"go.mod",
	"Cargo.toml",
	"Makefile",
	"README.md",
	"readme.md",
	"AGENTS.md",
	"CLAUDE.md",
	"GEMINI.md",
	".github/copilot-instructions.md",
	".cursorrules",
	".windsurfrules",
	".mcp.json",
	".cursor/mcp.json",
	".vscode/mcp.json",
	".gemini/settings.json",
	"CONTRIBUTING.md",
	"tsconfig.json",
	"eslint.config.js",
	"eslint.config.mjs",
	"biome.json",
	".editorconfig",
	"ruff.toml",
	"Dockerfile",
	"docker-compose.yml"
];
/** Files this tool can generate. Their current versions are read to show what an update changes. */
var AGENT_CONFIG_PATH = /* @__PURE__ */ new RegExp("^(AGENTS\\.md|CLAUDE\\.md|GEMINI\\.md|AGENT-SETUP\\.md|requirements\\.txt|\\.mcp\\.json|\\.claude/(settings\\.json|rules/[^/]+\\.md|skills/[^/]+/SKILL\\.md|agents/[^/]+\\.md)|\\.agents/skills/[^/]+/SKILL\\.md|\\.codex/config\\.toml|\\.gemini/(settings\\.json|commands/[^/]+\\.toml)|\\.vibe/config\\.toml|\\.cursor/mcp\\.json|\\.vscode/mcp\\.json|\\.github/copilot-instructions\\.md)$");
var isAgentConfigPath = (path) => AGENT_CONFIG_PATH.test(path);
/** Existing instruction files, in the order we prefer to reuse them. */
var INSTRUCTION_FILES = [
	"AGENTS.md",
	"CLAUDE.md",
	"GEMINI.md",
	".github/copilot-instructions.md",
	".cursorrules",
	".windsurfrules"
];
var MCP_FILES = [
	[".mcp.json", "mcpServers"],
	[".cursor/mcp.json", "mcpServers"],
	[".gemini/settings.json", "mcpServers"],
	[".vscode/mcp.json", "servers"]
];
/** Files that should not be read from a local folder even if their name matches. */
var IGNORED_DIRS = /(^|\/)(node_modules|\.git|dist|build|\.next|\.venv|venv|target|vendor|__pycache__)(\/|$)/;
function parseJson(text) {
	if (!text) return void 0;
	try {
		return JSON.parse(text.replace(/^﻿/, ""));
	} catch {
		return;
	}
}
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
var DEP_LABELS = [
	["next", "Next.js"],
	["react", "React"],
	["vue", "Vue"],
	["svelte", "Svelte"],
	["@angular/core", "Angular"],
	["astro", "Astro"],
	["vite", "Vite"],
	["express", "Express"],
	["fastify", "Fastify"],
	["@nestjs/core", "NestJS"],
	["hono", "Hono"],
	["electron", "Electron"],
	["react-native", "React Native"],
	["tailwindcss", "Tailwind CSS"],
	["prisma", "Prisma"],
	["drizzle-orm", "Drizzle"],
	["vitest", "Vitest"],
	["jest", "Jest"],
	["@playwright/test", "Playwright"],
	["cypress", "Cypress"],
	["eslint", "ESLint"],
	["oxlint", "Oxlint"],
	["@biomejs/biome", "Biome"],
	["prettier", "Prettier"]
];
var PY_LABELS = [
	[/\bdjango\b/i, "Django"],
	[/\bfastapi\b/i, "FastAPI"],
	[/\bflask\b/i, "Flask"],
	[/\bpandas\b/i, "pandas"],
	[/\btorch\b/i, "PyTorch"],
	[/\blangchain\b/i, "LangChain"],
	[/\bpytest\b/i, "pytest"],
	[/\bruff\b/i, "Ruff"],
	[/\bmypy\b/i, "mypy"],
	[/\bblack\b/i, "Black"]
];
function nodeFacts(files, paths, stack, commands) {
	const pkg = parseJson(files["package.json"]);
	if (!isRecord(pkg)) return;
	const pm = paths.has("pnpm-lock.yaml") ? "pnpm" : paths.has("yarn.lock") ? "yarn" : paths.has("bun.lockb") || paths.has("bun.lock") ? "bun" : "npm";
	const run = (script) => pm === "npm" ? `npm run ${script}` : pm === "bun" ? `bun run ${script}` : `${pm} ${script}`;
	const deps = {
		...isRecord(pkg.dependencies) ? pkg.dependencies : {},
		...isRecord(pkg.devDependencies) ? pkg.devDependencies : {}
	};
	stack.push(paths.has("tsconfig.json") || "typescript" in deps ? "TypeScript" : "JavaScript");
	const runtime = {
		...isRecord(pkg.dependencies) ? pkg.dependencies : {},
		...isRecord(pkg.peerDependencies) ? pkg.peerDependencies : {}
	};
	const serverOnly = /* @__PURE__ */ new Set([
		"express",
		"fastify",
		"@nestjs/core",
		"hono",
		"electron"
	]);
	for (const [dep, label] of DEP_LABELS) if (dep in (serverOnly.has(dep) ? runtime : deps)) stack.push(label);
	stack.push(pm);
	const scripts = isRecord(pkg.scripts) ? pkg.scripts : {};
	const has = (name) => typeof scripts[name] === "string";
	const first = (...names) => names.find(has);
	commands.install ??= pm === "yarn" ? "yarn" : `${pm} install`;
	const dev = first("dev", "start", "serve");
	if (dev) commands.dev ??= run(dev);
	if (has("build")) commands.build ??= run("build");
	if (has("test")) commands.test ??= pm === "npm" ? "npm test" : run("test");
	const lint = first("lint", "check");
	if (lint) commands.lint ??= run(lint);
	const typecheck = first("typecheck", "type-check", "tsc", "check-types");
	if (typecheck) commands.typecheck ??= run(typecheck);
	else if (paths.has("tsconfig.json")) commands.typecheck ??= "npx tsc --noEmit";
	const format = first("format", "fmt", "prettier");
	if (format) commands.format ??= run(format);
}
function pythonFacts(files, paths, stack, commands) {
	const pyproject = files["pyproject.toml"] ?? "";
	const requirements = files["requirements.txt"] ?? "";
	if (!pyproject && !requirements && !paths.has("setup.py")) return;
	stack.push("Python");
	const all = `${pyproject}\n${requirements}`;
	for (const [pattern, label] of PY_LABELS) if (pattern.test(all)) stack.push(label);
	const tool = paths.has("uv.lock") || /\[tool\.uv\]/.test(pyproject) ? "uv" : paths.has("poetry.lock") || /\[tool\.poetry\]/.test(pyproject) ? "poetry" : "pip";
	if (tool !== "pip") stack.push(tool);
	const exec = (cmd) => tool === "pip" ? cmd : `${tool} run ${cmd}`;
	commands.install ??= tool === "uv" ? "uv sync" : tool === "poetry" ? "poetry install" : requirements ? "pip install -r requirements.txt" : "pip install -e .";
	if (/\bpytest\b/i.test(all) || paths.has("pytest.ini") || paths.has("conftest.py")) commands.test ??= exec("pytest");
	if (/\bruff\b/i.test(all) || paths.has("ruff.toml")) {
		commands.lint ??= exec("ruff check .");
		commands.format ??= exec("ruff format .");
	} else if (/\bblack\b/i.test(all)) commands.format ??= exec("black .");
	if (/\bmypy\b/i.test(all)) commands.typecheck ??= exec("mypy .");
}
function otherFacts(files, paths, stack, commands) {
	if (paths.has("go.mod")) {
		stack.push("Go");
		commands.build ??= "go build ./...";
		commands.test ??= "go test ./...";
		commands.lint ??= paths.has(".golangci.yml") || paths.has(".golangci.yaml") ? "golangci-lint run" : "go vet ./...";
		commands.format ??= "gofmt -w .";
	}
	if (paths.has("Cargo.toml")) {
		stack.push("Rust");
		commands.build ??= "cargo build";
		commands.test ??= "cargo test";
		commands.lint ??= "cargo clippy";
		commands.format ??= "cargo fmt";
	}
	if (paths.has("Dockerfile") || paths.has("docker-compose.yml") || paths.has("compose.yaml")) stack.push("Docker");
	const makefile = files["Makefile"];
	if (makefile) {
		const targets = new Set([...makefile.matchAll(/^([a-zA-Z][\w-]*):/gm)].map((m) => m[1]));
		for (const key of [
			"install",
			"dev",
			"build",
			"test",
			"lint",
			"format"
		]) if (targets.has(key)) commands[key] ??= `make ${key}`;
	}
}
/** First real paragraph of the README, as a one-line project summary. */
function readmeSummary(readme) {
	if (!readme) return void 0;
	const paragraph = readme.replace(/<!--[\s\S]*?-->/g, "").split(/\n\s*\n/).map((p) => p.trim()).find((p) => p && !/^(#|!\[|\[!\[|<|```|---|\||>)/.test(p) && p.replace(/[^a-z]/gi, "").length > 30);
	if (!paragraph) return void 0;
	const text = paragraph.replace(/\s+/g, " ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
	return text.length > 280 ? `${text.slice(0, 277).replace(/\s+\S*$/, "")}…` : text;
}
/** Environment variable names. Anything else could carry newlines into TOML or markdown. */
function isSecretName(name) {
	return /^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(name);
}
var SECRET_FLAG = /^--?(token|api[-_]?key|key|secret|password|pass|auth|access[-_]?token|bearer)$/i;
var SECRET_VALUE = /(sk-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9]{8,}|github_pat_|xox[abp]-|sntrys_|Bearer\s+\S+|eyJ[A-Za-z0-9_-]{10,}\.)/;
var SECRET_INLINE = /^(--?[\w-]*(token|key|secret|password|auth)[\w-]*=).+$/i;
/** Hides values that look like credentials in command-line arguments. */
function redactArgs(args) {
	return args.map((arg, i) => {
		if (i > 0 && SECRET_FLAG.test(args[i - 1])) return "<redacted>";
		const inline = arg.match(SECRET_INLINE);
		if (inline) return `${inline[1]}<redacted>`;
		return SECRET_VALUE.test(arg) ? "<redacted>" : arg;
	});
}
/** Hides query parameters that look like credentials (?key=…, ?token=…). */
function redactUrl(url) {
	try {
		const parsed = new URL(url);
		for (const key of [...parsed.searchParams.keys()]) if (/key|token|secret|auth|password/i.test(key)) parsed.searchParams.set(key, "redacted");
		return parsed.toString();
	} catch {
		return url;
	}
}
/** Reads MCP servers from any known config format. Env values are dropped: only their names are kept. */
function importMcpServers(files) {
	const servers = [];
	const seen = /* @__PURE__ */ new Set();
	for (const [path, key] of MCP_FILES) {
		const json = parseJson(files[path]);
		if (!isRecord(json) || !isRecord(json[key])) continue;
		for (const [id, raw] of Object.entries(json[key])) {
			if (!isRecord(raw) || seen.has(id) || !/^[\w.-]{1,64}$/.test(id)) continue;
			const rawUrl = typeof raw.url === "string" ? raw.url : typeof raw.httpUrl === "string" ? raw.httpUrl : void 0;
			const url = rawUrl && /^https?:\/\//.test(rawUrl) ? redactUrl(rawUrl) : void 0;
			const command = typeof raw.command === "string" ? raw.command.replace(/[\r\n]+/g, " ") : void 0;
			if (!url && !command) continue;
			seen.add(id);
			const headerNames = isRecord(raw.headers) ? Object.keys(raw.headers) : [];
			servers.push({
				id,
				command,
				args: redactArgs(Array.isArray(raw.args) ? raw.args.filter((a) => typeof a === "string") : []),
				url,
				secrets: [...isRecord(raw.env) ? Object.keys(raw.env) : [], ...headerNames].filter(isSecretName),
				from: path
			});
		}
	}
	return servers;
}
/**
* MCP configs often hold real tokens in `env` or `headers`. Their values are replaced before
* the file is kept (the AI guide reads kept files). Unparseable configs are dropped entirely.
*/
function redactMcpFiles(files) {
	const safe = { ...files };
	const jsonPaths = /* @__PURE__ */ new Set([...MCP_FILES.map(([path]) => path), ...Object.keys(files).filter((p) => p.endsWith(".json") && isAgentConfigPath(p))]);
	for (const path of jsonPaths) {
		if (!(path in safe)) continue;
		const json = parseJson(safe[path]);
		if (!isRecord(json)) {
			delete safe[path];
			continue;
		}
		const redact = (value, key = "") => {
			if (Array.isArray(value)) return key === "args" ? redactArgs(value.filter((a) => typeof a === "string")) : value.map((v) => redact(v));
			if (typeof value === "string") return key === "url" || key === "httpUrl" ? redactUrl(value) : value;
			if (!isRecord(value)) return value;
			const isReference = (v) => typeof v === "string" && /^\$\{?[A-Za-z_][\w:.-]*\}?$/.test(v);
			return Object.fromEntries(Object.entries(value).map(([k, inner]) => ["env", "headers"].includes(k) && isRecord(inner) ? [k, Object.fromEntries(Object.entries(inner).map(([name, v]) => [name, isReference(v) ? v : "<redacted>"]))] : [k, redact(inner, k)]));
		};
		safe[path] = JSON.stringify(redact(json), null, 2);
	}
	return safe;
}
/** Same text as GENERATED_MARKER in targets.ts (not imported: the importer must not depend on the serialisers). */
var GENERATED_MARKER_PREFIX = "<!-- agent-config:";
/**
* A file we generated before: only the user's "Project notes" are theirs; demoted headings go back
* up one level, and the "Kept from…" line is dropped.
*/
function notesFromGenerated(content) {
	const match = content.match(/^## Project notes\n([\s\S]*?)(?=^## |^<!-- agent-config:|(?![\s\S]))/m);
	if (!match) return "";
	return match[1].replace(/^_Kept from the existing `[^`]+`\._\n?/m, "").replace(/^#(#{1,5} )/gm, "$1").trim();
}
/** Strips import lines (@AGENTS.md) and the generator's own headings from an existing file. */
function cleanInstructions(raw) {
	const content = raw.replace(/\r\n?/g, "\n");
	if (content.includes(GENERATED_MARKER_PREFIX)) return notesFromGenerated(content);
	return content.replace(/^---\n[\s\S]*?\n---\n/, "").split("\n").filter((line) => !/^@\S+\.md\s*$/.test(line.trim())).join("\n").trim().replace(/^# .*\n*/, "").replace(/\n{3,}/g, "\n\n").trim();
}
function analyzeRepository(source, allPaths, files, name) {
	const paths = new Set(allPaths);
	const stack = [];
	const commands = {};
	nodeFacts(files, paths, stack, commands);
	pythonFacts(files, paths, stack, commands);
	otherFacts(files, paths, stack, commands);
	const instructions = INSTRUCTION_FILES.filter((path) => files[path]?.trim()).map((path) => ({
		path,
		content: cleanInstructions(files[path])
	})).filter((entry) => entry.content.length > 0);
	const safe = redactMcpFiles(files);
	const existing = Object.fromEntries(Object.entries(safe).filter(([path]) => isAgentConfigPath(path)));
	return {
		source,
		name,
		summary: readmeSummary(files["README.md"] ?? files["readme.md"]),
		stack: [...new Set(stack)],
		commands,
		instructions,
		mcpServers: importMcpServers(files),
		read: Object.keys(files).filter((path) => INTERESTING_FILES.includes(path)).sort(),
		tree: allPaths.filter((path) => !IGNORED_DIRS.test(path)).sort(),
		files: Object.fromEntries(Object.entries(safe).filter(([path]) => INTERESTING_FILES.includes(path))),
		existing: Object.keys(existing).length ? existing : void 0
	};
}
var MAX_FILE_BYTES = 2e5;
/** A repository could hold hundreds of skills: only the first ones are compared. */
var MAX_AGENT_FILES = 80;
/** Which files to open: manifests and docs, plus the agent configs the repository already has. */
function pickFilesToRead(items, pathOf, sizeOf) {
	const small = items.filter((item) => sizeOf(item) <= MAX_FILE_BYTES);
	const known = small.filter((item) => INTERESTING_FILES.includes(pathOf(item)));
	const agent = small.filter((item) => !INTERESTING_FILES.includes(pathOf(item)) && isAgentConfigPath(pathOf(item))).slice(0, MAX_AGENT_FILES);
	return [...known, ...agent];
}
// src/engine/analyzer.ts
/** Lowercase, strip accents, and treat hyphens/underscores as spaces ("test-writing" == "test writing"). */
function normalize(text) {
	return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[-_]+/g, " ");
}
function escapeRegex(text) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/** True when `keyword` appears in `normalizedText` as whole words ("test" does not match "latest"). */
function mentions(normalizedText, keyword) {
	const kw = normalize(keyword).trim();
	if (!kw) return false;
	return new RegExp(`(^|[^a-z0-9.])${escapeRegex(kw)}($|[^a-z0-9])`).test(normalizedText);
}
function mentionsAny(normalizedText, keywords) {
	return keywords.some((kw) => mentions(normalizedText, kw));
}
function slugify(text) {
	return normalize(text).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}
/**
* Only an explicit name is used ("project name: foo", "called foo", "named foo", "projet foo");
* guessing from free text produced names like "for-automated-reviews".
*/
function detectProjectName(text) {
	for (const pattern of [/(?:project|projet)\s*(?:name|nom)?\s*[:=]\s*["'`]?([\w .-]+?)["'`]?(?:[,;\n]|$)/i, /(?:called|named|nomm[ée]e?|appel[ée]e?)\s+["'`]?([\w.-]+)/i]) {
		const match = text.match(pattern);
		const slug = match?.[1] ? slugify(match[1]) : "";
		if (slug) return slug;
	}
	return "my-agent-config";
}
function detectPlatform(lower) {
	const detected = [];
	for (const [platform, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
		if (platform === "generic") continue;
		if (mentionsAny(lower, keywords)) detected.push(platform);
	}
	if (detected.length === 0) detected.push("generic");
	return detected;
}
function detectAgentRole(lower) {
	for (const [role, keywords] of Object.entries(AGENT_ROLE_KEYWORDS)) if (mentionsAny(lower, keywords)) return role;
	const hasCoding = lower.includes("code") || lower.includes("developp") || lower.includes("programm");
	const hasResearch = lower.includes("research") || lower.includes("recherche") || lower.includes("explor");
	const hasWriting = lower.includes("content") || lower.includes("redact") || lower.includes("article");
	if (hasCoding && !hasResearch && !hasWriting) return "coder";
	if (hasResearch && !hasCoding && !hasWriting) return "researcher";
	if (hasWriting && !hasCoding && !hasResearch) return "writer";
	return null;
}
function detectCapabilities(lower) {
	const caps = Object.fromEntries(Object.entries(CAPABILITY_KEYWORDS).map(([cap, keywords]) => [cap, mentionsAny(lower, keywords)]));
	for (const [cap, keywords] of [
		["fileAccess", [
			"read file",
			"read files",
			"ecrire fichier",
			"modifier fichier"
		]],
		["webSearch", [
			"browser",
			"navigateur",
			"surfer web"
		]],
		["subagents", [
			"subagents",
			"sub agents",
			"sous agents",
			"specialize",
			"delegate"
		]]
	]) if (!caps[cap] && mentionsAny(lower, keywords)) caps[cap] = true;
	return caps;
}
function detectDefaultSkills(lower) {
	const skills = [];
	for (const [skill, keywords] of Object.entries(DEFAULT_SKILL_KEYWORDS)) if (mentionsAny(lower, keywords)) skills.push(skill);
	if (!skills.includes("codeReview") && mentions(lower, "improve")) skills.push("codeReview");
	if (!skills.includes("testWriting") && mentions(lower, "quality")) skills.push("testWriting");
	if (skills.length === 0) skills.push("codeReview", "documentation");
	return [...new Set(skills)];
}
/**
* Analyze a free-form prompt about agent configuration and extract structured intent.
*/
function analyzePrompt(prompt) {
	const lower = normalize(prompt);
	const providers = Object.entries(PROVIDER_KEYWORDS).filter(([, keywords]) => mentionsAny(lower, keywords)).map(([provider]) => provider);
	const frameworks = [];
	if (mentions(lower, "langchain")) frameworks.push("langchain");
	if (mentions(lower, "langgraph")) frameworks.push("langgraph");
	if (mentions(lower, "crewai") || mentions(lower, "multi agent")) frameworks.push("crewai");
	const preferredLanguage = mentionsAny(lower, [
		"francais",
		"en francais",
		"langue francaise"
	]) ? "fr" : "en";
	return {
		platforms: detectPlatform(lower),
		agentRole: detectAgentRole(lower),
		frameworks,
		providers,
		capabilities: detectCapabilities(lower),
		defaultSkills: detectDefaultSkills(lower),
		preferredLanguage,
		projectNameHint: detectProjectName(prompt)
	};
}
// src/engine/catalog.ts
var SKILLS = {
	codeReview: {
		name: "code-review",
		description: "Review code changes for correctness, security and conventions. Use when asked to review a diff, a pull request or a file.",
		body: `# Code review

1. **Scope**: list the files and areas the change touches.
2. **Logic**: look for bugs, unhandled edge cases and broken error paths.
3. **Conventions**: check consistency with the project's existing patterns.
4. **Security**: injection, XSS, secrets in code, missing authorization checks.
5. **Performance**: needless work in hot paths, N+1 queries, large allocations.

Report each finding as: severity (critical / warning / suggestion), file and line, what is wrong, why it matters, and a concrete fix. Order findings by severity.`
	},
	testWriting: {
		name: "test-writing",
		description: "Write and run tests for new or existing code. Use when asked to add tests, raise coverage or reproduce a bug with a test.",
		body: `# Test writing

1. Read the code under test and identify its public behaviour.
2. List the cases: nominal, invalid input, edge cases, error paths.
3. Write the tests with the project's existing framework (detect it from the config, do not add a new one).
   - Arrange / Act / Assert, one behaviour per test.
   - Test names that read as sentences: \`it('rejects an expired token')\`.
4. Run the tests and report the results; fix flaky or order-dependent tests.
5. Point out important behaviour that is still untested.`
	},
	deploy: {
		name: "deploy",
		description: "Prepare and run a release or deployment. Use when asked to deploy, release, publish or ship.",
		body: `# Deploy

1. Pre-flight: tests pass, type check and lint are clean, working tree is committed, version is bumped.
2. Build the artefacts and check they are complete.
3. Deploy to staging first and run smoke tests.
4. Deploy to production only after explicit confirmation from the user; write down the rollback command first.
5. Summarise what was deployed, where, and what to watch (logs, metrics, alerts).`
	},
	refactor: {
		name: "refactor",
		description: "Restructure code without changing its behaviour. Use when asked to refactor, clean up or simplify code.",
		body: `# Refactor

1. Make sure tests cover the code first; if not, add characterisation tests.
2. Look for duplication, deep nesting, long functions and inconsistent patterns.
3. Propose the plan before large changes.
4. Apply small, behaviour-preserving steps and run the tests after each one.
5. Explain what changed and why.`
	},
	documentation: {
		name: "documentation",
		description: "Write or update project documentation (README, API reference, guides). Use when asked to document something.",
		body: `# Documentation

1. Decide the kind of document: README, API reference, developer guide or user guide.
2. Read the code and the existing docs; never document behaviour you have not checked.
3. Write with clear headings, short paragraphs and runnable examples.
4. Link related documents instead of duplicating them.
5. Re-read for accuracy against the current code.`
	},
	securityAudit: {
		name: "security-audit",
		description: "Audit code, dependencies and configuration for vulnerabilities. Use when asked for a security review or audit.",
		body: `# Security audit

1. Dependencies: run the ecosystem audit tool (\`npm audit\`, \`pip-audit\`…) and list known CVEs.
2. Code: hardcoded secrets, injection (SQL, shell, template), XSS, unsafe deserialisation, \`eval\`.
3. Configuration: secret handling, CORS, security headers, access control.
4. Report by severity (critical → low) with a concrete remediation for each finding.`
	},
	debugging: {
		name: "debugging",
		description: "Find the root cause of a bug before fixing it. Use when something fails, crashes or behaves differently than expected.",
		body: `# Debugging

1. Reproduce: get the exact error, input and steps; write them down.
2. Isolate: narrow down to the smallest failing case (bisect commits, inputs or code paths).
3. Explain: state the root cause in one sentence and check it against the evidence.
4. Fix the cause, not the symptom, and add a test that fails without the fix.
5. Report what was wrong, why, and how the test proves it is fixed.

Never paper over an error with a try/catch or a retry without understanding it.`
	},
	performance: {
		name: "performance",
		description: "Measure and improve speed or memory use. Use when something is slow, heavy or times out.",
		body: `# Performance

1. Measure first with a reproducible benchmark or profile; record the baseline numbers.
2. Find the actual hot spot; do not optimise code that is not on the critical path.
3. Change one thing at a time and measure again.
4. Keep the change only if the numbers improve and behaviour is unchanged (tests pass).
5. Report before/after numbers and the command that produced them.`
	},
	accessibility: {
		name: "accessibility",
		description: "Check user interfaces for accessibility issues (keyboard, screen readers, contrast). Use when building or reviewing UI.",
		body: `# Accessibility review

- Every interactive element is reachable and usable with the keyboard, with a visible focus.
- Form fields have labels; images have meaningful alt text (or empty alt when decorative).
- Text contrast meets WCAG AA (4.5:1, 3:1 for large text).
- Use native elements (button, a, input, dialog) before ARIA; ARIA must not contradict them.
- Motion respects prefers-reduced-motion; nothing flashes.
- Report each issue with the element, the WCAG criterion and the fix.`
	},
	migrations: {
		name: "database-migrations",
		description: "Write safe database schema migrations. Use when changing tables, columns or indexes.",
		body: `# Database migrations

1. Never edit a migration that has already run in a shared environment; add a new one.
2. Make changes backward compatible: add, backfill, switch reads, then remove in a later release.
3. Avoid long locks on big tables (create indexes concurrently, batch backfills).
4. Every migration has a tested way back (down migration or documented rollback).
5. Ask before running a migration against anything other than a local database.`
	},
	dependencyUpgrade: {
		name: "dependency-upgrade",
		description: "Upgrade dependencies safely. Use when asked to update packages, fix vulnerable versions or move to a new major version.",
		body: `# Dependency upgrade

1. Read the changelog and migration guide of each major upgrade before changing code.
2. Upgrade one package (or one tightly coupled group) at a time.
3. Run the build, type check and tests after each step; fix breakages before continuing.
4. Update the lockfile with the project's package manager; never edit it by hand.
5. Summarise what changed, breaking changes handled, and anything left to check manually.`
	},
	prDescription: {
		name: "pr-description",
		description: "Write a clear pull request description from the current changes. Use when opening or updating a pull request.",
		body: `# Pull request description

Read the diff, then write:

- **What**: one or two sentences on the change, in user-visible terms.
- **Why**: the problem it solves or the issue it closes.
- **How to test**: exact steps or commands.
- **Risks**: migrations, config changes, behaviour changes, anything reviewers should look at first.

Keep it short; do not paste the diff back.`
	},
	explainCodebase: {
		name: "explain-codebase",
		description: "Explain how part of the codebase works, for onboarding. Use when asked how something works or where something lives.",
		body: `# Explain the codebase

1. Find the entry points for the question (routes, main, CLI commands, exported functions).
2. Trace the path of one real request or action through the code.
3. Explain it top-down: the big picture first, then the files involved, with paths.
4. Point out the non-obvious parts: conventions, side effects, configuration.
5. Only describe code you have read; say when you are unsure.`
	},
	factCheck: {
		name: "fact-check",
		description: "Check claims in a document against reliable sources. Use for articles, docs or reports before publishing.",
		body: `# Fact check

1. List every factual claim: numbers, dates, names, quotes, cause-and-effect statements.
2. For each, find a primary or reputable source; note the link.
3. Mark each claim as confirmed, wrong (with the correction) or unverifiable.
4. Never invent a source; if nothing confirms a claim, say so.
5. Return the list, then the corrected text.`
	}
};
var RULES = {
	codingConventions: {
		name: "coding-conventions",
		title: "Coding conventions",
		body: `- Follow the patterns already used in the codebase before introducing new ones.
- Prefer simple, readable code over clever code.
- Names: \`camelCase\` for JS/TS variables and functions, \`snake_case\` in Python, \`PascalCase\` for classes, \`UPPER_SNAKE_CASE\` for constants.
- Use specific error types, log errors with context, never swallow exceptions silently.
- Add or update tests alongside behaviour changes.`
	},
	commitConventions: {
		name: "commit-conventions",
		title: "Commit conventions",
		body: `Use [Conventional Commits](https://www.conventionalcommits.org/): \`<type>(<scope>): <description>\`.

- Types: \`feat\`, \`fix\`, \`docs\`, \`style\`, \`refactor\`, \`test\`, \`chore\`.
- Imperative mood, lowercase, no trailing period: \`fix(api): correct pagination offset\`.
- Reference issues when relevant (\`#123\`).`
	},
	securityRules: {
		name: "security-rules",
		title: "Security rules",
		body: `- Never commit secrets, API keys or credentials; read them from environment variables.
- Validate all external input; use parameterised queries.
- Never call \`eval()\` / \`Function()\` on user input.
- Do not log sensitive data or expose stack traces in production.
- Pin dependency versions and audit them before releasing.`
	}
};
var MCP_SERVERS = {
	webSearch: {
		id: "brave-search",
		description: "Web search via the Brave Search API",
		command: "npx",
		args: ["-y", "@brave/brave-search-mcp-server"],
		secrets: ["BRAVE_API_KEY"]
	},
	fileAccess: {
		id: "filesystem",
		description: "Read and write files inside the project folder",
		command: "npx",
		args: [
			"-y",
			"@modelcontextprotocol/server-filesystem",
			"."
		],
		secrets: []
	},
	github: {
		id: "github",
		description: "GitHub issues, pull requests and code (official GitHub MCP server)",
		command: "docker",
		args: [
			"run",
			"-i",
			"--rm",
			"-e",
			"GITHUB_PERSONAL_ACCESS_TOKEN",
			"ghcr.io/github/github-mcp-server"
		],
		secrets: ["GITHUB_PERSONAL_ACCESS_TOKEN"]
	},
	playwright: {
		id: "playwright",
		description: "Drive a real browser: open pages, click, fill forms, take screenshots (Microsoft Playwright)",
		command: "npx",
		args: ["@playwright/mcp@latest"],
		secrets: []
	},
	chromeDevtools: {
		id: "chrome-devtools",
		description: "Inspect a page in Chrome: console, network, performance traces (needs Node 22+)",
		command: "npx",
		args: ["-y", "chrome-devtools-mcp@latest"],
		secrets: []
	},
	context7: {
		id: "context7",
		description: "Up-to-date documentation for libraries and frameworks (Context7)",
		command: "npx",
		args: ["-y", "@upstash/context7-mcp"],
		secrets: []
	},
	fetch: {
		id: "fetch",
		description: "Fetch a web page and convert it to markdown (needs uv)",
		command: "uvx",
		args: ["mcp-server-fetch"],
		secrets: []
	},
	memory: {
		id: "memory",
		description: "A local knowledge graph the agent can remember facts in across sessions",
		command: "npx",
		args: ["-y", "@modelcontextprotocol/server-memory"],
		secrets: []
	},
	supabase: {
		id: "supabase",
		description: "Query and manage a Supabase project, read-only by default",
		command: "npx",
		args: [
			"-y",
			"@supabase/mcp-server-supabase@latest",
			"--read-only"
		],
		secrets: ["SUPABASE_ACCESS_TOKEN"]
	},
	sentry: {
		id: "sentry",
		description: "Look up Sentry issues and errors (signs in with your Sentry account)",
		url: "https://mcp.sentry.dev/mcp",
		secrets: []
	},
	linear: {
		id: "linear",
		description: "Read and update Linear issues (signs in with your Linear account)",
		url: "https://mcp.linear.app/mcp",
		secrets: []
	},
	notion: {
		id: "notion",
		description: "Search and edit Notion pages (signs in with your Notion account)",
		url: "https://mcp.notion.com/mcp",
		secrets: []
	},
	stripe: {
		id: "stripe",
		description: "Stripe customers, payments and docs (signs in with your Stripe account)",
		url: "https://mcp.stripe.com",
		secrets: []
	},
	vercel: {
		id: "vercel",
		description: "Vercel projects, deployments and logs (signs in with your Vercel account)",
		url: "https://mcp.vercel.com",
		secrets: []
	}
};
var SUBAGENTS = {
	codeReviewer: {
		name: "code-reviewer",
		description: "Reviews code changes for bugs, security issues and convention drift. Use proactively after significant edits.",
		tools: [
			"Read",
			"Grep",
			"Glob"
		],
		prompt: `You are a senior code reviewer. Read the changed code, then report concrete findings with file and line, ordered by severity. Explain why each one matters and how to fix it. Do not edit files.`
	},
	testWriter: {
		name: "test-writer",
		description: "Writes and runs tests for a given module or change.",
		tools: [
			"Read",
			"Write",
			"Edit",
			"Bash",
			"Grep",
			"Glob"
		],
		prompt: `You are a testing engineer. Use the project's existing test framework, cover nominal, edge and error cases, run the tests, and report what passes, what fails and what is still untested.`
	},
	researcher: {
		name: "researcher",
		description: "Researches a question on the web and returns a sourced summary.",
		tools: [
			"WebSearch",
			"WebFetch",
			"Read"
		],
		prompt: `You are a research analyst. Search several reliable sources, cross-check facts, and return a concise summary with a link for every claim. Flag anything you could not verify.`
	},
	debugger: {
		name: "debugger",
		description: "Investigates a failing test or bug and reports the root cause with evidence. Use when something breaks.",
		tools: [
			"Read",
			"Grep",
			"Glob",
			"Bash"
		],
		prompt: `You investigate bugs. Reproduce the failure, narrow it down, and report the root cause with the evidence (file, line, command output). Propose a fix but do not apply it unless asked.`
	},
	docsWriter: {
		name: "docs-writer",
		description: "Writes or updates documentation for a change. Use after a feature is done.",
		tools: [
			"Read",
			"Write",
			"Edit",
			"Grep",
			"Glob"
		],
		prompt: `You write documentation. Read the code you document, follow the existing docs style, keep examples runnable, and never describe behaviour you have not checked in the code.`
	}
};
function importedToServer(server) {
	return {
		id: server.id,
		description: `Imported from ${server.from}`,
		command: server.command,
		args: server.args,
		url: server.url,
		secrets: server.secrets
	};
}
/** Options shown in the UI, grouped and in display order. */
var SKILL_OPTIONS = [
	{
		id: "codeReview",
		label: "Code review",
		hint: "Review diffs for bugs, security and style",
		group: "Code quality"
	},
	{
		id: "testWriting",
		label: "Test writing",
		hint: "Write and run tests with your framework",
		group: "Code quality"
	},
	{
		id: "debugging",
		label: "Debugging",
		hint: "Root cause first, then a fix with a test",
		group: "Code quality"
	},
	{
		id: "refactor",
		label: "Refactor",
		hint: "Restructure code without changing behaviour",
		group: "Code quality"
	},
	{
		id: "performance",
		label: "Performance",
		hint: "Measure, change one thing, measure again",
		group: "Code quality"
	},
	{
		id: "securityAudit",
		label: "Security audit",
		hint: "Dependencies, secrets, injections",
		group: "Code quality"
	},
	{
		id: "accessibility",
		label: "Accessibility",
		hint: "Keyboard, screen readers, contrast",
		group: "Code quality"
	},
	{
		id: "deploy",
		label: "Deploy",
		hint: "Release checklist, asks before production",
		group: "Shipping"
	},
	{
		id: "prDescription",
		label: "Pull request description",
		hint: "What, why, how to test, risks",
		group: "Shipping"
	},
	{
		id: "dependencyUpgrade",
		label: "Dependency upgrade",
		hint: "One package at a time, tests after each",
		group: "Shipping"
	},
	{
		id: "migrations",
		label: "Database migrations",
		hint: "Backward compatible, with a way back",
		group: "Shipping"
	},
	{
		id: "documentation",
		label: "Documentation",
		hint: "README, API reference, guides",
		group: "Docs & knowledge"
	},
	{
		id: "explainCodebase",
		label: "Explain the codebase",
		hint: "Onboarding: how things work and where",
		group: "Docs & knowledge"
	},
	{
		id: "factCheck",
		label: "Fact check",
		hint: "Check claims against sources before publishing",
		group: "Docs & knowledge"
	}
];
var MCP_OPTIONS = [
	{
		id: "github",
		label: "GitHub",
		hint: "Issues and pull requests. Needs Docker and a token.",
		group: "Code & repos"
	},
	{
		id: "fileAccess",
		label: "File system",
		hint: "Read and write files in the project folder",
		group: "Code & repos"
	},
	{
		id: "context7",
		label: "Library docs (Context7)",
		hint: "Current docs for the libraries you use",
		group: "Code & repos"
	},
	{
		id: "playwright",
		label: "Browser (Playwright)",
		hint: "Open pages, click, fill forms, screenshots",
		group: "Browser & web"
	},
	{
		id: "chromeDevtools",
		label: "Chrome DevTools",
		hint: "Console, network and performance traces",
		group: "Browser & web"
	},
	{
		id: "webSearch",
		label: "Web search (Brave)",
		hint: "Needs a BRAVE_API_KEY",
		group: "Browser & web"
	},
	{
		id: "fetch",
		label: "Fetch pages",
		hint: "Turn a web page into markdown. Needs uv.",
		group: "Browser & web"
	},
	{
		id: "memory",
		label: "Memory",
		hint: "Remember facts across sessions, stored locally",
		group: "Browser & web"
	},
	{
		id: "sentry",
		label: "Sentry",
		hint: "Errors and issues. Signs in on first use.",
		group: "Services"
	},
	{
		id: "linear",
		label: "Linear",
		hint: "Issues and projects. Signs in on first use.",
		group: "Services"
	},
	{
		id: "notion",
		label: "Notion",
		hint: "Pages and databases. Signs in on first use.",
		group: "Services"
	},
	{
		id: "supabase",
		label: "Supabase",
		hint: "Database, read-only. Needs SUPABASE_ACCESS_TOKEN.",
		group: "Services"
	},
	{
		id: "stripe",
		label: "Stripe",
		hint: "Payments and customers. Signs in on first use.",
		group: "Services"
	},
	{
		id: "vercel",
		label: "Vercel",
		hint: "Deployments and logs. Signs in on first use.",
		group: "Services"
	}
];
var RULE_OPTIONS = [
	{
		id: "codingConventions",
		label: "Coding conventions",
		hint: "Follow existing patterns, naming, error handling",
		group: "Rules"
	},
	{
		id: "commitConventions",
		label: "Commit conventions",
		hint: "Conventional Commits format",
		group: "Rules"
	},
	{
		id: "securityRules",
		label: "Security rules",
		hint: "No secrets in code, validate input, no eval",
		group: "Rules"
	}
];
var SUBAGENT_OPTIONS = [
	{
		id: "codeReviewer",
		label: "Code reviewer",
		hint: "Reviews changes, never edits",
		group: "Subagents"
	},
	{
		id: "testWriter",
		label: "Test writer",
		hint: "Writes and runs tests",
		group: "Subagents"
	},
	{
		id: "debugger",
		label: "Debugger",
		hint: "Finds root causes with evidence",
		group: "Subagents"
	},
	{
		id: "docsWriter",
		label: "Docs writer",
		hint: "Documents finished features",
		group: "Subagents"
	},
	{
		id: "researcher",
		label: "Researcher",
		hint: "Sourced web research",
		group: "Subagents"
	}
];
var SKILL_IDS = SKILL_OPTIONS.map((o) => o.id);
/** Rules that follow from the chosen skills when the user has not picked rules explicitly. */
function defaultRules(skills, intent) {
	const caps = intent.capabilities;
	const rules = [];
	if (caps.codingConventions || skills.includes("codeReview")) rules.push("codingConventions");
	if (caps.commitConvention || skills.includes("deploy") || skills.includes("prDescription")) rules.push("commitConventions");
	if (caps.securityAudit || skills.includes("securityAudit")) rules.push("securityRules");
	return rules;
}
function selectionFromIntent(intent) {
	const caps = intent.capabilities;
	const mcp = [];
	if (caps.mcpServers || caps.github) {
		if (caps.webSearch) mcp.push("webSearch");
		if (caps.fileAccess) mcp.push("fileAccess");
		if (caps.github) mcp.push("github");
	}
	const skills = SKILL_IDS.filter((id) => intent.defaultSkills.includes(id));
	const subagents = [];
	if (caps.subagents) {
		const role = intent.agentRole;
		if (skills.includes("codeReview") || role === "reviewer") subagents.push("codeReviewer");
		if (skills.includes("testWriting") || role === "coder-agent") subagents.push("testWriter");
		if (role === "researcher" || role === "researcher-agent") subagents.push("researcher");
		if (subagents.length === 0) subagents.push("codeReviewer");
	}
	return {
		skills,
		mcp,
		subagents,
		python: caps.pythonDeps
	};
}
/** Turn a selection into concrete building blocks. */
function selectCatalog(selection, intent, imported = []) {
	const skills = SKILL_IDS.filter((id) => selection.skills.includes(id)).map((id) => SKILLS[id]);
	const ruleIds = selection.rules ?? defaultRules(selection.skills, intent);
	const rules = RULE_OPTIONS.map((o) => o.id).filter((id) => ruleIds.includes(id)).map((id) => RULES[id]);
	const importedIds = new Set(imported.map((s) => s.id));
	return {
		skills,
		rules,
		mcpServers: [...MCP_OPTIONS.map((o) => o.id).filter((id) => selection.mcp.includes(id)).map((id) => MCP_SERVERS[id]).filter((server) => !importedIds.has(server.id)), ...imported.filter((s) => selection.mcp.includes(s.id))],
		subagents: SUBAGENT_OPTIONS.map((o) => o.id).filter((id) => selection.subagents.includes(id)).map((id) => SUBAGENTS[id])
	};
}
// src/engine/targets.ts
/** Basic TOML string; JSON escaping is a valid subset for the characters we emit. */
var tomlString = (value) => JSON.stringify(value);
var tomlArray = (values) => `[${values.map(tomlString).join(", ")}]`;
/** YAML double-quoted scalar: JSON strings are valid YAML, so colons or quotes cannot break the frontmatter. */
var yamlString = (value) => JSON.stringify(value);
var json = (value) => JSON.stringify(value, null, 2) + "\n";
var join$1 = (...sections) => sections.filter(Boolean).join("\n\n") + "\n";
function frontmatter(fields) {
	return `---\n${Object.entries(fields).map(([key, value]) => `${key}: ${value}`).join("\n")}\n---\n`;
}
function skillFile(skill) {
	return `${frontmatter({
		name: skill.name,
		description: yamlString(skill.description)
	})}\n${skill.body}\n`;
}
/** Push every heading one level down so imported text nests under our own headings. */
function demoteHeadings(markdown) {
	let fence = null;
	const lines = markdown.split("\n").map((line) => {
		const marker = line.match(/^\s*(```|~~~)/)?.[1];
		if (marker && (fence === null || fence === marker)) fence = fence ? null : marker;
		return fence === null && /^#{1,5} /.test(line) ? `#${line}` : line;
	});
	if (fence) lines.push(fence);
	return lines.join("\n");
}
function commandsSection(commands) {
	const lines = COMMAND_FIELDS.filter((field) => commands[field.id]?.trim()).map((field) => `- ${field.label}: \`${commands[field.id].trim()}\``);
	return lines.length ? `## Commands\n\n${lines.join("\n")}` : "";
}
function doneSection(commands) {
	const checks = [
		"test",
		"lint",
		"typecheck"
	].map((id) => commands[id]?.trim()).filter((cmd) => Boolean(cmd)).map((cmd) => `\`${cmd}\``);
	const run = checks.length ? `run ${checks.join(", ")} and fix what fails` : "run the tests and the linter";
	return `## Before you say a task is done

- ${run[0].toUpperCase()}${run.slice(1)}.
- Ask before making breaking or irreversible changes (migrations, deletions, force pushes).
- Keep diffs small and focused; explain what changed and why.`;
}
function existingSection(ctx) {
	if (!ctx.keepExisting || !ctx.facts?.instructions.length) return "";
	const [first] = ctx.facts.instructions;
	return `## Project notes\n\n_Kept from the existing \`${first.path}\`._\n\n${demoteHeadings(first.content)}`;
}
function headerSection(ctx) {
	const { intent, facts } = ctx;
	const parts = [`# ${intent.projectNameHint}`];
	parts.push("", facts?.summary ?? "Instructions for AI coding agents working in this repository.");
	const stack = [.../* @__PURE__ */ new Set([...facts?.stack ?? [], ...intent.frameworks])];
	if (stack.length) parts.push("", "## Stack", "", stack.join(", "));
	if (intent.agentRole) parts.push("", "## Role", "", `Act as a **${intent.agentRole}** for this project.`);
	return parts.join("\n");
}
function guideSection(guide) {
	if (!guide) return "";
	const parts = [`## Project overview\n\n${guide.overview}`];
	if (guide.architecture.length) parts.push(`## Where things live\n\n${guide.architecture.map((a) => `- \`${a.path}\` — ${a.purpose}`).join("\n")}`);
	if (guide.conventions.length) parts.push(`## Project conventions\n\n${guide.conventions.map((c) => `- ${c}`).join("\n")}`);
	if (guide.pitfalls.length) parts.push(`## Watch out for\n\n${guide.pitfalls.map((p) => `- ${p}`).join("\n")}`);
	parts.push(`_The sections above were drafted by ${guide.model} from the repository. Review them before committing._`);
	return parts.join("\n\n");
}
function rulesInline(rules) {
	return rules.map((rule) => `## ${rule.title}\n\n${rule.body}`).join("\n\n");
}
function mcpNote(servers) {
	if (!servers.length) return "";
	const lines = servers.map((s) => `- **${s.id}**: ${s.description}`);
	const secrets = [...new Set(servers.flatMap((s) => s.secrets))];
	const secretLine = secrets.length ? `\n\nSet these environment variables before starting the agent (never commit them): ${secrets.map((s) => `\`${s}\``).join(", ")}.` : "";
	return `## MCP servers\n\n${lines.join("\n")}${secretLine}`;
}
function skillsSection(skills, mode) {
	if (!skills.length) return "";
	if (mode === "slash") return "## Skills\n\n" + skills.map((s) => `- \`/${s.name}\` — ${s.description}`).join("\n");
	if (mode === "paths") return "## Skills\n\nReusable workflows live in `.agents/skills/`. Read the matching `SKILL.md` before starting such a task:\n\n" + skills.map((s) => `- \`.agents/skills/${s.name}/SKILL.md\` — ${s.description}`).join("\n");
	return "## Workflows\n\n" + skills.map((s) => `### ${s.name}\n\n_${s.description}_\n\n${s.body.replace(/^# .*\n+/, "")}`).join("\n\n");
}
/**
* Invisible marker at the end of generated instruction files. When such a file is imported
* again, only its "Project notes" are reused: the rest is ours and gets regenerated, so an
* update never nests the previous output inside the new one.
*/
var GENERATED_MARKER = "<!-- agent-config: this file is regenerated on update; only your notes section is kept -->";
/** The instruction document. Same content for every agent; only the skills part changes. */
function instructions(ctx, skills, withRules = true) {
	return join$1(headerSection(ctx), guideSection(ctx.guide), commandsSection(ctx.commands), doneSection(ctx.commands), existingSection(ctx), withRules ? rulesInline(ctx.catalog.rules) : "", skillsSection(ctx.catalog.skills, skills), mcpNote(ctx.catalog.mcpServers), GENERATED_MARKER);
}
/** `{ command, args, env }` or `{ url }` objects shared by the JSON formats. */
function jsonServers(servers, envRef, remote) {
	return Object.fromEntries(servers.map((s) => [s.id, s.url ? remote(s.url) : {
		command: s.command,
		args: s.args ?? [],
		...s.secrets.length ? { env: Object.fromEntries(s.secrets.map((k) => [k, envRef(k)])) } : {}
	}]));
}
function agentsMdFiles(ctx, targets) {
	const files = [{
		path: "AGENTS.md",
		content: instructions(ctx, "paths"),
		description: "Project instructions (AGENTS.md open standard)",
		targets
	}];
	for (const skill of ctx.catalog.skills) files.push({
		path: `.agents/skills/${skill.name}/SKILL.md`,
		content: skillFile(skill),
		description: `Skill: ${skill.name}`,
		targets
	});
	return files;
}
function claudeSubagent(agent) {
	return `${frontmatter({
		name: agent.name,
		description: yamlString(agent.description),
		tools: agent.tools.join(", ")
	})}\n${agent.prompt}\n`;
}
function claudeFiles(ctx, sharesAgentsMd) {
	const { intent, catalog, commands } = ctx;
	const targets = ["claude"];
	const files = [];
	const body = sharesAgentsMd ? join$1("# Claude Code", "Shared project instructions:", "@AGENTS.md", skillsSection(catalog.skills, "slash"), GENERATED_MARKER) : instructions(ctx, "slash", false);
	files.push({
		path: "CLAUDE.md",
		content: body,
		description: "Project memory, loaded at every Claude Code session",
		targets
	});
	const allow = [
		"Bash(git status)",
		"Bash(git diff:*)",
		"Bash(git log:*)"
	];
	for (const id of [
		"test",
		"lint",
		"typecheck",
		"build",
		"format"
	]) {
		const cmd = commands[id]?.trim();
		if (cmd) allow.push(`Bash(${cmd}:*)`);
	}
	if (!commands.test && intent.capabilities.testing) allow.push("Bash(npm test:*)", "Bash(npm run test:*)");
	if (intent.capabilities.webSearch) allow.push("WebSearch", "WebFetch");
	const deny = [
		"Read(./.env)",
		"Read(./.env.*)",
		"Read(./secrets/**)"
	];
	if (ctx.blockDestructive) deny.push("Bash(rm -rf:*)", "Bash(git push --force:*)", "Bash(git push -f:*)", "Bash(git reset --hard:*)");
	const permissions = {
		allow: [...new Set(allow)],
		deny
	};
	if (ctx.askBeforePush) permissions.ask = ["Bash(git push:*)"];
	const settings = {
		$schema: "https://json.schemastore.org/claude-code-settings.json",
		permissions
	};
	if (catalog.mcpServers.length) settings.enabledMcpjsonServers = catalog.mcpServers.map((s) => s.id);
	const format = commands.format?.trim();
	if (ctx.formatHook && format) settings.hooks = { PostToolUse: [{
		matcher: "Edit|MultiEdit|Write",
		hooks: [{
			type: "command",
			command: format
		}]
	}] };
	files.push({
		path: ".claude/settings.json",
		content: json(settings),
		description: ctx.formatHook && format ? "Shared permissions, plus a hook that runs your formatter after each edit" : "Shared permissions (commit it; personal overrides go in settings.local.json)",
		targets
	});
	for (const rule of sharesAgentsMd ? [] : catalog.rules) files.push({
		path: `.claude/rules/${rule.name}.md`,
		content: `# ${rule.title}\n\n${rule.body}\n`,
		description: `Rule: ${rule.title}`,
		targets
	});
	for (const skill of catalog.skills) files.push({
		path: `.claude/skills/${skill.name}/SKILL.md`,
		content: skillFile(skill),
		description: `Skill: /${skill.name}`,
		targets
	});
	for (const agent of catalog.subagents) files.push({
		path: `.claude/agents/${agent.name}.md`,
		content: claudeSubagent(agent),
		description: `Subagent: ${agent.name}`,
		targets
	});
	if (catalog.mcpServers.length) files.push({
		path: ".mcp.json",
		content: json({ mcpServers: jsonServers(catalog.mcpServers, (k) => `\${${k}}`, (url) => ({
			type: "http",
			url
		})) }),
		description: "Project MCP servers (secrets are read from your environment)",
		targets
	});
	return files;
}
function codexFiles(ctx) {
	if (!ctx.catalog.mcpServers.length) return [];
	return [{
		path: ".codex/config.toml",
		content: `# Project-scoped Codex config: only loaded once you trust this project.\n# env_vars forwards these variables from your shell; never write their values here.\n\n${ctx.catalog.mcpServers.map((s) => {
			const key = /^[A-Za-z0-9_-]+$/.test(s.id) ? s.id : tomlString(s.id);
			const lines = [`# ${s.description}`, `[mcp_servers.${key}]`];
			if (s.url) {
				lines.push(`url = ${tomlString(s.url)}`);
				if (s.secrets.length) lines.push(`# Needs ${s.secrets.join(", ")}: see bearer_token_env_var in the Codex docs.`);
			} else {
				lines.push(`command = ${tomlString(s.command ?? "")}`, `args = ${tomlArray(s.args ?? [])}`);
				if (s.secrets.length) lines.push(`env_vars = ${tomlArray(s.secrets)}`);
			}
			return lines.join("\n");
		}).join("\n\n")}\n`,
		description: "Codex MCP servers (project scope)",
		targets: ["openai"]
	}];
}
function geminiFiles(ctx) {
	const targets = ["gemini"];
	const files = [{
		path: "GEMINI.md",
		content: instructions(ctx, "inline"),
		description: "Project context loaded by Gemini CLI",
		targets
	}];
	for (const skill of ctx.catalog.skills) {
		const body = `${skill.body}\n\n{{args}}`;
		const prompt = body.includes("'''") ? tomlString(body) : `'''\n${body}\n'''`;
		files.push({
			path: `.gemini/commands/${skill.name}.toml`,
			content: `description = ${tomlString(skill.description)}\nprompt = ${prompt}\n`,
			description: `Gemini CLI command: /${skill.name}`,
			targets
		});
	}
	if (ctx.catalog.mcpServers.length) files.push({
		path: ".gemini/settings.json",
		content: json({ mcpServers: jsonServers(ctx.catalog.mcpServers, (k) => `$${k}`, (url) => ({ httpUrl: url })) }),
		description: "Gemini CLI project settings (MCP servers)",
		targets
	});
	return files;
}
function vibeFiles(ctx) {
	if (!ctx.catalog.mcpServers.length) return [];
	return [{
		path: ".vibe/config.toml",
		content: `# Project-level Mistral Vibe config: loaded when this folder is trusted.\n\n${ctx.catalog.mcpServers.map((s) => {
			const lines = [
				`# ${s.description}`,
				"[[mcp_servers]]",
				`name = ${tomlString(s.id.replace(/[^\w]/g, "_"))}`
			];
			if (s.url) lines.push("transport = \"streamable-http\"", `url = ${tomlString(s.url)}`);
			else lines.push("transport = \"stdio\"", `command = ${tomlString(s.command ?? "")}`, `args = ${tomlArray(s.args ?? [])}`);
			if (s.secrets.length) lines.push(`# Needs ${s.secrets.join(", ")}: add an [mcp_servers.env] table in ~/.vibe/config.toml, not in this repo.`);
			return lines.join("\n");
		}).join("\n\n")}\n`,
		description: "Mistral Vibe MCP servers (project scope)",
		targets: ["mistral"]
	}];
}
function cursorFiles(ctx) {
	if (!ctx.catalog.mcpServers.length) return [];
	return [{
		path: ".cursor/mcp.json",
		content: json({ mcpServers: jsonServers(ctx.catalog.mcpServers, (k) => `\${env:${k}}`, (url) => ({ url })) }),
		description: "Cursor project MCP servers (secrets are read from your environment)",
		targets: ["cursor"]
	}];
}
function copilotFiles(ctx) {
	const targets = ["copilot"];
	const files = [{
		path: ".github/copilot-instructions.md",
		content: instructions(ctx, "inline"),
		description: "Repository instructions for GitHub Copilot (chat, agent, code review)",
		targets
	}];
	const servers = ctx.catalog.mcpServers;
	if (servers.length) {
		const inputId = (name) => name.toLowerCase().replace(/_/g, "-");
		const secrets = [...new Set(servers.flatMap((s) => s.secrets))];
		const vscodeServers = Object.fromEntries(servers.map((s) => [s.id, s.url ? {
			type: "http",
			url: s.url
		} : {
			type: "stdio",
			command: s.command,
			args: s.args ?? [],
			...s.secrets.length ? { env: Object.fromEntries(s.secrets.map((k) => [k, `\${input:${inputId(k)}}`])) } : {}
		}]));
		files.push({
			path: ".vscode/mcp.json",
			content: json({
				inputs: secrets.map((k) => ({
					type: "promptString",
					id: inputId(k),
					description: k,
					password: true
				})),
				servers: vscodeServers
			}),
			description: "VS Code MCP servers; asks for each secret once and stores it securely",
			targets
		});
	}
	return files;
}
// src/engine/generator.ts
/** Agents that read AGENTS.md natively. */
var AGENTS_MD_READERS = [
	"openai",
	"mistral",
	"cursor",
	"other"
];
/** Name of the explainer file; never README.md, so an existing README is not overwritten. */
var SETUP_GUIDE = "AGENT-SETUP.md";
function requirementsTxt(intent, selection, facts) {
	if (!selection.python || facts?.stack.includes("Python")) return null;
	const lines = [
		"# Python dependencies detected from your description",
		"python-dotenv>=1.0",
		"pydantic>=2.0"
	];
	if (intent.frameworks.includes("langchain")) lines.push("langchain>=0.3");
	if (intent.frameworks.includes("langgraph")) lines.push("langgraph>=0.2");
	if (intent.frameworks.includes("crewai")) lines.push("crewai>=0.80");
	lines.push("", "# Development", "pytest>=8.0", "ruff>=0.6");
	return {
		path: "requirements.txt",
		content: lines.join("\n") + "\n",
		description: "Python dependencies",
		targets: []
	};
}
function setupGuide(ctx, files, siteUrl = "") {
	const { intent, llms, facts } = ctx;
	const product = siteUrl ? `[Agent Config Generator](${siteUrl})` : "Agent Config Generator";
	const update = siteUrl ? `Import this repository again on ${siteUrl}, or run \`node agent-config.mjs --diff\` (download it from ${siteUrl}/agent-config.mjs), to see what an update changes.` : "Import this repository again, or run `node agent-config.mjs --diff`, to see what an update changes.";
	const sections = LLM_OPTIONS.filter((option) => llms.includes(option.id)).map((option) => {
		const own = files.filter((f) => f.targets.includes(option.id)).map((f) => `- \`${f.path}\` — ${f.description}`);
		return `### ${option.tool}\n\n${own.join("\n")}`;
	});
	const secrets = [...new Set(ctx.catalog.mcpServers.flatMap((s) => s.secrets))];
	return {
		path: SETUP_GUIDE,
		content: `# Agent setup for ${intent.projectNameHint}

Generated by ${product}${facts ? ` from ${facts.source}` : ""}. Review the files, then commit them.

## Files per agent

${sections.join("\n\n")}

## Before you start

${secrets.length ? `- Export these variables in your shell (never commit their values): ${secrets.map((s) => `\`${s}\``).join(", ")}.\n` : ""}- Codex, Mistral Vibe and Gemini CLI only load project-level config once you trust the folder.
- Edit \`AGENTS.md\` (or \`CLAUDE.md\`) when your commands or conventions change: agents read it at every session.

## Keeping it up to date

${update} Your "Project notes" are kept, and nothing is overwritten without you.
`,
		description: "What was generated, for which agent, and what to do next",
		targets: []
	};
}
/** Removes duplicate paths (AGENTS.md shared by several agents) and merges their targets. */
function mergeByPath(files) {
	const byPath = /* @__PURE__ */ new Map();
	for (const file of files) {
		const existing = byPath.get(file.path);
		if (existing) existing.targets = [.../* @__PURE__ */ new Set([...existing.targets, ...file.targets])];
		else byPath.set(file.path, {
			...file,
			targets: [...file.targets]
		});
	}
	return [...byPath.values()];
}
function generateHarness(prompt, llms = ["claude"], options = {}) {
	const selected = LLM_OPTIONS.map((o) => o.id).filter((id) => llms.includes(id));
	if (selected.length === 0) selected.push("claude");
	const { facts } = options;
	const intent = analyzePrompt(prompt);
	const name = slugify(options.projectName || facts?.name || "");
	if (name) intent.projectNameHint = name;
	const selection = options.selection ?? {
		...selectionFromIntent(intent),
		mcp: [...selectionFromIntent(intent).mcp, ...facts?.mcpServers.map((s) => s.id) ?? []]
	};
	const ctx = {
		intent,
		catalog: selectCatalog(selection, intent, facts?.mcpServers.map(importedToServer) ?? []),
		llms: selected,
		commands: options.commands ?? facts?.commands ?? {},
		facts,
		keepExisting: options.keepExisting ?? true,
		formatHook: Boolean(selection.formatHook),
		askBeforePush: Boolean(selection.askBeforePush),
		blockDestructive: Boolean(selection.blockDestructive),
		guide: options.guide
	};
	const agentsMdTargets = selected.filter((id) => AGENTS_MD_READERS.includes(id));
	const files = [];
	if (agentsMdTargets.length) {
		const shared = agentsMdFiles(ctx, agentsMdTargets);
		if (selected.includes("claude")) shared[0].targets = [...shared[0].targets, "claude"];
		files.push(...shared);
	}
	if (selected.includes("claude")) files.push(...claudeFiles(ctx, agentsMdTargets.length > 0));
	if (selected.includes("openai")) files.push(...codexFiles(ctx));
	if (selected.includes("gemini")) files.push(...geminiFiles(ctx));
	if (selected.includes("mistral")) files.push(...vibeFiles(ctx));
	if (selected.includes("cursor")) files.push(...cursorFiles(ctx));
	if (selected.includes("copilot")) files.push(...copilotFiles(ctx));
	const python = requirementsTxt(intent, selection, facts);
	if (python) files.push(python);
	const merged = mergeByPath(files);
	merged.push(setupGuide(ctx, merged, options.siteUrl));
	return {
		projectName: intent.projectNameHint,
		intent,
		llms: selected,
		files: merged
	};
}
// src/engine/presets.ts
var base = (source) => ({
	source,
	instructions: [],
	mcpServers: [],
	read: []
});
var PRESETS = [
	{
		id: "web",
		label: "Web app",
		hint: "Next.js, TypeScript, Vitest",
		facts: {
			...base("template: Web app"),
			stack: [
				"TypeScript",
				"Next.js",
				"React",
				"Tailwind CSS",
				"Vitest",
				"ESLint",
				"npm"
			],
			commands: {
				install: "npm install",
				dev: "npm run dev",
				build: "npm run build",
				test: "npm test",
				lint: "npm run lint",
				typecheck: "npx tsc --noEmit",
				format: "npx prettier --write ."
			}
		},
		selection: {
			skills: [
				"codeReview",
				"testWriting",
				"debugging",
				"accessibility",
				"prDescription"
			],
			mcp: [
				"github",
				"playwright",
				"context7"
			],
			subagents: ["codeReviewer", "testWriter"],
			python: false,
			formatHook: true,
			askBeforePush: true,
			blockDestructive: true
		}
	},
	{
		id: "python-api",
		label: "Python API",
		hint: "FastAPI, uv, pytest, Ruff",
		facts: {
			...base("template: Python API"),
			stack: [
				"Python",
				"FastAPI",
				"uv",
				"pytest",
				"Ruff",
				"Docker"
			],
			commands: {
				install: "uv sync",
				dev: "uv run fastapi dev",
				test: "uv run pytest",
				lint: "uv run ruff check .",
				format: "uv run ruff format .",
				typecheck: "uv run mypy ."
			}
		},
		selection: {
			skills: [
				"codeReview",
				"testWriting",
				"debugging",
				"securityAudit",
				"migrations"
			],
			mcp: ["github", "context7"],
			subagents: ["codeReviewer", "testWriter"],
			python: false,
			formatHook: true,
			askBeforePush: true,
			blockDestructive: true
		}
	},
	{
		id: "data",
		label: "Data & notebooks",
		hint: "pandas, Jupyter, pytest",
		facts: {
			...base("template: Data & notebooks"),
			stack: [
				"Python",
				"pandas",
				"Jupyter",
				"pytest",
				"Ruff"
			],
			commands: {
				install: "pip install -r requirements.txt",
				test: "pytest",
				lint: "ruff check .",
				format: "ruff format ."
			}
		},
		selection: {
			skills: [
				"documentation",
				"testWriting",
				"explainCodebase"
			],
			mcp: ["fileAccess", "context7"],
			subagents: [],
			python: false
		}
	},
	{
		id: "cli",
		label: "CLI or library",
		hint: "Go or Rust, tests and releases",
		facts: {
			...base("template: CLI or library"),
			stack: ["Go"],
			commands: {
				build: "go build ./...",
				test: "go test ./...",
				lint: "go vet ./...",
				format: "gofmt -w ."
			}
		},
		selection: {
			skills: [
				"codeReview",
				"testWriting",
				"debugging",
				"deploy",
				"dependencyUpgrade"
			],
			mcp: ["github", "context7"],
			subagents: [],
			python: false,
			formatHook: true,
			askBeforePush: true,
			blockDestructive: true
		}
	},
	{
		id: "writing",
		label: "Docs & writing",
		hint: "No code: a docs site, a book, research notes",
		facts: {
			...base("template: Docs & writing"),
			summary: "A writing project. Agents help draft, edit and fact-check documents; they never invent sources.",
			stack: ["Markdown"],
			commands: {}
		},
		selection: {
			skills: ["documentation", "factCheck"],
			mcp: [
				"webSearch",
				"fetch",
				"fileAccess",
				"notion"
			],
			subagents: [],
			python: false
		}
	}
];
// src/lib/diff.ts
/** Ignores Windows line endings and a missing final newline. */
var normalizeText = (text) => text.replace(/\r\n?/g, "\n").replace(/\n+$/, "");
var MAX_CELLS = 4e6;
/** Returns null when the files are too large to compare in the browser. */
function diffLines(before, after) {
	const a = normalizeText(before).split("\n");
	const b = normalizeText(after).split("\n");
	let start = 0;
	while (start < a.length && start < b.length && a[start] === b[start]) start++;
	let endA = a.length;
	let endB = b.length;
	while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
		endA--;
		endB--;
	}
	const midA = a.slice(start, endA);
	const midB = b.slice(start, endB);
	if (midA.length * midB.length > MAX_CELLS) return null;
	const lcs = Array.from({ length: midA.length + 1 }, () => new Uint32Array(midB.length + 1));
	for (let i = midA.length - 1; i >= 0; i--) for (let j = midB.length - 1; j >= 0; j--) lcs[i][j] = midA[i] === midB[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
	const out = a.slice(0, start).map((text) => ({
		kind: "same",
		text
	}));
	let i = 0;
	let j = 0;
	while (i < midA.length && j < midB.length) if (midA[i] === midB[j]) {
		out.push({
			kind: "same",
			text: midA[i]
		});
		i++;
		j++;
	} else if (lcs[i + 1][j] >= lcs[i][j + 1]) out.push({
		kind: "del",
		text: midA[i++]
	});
	else out.push({
		kind: "add",
		text: midB[j++]
	});
	while (i < midA.length) out.push({
		kind: "del",
		text: midA[i++]
	});
	while (j < midB.length) out.push({
		kind: "add",
		text: midB[j++]
	});
	for (const text of a.slice(endA)) out.push({
		kind: "same",
		text
	});
	return out;
}
/** Keeps `context` unchanged lines around each change and folds the rest. */
function foldUnchanged(lines, context = 3) {
	const keep = new Array(lines.length).fill(false);
	lines.forEach((line, index) => {
		if (line.kind === "same") return;
		for (let k = Math.max(0, index - context); k <= Math.min(lines.length - 1, index + context); k++) keep[k] = true;
	});
	const rows = [];
	let skipped = 0;
	lines.forEach((line, index) => {
		if (keep[index]) {
			if (skipped) rows.push({
				kind: "skip",
				count: skipped
			});
			skipped = 0;
			rows.push(line);
		} else skipped++;
	});
	if (skipped) rows.push({
		kind: "skip",
		count: skipped
	});
	return rows;
}
// src/lib/script.ts
var UPDATES_DIR = ".agent-config-updates";
// src/site.ts
var SITE_URL = String("https://jodevweb.github.io/agent-config").replace(/\/+$/, "");
// src/cli/run.ts
var HELP = `agent-config: generate AI coding agent configs for a repository

Usage
  agent-config [folder] [options]

Reads the folder (default: the current one), detects its stack and commands, and shows
the files it would create for each agent. Nothing is written without --write.

Options
  --agents <list>     claude, openai, gemini, mistral, cursor, copilot, other
                      (default: claude,openai,cursor)
  --skills <list>     skill ids, see --list (default: suggested from the project)
  --mcp <list>        MCP server ids, see --list (default: the ones the repo already has)
  --subagents <list>  Claude Code subagent ids, see --list
  --template <id>     start from a template: ${PRESETS.map((p) => p.id).join(", ")}
  --name <name>       project name (default: the folder name)
  --describe <text>   free text; matching options get ticked, as in the web app
  --no-notes          do not copy existing instructions into "Project notes"
  --diff              show the changes for files that already exist
  --write             write the files. Missing files are created, identical ones skipped,
                      different ones left untouched with the new version in ${UPDATES_DIR}/
  --json              print the generated files as JSON (for scripts)
  --list              list agents, skills, MCP servers and subagents
  -h, --help          show this help

Examples
  npx agent-config
  npx agent-config --agents claude,gemini --skills codeReview,debugging --diff
  npx agent-config ../my-api --template python-api --write
`;
var list = (value) => value?.split(",").map((s) => s.trim()).filter(Boolean);
/** Walks the folder like the browser import does: ignored folders skipped, small known files read. */
function readFolder(root) {
	const paths = [];
	const sizes = /* @__PURE__ */ new Map();
	const walk = (dir) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const full = join(dir, entry.name);
			const rel = relative(root, full).split(sep).join("/");
			if (IGNORED_DIRS.test(rel)) continue;
			if (entry.isDirectory()) walk(full);
			else if (entry.isFile()) {
				paths.push(rel);
				sizes.set(rel, statSync(full).size);
			}
		}
	};
	walk(root);
	const files = {};
	for (const path of pickFilesToRead(paths, (p) => p, (p) => sizes.get(p) ?? 0)) files[path] = readFileSync(join(root, path), "utf8");
	const name = resolve(root).split(sep).pop() || "project";
	return analyzeRepository(`local folder: ${name}`, paths, files, name);
}
function printList(io) {
	const section = (title, rows) => {
		io.out(`\n${title}`);
		for (const row of rows) io.out(`  ${row.id.padEnd(20)} ${row.label}: ${row.hint}`);
	};
	section("Agents (--agents)", LLM_OPTIONS.map((o) => ({
		id: o.id,
		label: o.label,
		hint: o.tool
	})));
	section("Skills (--skills)", SKILL_OPTIONS);
	section("MCP servers (--mcp)", MCP_OPTIONS);
	section("Subagents (--subagents)", SUBAGENT_OPTIONS);
	section("Rules (always derived from the skills)", RULE_OPTIONS);
	section("Templates (--template)", PRESETS.map((p) => ({
		id: p.id,
		label: p.label,
		hint: p.hint
	})));
}
function statusOf(root, file) {
	const target = join(root, file.path);
	if (!existsSync(target)) return "new";
	return normalizeText(readFileSync(target, "utf8")) === normalizeText(file.content) ? "same" : "changed";
}
function unknownIds(kind, given, known, io) {
	const bad = (given ?? []).filter((id) => !known.includes(id));
	if (bad.length) io.err(`Unknown ${kind}: ${bad.join(", ")}. Run with --list to see the ids.`);
	return bad.length > 0;
}
/** Returns the process exit code. */
function run(argv, io, cwd = process.cwd()) {
	let parsed;
	try {
		parsed = parseArgs({
			args: argv,
			allowPositionals: true,
			options: {
				agents: { type: "string" },
				skills: { type: "string" },
				mcp: { type: "string" },
				subagents: { type: "string" },
				template: { type: "string" },
				name: { type: "string" },
				describe: { type: "string" },
				"no-notes": { type: "boolean" },
				diff: { type: "boolean" },
				write: { type: "boolean" },
				json: { type: "boolean" },
				list: { type: "boolean" },
				help: {
					type: "boolean",
					short: "h"
				}
			}
		});
	} catch (error) {
		io.err(`${error.message}\nRun with --help for the options.`);
		return 2;
	}
	const { values: opts, positionals } = parsed;
	if (opts.help) {
		io.out(HELP);
		return 0;
	}
	if (opts.list) {
		printList(io);
		return 0;
	}
	const root = resolve(cwd, positionals[0] ?? ".");
	if (!existsSync(root) || !statSync(root).isDirectory()) {
		io.err(`Not a folder: ${root}`);
		return 2;
	}
	const agents = list(opts.agents) ?? [
		"claude",
		"openai",
		"cursor"
	];
	const skills = list(opts.skills);
	const mcp = list(opts.mcp);
	const subagents = list(opts.subagents);
	const preset = opts.template ? PRESETS.find((p) => p.id === opts.template) : void 0;
	if (opts.template && !preset) {
		io.err(`Unknown template: ${opts.template}. Templates: ${PRESETS.map((p) => p.id).join(", ")}.`);
		return 2;
	}
	const facts = readFolder(root);
	const importedIds = facts.mcpServers.map((s) => s.id);
	if (unknownIds("agents", agents, LLM_OPTIONS.map((o) => o.id), io) || unknownIds("skills", skills, SKILL_OPTIONS.map((o) => o.id), io) || unknownIds("MCP servers", mcp, [...MCP_OPTIONS.map((o) => o.id), ...importedIds], io) || unknownIds("subagents", subagents, SUBAGENT_OPTIONS.map((o) => o.id), io)) return 2;
	const prompt = opts.describe ?? "";
	const suggested = selectionFromIntent(analyzePrompt(prompt));
	const selection = {
		...preset?.selection ?? {
			...suggested,
			mcp: [...suggested.mcp, ...importedIds],
			askBeforePush: true,
			blockDestructive: true
		},
		...skills ? { skills } : {},
		...mcp ? { mcp } : {},
		...subagents ? { subagents } : {}
	};
	const commands = {
		...preset?.facts.commands,
		...facts.commands
	};
	const harness = generateHarness(prompt, agents, {
		projectName: opts.name,
		facts: {
			...facts,
			stack: facts.stack.length ? facts.stack : preset?.facts.stack ?? []
		},
		commands,
		selection,
		keepExisting: !opts["no-notes"],
		siteUrl: SITE_URL
	});
	if (opts.json) {
		io.out(JSON.stringify(harness.files.map(({ path, content, targets }) => ({
			path,
			content,
			agents: targets
		})), null, 2));
		return 0;
	}
	io.out(`${facts.source}${facts.stack.length ? `: ${facts.stack.join(", ")}` : ""}`);
	io.out(`${harness.files.length} files for ${harness.llms.map((id) => LLM_OPTIONS.find((o) => o.id === id)?.tool ?? id).join(", ")}\n`);
	const statuses = harness.files.map((file) => ({
		file,
		status: statusOf(root, file)
	}));
	for (const { file, status } of statuses) io.out(`  ${status.padEnd(8)} ${file.path}`);
	if (opts.diff) for (const { file } of statuses.filter((s) => s.status === "changed")) {
		const lines = diffLines(readFileSync(join(root, file.path), "utf8"), file.content);
		io.out(`\n--- ${file.path} (yours)\n+++ ${file.path} (generated)`);
		if (!lines) io.out("  (too large to compare)");
		else for (const row of foldUnchanged(lines)) io.out(row.kind === "skip" ? `  … ${row.count} unchanged` : `${row.kind === "add" ? "+" : row.kind === "del" ? "-" : " "} ${row.text}`);
	}
	const count = (status) => statuses.filter((s) => s.status === status).length;
	if (!opts.write) {
		io.out(`\n${count("new")} new, ${count("changed")} changed, ${count("same")} unchanged. Nothing written: add --write to install.`);
		return 0;
	}
	for (const { file, status } of statuses) {
		if (status === "same") continue;
		const target = status === "new" ? join(root, file.path) : join(root, UPDATES_DIR, file.path);
		mkdirSync(dirname(target), { recursive: true });
		writeFileSync(target, file.content);
	}
	io.out(`\nCreated ${count("new")} file(s). ${count("same")} already up to date.`);
	if (count("changed")) io.out(`${count("changed")} file(s) differ from yours and were left untouched; their new versions are in ${UPDATES_DIR}/.`);
	return 0;
}
// src/cli/main.ts
process.exitCode = run(process.argv.slice(2), {
	out: (text) => process.stdout.write(`${text}\n`),
	err: (text) => process.stderr.write(`${text}\n`)
});
export {};
