#!/bin/bash
set -e

echo "📦 Building Automated MCP Extension Installer..."

# Configuration - CHANGE THIS
REGISTRY_URL="http://localhost:8080/v0.1/servers"
# For production: REGISTRY_URL="http://ocp4.xyzcompany:8080/v0.1/servers"

# Update extension.js
sed -i.bak "s|const REGISTRY_URL = .*|const REGISTRY_URL = '$REGISTRY_URL';|" extension.js

# Install vsce
if ! command -v vsce &> /dev/null; then
    echo "Installing vsce..."
    npm install -g @vsce/vsce
fi

# Package
echo "Packaging extension..."
vsce package --no-git-tag-version

# Create automated deployment
rm -rf auto-deployment
mkdir -p auto-deployment
cp mcp-registry-chat-*.vsix auto-deployment/

# Create fully automated installer
cat > auto-deployment/auto-install.sh << 'AUTOINSTALL'
#!/bin/bash
set -e

echo "🤖 Automated MCP Extension Installer"
echo "===================================="
echo ""

# Auto-install code command
echo "Installing 'code' command..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CODE_BIN="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
    
    if [ -f "$CODE_BIN" ]; then
        # Add to PATH via profile
        SHELL_RC="$HOME/.zshrc"
        if [ ! -f "$SHELL_RC" ]; then
            SHELL_RC="$HOME/.bash_profile"
        fi
        
        # Add to PATH if not already there
        if ! grep -q "Visual Studio Code" "$SHELL_RC" 2>/dev/null; then
            echo 'export PATH="/Applications/Visual Studio Code.app/Contents/Resources/app/bin:$PATH"' >> "$SHELL_RC"
        fi
        
        # Use full path for this script
        alias code="$CODE_BIN"
        CODE_CMD="$CODE_BIN"
    else
        echo "❌ VS Code not found. Please install VS Code first."
        exit 1
    fi
else
    # Linux
    CODE_CMD="code"
    if ! command -v code &> /dev/null; then
        echo "❌ VS Code not found. Please install VS Code first."
        exit 1
    fi
fi

echo "✅ VS Code found"
echo ""

# Check Copilot
echo "Checking GitHub Copilot..."
if ! $CODE_CMD --list-extensions 2>/dev/null | grep -q "github.copilot"; then
    echo "⚠️  GitHub Copilot not installed"
    echo "Installing will continue, but you need Copilot for @mcp to work"
    echo ""
    echo "Install Copilot:"
    echo "  1. Open VS Code"
    echo "  2. Extensions → Search 'GitHub Copilot'"
    echo "  3. Install both 'GitHub Copilot' and 'GitHub Copilot Chat'"
    echo ""
    read -p "Press Enter to continue anyway..."
else
    echo "✅ GitHub Copilot installed"
fi
echo ""

# Install extension
echo "Installing MCP extension..."
$CODE_CMD --install-extension mcp-registry-chat-*.vsix --force 2>/dev/null
echo "✅ Extension installed"
echo ""

# Apply settings
echo "Applying security policy..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    SETTINGS="$HOME/Library/Application Support/Code/User/settings.json"
else
    SETTINGS="$HOME/.config/Code/User/settings.json"
fi

mkdir -p "$(dirname "$SETTINGS")"

# Backup settings
if [ -f "$SETTINGS" ]; then
    cp "$SETTINGS" "$SETTINGS.backup-$(date +%Y%m%d-%H%M%S)"
fi

# Apply policy
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

echo "✅ Policy applied"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Installation Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "IMPORTANT: Restart your terminal/shell to use 'code' command"
echo ""
echo "Then:"
echo "  1. Restart VS Code"
echo "  2. Open Chat: Cmd+Shift+I"
echo "  3. Type: @mcp hello"
echo ""
AUTOINSTALL

chmod +x auto-deployment/auto-install.sh

# Create one-liner installer instructions
cat > auto-deployment/ONE-LINE-INSTALL.txt << 'ONELINE'
# One-Line Installation

Copy and paste this into your terminal:

    curl -fsSL YOUR_SERVER_URL/auto-install.sh | bash

Or download and run:

    curl -O YOUR_SERVER_URL/auto-install.sh && chmod +x auto-install.sh && ./auto-install.sh

---

Replace YOUR_SERVER_URL with your actual server URL, for example:
- http://fileserver.company.com/mcp-extension
- https://downloads.company.com/tools/mcp
ONELINE

echo ""
echo "✅ Automated deployment created in ./auto-deployment/"
echo ""
echo "Files:"
ls -lh auto-deployment/
echo ""
echo "📤 Next Steps:"
echo ""
echo "1. Upload to web server:"
echo "   scp -r auto-deployment/ user@server:/var/www/html/mcp-extension/"
echo ""
echo "2. Share with team:"
echo "   curl -fsSL http://server/mcp-extension/auto-install.sh | bash"
echo ""