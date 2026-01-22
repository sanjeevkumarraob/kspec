const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const TEST_DIR = path.join(__dirname, 'test-workspace');

describe('kspec', () => {
  let commands, loadConfig, run;
  
  before(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    process.chdir(TEST_DIR);
    ({ commands, loadConfig, run } = require('../src/index.js'));
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
  });
});
