# kspec Enterprise Skills Plan

## Overview

This document outlines the plan for creating enterprise-focused skills for kspec that integrate with Kiro CLI's native skills system. Skills are mandatory workflows that trigger automatically based on context, providing consistent governance and compliance across teams.

## Manager Requirement: R&D Tagging

> "When generating the Jira tickets, tag against R&D to more easily support pulling that data together in the future."

This requires a skill that:
1. Automatically adds R&D labels/tags to Jira issues created via `kspec sync-jira`
2. Includes configurable tag mappings (e.g., feature type → R&D category)
3. Ensures traceability from spec to Jira to implementation

## Skills Architecture

### Directory Structure

```
.kiro/skills/
├── kspec-enterprise/
│   ├── SKILL.md                     # Main skill index
│   ├── jira-rd-tagging/
│   │   └── SKILL.md                 # R&D tagging for Jira
│   ├── compliance-gates/
│   │   └── SKILL.md                 # Compliance verification
│   ├── audit-trail/
│   │   └── SKILL.md                 # Audit logging
│   ├── spec-governance/
│   │   └── SKILL.md                 # Spec approval workflow
│   └── enterprise-contracts/
│       └── SKILL.md                 # Enterprise contract checks
```

### SKILL.md Format

```yaml
---
name: jira-rd-tagging
description: Automatically tags Jira issues with R&D categories based on spec type and steering docs
metadata:
  skillport:
    category: enterprise
    tags: [jira, rd, tagging, compliance]
    alwaysApply: false
---
# R&D Tagging for Jira

[Skill content...]
```

---

## Proposed Skills

### 1. jira-rd-tagging (Priority: HIGH)

**Purpose:** Automatically tag Jira issues with R&D categories for reporting and tracking.

**Triggers:**
- `kspec sync-jira` command
- `kspec jira-subtasks` command
- kspec-jira agent creating issues

**Configuration (in `.kiro/steering/rd-mapping.md`):**
```markdown
## R&D Tag Mappings

| Spec Type | R&D Category | Jira Label |
|-----------|--------------|------------|
| Feature | New Development | rd:new-dev |
| Enhancement | Enhancement | rd:enhancement |
| Bug Fix | Maintenance | rd:maintenance |
| Refactor | Tech Debt | rd:tech-debt |
| Security | Security | rd:security |
| Performance | Optimization | rd:optimization |
```

**SKILL.md Content:**
```yaml
---
name: jira-rd-tagging
description: Use when creating or updating Jira issues to ensure R&D tagging compliance
metadata:
  skillport:
    category: enterprise
    tags: [jira, rd, compliance, reporting]
---
# R&D Tagging Skill

## Purpose
Ensures all Jira issues created via kspec are tagged with appropriate R&D categories for reporting.

## Workflow

1. **Detect Spec Type**
   - Read spec.md for feature type indicators
   - Check steering docs for project classification
   - Look for keywords: "feature", "bug", "refactor", "security", etc.

2. **Map to R&D Category**
   - Reference `.kiro/steering/rd-mapping.md` for mappings
   - Apply default category if no match found
   - Log classification decision

3. **Apply Tags**
   - Add `rd:<category>` label to Jira issue
   - Add `kspec-managed` label for traceability
   - Include spec reference in issue description

4. **Verification**
   - Confirm tags applied successfully
   - Update jira-links.json with tag info
   - Report classification to user

## Required Steering Doc

Create `.kiro/steering/rd-mapping.md` with your organization's R&D category mappings.
```

---

### 2. compliance-gates (Priority: HIGH)

**Purpose:** Enforce compliance checkpoints before specs move to implementation.

**Triggers:**
- `kspec verify-spec` command
- `kspec tasks` command (before generating tasks)
- kspec-spec agent completing specification

**Checks:**
- Security review required for certain keywords
- Architecture review for infrastructure changes
- Legal review for third-party integrations
- Privacy review for PII handling

**SKILL.md Content:**
```yaml
---
name: compliance-gates
description: Use when verifying specs to ensure compliance requirements are met before implementation
metadata:
  skillport:
    category: enterprise
    tags: [compliance, security, governance]
---
# Compliance Gates Skill

## Purpose
Enforces mandatory compliance checkpoints based on spec content.

## Gate Definitions

### Security Gate
**Triggers:** Keywords like "authentication", "authorization", "encryption", "credentials", "API key"
**Requirement:** Security review checklist completed
**Artifact:** `security-review.md` in spec folder

### Architecture Gate
**Triggers:** Keywords like "database", "infrastructure", "scaling", "migration"
**Requirement:** Architecture decision record (ADR)
**Artifact:** `adr.md` in spec folder

### Privacy Gate
**Triggers:** Keywords like "PII", "personal data", "GDPR", "user data"
**Requirement:** Privacy impact assessment
**Artifact:** `privacy-assessment.md` in spec folder

## Workflow

1. Scan spec.md for trigger keywords
2. Identify required gates
3. Check for gate artifacts
4. Block task generation if gates not satisfied
5. Provide clear guidance on required actions
```

---

### 3. audit-trail (Priority: MEDIUM)

**Purpose:** Maintain comprehensive audit logs for compliance and debugging.

**Triggers:**
- All kspec commands
- All agent actions

**Logs:**
- Command executed
- Timestamp
- User (from git config)
- Spec affected
- Changes made
- Jira issues created/updated

**SKILL.md Content:**
```yaml
---
name: audit-trail
description: Use to maintain audit logs for all kspec operations
metadata:
  skillport:
    category: enterprise
    tags: [audit, compliance, logging]
    alwaysApply: true
---
# Audit Trail Skill

## Purpose
Maintains immutable audit logs for compliance and debugging.

## Log Location
`.kiro/audit/YYYY-MM-DD.jsonl`

## Log Format
```json
{
  "timestamp": "2026-01-31T10:30:00Z",
  "user": "user@example.com",
  "command": "sync-jira",
  "spec": "2026-01-31-user-auth",
  "action": "created_jira_issue",
  "details": {
    "issue": "PROJ-123",
    "labels": ["rd:new-dev", "kspec-managed"]
  }
}
```

## Retention
Logs retained for 90 days by default. Configure in `.kiro/config.json`:
```json
{
  "audit": {
    "retentionDays": 90,
    "enabled": true
  }
}
```
```

---

### 4. spec-governance (Priority: MEDIUM)

**Purpose:** Enforce spec approval workflows for enterprise teams.

**Triggers:**
- `kspec tasks` (require approved spec)
- kspec-tasks agent (check approval status)

**Workflow:**
1. Spec created → status: "draft"
2. Spec verified → status: "pending_review"
3. Reviewer approves → status: "approved"
4. Tasks can only be generated for "approved" specs

**SKILL.md Content:**
```yaml
---
name: spec-governance
description: Use to enforce spec approval workflows before task generation
metadata:
  skillport:
    category: enterprise
    tags: [governance, approval, workflow]
---
# Spec Governance Skill

## Purpose
Enforces approval workflows for specs in enterprise environments.

## Status Flow
```
draft → pending_review → approved → in_progress → completed
                      ↘ rejected (requires revision)
```

## Approval Storage
Add to spec.md frontmatter:
```yaml
---
status: approved
approver: jane.doe@company.com
approved_at: 2026-01-31T10:00:00Z
---
```

## Workflow

1. **Draft Phase**
   - Spec created, editable
   - Cannot generate tasks

2. **Review Phase**
   - Run `kspec submit-for-review`
   - Notifies configured reviewers (via Jira/email)
   - Spec locked for major changes

3. **Approval Phase**
   - Reviewer runs `kspec approve` or `kspec reject`
   - Approved specs can proceed to task generation
   - Rejected specs return to draft with feedback

4. **Implementation Phase**
   - Tasks generated, tracked in Jira
   - Spec changes require re-approval
```

---

### 5. enterprise-contracts (Priority: LOW)

**Purpose:** Extended contract checks for enterprise requirements.

**Extensions:**
- Code coverage thresholds
- Performance benchmarks
- Dependency scanning
- License compliance

**SKILL.md Content:**
```yaml
---
name: enterprise-contracts
description: Use for extended enterprise contract validations beyond basic file/content checks
metadata:
  skillport:
    category: enterprise
    tags: [contracts, compliance, quality]
---
# Enterprise Contracts Skill

## Extended Contract Schema

```json
{
  "output_files": [...],
  "checks": [...],
  "enterprise": {
    "coverage": {
      "minimum": 80,
      "exclude": ["test/**"]
    },
    "performance": {
      "response_time_p95_ms": 200,
      "memory_mb": 512
    },
    "dependencies": {
      "allowed_licenses": ["MIT", "Apache-2.0", "BSD-3-Clause"],
      "blocked_packages": ["lodash@<4.17.21"]
    },
    "security": {
      "no_vulnerabilities": "high",
      "require_signed_commits": true
    }
  }
}
```

## Validation

Enterprise contracts require additional tooling:
- Coverage: jest --coverage / nyc
- Dependencies: npm audit / license-checker
- Security: snyk / trivy
```

---

### 6. team-sync (Priority: LOW)

**Purpose:** Sync kspec state across team members.

**Features:**
- Notify team when spec status changes
- Sync context across branches
- Conflict detection for concurrent edits

---

## Implementation Roadmap

### Phase 1: R&D Tagging (Week 1-2)
- [ ] Create jira-rd-tagging skill
- [ ] Add rd-mapping.md steering template
- [ ] Update kspec-jira agent to load skill
- [ ] Add `--rd-category` flag to sync-jira
- [ ] Test with sample Jira project

### Phase 2: Compliance Gates (Week 3-4)
- [ ] Create compliance-gates skill
- [ ] Add gate detection logic
- [ ] Create artifact templates
- [ ] Integrate with verify-spec command

### Phase 3: Audit Trail (Week 5-6)
- [ ] Create audit-trail skill
- [ ] Add logging infrastructure
- [ ] Create audit viewer command
- [ ] Add retention management

### Phase 4: Governance & Extended (Week 7-8)
- [ ] Create spec-governance skill
- [ ] Create enterprise-contracts skill
- [ ] Add approval commands
- [ ] Integration testing

---

## Configuration

### Enterprise Config (`.kiro/config.json`)

```json
{
  "enterprise": {
    "enabled": true,
    "rdTagging": {
      "enabled": true,
      "defaultCategory": "rd:new-dev",
      "mappingFile": ".kiro/steering/rd-mapping.md"
    },
    "compliance": {
      "enabled": true,
      "gates": ["security", "architecture", "privacy"]
    },
    "audit": {
      "enabled": true,
      "retentionDays": 90
    },
    "governance": {
      "enabled": false,
      "requireApproval": false,
      "approvers": []
    }
  }
}
```

---

## Integration with Kiro CLI

### Agent Resources

Update kspec agents to include enterprise skills:

```json
{
  "resources": [
    "file://.kiro/CONTEXT.md",
    "file://.kiro/steering/**/*.md",
    "skill://.kiro/skills/kspec-enterprise/**/SKILL.md"
  ]
}
```

### Skill Loading

Skills load on-demand when:
1. Agent detects relevant context (e.g., Jira command)
2. User explicitly invokes skill
3. Skill has `alwaysApply: true`

---

## Repository Structure

Consider creating a separate `kspec-enterprise` repo:

```
kspec-enterprise/
├── skills/
│   ├── jira-rd-tagging/
│   │   └── SKILL.md
│   ├── compliance-gates/
│   │   └── SKILL.md
│   └── ...
├── templates/
│   ├── rd-mapping.md
│   ├── security-review.md
│   └── privacy-assessment.md
├── docs/
│   └── setup.md
└── package.json
```

Install via: `npx kspec-enterprise install`

---

## Next Steps

1. **Review this plan** with your manager and team
2. **Prioritize** based on immediate needs (R&D tagging first)
3. **Create kspec-enterprise repo** for skills
4. **Implement jira-rd-tagging skill** as MVP
5. **Test** with actual Jira project
6. **Iterate** based on feedback

---

## Sources

- [SkillPort - Agent Skills Framework](https://github.com/gotalab/skillport)
- [Superpowers - Skills Library](https://github.com/obra/superpowers)
- [Kiro CLI Custom Agents](https://kiro.dev/docs/cli/custom-agents/creating/)
- [Kiro CLI 1.24.0 Changelog](https://kiro.dev/changelog/cli/1-24/)
