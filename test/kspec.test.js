const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const TEST_DIR = path.join(__dirname, 'test-workspace');

describe('kspec', () => {
  let commands, loadConfig, run, detectCli, requireCli, agentTemplates, getTaskStats, refreshContext, getCurrentSpec, setCurrentSpec, getOrSelectSpec, compareVersions, hasAtlassianMcp, getMcpConfig, getJiraProject, migrateV1toV2, resetToDefaultAgent, KIRO_DIR, SPECS_DIR, LEGACY_KSPEC_DIR;

  before(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    process.chdir(TEST_DIR);
    ({ commands, loadConfig, run, detectCli, requireCli, agentTemplates, getTaskStats, refreshContext, getCurrentSpec, setCurrentSpec, getOrSelectSpec, compareVersions, hasAtlassianMcp, getMcpConfig, getJiraProject, migrateV1toV2, resetToDefaultAgent, KIRO_DIR, SPECS_DIR, LEGACY_KSPEC_DIR } = require('../src/index.js'));
  });

  after(() => {
    process.chdir(__dirname);
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe('loadConfig', () => {
    it('returns defaults when no config', () => {
      const cfg = loadConfig();
      assert.strictEqual(cfg.dateFormat, 'YYYY-MM-DD');
      assert.strictEqual(cfg.autoExecute, 'ask');
    });

    it('loads config from file', () => {
      fs.mkdirSync('.kiro', { recursive: true });
      fs.writeFileSync('.kiro/config.json', JSON.stringify({
        dateFormat: 'DD-MM-YYYY',
        autoExecute: 'auto',
        initialized: true
      }));

      const cfg = loadConfig();
      assert.strictEqual(cfg.dateFormat, 'DD-MM-YYYY');
      assert.strictEqual(cfg.autoExecute, 'auto');
    });

    it('returns defaults on corrupted config', () => {
      fs.mkdirSync('.kiro', { recursive: true });
      fs.writeFileSync('.kiro/config.json', 'invalid json {{{');

      // Should not throw, should return defaults
      const cfg = loadConfig();
      assert.strictEqual(cfg.dateFormat, 'YYYY-MM-DD');
      assert.strictEqual(cfg.autoExecute, 'ask');
    });
  });

  describe('list', () => {
    it('handles no specs', () => {
      assert.doesNotThrow(() => commands.list());
    });

    it('lists specs when they exist', () => {
      fs.mkdirSync('.kiro/specs/2026-01-22-test-feature', { recursive: true });
      assert.doesNotThrow(() => commands.list());
    });
  });

  describe('agents', () => {
    it('outputs agent list', () => {
      assert.doesNotThrow(() => commands.agents());
    });
  });

  describe('help', () => {
    it('outputs help text', () => {
      assert.doesNotThrow(() => commands.help());
    });
  });

  describe('CLI flags', () => {
    it('handles --help flag', async () => {
      // Capture console output
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      try {
        await run(['--help']);
        assert(output.includes('kspec - Spec-driven development for Kiro CLI'));
        assert(output.includes('CLI Workflow'));
      } finally {
        console.log = originalLog;
      }
    });

    it('handles -h flag', async () => {
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      try {
        await run(['-h']);
        assert(output.includes('kspec - Spec-driven development for Kiro CLI'));
      } finally {
        console.log = originalLog;
      }
    });

    it('handles --version flag', async () => {
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      try {
        await run(['--version']);
        // Should output the version from package.json (now with update check)
        const pkg = require('../package.json');
        assert(output.includes(pkg.version), 'Output should contain version');
        assert(output.includes('kspec'), 'Output should mention kspec');
      } finally {
        console.log = originalLog;
      }
    });

    it('handles -v flag', async () => {
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      try {
        await run(['-v']);
        // Should output the version from package.json (now with update check)
        const pkg = require('../package.json');
        assert(output.includes(pkg.version), 'Output should contain version');
      } finally {
        console.log = originalLog;
      }
    });

    it('handles unknown command', async () => {
      let errorOutput = '';
      const originalError = console.error;
      const originalExit = process.exit;

      console.error = (...args) => { errorOutput += args.join(' ') + '\n'; };
      process.exit = () => { throw new Error('EXIT_CALLED'); };

      try {
        await assert.rejects(
          () => run(['unknown-command']),
          /EXIT_CALLED/
        );
        assert(errorOutput.includes('Unknown command: unknown-command'));
      } finally {
        console.error = originalError;
        process.exit = originalExit;
      }
    });

    it('prioritizes flags over commands', async () => {
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      try {
        // Even with other arguments, --help should take precedence
        await run(['init', '--help', 'something']);
        assert(output.includes('kspec - Spec-driven development for Kiro CLI'));
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('detectCli', () => {
    it('returns string or null', () => {
      const result = detectCli();
      assert(result === null || typeof result === 'string');
    });

    it('returns kiro-cli, q, or null', () => {
      const result = detectCli();
      assert(result === null || result === 'kiro-cli' || result === 'q');
    });
  });

  describe('requireCli', () => {
    it('does not cause stack overflow', () => {
      // This test verifies the bug fix - requireCli should call detectCli, not itself
      // If it calls itself, this will throw "Maximum call stack size exceeded"
      let errorThrown = null;
      const originalExit = process.exit;
      const originalError = console.error;

      process.exit = () => { throw new Error('CLI_NOT_FOUND'); };
      console.error = () => {};

      try {
        requireCli();
      } catch (e) {
        errorThrown = e;
      } finally {
        process.exit = originalExit;
        console.error = originalError;
      }

      // Should either return a CLI name or throw CLI_NOT_FOUND (from our mock)
      // Should NOT throw "Maximum call stack size exceeded"
      if (errorThrown) {
        assert.strictEqual(errorThrown.message, 'CLI_NOT_FOUND');
      }
    });
  });

  describe('getTaskStats', () => {
    it('returns null for missing tasks.md', () => {
      fs.mkdirSync('.kiro/specs/test-spec', { recursive: true });
      const stats = getTaskStats('.kiro/specs/test-spec');
      assert.strictEqual(stats, null);
    });

    it('counts tasks correctly', () => {
      fs.mkdirSync('.kiro/specs/task-test', { recursive: true });
      fs.writeFileSync('.kiro/specs/task-test/tasks.md', `# Tasks
- [ ] Pending task 1
- [x] Done task 1
- [ ] Pending task 2
`);
      const stats = getTaskStats('.kiro/specs/task-test');
      assert.strictEqual(stats.total, 3);
      assert.strictEqual(stats.done, 1);
      assert.strictEqual(stats.remaining, 2);
    });

    it('handles uppercase [X] markers', () => {
      fs.mkdirSync('.kiro/specs/uppercase-test', { recursive: true });
      fs.writeFileSync('.kiro/specs/uppercase-test/tasks.md', `# Tasks
- [ ] Pending
- [x] Done lowercase
- [X] Done uppercase
`);
      const stats = getTaskStats('.kiro/specs/uppercase-test');
      assert.strictEqual(stats.total, 3);
      assert.strictEqual(stats.done, 2);
      assert.strictEqual(stats.remaining, 1);
    });
  });

  describe('getCurrentSpec', () => {
    it('returns null when no .current file', () => {
      const currentFile = path.join('.kiro', '.current');
      if (fs.existsSync(currentFile)) fs.unlinkSync(currentFile);

      const result = getCurrentSpec();
      assert.strictEqual(result, null);
    });

    it('handles full path format', () => {
      const specFolder = path.join('.kiro', 'specs', '2026-01-25-full-path-test');
      fs.mkdirSync(specFolder, { recursive: true });
      fs.writeFileSync(path.join('.kiro', '.current'), specFolder);

      const result = getCurrentSpec();
      assert.strictEqual(result, specFolder);
    });

    it('handles just folder name (agent mode)', () => {
      const specName = '2026-01-25-agent-mode-test';
      const specFolder = path.join('.kiro', 'specs', specName);
      fs.mkdirSync(specFolder, { recursive: true });
      // Agent mode writes just the folder name
      fs.writeFileSync(path.join('.kiro', '.current'), specName);

      const result = getCurrentSpec();
      assert.strictEqual(result, specFolder);
    });

    it('returns null for non-existent spec', () => {
      fs.writeFileSync(path.join('.kiro', '.current'), 'non-existent-spec-folder');

      const result = getCurrentSpec();
      assert.strictEqual(result, null);
    });
  });

  describe('refreshContext', () => {
    it('creates CONTEXT.md with no active spec', () => {
      // Clear any existing .current file
      const currentFile = '.kiro/.current';
      if (fs.existsSync(currentFile)) fs.unlinkSync(currentFile);

      const content = refreshContext();
      assert(content.includes('No active spec'));
      assert(fs.existsSync('.kiro/CONTEXT.md'));
    });

    it('includes spec info when spec exists', () => {
      // Create a spec with spec-lite
      const specFolder = '.kiro/specs/2026-01-24-test-context';
      fs.mkdirSync(specFolder, { recursive: true });
      fs.writeFileSync(`${specFolder}/spec-lite.md`, '# Test Spec\n- Requirement 1\n- Requirement 2');
      fs.writeFileSync('.kiro/.current', specFolder);

      const content = refreshContext();
      assert(content.includes('2026-01-24-test-context'));
      assert(content.includes('Requirements Summary'));
      assert(content.includes('Requirement 1'));
    });

    it('includes task progress when tasks exist', () => {
      const specFolder = '.kiro/specs/2026-01-24-test-context';
      fs.writeFileSync(`${specFolder}/tasks.md`, '- [x] Task 1\n- [ ] Task 2\n- [ ] Task 3');
      fs.writeFileSync('.kiro/.current', specFolder);

      const content = refreshContext();
      assert(content.includes('1/3 completed'));
      assert(content.includes('Current Task'));
    });
  });

  describe('agentTemplates', () => {
    it('has all required agents', () => {
      const expectedAgents = [
        'kspec-analyse.json',
        'kspec-spec.json',
        'kspec-design.json',
        'kspec-tasks.json',
        'kspec-build.json',
        'kspec-verify.json',
        'kspec-review.json',
        'kspec-jira.json'
      ];

      for (const agent of expectedAgents) {
        assert(agentTemplates[agent], `Missing agent: ${agent}`);
      }
      assert.strictEqual(Object.keys(agentTemplates).length, 8, 'Should have exactly 8 agents');
    });

    it('agents have Kiro CLI compatible format', () => {
      for (const [filename, agent] of Object.entries(agentTemplates)) {
        // Required fields
        assert(agent.name, `${filename}: missing name`);
        assert(agent.description, `${filename}: missing description`);
        assert(agent.prompt, `${filename}: missing prompt`);

        // Kiro CLI format fields
        assert(agent.model, `${filename}: missing model`);
        assert(Array.isArray(agent.tools), `${filename}: tools should be array`);
        assert(Array.isArray(agent.allowedTools), `${filename}: allowedTools should be array`);
        assert(Array.isArray(agent.resources), `${filename}: resources should be array`);

        // Resources use file:// protocol
        for (const resource of agent.resources) {
          assert(resource.startsWith('file://'), `${filename}: resource should use file:// protocol: ${resource}`);
        }
      }
    });

    it('agents include steering and specs resources', () => {
      for (const [filename, agent] of Object.entries(agentTemplates)) {
        const hasSteeringResource = agent.resources.some(r => r.includes('.kiro/steering'));
        const hasSpecsResource = agent.resources.some(r => r.includes('.kiro/specs'));

        assert(hasSteeringResource, `${filename}: should include .kiro/steering resource`);
        assert(hasSpecsResource, `${filename}: should include .kiro/specs resource`);
      }
    });

    it('agents include CONTEXT.md as first resource', () => {
      for (const [filename, agent] of Object.entries(agentTemplates)) {
        assert(agent.resources[0] === 'file://.kiro/CONTEXT.md',
          `${filename}: CONTEXT.md should be first resource for context restoration`);
      }
    });

    it('agent prompts instruct to read context first', () => {
      const agentsNeedingContext = ['kspec-tasks.json', 'kspec-build.json', 'kspec-verify.json'];
      for (const filename of agentsNeedingContext) {
        const agent = agentTemplates[filename];
        assert(agent.prompt.includes('CONTEXT.md') || agent.prompt.includes('WORKFLOW'),
          `${filename}: prompt should reference context or workflow`);
      }
    });

    it('no agent references .kspec in resources', () => {
      for (const [filename, agent] of Object.entries(agentTemplates)) {
        for (const resource of agent.resources) {
          assert(!resource.includes('.kspec'),
            `${filename}: resource should not reference .kspec: ${resource}`);
        }
      }
    });
  });

  describe('context command', () => {
    it('outputs context and confirms file creation', () => {
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      try {
        commands.context();
        assert(output.includes('kspec Context'));
        assert(output.includes('.kiro/CONTEXT.md'));
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('compareVersions', () => {
    it('returns -1 when first version is older', () => {
      assert.strictEqual(compareVersions('1.0.0', '1.0.1'), -1);
      assert.strictEqual(compareVersions('1.0.0', '1.1.0'), -1);
      assert.strictEqual(compareVersions('1.0.0', '2.0.0'), -1);
      assert.strictEqual(compareVersions('1.0.8', '1.0.15'), -1);
    });

    it('returns 1 when first version is newer', () => {
      assert.strictEqual(compareVersions('1.0.1', '1.0.0'), 1);
      assert.strictEqual(compareVersions('1.1.0', '1.0.0'), 1);
      assert.strictEqual(compareVersions('2.0.0', '1.0.0'), 1);
    });

    it('returns 0 when versions are equal', () => {
      assert.strictEqual(compareVersions('1.0.0', '1.0.0'), 0);
      assert.strictEqual(compareVersions('2.5.10', '2.5.10'), 0);
    });
  });

  describe('slugify', () => {
    let slugify;

    before(() => {
      ({ slugify } = require('../src/index.js'));
    });

    it('extracts todo from "to do"', () => {
      const result = slugify('Create a to do application');
      assert(result.includes('todo'), `Expected "todo" in "${result}"`);
    });

    it('prioritizes tech terms', () => {
      const result = slugify('Build app with nextjs and shadcn');
      assert(result.includes('nextjs') || result.includes('shadcn'), `Expected tech terms in "${result}"`);
    });

    it('removes filler words', () => {
      const result = slugify('Create a simple application using React');
      assert(!result.includes('create'), `Should not contain "create" in "${result}"`);
      assert(!result.includes('simple'), `Should not contain "simple" in "${result}"`);
      assert(!result.includes('using'), `Should not contain "using" in "${result}"`);
    });

    it('handles e-commerce', () => {
      const result = slugify('Build e-commerce cart');
      assert(result.includes('ecommerce'), `Expected "ecommerce" in "${result}"`);
    });

    it('returns feature for empty input', () => {
      const result = slugify('');
      assert.strictEqual(result, 'feature');
    });

    it('produces meaningful names', () => {
      const result = slugify('Create a to do application using nextjs and shadcn');
      assert.strictEqual(result, 'todo-nextjs-shadcn');
    });
  });

  describe('isSpecStale', () => {
    let isSpecStale;

    before(() => {
      ({ isSpecStale } = require('../src/index.js'));
    });

    it('returns false when no spec.md', () => {
      const folder = path.join('.kiro', 'specs', 'no-spec-test');
      fs.mkdirSync(folder, { recursive: true });
      const result = isSpecStale(folder);
      assert.strictEqual(result, false);
    });

    it('returns true when no spec-lite.md', () => {
      const folder = path.join('.kiro', 'specs', 'no-spec-lite-test');
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'spec.md'), '# Spec');
      const result = isSpecStale(folder);
      assert.strictEqual(result, true);
    });

    it('returns false when spec-lite is newer', () => {
      const folder = path.join('.kiro', 'specs', 'spec-lite-newer');
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'spec.md'), '# Spec');
      // Wait a bit to ensure different mtime
      const now = new Date();
      fs.utimesSync(path.join(folder, 'spec.md'), now, new Date(now.getTime() - 10000));
      fs.writeFileSync(path.join(folder, 'spec-lite.md'), '# Spec Lite');
      const result = isSpecStale(folder);
      assert.strictEqual(result, false);
    });

    it('returns true when spec.md is newer', () => {
      const folder = path.join('.kiro', 'specs', 'spec-newer');
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'spec-lite.md'), '# Spec Lite');
      // Wait a bit to ensure different mtime
      const now = new Date();
      fs.utimesSync(path.join(folder, 'spec-lite.md'), now, new Date(now.getTime() - 10000));
      fs.writeFileSync(path.join(folder, 'spec.md'), '# Spec Updated');
      const result = isSpecStale(folder);
      assert.strictEqual(result, true);
    });
  });

  describe('MCP detection', () => {
    it('hasAtlassianMcp returns boolean', () => {
      const result = hasAtlassianMcp();
      assert(typeof result === 'boolean');
    });

    it('getMcpConfig returns object or null', () => {
      const result = getMcpConfig();
      assert(result === null || typeof result === 'object');
    });

    it('detects .kiro/mcp.json workspace root config', () => {
      fs.mkdirSync('.kiro', { recursive: true });
      fs.writeFileSync('.kiro/mcp.json', JSON.stringify({
        mcpServers: {
          atlassian: { command: 'npx', args: ['mcp-remote'] }
        }
      }));

      const result = getMcpConfig();
      assert(result !== null, 'Should detect .kiro/mcp.json');
      assert(result.mcpServers.atlassian, 'Should find atlassian server');

      // Clean up
      fs.unlinkSync('.kiro/mcp.json');
    });
  });

  describe('agentTemplates - Jira agent', () => {
    it('has kspec-jira agent', () => {
      assert(agentTemplates['kspec-jira.json'], 'Missing kspec-jira agent');
    });

    it('kspec-jira has atlassian mcp access', () => {
      const jiraAgent = agentTemplates['kspec-jira.json'];
      assert(jiraAgent.tools.includes('@atlassian'), 'kspec-jira should include @atlassian tool');
      assert(jiraAgent.allowedTools.includes('@atlassian'), 'kspec-jira should allow @atlassian tool');
      assert(jiraAgent.includeMcpJson === true, 'kspec-jira should have includeMcpJson: true');
    });

    it('kspec-jira has correct keyboard shortcut', () => {
      const jiraAgent = agentTemplates['kspec-jira.json'];
      assert.strictEqual(jiraAgent.keyboardShortcut, 'ctrl+shift+j');
    });
  });

  describe('refreshContext with Jira links', () => {
    it('includes Jira links when jira-links.json exists', () => {
      const specFolder = '.kiro/specs/2026-01-24-jira-test';
      fs.mkdirSync(specFolder, { recursive: true });
      fs.writeFileSync(`${specFolder}/spec-lite.md`, '# Jira Test Spec');
      fs.writeFileSync(`${specFolder}/jira-links.json`, JSON.stringify({
        sourceIssues: ['PROJ-123', 'PROJ-456'],
        specIssue: 'PROJ-789',
        subtasks: ['PROJ-790', 'PROJ-791']
      }));
      fs.writeFileSync('.kiro/.current', specFolder);

      const content = refreshContext();
      assert(content.includes('Jira Links'), 'Should include Jira Links section');
      assert(content.includes('PROJ-123'), 'Should include source issue');
      assert(content.includes('PROJ-789'), 'Should include spec issue');
      assert(content.includes('PROJ-790'), 'Should include subtask');
    });

    it('omits Jira section when no jira-links.json', () => {
      const specFolder = '.kiro/specs/2026-01-24-no-jira';
      fs.mkdirSync(specFolder, { recursive: true });
      fs.writeFileSync(`${specFolder}/spec-lite.md`, '# No Jira Spec');
      fs.writeFileSync('.kiro/.current', specFolder);

      const content = refreshContext();
      assert(!content.includes('Jira Links'), 'Should not include Jira Links section');
    });
  });

  describe('help text', () => {
    it('includes Jira integration section', () => {
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      try {
        commands.help();
        assert(output.includes('Jira Integration'), 'Help should mention Jira Integration');
        assert(output.includes('--jira'), 'Help should mention --jira flag');
        assert(output.includes('sync-jira'), 'Help should mention sync-jira command');
        assert(output.includes('jira-subtasks'), 'Help should mention jira-subtasks command');
      } finally {
        console.log = originalLog;
      }
    });

    it('includes Powers section', () => {
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      try {
        commands.help();
        assert(output.includes('Powers'), 'Help should mention Powers');
        assert(output.includes('contract'), 'Help should mention contract power');
        assert(output.includes('document'), 'Help should mention document power');
        assert(output.includes('tdd'), 'Help should mention tdd power');
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('agents command', () => {
    it('lists kspec-jira agent', () => {
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      try {
        commands.agents();
        assert(output.includes('kspec-jira'), 'Should list kspec-jira agent');
        assert(output.includes('Ctrl+Shift+J'), 'Should show Jira agent shortcut');
      } finally {
        console.log = originalLog;
      }
    });

    it('mentions Powers', () => {
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      try {
        commands.agents();
        assert(output.includes('Powers'), 'Agents output should mention Powers');
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('migrateV1toV2', () => {
    it('skips when no .kspec directory exists', async () => {
      // Ensure no .kspec exists
      if (fs.existsSync('.kspec')) fs.rmSync('.kspec', { recursive: true });

      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      try {
        await migrateV1toV2();
        // Should complete silently without any migration output
        assert(!output.includes('Migration'), 'Should not show migration prompt');
      } finally {
        console.log = originalLog;
      }
    });

    it('cleans up empty .kspec directory', async () => {
      fs.mkdirSync('.kspec', { recursive: true });

      await migrateV1toV2();
      assert(!fs.existsSync('.kspec'), 'Empty .kspec should be removed');
    });
  });

  describe('resetToDefaultAgent', () => {
    it('does not throw when called', () => {
      // resetToDefaultAgent is best-effort, should never throw
      assert.doesNotThrow(() => {
        resetToDefaultAgent('nonexistent-cli');
      });
    });
  });

  describe('constants', () => {
    it('KIRO_DIR is .kiro', () => {
      assert.strictEqual(KIRO_DIR, '.kiro');
    });

    it('SPECS_DIR is .kiro/specs', () => {
      assert.strictEqual(SPECS_DIR, path.join('.kiro', 'specs'));
    });

    it('LEGACY_KSPEC_DIR is .kspec', () => {
      assert.strictEqual(LEGACY_KSPEC_DIR, '.kspec');
    });
  });

  describe('agent model version', () => {
    it('all agents use claude-sonnet-4.6', () => {
      for (const [filename, agent] of Object.entries(agentTemplates)) {
        assert.strictEqual(agent.model, 'claude-sonnet-4.6', `${filename}: should use claude-sonnet-4.6`);
      }
    });
  });

  describe('agent prompt format', () => {
    it('kspec-spec uses standardized .current format', () => {
      const agent = agentTemplates['kspec-spec.json'];
      assert(agent.prompt.includes('.kiro/specs/'), 'Should reference .kiro/specs/ format');
      assert(agent.prompt.includes('Regenerate .kiro/CONTEXT.md'), 'Should say regenerate CONTEXT.md');
    });

    it('kspec-tasks references design.md', () => {
      const agent = agentTemplates['kspec-tasks.json'];
      assert(agent.prompt.includes('design.md'), 'Should reference design.md');
    });

    it('kspec-build uses regenerate for CONTEXT.md', () => {
      const agent = agentTemplates['kspec-build.json'];
      assert(agent.prompt.includes('regenerate .kiro/CONTEXT.md'), 'Should say regenerate CONTEXT.md');
    });

    it('kspec-verify has VERIFY-DESIGN section', () => {
      const agent = agentTemplates['kspec-verify.json'];
      assert(agent.prompt.includes('VERIFY-DESIGN'), 'Should have VERIFY-DESIGN section');
    });

    it('kspec-jira references jira-links.json', () => {
      const agent = agentTemplates['kspec-jira.json'];
      assert(agent.prompt.includes('jira-links.json'), 'Should reference jira-links.json');
    });

    it('all agents have PIPELINE section', () => {
      for (const [filename, agent] of Object.entries(agentTemplates)) {
        assert(agent.prompt.includes('PIPELINE'), `${filename}: should have PIPELINE section`);
      }
    });
  });

  describe('setCurrentSpec', () => {
    it('normalizes full paths to relative format', () => {
      const specFolder = path.join('.kiro', 'specs', '2026-01-25-normalize-test');
      fs.mkdirSync(specFolder, { recursive: true });
      setCurrentSpec('/some/absolute/path/2026-01-25-normalize-test');
      const content = fs.readFileSync(path.join('.kiro', '.current'), 'utf8');
      assert.strictEqual(content, path.join('.kiro', 'specs', '2026-01-25-normalize-test'));
    });

    it('normalizes relative paths consistently', () => {
      const specFolder = path.join('.kiro', 'specs', '2026-01-25-relative-test');
      fs.mkdirSync(specFolder, { recursive: true });
      setCurrentSpec('.kiro/specs/2026-01-25-relative-test');
      const content = fs.readFileSync(path.join('.kiro', '.current'), 'utf8');
      assert.strictEqual(content, path.join('.kiro', 'specs', '2026-01-25-relative-test'));
    });
  });

  describe('getCurrentSpec enhanced', () => {
    it('returns null for empty .current file', () => {
      fs.writeFileSync(path.join('.kiro', '.current'), '');
      const result = getCurrentSpec();
      assert.strictEqual(result, null);
    });

    it('returns null for whitespace-only .current file', () => {
      fs.writeFileSync(path.join('.kiro', '.current'), '   \n  ');
      const result = getCurrentSpec();
      assert.strictEqual(result, null);
    });

    it('does not use fuzzy matching', () => {
      const specFolder = path.join('.kiro', 'specs', '2026-01-25-fuzzy-test');
      fs.mkdirSync(specFolder, { recursive: true });
      // Write a partial name that would have matched with fuzzy matching
      fs.writeFileSync(path.join('.kiro', '.current'), 'fuzzy-test');
      const result = getCurrentSpec();
      assert.strictEqual(result, null, 'Should not fuzzy match partial names');
    });

    it('handles folder name fallback for backward compat', () => {
      const specName = '2026-01-25-backward-compat';
      const specFolder = path.join('.kiro', 'specs', specName);
      fs.mkdirSync(specFolder, { recursive: true });
      fs.writeFileSync(path.join('.kiro', '.current'), specName);
      const result = getCurrentSpec();
      assert.strictEqual(result, specFolder);
    });
  });

  describe('getOrSelectSpec errors', () => {
    it('suggests kspec list when spec not found', () => {
      let errorOutput = '';
      const originalError = console.error;
      const originalExit = process.exit;
      console.error = (...args) => { errorOutput += args.join(' '); };
      process.exit = () => { throw new Error('EXIT'); };

      try {
        getOrSelectSpec('nonexistent-feature');
      } catch (e) {
        assert(errorOutput.includes('kspec list'), 'Should suggest kspec list');
      } finally {
        console.error = originalError;
        process.exit = originalExit;
      }
    });

    it('mentions stale .current when no current spec', () => {
      // Clear .current
      if (fs.existsSync(path.join('.kiro', '.current'))) {
        fs.unlinkSync(path.join('.kiro', '.current'));
      }

      let errorOutput = '';
      const originalError = console.error;
      const originalExit = process.exit;
      console.error = (...args) => { errorOutput += args.join(' '); };
      process.exit = () => { throw new Error('EXIT'); };

      try {
        getOrSelectSpec();
      } catch (e) {
        assert(errorOutput.includes('stale'), 'Should mention stale .current');
        assert(errorOutput.includes('kspec list'), 'Should suggest kspec list');
      } finally {
        console.error = originalError;
        process.exit = originalExit;
      }
    });
  });

  describe('sync-jira smart default', () => {
    it('reads jira-links.json for existing specIssue', () => {
      const folder = path.join('.kiro', 'specs', '2026-01-25-jira-smart');
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'jira-links.json'), JSON.stringify({
        specIssue: 'PROJ-999'
      }));
      // Verify the file exists and has specIssue
      const links = JSON.parse(fs.readFileSync(path.join(folder, 'jira-links.json'), 'utf8'));
      assert.strictEqual(links.specIssue, 'PROJ-999');
    });
  });

  describe('kspec-design agent', () => {
    it('exists in agent templates', () => {
      assert(agentTemplates['kspec-design.json'], 'Missing kspec-design agent');
    });

    it('has correct structure', () => {
      const agent = agentTemplates['kspec-design.json'];
      assert.strictEqual(agent.name, 'kspec-design');
      assert.strictEqual(agent.model, 'claude-sonnet-4.6');
      assert(Array.isArray(agent.tools));
      assert(agent.tools.includes('read'));
      assert(agent.tools.includes('write'));
    });

    it('has keyboard shortcut', () => {
      const agent = agentTemplates['kspec-design.json'];
      assert.strictEqual(agent.keyboardShortcut, 'ctrl+shift+d');
    });

    it('prompt mentions design sections', () => {
      const agent = agentTemplates['kspec-design.json'];
      assert(agent.prompt.includes('Architecture Overview'), 'Should mention Architecture Overview');
      assert(agent.prompt.includes('Component Breakdown'), 'Should mention Component Breakdown');
      assert(agent.prompt.includes('Data Models'), 'Should mention Data Models');
      assert(agent.prompt.includes('API Contracts'), 'Should mention API Contracts');
    });
  });

  describe('refreshContext with design', () => {
    it('shows design not yet created', () => {
      const specFolder = '.kiro/specs/2026-01-25-no-design';
      fs.mkdirSync(specFolder, { recursive: true });
      fs.writeFileSync(`${specFolder}/spec-lite.md`, '# No Design Spec');
      fs.writeFileSync('.kiro/.current', specFolder);

      const content = refreshContext();
      assert(content.includes('Design'), 'Should include Design section');
      assert(content.includes('not yet created'), 'Should show not yet created');
    });

    it('shows design present', () => {
      const specFolder = '.kiro/specs/2026-01-25-has-design';
      fs.mkdirSync(specFolder, { recursive: true });
      fs.writeFileSync(`${specFolder}/spec-lite.md`, '# Has Design Spec');
      fs.writeFileSync(`${specFolder}/design.md`, '# Design');
      fs.writeFileSync('.kiro/.current', specFolder);

      const content = refreshContext();
      assert(content.includes('Design'), 'Should include Design section');
      assert(content.includes('present'), 'Should show present');
    });

    it('quick commands include design', () => {
      const specFolder = '.kiro/specs/2026-01-25-has-design';
      fs.writeFileSync('.kiro/.current', specFolder);
      const content = refreshContext();
      assert(content.includes('kspec design'), 'Quick commands should include design');
    });
  });

  describe('help includes design', () => {
    it('mentions design and verify-design commands', () => {
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      try {
        commands.help();
        assert(output.includes('kspec design'), 'Help should mention design command');
        assert(output.includes('verify-design'), 'Help should mention verify-design');
        assert(output.includes('jira-pull'), 'Help should mention jira-pull');
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('agents includes design', () => {
    it('lists kspec-design agent', () => {
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      try {
        commands.agents();
        assert(output.includes('kspec-design'), 'Should list kspec-design agent');
        assert(output.includes('Ctrl+Shift+D'), 'Should show design agent shortcut');
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('status with design pipeline', () => {
    it('shows design step when spec exists but no design', () => {
      const specFolder = '.kiro/specs/2026-01-25-status-design';
      fs.mkdirSync(specFolder, { recursive: true });
      fs.writeFileSync(`${specFolder}/spec.md`, '# Spec');
      fs.writeFileSync(`${specFolder}/spec-lite.md`, '# Lite');
      fs.writeFileSync('.kiro/.current', specFolder);

      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      try {
        commands.status();
        assert(output.includes('kspec design'), 'Should suggest design as next step');
      } finally {
        console.log = originalLog;
      }
    });

    it('shows tasks step when design exists but no tasks', () => {
      const specFolder = '.kiro/specs/2026-01-25-status-tasks';
      fs.mkdirSync(specFolder, { recursive: true });
      fs.writeFileSync(`${specFolder}/spec.md`, '# Spec');
      fs.writeFileSync(`${specFolder}/spec-lite.md`, '# Lite');
      fs.writeFileSync(`${specFolder}/design.md`, '# Design');
      fs.writeFileSync('.kiro/.current', specFolder);

      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      try {
        commands.status();
        assert(output.includes('kspec tasks'), 'Should suggest tasks as next step');
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('jira-pull command', () => {
    it('requires jira-links.json', async () => {
      const folder = '.kiro/specs/2026-01-25-jira-pull-test';
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync('.kiro/.current', folder);

      let errorOutput = '';
      const originalError = console.error;
      const originalExit = process.exit;
      console.error = (...args) => { errorOutput += args.join(' '); };
      process.exit = () => { throw new Error('EXIT'); };

      try {
        await commands['jira-pull']([]);
      } catch (e) {
        assert(errorOutput.includes('jira-links.json'), 'Should mention missing jira-links.json');
      } finally {
        console.error = originalError;
        process.exit = originalExit;
      }
    });
  });

  describe('kspec-jira pull-updates', () => {
    it('agent prompt includes PULL UPDATES capability', () => {
      const agent = agentTemplates['kspec-jira.json'];
      assert(agent.prompt.includes('PULL UPDATES'), 'Should have PULL UPDATES capability');
    });

    it('agent prompt warns against auto-update', () => {
      const agent = agentTemplates['kspec-jira.json'];
      assert(agent.prompt.includes('NEVER auto-update'), 'Should warn against auto-updating spec');
    });
  });

  describe('verify-spec as spec-shaper', () => {
    it('verify agent has interactive spec shaping', () => {
      const agent = agentTemplates['kspec-verify.json'];
      assert(agent.prompt.includes('Interactive Spec Shaping'), 'Should have Interactive Spec Shaping');
    });

    it('verify agent asks clarifying questions', () => {
      const agent = agentTemplates['kspec-verify.json'];
      assert(agent.prompt.includes('clarifying questions'), 'Should mention clarifying questions');
    });

    it('verify agent gets user confirmation', () => {
      const agent = agentTemplates['kspec-verify.json'];
      assert(agent.prompt.includes('user confirmation') || agent.prompt.includes('Get user confirmation'), 'Should require user confirmation');
    });
  });

  describe('validateContract', () => {
    let validateContract;

    before(() => {
      ({ validateContract } = require('../src/index.js'));
    });

    // Helper to create cross-platform paths in JSON
    const jsonPath = (...parts) => path.join(...parts).replace(/\\/g, '/');

    it('returns success when no contract section', () => {
      const folder = path.join('.kiro', 'specs', 'no-contract');
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'spec.md'), '# Spec\n\nNo contract here.');

      const result = validateContract(folder);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.checks.length, 0);
      assert.strictEqual(result.errors.length, 0);
    });

    it('returns success when spec.md does not exist', () => {
      const folder = path.join('.kiro', 'specs', 'no-spec-file');
      fs.mkdirSync(folder, { recursive: true });

      const result = validateContract(folder);
      assert.strictEqual(result.success, true);
    });

    it('detects missing output files', () => {
      const folder = path.join('.kiro', 'specs', 'missing-files');
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'spec.md'), `# Spec

## Contract

\`\`\`json
{
  "output_files": ["non-existent-file.js", "another-missing.ts"]
}
\`\`\`
`);

      const result = validateContract(folder);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.errors.length, 2);
      assert(result.errors[0].includes('Missing required file'));
      assert(result.errors[1].includes('Missing required file'));
    });

    it('validates existing output files', () => {
      const folder = path.join('.kiro', 'specs', 'existing-files');
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'existing.js'), 'console.log("exists");');
      fs.writeFileSync(path.join(folder, 'spec.md'), `# Spec

## Contract

\`\`\`json
{
  "output_files": ["${jsonPath(folder, 'existing.js')}"]
}
\`\`\`
`);

      const result = validateContract(folder);
      assert.strictEqual(result.success, true);
      assert(result.checks.some(c => c.includes('File exists')));
    });

    it('validates contains checks - pass', () => {
      const folder = path.join('.kiro', 'specs', 'contains-pass');
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'target.js'), 'export function myFunction() {}');
      fs.writeFileSync(path.join(folder, 'spec.md'), `# Spec

## Contract

\`\`\`json
{
  "checks": [
    { "type": "contains", "file": "${jsonPath(folder, 'target.js')}", "text": "export function" }
  ]
}
\`\`\`
`);

      const result = validateContract(folder);
      assert.strictEqual(result.success, true);
      assert(result.checks.some(c => c.includes('Content match')));
    });

    it('validates contains checks - fail', () => {
      const folder = path.join('.kiro', 'specs', 'contains-fail');
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'target.js'), 'const x = 1;');
      fs.writeFileSync(path.join(folder, 'spec.md'), `# Spec

## Contract

\`\`\`json
{
  "checks": [
    { "type": "contains", "file": "${jsonPath(folder, 'target.js')}", "text": "export function" }
  ]
}
\`\`\`
`);

      const result = validateContract(folder);
      assert.strictEqual(result.success, false);
      assert(result.errors.some(e => e.includes('should contain')));
    });

    it('validates not_contains checks - pass', () => {
      const folder = path.join('.kiro', 'specs', 'not-contains-pass');
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'clean.js'), 'const x = 1;');
      fs.writeFileSync(path.join(folder, 'spec.md'), `# Spec

## Contract

\`\`\`json
{
  "checks": [
    { "type": "not_contains", "file": "${jsonPath(folder, 'clean.js')}", "text": "console.log" }
  ]
}
\`\`\`
`);

      const result = validateContract(folder);
      assert.strictEqual(result.success, true);
      assert(result.checks.some(c => c.includes('does not contain')));
    });

    it('validates not_contains checks - fail', () => {
      const folder = path.join('.kiro', 'specs', 'not-contains-fail');
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'dirty.js'), 'console.log("debug");');
      fs.writeFileSync(path.join(folder, 'spec.md'), `# Spec

## Contract

\`\`\`json
{
  "checks": [
    { "type": "not_contains", "file": "${jsonPath(folder, 'dirty.js')}", "text": "console.log" }
  ]
}
\`\`\`
`);

      const result = validateContract(folder);
      assert.strictEqual(result.success, false);
      assert(result.errors.some(e => e.includes('should NOT contain')));
    });

    it('handles JSON with comments', () => {
      const folder = path.join('.kiro', 'specs', 'json-comments');
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'file.js'), 'content');
      fs.writeFileSync(path.join(folder, 'spec.md'), `# Spec

## Contract

\`\`\`json
{
  // This is a comment
  "output_files": ["${jsonPath(folder, 'file.js')}"]  // Another comment
}
\`\`\`
`);

      const result = validateContract(folder);
      assert.strictEqual(result.success, true);
    });

    it('returns error for invalid JSON', () => {
      const folder = path.join('.kiro', 'specs', 'invalid-json');
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'spec.md'), `# Spec

## Contract

\`\`\`json
{ invalid json here
\`\`\`
`);

      const result = validateContract(folder);
      assert.strictEqual(result.success, false);
      assert(result.errors.some(e => e.includes('Invalid JSON')));
    });

    it('validates api_schema existence', () => {
      const folder = path.join('.kiro', 'specs', 'api-schema-missing');
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'spec.md'), `# Spec

## Contract

\`\`\`json
{
  "api_schema": {
    "type": "openapi",
    "file": "non-existent-openapi.json"
  }
}
\`\`\`
`);

      const result = validateContract(folder);
      assert.strictEqual(result.success, false);
      assert(result.errors.some(e => e.includes('Missing API Schema file')));
    });

    it('validates api_schema JSON syntax', () => {
      const folder = path.join('.kiro', 'specs', 'api-schema-valid');
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'openapi.json'), '{"openapi": "3.0.0"}');
      fs.writeFileSync(path.join(folder, 'spec.md'), `# Spec

## Contract

\`\`\`json
{
  "api_schema": {
    "type": "openapi",
    "file": "${jsonPath(folder, 'openapi.json')}"
  }
}
\`\`\`
`);

      const result = validateContract(folder);
      assert.strictEqual(result.success, true);
      assert(result.checks.some(c => c.includes('API Schema exists')));
      assert(result.checks.some(c => c.includes('valid JSON')));
    });

    it('detects invalid api_schema JSON', () => {
      const folder = path.join('.kiro', 'specs', 'api-schema-invalid');
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'bad-openapi.json'), '{ invalid json }');
      fs.writeFileSync(path.join(folder, 'spec.md'), `# Spec

## Contract

\`\`\`json
{
  "api_schema": {
    "type": "openapi",
    "file": "${jsonPath(folder, 'bad-openapi.json')}"
  }
}
\`\`\`
`);

      const result = validateContract(folder);
      assert.strictEqual(result.success, false);
      assert(result.errors.some(e => e.includes('invalid JSON')));
    });

    it('handles check for non-existent file', () => {
      const folder = path.join('.kiro', 'specs', 'check-no-file');
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'spec.md'), `# Spec

## Contract

\`\`\`json
{
  "checks": [
    { "type": "contains", "file": "does-not-exist.js", "text": "something" }
  ]
}
\`\`\`
`);

      const result = validateContract(folder);
      assert.strictEqual(result.success, false);
      assert(result.errors.some(e => e.includes('File not found')));
    });

    it('skips checks with missing fields', () => {
      const folder = path.join('.kiro', 'specs', 'incomplete-check');
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, 'spec.md'), `# Spec

## Contract

\`\`\`json
{
  "checks": [
    { "type": "contains" },
    { "file": "test.js" },
    { "text": "something" }
  ]
}
\`\`\`
`);

      const result = validateContract(folder);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.errors.length, 0);
    });
  });
});
