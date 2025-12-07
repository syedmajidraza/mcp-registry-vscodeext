// extension.js - VS Code Extension for MCP Registry Integration
const vscode = require('vscode');

let mcpTools = [];
let registryUrl = 'http://localhost:8080/v0.1/servers';

/**
 * Activate the extension
 */
async function activate(context) {
    console.log('MCP Registry Extension is now active');

    // Load tools from registry on activation
    await loadMCPRegistry();

    // Register chat participant FIRST before enforcing policy
    const participant = vscode.chat.createChatParticipant('mcp-registry', async (request, context, stream, token) => {
        try {
            // Show which tools are available
            if (mcpTools.length > 0) {
                stream.markdown(`🛠️ *Using ${mcpTools.length} MCP tools: ${mcpTools.map(t => t.name).join(', ')}*\n\n`);
            }

            // Get available language models
            const models = await vscode.lm.selectChatModels({
                vendor: 'copilot',
                family: 'gpt-4'
            });

            if (models.length === 0) {
                stream.markdown('❌ No language model available. Make sure GitHub Copilot is enabled.');
                return;
            }

            const model = models[0];

            // Build messages from history
            const messages = [
                vscode.LanguageModelChatMessage.User(`You have access to the following MCP tools: ${JSON.stringify(mcpTools, null, 2)}`)
            ];

            // Add conversation history
            for (const historyItem of context.history) {
                if (historyItem instanceof vscode.ChatRequestTurn) {
                    messages.push(vscode.LanguageModelChatMessage.User(historyItem.prompt));
                } else if (historyItem instanceof vscode.ChatResponseTurn) {
                    const text = historyItem.response.map(r => 
                        r instanceof vscode.ChatResponseMarkdownPart ? r.value.value : ''
                    ).join('');
                    messages.push(vscode.LanguageModelChatMessage.Assistant(text));
                }
            }

            // Add current user message
            messages.push(vscode.LanguageModelChatMessage.User(request.prompt));

            // Send request to language model
            const chatRequest = await model.sendRequest(messages, {}, token);

            // Stream the response
            for await (const fragment of chatRequest.text) {
                stream.markdown(fragment);
            }

        } catch (error) {
            if (error instanceof vscode.LanguageModelError) {
                if (error.code === vscode.LanguageModelError.NotFound) {
                    stream.markdown('❌ Language model not found. Please enable GitHub Copilot.');
                } else if (error.code === vscode.LanguageModelError.Blocked) {
                    stream.markdown('❌ Request blocked due to content filtering.');
                } else {
                    stream.markdown(`❌ Language model error: ${error.message}`);
                }
            } else {
                stream.markdown(`❌ Error: ${error.message}`);
            }
        }
    });

    // Set participant metadata
    participant.iconPath = new vscode.ThemeIcon('server-process');

    // Command to reload registry
    let reloadCommand = vscode.commands.registerCommand('mcp-registry.reload', async () => {
        await loadMCPRegistry();
        vscode.window.showInformationMessage(`MCP Registry reloaded. Found ${mcpTools.length} tools.`);
    });

    // Command to configure registry URL - DISABLED for security
    // Users cannot change the registry URL
    let configureCommand = vscode.commands.registerCommand('mcp-registry.configure', async () => {
        vscode.window.showWarningMessage(
            'Registry URL is locked to your organization\'s MCP registry for security reasons.'
        );
    });

    // Command to show available tools
    let showToolsCommand = vscode.commands.registerCommand('mcp-registry.showTools', async () => {
        if (mcpTools.length === 0) {
            vscode.window.showInformationMessage('No MCP tools loaded. Check your registry connection.');
        } else {
            const toolList = mcpTools.map(t => `• ${t.name}: ${t.description}`).join('\n');
            vscode.window.showInformationMessage(`Available MCP Tools:\n${toolList}`, { modal: true });
        }
    });

    context.subscriptions.push(participant, reloadCommand, configureCommand, showToolsCommand);
}

/**
 * Enforce MCP policy - disable native VS Code MCP servers
 */
async function enforceMCPPolicy() {
    try {
        const config = vscode.workspace.getConfiguration();
        
        // Disable ALL native MCP functionality
        await config.update('mcp.enabled', false, vscode.ConfigurationTarget.Global);
        await config.update('mcp.servers', {}, vscode.ConfigurationTarget.Global);
        await config.update('github.copilot.chat.mcp.enabled', false, vscode.ConfigurationTarget.Global);
        
        // Disable MCP gallery (the setting developers can add)
        await config.update('chat.mcp.gallery.enabled', false, vscode.ConfigurationTarget.Global);
        
        // Also disable in workspace settings
        await config.update('mcp.enabled', false, vscode.ConfigurationTarget.Workspace);
        await config.update('mcp.servers', {}, vscode.ConfigurationTarget.Workspace);
        await config.update('chat.mcp.gallery.enabled', false, vscode.ConfigurationTarget.Workspace);
        
        console.log('✅ MCP policy enforced - native MCP and gallery disabled');
    } catch (error) {
        console.error('Failed to enforce MCP policy:', error);
    }
}

/**
 * Load tools from MCP registry
 */
async function loadMCPRegistry() {
    try {
        // LOCKED: Always use this registry URL - users cannot change it
        registryUrl = 'http://localhost:8080/v0.1/servers';
        // Ignore user configuration to enforce this registry only

        const https = require('https');
        const http = require('http');
        const url = require('url');

        const parsedUrl = url.parse(registryUrl);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;

        const response = await new Promise((resolve, reject) => {
            const req = protocol.get(registryUrl, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Invalid JSON response from registry'));
                    }
                });
            });
            req.on('error', reject);
            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Registry request timeout'));
            });
        });

        // Transform registry servers into tool descriptions
        mcpTools = response.servers.map(item => {
            const server = item.server;
            return {
                name: server.name,
                description: server.description || `Tools from ${server.name}`,
                repository: server.repository?.url || 'Unknown',
                version: server.version || 'Unknown'
            };
        });

        console.log(`✅ Loaded ${mcpTools.length} tools from MCP registry`);
        
        // Show notification on first load
        if (mcpTools.length > 0) {
            vscode.window.showInformationMessage(
                `MCP Registry connected! Found ${mcpTools.length} server(s).`
            );
        }
    } catch (error) {
        console.error('❌ Failed to load MCP registry:', error);
        vscode.window.showWarningMessage(
            `Failed to connect to MCP registry: ${error.message}. Chat will work without MCP tools.`
        );
        mcpTools = [];
    }
}

function deactivate() {
    console.log('MCP Registry Extension deactivated');
}

module.exports = {
    activate,
    deactivate
};