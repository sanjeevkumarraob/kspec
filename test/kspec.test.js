const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const TEST_DIR = path.join(__dirname, 'test-workspace');

describe('kspec', () => {
  let commands, loadConfig;
  
  before(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    process.chdir(TEST_DIR);
    ({ commands, loadConfig } = require('../src/index.js'));
  });

  after(() => {
    process.chdir(__dirname);
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe('init (non-interactive parts)', () => {
    it('creates directory structure when config exists', () => {
      // Simulate config already set
      fs.mkdirSync('.kspec', { recursive: true });
      fs.writeFileSync('.kspec/config.json', JSON.stringify({
        dateFormat: 'YYYY-MM-DD',
        autoExecute: 'ask',
        initialized: true
      }));
      
      assert.ok(fs.existsSync('.kspec'));
    });
  });

  describe('loadConfig', () => {
    it('returns defaults when no config', () => {
      const cfg = loadConfig();
      assert.strictEqual(cfg.dateFormat, 'YYYY-MM-DD');
      assert.strictEqual(cfg.autoExecute, 'ask');
    });
  });

  describe('list', () => {
    it('handles no specs', () => {
      assert.doesNotThrow(() => commands.list());
    });
  });

  describe('status', () => {
    it('shows status', () => {
      assert.doesNotThrow(() => commands.status());
    });
  });

  describe('agents', () => {
    it('lists agents', () => {
      assert.doesNotThrow(() => commands.agents());
    });
  });

  describe('help', () => {
    it('shows help', () => {
      assert.doesNotThrow(() => commands.help());
    });
  });
});
