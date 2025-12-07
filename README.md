# MCP Registry Extension for VS Code

Enterprise MCP (Model Context Protocol) registry extension that provides secure, centralized access to company-approved AI tools through GitHub Copilot.

## Overview

This extension:
- 🔒 Connects only to your company's MCP registry
- 🛠️ Provides access to approved MCP tools via `@mcp` chat participant
- 🚫 Blocks external MCP servers and gallery
- ✅ Auto-loads on VS Code startup
- 🔄 Works with GitHub Copilot (no separate API key needed)

## Prerequisites

- VS Code 1.90.0 or higher
- GitHub Copilot subscription
- GitHub Copilot Chat extension installed
- MCP Registry running (local or remote)

---

## Quick Start

### For Developers

**Option 1: Standard Install**
```bash
./install.sh
```

**Option 2: Automated Install (One-liner)**
```bash
curl -fsSL http://your-server.com/mcp-extension/auto-install.sh | bash
```

Then restart VS Code and type `@mcp` in chat!

### For Extension Maintainers

See [Deployment Guide](#deployment-guide) below.

---

## Table of Contents

1. [Installation Options](#installation-options)
2. [Usage](#usage)
3. [Deployment Guide](#deployment-guide)
4. [Configuration](#configuration)
5. [Troubleshooting](#troubleshooting)
6. [Development](#development)
7. [Security](#security)

---

## Installation Options

### Option 1: Self-Install (Recommended for Small Teams)

**Step 1: Get the deployment package**
```bash
# Download and extract
tar -xzf mcp-extension.tar.gz
cd deployment
```

**Step 2: Install 'code' command** (one-time setup)
1. Open VS Code
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type: `Shell Command: Install 'code' command in PATH`
4. Press Enter

**Step 3: Run installer**
```bash
./install.sh
```

**Step 4: Restart VS Code**

Done! Extension auto-loads every time.

### Option 2: Fully Automated (Recommended for Large Teams)

**One command installs everything:**

```bash
curl -fsSL http://your-server.com/mcp-extension/auto-install.sh | bash
```

Then restart VS Code.

### Option 3: Manual Installation

```bash
# Install extension
code --install-extension mcp-registry-chat-1.0.0.vsix

# Apply security policy
python3 << 'EOF'
import json, os
from pathlib import Path

settings_path = Path.home() / "Library/Application Support/Code/User/settings.json"
if os.name != 'posix':
    settings_path = Path.home() / ".config/Code/User/settings.json"

settings = json.load(open(settings_path)) if settings_path.exists() else {}
settings.update({
    "mcp.servers": {},
    "github.copilot.chat.mcp.enabled": False,
    "chat.mcp.gallery.enabled": False
})
json.dump(settings, open(settings_path, 'w'), indent=2)
EOF

# Restart VS Code
```

---


## Using MCP Commands in VS Code

This extension provides a set of MCP management commands directly in the chat panel and via the Command Palette. Developers can interact with company-approved MCP tools using simple chat commands.

### How to Use MCP Commands

1. **Open the Chat Panel**
   - Mac: `Cmd+Shift+I`
   - Windows/Linux: `Ctrl+Shift+I`
   - Or: View → Chat

2. **Type MCP Commands in Chat**
   ```
   @mcp /list                # List all available MCP servers
   @mcp /install <name>      # Install a specific MCP server
   @mcp /install-all         # Install all MCP servers
   @mcp /start <name>        # Start a specific MCP server
   @mcp /start-all           # Start all MCP servers
   @mcp /stop <name>         # Stop a specific MCP server
   @mcp /stop-all            # Stop all MCP servers
   @mcp /uninstall <name>    # Uninstall a specific MCP server
   @mcp /uninstall-all       # Uninstall all MCP servers
   @mcp /status              # Show installed servers
   @mcp /help                # Show all available commands
   ```

3. **You can also use commands without the slash:**
   ```
   @mcp list
   @mcp install postman/mcp-server
   @mcp uninstall postman/mcp-server
   ```

4. **Access via Command Palette (`Cmd+Shift+P`):**
   - MCP Registry: Reload Tools
   - MCP Registry: Show Available Tools
   - MCP Registry: Configure URL

### Example Workflow

- To install all MCP servers:
  ```
  @mcp /install-all
  ```
- To start a specific server:
  ```
  @mcp /start postman/mcp-server
  ```
- To list available servers:
  ```
  @mcp /list
  ```

### Notes

- All commands are processed by the extension (`extension.js`).
- Registry URL and security settings are enforced automatically.
- For troubleshooting, see the Output panel: View → Output → Extension Host.

---
## Usage

### Basic Usage

1. **Open Chat Panel**
   - Mac: `Cmd+Shift+I`
   - Windows/Linux: `Ctrl+Shift+I`
   - Or: View → Chat

2. **Use @mcp participant**
   ```
   @mcp hello, what can you help me with?
   @mcp what tools are available?
   @mcp analyze this code
   ```

3. **Access company tools**
   - All tools come from your company registry
   - No external MCP servers allowed

### Available Commands

Access via Command Palette (`Cmd+Shift+P`):

- **MCP Registry: Reload Tools** - Refresh tools from registry
- **MCP Registry: Show Available Tools** - List all tools
- **MCP Registry: Configure URL** - View registry URL (locked)

### Chat Commands

In the chat panel:
```
@mcp /reload    # Reload tools from registry
@mcp /tools     # Show available tools
```

---

## Deployment Guide

### For Extension Maintainers

#### Step 1: Configure Registry URL

Edit `extension.js` line 7:

```javascript
// For local development
const REGISTRY_URL = 'http://localhost:8080/v0.1/servers';

// For production
const REGISTRY_URL = 'http://ocp4.xyzcompany:8080/v0.1/servers';
```

#### Step 2: Build Deployment Package

**Standard Deployment:**
```bash
./build-deployment.sh
```

This creates `deployment/` folder with:
- `mcp-registry-chat-1.0.0.vsix` - Extension package
- `install.sh` - Installation script
- `README.md` - User documentation

**Automated Deployment:**
```bash
./build-automated.sh
```

This creates `auto-deployment/` folder with:
- `mcp-registry-chat-1.0.0.vsix` - Extension package
- `auto-install.sh` - Fully automated installer
- `ONE-LINE-INSTALL.txt` - Copy-paste instructions

#### Step 3: Distribute to Developers

**Option A: Internal File Server**
```bash
# Upload to web server
scp -r deployment/ user@fileserver:/var/www/downloads/mcp-extension/

# Share link with team
http://fileserver/downloads/mcp-extension/install.sh
```

**Option B: Email/Slack**
```bash
# Create archive
tar -czf mcp-extension.tar.gz deployment/

# Attach to email or upload to Slack
```

**Option C: Company Wiki/Confluence**
- Upload deployment files
- Add instructions from this README
- Share documentation link

#### Step 4: Communicate to Team

**Email Template:**
```
Subject: New Tool: MCP Registry Extension for VS Code

Hi Team,

We've deployed an extension that gives you access to company-approved AI tools through GitHub Copilot.

Quick Install:
  curl -fsSL http://server/mcp-extension/auto-install.sh | bash

Then restart VS Code and use @mcp in chat!

Documentation: http://wiki.company.com/mcp-extension
Support: devtools@company.com
```

---

## Configuration

### Registry URL

**Locked to company registry** - cannot be changed by users.

Current registry: See `extension.js` line 7

### Security Policy

Automatically enforces:
```json
{
  "mcp.servers": {},                          // No custom servers
  "github.copilot.chat.mcp.enabled": false,   // No Copilot MCP
  "chat.mcp.gallery.enabled": false           // No MCP gallery
}
```

These settings are reset if users try to change them.

### Workspace Settings

For project-specific policies, add to `.vscode/settings.json`:

```json
{
  "mcp.servers": {},
  "chat.mcp.gallery.enabled": false
}
```

Commit this to version control.

---

## Troubleshooting

### Extension Not Showing

**Problem:** `@mcp` doesn't appear in chat

**Solutions:**
1. Verify GitHub Copilot is installed:
   ```bash
   code --list-extensions | grep github.copilot
   ```
   
2. Check extension is installed:
   ```bash
   code --list-extensions | grep mcp-registry-chat
   ```

3. Restart VS Code completely (close all windows)

4. Check Output panel: View → Output → Extension Host

### Cannot Connect to Registry

**Problem:** "Cannot connect to registry" error

**Solutions:**
1. Verify registry is running:
   ```bash
   curl http://your-registry-url/v0.1/servers
   ```

2. Check network connection (VPN if required)

3. Verify registry URL in extension code

4. Check firewall settings

### Code Command Not Found

**Problem:** `./install.sh` fails with "code: command not found"

**Solutions:**

1. Install via VS Code:
   - Open VS Code
   - `Cmd+Shift+P` → "Shell Command: Install 'code' command in PATH"

2. Or add to PATH manually:
   ```bash
   echo 'export PATH="/Applications/Visual Studio Code.app/Contents/Resources/app/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

### Extension Not Auto-Loading

**Problem:** Need to press F5 to use extension

**Solution:** You're in development mode. Install the extension:
```bash
code --install-extension mcp-registry-chat-1.0.0.vsix
```

Then restart VS Code normally (not F5).

### Settings Keep Resetting

**This is intentional!** The extension enforces company policy by resetting:
- `mcp.servers`
- `chat.mcp.gallery.enabled`
- `github.copilot.chat.mcp.enabled`

This prevents use of unauthorized MCP servers.

---

## Development

### Project Structure

```
mcp-registry-vscode/
├── extension.js              # Main extension code
├── package.json              # Extension manifest
├── build-deployment.sh       # Build standard deployment
├── build-automated.sh        # Build automated deployment
└── README.md                 # This file
```

### Local Development

**Initial Setup:**
```bash
# Clone repository
git clone <your-repo>
cd mcp-registry-vscode

# Test in development mode
code .
# Press F5 to launch Extension Development Host
```

**Making Changes:**

1. Edit `extension.js`
2. Press F5 to test
3. When ready to deploy:
   ```bash
   ./build-deployment.sh
   ```

**Installing Locally:**
```bash
# Package extension
vsce package

# Install for permanent use
code --install-extension mcp-registry-chat-1.0.0.vsix

# Restart VS Code (not F5)
```

### Testing

**Manual Testing:**
1. Install extension locally
2. Open VS Code
3. `Cmd+Shift+I` → Chat
4. Type `@mcp hello`
5. Verify tools from registry are available

**Verify Security:**
1. Try adding to settings:
   ```json
   {"chat.mcp.gallery.enabled": true}
   ```
2. Should show warning and reset to `false`

**Registry Connection:**
```bash
# Test registry endpoint
curl http://localhost:8080/v0.1/servers

# Should return JSON with servers
```

### Building

**Standard Build:**
```bash
vsce package
```

**With Custom Registry URL:**
```bash
# Edit extension.js first
sed -i '' 's|localhost:8080|ocp4.xyzcompany:8080|g' extension.js
vsce package
```

### Versioning

Update version in `package.json`:
```json
{
  "version": "1.0.1"
}
```

Then rebuild:
```bash
vsce package
```

---

## Security

### What's Locked

✅ **Registry URL** - Hard-coded, cannot be changed by users  
✅ **MCP Gallery** - Disabled, cannot browse external servers  
✅ **Native MCP** - Disabled, cannot add custom servers  
✅ **Settings** - Auto-reset if users try to modify  

### What's Allowed

✅ Use `@mcp` with company registry tools  
✅ Reload registry tools  
✅ View available tools  
✅ Normal Copilot chat functionality  

### Monitoring

Extension logs to VS Code Output panel:
- Registry connection status
- Tool loading events
- Security policy enforcement
- User attempts to modify settings

View logs: View → Output → Extension Host

### Reporting Issues

If users attempt to bypass security:
1. Extension logs the attempt
2. Settings are automatically reset
3. Warning message is shown

To report security concerns: security@company.com

---

## FAQ

### Do I need an Anthropic API key?

No! The extension uses GitHub Copilot, which you already have.

### Can I use other MCP servers?

No. Only the company registry is allowed. This ensures security and consistency.

### How do I add a new tool?

Contact your DevTools team to request tools be added to the company registry.

### Does this work offline?

The extension needs network access to connect to the registry. If the registry is unreachable, the extension will show an error but won't crash VS Code.

### Can I use this with Claude Desktop?

This extension is VS Code only. Claude Desktop MCP is separate.

### How much does this cost?

Nothing beyond your existing GitHub Copilot subscription.

### What data is collected?

The extension only connects to your company registry. No external telemetry is sent.

---

## Support

### Internal Support

- **Email:** devtools@company.com
- **Slack:** #dev-tools
- **Wiki:** http://wiki.company.com/mcp-extension

### GitHub Issues

For bugs or feature requests:  
https://github.com/your-company/mcp-registry-vscode/issues

### Registry Status

Check registry health:
```bash
curl http://your-registry-url/v0.1/servers
```

---

## License

Internal use only - Company Proprietary

---

## Changelog

### Version 1.0.0 (2024-12-07)

- ✨ Initial release
- 🔒 Secure connection to company MCP registry
- 🚫 Blocks external MCP servers and gallery
- 💬 `@mcp` chat participant
- ⚡ Auto-loads on VS Code startup
- 🛠️ Command palette integration

---

## Credits

Built with:
- [VS Code Extension API](https://code.visualstudio.com/api)
- [GitHub Copilot](https://github.com/features/copilot)
- [Model Context Protocol](https://modelcontextprotocol.io)

Maintained by: DevTools Team

---

**Questions?** Contact devtools@company.com