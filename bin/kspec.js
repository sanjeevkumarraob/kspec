#!/usr/bin/env node
const { run } = require('../src/index.js');
run(process.argv.slice(2)).catch(e => { console.error(e.message); process.exit(1); });
