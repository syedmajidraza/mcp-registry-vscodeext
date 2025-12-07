#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🚀 Setting up MCP Registry Extension (Local Development)"
echo "========================================================"
echo ""

# VS Code executable path
VSCODE="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"

# Check if VS Code exists
if [ ! -f "$VSCODE" ]; then
    echo "❌ VS Code not found at expected location"
    echo "Please install VS Code or modify the VSCODE path in this script"
    exit 1
fi

# Check if in correct directory
if [ ! -f "package.json" ] || [ ! -f "extension.js" ]; then
    echo "❌ Error: Run this script from the mcp-registry-vscode directory"
    exit 1
fi

# Check if registry is running
echo -e "${YELLOW}Checking if MCP registry is running...${NC}"
if curl -f -s http://localhost:8080/v0.1/servers > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Registry is accessible at localhost:8080${NC}"
else
    echo "⚠️  Warning: Registry not accessible at localhost:8080"
    echo "   Make sure to start your registry before using the extension"
fi

# Install vsce if needed
if ! command -v vsce &> /dev/null; then
    echo ""
    echo -e "${YELLOW}Installing vsce...${NC}"
    npm install -g @vsce/vsce
    echo -e "${GREEN}✅ vsce installed${NC}"
fi

# Uninstall old version if exists
echo ""
echo -e "${YELLOW}Removing old version (if exists)...${NC}"
"$VSCODE" --uninstall-extension mcp-registry-chat 2>/dev/null || true

# Package extension
echo ""
echo -e "${YELLOW}Packaging extension...${NC}"
vsce package --no-git-tag-version

# Install extension
echo ""
echo -e "${YELLOW}Installing extension in VS Code...${NC}"
"$VSCODE" --install-extension mcp-registry-chat-*.vsix --force

# Apply settings lockdown
echo ""
echo -e "${YELLOW}Applying MCP lockdown policy...${NC}"

SETTINGS_PATH="$HOME/Library/Application Support/Code/User/settings.json"

# Create settings directory if it doesn't exist
mkdir -p "$(dirname "$SETTINGS_PATH")"

# Backup existing settings
if [ -f "$SETTINGS_PATH" ]; then
    cp "$SETTINGS_PATH" "$SETTINGS_PATH.backup-$(date +%Y%m%d-%H%M%S)"
fi

# Apply lockdown using Python
python3 - "$SETTINGS_PATH" << 'PYTHON'
import json
import sys
import os

settings_file = sys.argv[1]

# Load existing settings
if os.path.exists(settings_file):
    try:
        with open(settings_file, 'r') as f:
            settings = json.load(f)
    except:
        settings = {}
else:
    settings = {}

# Apply MCP lockdown
settings.update({
    "mcp.servers": {},
    "github.copilot.chat.mcp.enabled": False,
    "chat.mcp.gallery.enabled": False
})

# Save
with open(settings_file, 'w') as f:
    json.dump(settings, f, indent=2)
PYTHON

echo -e "${GREEN}✅ Settings locked down${NC}"

# Verify installation
echo ""
echo -e "${YELLOW}Verifying installation...${NC}"
if "$VSCODE" --list-extensions | grep -q "mcp-registry-chat"; then
    echo -e "${GREEN}✅ Extension is installed${NC}"
else
    echo "❌ Extension installation failed"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next Steps:"
echo "  1. Start your MCP registry (if not already running):"
echo "     cd /path/to/registry && npm start"
echo ""
echo "  2. Restart VS Code (close all windows)"
echo ""
echo "  3. Open VS Code and test:"
echo "     - Open Chat: Cmd+Shift+I"
echo "     - Type: @mcp hello"
echo ""
echo "Extension will auto-load every time you open VS Code!"
echo ""
