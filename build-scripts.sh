#!/bin/bash
set -e

echo "📦 Building MCP Extension Deployment Package..."

# Configuration - CHANGE THIS to your registry URL
REGISTRY_URL="http://localhost:8080/v0.1/servers"
# For production use: REGISTRY_URL="http://ocp4.xyzcompany:8080/v0.1/servers"

# Update extension.js with registry URL
sed -i.bak "s|const REGISTRY_URL = .*|const REGISTRY_URL = '$REGISTRY_URL';|" extension.js

# Install vsce if needed
if ! command -v vsce &> /dev/null; then
    echo "Installing vsce..."
    npm install -g @vsce/vsce
fi

# Package extension
echo "Packaging extension..."
vsce package --no-git-tag-version

# Create deployment folder
rm -rf deployment
mkdir -p deployment
cp mcp-registry-chat-*.vsix deployment/

# Create install script
cat > deployment/install.sh << 'INSTALL'
#!/bin/bash
set -e

echo "🚀 Installing MCP Registry Extension..."
echo ""

# Step 1: Install code command
echo "Step 1: Setting up 'code' command..."
if ! command -v code &> /dev/null; then
    echo "Please install 'code' command:"
    echo "  1. Open VS Code"
    echo "  2. Press Cmd+Shift+P"
    echo "  3. Type: Shell Command: Install 'code' command in PATH"
    echo "  4. Press Enter"
    echo ""
    read -p "Press Enter after installing 'code' command..."
fi

# Verify code command
if ! command -v code &> /dev/null; then
    echo "❌ 'code' command still not found. Please install it first."
    exit 1
fi

echo "✅ 'code' command is available"
echo ""

# Step 2: Check Copilot
echo "Step 2: Checking GitHub Copilot..."
if ! code --list-extensions | grep -q "github.copilot"; then
    echo "❌ GitHub Copilot not installed"
    echo "Please install GitHub Copilot first:"
    echo "  1. Open VS Code"
    echo "  2. Go to Extensions (Cmd+Shift+X)"
    echo "  3. Search 'GitHub Copilot'"
    echo "  4. Install both 'GitHub Copilot' and 'GitHub Copilot Chat'"
    exit 1
fi
echo "✅ GitHub Copilot is installed"
echo ""

# Step 3: Install extension
echo "Step 3: Installing MCP extension..."
code --install-extension mcp-registry-chat-*.vsix --force
echo "✅ Extension installed"
echo ""

# Step 4: Apply lockdown
echo "Step 4: Applying security policy..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    SETTINGS="$HOME/Library/Application Support/Code/User/settings.json"
else
    SETTINGS="$HOME/.config/Code/User/settings.json"
fi

mkdir -p "$(dirname "$SETTINGS")"

python3 - "$SETTINGS" << 'PYTHON'
import json, sys, os
f = sys.argv[1]
s = json.load(open(f)) if os.path.exists(f) else {}
s.update({
    "mcp.servers": {},
    "github.copilot.chat.mcp.enabled": False,
    "chat.mcp.gallery.enabled": False
})
json.dump(s, open(f, 'w'), indent=2)
PYTHON

echo "✅ Security policy applied"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Installation Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next Steps:"
echo "  1. Restart VS Code"
echo "  2. Open Chat: Cmd+Shift+I"
echo "  3. Type: @mcp hello"
echo ""
INSTALL

chmod +x deployment/install.sh

# Create README
cat > deployment/README.md << 'README'
# MCP Registry Extension - Quick Install

## Install

```bash
./install.sh
```

Then restart VS Code.

## Usage

1. Open Chat: `Cmd+Shift+I` (Mac) or `Ctrl+Shift+I` (Windows/Linux)
2. Type: `@mcp your message`
3. Access company-approved MCP tools

## Troubleshooting

**Extension not showing?**
- Make sure GitHub Copilot is installed
- Restart VS Code completely
- Check: View → Output → Extension Host

**Can't connect to registry?**
- Verify registry is running
- Check network/VPN connection

## Uninstall

```bash
code --uninstall-extension mcp-registry-chat
```
README

echo ""
echo "✅ Deployment package created in ./deployment/"
echo ""
echo "Files:"
ls -lh deployment/
echo ""
echo "📤 Next: Distribute the deployment folder to developers"
echo ""
echo "Distribution options:"
echo "  1. Upload to file server: scp -r deployment/ user@server:/downloads/"
echo "  2. Create archive: tar -czf mcp-extension.tar.gz deployment/"
echo "  3. Share via email/Slack"
echo ""