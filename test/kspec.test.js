const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const TEST_DIR = path.join(__dirname, 'test-workspace');

describe('kspec', () => {
  let commands, loadConfig, run, detectCli, requireCli, agentTemplates;

  before(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    process.chdir(TEST_DIR);
    ({ commands, loadConfig, run, detectCli, requireCli, agentTemplates } = require('../src/index.js'));
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
        assert(output.includes('Workflow:'));
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
        // Should output the version from package.json
        const pkg = require('../package.json');
        assert.strictEqual(output.trim(), pkg.version);
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
        // Should output the version from package.json
        const pkg = require('../package.json');
        assert.strictEqual(output.trim(), pkg.version);
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
  });
});
