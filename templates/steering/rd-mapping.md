# R&D Category Mappings

This document defines how kspec classifies work for R&D reporting. When Jira issues are created via `kspec sync-jira` or `kspec jira-subtasks`, they are automatically tagged with the appropriate R&D category.

## Standard Categories

| R&D Category | Jira Label | Description |
|--------------|------------|-------------|
| New Development | `rd:new-dev` | Net new features and capabilities |
| Enhancement | `rd:enhancement` | Improvements to existing features |
| Maintenance | `rd:maintenance` | Bug fixes and operational issues |
| Tech Debt | `rd:tech-debt` | Refactoring, code cleanup, modernization |
| Security | `rd:security` | Security improvements and vulnerability fixes |
| Optimization | `rd:optimization` | Performance improvements |
| Documentation | `rd:documentation` | Documentation updates |
| Quality | `rd:quality` | Testing, CI/CD, quality improvements |

## Keyword Mappings

kspec automatically detects work type from these keywords in your spec:

### New Development
- "new feature", "implement", "add support for", "create", "build"
- "introduce", "launch", "MVP"

### Enhancement
- "improve", "enhance", "update", "extend", "upgrade"
- "add to existing", "expand"

### Maintenance
- "fix", "bug", "issue", "broken", "not working"
- "error", "crash", "failure"

### Tech Debt
- "refactor", "cleanup", "reorganize", "modernize"
- "technical debt", "legacy", "deprecated"

### Security
- "security", "vulnerability", "CVE", "authentication"
- "authorization", "encryption", "audit"

### Optimization
- "performance", "optimize", "speed", "latency"
- "throughput", "cache", "scale"

## Custom Mappings

Add project-specific mappings below:

| Keyword/Pattern | R&D Category | Notes |
|-----------------|--------------|-------|
| `auth-*` | Security | Authentication features |
| `api-*` | New Development | API work |
| `legacy-*` | Tech Debt | Legacy system work |

## Default Category

When no classification can be determined: `rd:uncategorized`

Review uncategorized items weekly and update mappings.

## Team Labels

Additional labels applied to all issues:

```
team:your-team-name
product:your-product
```

## Quarterly Labels

Automatically add quarter label based on issue creation date:

```
quarter:Q1-2026
```

## Excluded Patterns

Do not apply R&D tags to issues matching:

- Label: `spike` - Research/investigation work
- Label: `meeting` - Meeting-related items
- Label: `admin` - Administrative tasks
- Type: `Epic` - Parent items (tag children only)

## Reporting Queries

### JQL for R&D Reports

**All kspec-managed issues:**
```
labels = "kspec-managed" AND created >= startOfQuarter()
```

**By R&D category:**
```
labels = "rd:new-dev" AND created >= startOfQuarter()
```

**Effort by category:**
```
labels in ("rd:new-dev", "rd:enhancement", "rd:maintenance")
AND resolved >= startOfQuarter()
ORDER BY labels
```

## Compliance

- All production code changes MUST have R&D classification
- Classification SHOULD be reviewed during sprint planning
- Uncategorized items MUST be resolved within 1 sprint
