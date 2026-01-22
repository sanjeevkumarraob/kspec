# kspec Troubleshooting Guide

Common issues and solutions when using kspec with Amazon Q CLI.

## Installation Issues

### kspec Command Not Found

**Problem:** `kspec: command not found` after installation

**Solutions:**

1. **Check installation path:**
```bash
ls -la ~/.local/bin/kspec
```

2. **Add to PATH if missing:**
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
# or for zsh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

3. **Reinstall with custom path:**
```bash
PREFIX=/usr/local/bin curl -fsSL https://raw.githubusercontent.com/skumarbadrinath/kspec/main/install-kspec.sh | bash
```

4. **Check permissions:**
```bash
chmod +x ~/.local/bin/kspec
```

### Installation Script Fails

**Problem:** Installation script exits with errors

**Solutions:**

1. **Check internet connectivity:**
```bash
curl -I https://github.com/skumarbadrinath/kspec/releases/latest
```

2. **Manual installation:**
```bash
# Download latest release manually
wget https://github.com/skumarbadrinath/kspec/releases/latest/download/kspec
chmod +x kspec
mv kspec ~/.local/bin/
```

3. **Check disk space:**
```bash
df -h ~/.local/bin
```

## Initialization Issues

### Agent Files Not Created

**Problem:** `/init` completes but agent files missing

**Solutions:**

1. **Force recreation:**
```bash
QOS_FORCE=1 kspec /init
```

2. **Check permissions:**
```bash
ls -la .amazonq/
mkdir -p .amazonq/cli-agents
chmod 755 .amazonq/cli-agents
```

3. **Manual agent creation:**
```bash
mkdir -p .amazonq/cli-agents
kspec /init
```

### Directory Creation Fails

**Problem:** Cannot create `.kspec` directories

**Solutions:**

1. **Check current directory permissions:**
```bash
pwd
ls -la .
```

2. **Run from project root:**
```bash
cd /path/to/your/project
kspec /init
```

3. **Check disk space:**
```bash
df -h .
```

## Workflow Issues

### "No spec; run /create-spec first"

**Problem:** Commands fail because no current spec is set

**Solutions:**

1. **Check current spec:**
```bash
kspec /current
```

2. **List available specs:**
```bash
ls -la .kspec/specs/
```

3. **Set specific spec:**
```bash
kspec /use .kspec/specs/DD-MM-YYYY-feature-name
```

4. **Create new spec:**
```bash
kspec /create-spec "New Feature"
```

### Spec Folder Not Found

**Problem:** Cannot find or access spec folder

**Solutions:**

1. **Verify folder exists:**
```bash
ls -la .kspec/specs/
```

2. **Check folder naming format:**
```bash
# Correct format: DD-MM-YYYY-feature-slug
ls .kspec/specs/11-11-2025-user-auth/
```

3. **Use absolute path:**
```bash
kspec /use "$(pwd)/.kspec/specs/11-11-2025-feature-name"
```

### Date Format Issues

**Problem:** Incorrect date format in folder names

**Solutions:**

1. **Use AU format (DD-MM-YYYY):**
```bash
QOS_DATE=25-12-2025 kspec /create-spec "Feature"
```

2. **Check existing format:**
```bash
ls .kspec/specs/ | head -5
```

3. **Rename existing folder:**
```bash
mv .kspec/specs/2025-11-11-feature .kspec/specs/11-11-2025-feature
```

## Amazon Q CLI Integration Issues

### Q CLI Agent Not Found

**Problem:** `q chat --agent kspec-analyse` fails with "agent not found"

**Solutions:**

1. **Verify agent files exist:**
```bash
ls -la .amazonq/cli-agents/kspec-*.json
```

2. **Recreate agents:**
```bash
QOS_FORCE=1 kspec /init
```

3. **Check Q CLI configuration:**
```bash
q --version
q config list
```

4. **Use kspec commands instead:**
```bash
# Instead of: q chat --agent kspec-analyse
kspec /analyse
```

### Agent JSON Syntax Errors

**Problem:** Q CLI reports JSON syntax errors in agent files

**Solutions:**

1. **Validate JSON syntax:**
```bash
cat .amazonq/cli-agents/kspec-analyse.json | jq .
```

2. **Recreate corrupted agents:**
```bash
rm .amazonq/cli-agents/kspec-*.json
QOS_FORCE=1 kspec /init
```

3. **Check for file corruption:**
```bash
file .amazonq/cli-agents/kspec-analyse.json
```

### Q CLI Permission Issues

**Problem:** Q CLI agents cannot read/write files

**Solutions:**

1. **Check file permissions:**
```bash
ls -la .kspec/
chmod -R 755 .kspec/
```

2. **Verify Q CLI has access:**
```bash
q chat "Can you read this file?" --file .kspec/standards/tech-stack.md
```

3. **Run from correct directory:**
```bash
pwd  # Should be project root
```

## Standards and Rules Issues

### Standards Conflicts

**Problem:** Conflicts between `.amazonq/rules/*` and `.kspec/standards/*`

**Solutions:**

1. **Check for conflicts:**
```bash
kspec /check-consistency
```

2. **Reconcile differences:**
```bash
kspec /reconcile-rules-standards
```

3. **Manual review:**
```bash
diff .amazonq/rules/01-coding-standards.md .kspec/standards/code-style.md
```

### Apply Standards Fails

**Problem:** `/apply-standards` doesn't update files

**Solutions:**

1. **Check for confirmation:**
```bash
# Must type exactly "APPLY" when prompted
kspec /apply-standards
# > APPLY
```

2. **Verify file permissions:**
```bash
ls -la .kspec/standards/
chmod 644 .kspec/standards/*.md
```

3. **Check disk space:**
```bash
df -h .kspec/
```

## Task Management Issues

### Tasks Not Generated

**Problem:** `/create-tasks` doesn't create tasks.md

**Solutions:**

1. **Verify spec exists:**
```bash
ls -la .kspec/specs/*/spec.md
```

2. **Check current spec:**
```bash
kspec /current
kspec /use .kspec/specs/DD-MM-YYYY-feature-name
```

3. **Recreate tasks:**
```bash
rm .kspec/specs/*/tasks.md
kspec /create-tasks
```

### Task Marking Fails

**Problem:** `/mark-done` doesn't update tasks

**Solutions:**

1. **Check task ID format:**
```bash
# Correct formats:
kspec /mark-done T-001
kspec /mark-done T-003.1
```

2. **Verify tasks.md exists:**
```bash
ls -la .kspec/specs/*/tasks.md
```

3. **Check task numbering:**
```bash
grep -n "^## T-" .kspec/specs/*/tasks.md
```

## File and Directory Issues

### Permission Denied Errors

**Problem:** Cannot read/write kspec files

**Solutions:**

1. **Fix directory permissions:**
```bash
chmod -R 755 .kspec/
chmod -R 755 .amazonq/
```

2. **Fix file permissions:**
```bash
find .kspec/ -type f -exec chmod 644 {} \;
find .amazonq/ -type f -exec chmod 644 {} \;
```

3. **Check ownership:**
```bash
ls -la .kspec/
chown -R $USER:$USER .kspec/
```

### Disk Space Issues

**Problem:** Operations fail due to insufficient disk space

**Solutions:**

1. **Check available space:**
```bash
df -h .
df -h ~/.local/
```

2. **Clean up old specs:**
```bash
ls -la .kspec/specs/
# Remove old specs if needed
rm -rf .kspec/specs/old-date-feature/
```

3. **Check for large files:**
```bash
du -sh .kspec/*
```

## Environment Variable Issues

### QOS_FAST Not Working

**Problem:** Non-interactive mode not activating

**Solutions:**

1. **Check variable setting:**
```bash
echo $QOS_FAST
export QOS_FAST=1
kspec /analyse
```

2. **Use inline setting:**
```bash
QOS_FAST=1 kspec /analyse
```

### QOS_DATE Not Applied

**Problem:** Custom date not used in folder names

**Solutions:**

1. **Check date format:**
```bash
# Must be DD-MM-YYYY
QOS_DATE=25-12-2025 kspec /create-spec "Feature"
```

2. **Verify variable:**
```bash
echo $QOS_DATE
```

3. **Use inline:**
```bash
QOS_DATE=15-11-2025 kspec /create-spec "Feature"
```

## Memory and Sync Issues

### Memory Harvesting Fails

**Problem:** `/harvest-memory` doesn't update memory files

**Solutions:**

1. **Check memory directory:**
```bash
ls -la .kspec/memory/
mkdir -p .kspec/memory/
```

2. **Verify file permissions:**
```bash
touch .kspec/memory/glossary.md .kspec/memory/decisions.md
chmod 644 .kspec/memory/*.md
```

### OAS Sync Issues

**Problem:** `/sync-oas` cannot find OpenAPI files

**Solutions:**

1. **Check for OAS files:**
```bash
find . -name "*.yaml" -o -name "*.yml" -o -name "*.json" | grep -i openapi
find . -name "*openapi*" -o -name "*swagger*"
```

2. **Create OAS directory:**
```bash
mkdir -p api/
touch api/openapi.yaml
```

3. **Verify file format:**
```bash
head -5 api/openapi.yaml
# Should start with: openapi: 3.0.0
```

## Git Integration Issues

### Git Hooks Not Installing

**Problem:** `/install-git-hooks` fails

**Solutions:**

1. **Check git repository:**
```bash
ls -la .git/
git status
```

2. **Verify hooks directory:**
```bash
ls -la .git/hooks/
mkdir -p .git/hooks/
```

3. **Check permissions:**
```bash
chmod 755 .git/hooks/
```

### Pre-commit Hook Fails

**Problem:** Git pre-commit hook exits with errors

**Solutions:**

1. **Test hook manually:**
```bash
.git/hooks/pre-commit
```

2. **Check kspec availability:**
```bash
which kspec
kspec /check-consistency
```

3. **Disable temporarily:**
```bash
git commit --no-verify
```

## CI/CD Issues

### CI Check Script Fails

**Problem:** Generated CI script doesn't work

**Solutions:**

1. **Check script generation:**
```bash
kspec /emit-ci-check
ls -la .kspec/scripts/kspec_check.sh
```

2. **Test script locally:**
```bash
bash .kspec/scripts/kspec_check.sh
```

3. **Check CI environment:**
```bash
# Ensure kspec is available in CI
which kspec || echo "kspec not found in CI"
```

## Performance Issues

### Slow Command Execution

**Problem:** kspec commands take too long

**Solutions:**

1. **Use fast mode:**
```bash
QOS_FAST=1 kspec /analyse
```

2. **Check repository size:**
```bash
du -sh .
```

3. **Exclude large directories:**
```bash
# Add to .gitignore:
node_modules/
.git/
build/
dist/
```

## Getting Help

### Debug Mode

Enable verbose output for troubleshooting:

```bash
set -x  # Enable bash debug mode
kspec /command
set +x  # Disable debug mode
```

### Log Files

Check for error logs:

```bash
# Check system logs
tail -f /var/log/system.log | grep kspec

# Check Q CLI logs
q --help  # Check Q CLI documentation for log locations
```

### Community Support

1. **Check documentation:**
   - `kspec /help`
   - README.md
   - This troubleshooting guide

2. **Report issues:**
   - GitHub Issues: https://github.com/skumarbadrinath/kspec/issues
   - Include error messages and environment details

3. **Environment information:**
```bash
# Gather debug info
echo "OS: $(uname -a)"
echo "kspec version: $(head -1 ~/.local/bin/kspec | grep -o 'v[0-9.]*' || echo 'unknown')"
echo "Q CLI version: $(q --version 2>/dev/null || echo 'not installed')"
echo "Current directory: $(pwd)"
echo "kspec directory: $(ls -la .kspec/ 2>/dev/null || echo 'not found')"
```

This troubleshooting guide covers the most common issues encountered when using kspec. If you encounter an issue not covered here, please check the GitHub repository for updates or report a new issue.
