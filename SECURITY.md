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

### 5. Agent Security

The `kspec-build` agent has shell access for running tests and builds. It is configured with safety measures:

- Uses non-interactive flags (`-y`, `--no-input`)
- Agents are sandboxed within Kiro CLI's security model
- Review generated commands before execution (use `autoExecute: 'ask'` mode)

## Secure Defaults

kspec is designed with security in mind:

- **No hardcoded secrets** - All credentials are user-configured
- **No external dependencies** - Only Node.js builtins (minimal attack surface)
- **Path sanitization** - Input is sanitized to prevent path traversal
- **No eval()** - No dynamic code execution
- **Home directory secrets** - MCP config stored outside project directory
