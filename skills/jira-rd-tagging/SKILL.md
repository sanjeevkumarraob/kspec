---
name: jira-rd-tagging
description: Use when creating or updating Jira issues via kspec to ensure R&D category tagging for reporting and analytics
metadata:
  skillport:
    category: enterprise
    tags: [jira, rd, compliance, reporting, enterprise]
    alwaysApply: false
---

# R&D Tagging for Jira Issues

## Purpose

This skill ensures all Jira issues created via kspec are tagged with appropriate R&D categories for reporting, analytics, and compliance. It enables tracking of engineering effort across different work types (new development, maintenance, tech debt, etc.).

## When This Skill Applies

- Creating Jira issues via `kspec sync-jira`
- Creating subtasks via `kspec jira-subtasks`
- Any kspec-jira agent operations that create or update issues

## Workflow

### Step 1: Detect Spec Type

Analyze the spec to determine the type of work:

1. **Read spec.md** for explicit type declarations:
   ```markdown
   ## Type: Feature | Enhancement | Bug Fix | Refactor | Security | Performance
   ```

2. **Scan for keywords** if no explicit type:
   - "new feature", "implement", "add support" → New Development
   - "improve", "enhance", "update", "extend" → Enhancement
   - "fix", "bug", "issue", "broken" → Bug Fix
   - "refactor", "cleanup", "reorganize", "tech debt" → Tech Debt
   - "security", "vulnerability", "CVE", "auth" → Security
   - "performance", "optimize", "speed", "latency" → Optimization

3. **Check steering docs** for project-level classification:
   - `.kiro/steering/rd-mapping.md` for custom mappings
   - `.kiro/steering/product.md` for project context

### Step 2: Map to R&D Category

Reference the R&D mapping configuration:

| Detected Type | R&D Category | Jira Label |
|--------------|--------------|------------|
| New Feature | New Development | `rd:new-dev` |
| Enhancement | Enhancement | `rd:enhancement` |
| Bug Fix | Maintenance | `rd:maintenance` |
| Refactor | Tech Debt | `rd:tech-debt` |
| Security | Security | `rd:security` |
| Performance | Optimization | `rd:optimization` |
| Documentation | Documentation | `rd:documentation` |
| Testing | Quality | `rd:quality` |
| Unknown | Uncategorized | `rd:uncategorized` |

### Step 3: Apply Tags to Jira

When creating or updating Jira issues, apply:

1. **R&D Category Label**: `rd:<category>` (e.g., `rd:new-dev`)
2. **kspec Tracking Label**: `kspec-managed`
3. **Spec Reference**: Include in issue description:
   ```
   ---
   kspec: {spec-folder-name}
   rd-category: {category}
   classified-at: {timestamp}
   ---
   ```

### Step 4: Update Local Tracking

Update `jira-links.json` with R&D information:

```json
{
  "sourceIssues": ["PROJ-100"],
  "specIssue": "PROJ-123",
  "subtasks": ["PROJ-124", "PROJ-125"],
  "rdTagging": {
    "category": "new-dev",
    "labels": ["rd:new-dev", "kspec-managed"],
    "classifiedAt": "2026-01-31T10:00:00Z",
    "classificationReason": "Keywords: 'implement', 'new feature'"
  }
}
```

### Step 5: Report Classification

After applying tags, report to user:

```
✅ R&D Classification Applied
   Category: New Development (rd:new-dev)
   Reason: Keywords detected: "implement", "new feature"
   Issue: PROJ-123
```

## Configuration

### Steering Document: `.kiro/steering/rd-mapping.md`

Create this file to customize R&D mappings for your organization:

```markdown
# R&D Category Mappings

## Custom Mappings

| Project Keyword | R&D Category | Priority |
|-----------------|--------------|----------|
| auth | Security | high |
| api | New Development | medium |
| legacy | Tech Debt | low |

## Default Category

When no classification can be determined: `rd:uncategorized`

## Excluded Labels

Do not apply R&D tags to issues with these labels:
- `spike`
- `research`
- `meeting`

## Custom Labels

Additional labels to always apply:
- `team:platform`
- `quarter:Q1-2026`
```

### Config: `.kiro/config.json`

```json
{
  "enterprise": {
    "rdTagging": {
      "enabled": true,
      "defaultCategory": "rd:uncategorized",
      "mappingFile": ".kiro/steering/rd-mapping.md",
      "alwaysAddKspecLabel": true,
      "includeSpecReference": true
    }
  }
}
```

## Jira MCP Commands

Use these Atlassian MCP commands to apply labels:

```
# Add labels to issue
jira_update_issue(
  issue_key: "PROJ-123",
  labels: ["rd:new-dev", "kspec-managed"]
)

# Add to description
jira_update_issue(
  issue_key: "PROJ-123",
  description: "... existing description ...\n\n---\nkspec: 2026-01-31-user-auth\nrd-category: new-dev"
)
```

## Verification

After applying tags, verify:

1. Issue has `rd:*` label
2. Issue has `kspec-managed` label
3. Issue description includes kspec reference
4. `jira-links.json` updated with rdTagging block

## Troubleshooting

### No R&D Category Detected
- Check spec.md for explicit `## Type:` section
- Add keywords to spec description
- Create/update `.kiro/steering/rd-mapping.md`

### Labels Not Applied
- Verify Jira MCP connection
- Check user has permission to edit labels
- Verify label exists in Jira project (create if needed)

### Wrong Category
- Update `.kiro/steering/rd-mapping.md` with correct mappings
- Add explicit `## Type:` to spec.md

## Examples

### Example 1: New Feature

**spec.md:**
```markdown
# User Authentication with OAuth

## Type: Feature

Implement OAuth 2.0 authentication...
```

**Result:**
- Label: `rd:new-dev`
- Classification: "Explicit type declaration: Feature"

### Example 2: Bug Fix

**spec.md:**
```markdown
# Fix Login Timeout Issue

Users report being logged out unexpectedly after 5 minutes...
```

**Result:**
- Label: `rd:maintenance`
- Classification: "Keywords detected: 'fix', 'issue'"

### Example 3: Refactoring

**spec.md:**
```markdown
# Refactor Payment Module

Clean up legacy payment code and reduce technical debt...
```

**Result:**
- Label: `rd:tech-debt`
- Classification: "Keywords detected: 'refactor', 'technical debt', 'legacy'"
