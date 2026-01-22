const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const crypto = require('crypto');

const KSPEC_DIR = '.kspec';
const AGENTS_DIR = '.kiro/agents';
const STEERING_DIR = '.kiro/steering';

const config = {
  date: process.env.KSPEC_DATE || new Date().toISOString().split('T')[0],
  fast: process.env.KSPEC_FAST === '1',
  force: process.env.KSPEC_FORCE === '1',
  debug: process.env.KSPEC_DEBUG === '1'
};

function log(msg) { console.log(`[kspec] ${msg}`); }
function debug(msg) { if (config.debug) console.log(`[kspec:debug] ${msg}`); }
function die(msg) { console.error(`Error: ${msg}`); process.exit(1); }

function slugify(text) {
  return text.slice(0, 50).toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/^-+|-+$/g, '');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function detectCli() {
  try { execSync('kiro-cli --version', { stdio: 'ignore' }); return 'kiro-cli'; } catch {}
  try { execSync('q --version', { stdio: 'ignore' }); return 'q'; } catch {}
  die("Neither 'kiro-cli' nor 'q' found. Install Kiro CLI first.");
}

function chat(message) {
  const cli = detectCli();
  const args = config.fast ? ['chat', '--no-interactive', message] : ['chat', message];
  const child = spawn(cli, args, { stdio: 'inherit', shell: true });
  return new Promise((resolve) => child.on('close', resolve));
}

function findSpecFolder(slug) {
  const specsDir = path.join(KSPEC_DIR, 'specs');
  if (!fs.existsSync(specsDir)) return null;
  
  const matches = fs.readdirSync(specsDir)
    .filter(d => d.includes(slug) && fs.statSync(path.join(specsDir, d)).isDirectory())
    .sort().reverse();
  
  if (matches.length === 0) return null;
  if (matches.length === 1) return path.join(specsDir, matches[0]);
  
  console.error(`Multiple specs found matching "${slug}":`);
  matches.forEach((m, i) => console.error(`  ${i + 1}) ${m}`));
  die('Please specify a more specific name.');
}

function getCurrentSpec() {
  const file = path.join(KSPEC_DIR, '.current_spec');
  if (fs.existsSync(file)) {
    const spec = fs.readFileSync(file, 'utf8').trim();
    if (fs.existsSync(spec)) return spec;
  }
  return null;
}

function setCurrentSpec(folder) {
  ensureDir(KSPEC_DIR);
  fs.writeFileSync(path.join(KSPEC_DIR, '.current_spec'), folder);
}

function getSteeringFingerprint() {
  if (!fs.existsSync(STEERING_DIR)) return '';
  const files = fs.readdirSync(STEERING_DIR).filter(f => f.endsWith('.md')).sort();
  const content = files.map(f => fs.readFileSync(path.join(STEERING_DIR, f), 'utf8')).join('');
  return crypto.createHash('sha256').update(content).digest('hex');
}

function contextBlock() {
  return `kspec context:
- Date: ${config.date}
- kspec dir: ${KSPEC_DIR}/
- Steering: ${STEERING_DIR}/ (authoritative)
- Standards: ${KSPEC_DIR}/standards/
- Specs: ${KSPEC_DIR}/specs/`;
}

// Templates
const templates = {
  steering: {
    'product.md': `# Product Overview

## Purpose
Define your product's purpose, target users, and business objectives.

## Target Users
- Primary users and their needs

## Key Features
- Main features and capabilities

## Success Metrics
- How success is measured`,

    'tech.md': `# Technology Stack

## Languages & Runtime
- Primary language and version

## Frameworks
- Web framework, testing framework

## Tools
- Build tools, package managers, linters

## Infrastructure
- Deployment targets, CI/CD`,

    'structure.md': `# Project Structure

## File Organization
- Directory layout and module boundaries

## Naming Conventions
- Files, variables, classes, constants

## Patterns
- Design patterns, state management`,

    'testing.md': `# Testing Standards

## Approach
- TDD: Red → Green → Refactor

## Test Types
- Unit, integration, e2e

## Coverage
- Minimum thresholds, critical paths`,

    'security.md': `# Security Standards

## Authentication
- Auth requirements and patterns

## Data Protection
- Encryption, PII handling

## Input Validation
- Sanitization rules`
  },
  
  agents: {
    'kspec-analyse.json': {
      name: 'kspec-analyse',
      description: 'Read-only analysis; propose standards diffs; never write.',
      prompt: 'Analyse the repository. Deliver: (1) tech stack overview, (2) bounded contexts, (3) risks/smells, (4) suggestions for standards. Use .kiro/steering as authoritative. Do not modify files.',
      allowedTools: ['read'],
      toolsSettings: { read: { allowedPaths: ['.kiro/**', '.kspec/**', './**'] } }
    },
    'kspec-apply-standards.json': {
      name: 'kspec-apply-standards',
      description: 'Apply or propose changes to .kspec/standards.',
      prompt: 'Align .kspec/standards with .kiro/steering and repo reality. Read steering and standards, propose edits, write updated files.',
      allowedTools: ['read', 'write'],
      toolsSettings: {
        read: { allowedPaths: ['.kiro/**', '.kspec/**', './**'] },
        write: { allowedPaths: ['.kspec/standards/**'] }
      }
    },
    'kspec-create-spec.json': {
      name: 'kspec-create-spec',
      description: 'Create spec.md and spec-lite.md for a feature.',
      prompt: 'Create feature specification. Read steering and standards, create spec.md with requirements and design, create spec-lite.md as summary.',
      allowedTools: ['read', 'write'],
      toolsSettings: {
        read: { allowedPaths: ['.kiro/**', '.kspec/**', './**'] },
        write: { allowedPaths: ['.kspec/specs/**'] }
      }
    },
    'kspec-create-tasks.json': {
      name: 'kspec-create-tasks',
      description: 'Turn spec.md into numbered, TDD-ready tasks.md.',
      prompt: 'Generate tasks from spec. Use checkbox format: "1. [ ] Task". Enable resume by marking completed tasks with [x].',
      allowedTools: ['read', 'write'],
      toolsSettings: {
        read: { allowedPaths: ['.kiro/**', '.kspec/**', './**'] },
        write: { allowedPaths: ['.kspec/specs/**'] }
      }
    },
    'kspec-execute-tasks.json': {
      name: 'kspec-execute-tasks',
      description: 'Execute tasks with TDD approach.',
      prompt: 'Execute tasks using TDD. For each [ ] task: write test, implement, verify, mark [x]. Never delete .kiro or .kspec folders.',
      allowedTools: ['read', 'write', 'shell'],
      toolsSettings: {
        read: { allowedPaths: ['.kiro/**', '.kspec/**', './**'] },
        write: { allowedPaths: ['.kspec/specs/**', './**'] },
        shell: { autoAllowReadonly: true }
      }
    },
    'kspec-review.json': {
      name: 'kspec-review',
      description: 'Code review: standards compliance, quality, security.',
      prompt: 'Review code changes. Check compliance with steering, evaluate quality/tests/security, provide actionable feedback.',
      allowedTools: ['read', 'shell'],
      keyboardShortcut: 'ctrl+r',
      welcomeMessage: 'Ready to review. What should I look at?',
      toolsSettings: {
        read: { allowedPaths: ['.kiro/**', '.kspec/**', './**'] },
        shell: { allowedCommands: ['git diff*', 'git log*', 'git status*'], autoAllowReadonly: true }
      }
    },
    'kspec-test.json': {
      name: 'kspec-test',
      description: 'Test generation and TDD guidance.',
      prompt: 'Generate tests following TDD. Cover happy path, edge cases, errors. Follow project conventions.',
      allowedTools: ['read', 'write', 'shell'],
      keyboardShortcut: 'ctrl+t',
      welcomeMessage: 'Ready to help with testing.',
      toolsSettings: {
        read: { allowedPaths: ['.kiro/**', '.kspec/**', './**'] },
        write: { allowedPaths: ['**/*.test.*', '**/*.spec.*', '**/test/**', '**/tests/**'] },
        shell: { allowedCommands: ['npm test*', 'yarn test*', 'jest*', 'vitest*'], autoAllowReadonly: true }
      }
    },
    'kspec-quick.json': {
      name: 'kspec-quick',
      description: 'Quick ad-hoc tasks without full spec workflow.',
      prompt: 'Quick mode for small tasks. Create mini-plan, execute with TDD, commit. Log to .kspec/quick/.',
      allowedTools: ['read', 'write', 'shell'],
      keyboardShortcut: 'ctrl+q',
      welcomeMessage: 'Quick mode. What\'s the task?',
      toolsSettings: {
        read: { allowedPaths: ['.kiro/**', '.kspec/**', './**'] },
        write: { allowedPaths: ['.kspec/quick/**', './**'] },
        shell: { autoAllowReadonly: true }
      }
    },
    'kspec-debug.json': {
      name: 'kspec-debug',
      description: 'Systematic debugging with hypothesis tracking.',
      prompt: 'Debug systematically: reproduce, hypothesize, test, fix, verify. Track in .kspec/debug/. Never guess.',
      allowedTools: ['read', 'write', 'shell'],
      keyboardShortcut: 'ctrl+d',
      welcomeMessage: 'Debug mode. Describe the issue.',
      toolsSettings: {
        read: { allowedPaths: ['.kiro/**', '.kspec/**', './**'] },
        write: { allowedPaths: ['.kspec/debug/**', './**'] },
        shell: { autoAllowReadonly: true }
      }
    },
    'kspec-harvest-memory.json': {
      name: 'kspec-harvest-memory',
      description: 'Capture decisions, glossary, and follow-ups.',
      prompt: 'Harvest learnings from specs and tasks. Write decisions.md, glossary.md, follow-ups.md under .kspec/memory/.',
      allowedTools: ['read', 'write'],
      toolsSettings: {
        read: { allowedPaths: ['.kiro/**', '.kspec/**', './**'] },
        write: { allowedPaths: ['.kspec/memory/**'] }
      }
    }
  }
};

// Commands
const commands = {
  async init() {
    log('Initializing kspec...');
    
    [KSPEC_DIR, AGENTS_DIR, STEERING_DIR].forEach(ensureDir);
    ['specs', 'standards', 'memory', 'quick', 'debug'].forEach(d => ensureDir(path.join(KSPEC_DIR, d)));
    
    // Write steering templates
    for (const [file, content] of Object.entries(templates.steering)) {
      const p = path.join(STEERING_DIR, file);
      if (!fs.existsSync(p) || config.force) {
        fs.writeFileSync(p, content);
        log(`Created ${p}`);
      }
    }
    
    // Write agent configs
    for (const [file, content] of Object.entries(templates.agents)) {
      const p = path.join(AGENTS_DIR, file);
      if (!fs.existsSync(p) || config.force) {
        fs.writeFileSync(p, JSON.stringify(content, null, 2));
        log(`Created ${p}`);
      }
    }
    
    fs.writeFileSync(path.join(KSPEC_DIR, '.fingerprint'), getSteeringFingerprint());
    log('kspec initialized.');
  },

  async analyse() {
    log('Running analysis...');
    await chat(`Analyse the repository.\n\nDeliver:\n1. Tech stack and architecture\n2. Bounded contexts\n3. Risks and smells\n4. Standards suggestions\n\nRead-only. ${contextBlock()}`);
  },

  async 'apply-standards'() {
    log('Applying standards...');
    await chat(`Align .kspec/standards with .kiro/steering.\n\nRead both, identify gaps, write updated standards.\n\n${contextBlock()}`);
    fs.writeFileSync(path.join(KSPEC_DIR, '.fingerprint'), getSteeringFingerprint());
  },

  async 'create-spec'(args) {
    const feature = args.join(' ');
    if (!feature) die('Usage: kspec create-spec "Feature Name"');
    
    const slug = slugify(feature);
    const folder = path.join(KSPEC_DIR, 'specs', `${config.date}-${slug}`);
    ensureDir(folder);
    setCurrentSpec(folder);
    
    log(`Feature folder: ${folder}`);
    await chat(`Create specification for: ${feature}\n\nFolder: ${folder}\n\nCreate spec.md and spec-lite.md.\n\n${contextBlock()}`);
  },

  async 'create-tasks'(args) {
    const folder = args[0] ? findSpecFolder(slugify(args.join(' '))) : getCurrentSpec();
    if (!folder) die('No spec found. Run create-spec first.');
    
    log(`Tasks for: ${folder}`);
    await chat(`Generate tasks from spec.\n\nFolder: ${folder}\n\nUse checkbox format: "1. [ ] Task"\n\n${contextBlock()}`);
  },

  async 'execute-tasks'(args) {
    const folder = args[0] ? findSpecFolder(slugify(args.join(' '))) : getCurrentSpec();
    if (!folder) die('No spec found. Run create-spec first.');
    
    log(`Executing: ${folder}`);
    await chat(`Execute tasks with TDD.\n\nFolder: ${folder}\n\nFor each [ ] task: test first, implement, mark [x].\nNEVER delete .kiro or .kspec folders.\n\n${contextBlock()}`);
  },

  async quick(args) {
    const task = args.join(' ');
    if (!task) die('Usage: kspec quick "Task description"');
    
    const folder = path.join(KSPEC_DIR, 'quick', `${config.date}-${slugify(task)}`);
    ensureDir(folder);
    
    log(`Quick task: ${folder}`);
    await chat(`Quick task: ${task}\n\nFolder: ${folder}\n\nCreate mini-plan, execute, log changes.\n\n${contextBlock()}`);
  },

  async review(args) {
    const target = args.join(' ') || 'recent changes';
    await chat(`Code review: ${target}\n\nCheck steering compliance, quality, security.\nProvide actionable feedback.\n\n${contextBlock()}`);
  },

  async test(args) {
    const target = args.join(' ') || 'project';
    await chat(`Generate tests for: ${target}\n\nFollow TDD, cover edge cases.\n\n${contextBlock()}`);
  },

  async debug(args) {
    const issue = args.join(' ') || '';
    ensureDir(path.join(KSPEC_DIR, 'debug'));
    await chat(`Debug${issue ? `: ${issue}` : ''}\n\nMethodology: reproduce → hypothesize → test → fix → verify\n\n${contextBlock()}`);
  },

  async 'harvest-memory'(args) {
    const folder = args[0] ? findSpecFolder(slugify(args.join(' '))) : getCurrentSpec();
    if (!folder) die('No spec found.');
    
    log(`Harvesting: ${folder}`);
    await chat(`Harvest memory from: ${folder}\n\nCapture decisions, glossary, follow-ups.\n\n${contextBlock()}`);
  },

  status() {
    console.log('\nkspec Status\n');
    console.log(`CLI: ${detectCli()}`);
    console.log(`Date: ${config.date}`);
    console.log(`Initialized: ${fs.existsSync(KSPEC_DIR) ? 'yes' : 'no'}`);
    
    const current = getCurrentSpec();
    console.log(`Current spec: ${current ? path.basename(current) : '(none)'}`);
    
    if (current && fs.existsSync(path.join(current, 'tasks.md'))) {
      const tasks = fs.readFileSync(path.join(current, 'tasks.md'), 'utf8');
      const total = (tasks.match(/^\s*\d+\.\s*\[/gm) || []).length;
      const done = (tasks.match(/^\s*\d+\.\s*\[x\]/gm) || []).length;
      console.log(`Tasks: ${done}/${total} completed`);
    }
  },

  progress() {
    this.status();
    console.log('\nRecent specs:');
    const specsDir = path.join(KSPEC_DIR, 'specs');
    if (fs.existsSync(specsDir)) {
      fs.readdirSync(specsDir).sort().reverse().slice(0, 5)
        .forEach(s => console.log(`  - ${s}`));
    }
  },

  agents() {
    console.log(`
kspec Agents

Agent                  Shortcut  Purpose
──────────────────────────────────────────────────
kspec-analyse          -         Read-only analysis
kspec-apply-standards  -         Update standards
kspec-create-spec      -         Create specifications
kspec-create-tasks     -         Generate task lists
kspec-execute-tasks    -         Execute with TDD
kspec-review           Ctrl+R    Code review
kspec-test             Ctrl+T    Test generation
kspec-quick            Ctrl+Q    Quick tasks
kspec-debug            Ctrl+D    Debugging
kspec-harvest-memory   -         Capture learnings

Switch: /agent swap or keyboard shortcuts
`);
  },

  help() {
    console.log(`
kspec - Spec-driven development for Kiro CLI

Usage:
  kspec init                    Initialize kspec
  kspec analyse                 Analyze project
  kspec apply-standards         Update standards
  kspec create-spec "Feature"   Create specification
  kspec create-tasks            Generate tasks
  kspec execute-tasks           Execute with TDD
  kspec quick "Task"            Quick ad-hoc task
  kspec review [target]         Code review
  kspec test [target]           Generate tests
  kspec debug [issue]           Debug mode
  kspec harvest-memory          Capture learnings
  kspec status                  Show status
  kspec progress                Show progress
  kspec agents                  List agents
  kspec help                    Show help

Environment:
  KSPEC_DATE      Override date (YYYY-MM-DD)
  KSPEC_FAST=1    Non-interactive mode
  KSPEC_FORCE=1   Overwrite on init
`);
  }
};

async function run(args) {
  const cmd = (args[0] || 'help').replace(/^\//, '');
  const cmdArgs = args.slice(1);
  
  if (commands[cmd]) {
    await commands[cmd](cmdArgs);
  } else {
    die(`Unknown command: ${cmd}\nRun 'kspec help' for usage.`);
  }
}

module.exports = { run, commands };
