# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in kspec, please report it responsibly:

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Email the maintainers with details of the vulnerability
3. Allow reasonable time for a fix before public disclosure

## Security Best Practices for Users

### 1. Protect MCP API Tokens

The Atlassian MCP configuration contains sensitive API tokens. These should **never** be committed to version control.

**Setup for Teams:**

1. Create a template file in your repo (safe to commit):
   ```json
   // .kiro/mcp.json.template
   {
     "mcpServers": {
       "atlassian": {
         "command": "npx",
         "args": ["-y", "@anthropic/mcp-atlassian"],
         "env": {
           "ATLASSIAN_HOST": "${ATLASSIAN_HOST}",
           "ATLASSIAN_EMAIL": "${ATLASSIAN_EMAIL}",
           "ATLASSIAN_API_TOKEN": "${ATLASSIAN_API_TOKEN}"
         }
       }
     }
   }
   ```

2. Each team member sets environment variables locally:
   ```bash
   # Add to ~/.bashrc, ~/.zshrc, or use a secrets manager
   export ATLASSIAN_HOST="https://your-domain.atlassian.net"
   export ATLASSIAN_EMAIL="your-email@example.com"
   export ATLASSIAN_API_TOKEN="your-api-token"
   ```

3. Or use the secure local config (never committed):
   ```bash
   # Create personal config in home directory
   mkdir -p ~/.kiro
   chmod 700 ~/.kiro

   # Copy template and fill in real values
   cp .kiro/mcp.json.template ~/.kiro/mcp.json
   chmod 600 ~/.kiro/mcp.json

   # Edit with your real credentials
   nano ~/.kiro/mcp.json
   ```

### 2. Git Repository Safety

kspec creates a `.gitignore` during initialization that:

**Commits (for team collaboration):**
- `.kiro/steering/` - Product, tech, testing guidelines
- `.kiro/agents/` - Agent configurations
- `.kiro/mcp.json.template` - MCP template (no secrets)
- `.kspec/config.json` - Project preferences
- `.kspec/specs/` - Specifications, tasks, memory

**Ignores (local state & secrets):**
- `.kspec/.current` - Your personal working spec
- `.kspec/CONTEXT.md` - Auto-generated state file
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
- **Public repos**: Consider keeping `.kspec/specs/` in `.gitignore`
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
