#!/bin/bash

echo "Testing MCP Extension Auto-Load..."
echo ""

# Check if registry is running
if curl -s http://localhost:8080/v0.1/servers > /dev/null; then
    echo "✅ MCP Registry is running"
else
    echo "❌ MCP Registry is NOT running"
    echo "   Start it with: cd /path/to/registry && npm start"
fi

# Check if extension is installed
if code --list-extensions | grep -q "mcp-registry-chat"; then
    echo "✅ Extension is installed"
else
    echo "❌ Extension is NOT installed"
    echo "   Run: ./setup-mcp-extension-local.sh"
fi

echo ""
echo "Now open VS Code normally (not F5) and test @mcp in chat!"
