const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { commands } = require('../src/index.js');

const TEST_DIR = path.join(__dirname, 'test-workspace');

describe('kspec', () => {
  before(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    process.chdir(TEST_DIR);
  });

  after(() => {
    process.chdir(__dirname);
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe('init', () => {
    it('creates directory structure', async () => {
      await commands.init();
      
      assert.ok(fs.existsSync('.kspec'));
      assert.ok(fs.existsSync('.kspec/specs'));
      assert.ok(fs.existsSync('.kspec/standards'));
      assert.ok(fs.existsSync('.kiro/steering'));
      assert.ok(fs.existsSync('.kiro/agents'));
    });

    it('creates steering files', async () => {
      assert.ok(fs.existsSync('.kiro/steering/product.md'));
      assert.ok(fs.existsSync('.kiro/steering/tech.md'));
      assert.ok(fs.existsSync('.kiro/steering/testing.md'));
    });

    it('creates agent configs', async () => {
      assert.ok(fs.existsSync('.kiro/agents/kspec-analyse.json'));
      assert.ok(fs.existsSync('.kiro/agents/kspec-review.json'));
      assert.ok(fs.existsSync('.kiro/agents/kspec-test.json'));
      
      const review = JSON.parse(fs.readFileSync('.kiro/agents/kspec-review.json', 'utf8'));
      assert.strictEqual(review.keyboardShortcut, 'ctrl+r');
    });
  });

  describe('status', () => {
    it('runs without error', () => {
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
