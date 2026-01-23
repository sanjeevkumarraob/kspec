const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

const KSPEC_DIR = '.kspec';
const STEERING_DIR = '.kiro/steering';
const AGENTS_DIR = '.kiro/agents';
const CONFIG_FILE = path.join(KSPEC_DIR, 'config.json');

// Default config
const defaultConfig = {
  dateFormat: 'YYYY-MM-DD',
  autoExecute: 'ask',
  initialized: false
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
  ensureDir(KSPEC_DIR);
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

const config = loadConfig();

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
  // Extract key words and create a meaningful short identifier
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // Replace non-alphanumeric with spaces
    .split(/\s+/)
    .filter(word => word.length > 2) // Remove short words
    .filter(word => !['the', 'and', 'for', 'with', 'app', 'web', 'api'].includes(word)); // Remove common words
  
  // Take first 3-4 meaningful words and truncate to max 25 chars total
  let slug = words.slice(0, 4).join('-');
  if (slug.length > 25) {
    slug = words.slice(0, 3).join('-');
  }
  if (slug.length > 25) {
    slug = words.slice(0, 2).join('-');
  }
  if (slug.length > 25) {
    slug = slug.slice(0, 25);
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
  return !answer || answer.toLowerCase() === 'y';
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
    child.on('close', resolve);
  });
}

// Spec management
function getSpecsDir() { return path.join(KSPEC_DIR, 'specs'); }

function getCurrentSpec() {
  const file = path.join(KSPEC_DIR, '.current');
  if (fs.existsSync(file)) {
    const spec = fs.readFileSync(file, 'utf8').trim();
    if (fs.existsSync(spec)) return spec;
  }
  return null;
}

function setCurrentSpec(folder) {
  ensureDir(KSPEC_DIR);
  fs.writeFileSync(path.join(KSPEC_DIR, '.current'), folder);
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
    die(`Spec "${name}" not found.`);
  }
  const current = getCurrentSpec();
  if (current) return current;
  die('No current spec. Run: kspec spec "Feature Name"');
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

function refreshContext() {
  const contextFile = path.join(KSPEC_DIR, 'CONTEXT.md');
  const current = getCurrentSpec();

  if (!current) {
    // No current spec - create minimal context
    const content = `# kspec Context

No active spec. Run: \`kspec spec "Feature Name"\`
`;
    ensureDir(KSPEC_DIR);
    fs.writeFileSync(contextFile, content);
    return content;
  }

  const specName = path.basename(current);
  const stats = getTaskStats(current);
  const currentTask = getCurrentTask(current);

  // Read spec-lite if exists
  const specLiteFile = path.join(current, 'spec-lite.md');
  let specLite = '';
  if (fs.existsSync(specLiteFile)) {
    specLite = fs.readFileSync(specLiteFile, 'utf8');
  }

  // Read memory if exists
  const memoryFile = path.join(current, 'memory.md');
  let memory = '';
  if (fs.existsSync(memoryFile)) {
    memory = fs.readFileSync(memoryFile, 'utf8');
  }

  // Build context
  let content = `# kspec Context
> Auto-generated. Always read this first after context compression.

## Current Spec
**${specName}**
Path: \`${current}\`

`;

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

  content += `## Quick Commands
- \`kspec build\` - Continue building tasks
- \`kspec verify\` - Verify implementation
- \`kspec status\` - Show current status
- \`kspec context\` - Refresh this file
`;

  ensureDir(KSPEC_DIR);
  fs.writeFileSync(contextFile, content);
  return content;
}

// Templates
const steeringTemplates = {
  'product.md': `# Product Overview

## Purpose
[Define your product's purpose and target users]

## Key Features
[List main features and capabilities]

## Success Metrics
[How success is measured]`,

  'tech.md': `# Technology Stack

## Languages & Runtime
[Primary language and version]

## Frameworks
[Web framework, testing framework, key libraries]

## Tools
[Build tools, package managers, linters]`,

  'testing.md': `# Testing Standards

## Approach
TDD: Red → Green → Refactor

## Test Types
- Unit: Individual functions
- Integration: Component interactions
- E2E: User flows

## Coverage
[Minimum thresholds]`
};

const agentTemplates = {
  'kspec-analyse.json': {
    name: 'kspec-analyse',
    description: 'Analyse codebase and update steering docs',
    model: 'claude-sonnet-4',
    tools: ['read', 'write'],
    allowedTools: ['read', 'write'],
    resources: [
      'file://.kspec/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kspec/**/*.md'
    ],
    prompt: `You are the kspec analyser.

FIRST: Read .kspec/CONTEXT.md for current state and spec summary.

Your job:
1. Analyse the codebase structure, tech stack, patterns
2. Review .kiro/steering/ docs
3. Suggest updates to steering based on actual codebase
4. Identify risks, tech debt, improvement areas

Output a clear analysis report. Propose specific steering doc updates.`,
    keyboardShortcut: 'ctrl+a',
    welcomeMessage: 'Analysing codebase...'
  },

  'kspec-spec.json': {
    name: 'kspec-spec',
    description: 'Create feature specifications',
    model: 'claude-sonnet-4',
    tools: ['read', 'write'],
    allowedTools: ['read', 'write'],
    resources: [
      'file://.kspec/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kspec/**/*.md'
    ],
    prompt: `You are the kspec specification writer.

WORKFLOW (do this autonomously):
1. Read .kiro/steering/ for project context
2. Create spec folder: .kspec/specs/YYYY-MM-DD-{feature-slug}/
   - Use today's date and a short slug (2-4 words from feature name)
3. Create spec.md in that folder with:
   - Problem/Context
   - Requirements (functional + non-functional)
   - Constraints
   - High-level design
   - Acceptance criteria
4. Create spec-lite.md (CRITICAL - under 500 words):
   - Concise version for context retention after compression
   - Key requirements only
5. Update .kspec/.current with the spec folder path
6. Update .kspec/CONTEXT.md with current state

After completion, suggest: "Switch to kspec-tasks agent to generate implementation tasks"`,
    keyboardShortcut: 'ctrl+s',
    welcomeMessage: 'Ready to create specification. Describe your feature.'
  },

  'kspec-tasks.json': {
    name: 'kspec-tasks',
    description: 'Generate implementation tasks from spec',
    model: 'claude-sonnet-4',
    tools: ['read', 'write'],
    allowedTools: ['read', 'write'],
    resources: [
      'file://.kspec/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kspec/**/*.md'
    ],
    prompt: `You are the kspec task generator.

WORKFLOW:
1. Read .kspec/CONTEXT.md for current spec location
2. Read .kspec/.current to get spec folder path
3. Read spec.md and spec-lite.md from that folder
4. Generate tasks.md in the spec folder with:
   - Checkbox format: "- [ ] Task description"
   - TDD approach: test first, then implement
   - Logical ordering (models → services → API → UI)
   - Dependencies noted
   - File paths where changes occur
5. Update .kspec/CONTEXT.md with task count

Tasks must be atomic and independently verifiable.

After completion, suggest: "Switch to kspec-build agent to start implementing tasks"`,
    keyboardShortcut: 'ctrl+t',
    welcomeMessage: 'Reading current spec and generating tasks...'
  },

  'kspec-build.json': {
    name: 'kspec-build',
    description: 'Execute tasks with TDD',
    model: 'claude-sonnet-4',
    tools: ['read', 'write', 'shell'],
    allowedTools: ['read', 'write', 'shell'],
    resources: [
      'file://.kspec/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kspec/**/*.md'
    ],
    prompt: `You are the kspec builder.

WORKFLOW:
1. Read .kspec/CONTEXT.md for current spec and task progress
2. Read .kspec/.current to get spec folder path
3. Read tasks.md from spec folder, find first uncompleted task (- [ ])
4. For each task:
   a) Write test first (TDD)
   b) Implement minimal code to pass
   c) Run tests
   d) Mark task complete: change "- [ ]" to "- [x]"
   e) Update tasks.md file
   f) Update .kspec/CONTEXT.md with new progress
5. Commit after each task with descriptive message

CRITICAL:
- Always update tasks.md after completing each task
- Update .kspec/CONTEXT.md with current task and progress
- NEVER delete .kiro or .kspec folders
- Use non-interactive flags for commands (--yes, -y)

When all tasks complete, suggest: "Switch to kspec-verify agent to verify implementation"`,
    keyboardShortcut: 'ctrl+b',
    welcomeMessage: 'Reading current task and building...'
  },

  'kspec-verify.json': {
    name: 'kspec-verify',
    description: 'Verify spec, tasks, or implementation',
    model: 'claude-sonnet-4',
    tools: ['read', 'shell'],
    allowedTools: ['read', 'shell'],
    resources: [
      'file://.kspec/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kspec/**/*.md'
    ],
    prompt: `You are the kspec verifier.

FIRST: Read .kspec/CONTEXT.md for current spec and progress.

Based on what you're asked to verify:

VERIFY-SPEC:
- Check spec covers all requirements
- Identify gaps or ambiguities
- Suggest splitting large requirements
- Confirm implementability with current codebase

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

Output a clear verification report with pass/fail status.`,
    keyboardShortcut: 'ctrl+v',
    welcomeMessage: 'What should I verify?'
  },

  'kspec-review.json': {
    name: 'kspec-review',
    description: 'Code review',
    model: 'claude-sonnet-4',
    tools: ['read', 'shell'],
    allowedTools: ['read', 'shell'],
    resources: [
      'file://.kspec/CONTEXT.md',
      'file://.kiro/steering/**/*.md',
      'file://.kspec/**/*.md'
    ],
    prompt: `You are the kspec code reviewer.

FIRST: Read .kspec/CONTEXT.md for current spec context.

Your job:
1. Review code changes (git diff or specified files)
2. Check compliance with .kiro/steering/
3. Evaluate:
   - Code quality and readability
   - Test coverage
   - Security concerns
   - Performance implications
4. Provide actionable feedback

Output: APPROVE / REQUEST_CHANGES with specific issues.`,
    keyboardShortcut: 'ctrl+r',
    welcomeMessage: 'Ready to review. What should I look at?'
  }
};

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

    const createSteering = await confirm('Create steering doc templates?');

    // Save config
    const cfg = { dateFormat, autoExecute, initialized: true };
    saveConfig(cfg);
    Object.assign(config, cfg);

    // Create directories
    ensureDir(path.join(KSPEC_DIR, 'specs'));
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

    // Create agents (skip if already exist to preserve customizations)
    for (const [file, content] of Object.entries(agentTemplates)) {
      const p = path.join(AGENTS_DIR, file);
      if (!fs.existsSync(p)) {
        fs.writeFileSync(p, JSON.stringify(content, null, 2));
        log(`Created ${p}`);
      }
    }

    console.log('\n✅ kspec initialized!\n');
    console.log('Next: kspec analyse');
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
    const feature = args.join(' ');
    if (!feature) die('Usage: kspec spec "Feature Name"');

    const date = formatDate(config.dateFormat || 'YYYY-MM-DD');
    const folder = path.join(getSpecsDir(), `${date}-${slugify(feature)}`);
    ensureDir(folder);
    setCurrentSpec(folder);

    log(`Spec folder: ${folder}`);
    await chat(`Create specification for: ${feature}

Folder: ${folder}

1. Read .kiro/steering/ for context
2. Create ${folder}/spec.md with full specification
3. IMMEDIATELY create ${folder}/spec-lite.md (concise version, <500 words)

spec-lite.md is critical - it's loaded after context compression.`, 'kspec-spec');
  },

  async 'verify-spec'(args) {
    const folder = getOrSelectSpec(args.join(' '));
    log(`Verifying spec: ${folder}`);
    
    await chat(`Verify the specification in ${folder}/spec.md:

1. Does it cover all requirements clearly?
2. Are there gaps or ambiguities?
3. Should large requirements be split into smaller chunks?
4. Is it implementable with the current codebase?

Read the codebase to check implementability.
Report: PASS/FAIL with specific issues.`, 'kspec-verify');
  },

  async tasks(args) {
    const folder = getOrSelectSpec(args.join(' '));
    log(`Generating tasks: ${folder}`);

    await chat(`Generate tasks from specification.

Spec folder: ${folder}
Read: ${folder}/spec.md and ${folder}/spec-lite.md

Create ${folder}/tasks.md with:
- Checkbox format: "- [ ] Task description"
- TDD approach (test first)
- Logical order
- File paths for each task`, 'kspec-tasks');
  },

  async 'verify-tasks'(args) {
    const folder = getOrSelectSpec(args.join(' '));
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
    const stats = getTaskStats(folder);

    log(`Building: ${folder}`);
    if (stats) {
      if (stats.remaining === 0) {
        log('All tasks completed! Run: kspec verify');
        return;
      }
      log(`Progress: ${stats.done}/${stats.total} (${stats.remaining} remaining)`);
    }

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
NEVER delete .kiro or .kspec folders.`, 'kspec-build');
  },

  async verify(args) {
    const folder = getOrSelectSpec(args.join(' '));
    const stats = getTaskStats(folder);

    log(`Verifying implementation: ${folder}`);
    if (stats) log(`Tasks: ${stats.done}/${stats.total}`);

    await chat(`Verify implementation for ${folder}:

1. Read spec.md - list all requirements
2. Read tasks.md - check all marked [x]
3. Check codebase - does implementation match spec?
4. Run tests - do they pass?
5. Check coverage - are requirements tested?

Report:
- Requirements: X/Y implemented
- Tasks: X/Y completed  
- Tests: PASS/FAIL
- Gaps: [list any]`, 'kspec-verify');
  },

  async done(args) {
    const folder = getOrSelectSpec(args.join(' '));
    const stats = getTaskStats(folder);

    if (stats && stats.remaining > 0) {
      const proceed = await confirm(`${stats.remaining} tasks remaining. Mark done anyway?`);
      if (!proceed) return;
    }

    log(`Completing: ${folder}`);
    
    // Create memory
    await chat(`Harvest learnings from ${folder}:

1. Read spec.md, tasks.md, and implementation
2. Create ${folder}/memory.md with:
   - Key decisions made
   - Patterns used
   - Lessons learned
   - Follow-ups needed

3. Update .kspec/memory.md (project-level) with:
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

    console.log('\nkspec Status\n');
    console.log(`CLI: ${detectCli() || '(not installed)'}`);
    console.log(`Initialized: ${config.initialized ? 'yes' : 'no'}`);
    console.log(`Date format: ${config.dateFormat || 'YYYY-MM-DD'}`);
    console.log(`Auto-execute: ${config.autoExecute || 'ask'}`);

    if (current) {
      console.log(`\nCurrent spec: ${path.basename(current)}`);
      const stats = getTaskStats(current);
      if (stats) {
        console.log(`Tasks: ${stats.done}/${stats.total} completed`);
        if (stats.remaining > 0) {
          console.log(`\nNext: kspec build`);
        } else {
          console.log(`\nNext: kspec verify`);
        }
      } else {
        console.log(`\nNext: kspec tasks`);
      }
    } else {
      console.log(`\nNo current spec. Run: kspec spec "Feature Name"`);
    }
    console.log('');
  },

  context() {
    const content = refreshContext();
    console.log(content);
    console.log(`Context saved to: .kspec/CONTEXT.md\n`);
  },

  agents() {
    console.log(`
kspec Agents

Agent           Shortcut  Purpose
─────────────────────────────────────────────
kspec-analyse   Ctrl+A    Analyse codebase, update steering
kspec-spec      Ctrl+S    Create specifications
kspec-tasks     Ctrl+T    Generate tasks from spec
kspec-build     Ctrl+B    Execute tasks with TDD
kspec-verify    Ctrl+V    Verify spec/tasks/implementation
kspec-review    Ctrl+R    Code review

Switch: /agent swap or use keyboard shortcuts
`);
  },

  help() {
    console.log(`
kspec - Spec-driven development for Kiro CLI

CLI Workflow (outside kiro-cli):
  kspec init              Interactive setup
  kspec analyse           Analyse codebase, update steering
  kspec spec "Feature"    Create specification
  kspec verify-spec       Verify spec is complete
  kspec tasks             Generate tasks from spec
  kspec verify-tasks      Verify tasks cover spec
  kspec build             Execute tasks with TDD
  kspec verify            Verify implementation
  kspec done              Complete spec, harvest memory

Inside kiro-cli (recommended):
  /agent swap kspec-spec    → Describe feature → creates spec
  /agent swap kspec-tasks   → Generates tasks from spec
  /agent swap kspec-build   → Builds tasks with TDD
  /agent swap kspec-verify  → Verifies implementation

  Agents read .kspec/CONTEXT.md automatically for state.

Other:
  kspec context           Refresh/view context file
  kspec review [target]   Code review
  kspec list              List all specs
  kspec status            Current status
  kspec agents            List agents
  kspec help              Show this help

Examples:
  kspec init                        # First time setup
  kspec spec "User Auth"            # CLI mode
  kiro-cli --agent kspec-spec       # Direct agent mode
`);
  }
};

async function run(args) {
  // Handle standard CLI flags first
  if (args.includes('--help') || args.includes('-h')) {
    return commands.help();
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    const pkg = require('../package.json');
    console.log(pkg.version);
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

module.exports = { run, commands, loadConfig, detectCli, requireCli, agentTemplates, getTaskStats, refreshContext, getCurrentTask };
