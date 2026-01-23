const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const TEST_DIR = path.join(__dirname, 'test-workspace');

describe('kspec', () => {
  let commands, loadConfig, run, detectCli, requireCli, agentTemplates, getTaskStats, refreshContext, compareVersions;

  before(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    process.chdir(TEST_DIR);
    ({ commands, loadConfig, run, detectCli, requireCli, agentTemplates, getTaskStats, refreshContext, compareVersions } = require('../src/index.js'));
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
      fs.mkdirSync('.kspec', { recursive: true });
      fs.writeFileSync('.kspec/config.json', JSON.stringify({
        dateFormat: 'DD-MM-YYYY',
        autoExecute: 'auto',
        initialized: true
      }));

      const cfg = loadConfig();
      assert.strictEqual(cfg.dateFormat, 'DD-MM-YYYY');
      assert.strictEqual(cfg.autoExecute, 'auto');
    });

    it('returns defaults on corrupted config', () => {
      fs.mkdirSync('.kspec', { recursive: true });
      fs.writeFileSync('.kspec/config.json', 'invalid json {{{');

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
      fs.mkdirSync('.kspec/specs/2026-01-22-test-feature', { recursive: true });
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
      fs.mkdirSync('.kspec/specs/test-spec', { recursive: true });
      const stats = getTaskStats('.kspec/specs/test-spec');
      assert.strictEqual(stats, null);
    });

    it('counts tasks correctly', () => {
      fs.mkdirSync('.kspec/specs/task-test', { recursive: true });
      fs.writeFileSync('.kspec/specs/task-test/tasks.md', `# Tasks
- [ ] Pending task 1
- [x] Done task 1
- [ ] Pending task 2
`);
      const stats = getTaskStats('.kspec/specs/task-test');
      assert.strictEqual(stats.total, 3);
      assert.strictEqual(stats.done, 1);
      assert.strictEqual(stats.remaining, 2);
    });

    it('handles uppercase [X] markers', () => {
      fs.mkdirSync('.kspec/specs/uppercase-test', { recursive: true });
      fs.writeFileSync('.kspec/specs/uppercase-test/tasks.md', `# Tasks
- [ ] Pending
- [x] Done lowercase
- [X] Done uppercase
`);
      const stats = getTaskStats('.kspec/specs/uppercase-test');
      assert.strictEqual(stats.total, 3);
      assert.strictEqual(stats.done, 2);
      assert.strictEqual(stats.remaining, 1);
    });
  });

  describe('refreshContext', () => {
    it('creates CONTEXT.md with no active spec', () => {
      // Clear any existing .current file
      const currentFile = '.kspec/.current';
      if (fs.existsSync(currentFile)) fs.unlinkSync(currentFile);

      const content = refreshContext();
      assert(content.includes('No active spec'));
      assert(fs.existsSync('.kspec/CONTEXT.md'));
    });

    it('includes spec info when spec exists', () => {
      // Create a spec with spec-lite
      const specFolder = '.kspec/specs/2026-01-24-test-context';
      fs.mkdirSync(specFolder, { recursive: true });
      fs.writeFileSync(`${specFolder}/spec-lite.md`, '# Test Spec\n- Requirement 1\n- Requirement 2');
      fs.writeFileSync('.kspec/.current', specFolder);

      const content = refreshContext();
      assert(content.includes('2026-01-24-test-context'));
      assert(content.includes('Requirements Summary'));
      assert(content.includes('Requirement 1'));
    });

    it('includes task progress when tasks exist', () => {
      const specFolder = '.kspec/specs/2026-01-24-test-context';
      fs.writeFileSync(`${specFolder}/tasks.md`, '- [x] Task 1\n- [ ] Task 2\n- [ ] Task 3');
      fs.writeFileSync('.kspec/.current', specFolder);

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
        'kspec-tasks.json',
        'kspec-build.json',
        'kspec-verify.json',
        'kspec-review.json'
      ];

      for (const agent of expectedAgents) {
        assert(agentTemplates[agent], `Missing agent: ${agent}`);
      }
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

    it('agents include steering and kspec resources', () => {
      for (const [filename, agent] of Object.entries(agentTemplates)) {
        const hasSteeringResource = agent.resources.some(r => r.includes('.kiro/steering'));
        const hasKspecResource = agent.resources.some(r => r.includes('.kspec'));

        assert(hasSteeringResource, `${filename}: should include .kiro/steering resource`);
        assert(hasKspecResource, `${filename}: should include .kspec resource`);
      }
    });

    it('agents include CONTEXT.md as first resource', () => {
      for (const [filename, agent] of Object.entries(agentTemplates)) {
        assert(agent.resources[0] === 'file://.kspec/CONTEXT.md',
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
  });

  describe('context command', () => {
    it('outputs context and confirms file creation', () => {
      let output = '';
      const originalLog = console.log;
      console.log = (...args) => { output += args.join(' ') + '\n'; };

      try {
        commands.context();
        assert(output.includes('kspec Context'));
        assert(output.includes('CONTEXT.md'));
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
});
