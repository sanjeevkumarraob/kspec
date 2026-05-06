# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in kspec, please report it responsibly:

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Email the maintainers with details of the vulnerability
3. Allow reasonable time for a fix before public disclosure

## Security Best Practices for Users

### 1. Protect MCP API Tokens

The modern Atlassian MCP uses OAuth via mcp-remote, so no API tokens are stored in configuration files.

**Setup for Teams:**

1. Create a template file in your repo (safe to commit):
   ```json
   // .kiro/mcp.json.template
   {
     "mcpServers": {
       "atlassian": {
         "command": "npx",
         "args": ["-y", "mcp-remote", "https://mcp.atlassian.com/v1/sse"],
         "timeout": 120000
       }
     }
   }
   ```

2. Each team member copies to their settings directory:
   ```bash
   mkdir -p ~/.kiro/settings
   cp .kiro/mcp.json.template ~/.kiro/settings/mcp.json
   ```

3. Or add via CLI:
   ```bash
   kiro-cli mcp add --name atlassian
   ```

Authentication is handled via OAuth when you first use Jira commands.

### 2. Git Repository Safety

kspec creates a `.gitignore` during initialization that:

**Commits (for team collaboration):**
- `.kiro/config.json` - Project preferences
- `.kiro/specs/` - Specifications, tasks, memory
- `.kiro/steering/` - Product, tech, testing guidelines
- `.kiro/agents/` - Agent configurations
- `.kiro/mcp.json.template` - MCP template (no secrets)

**Ignores (local state & secrets):**
- `.kiro/.current` - Your personal working spec
- `.kiro/CONTEXT.md` - Auto-generated state file
- `.kiro/settings/` - Local MCP config
- `~/.kiro/mcp.json` - Personal MCP config with real tokens

### 3. API Token Best Practices

When creating Jira API tokens:

1. **Use scoped tokens** - Request minimum required permissions
2. **Rotate regularly** - Update tokens periodically
3. **Use separate tokens** - Different token per project/environment
4. **Audit access** - Review token usage in Atlassian admin

Get tokens at: https://id.atlassian.com/manage-profile/security/api-tokens

### 4. Spec Content Privacy

Specifications may contain sensitive business information:

- **Private repos**: Commit specs freely
- **Public repos**: Consider keeping `.kiro/specs/` in `.gitignore`
- **Enterprise**: Use Jira integration for requirement traceability instead of committing specs

### 5. Agent Permissions (Least-Privilege)

Every kspec agent ships with a `toolsSettings` block scoping what it can touch. This is enforced by Kiro CLI per the [agent configuration reference](https://kiro.dev/docs/cli/custom-agents/configuration-reference/).

**Path scoping (`toolsSettings.write`):**

| Agent type | `allowedPaths` |
|---|---|
| State-only (analyse, context, refresh, jira, demo, estimate, revise) | `.kiro/**` |
| Spec pipeline (spec, design, tasks, spike) | `.kiro/**` (+ `AGENTS.md` for spec) |
| Verifiers (verify, review) | `.kiro/**` |
| Code-modifying (build, fix, refactor) | `.kiro/**`, `src/**`, `lib/**`, `app/**`, `test/**`, `tests/**`, `*.ts/.tsx/.js/.jsx/.py/.go/.rs` |

**Universal denylist (`toolsSettings.write.deniedPaths`)** — applied to every agent regardless of role:

```
.env*, **/.env*, **/secrets/**, **/credentials/**,
*.pem, *.key, .git/**, node_modules/**, vendor/**, dist/**, build/**
```

**Shell scoping (`toolsSettings.shell`)** for the three shell-capable agents:

- `kspec-build` — package managers (npm/pnpm/yarn/cargo/go/mvn/gradle), git status/diff/add/commit, mkdir/touch, search tools. **Denied:** `rm -rf`, `git push`, `git reset --hard`, `sudo`, `curl`, `wget`, `npm publish`, `pip install`, `apt`, `chmod 777`, `chown`
- `kspec-verify` / `kspec-review` — read-only commands + test runners. **Denied:** all writes, push, commit, sudo, network commands

`autoAllowReadonly: true` exempts safe ls/cat/git-status style commands from prompts.

**Subagent delegation graph (`toolsSettings.subagent.availableAgents`)** — every agent declares which others it may invoke. `kspec-verify` is terminal (`[]`); `kspec-build` may delegate to `[verify, review, fix]`. Makes the call graph auditable for security review.

### 6. Enterprise Governance (opt-in)

`kspec init --enterprise` (or `KSPEC_ENTERPRISE=1`) writes `.kiro/steering/enterprise-governance.md` with `inclusion: always` so it loads into every agent prompt. Captures and documents:

- **MCP registry URL** — admin-hosted JSON allow-list. Kiro auto-revokes unapproved MCP servers every 24h
- **Model registry URL** — approved-models list. Off-policy `model:` fields get rewritten
- **Identity provider** — Okta / Microsoft Entra ID / AWS IAM Identity Center
- **Prompt logging** — surfaces SOC2 / regulatory compliance reminder ("don't paste secrets, PII, customer data") to all agents

See [Kiro enterprise governance docs](https://kiro.dev/docs/cli/enterprise/governance/mcp/).

### 7. CI Hooks (audit + destructive-block)

`kspec init --ci` enables a hooks preset with:

- **`preToolUse`** — audit-log every shell invocation to `.kiro/audit.log`, hard-block destructive patterns (`rm -rf`, `git push`, `sudo`, `curl http`)
- **`postToolUse`** — audit-log every file write
- **`onSpecComplete`** — auto-runs `kspec verify` and `kspec sync-jira --progress`

The audit log is local-only (gitignored) — copy/upload it to your audit system per org policy.

## Secure Defaults

kspec is designed with security in mind:

- **No hardcoded secrets** - All credentials are user-configured
- **No external dependencies** - Only Node.js builtins (minimal attack surface)
- **Path sanitization** - Input is sanitized to prevent path traversal
- **No eval()** - No dynamic code execution
- **Home directory secrets** - MCP config stored outside project directory
- **Least-privilege agents** - `toolsSettings` scope every agent's write paths and shell commands by default
- **Universal denylist** - secrets, git internals, and dependency dirs blocked on every agent regardless of role
- **Auditable delegation** - explicit `subagent.availableAgents` graph per agent
