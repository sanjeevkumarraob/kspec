const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

const KIRO_DIR = '.kiro';
const SPECS_DIR = path.join(KIRO_DIR, 'specs');
const STEERING_DIR = path.join(KIRO_DIR, 'steering');
const AGENTS_DIR = path.join(KIRO_DIR, 'agents');
const CONFIG_FILE = path.join(KIRO_DIR, 'config.json');
const CONTEXT_FILE = path.join(KIRO_DIR, 'CONTEXT.md');
const CURRENT_FILE = path.join(KIRO_DIR, '.current');
const MEMORY_FILE = path.join(KIRO_DIR, 'memory.md');
const MILESTONES_DIR = path.join(KIRO_DIR, 'milestones');
const LEGACY_KSPEC_DIR = '.kspec';
const UPDATE_CHECK_FILE = path.join(os.homedir(), '.kspec-update-check');
const KIRO_MCP_CONFIG_WORKSPACE_SETTINGS = path.join(KIRO_DIR, 'settings', 'mcp.json');
const KIRO_MCP_CONFIG_WORKSPACE_ROOT = path.join(KIRO_DIR, 'mcp.json');
const KIRO_MCP_CONFIG_USER = path.join(os.homedir(), '.kiro', 'settings', 'mcp.json');
const KIRO_MCP_CONFIG_LEGACY = path.join(os.homedir(), '.kiro', 'mcp.json');

// Default config
const defaultConfig = {
  dateFormat: 'YYYY-MM-DD',
  autoExecute: 'ask',
  initialized: false,
  testCommand: null,
  jira: {
    project: null,
    enabled: false
  }
};

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return { ...defaultConfig, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
    } catch {
      console.error('Warning: Invalid config.json, using defaults');
      return defaultConfig;
    }
  }
  return defaultConfig;
}

function saveConfig(cfg) {
  ensureDir(KIRO_DIR);
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

const config = loadConfig();
const pkg = require('../package.json');

// Update check (non-blocking, cached for 24h)
function shouldCheckUpdate() {
  try {
    if (fs.existsSync(UPDATE_CHECK_FILE)) {
      const lastCheck = parseInt(fs.readFileSync(UPDATE_CHECK_FILE, 'utf8'), 10);
      const hoursSinceCheck = (Date.now() - lastCheck) / (1000 * 60 * 60);
      return hoursSinceCheck >= 24;
    }
  } catch {}
  return true;
}

function saveUpdateCheck() {
  try {
    fs.writeFileSync(UPDATE_CHECK_FILE, Date.now().toString());
  } catch {}
}

function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((parts1[i] || 0) < (parts2[i] || 0)) return -1;
    if ((parts1[i] || 0) > (parts2[i] || 0)) return 1;
  }
  return 0;
}

async function checkForUpdates() {
  if (!shouldCheckUpdate()) return;

  try {
    const https = require('https');
    const data = await new Promise((resolve, reject) => {
      const req = https.get('https://registry.npmjs.org/kspec/latest', { timeout: 3000 }, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(body));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });

    const latest = JSON.parse(data).version;
    saveUpdateCheck();

    if (compareVersions(pkg.version, latest) < 0) {
      console.log(`\n  Update available: ${pkg.version} → ${latest}`);
      console.log(`  Run: npm install -g kspec\n`);
    }
  } catch {
    // Silently fail - don't block user workflow
  }
}

// MCP Integration Detection
function getMcpConfig() {
  // Check in order: workspace settings, workspace root, user, legacy
  const configPaths = [
    KIRO_MCP_CONFIG_WORKSPACE_SETTINGS,
    KIRO_MCP_CONFIG_WORKSPACE_ROOT,
    KIRO_MCP_CONFIG_USER,
    KIRO_MCP_CONFIG_LEGACY
  ];

  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    } catch {}
  }
  return null;
}

function hasAtlassianMcp() {
  const mcpConfig = getMcpConfig();
  if (!mcpConfig || !mcpConfig.mcpServers) return false;

  // Check for atlassian or jira MCP server
  const serverNames = Object.keys(mcpConfig.mcpServers);
  return serverNames.some(name =>
    name.toLowerCase().includes('atlassian') ||
    name.toLowerCase().includes('jira')
  );
}

function getAtlassianMcpName() {
  const mcpConfig = getMcpConfig();
  if (!mcpConfig || !mcpConfig.mcpServers) return null;

  const serverNames = Object.keys(mcpConfig.mcpServers);
  return serverNames.find(name =>
    name.toLowerCase().includes('atlassian') ||
    name.toLowerCase().includes('jira')
  );
}

function getJiraProject() {
  const cfg = loadConfig();
  return cfg.jira?.project || null;
}

function requireJiraProject() {
  const project = getJiraProject();
  if (!project) {
    die(`Jira project not configured.

Run 'kspec init' to configure your default Jira project.
Or specify the project explicitly: kspec sync-jira --project PROJ`);
  }
  return project;
}

function requireAtlassianMcp() {
  if (!hasAtlassianMcp()) {
    die(`Atlassian MCP not configured.

To use Jira integration, configure Atlassian MCP in one of these locations:
- Workspace: .kiro/settings/mcp.json
- Workspace: .kiro/mcp.json
- User: ~/.kiro/settings/mcp.json

Example configuration:
{
  "mcpServers": {
    "atlassian": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.atlassian.com/v1/sse"],
      "timeout": 120000
    }
  }
}

Or run: kiro-cli mcp add --name atlassian

See: https://kiro.dev/docs/cli/mcp/`);
  }
  return getAtlassianMcpName();
}

// Helpers
function log(msg) { console.log(`[kspec] ${msg}`); }
function die(msg) { console.error(`Error: ${msg}`); process.exit(1); }
function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

function formatDate(format) {
  const d = new Date();
  const pad = n => n.toString().padStart(2, '0');
  const parts = { YYYY: d.getFullYear(), MM: pad(d.getMonth() + 1), DD: pad(d.getDate()) };
  return format.replace(/YYYY|MM|DD/g, m => parts[m]);
}

function slugify(text) {
  // Filler words to remove (action verbs, articles, prepositions, generic terms)
  const fillerWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'for', 'with', 'using', 'via',
    'create', 'build', 'make', 'implement', 'add', 'develop', 'write',
    'application', 'app', 'system', 'feature', 'functionality', 'module',
    'that', 'this', 'which', 'will', 'should', 'can', 'could', 'would',
    'new', 'simple', 'basic', 'full', 'complete'
  ]);

  // Tech terms to prioritize (frameworks, libraries, tools)
  const techTerms = new Set([
    'react', 'nextjs', 'next', 'vue', 'angular', 'svelte', 'node', 'express',
    'typescript', 'javascript', 'python', 'rust', 'go', 'java',
    'tailwind', 'shadcn', 'prisma', 'drizzle', 'supabase', 'firebase',
    'postgres', 'mysql', 'mongodb', 'redis', 'graphql', 'rest', 'trpc',
    'docker', 'kubernetes', 'aws', 'vercel', 'netlify'
  ]);

  // Normalize text: handle "to do" -> "todo", lowercase, clean
  let normalized = text.toLowerCase()
    .replace(/to\s*do/g, 'todo')
    .replace(/e[\s-]?commerce/g, 'ecommerce')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = normalized.split(' ').filter(w => w.length > 0);

  // Separate into tech terms and other meaningful words
  const tech = [];
  const meaningful = [];

  for (const word of words) {
    if (fillerWords.has(word)) continue;
    if (techTerms.has(word)) {
      tech.push(word);
    } else if (word.length > 2) {
      meaningful.push(word);
    }
  }

  // Prioritize: first meaningful word + tech terms (max 3-4 words total)
  const selected = [];
  if (meaningful.length > 0) selected.push(meaningful[0]);
  selected.push(...tech.slice(0, 2));
  if (selected.length < 3 && meaningful.length > 1) {
    selected.push(meaningful[1]);
  }

  // Fallback if nothing meaningful
  if (selected.length === 0) {
    const fallback = words.filter(w => w.length > 2).slice(0, 2);
    selected.push(...fallback);
  }

  let slug = selected.join('-');

  // Truncate if still too long
  if (slug.length > 30) {
    slug = selected.slice(0, 2).join('-');
  }
  if (slug.length > 30) {
    slug = slug.slice(0, 30);
  }

  return slug.replace(/^-+|-+$/g, '') || 'feature';
}

function detectCli() {
  const opts = { stdio: 'ignore', timeout: 5000 };
  try { execSync('kiro-cli --version', opts); return 'kiro-cli'; } catch {}
  try { execSync('q --version', opts); return 'q'; } catch {}
  return null;
}

function requireCli() {
  const cli = detectCli();
  if (!cli) die("Neither 'kiro-cli' nor 'q' found. Install Kiro CLI first.");
  return cli;
}

// Generate meaningful slug using LLM, fallback to regex
async function generateSlug(featureName) {
  const cli = detectCli();
  if (!cli) {
    return slugify(featureName);
  }

  try {
    const prompt = `Generate a short folder name (2-4 words, lowercase, hyphenated) for this feature: "${featureName}"

Rules:
- Extract the core concept (e.g., "todo app", "user auth", "shopping cart")
- Include key tech if mentioned (e.g., "nextjs", "react")
- No filler words (create, build, implement, application)
- Max 30 characters
- Only lowercase letters, numbers, hyphens

Reply with ONLY the folder name, nothing else. Example: todo-nextjs-shadcn`;

    const result = execSync(`${cli} chat "${prompt.replace(/"/g, '\\"')}" --no-interactive 2>/dev/null`, {
      encoding: 'utf8',
      timeout: 15000,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Extract just the slug from response (first line that looks like a slug)
    const lines = result.trim().split('\n');
    for (const line of lines) {
      const cleaned = line.trim().toLowerCase();
      // Valid slug: only lowercase, numbers, hyphens, 3-30 chars
      if (/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(cleaned) && !cleaned.includes(' ')) {
        return cleaned;
      }
    }

    // If no valid slug found, fallback
    return slugify(featureName);
  } catch {
    // CLI failed, use regex fallback
    return slugify(featureName);
  }
}

async function prompt(question, choices) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  
  return new Promise(resolve => {
    if (choices) {
      console.log(`\n${question}`);
      choices.forEach((c, i) => console.log(`  ${i + 1}) ${c.label}`));
      rl.question('\nChoice: ', answer => {
        rl.close();
        const idx = parseInt(answer) - 1;
        resolve(choices[idx]?.value || choices[0].value);
      });
    } else {
      rl.question(question, answer => { rl.close(); resolve(answer); });
    }
  });
}

async function confirm(question) {
  const answer = await prompt(`${question} (Y/n): `);
  if (!answer) return true; // Empty = yes (default)
  const lower = answer.toLowerCase().trim();
  // Accept: y, yes, true, 1, or any non-"n"/"no"/"false"/"0" response
  if (lower === 'n' || lower === 'no' || lower === 'false' || lower === '0') return false;
  return true; // Default to yes for any other input (including "copilot", "sure", etc.)
}

function resetToDefaultAgent(cli) {
  try {
    const child = spawn(cli, ['agent', 'swap', 'kiro_default'], { stdio: 'ignore' });
    child.on('error', () => {}); // Best-effort — silently ignore errors
  } catch {
    // Best-effort — silently ignore if spawn fails
  }
}

function chat(message, agent) {
  // Refresh context before each chat to ensure LLM has latest state
  refreshContext();

  const cli = requireCli();
  const args = agent ? ['chat', '--agent', agent, message] : ['chat', message];
  const child = spawn(cli, args, { stdio: 'inherit' });
  return new Promise((resolve, reject) => {
    child.on('error', err => {
      console.error(`Failed to start ${cli}: ${err.message}`);
      reject(err);
    });
    child.on('close', code => {
      resetToDefaultAgent(cli);
      refreshContext();
      resolve(code);
    });
  });
}

// Spec management
function getSpecsDir() { return SPECS_DIR; }

function getCurrentSpec() {
  const file = CURRENT_FILE;
  if (fs.existsSync(file)) {
    const spec = fs.readFileSync(file, 'utf8').trim();
    if (!spec) return null;
    // Handle full path format
    if (fs.existsSync(spec)) return spec;
    // Handle just folder name (from agent mode)
    const fullPath = path.join(getSpecsDir(), spec);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  return null;
}

function setCurrentSpec(folder) {
  ensureDir(KIRO_DIR);
  const basename = path.basename(folder);
  const normalized = path.join(SPECS_DIR, basename);
  fs.writeFileSync(CURRENT_FILE, normalized);
}

function findSpec(name) {
  const specsDir = getSpecsDir();
  if (!fs.existsSync(specsDir)) return null;
  
  const slug = slugify(name);
  const matches = fs.readdirSync(specsDir)
    .filter(d => d.includes(slug) && fs.statSync(path.join(specsDir, d)).isDirectory())
    .sort().reverse();
  
  if (matches.length === 1) return path.join(specsDir, matches[0]);
  if (matches.length > 1) {
    console.log('Multiple matches:');
    matches.forEach((m, i) => console.log(`  ${i + 1}) ${m}`));
    die('Be more specific.');
  }
  return null;
}

function getOrSelectSpec(name) {
  if (name) {
    const found = findSpec(name);
    if (found) return found;
    die(`Spec "${name}" not found. Run \`kspec list\` to see available specs.`);
  }
  const current = getCurrentSpec();
  if (current) return current;
  die('No current spec. .kiro/.current may be stale or empty.\nRun `kspec list` to see available specs, or `kspec spec "Feature Name"` to create one.');
}

function getTaskStats(folder) {
  const tasksFile = path.join(folder, 'tasks.md');
  if (!fs.existsSync(tasksFile)) return null;

  const content = fs.readFileSync(tasksFile, 'utf8');
  // Match both [x] and [X] consistently for total and done counts
  const total = (content.match(/^-\s*\[[ xX]\]/gm) || []).length;
  const done = (content.match(/^-\s*\[[xX]\]/gm) || []).length;
  return { total, done, remaining: total - done };
}

function getCurrentTask(folder) {
  const tasksFile = path.join(folder, 'tasks.md');
  if (!fs.existsSync(tasksFile)) return null;

  const content = fs.readFileSync(tasksFile, 'utf8');
  const lines = content.split('\n');
  for (const line of lines) {
    if (/^-\s*\[ \]/.test(line)) {
      return line.replace(/^-\s*\[ \]\s*/, '').trim();
    }
  }
  return null;
}

// Check if spec.md has been modified after spec-lite.md
function isSpecStale(folder) {
  const specFile = path.join(folder, 'spec.md');
  const specLiteFile = path.join(folder, 'spec-lite.md');

  if (!fs.existsSync(specFile)) return false;
  if (!fs.existsSync(specLiteFile)) return true; // No spec-lite means stale

  const specMtime = fs.statSync(specFile).mtime;
  const specLiteMtime = fs.statSync(specLiteFile).mtime;

  return specMtime > specLiteMtime;
}

// Auto-refresh spec-lite.md when spec.md is modified (truncation fallback)
function autoRefreshSpecLite(folder) {
  if (!isSpecStale(folder)) return;
  log('spec.md changed — auto-refreshing spec-lite.md...');
  const specContent = fs.readFileSync(path.join(folder, 'spec.md'), 'utf8');
  const contractIdx = specContent.indexOf('## Contract');
  const content = contractIdx > 0 ? specContent.slice(0, contractIdx).trim() : specContent;
  const lite = content.length > 2000
    ? content.slice(0, 2000) + '\n\n... (truncated, run `kspec refresh` for AI-generated summary)'
    : content;
  fs.writeFileSync(path.join(folder, 'spec-lite.md'), lite);
  log('spec-lite.md updated (truncated copy — run `kspec refresh` for AI summary)');
}

// Record a metric event with timestamp for observability
function recordMetric(folder, event) {
  const metricsFile = path.join(folder, 'metrics.json');
  let metrics = [];
  if (fs.existsSync(metricsFile)) {
    try { metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8')); } catch {}
  }
  metrics.push({ event, timestamp: new Date().toISOString() });
  fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
}

// Check staleness and prompt user before proceeding
async function checkStaleness(folder) {
  if (!isSpecStale(folder)) return true; // Not stale, proceed

  console.log('\n⚠️  spec.md has been modified since spec-lite.md was generated.');
  console.log('   This may cause outdated information to be used.\n');
  console.log('   Options:');
  console.log('   1. Run `kspec refresh` to update spec-lite.md first (recommended)');
  console.log('   2. Continue anyway with potentially stale context\n');

  const proceed = await confirm('Continue with potentially stale spec?');
  return proceed;
}

function refreshContext() {
  const contextFile = CONTEXT_FILE;
  const current = getCurrentSpec();

  if (!current) {
    // No current spec - create minimal context
    const content = `# kspec Context

No active spec. Run: \`kspec spec "Feature Name"\`
`;
    ensureDir(KIRO_DIR);
    fs.writeFileSync(contextFile, content);
    return content;
  }

  const specName = path.basename(current);
  const stats = getTaskStats(current);
  const currentTask = getCurrentTask(current);
  const stale = isSpecStale(current);

  // Read spec-lite if exists, or fall back to spec.md if stale
  const specLiteFile = path.join(current, 'spec-lite.md');
  const specFile = path.join(current, 'spec.md');
  let specLite = '';
  let usingSpecFallback = false;

  if (stale && fs.existsSync(specFile)) {
    // Use spec.md directly when stale (truncate if too long)
    const specContent = fs.readFileSync(specFile, 'utf8');
    specLite = specContent.length > 3000
      ? specContent.slice(0, 3000) + '\n\n... (truncated, run `kspec refresh` for full summary)'
      : specContent;
    usingSpecFallback = true;
  } else if (fs.existsSync(specLiteFile)) {
    specLite = fs.readFileSync(specLiteFile, 'utf8');
  }

  // Read memory if exists
  const memoryFile = path.join(current, 'memory.md');
  let memory = '';
  if (fs.existsSync(memoryFile)) {
    memory = fs.readFileSync(memoryFile, 'utf8');
  }

  // Read Jira links if exists
  const jiraLinksFile = path.join(current, 'jira-links.json');
  let jiraLinks = null;
  if (fs.existsSync(jiraLinksFile)) {
    try {
      jiraLinks = JSON.parse(fs.readFileSync(jiraLinksFile, 'utf8'));
    } catch {}
  }

  // Read metadata if exists
  const metadataFile = path.join(current, 'metadata.json');
  let metadata = null;
  if (fs.existsSync(metadataFile)) {
    try { metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8')); } catch {}
  }

  // Check milestone membership
  let milestoneName = null;
  if (fs.existsSync(MILESTONES_DIR)) {
    const msFiles = fs.readdirSync(MILESTONES_DIR).filter(f => f.endsWith('.json'));
    for (const f of msFiles) {
      try {
        const ms = JSON.parse(fs.readFileSync(path.join(MILESTONES_DIR, f), 'utf8'));
        if (ms.specs && ms.specs.includes(current)) {
          milestoneName = ms.name;
          break;
        }
      } catch {}
    }
  }

  // Build context
  let content = `# kspec Context
> Auto-generated. Always read this first after context compression.

## Current Spec
**${specName}**
Path: \`${current}\`
`;

  if (metadata && metadata.type) {
    content += `Type: ${metadata.type}
`;
  }
  if (milestoneName) {
    content += `Milestone: ${milestoneName}
`;
  }

  if (stale) {
    content += `
**NOTE: spec.md was modified. Using spec.md directly for context.**
Run \`kspec refresh\` to generate optimized spec-lite.md summary.

`;
  } else {
    content += '\n';
  }

  if (stats) {
    content += `## Progress
- Tasks: ${stats.done}/${stats.total} completed
- Remaining: ${stats.remaining}
`;
    if (currentTask) {
      content += `- **Current Task**: ${currentTask}
`;
    }
    content += '\n';
  }

  if (specLite) {
    content += `## Requirements Summary
${specLite}

`;
  }

  if (memory) {
    content += `## Decisions & Learnings
${memory}

`;
  }

  if (jiraLinks) {
    content += `## Jira Links
`;
    if (jiraLinks.sourceIssues && jiraLinks.sourceIssues.length > 0) {
      content += `- Source Issues: ${jiraLinks.sourceIssues.join(', ')}
`;
    }
    if (jiraLinks.specIssue) {
      content += `- Spec Issue: ${jiraLinks.specIssue}
`;
    }
    if (jiraLinks.subtasks && jiraLinks.subtasks.length > 0) {
      content += `- Subtasks: ${jiraLinks.subtasks.join(', ')}
`;
    }
    content += '\n';
  }

  // Design status
  const designFile = path.join(current, 'design.md');
  const hasDesign = fs.existsSync(designFile);
  content += `## Design
- Status: ${hasDesign ? 'present' : 'not yet created'}
${hasDesign ? '- Run `kspec verify-design` to review' : '- Run `kspec design` to create (optional)'}

`;

  content += `## Quick Commands
- \`kspec design\` - Create technical design (optional)
- \`kspec tasks\` - Generate implementation tasks
- \`kspec build\` - Continue building tasks
- \`kspec verify\` - Verify implementation
- \`kspec status\` - Show current status
- \`kspec context\` - Refresh this file
`;

  ensureDir(KIRO_DIR);
  fs.writeFileSync(contextFile, content);
  return content;
}

// Templates
// Steering templates with Kiro-native front matter
// inclusion_mode: always | on_demand | never
// always = included in every prompt (default)
// on_demand = agent can request when needed
// never = reference only, not auto-included
const steeringTemplates = {
  'product.md': `---
inclusion_mode: always
description: Product context and goals
---
# Product Overview

## Purpose
[Define your product's purpose and target users]

## Key Features
[List main features and capabilities]

## Success Metrics
[How success is measured]`,

  'tech.md': `---
inclusion_mode: always
description: Technology stack and architecture
---
# Technology Stack

## Languages & Runtime
[Primary language and version]

## Frameworks
[Web framework, testing framework, key libraries]

## Tools
[Build tools, package managers, linters]`,

  'testing.md': `---
inclusion_mode: always
description: Testing standards and TDD approach
---
# Testing Standards

## Approach
TDD: Red → Green → Refactor

## Test Types
- Unit: Individual functions
- Integration: Component interactions
- E2E: User flows

## Coverage
[Minimum thresholds]`,

  'security.md': `---
inclusion_mode: always
description: Security requirements and practices
---
# Security Guidelines

## Authentication
[Auth approach: OAuth, JWT, sessions]

## Data Protection
- Sanitize all user input
- Use parameterized queries
- Encrypt sensitive data at rest

## Secrets Management
- Never commit secrets to git
- Use environment variables
- Reference .env.example for required vars`,

  'api-standards.md': `---
inclusion_mode: on_demand
description: API design conventions (request when building APIs)
---
# API Standards

## REST Conventions
- Use plural nouns for resources
- HTTP methods: GET (read), POST (create), PUT (update), DELETE (remove)
- Return appropriate status codes

## Response Format
\`\`\`json
{
  "data": {},
  "meta": { "timestamp": "ISO8601" },
  "errors": []
}
\`\`\`

## Versioning
[API versioning strategy]`
};

const agentTemplates = {
  'kspec-analyse.json': {
    name: 'kspec-analyse',
    description: 'Analyse codebase and update steering docs',
    model: 'claude-sonnet-4.6',
    tools: ['read', 'write'],
    allowedTools: ['read', 'write'],
    resources: [
      'file://.kiro/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kiro/specs/**/*.md'
    ],
    prompt: `You are the kspec analyser.

FIRST: Read .kiro/CONTEXT.md for current state and spec summary.

Your job:
1. Analyse the codebase structure, tech stack, patterns
2. Review .kiro/steering/ docs
3. Suggest updates to steering based on actual codebase
4. Identify risks, tech debt, improvement areas

Output a clear analysis report. Propose specific steering doc updates.

PIPELINE (suggest next steps):
- Create spec: \`/agent swap kspec-spec\` or \`kspec spec "Feature"\`
- Review code: \`/agent swap kspec-review\` or \`kspec review\``,
    keyboardShortcut: 'ctrl+shift+a',
    welcomeMessage: 'Analysing codebase...'
  },

  'kspec-spec.json': {
    name: 'kspec-spec',
    description: 'Create feature specifications',
    model: 'claude-sonnet-4.6',
    tools: ['read', 'write'],
    allowedTools: ['read', 'write'],
    resources: [
      'file://.kiro/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kiro/specs/**/*.md'
    ],
    prompt: `You are the kspec specification writer.

WORKFLOW (do this autonomously):
1. Read .kiro/steering/ for project context
2. Create spec folder: .kiro/specs/YYYY-MM-DD-{feature-slug}/
   - Use today's date and a short slug (2-4 words from feature name)
3. Create spec.md in that folder with:
   - Problem/Context
   - Requirements (functional + non-functional)
   - Constraints
   - High-level design
   - Acceptance criteria
   - Contract (JSON block with output_files and checks)
4. Create spec-lite.md (CRITICAL - under 500 words):
   - Concise version for context retention after compression
   - Key requirements only
5. Write the spec folder path to .kiro/.current (format: .kiro/specs/YYYY-MM-DD-slug)
6. Regenerate .kiro/CONTEXT.md with current spec name, path, and progress

PIPELINE (suggest next steps):
- Verify spec: \`/agent swap kspec-verify\` or \`kspec verify-spec\`
- Create design: \`/agent swap kspec-design\` or \`kspec design\`
- Generate tasks: \`/agent swap kspec-tasks\` or \`kspec tasks\` (skip design)`,
    keyboardShortcut: 'ctrl+shift+s',
    welcomeMessage: 'Ready to create specification. Describe your feature.'
  },

  'kspec-tasks.json': {
    name: 'kspec-tasks',
    description: 'Generate implementation tasks from spec',
    model: 'claude-sonnet-4.6',
    tools: ['read', 'write'],
    allowedTools: ['read', 'write'],
    resources: [
      'file://.kiro/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kiro/specs/**/*.md'
    ],
    prompt: `You are the kspec task generator.

WORKFLOW:
1. Read .kiro/CONTEXT.md for current spec location
2. Read .kiro/.current to get spec folder path
3. Read spec.md and spec-lite.md from that folder
4. If design.md exists in the spec folder, read it for architecture guidance and dependency ordering
5. Generate tasks.md in the spec folder with:
   - Checkbox format: "- [ ] Task description"
   - TDD approach: test first, then implement
   - Logical ordering (models → services → API → UI)
   - Dependencies noted
   - File paths where changes occur
6. Regenerate .kiro/CONTEXT.md with updated task count from tasks.md

Tasks must be atomic and independently verifiable.

PIPELINE (suggest next steps):
- Verify tasks: \`/agent swap kspec-verify\` or \`kspec verify-tasks\`
- Start building: \`/agent swap kspec-build\` or \`kspec build\``,
    keyboardShortcut: 'ctrl+shift+t',
    welcomeMessage: 'Reading current spec and generating tasks...'
  },

  'kspec-build.json': {
    name: 'kspec-build',
    description: 'Execute tasks with TDD',
    model: 'claude-sonnet-4.6',
    tools: ['read', 'write', 'shell'],
    allowedTools: ['read', 'write', 'shell'],
    resources: [
      'file://.kiro/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kiro/specs/**/*.md'
    ],
    prompt: `You are the kspec builder.

WORKFLOW:
1. Read .kiro/CONTEXT.md for current spec and task progress
2. Read .kiro/.current to get spec folder path
3. Read tasks.md from spec folder, find first uncompleted task (- [ ])
4. For each task:
   a) Write test first (TDD)
   b) Implement minimal code to pass
   c) Run tests
   d) Mark task complete: change "- [ ]" to "- [x]"
   e) Update tasks.md file
   f) After completing tasks, regenerate .kiro/CONTEXT.md with updated progress
5. Commit after each task with descriptive message

CRITICAL:
- Always update tasks.md after completing each task
- Update .kiro/CONTEXT.md with current task and progress
- NEVER delete .kiro folders
- Use non-interactive flags for commands (--yes, -y)

PIPELINE (suggest next steps):
- When all tasks complete: \`/agent swap kspec-verify\` or \`kspec verify\`
- Review code: \`/agent swap kspec-review\` or \`kspec review\`
- Sync to Jira: \`/agent swap kspec-jira\` or \`kspec sync-jira\``,
    keyboardShortcut: 'ctrl+shift+b',
    welcomeMessage: 'Reading current task and building...'
  },

  'kspec-verify.json': {
    name: 'kspec-verify',
    description: 'Verify spec, tasks, or implementation',
    model: 'claude-sonnet-4.6',
    tools: ['read', 'shell'],
    allowedTools: ['read', 'shell'],
    resources: [
      'file://.kiro/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kiro/specs/**/*.md'
    ],
    prompt: `You are the kspec verifier.

FIRST: Read .kiro/CONTEXT.md for current spec and progress.
If contract validation results are provided, verify they match your observations.

Based on what you're asked to verify:

VERIFY-SPEC (Interactive Spec Shaping):
1. Read spec.md thoroughly
2. Generate 4-8 targeted, NUMBERED clarifying questions:
   - Propose sensible assumptions: "I assume X, is that correct?"
   - Suggest reasonable defaults for each question
   - Make it easy for user to confirm or provide alternatives
   - End with an open question about exclusions
3. Wait for user responses
4. Based on answers, suggest specific updates to spec.md
5. Get user confirmation before making changes
6. Update spec.md and regenerate spec-lite.md

VERIFY-DESIGN:
- Check design.md covers all spec requirements
- Verify architecture decisions are sound
- Check component breakdown is complete
- Confirm data models and API contracts are well-defined
- Report: PASS/FAIL with specific issues

VERIFY-TASKS:
- Check tasks cover all spec requirements
- Verify task completion status
- Check test coverage for completed tasks
- Report: X/Y tasks done, coverage %

VERIFY-IMPLEMENTATION:
- Check implementation matches spec requirements
- Check all tasks marked complete
- Run tests, report results
- List any gaps between spec and implementation

Output a clear verification report with pass/fail status.

PIPELINE (suggest next steps based on verification type):
- After verify-spec: \`/agent swap kspec-design\` or \`kspec design\`
- After verify-design: \`/agent swap kspec-tasks\` or \`kspec tasks\`
- After verify-tasks: \`/agent swap kspec-build\` or \`kspec build\`
- After verify-implementation: \`kspec done\` or \`/agent swap kspec-review\``,
    keyboardShortcut: 'ctrl+shift+v',
    welcomeMessage: 'What should I verify?'
  },

  'kspec-review.json': {
    name: 'kspec-review',
    description: 'Code review',
    model: 'claude-sonnet-4.6',
    tools: ['read', 'shell'],
    allowedTools: ['read', 'shell'],
    resources: [
      'file://.kiro/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kiro/specs/**/*.md'
    ],
    prompt: `You are the kspec code reviewer.

FIRST: Read .kiro/CONTEXT.md for current spec context.

Your job:
1. Review code changes (git diff or specified files)
2. Check compliance with .kiro/steering/
3. Evaluate:
   - Code quality and readability
   - Test coverage
   - Security concerns
   - Performance implications
4. Provide actionable feedback

Output: APPROVE / REQUEST_CHANGES with specific issues.

PIPELINE (suggest next steps):
- Fix issues: \`/agent swap kspec-build\` or \`kspec build\`
- Verify implementation: \`/agent swap kspec-verify\` or \`kspec verify\`
- Sync to Jira: \`/agent swap kspec-jira\` or \`kspec sync-jira\``,
    keyboardShortcut: 'ctrl+shift+r',
    welcomeMessage: 'Ready to review. What should I look at?'
  },

  'kspec-design.json': {
    name: 'kspec-design',
    description: 'Create technical design from spec',
    model: 'claude-sonnet-4.6',
    tools: ['read', 'write'],
    allowedTools: ['read', 'write'],
    resources: [
      'file://.kiro/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kiro/specs/**/*.md'
    ],
    prompt: `You are the kspec design architect.

WORKFLOW:
1. Read .kiro/CONTEXT.md for current spec location
2. Read .kiro/.current to get spec folder path
3. Read spec.md from that folder
4. Create design.md in the spec folder with these sections:
   - Architecture Overview
   - Component Breakdown
   - Data Models
   - API Contracts
   - Dependency Mapping
   - Technical Decisions
   - Risk Assessment
5. Write the spec folder path to .kiro/.current (format: .kiro/specs/YYYY-MM-DD-slug)
6. Regenerate .kiro/CONTEXT.md with design status

PIPELINE (suggest next steps):
- Verify design: \`/agent swap kspec-verify\` or \`kspec verify-design\`
- Generate tasks: \`/agent swap kspec-tasks\` or \`kspec tasks\``,
    keyboardShortcut: 'ctrl+shift+d',
    welcomeMessage: 'Reading spec and creating technical design...'
  },

  'kspec-jira.json': {
    name: 'kspec-jira',
    description: 'Jira integration for specs',
    model: 'claude-sonnet-4.6',
    tools: ['read', 'write', '@atlassian'],
    allowedTools: ['read', 'write', '@atlassian'],
    includeMcpJson: true,
    resources: [
      'file://.kiro/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kiro/specs/**/*.md'
    ],
    prompt: `You are the kspec Jira integration agent.

PREREQUISITE: This agent requires Atlassian MCP to be configured.
If MCP calls fail, inform the user to configure Atlassian MCP first.

CAPABILITIES:

1. PULL FROM JIRA (when user provides issue keys):
   - Use MCP to fetch Jira issue details
   - Extract: summary, description, acceptance criteria, comments
   - For multiple issues, consolidate into unified requirements
   - Create spec.md with proper attribution to source issues
   - Include Jira links in spec for traceability

2. PULL UPDATES (when user asks to pull latest or sync from Jira):
   - Read jira-links.json for linked issue keys
   - Use MCP to fetch latest state of each linked issue
   - Compare against current spec.md content
   - Generate a CHANGE REPORT showing:
     * New/modified acceptance criteria
     * Updated descriptions or summaries
     * New comments with relevant context
     * Status changes
   - Present CHANGE REPORT to user for review
   - NEVER auto-update spec.md — always get user confirmation first
   - After user approves changes, update spec.md and regenerate spec-lite.md

3. SYNC TO JIRA (when user asks to sync/push):
   - Create new "Technical Specification" issue in Jira
   - Or update existing issue with spec content
   - Link to source stories
   - Add comment requesting BA review
   - Set appropriate labels (kspec, technical-spec)

4. CREATE SUBTASKS (when user asks after tasks.md exists):
   - Read tasks.md from current spec
   - Create Jira sub-tasks for each task
   - Link to parent spec issue
   - Include task details and acceptance criteria

WORKFLOW:
1. Read .kiro/CONTEXT.md for current spec state
2. Identify what user wants (pull/sync/subtasks/pull-updates)
3. Use Atlassian MCP for Jira operations
4. Update jira-links.json with issue keys
5. Update .kiro/CONTEXT.md to include Jira issue links from jira-links.json
6. Report what was created/updated

IMPORTANT:
- Always include Jira issue links in spec.md
- Add "Source: JIRA-XXX" attribution for pulled requirements
- NEVER auto-update spec.md on pull-updates — present changes and confirm first

PIPELINE (suggest next steps):
- After pull: \`/agent swap kspec-spec\` or \`kspec spec\`
- After sync: \`/agent swap kspec-verify\` or \`kspec verify-spec\`
- After subtasks: \`kspec status\` to see full picture`,
    keyboardShortcut: 'ctrl+shift+j',
    welcomeMessage: 'Jira integration ready. Provide issue keys to pull, or say "sync" to push spec to Jira.'
  },

  'kspec-fix.json': {
    name: 'kspec-fix',
    description: 'Fix bugs with abbreviated TDD pipeline',
    model: 'claude-sonnet-4.6',
    tools: ['read', 'write', 'bash'],
    allowedTools: ['read', 'write', 'bash'],
    resources: [
      'file://.kiro/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kiro/specs/**/*.md'
    ],
    prompt: `You are the kspec bug fixer.

FIRST: Read .kiro/CONTEXT.md for current state.

WORKFLOW (abbreviated pipeline — no full spec/design/tasks cycle):
1. Understand the bug from the description
2. Read the codebase to find the relevant area
3. Create spec.md in the spec folder with:
   - Bug description
   - Steps to reproduce (if inferable)
   - Expected vs actual behavior
   - Root cause analysis
   - Fix approach
4. Create tasks.md with fix tasks (test-first):
   - Write failing test that reproduces the bug
   - Implement fix
   - Verify fix doesn't break existing tests
5. Execute tasks immediately (TDD)
6. Mark tasks complete as you go

CRITICAL: Write test first, then fix. Update tasks.md after each step.

PIPELINE (suggest next steps):
- Verify fix: \`/agent swap kspec-verify\` or \`kspec verify\`
- Complete: \`kspec done\``,
    keyboardShortcut: 'ctrl+shift+f',
    welcomeMessage: 'Bug fix mode — describe the bug to fix.'
  },

  'kspec-refactor.json': {
    name: 'kspec-refactor',
    description: 'Refactor code with no behavior change',
    model: 'claude-sonnet-4.6',
    tools: ['read', 'write', 'bash'],
    allowedTools: ['read', 'write', 'bash'],
    resources: [
      'file://.kiro/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kiro/specs/**/*.md'
    ],
    prompt: `You are the kspec refactoring agent.

FIRST: Read .kiro/CONTEXT.md for current state.

WORKFLOW:
1. Read the codebase area being refactored
2. Create spec.md with:
   - Current state (what exists)
   - Target state (what it should look like)
   - Constraints (behavior must not change)
   - Refactor approach
3. Create tasks.md with refactor tasks:
   - Ensure existing tests pass first
   - Restructure step by step
   - Run tests after each change
4. Execute tasks

CRITICAL: Run existing tests before AND after each change. No behavior changes.

PIPELINE (suggest next steps):
- Verify: \`/agent swap kspec-verify\` or \`kspec verify\`
- Review: \`/agent swap kspec-review\` or \`kspec review\``,
    keyboardShortcut: 'ctrl+shift+g',
    welcomeMessage: 'Refactor mode — describe what to refactor and why.'
  },

  'kspec-spike.json': {
    name: 'kspec-spike',
    description: 'Time-boxed investigation (no implementation)',
    model: 'claude-sonnet-4.6',
    tools: ['read', 'write'],
    allowedTools: ['read', 'write'],
    resources: [
      'file://.kiro/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kiro/specs/**/*.md'
    ],
    prompt: `You are the kspec spike/investigation agent.

FIRST: Read .kiro/CONTEXT.md for current state.

This is an INVESTIGATION, not an implementation.

WORKFLOW:
1. Research the question/problem
2. Create spec.md as a FINDINGS REPORT with:
   - Question/hypothesis
   - Investigation approach
   - Findings (with code examples if relevant)
   - Recommendations
   - Risks identified
   - Estimated effort for implementation (S/M/L/XL)
3. Do NOT implement anything — research only
4. Create memory.md with key learnings

Output findings clearly for decision-making.

PIPELINE (suggest next steps):
- Proceed to implementation: \`/agent swap kspec-spec\` or \`kspec spec "Feature"\`
- Archive learnings: \`kspec done\``,
    keyboardShortcut: 'ctrl+shift+i',
    welcomeMessage: 'Spike mode — describe the question to investigate.'
  },

  'kspec-revise.json': {
    name: 'kspec-revise',
    description: 'Revise spec from stakeholder feedback',
    model: 'claude-sonnet-4.6',
    tools: ['read', 'write'],
    allowedTools: ['read', 'write'],
    resources: [
      'file://.kiro/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kiro/specs/**/*.md'
    ],
    prompt: `You are the kspec spec revision agent.

FIRST: Read .kiro/CONTEXT.md for current state.

WORKFLOW:
1. Read the current spec.md
2. Read tasks.md if it exists (to understand implementation state)
3. Ask what feedback or changes are needed
4. Update spec.md with the changes
5. If tasks.md exists, identify affected tasks:
   - Mark affected completed tasks for re-verification
   - Add new tasks if needed
   - Note removed requirements
6. Regenerate spec-lite.md
7. Update .kiro/CONTEXT.md

IMPORTANT: Show a diff summary of what changed before confirming.

PIPELINE (suggest next steps):
- Review revised spec: \`/agent swap kspec-verify\` or \`kspec verify-spec\`
- Regenerate tasks: \`/agent swap kspec-tasks\` or \`kspec tasks\``,
    keyboardShortcut: 'ctrl+shift+e',
    welcomeMessage: 'Revision mode — what feedback needs to be incorporated?'
  },

  'kspec-demo.json': {
    name: 'kspec-demo',
    description: 'Generate stakeholder walkthrough',
    model: 'claude-sonnet-4.6',
    tools: ['read', 'write'],
    allowedTools: ['read', 'write'],
    resources: [
      'file://.kiro/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kiro/specs/**/*.md'
    ],
    prompt: `You are the kspec demo/walkthrough agent.

FIRST: Read .kiro/CONTEXT.md for current state.

WORKFLOW:
1. Read spec.md for requirements
2. Read tasks.md for implementation status
3. Examine the actual implementation in the codebase
4. Generate a DEMO WALKTHROUGH showing:
   - What was built (mapped to spec requirements)
   - How to test/verify each feature
   - What's working vs what's pending
   - Key decisions made during implementation
   - Screenshots/examples where applicable
5. Write the walkthrough to demo.md
6. Highlight anything that needs stakeholder input

This is for human review, not AI verification.

PIPELINE (suggest next steps):
- Revise from feedback: \`/agent swap kspec-revise\` or \`kspec revise\`
- Complete: \`kspec done\``,
    keyboardShortcut: 'ctrl+shift+w',
    welcomeMessage: 'Demo mode — generating stakeholder walkthrough...'
  },

  'kspec-estimate.json': {
    name: 'kspec-estimate',
    description: 'Assess complexity before building',
    model: 'claude-sonnet-4.6',
    tools: ['read', 'write'],
    allowedTools: ['read', 'write'],
    resources: [
      'file://.kiro/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kiro/specs/**/*.md'
    ],
    prompt: `You are the kspec complexity estimator.

FIRST: Read .kiro/CONTEXT.md for current state.

WORKFLOW:
1. Read spec.md thoroughly
2. Read the codebase to understand current state
3. Read .kiro/memory.md for relevant past experience
4. Provide a COMPLEXITY ASSESSMENT:

   **T-shirt Size**: S / M / L / XL

   **Breakdown**:
   - New files to create: ~N
   - Existing files to modify: ~N
   - Estimated tasks: ~N
   - Key risks: [list]

   **Confidence**: High / Medium / Low

   **Recommendation**:
   - S: Skip design, go straight to tasks
   - M: Consider design step
   - L/XL: Design step recommended, consider breaking into smaller specs

   **Similar past work**: [reference memory.md entries if relevant]

5. Write estimate to estimate.md

This is advisory — it doesn't block any commands.

PIPELINE (suggest next steps):
- Create design: \`/agent swap kspec-design\` or \`kspec design\`
- Generate tasks: \`/agent swap kspec-tasks\` or \`kspec tasks\``,
    keyboardShortcut: 'ctrl+shift+x',
    welcomeMessage: 'Estimation mode — assessing complexity...'
  },

  'kspec-multi-review.json': {
    name: 'kspec-multi-review',
    description: 'Multi-CLI code review (Copilot, Gemini, Claude, Codex)',
    model: 'claude-sonnet-4.6',
    tools: ['read', 'shell'],
    allowedTools: ['read', 'shell'],
    resources: [
      'file://.kiro/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kiro/specs/**/*.md'
    ],
    prompt: `You are the kspec multi-CLI review orchestrator.

FIRST: Read .kiro/CONTEXT.md for current spec context.

YOUR ROLE: Orchestrate reviews across multiple AI CLIs for comprehensive feedback.

AVAILABLE REVIEWERS (check config in .kiro/config.json):
- copilot: GitHub Copilot CLI (gh copilot)
- gemini: Gemini CLI
- claude: Claude Code CLI
- codex: OpenAI Codex CLI
- aider: Aider

WORKFLOW:
1. Check .kiro/config.json for enabled reviewers
2. For each enabled reviewer, run review via shell:
   - copilot: gh copilot explain "Review this code for: [criteria]"
   - gemini: gemini "Review this diff: [git diff]"
   - claude: claude "Review: [context]"
   - codex: codex "Review: [context]"
   - aider: aider --message "Review: [context]"
3. Collect and synthesize feedback from all reviewers
4. Present unified review summary with attribution

OUTPUT FORMAT:
## Multi-CLI Review Summary

### Copilot Feedback
[feedback or "skipped - not configured"]

### Gemini Feedback
[feedback or "skipped - not configured"]

### Claude Feedback
[feedback or "skipped - not configured"]

### Codex Feedback
[feedback or "skipped - not configured"]

## Consensus Issues
[issues raised by multiple reviewers]

## Recommendation
APPROVE / REQUEST_CHANGES with specific actions

PIPELINE (suggest next steps):
- Fix issues: \`/agent swap kspec-build\` or \`kspec build\`
- Single reviewer: \`/agent swap kspec-review\` or \`kspec review\``,
    keyboardShortcut: 'ctrl+shift+m',
    welcomeMessage: 'Multi-CLI review mode. Which reviewers should I invoke?'
  }
};

// Reviewer CLI configurations for multi-review
const reviewerCliConfigs = {
  copilot: {
    name: 'GitHub Copilot CLI',
    command: 'copilot',
    checkCommand: 'copilot --version',
    available: false
  },
  gemini: {
    name: 'Gemini CLI',
    command: 'gemini',
    checkCommand: 'gemini --version',
    available: false
  },
  claude: {
    name: 'Claude Code CLI',
    command: 'claude',
    checkCommand: 'claude --version',
    available: false
  },
  codex: {
    name: 'OpenAI Codex CLI',
    command: 'codex',
    checkCommand: 'codex --version',
    available: false
  },
  aider: {
    name: 'Aider',
    command: 'aider --message',
    checkCommand: 'aider --version',
    available: false
  }
};

// AGENTS.md template (auto-included by Kiro)
const agentsMdTemplate = `# AGENTS.md

This file is auto-included in every Kiro session (both IDE and CLI).
Use it for guardrails that apply across all agents.

## Project Guardrails

### Security
- Never commit secrets, API keys, or credentials
- Sanitize all user input before database queries
- Use parameterized queries to prevent SQL injection

### Code Quality
- Follow existing code style and patterns
- Write tests for new functionality
- Keep functions focused and under 50 lines

### Git Practices
- Write descriptive commit messages
- Reference issue numbers in commits
- Never force push to main/master

### Architecture
- Follow the patterns in .kiro/steering/tech.md
- Check .kiro/steering/product.md for feature context
- Respect existing module boundaries

## CLI Tool Usage
When invoking external CLIs (via shell tool), prefer:
- \`gh\` for GitHub operations
- \`npm test\` / \`pytest\` for testing
- \`git\` for version control

## Spec Workflow
1. Start with \`kspec spec\` to define work
2. Use \`kspec tasks\` to break into subtasks
3. Use \`kspec build\` for TDD implementation
4. Use \`kspec verify\` to validate completion
`;

// Kiro hooks templates
const hooksTemplateBasic = {
  hooks: {
    onSave: [
      {
        pattern: '**/*.{js,ts,jsx,tsx}',
        command: 'npx prettier --write'
      }
    ],
    onSessionStop: [
      {
        command: 'kspec refresh-context',
        description: 'Update CONTEXT.md on session end'
      }
    ]
  }
};

const hooksTemplateEnterprise = {
  hooks: {
    onSave: [
      {
        pattern: '**/*.{js,ts,jsx,tsx}',
        command: 'npx prettier --write'
      }
    ],
    onSessionStop: [
      {
        command: 'kspec refresh-context',
        description: 'Update CONTEXT.md on session end'
      }
    ],
    beforeShell: [
      {
        pattern: 'rm -rf *',
        action: 'block',
        message: 'Destructive operations blocked by policy'
      },
      {
        pattern: 'git push --force',
        action: 'block',
        message: 'Force push blocked by policy'
      }
    ],
    afterShell: [
      {
        pattern: '*',
        command: 'echo "[$(date)] $SHELL_COMMAND" >> .kiro/audit.log',
        description: 'Audit log all shell commands'
      }
    ],
    onTestComplete: [
      {
        command: 'kspec task-status --update-from-test-results',
        description: 'Auto-update task status from test results'
      }
    ]
  }
};

const hooksTemplateDocumentation = {
  hooks: {
    onSave: [
      {
        pattern: '**/*.{js,ts,jsx,tsx}',
        command: 'npx prettier --write'
      }
    ],
    onSessionStop: [
      {
        command: 'kspec refresh-context',
        description: 'Update CONTEXT.md on session end'
      },
      {
        command: 'kspec update-readme --if-changed',
        description: 'Update README if significant changes'
      }
    ],
    onSpecComplete: [
      {
        command: 'kspec sync-jira --progress',
        description: 'Update Jira with spec progress'
      }
    ]
  }
};

function validateContract(folder) {
  const specFile = path.join(folder, 'spec.md');
  if (!fs.existsSync(specFile)) return { success: true, checks: [], errors: [] };

  const content = fs.readFileSync(specFile, 'utf8');
  // Extract JSON block from ## Contract section
  const match = content.match(/## Contract\s+```json\n([\s\S]*?)\n```/);
  
  if (!match) return { success: true, checks: [], errors: [] };

  let contract;
  try {
    // Strip comments to allow user annotations
    const jsonStr = match[1].replace(/\/\/.*$/gm, '');
    contract = JSON.parse(jsonStr);
  } catch (e) {
    return { success: false, checks: [], errors: ['Invalid JSON in Contract section'] };
  }

  const errors = [];
  const checks = [];

  // Check API Schema
  if (contract.api_schema) {
    if (contract.api_schema.file) {
      if (!fs.existsSync(contract.api_schema.file)) {
        errors.push(`Missing API Schema file: ${contract.api_schema.file}`);
      } else {
        checks.push(`API Schema exists: ${contract.api_schema.file}`);
        // Basic parse check if JSON/YAML
        if (contract.api_schema.file.endsWith('.json')) {
          try {
            JSON.parse(fs.readFileSync(contract.api_schema.file, 'utf8'));
            checks.push(`API Schema is valid JSON`);
          } catch {
            errors.push(`API Schema is invalid JSON`);
          }
        }
      }
    }
  }

  // Check output files
  if (contract.output_files) {
    for (const file of contract.output_files) {
      if (!fs.existsSync(file)) {
        errors.push(`Missing required file: ${file}`);
      } else {
        checks.push(`File exists: ${file}`);
      }
    }
  }

  // Check custom checks
  if (contract.checks) {
    for (const check of contract.checks) {
      if (!check.file || !check.type || !check.text) continue;
      
      const filePath = check.file;
      if (!fs.existsSync(filePath)) {
        errors.push(`Check failed: File not found ${filePath}`);
        continue;
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      if (check.type === 'contains') {
        if (!fileContent.includes(check.text)) {
          errors.push(`Check failed: ${filePath} should contain "${check.text}"`);
        } else {
          checks.push(`Content match: ${filePath} contains text`);
        }
      } else if (check.type === 'not_contains') {
        if (fileContent.includes(check.text)) {
          errors.push(`Check failed: ${filePath} should NOT contain "${check.text}"`);
        } else {
          checks.push(`Content check: ${filePath} does not contain text`);
        }
      }
    }
  }

  return {
    success: errors.length === 0,
    errors,
    checks
  };
}

// V1 → V2 Migration (.kspec → .kiro)
async function migrateV1toV2() {
  if (!fs.existsSync(LEGACY_KSPEC_DIR)) return;

  // Inventory what exists in .kspec/
  const items = [];
  const filesToMigrate = ['config.json', '.current', 'CONTEXT.md', 'memory.md'];
  for (const file of filesToMigrate) {
    if (fs.existsSync(path.join(LEGACY_KSPEC_DIR, file))) {
      items.push(file);
    }
  }
  const specsDir = path.join(LEGACY_KSPEC_DIR, 'specs');
  let specFolders = [];
  if (fs.existsSync(specsDir)) {
    specFolders = fs.readdirSync(specsDir).filter(d =>
      fs.statSync(path.join(specsDir, d)).isDirectory()
    );
    if (specFolders.length > 0) {
      items.push(`specs/ (${specFolders.length} spec${specFolders.length > 1 ? 's' : ''})`);
    }
  }

  if (items.length === 0) {
    // .kspec exists but is empty — clean up
    try { fs.rmSync(LEGACY_KSPEC_DIR, { recursive: true }); } catch {}
    return;
  }

  console.log('\n📦 kspec v2.0 Migration\n');
  console.log('kspec now stores everything under .kiro/ instead of .kspec/');
  console.log('\nFiles to migrate:');
  items.forEach(item => console.log(`  - ${item}`));
  console.log('');

  const proceed = await confirm('Migrate .kspec/ to .kiro/ now?');

  if (!proceed) {
    console.log('\nTo migrate manually, run:');
    console.log('  mkdir -p .kiro/specs');
    console.log('  mv .kspec/config.json .kiro/ 2>/dev/null');
    console.log('  mv .kspec/.current .kiro/ 2>/dev/null');
    console.log('  mv .kspec/CONTEXT.md .kiro/ 2>/dev/null');
    console.log('  mv .kspec/memory.md .kiro/ 2>/dev/null');
    console.log('  mv .kspec/specs/* .kiro/specs/ 2>/dev/null');
    console.log('  rm -rf .kspec');
    console.log('');
    process.exit(0);
  }

  // Perform migration
  ensureDir(KIRO_DIR);
  ensureDir(SPECS_DIR);

  // Migrate individual files (skip if destination already exists)
  for (const file of filesToMigrate) {
    const src = path.join(LEGACY_KSPEC_DIR, file);
    const dest = path.join(KIRO_DIR, file);
    if (fs.existsSync(src) && !fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);
      log(`Migrated ${file}`);
    } else if (fs.existsSync(src) && fs.existsSync(dest)) {
      log(`Skipped ${file} (already exists in .kiro/)`);
    }
  }

  // Fix .current file contents — replace .kspec/ paths with .kiro/
  const currentFile = path.join(KIRO_DIR, '.current');
  if (fs.existsSync(currentFile)) {
    let content = fs.readFileSync(currentFile, 'utf8');
    if (content.includes('.kspec/')) {
      content = content.replace(/\.kspec\//g, '.kiro/');
      fs.writeFileSync(currentFile, content);
      log('Updated .current paths');
    }
  }

  // Migrate spec folders
  for (const folder of specFolders) {
    const src = path.join(specsDir, folder);
    const dest = path.join(SPECS_DIR, folder);
    if (!fs.existsSync(dest)) {
      fs.cpSync(src, dest, { recursive: true });
      fs.rmSync(src, { recursive: true });
      log(`Migrated specs/${folder}`);
    } else {
      log(`Skipped specs/${folder} (already exists)`);
    }
  }

  // Update .gitignore entries
  const gitignorePath = '.gitignore';
  if (fs.existsSync(gitignorePath)) {
    let gitignore = fs.readFileSync(gitignorePath, 'utf8');
    if (gitignore.includes('.kspec/')) {
      gitignore = gitignore.replace(/\.kspec\//g, '.kiro/');
      fs.writeFileSync(gitignorePath, gitignore);
      log('Updated .gitignore entries');
    }
  }

  // Remove empty .kspec/ directory
  try {
    const remaining = fs.readdirSync(LEGACY_KSPEC_DIR);
    if (remaining.length === 0 || (remaining.length === 1 && remaining[0] === 'specs')) {
      // Check if specs dir is also empty
      if (remaining.includes('specs')) {
        const specsRemaining = fs.readdirSync(path.join(LEGACY_KSPEC_DIR, 'specs'));
        if (specsRemaining.length === 0) {
          fs.rmSync(LEGACY_KSPEC_DIR, { recursive: true });
        } else {
          console.log(`\n⚠️  .kspec/ not fully empty after migration. Please review manually.`);
        }
      } else {
        fs.rmSync(LEGACY_KSPEC_DIR, { recursive: true });
      }
    } else {
      console.log(`\n⚠️  .kspec/ not fully empty after migration. Remaining: ${remaining.join(', ')}`);
    }
  } catch {}

  console.log('\n✅ Migration complete! All data now in .kiro/\n');
}

// Commands
const commands = {
  async init() {
    console.log('\n🚀 Welcome to kspec!\n');
    
    const dateFormat = await prompt('Date format for spec folders:', [
      { label: 'YYYY-MM-DD (2026-01-22) - sorts chronologically', value: 'YYYY-MM-DD' },
      { label: 'DD-MM-YYYY (22-01-2026)', value: 'DD-MM-YYYY' },
      { label: 'MM-DD-YYYY (01-22-2026)', value: 'MM-DD-YYYY' }
    ]);

    const autoExecute = await prompt('Command execution during build:', [
      { label: 'Ask for permission (recommended)', value: 'ask' },
      { label: 'Auto-execute (faster)', value: 'auto' },
      { label: 'Dry-run only (show, don\'t run)', value: 'dry' }
    ]);

    const testCommand = await prompt('Test command (e.g., npm test, pytest) — leave empty to skip: ');

    const createSteering = await confirm('Create steering doc templates?');

    const createAgentsMd = await confirm('Create AGENTS.md? (auto-included guardrails for Kiro)');

    const hooksChoice = await prompt('Configure Kiro hooks?', [
      { label: 'None (skip hooks)', value: 'none' },
      { label: 'Basic (format on save, context on stop)', value: 'basic' },
      { label: 'Enterprise (+ security blocks, audit log, auto-test)', value: 'enterprise' },
      { label: 'Documentation (+ README updates, Jira progress)', value: 'documentation' }
    ]);

    // Multi-CLI review configuration
    const configureReviewers = await confirm('Configure multi-CLI reviewers? (Copilot, Gemini, Claude, Codex)');
    let reviewerClis = [];

    if (configureReviewers) {
      console.log('\nSelect reviewer CLIs (kspec will orchestrate reviews):');
      const reviewerOptions = [
        { label: 'GitHub Copilot CLI (copilot)', value: 'copilot' },
        { label: 'Gemini CLI', value: 'gemini' },
        { label: 'Claude Code CLI', value: 'claude' },
        { label: 'OpenAI Codex CLI', value: 'codex' },
        { label: 'Aider', value: 'aider' }
      ];

      for (const opt of reviewerOptions) {
        const use = await confirm(`  Use ${opt.label}?`);
        if (use) reviewerClis.push(opt.value);
      }
    }

    // Check for Jira integration
    let jiraConfig = { project: null, enabled: false };
    const hasMcp = hasAtlassianMcp();

    if (hasMcp) {
      console.log('\n✅ Atlassian MCP detected!');
      const setupJira = await confirm('Configure Jira integration?');

      if (setupJira) {
        const projectKey = await prompt('Default Jira project key (e.g., SECOPS, PROJ): ');
        if (projectKey && projectKey.trim()) {
          jiraConfig = {
            project: projectKey.trim().toUpperCase(),
            enabled: true
          };
          console.log(`  Jira project set to: ${jiraConfig.project}`);
        }
      }
    } else {
      console.log('\n📋 Jira integration: Not configured');
      console.log('   To enable, run: kiro-cli mcp add --name atlassian');
      console.log('   Then run: kspec init (again to configure project)');
    }

    // Save config
    const cfg = {
      dateFormat,
      autoExecute,
      initialized: true,
      testCommand: testCommand.trim() || null,
      jira: jiraConfig,
      reviewers: reviewerClis.length > 0 ? reviewerClis : null
    };
    saveConfig(cfg);
    Object.assign(config, cfg);

    // Create directories
    ensureDir(SPECS_DIR);
    ensureDir(AGENTS_DIR);

    // Create steering templates
    if (createSteering) {
      ensureDir(STEERING_DIR);
      for (const [file, content] of Object.entries(steeringTemplates)) {
        const p = path.join(STEERING_DIR, file);
        if (!fs.existsSync(p)) {
          fs.writeFileSync(p, content);
          log(`Created ${p}`);
        }
      }
    }

    // Create AGENTS.md (auto-included by Kiro)
    if (createAgentsMd) {
      const agentsMdPath = 'AGENTS.md';
      if (!fs.existsSync(agentsMdPath)) {
        fs.writeFileSync(agentsMdPath, agentsMdTemplate);
        log('Created AGENTS.md (auto-included in Kiro sessions)');
      }
    }

    // Create Kiro hooks
    if (hooksChoice !== 'none') {
      const settingsDir = path.join(KIRO_DIR, 'settings');
      ensureDir(settingsDir);
      const hooksPath = path.join(settingsDir, 'hooks.json');

      let hooksContent;
      switch (hooksChoice) {
        case 'enterprise':
          hooksContent = hooksTemplateEnterprise;
          break;
        case 'documentation':
          hooksContent = hooksTemplateDocumentation;
          break;
        default:
          hooksContent = hooksTemplateBasic;
      }

      fs.writeFileSync(hooksPath, JSON.stringify(hooksContent, null, 2));
      log(`Created ${hooksPath} (${hooksChoice} hooks)`);
    }

    // Create agents (skip if already exist to preserve customizations)
    for (const [file, content] of Object.entries(agentTemplates)) {
      const p = path.join(AGENTS_DIR, file);
      if (!fs.existsSync(p)) {
        fs.writeFileSync(p, JSON.stringify(content, null, 2));
        log(`Created ${p}`);
      }
    }

    // Create MCP template (safe to commit, uses OAuth via mcp-remote)
    const mcpTemplatePath = path.join('.kiro', 'mcp.json.template');
    if (!fs.existsSync(mcpTemplatePath)) {
      ensureDir('.kiro');
      const mcpTemplate = {
        mcpServers: {
          atlassian: {
            command: 'npx',
            args: ['-y', 'mcp-remote', 'https://mcp.atlassian.com/v1/sse'],
            timeout: 120000
          }
        }
      };
      fs.writeFileSync(mcpTemplatePath, JSON.stringify(mcpTemplate, null, 2));
      log(`Created ${mcpTemplatePath} (commit this, OAuth handles auth)`);
    }

    // Update .gitignore for kspec (append if exists, create if not)
    const kspecGitignore = `
# kspec local state (don't commit - personal working state)
.kiro/.current
.kiro/CONTEXT.md
.kiro/settings/

# DO commit these for team collaboration:
# .kiro/config.json - project preferences
# .kiro/specs/ - specifications, tasks, memory
# .kiro/steering/ - product, tech, testing guidelines
# .kiro/agents/ - agent configurations
# .kiro/mcp.json.template - MCP template (no secrets)
`;
    const gitignorePath = '.gitignore';
    if (fs.existsSync(gitignorePath)) {
      const existing = fs.readFileSync(gitignorePath, 'utf8');
      if (!existing.includes('.kiro/.current')) {
        fs.appendFileSync(gitignorePath, kspecGitignore);
        log('Updated .gitignore with kspec entries');
      }
    } else {
      fs.writeFileSync(gitignorePath, kspecGitignore.trim() + '\n');
      log('Created .gitignore with kspec entries');
    }

    // Create initial CONTEXT.md
    refreshContext();

    console.log('\n✅ kspec initialized!\n');
    console.log('Created:');
    if (createSteering) console.log('  - .kiro/steering/ (with front matter inclusion modes)');
    if (createAgentsMd) console.log('  - AGENTS.md (auto-included by Kiro)');
    if (hooksChoice !== 'none') console.log(`  - .kiro/settings/hooks.json (${hooksChoice} hooks)`);
    console.log('  - .kiro/agents/ (kspec agents)');
    console.log('  - .kiro/CONTEXT.md (agent context file)');

    if (reviewerClis.length > 0) {
      console.log(`\n📋 Multi-CLI Reviewers: ${reviewerClis.join(', ')}`);
      console.log('   Use: kspec multi-review or /agent swap kspec-multi-review');
    }

    console.log('\nAvailable powers (browse powers/ directory):');
    console.log('  contract, document, tdd, code-review, code-intelligence\n');
    console.log('Next step:');
    console.log('  kspec analyse');
    console.log('  or inside kiro-cli: /agent swap kspec-analyse\n');
  },

  async analyse() {
    log('Analysing codebase...');
    await chat(`Analyse this codebase:
1. Identify tech stack, architecture, patterns
2. Review existing .kiro/steering/ docs (if any)
3. Suggest updates to steering docs
4. Identify risks and improvement areas

Update steering docs as needed.`, 'kspec-analyse');
  },

  async spec(args) {
    // Parse --jira flag
    const jiraIndex = args.findIndex(a => a === '--jira' || a.startsWith('--jira='));
    let jiraIssues = null;

    if (jiraIndex !== -1) {
      // Check prerequisite
      requireAtlassianMcp();

      if (args[jiraIndex].startsWith('--jira=')) {
        jiraIssues = args[jiraIndex].split('=')[1];
        args.splice(jiraIndex, 1);
      } else if (args[jiraIndex + 1] && !args[jiraIndex + 1].startsWith('-')) {
        jiraIssues = args[jiraIndex + 1];
        args.splice(jiraIndex, 2);
      } else {
        die('Usage: kspec spec --jira PROJ-123,PROJ-124 "Feature Name"');
      }
    }

    const feature = args.join(' ');
    if (!feature && !jiraIssues) die('Usage: kspec spec "Feature Name" [--jira ISSUE-123,ISSUE-456]');

    const date = formatDate(config.dateFormat || 'YYYY-MM-DD');
    const featureName = feature || `jira-${jiraIssues.split(',')[0].toLowerCase()}`;

    log('Generating spec folder name...');
    const slug = await generateSlug(featureName);
    const folder = path.join(getSpecsDir(), `${date}-${slug}`);
    ensureDir(folder);
    setCurrentSpec(folder);

    recordMetric(folder, 'spec-started');
    log(`Spec folder: ${folder}`);

    if (jiraIssues) {
      // Jira-driven spec creation
      log(`Pulling requirements from Jira: ${jiraIssues}`);
      await chat(`Create specification from Jira issues: ${jiraIssues}

Folder: ${folder}

WORKFLOW:
1. Use Atlassian MCP to fetch each Jira issue: ${jiraIssues}
2. Extract from each issue:
   - Summary and description
   - Acceptance criteria
   - Comments (for context)
   - Linked issues
3. Consolidate into unified spec.md with:
   - Problem/Context (from issue descriptions)
   - Requirements (from acceptance criteria)
   - Source attribution: "Source: JIRA-XXX" for each requirement
   - Links to original issues
4. Create spec-lite.md (<500 words, key requirements only)
5. Save Jira issue keys to ${folder}/jira-links.json

IMPORTANT: Include Jira links for traceability.`, 'kspec-jira');
    } else {
      // Standard spec creation
      await chat(`Create specification for: ${feature}

Folder: ${folder}

1. Read .kiro/steering/ for context
2. Create ${folder}/spec.md with full specification
3. IMMEDIATELY create ${folder}/spec-lite.md (concise version, <500 words)

spec-lite.md is critical - it's loaded after context compression.`, 'kspec-spec');
    }

    recordMetric(folder, 'spec-completed');
    console.log('\nNext step:');
    console.log('  kspec design   (create technical design)');
    console.log('  kspec tasks    (skip design, generate tasks directly)');
    console.log('  or inside kiro-cli: /agent swap kspec-design\n');
  },

  async 'verify-spec'(args) {
    const folder = getOrSelectSpec(args.join(' '));
    log(`Verifying spec: ${folder}`);

    await chat(`VERIFY-SPEC: Interactively review and shape the specification in ${folder}/spec.md.

1. Read spec.md thoroughly
2. Generate 4-8 targeted, NUMBERED clarifying questions:
   - Propose sensible assumptions: "I assume X, is that correct?"
   - Suggest reasonable defaults for each question
   - Make it easy to confirm or provide alternatives
   - End with an open question about exclusions
3. Wait for my responses
4. Based on answers, suggest specific updates to spec.md
5. Get my confirmation before making changes
6. Update spec.md and regenerate spec-lite.md

Read the codebase to check implementability and inform your questions.`, 'kspec-verify');
  },

  async design(args) {
    const folder = getOrSelectSpec(args.join(' '));
    const specFile = path.join(folder, 'spec.md');

    if (!fs.existsSync(specFile)) {
      die(`No spec.md found in ${folder}. Run 'kspec spec "Feature"' first.`);
    }

    recordMetric(folder, 'design-started');
    log(`Creating design: ${folder}`);

    await chat(`Create technical design from specification.

Spec folder: ${folder}
Read: ${folder}/spec.md and ${folder}/spec-lite.md

Create ${folder}/design.md with these sections:
- Architecture Overview
- Component Breakdown
- Data Models
- API Contracts
- Dependency Mapping
- Technical Decisions
- Risk Assessment

Read the codebase to inform your architecture decisions.`, 'kspec-design');

    recordMetric(folder, 'design-completed');
    console.log('\nNext step:');
    console.log('  kspec verify-design  (review design)');
    console.log('  kspec tasks          (generate tasks)');
    console.log('  or inside kiro-cli: /agent swap kspec-tasks\n');
  },

  async 'verify-design'(args) {
    const folder = getOrSelectSpec(args.join(' '));
    const designFile = path.join(folder, 'design.md');

    if (!fs.existsSync(designFile)) {
      die(`No design.md found in ${folder}. Run 'kspec design' first.`);
    }

    log(`Verifying design: ${folder}`);

    await chat(`VERIFY-DESIGN: Review the technical design in ${folder}/design.md against ${folder}/spec.md.

1. Check design covers all spec requirements
2. Verify architecture decisions are sound
3. Check component breakdown is complete
4. Confirm data models and API contracts are well-defined
5. Identify risks or gaps

Report: PASS/FAIL with specific issues.`, 'kspec-verify');
  },

  async 'jira-pull'(args) {
    requireAtlassianMcp();

    const folder = getOrSelectSpec(args.join(' '));
    const jiraLinksFile = path.join(folder, 'jira-links.json');

    if (!fs.existsSync(jiraLinksFile)) {
      die(`No jira-links.json found in ${folder}. Run 'kspec spec --jira' or 'kspec sync-jira' first.`);
    }

    log(`Pulling Jira updates: ${folder}`);

    await chat(`PULL UPDATES: Fetch latest changes from linked Jira issues.

Spec folder: ${folder}
Jira links: ${jiraLinksFile}

WORKFLOW:
1. Read ${jiraLinksFile} for linked issue keys
2. Use Atlassian MCP to fetch latest state of each linked issue
3. Read current ${folder}/spec.md
4. Compare and generate a CHANGE REPORT showing:
   - New/modified acceptance criteria
   - Updated descriptions or summaries
   - New comments with relevant context
   - Status changes
5. Present the CHANGE REPORT for review
6. NEVER auto-update spec.md — wait for confirmation
7. After confirmation, update spec.md and regenerate spec-lite.md

IMPORTANT: Always present changes and get user approval before modifying spec.`, 'kspec-jira');
  },

  async 'sync-jira'(args) {
    // Check prerequisite
    requireAtlassianMcp();

    const folder = getOrSelectSpec();

    // Parse flags
    const createFlag = args.includes('--create');
    const updateIndex = args.findIndex(a => a === '--update' || a.startsWith('--update='));
    const projectIndex = args.findIndex(a => a === '--project' || a.startsWith('--project='));
    let updateIssue = null;
    let project = null;

    // Parse --project flag
    if (projectIndex !== -1) {
      if (args[projectIndex].startsWith('--project=')) {
        project = args[projectIndex].split('=')[1].toUpperCase();
      } else if (args[projectIndex + 1] && !args[projectIndex + 1].startsWith('-')) {
        project = args[projectIndex + 1].toUpperCase();
      }
    }

    // Fall back to configured project
    if (!project) {
      project = getJiraProject();
    }

    if (updateIndex !== -1) {
      if (args[updateIndex].startsWith('--update=')) {
        updateIssue = args[updateIndex].split('=')[1];
      } else if (args[updateIndex + 1] && !args[updateIndex + 1].startsWith('-')) {
        updateIssue = args[updateIndex + 1];
      } else {
        die('Usage: kspec sync-jira --update PROJ-123');
      }
    }

    if (!createFlag && !updateIssue) {
      // Smart default: check if spec already has a linked Jira issue
      const jiraLinksFile = path.join(folder, 'jira-links.json');
      if (fs.existsSync(jiraLinksFile)) {
        try {
          const links = JSON.parse(fs.readFileSync(jiraLinksFile, 'utf8'));
          if (links.specIssue) {
            updateIssue = links.specIssue;
            log(`Found existing issue ${updateIssue}, updating (use --create to force new)`);
          }
        } catch {}
      }
      if (!updateIssue) {
        log('No existing Jira issue found, will create new');
        if (!project) {
          die(`No Jira project configured.

Run 'kspec init' to set a default project, or specify with --project:
  kspec sync-jira --project SECOPS`);
        }
      }
    }

    log(`Syncing spec to Jira: ${folder}`);
    if (project && !updateIssue) {
      log(`Target project: ${project}`);
    }

    if (updateIssue) {
      await chat(`Update existing Jira issue with specification.

Spec folder: ${folder}
Target issue: ${updateIssue}

WORKFLOW:
1. Read ${folder}/spec.md
2. Use Atlassian MCP to update ${updateIssue}:
   - Update description with spec content (or add as comment)
   - Add label: kspec-spec
   - Add comment: "Technical specification updated via kspec"
3. Update ${folder}/jira-links.json with the issue key
4. Update .kiro/CONTEXT.md with Jira link

Report the updated issue URL.`, 'kspec-jira');
    } else {
      await chat(`Create new Jira issue from specification.

Spec folder: ${folder}
Target project: ${project}

WORKFLOW:
1. Read ${folder}/spec.md and ${folder}/spec-lite.md
2. Check ${folder}/jira-links.json for source issues to link
3. Use Atlassian MCP to create new issue in project ${project}:
   - Type: Task or Story (based on project settings)
   - Summary: Extract from spec title
   - Description: Include spec-lite.md content
   - Labels: kspec-spec, technical-specification
   - Link to source issues if any
4. Add comment requesting BA/PM review
5. Save new issue key to ${folder}/jira-links.json
6. Update .kiro/CONTEXT.md with new Jira link

Report the created issue URL.`, 'kspec-jira');
    }
  },

  async 'jira-subtasks'(args) {
    // Check prerequisite
    requireAtlassianMcp();

    const folder = getOrSelectSpec();
    const tasksFile = path.join(folder, 'tasks.md');

    if (!fs.existsSync(tasksFile)) {
      die(`No tasks.md found in ${folder}. Run 'kspec tasks' first.`);
    }

    // Check for parent issue
    const jiraLinksFile = path.join(folder, 'jira-links.json');
    let parentIssue = args[0];

    if (!parentIssue && fs.existsSync(jiraLinksFile)) {
      try {
        const links = JSON.parse(fs.readFileSync(jiraLinksFile, 'utf8'));
        parentIssue = links.specIssue || links.sourceIssues?.[0];
      } catch {}
    }

    if (!parentIssue) {
      die(`No parent issue specified. Usage: kspec jira-subtasks PROJ-123
Or run 'kspec sync-jira' first to create a spec issue.`);
    }

    log(`Creating Jira subtasks from: ${folder}`);

    await chat(`Create Jira subtasks from tasks.md.

Spec folder: ${folder}
Parent issue: ${parentIssue}
Tasks file: ${tasksFile}

WORKFLOW:
1. Read ${tasksFile}
2. For each uncompleted task (- [ ]):
   - Use Atlassian MCP to create subtask under ${parentIssue}
   - Summary: Task description
   - Description: Include any details, file paths mentioned
   - Labels: kspec-task
3. Save created subtask keys to ${folder}/jira-links.json
4. Update .kiro/CONTEXT.md with subtask links

Report created subtasks with their URLs.`, 'kspec-jira');
  },

  async tasks(args) {
    const folder = getOrSelectSpec(args.join(' '));

    if (!await checkStaleness(folder)) return;

    autoRefreshSpecLite(folder);
    recordMetric(folder, 'tasks-started');
    log(`Generating tasks: ${folder}`);

    const designFile = path.join(folder, 'design.md');
    const hasDesign = fs.existsSync(designFile);

    await chat(`Generate tasks from specification.

Spec folder: ${folder}
Read: ${folder}/spec.md and ${folder}/spec-lite.md
${hasDesign ? `Design: ${folder}/design.md (use for architecture guidance and dependency ordering)` : ''}

Create ${folder}/tasks.md with:
- Checkbox format: "- [ ] Task description"
- TDD approach (test first)
- Logical order
- File paths for each task`, 'kspec-tasks');

    recordMetric(folder, 'tasks-completed');
    console.log('\nNext step:');
    console.log('  kspec build');
    console.log('  or inside kiro-cli: /agent swap kspec-build\n');
  },

  async 'verify-tasks'(args) {
    const folder = getOrSelectSpec(args.join(' '));

    if (!await checkStaleness(folder)) return;

    autoRefreshSpecLite(folder);
    const stats = getTaskStats(folder);

    log(`Verifying tasks: ${folder}`);
    if (stats) log(`Progress: ${stats.done}/${stats.total} tasks completed`);

    await chat(`Verify tasks in ${folder}/tasks.md:

1. Do tasks cover ALL requirements from spec.md?
2. Check completion status of each task
3. For completed tasks, verify test coverage
4. Identify any missing tasks

Report: X/Y tasks done, gaps found, coverage assessment.`, 'kspec-verify');
  },

  async build(args) {
    const folder = getOrSelectSpec(args.join(' '));

    if (!await checkStaleness(folder)) return;

    autoRefreshSpecLite(folder);
    const stats = getTaskStats(folder);

    log(`Building: ${folder}`);
    if (stats) {
      if (stats.remaining === 0) {
        log('All tasks completed!');
        console.log('\nNext step:');
        console.log('  kspec verify');
        console.log('  or inside kiro-cli: /agent swap kspec-verify\n');
        return;
      }
      log(`Progress: ${stats.done}/${stats.total} (${stats.remaining} remaining)`);
    }

    recordMetric(folder, 'build-started');
    const execMode = config.autoExecute || 'ask';
    const execNote = execMode === 'auto' ? 'Auto-execute enabled.' :
                     execMode === 'dry' ? 'Dry-run mode - show commands only.' :
                     'Ask before executing commands.';

    await chat(`Execute tasks from ${folder}/tasks.md

${execNote}

1. Find first uncompleted task (- [ ])
2. Write test first (TDD)
3. Implement to pass test
4. Run tests
5. Mark complete: change "- [ ]" to "- [x]" in tasks.md
6. Save tasks.md after each completion
7. Continue to next task

CRITICAL: Update tasks.md after each task completion.
NEVER delete .kiro folders.`, 'kspec-build');

    recordMetric(folder, 'build-completed');

    // Run test command as sanity check (non-blocking)
    if (config.testCommand) {
      log(`Running sanity check: ${config.testCommand}`);
      try {
        execSync(config.testCommand, { stdio: 'inherit', timeout: 120000 });
        log('Tests passed');
      } catch (e) {
        console.error('Tests failed after build. Review before proceeding.');
      }
    }

    // Show next step based on remaining tasks
    const updatedStats = getTaskStats(folder);
    if (updatedStats && updatedStats.remaining === 0) {
      console.log('\nAll tasks completed!');
      console.log('Next step:');
      console.log('  kspec verify');
      console.log('  or inside kiro-cli: /agent swap kspec-verify\n');
    } else if (updatedStats && updatedStats.remaining > 0) {
      console.log(`\n${updatedStats.remaining} tasks remaining.`);
      console.log('Continue: kspec build\n');
    }
  },

  async verify(args) {
    const folder = getOrSelectSpec(args.join(' '));

    if (!await checkStaleness(folder)) return;

    autoRefreshSpecLite(folder);

    const stats = getTaskStats(folder);

    log(`Verifying implementation: ${folder}`);
    if (stats) log(`Tasks: ${stats.done}/${stats.total}`);

    // Run test command if configured (Gap 2 — independent validation)
    if (config.testCommand) {
      log(`Running tests: ${config.testCommand}`);
      try {
        execSync(config.testCommand, { stdio: 'inherit', timeout: 120000 });
        log('Tests passed');
      } catch (e) {
        console.error('Tests failed! Fix before proceeding.');
        return;
      }
    }

    recordMetric(folder, 'verify-started');

    // Verify contract if exists
    console.log('Validating contract...');
    const contractResult = validateContract(folder);
    if (!contractResult.success) {
      console.log('\n❌ Contract checks failed:');
      contractResult.errors.forEach(e => console.log(`  - ${e}`));
    } else if (contractResult.checks.length > 0) {
      console.log('✅ Contract checks passed');
    }

    await chat(`Verify implementation for ${folder}:

CONTRACT VALIDATION RESULTS:
${JSON.stringify(contractResult, null, 2)}

1. Read spec.md - list all requirements
2. Read tasks.md - check all marked [x]
3. Check codebase - does implementation match spec?
4. Run tests - do they pass?
5. Check coverage - are requirements tested?

Report:
- Requirements: X/Y implemented
- Tasks: X/Y completed
- Tests: PASS/FAIL
- Contract: ${contractResult.success ? 'PASS' : 'FAIL'}
- Gaps: [list any]`, 'kspec-verify');

    recordMetric(folder, 'verify-completed');
    console.log('\nIf verification passed:');
    console.log('  kspec done  (to complete spec and harvest learnings)\n');
  },

  async refresh(args) {
    // Parse --force flag
    const forceIndex = args.indexOf('--force');
    const force = forceIndex !== -1;
    if (force) args.splice(forceIndex, 1);

    const folder = getOrSelectSpec(args.join(' '));
    const specFile = path.join(folder, 'spec.md');
    const specLiteFile = path.join(folder, 'spec-lite.md');

    if (!fs.existsSync(specFile)) {
      die(`No spec.md found in ${folder}`);
    }

    const stale = isSpecStale(folder);
    if (!stale && !force) {
      log('spec-lite.md is up to date with spec.md');
      log('Use --force to regenerate anyway');
      return;
    }

    // Read the current spec.md content
    const specContent = fs.readFileSync(specFile, 'utf8');

    log(`Refreshing spec-lite.md from ${folder}/spec.md...`);

    await chat(`URGENT: Regenerate spec-lite.md NOW.

TARGET FILE: ${specLiteFile}

CURRENT spec.md CONTENT (source of truth):
---
${specContent}
---

YOUR TASK:
1. Write a NEW ${specLiteFile} file immediately
2. Summarize the above spec.md content (under 500 words)
3. MUST include:
   - All tech stack with EXACT versions (e.g., Next.js 16+, NOT 14+)
   - Key requirements and acceptance criteria
   - Any Jira references

DO THIS NOW:
- Use your write tool to create ${specLiteFile}
- Copy the tech stack details EXACTLY as shown above
- Do not read the old spec-lite.md, replace it completely

After writing, show me what you wrote.`, 'kspec-spec');

    // Verify spec-lite.md was updated
    if (isSpecStale(folder)) {
      console.log('\n⚠️  spec-lite.md may not have been updated correctly.');
      console.log('   Please verify the file was written with updated content.\n');
    } else {
      log('spec-lite.md updated successfully');
    }

    // Update CONTEXT.md with new spec-lite
    refreshContext();
    log('Context refreshed');
  },

  async done(args) {
    const folder = getOrSelectSpec(args.join(' '));
    const stats = getTaskStats(folder);

    if (stats && stats.remaining > 0) {
      const proceed = await confirm(`${stats.remaining} tasks remaining. Mark done anyway?`);
      if (!proceed) return;
    }

    recordMetric(folder, 'done');
    log(`Completing: ${folder}`);

    // Create memory
    await chat(`Harvest learnings from ${folder}:

1. Read spec.md, tasks.md, and implementation
2. Create ${folder}/memory.md with:
   - Key decisions made
   - Patterns used
   - Lessons learned
   - Follow-ups needed

3. Update .kiro/memory.md (project-level) with:
   - New glossary terms
   - Reusable patterns
   - Cross-cutting learnings`, 'kspec-analyse');

    log('Spec completed!');
  },

  async review(args) {
    const target = args.join(' ') || 'recent changes (git diff HEAD~1)';
    await chat(`Review: ${target}

Check compliance with .kiro/steering/
Evaluate quality, tests, security.
Output: APPROVE or REQUEST_CHANGES with specifics.`, 'kspec-review');
  },

  async 'multi-review'(args) {
    const target = args.join(' ') || 'recent changes (git diff HEAD~1)';
    const cfg = loadConfig();
    const reviewers = cfg.reviewers || [];

    if (reviewers.length === 0) {
      console.log('\nNo multi-CLI reviewers configured.');
      console.log('Run: kspec init (and enable reviewers)');
      console.log('Or use single reviewer: kspec review\n');
      return;
    }

    console.log(`\nMulti-CLI Review: ${target}`);
    console.log(`Reviewers: ${reviewers.join(', ')}\n`);

    await chat(`Multi-CLI review: ${target}

Configured reviewers: ${reviewers.join(', ')}
Invoke each configured reviewer CLI and synthesize feedback.
Output unified review summary with attribution.`, 'kspec-multi-review');
  },

  list() {
    const specsDir = getSpecsDir();
    if (!fs.existsSync(specsDir)) {
      console.log('No specs yet. Run: kspec spec "Feature Name"');
      return;
    }

    const current = getCurrentSpec();
    const specs = fs.readdirSync(specsDir)
      .filter(d => fs.statSync(path.join(specsDir, d)).isDirectory())
      .sort().reverse();

    if (specs.length === 0) {
      console.log('No specs yet. Run: kspec spec "Feature Name"');
      return;
    }

    console.log('\nSpecs:\n');
    specs.forEach(s => {
      const folder = path.join(specsDir, s);
      const isCurrent = folder === current;
      const stats = getTaskStats(folder);
      const progress = stats ? `[${stats.done}/${stats.total}]` : '[no tasks]';
      console.log(`  ${isCurrent ? '→' : ' '} ${s} ${progress}`);
    });
    console.log('');
  },

  status() {
    const current = getCurrentSpec();
    const jiraProject = getJiraProject();
    const hasMcp = hasAtlassianMcp();

    console.log('\nkspec Status\n');
    console.log(`CLI: ${detectCli() || '(not installed)'}`);
    console.log(`Initialized: ${config.initialized ? 'yes' : 'no'}`);
    console.log(`Date format: ${config.dateFormat || 'YYYY-MM-DD'}`);
    console.log(`Auto-execute: ${config.autoExecute || 'ask'}`);
    console.log(`Jira MCP: ${hasMcp ? '✅ configured' : '❌ not configured'}`);
    if (jiraProject) {
      console.log(`Jira project: ${jiraProject}`);
    } else if (hasMcp) {
      console.log(`Jira project: (not configured - run kspec init)`);
    }

    if (current) {
      console.log(`\nCurrent spec: ${path.basename(current)}`);
      const metadataFile = path.join(current, 'metadata.json');
      if (fs.existsSync(metadataFile)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
          if (metadata.type) console.log(`Type: ${metadata.type}`);
        } catch {}
      }
      const specFile = path.join(current, 'spec.md');
      const designFile = path.join(current, 'design.md');
      const tasksFile = path.join(current, 'tasks.md');
      const hasSpec = fs.existsSync(specFile);
      const hasDesign = fs.existsSync(designFile);
      const hasTasks = fs.existsSync(tasksFile);
      const stats = getTaskStats(current);

      console.log(`Spec: ${hasSpec ? 'yes' : 'no'}`);
      console.log(`Design: ${hasDesign ? 'yes' : 'no (optional)'}`);
      console.log(`Tasks: ${hasTasks ? 'yes' : 'no'}`);

      if (stats) {
        console.log(`Progress: ${stats.done}/${stats.total} completed`);
        if (stats.remaining > 0) {
          console.log(`\nNext step:`);
          console.log(`  kspec build`);
          console.log(`  or inside kiro-cli: /agent swap kspec-build`);
        } else {
          console.log(`\nNext step:`);
          console.log(`  kspec verify`);
          console.log(`  or inside kiro-cli: /agent swap kspec-verify`);
        }
      } else if (!hasDesign && hasSpec) {
        console.log(`\nNext step:`);
        console.log(`  kspec design   (create technical design)`);
        console.log(`  kspec tasks    (skip design, generate tasks)`);
        console.log(`  or inside kiro-cli: /agent swap kspec-design`);
      } else if (hasDesign && !hasTasks) {
        console.log(`\nNext step:`);
        console.log(`  kspec tasks`);
        console.log(`  or inside kiro-cli: /agent swap kspec-tasks`);
      } else if (!hasSpec) {
        console.log(`\nNext step:`);
        console.log(`  kspec spec "Feature Name"`);
        console.log(`  or inside kiro-cli: /agent swap kspec-spec`);
      }
    } else {
      console.log(`\nNo current spec.`);
      console.log(`  kspec spec "Feature Name"`);
      console.log(`  or inside kiro-cli: /agent swap kspec-spec`);
    }
    console.log('');
  },

  context() {
    const content = refreshContext();
    console.log(content);
    console.log(`Context saved to: .kiro/CONTEXT.md\n`);
  },

  agents() {
    console.log(`
kspec Agents

Agent              Shortcut        Purpose
───────────────────────────────────────────────────────────────
kspec-analyse      Ctrl+Shift+A    Analyse codebase, update steering
kspec-spec         Ctrl+Shift+S    Create specifications
kspec-design       Ctrl+Shift+D    Create technical design from spec
kspec-tasks        Ctrl+Shift+T    Generate tasks from spec
kspec-build        Ctrl+Shift+B    Execute tasks with TDD
kspec-verify       Ctrl+Shift+V    Verify spec/design/tasks/implementation
kspec-review       Ctrl+Shift+R    Code review (single reviewer)
kspec-multi-review Ctrl+Shift+M    Multi-CLI review (Copilot/Gemini/Claude/Codex)
kspec-jira         Ctrl+Shift+J    Jira integration
kspec-fix          Ctrl+Shift+F    Fix bugs (abbreviated pipeline)
kspec-refactor     Ctrl+Shift+G    Refactor code (no behavior change)
kspec-spike        Ctrl+Shift+I    Investigate/spike (no code)
kspec-revise       Ctrl+Shift+E    Revise spec from feedback
kspec-demo         Ctrl+Shift+W    Generate stakeholder walkthrough
kspec-estimate     Ctrl+Shift+X    Assess complexity

Switch: /agent swap or use keyboard shortcuts

Powers: contract, document, tdd, code-review, code-intelligence
  Browse: powers/ directory in kspec repo
`);
  },

  async update() {
    console.log(`\nkspec v${pkg.version}\n`);
    console.log('Checking for updates...');

    try {
      const https = require('https');
      const data = await new Promise((resolve, reject) => {
        const req = https.get('https://registry.npmjs.org/kspec/latest', { timeout: 5000 }, res => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => resolve(body));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      });

      const latest = JSON.parse(data).version;
      saveUpdateCheck();

      if (compareVersions(pkg.version, latest) < 0) {
        console.log(`\nUpdate available: ${pkg.version} → ${latest}`);
        console.log('\nTo update, run:');
        console.log('  npm install -g kspec\n');
      } else {
        console.log(`\nYou're on the latest version!\n`);
      }
    } catch (err) {
      console.error('\nCould not check for updates. Check your internet connection.\n');
    }
  },

  async fix(args) {
    const description = args.join(' ');
    if (!description) die('Usage: kspec fix "Description of the bug"');

    const date = formatDate(config.dateFormat || 'YYYY-MM-DD');
    const slug = await generateSlug(`fix-${description}`);
    const folder = path.join(getSpecsDir(), `${date}-${slug}`);
    ensureDir(folder);
    setCurrentSpec(folder);

    fs.writeFileSync(path.join(folder, 'metadata.json'), JSON.stringify({
      type: 'fix',
      description,
      createdAt: new Date().toISOString()
    }, null, 2));

    recordMetric(folder, 'fix-started');
    log(`Bug fix: ${folder}`);

    await chat(`BUG FIX MODE: ${description}

1. Read codebase to understand the area related to this bug
2. Create ${folder}/spec.md with:
   - Bug description
   - Steps to reproduce (if inferable)
   - Expected vs actual behavior
   - Root cause analysis
   - Fix approach
3. Create ${folder}/tasks.md with fix tasks (test first):
   - Write failing test that reproduces the bug
   - Implement fix
   - Verify fix doesn't break existing tests
4. Execute tasks immediately (TDD)
5. Mark tasks complete as you go

CRITICAL: Write test first, then fix. Update tasks.md after each step.`, 'kspec-fix');

    recordMetric(folder, 'fix-completed');
    console.log('\nNext step:');
    console.log('  kspec verify  (verify the fix)');
    console.log('  kspec done    (complete and harvest learnings)\n');
  },

  async refactor(args) {
    const description = args.join(' ');
    if (!description) die('Usage: kspec refactor "What to refactor and why"');

    const date = formatDate(config.dateFormat || 'YYYY-MM-DD');
    const slug = await generateSlug(`refactor-${description}`);
    const folder = path.join(getSpecsDir(), `${date}-${slug}`);
    ensureDir(folder);
    setCurrentSpec(folder);

    fs.writeFileSync(path.join(folder, 'metadata.json'), JSON.stringify({
      type: 'refactor',
      description,
      createdAt: new Date().toISOString()
    }, null, 2));

    recordMetric(folder, 'refactor-started');
    log(`Refactor: ${folder}`);

    await chat(`REFACTOR MODE: ${description}

1. Read the codebase area being refactored
2. Create ${folder}/spec.md with:
   - Current state (what exists)
   - Target state (what it should look like)
   - Constraints (behavior must not change)
   - Refactor approach
3. Create ${folder}/tasks.md with refactor tasks:
   - Ensure existing tests pass first
   - Restructure step by step
   - Run tests after each change
4. Execute tasks

CRITICAL: Run existing tests before AND after each change. No behavior changes.`, 'kspec-refactor');

    recordMetric(folder, 'refactor-completed');
    console.log('\nNext step:');
    console.log('  kspec verify  (verify no behavior changes)\n');
  },

  async spike(args) {
    const description = args.join(' ');
    if (!description) die('Usage: kspec spike "Question to investigate"');

    const date = formatDate(config.dateFormat || 'YYYY-MM-DD');
    const slug = await generateSlug(`spike-${description}`);
    const folder = path.join(getSpecsDir(), `${date}-${slug}`);
    ensureDir(folder);
    setCurrentSpec(folder);

    fs.writeFileSync(path.join(folder, 'metadata.json'), JSON.stringify({
      type: 'spike',
      description,
      createdAt: new Date().toISOString()
    }, null, 2));

    recordMetric(folder, 'spike-started');
    log(`Spike: ${folder}`);

    await chat(`SPIKE MODE: ${description}

This is an investigation, not an implementation.

1. Research the question/problem
2. Create ${folder}/spec.md as a FINDINGS REPORT with:
   - Question/hypothesis
   - Investigation approach
   - Findings (with code examples if relevant)
   - Recommendations
   - Risks identified
   - Estimated effort for implementation (S/M/L/XL)
3. Do NOT implement anything — research only
4. Create ${folder}/memory.md with key learnings

Output findings clearly for decision-making.`, 'kspec-spike');

    recordMetric(folder, 'spike-completed');
    console.log('\nSpike complete. Review findings in:');
    console.log(`  ${folder}/spec.md\n`);
    console.log('Next step:');
    console.log('  kspec spec "Feature"  (if proceeding to implementation)');
    console.log('  kspec done            (to archive spike learnings)\n');
  },

  async revise(args) {
    const folder = getOrSelectSpec(args.join(' '));
    const specFile = path.join(folder, 'spec.md');

    if (!fs.existsSync(specFile)) {
      die(`No spec.md found in ${folder}. Nothing to revise.`);
    }

    recordMetric(folder, 'revise-started');
    log(`Revising spec: ${folder}`);

    await chat(`REVISE SPEC: Review and update the specification in ${folder}/spec.md based on feedback.

1. Read the current ${folder}/spec.md
2. Read ${folder}/tasks.md if it exists (to understand implementation state)
3. Ask me what feedback or changes are needed
4. Update spec.md with the changes
5. If tasks.md exists, identify which tasks are affected:
   - Mark affected completed tasks for re-verification
   - Add new tasks if needed
   - Note removed requirements
6. Regenerate spec-lite.md
7. Update .kiro/CONTEXT.md

IMPORTANT: Show a diff summary of what changed in the spec before confirming.`, 'kspec-revise');

    recordMetric(folder, 'revise-completed');
    console.log('\nSpec revised. Next step:');
    console.log('  kspec verify-spec  (review revised spec)');
    console.log('  kspec tasks        (regenerate tasks if needed)\n');
  },

  async demo(args) {
    const folder = getOrSelectSpec(args.join(' '));
    const specFile = path.join(folder, 'spec.md');

    if (!fs.existsSync(specFile)) {
      die(`No spec.md found in ${folder}. Nothing to demo.`);
    }

    recordMetric(folder, 'demo-started');
    log(`Generating demo walkthrough: ${folder}`);

    await chat(`DEMO MODE: Generate a stakeholder walkthrough for the implementation in ${folder}.

1. Read ${folder}/spec.md for requirements
2. Read ${folder}/tasks.md for implementation status
3. Examine the actual implementation in the codebase
4. Generate a DEMO WALKTHROUGH showing:
   - What was built (mapped to spec requirements)
   - How to test/verify each feature
   - What's working vs what's pending
   - Key decisions made during implementation
   - Screenshots/examples where applicable
5. Write the walkthrough to ${folder}/demo.md
6. Highlight anything that needs stakeholder input

This is for human review, not AI verification.`, 'kspec-demo');

    recordMetric(folder, 'demo-completed');
    console.log('\nDemo walkthrough written to:');
    console.log(`  ${folder}/demo.md\n`);
    console.log('After stakeholder review:');
    console.log('  kspec revise   (if changes needed)');
    console.log('  kspec done     (if approved)\n');
  },

  async estimate(args) {
    const folder = getOrSelectSpec(args.join(' '));
    const specFile = path.join(folder, 'spec.md');

    if (!fs.existsSync(specFile)) {
      die(`No spec.md found in ${folder}. Create a spec first.`);
    }

    log(`Estimating complexity: ${folder}`);

    await chat(`ESTIMATE: Assess complexity of the specification in ${folder}/spec.md.

1. Read ${folder}/spec.md thoroughly
2. Read the codebase to understand current state
3. Read .kiro/memory.md for relevant past experience
4. Provide a COMPLEXITY ASSESSMENT:

   **T-shirt Size**: S / M / L / XL

   **Breakdown**:
   - New files to create: ~N
   - Existing files to modify: ~N
   - Estimated tasks: ~N
   - Key risks: [list]

   **Confidence**: High / Medium / Low
   (Low if spec is ambiguous or codebase is unfamiliar)

   **Recommendation**:
   - S: Skip design, go straight to tasks
   - M: Consider design step
   - L/XL: Design step recommended, consider breaking into smaller specs

   **Similar past work**: [reference memory.md entries if relevant]

5. Write estimate to ${folder}/estimate.md

This is advisory — it doesn't block any commands.`, 'kspec-estimate');

    console.log('\nEstimate written to:');
    console.log(`  ${folder}/estimate.md\n`);
    console.log('Next step:');
    console.log('  kspec design   (for L/XL specs)');
    console.log('  kspec tasks    (for S/M specs)\n');
  },

  async memory(args) {
    const subcommand = args[0] || 'show';

    if (subcommand === 'show') {
      const memFile = path.join(KIRO_DIR, 'memory.md');
      if (!fs.existsSync(memFile)) {
        log('No project memory yet. Complete a spec with `kspec done` to start accumulating.');
        return;
      }
      console.log(fs.readFileSync(memFile, 'utf8'));
      return;
    }

    if (subcommand === 'review') {
      const memFile = path.join(KIRO_DIR, 'memory.md');
      if (!fs.existsSync(memFile)) {
        log('No project memory to review.');
        return;
      }

      log('Reviewing project memory...');
      await chat(`MEMORY REVIEW: Analyse and improve .kiro/memory.md.

1. Read .kiro/memory.md
2. Identify:
   - Outdated entries (tech/patterns that are no longer used)
   - Duplicates (same learning recorded multiple times)
   - Contradictions (conflicting advice)
   - Entries that should be promoted to steering docs
3. Present a REVIEW REPORT showing what to keep, merge, remove, or promote
4. Wait for my confirmation before making changes
5. Update memory.md with approved changes

NEVER delete without confirmation.`, 'kspec-analyse');
      return;
    }

    if (subcommand === 'prune') {
      const memFile = path.join(KIRO_DIR, 'memory.md');
      if (!fs.existsSync(memFile)) {
        log('No project memory to prune.');
        return;
      }

      log('Pruning project memory...');
      await chat(`MEMORY PRUNE: Remove outdated entries from .kiro/memory.md.

1. Read .kiro/memory.md
2. Read .kiro/steering/ docs for current project state
3. Read the codebase to verify which technologies/patterns are actually in use
4. Identify entries that are:
   - About technologies no longer in the project
   - Superseded by newer learnings
   - Already captured in steering docs
5. Show what will be removed and why
6. Wait for confirmation
7. Update memory.md

Be conservative — when in doubt, keep the entry.`, 'kspec-analyse');
      return;
    }

    die(`Unknown memory subcommand: ${subcommand}\nUsage: kspec memory [show|review|prune]`);
  },

  async metrics(args) {
    const folder = getOrSelectSpec(args.join(' '));
    const metricsFile = path.join(folder, 'metrics.json');
    if (!fs.existsSync(metricsFile)) {
      log('No metrics recorded yet.');
      return;
    }
    const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
    console.log(`\nTimeline for ${path.basename(folder)}:\n`);
    metrics.forEach(m => {
      const date = new Date(m.timestamp);
      console.log(`  ${date.toLocaleString()}  ${m.event}`);
    });
    console.log('');
  },

  async milestone(args) {
    const subcommand = args[0] || 'list';

    if (subcommand === 'create') {
      const name = args[1];
      const description = args.slice(2).join(' ');
      if (!name) die('Usage: kspec milestone create <name> [description]');

      ensureDir(MILESTONES_DIR);
      const msFile = path.join(MILESTONES_DIR, `${name}.json`);
      if (fs.existsSync(msFile)) die(`Milestone "${name}" already exists.`);

      fs.writeFileSync(msFile, JSON.stringify({
        name,
        description: description || '',
        specs: [],
        createdAt: new Date().toISOString()
      }, null, 2));
      log(`Created milestone: ${name}`);
      return;
    }

    if (subcommand === 'add') {
      const name = args[1];
      if (!name) die('Usage: kspec milestone add <milestone-name> [spec-name]');

      const msFile = path.join(MILESTONES_DIR, `${name}.json`);
      if (!fs.existsSync(msFile)) die(`Milestone "${name}" not found.`);

      const spec = getOrSelectSpec(args.slice(2).join(' '));
      const ms = JSON.parse(fs.readFileSync(msFile, 'utf8'));

      if (!ms.specs.includes(spec)) {
        ms.specs.push(spec);
        fs.writeFileSync(msFile, JSON.stringify(ms, null, 2));
        log(`Added ${path.basename(spec)} to milestone ${name}`);
      } else {
        log(`${path.basename(spec)} already in milestone ${name}`);
      }
      return;
    }

    if (subcommand === 'status') {
      const name = args[1];
      if (!name) die('Usage: kspec milestone status <name>');

      const msFile = path.join(MILESTONES_DIR, `${name}.json`);
      if (!fs.existsSync(msFile)) die(`Milestone "${name}" not found.`);

      const ms = JSON.parse(fs.readFileSync(msFile, 'utf8'));
      console.log(`\nMilestone: ${ms.name}`);
      if (ms.description) console.log(`Description: ${ms.description}`);
      console.log(`Specs: ${ms.specs.length}\n`);

      let totalTasks = 0, totalDone = 0;
      ms.specs.forEach(spec => {
        const stats = getTaskStats(spec);
        const progress = stats ? `[${stats.done}/${stats.total}]` : '[no tasks]';
        console.log(`  ${path.basename(spec)} ${progress}`);
        if (stats) { totalTasks += stats.total; totalDone += stats.done; }
      });

      if (totalTasks > 0) {
        console.log(`\nOverall: ${totalDone}/${totalTasks} tasks completed`);
      }
      console.log('');
      return;
    }

    if (subcommand === 'list') {
      if (!fs.existsSync(MILESTONES_DIR)) {
        console.log('No milestones. Create one: kspec milestone create <name>');
        return;
      }

      const files = fs.readdirSync(MILESTONES_DIR).filter(f => f.endsWith('.json'));
      if (files.length === 0) {
        console.log('No milestones. Create one: kspec milestone create <name>');
        return;
      }

      console.log('\nMilestones:\n');
      files.forEach(f => {
        const ms = JSON.parse(fs.readFileSync(path.join(MILESTONES_DIR, f), 'utf8'));
        console.log(`  ${ms.name} (${ms.specs.length} specs) — ${ms.description || '(no description)'}`);
      });
      console.log('');
      return;
    }

    die(`Unknown milestone subcommand: ${subcommand}\nUsage: kspec milestone [list|create|add|status]`);
  },

  help() {
    console.log(`
kspec - Spec-driven development for Kiro CLI

CLI Workflow (outside kiro-cli):
  kspec init              Interactive setup
  kspec analyse           Analyse codebase, update steering
  kspec spec "Feature"    Create specification
  kspec verify-spec       Interactively review and shape spec
  kspec design            Create technical design from spec
  kspec verify-design     Verify design against spec
  kspec tasks             Generate tasks from spec (uses design if exists)
  kspec verify-tasks      Verify tasks cover spec
  kspec build             Execute tasks with TDD
  kspec verify            Verify implementation
  kspec done              Complete spec, harvest memory

Work Types (abbreviated pipelines):
  kspec fix "Bug description"     Fix a bug (spec→test→fix→verify)
  kspec refactor "What and why"   Refactor code (no behavior change)
  kspec spike "Question"          Time-boxed investigation (no code)
  kspec revise                    Revise spec from feedback
  kspec demo                      Generate stakeholder walkthrough
  kspec estimate                  Assess complexity before building

Inside kiro-cli (recommended):
  /agent swap kspec-spec    → Describe feature → creates spec
  /agent swap kspec-design  → Create technical design
  /agent swap kspec-tasks   → Generates tasks from spec
  /agent swap kspec-build   → Builds tasks with TDD
  /agent swap kspec-verify  → Verifies spec/design/tasks/implementation

  Agents read .kiro/CONTEXT.md automatically for state.

Jira Integration (requires Atlassian MCP):
  kspec spec --jira PROJ-123,PROJ-456 "Feature"
                          Create spec from Jira issues
  kspec sync-jira         Smart sync (updates existing or creates new)
  kspec sync-jira --create
                          Force create new Jira issue
  kspec sync-jira --project SECOPS
                          Create in specific project
  kspec sync-jira --update PROJ-123
                          Update existing Jira issue
  kspec jira-pull         Pull latest updates from linked Jira issues
  kspec jira-subtasks     Create Jira subtasks from tasks.md
  kspec jira-subtasks PROJ-123
                          Create subtasks under specific issue

Memory:
  kspec memory                    Show project memory
  kspec memory review             AI-assisted memory review
  kspec memory prune              Remove outdated entries

Milestones:
  kspec milestone list            List milestones
  kspec milestone create <name>   Create milestone
  kspec milestone add <name>      Add current spec to milestone
  kspec milestone status <name>   Show milestone progress

Observability:
  kspec metrics                   Show timeline for current spec

Other:
  kspec refresh           Regenerate spec-lite.md after editing spec.md
  kspec context           Refresh/view context file
  kspec review [target]   Code review
  kspec list              List all specs
  kspec status            Current status
  kspec agents            List agents
  kspec update            Check for updates
  kspec help              Show this help

Powers (in powers/ directory):
  contract                Enforce structured outputs in specs
  document                Documentation best practices
  tdd                     Test-driven development patterns
  code-review             Code review checklists
  code-intelligence       Code intelligence setup guide

Examples:
  kspec init                        # Setup with hooks + reviewers
  kspec spec "User Auth"            # CLI mode
  kspec spec --jira PROJ-123 "Auth" # From Jira story
  kspec fix "Login fails"           # Bug fix mode
  kspec spike "Can we use GraphQL?" # Investigation
  kspec design                      # Create design (optional)
  kspec multi-review                # Review with Copilot + Gemini + Claude
  kspec jira-pull                   # Pull latest Jira updates
  kiro-cli --agent kspec-spec       # Direct agent mode
`);
  }
};

async function run(args) {
  // Check for updates (non-blocking, cached for 24h)
  checkForUpdates();

  // Migrate v1 (.kspec/) to v2 (.kiro/) if needed
  await migrateV1toV2();

  // Handle standard CLI flags first
  if (args.includes('--help') || args.includes('-h')) {
    return commands.help();
  }

  if (args.includes('--version') || args.includes('-v')) {
    // Show version and check for updates
    await commands.update();
    return;
  }

  const cmd = (args[0] || 'help').replace(/^\//, '');
  const cmdArgs = args.slice(1);

  if (commands[cmd]) {
    await commands[cmd](cmdArgs);
  } else {
    die(`Unknown command: ${cmd}\nRun 'kspec help' for usage.`);
  }
}

module.exports = { run, commands, loadConfig, detectCli, requireCli, agentTemplates, steeringTemplates, agentsMdTemplate, hooksTemplateBasic, hooksTemplateEnterprise, hooksTemplateDocumentation, reviewerCliConfigs, getTaskStats, refreshContext, getCurrentSpec, setCurrentSpec, getOrSelectSpec, getCurrentTask, checkForUpdates, compareVersions, hasAtlassianMcp, getMcpConfig, getJiraProject, slugify, generateSlug, isSpecStale, validateContract, migrateV1toV2, resetToDefaultAgent, recordMetric, autoRefreshSpecLite, KIRO_DIR, SPECS_DIR, MILESTONES_DIR, LEGACY_KSPEC_DIR };
