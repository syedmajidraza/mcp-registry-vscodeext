// extension.js - VS Code Extension for MCP Registry Integration
// Pure MCP-based solution - Uses MCP servers for all operations including database
const vscode = require('vscode');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const http = require('http');

let mcpTools = [];
let mcpServerProcesses = new Map(); // Track running MCP server processes
const REGISTRY_URL = 'http://localhost:8080/v0.1/servers';
const MCP_SERVERS_DIR = path.join(os.homedir(), 'mcp-servers');

// MCP Server configurations
const MCP_SERVER_PORTS = {
    'io.github.antonorlov/mcp-postgres-server': 3001,
    'io.github.mirza-glitch/markitdown-js': 3002,
    'io.github.dead8309/markitdown-ts': 3003
};

/**
 * Activate the extension
 */
async function activate(context) {
    console.log('MCP Registry Extension is now active (Pure MCP Mode)');
    console.log(`Connecting to registry: ${REGISTRY_URL}`);

    // Ensure MCP servers directory exists
    await ensureMCPDirectory();

    // Load tools from registry on activation
    await loadMCPRegistry();

    // Register chat participant with slash commands
    const participant = vscode.chat.createChatParticipant('mcp-registry', async (request, context, stream, token) => {
        try {
            const prompt = request.prompt.trim();
            const promptLower = prompt.toLowerCase();

            console.log('=== MCP CHAT REQUEST ===');
            console.log('Original prompt:', prompt);
            
            // ===== DATABASE COMMANDS via MCP =====
            if (promptLower.startsWith('db ') || prompt.startsWith('/db ')) {
                await handleDatabaseCommandViaMCP(prompt, stream);
                return;
            }
            
            // ===== PRIORITY: SLASH COMMANDS FIRST =====
            if (prompt.startsWith('/')) {
                const command = prompt.slice(1).trim().toLowerCase();
                console.log('🎯 SLASH COMMAND:', command);
                
                if (command === 'list' || command === 'ls' || command === 'servers') {
                    await handleListCommand(stream);
                    return;
                }
                
                if (command === 'status' || command === 'installed') {
                    await handleStatusCommand(stream);
                    return;
                }
                
                if (command.startsWith('install ')) {
                    const serverName = command.replace('install ', '').trim();
                    await handleInstallCommand(serverName, stream);
                    return;
                }
                
                if (command === 'install-all' || command === 'installall' || command === 'install all') {
                    await handleInstallAllCommand(stream);
                    return;
                }
                
                if (command.startsWith('start ')) {
                    const serverName = command.replace('start ', '').trim();
                    await handleStartCommand(serverName, stream);
                    return;
                }
                
                if (command === 'start-all' || command === 'startall' || command === 'start all') {
                    await handleStartAllCommand(stream);
                    return;
                }
                
                if (command.startsWith('stop ')) {
                    const serverName = command.replace('stop ', '').trim();
                    await handleStopCommand(serverName, stream);
                    return;
                }
                
                if (command === 'stop-all' || command === 'stopall' || command === 'stop all') {
                    await handleStopAllCommand(stream);
                    return;
                }
                
                if (command.startsWith('uninstall ') || command.startsWith('remove ')) {
                    const serverName = command.replace(/^(uninstall|remove)\s+/, '').trim();
                    await handleUninstallCommand(serverName, stream);
                    return;
                }
                
                if (command === 'help' || command === '?' || command === 'commands') {
                    await handleHelpCommand(stream);
                    return;
                }
                
                stream.markdown(`❌ Unknown command: \`/${command}\`\n\n`);
                stream.markdown(`Type \`@mcp /help\` for available commands.`);
                return;
            }
            
            // ===== NON-SLASH COMMANDS =====
            if (promptLower === 'list' || promptLower === 'servers' || promptLower === 'ls') {
                await handleListCommand(stream);
                return;
            }
            
            if (promptLower === 'status' || promptLower === 'installed') {
                await handleStatusCommand(stream);
                return;
            }
            
            if (promptLower === 'help' || promptLower === 'commands' || promptLower === '?') {
                await handleHelpCommand(stream);
                return;
            }

            // Send to Copilot with MCP context
            if (mcpTools.length > 0) {
                stream.markdown(`🛠️ *Using ${mcpTools.length} MCP tools from company registry*\n\n`);
            }

            const models = await vscode.lm.selectChatModels({
                vendor: 'copilot',
                family: 'gpt-4'
            });

            if (!models || models.length === 0) {
                stream.markdown('❌ No language models available. Please ensure GitHub Copilot is active.');
                return;
            }

            const model = models[0];

            let systemPrompt = 'You are a helpful AI assistant integrated with company-approved MCP tools.\n\n';
            
            if (mcpTools.length > 0) {
                systemPrompt += 'Available MCP Tools:\n';
                mcpTools.forEach(tool => {
                    systemPrompt += `- ${tool.name}: ${tool.description}\n`;
                });
                systemPrompt += '\nUse these tools when relevant to help the user.\n\n';
            }

            const messages = [
                vscode.LanguageModelChatMessage.User(systemPrompt),
                vscode.LanguageModelChatMessage.User(prompt)
            ];

            const chatResponse = await model.sendRequest(messages, {}, token);

            for await (const fragment of chatResponse.text) {
                stream.markdown(fragment);
            }

        } catch (error) {
            console.error('Chat participant error:', error);
            stream.markdown(`❌ Error: ${error.message}`);
        }
    });

    participant.iconPath = vscode.Uri.file(path.join(__dirname, 'icon.png'));

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('mcp-registry.reload', async () => {
            await loadMCPRegistry();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('mcp-registry.showTools', async () => {
            const toolList = mcpTools.map(t => `${t.name} (${t.version}): ${t.description}`).join('\n');
            vscode.window.showInformationMessage(
                `Available MCP Tools:\n\n${toolList || 'No tools loaded'}`,
                { modal: true }
            );
        })
    );

    // Enforce policy on startup
    await enforceMCPPolicy();
}

// ============================================
// DATABASE COMMANDS VIA MCP SERVER
// ============================================

/**
 * Handle database commands via MCP PostgreSQL server
 */
async function handleDatabaseCommandViaMCP(prompt, stream) {
    const command = prompt.replace(/^\/?(db|database)\s+/i, '').trim();
    const cmdLower = command.toLowerCase();

    stream.markdown(`## 🗄️ PostgreSQL Database (via MCP Server)\n\n`);

    // Check if postgres MCP server is installed
    const postgresServer = mcpTools.find(t => t.name === 'io.github.antonorlov/mcp-postgres-server');
    if (!postgresServer) {
        stream.markdown(`❌ PostgreSQL MCP server not found in registry.\n\n`);
        stream.markdown(`Please ensure your registry includes the PostgreSQL MCP server.\n`);
        return;
    }

    const serverDir = path.join(MCP_SERVERS_DIR, postgresServer.name.replace(/\//g, '-'));
    const isInstalled = await checkIfInstalled(serverDir);

    if (!isInstalled) {
        stream.markdown(`⚠️  PostgreSQL MCP server is not installed.\n\n`);
        stream.markdown(`Install it with: \`@mcp install ${postgresServer.name}\`\n`);
        return;
    }

    // Check if server is running
    const isRunning = mcpServerProcesses.has(postgresServer.name);
    if (!isRunning) {
        stream.markdown(`⚠️  PostgreSQL MCP server is not running.\n\n`);
        stream.markdown(`Start it with: \`@mcp start ${postgresServer.name}\`\n`);
        return;
    }

    // Configure command
    if (cmdLower.startsWith('configure ')) {
        const configString = command.substring(10).trim();
        await handleMCPDbConfigure(postgresServer.name, configString, stream);
        return;
    }

    // Query command
    if (cmdLower.startsWith('query ') || cmdLower.startsWith('select ') || 
        cmdLower.startsWith('insert ') || cmdLower.startsWith('update ') || 
        cmdLower.startsWith('delete ')) {
        const query = command.replace(/^query\s+/i, '').trim();
        await handleMCPDbQuery(postgresServer.name, query, stream);
        return;
    }

    // List tables
    if (cmdLower === 'tables' || cmdLower === 'show tables') {
        await handleMCPDbListTables(postgresServer.name, stream);
        return;
    }

    // Describe table
    if (cmdLower.startsWith('describe ') || cmdLower.startsWith('desc ')) {
        const tableName = command.substring(cmdLower.startsWith('describe ') ? 9 : 5).trim();
        await handleMCPDbDescribe(postgresServer.name, tableName, stream);
        return;
    }

    // Help
    if (cmdLower === 'help' || cmdLower === '?') {
        await handleMCPDbHelp(stream);
        return;
    }

    stream.markdown(`❌ Unknown database command: \`${command}\`\n\n`);
    stream.markdown(`Type \`@mcp db help\` for available commands.\n`);
}

/**
 * Configure MCP PostgreSQL server
 */
async function handleMCPDbConfigure(serverName, configString, stream) {
    try {
        stream.markdown(`⚙️  Configuring MCP PostgreSQL server...\n\n`);

        // Parse connection string: postgresql://user:pass@host:port/database
        const match = configString.match(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
        
        if (!match) {
            stream.markdown(`❌ Invalid connection string format.\n\n`);
            stream.markdown(`Expected: \`postgresql://user:password@host:port/database\`\n`);
            stream.markdown(`Example: \`postgresql://postgres:postgres@localhost:5431/Adventureworks\`\n`);
            return;
        }

        const [, user, password, host, port, database] = match;

        // Create configuration file for MCP server
        const serverDir = path.join(MCP_SERVERS_DIR, serverName.replace(/\//g, '-'));
        const configPath = path.join(serverDir, '.mcp-config.json');

        const config = {
            host,
            port: parseInt(port),
            database,
            user,
            password
        };

        await fs.writeFile(configPath, JSON.stringify(config, null, 2));

        stream.markdown(`✅ **Configuration saved!**\n\n`);
        stream.markdown(`📍 **Database Configuration:**\n`);
        stream.markdown(`- Database: \`${database}\`\n`);
        stream.markdown(`- Host: \`${host}:${port}\`\n`);
        stream.markdown(`- User: \`${user}\`\n\n`);
        stream.markdown(`🔄 Please restart the MCP server:\n`);
        stream.markdown(`\`@mcp stop ${serverName}\`\n`);
        stream.markdown(`\`@mcp start ${serverName}\`\n`);

        vscode.window.showInformationMessage('PostgreSQL MCP server configured');

    } catch (error) {
        stream.markdown(`❌ Configuration failed: ${error.message}\n`);
    }
}

/**
 * Execute query via MCP server
 */
async function handleMCPDbQuery(serverName, query, stream) {
    try {
        stream.markdown(`### 🔍 Executing Query via MCP\n\n`);
        stream.markdown(`\`\`\`sql\n${query}\n\`\`\`\n\n`);

        const port = MCP_SERVER_PORTS[serverName] || 3001;
        
        // Call MCP server's query endpoint
        const result = await mcpServerRequest(port, {
            method: 'tools/call',
            params: {
                name: 'query',
                arguments: { sql: query }
            }
        });

        if (result.error) {
            stream.markdown(`❌ **Query failed**\n\n`);
            stream.markdown(`**Error:** ${result.error.message}\n`);
            return;
        }

        const data = result.result;

        if (data.rows && data.rows.length > 0) {
            stream.markdown(`✅ **Query successful**\n\n`);
            stream.markdown(`📊 **${data.rows.length} row(s) returned**\n\n`);

            // Format as table
            const columns = Object.keys(data.rows[0]);
            stream.markdown(`| ${columns.join(' | ')} |\n`);
            stream.markdown(`| ${columns.map(() => '---').join(' | ')} |\n`);
            
            const displayRows = data.rows.slice(0, 100);
            for (const row of displayRows) {
                const values = columns.map(col => {
                    const val = row[col];
                    if (val === null) return 'NULL';
                    if (typeof val === 'object') return JSON.stringify(val);
                    return String(val);
                });
                stream.markdown(`| ${values.join(' | ')} |\n`);
            }

            if (data.rows.length > 100) {
                stream.markdown(`\n*Showing first 100 rows of ${data.rows.length} total*\n`);
            }
        } else {
            stream.markdown(`✅ **Query successful**\n\n`);
            stream.markdown(`📝 **${data.rowCount || 0} row(s) affected**\n`);
        }

    } catch (error) {
        stream.markdown(`❌ **Error:** ${error.message}\n`);
    }
}

/**
 * List tables via MCP server
 */
async function handleMCPDbListTables(serverName, stream) {
    const query = `
        SELECT 
            schemaname,
            tablename
        FROM pg_tables
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY schemaname, tablename;
    `;
    
    stream.markdown(`### 📋 Database Tables\n\n`);
    await handleMCPDbQuery(serverName, query, stream);
}

/**
 * Describe table via MCP server
 */
async function handleMCPDbDescribe(serverName, tableName, stream) {
    const query = `
        SELECT 
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default
        FROM information_schema.columns
        WHERE table_name = '${tableName}'
        ORDER BY ordinal_position;
    `;
    
    stream.markdown(`### 📐 Table Structure: \`${tableName}\`\n\n`);
    await handleMCPDbQuery(serverName, query, stream);
}

/**
 * Show database help
 */
async function handleMCPDbHelp(stream) {
    stream.markdown(`### 🗄️ PostgreSQL Database Commands (MCP-based)\n\n`);
    stream.markdown(`#### Setup\n`);
    stream.markdown(`1. Install MCP server: \`@mcp install io.github.antonorlov/mcp-postgres-server\`\n`);
    stream.markdown(`2. Start MCP server: \`@mcp start io.github.antonorlov/mcp-postgres-server\`\n`);
    stream.markdown(`3. Configure database: \`@mcp db configure postgresql://user:pass@host:port/db\`\n\n`);
    
    stream.markdown(`#### Queries\n`);
    stream.markdown(`- \`@mcp db query SELECT * FROM table\` - Execute SQL query\n`);
    stream.markdown(`- \`@mcp db tables\` - List all tables\n`);
    stream.markdown(`- \`@mcp db describe tablename\` - Show table structure\n\n`);
    
    stream.markdown(`#### Examples\n`);
    stream.markdown(`\`\`\`\n`);
    stream.markdown(`@mcp install io.github.antonorlov/mcp-postgres-server\n`);
    stream.markdown(`@mcp start io.github.antonorlov/mcp-postgres-server\n`);
    stream.markdown(`@mcp db configure postgresql://postgres:postgres@localhost:5431/Adventureworks\n`);
    stream.markdown(`@mcp stop io.github.antonorlov/mcp-postgres-server\n`);
    stream.markdown(`@mcp start io.github.antonorlov/mcp-postgres-server\n`);
    stream.markdown(`@mcp db query SELECT * FROM sales.customer LIMIT 10\n`);
    stream.markdown(`@mcp db tables\n`);
    stream.markdown(`\`\`\`\n\n`);
    
    stream.markdown(`**Note:** All database operations go through the MCP PostgreSQL server.\n`);
}

/**
 * Make HTTP request to MCP server
 */
function mcpServerRequest(port, payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        
        const options = {
            hostname: 'localhost',
            port: port,
            path: '/mcp/v1',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(new Error('Invalid JSON response from MCP server'));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('MCP server request timeout'));
        });

        req.write(data);
        req.end();
    });
}

// ============================================
// MCP SERVER MANAGEMENT
// ============================================

/**
 * Ensure MCP directory exists
 */
async function ensureMCPDirectory() {
    try {
        await fs.mkdir(MCP_SERVERS_DIR, { recursive: true });
        console.log(`✅ MCP servers directory ready: ${MCP_SERVERS_DIR}`);
    } catch (error) {
        console.error('Failed to create MCP directory:', error);
    }
}

/**
 * Handle list command
 */
async function handleListCommand(stream) {
    stream.markdown(`## 📦 Available MCP Servers from Registry\n\n`);
    
    if (mcpTools.length === 0) {
        stream.markdown(`⚠️  No servers found in registry.\n`);
        stream.markdown(`Registry URL: ${REGISTRY_URL}\n`);
        return;
    }

    for (const tool of mcpTools) {
        const serverDir = path.join(MCP_SERVERS_DIR, tool.name.replace(/\//g, '-'));
        const isInstalled = await checkIfInstalled(serverDir);
        const isRunning = mcpServerProcesses.has(tool.name);
        
        let status = '📦 Available';
        if (isInstalled && isRunning) {
            status = '🟢 Running';
        } else if (isInstalled) {
            status = '✅ Installed';
        }
        
        stream.markdown(`### ${status} ${tool.name}\n`);
        stream.markdown(`${tool.description}\n`);
        stream.markdown(`- Version: \`${tool.version}\`\n`);
        if (tool.repository) {
            stream.markdown(`- Repository: ${tool.repository}\n`);
        }
        if (!isInstalled) {
            stream.markdown(`- Install: \`@mcp install ${tool.name}\`\n`);
        } else if (!isRunning) {
            stream.markdown(`- Start: \`@mcp start ${tool.name}\`\n`);
        }
        stream.markdown(`\n`);
    }
}

/**
 * Handle status command
 */
async function handleStatusCommand(stream) {
    stream.markdown(`## 📊 MCP Servers Status\n\n`);
    
    let runningCount = 0;
    let installedCount = 0;
    let availableCount = 0;

    for (const tool of mcpTools) {
        const serverDir = path.join(MCP_SERVERS_DIR, tool.name.replace(/\//g, '-'));
        const isInstalled = await checkIfInstalled(serverDir);
        const isRunning = mcpServerProcesses.has(tool.name);
        
        if (isRunning) {
            runningCount++;
            stream.markdown(`🟢 **${tool.name}** - Running\n`);
        } else if (isInstalled) {
            installedCount++;
            stream.markdown(`✅ **${tool.name}** - Installed (stopped)\n`);
        } else {
            availableCount++;
            stream.markdown(`📦 **${tool.name}** - Available\n`);
        }
    }

    stream.markdown(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    stream.markdown(`\n**Summary:**\n`);
    stream.markdown(`- 🟢 Running: ${runningCount}\n`);
    stream.markdown(`- ✅ Installed: ${installedCount}\n`);
    stream.markdown(`- 📦 Available: ${availableCount}\n`);
    stream.markdown(`- 📁 Location: \`${MCP_SERVERS_DIR}\`\n`);
}

/**
 * Handle install command
 */
async function handleInstallCommand(serverName, stream) {
    const tool = mcpTools.find(t => t.name.toLowerCase() === serverName.toLowerCase());
    
    if (!tool) {
        stream.markdown(`❌ Server "${serverName}" not found in registry.\n\n`);
        stream.markdown(`Use \`@mcp list\` to see available servers.\n`);
        return;
    }

    stream.markdown(`## 📦 Installing ${tool.name}\n\n`);

    const serverDir = path.join(MCP_SERVERS_DIR, tool.name.replace(/\//g, '-'));
    const isInstalled = await checkIfInstalled(serverDir);

    if (isInstalled) {
        stream.markdown(`⚠️  ${tool.name} is already installed.\n`);
        stream.markdown(`Location: \`${serverDir}\`\n`);
        return;
    }

    try {
        stream.markdown(`📥 Cloning repository...\n`);
        
        if (!tool.repository) {
            stream.markdown(`❌ No repository URL available for ${tool.name}\n`);
            return;
        }

        await execAsync(`git clone ${tool.repository} "${serverDir}"`);
        stream.markdown(`✅ Cloned\n\n`);

        stream.markdown(`📦 Installing dependencies...\n`);
        await execAsync(`cd "${serverDir}" && npm install`, { 
            maxBuffer: 1024 * 1024 * 10 
        });
        stream.markdown(`✅ Dependencies installed\n\n`);

        stream.markdown(`🔨 Building...\n`);
        try {
            await execAsync(`cd "${serverDir}" && npm run build`);
            stream.markdown(`✅ Build complete\n\n`);
        } catch (buildError) {
            stream.markdown(`⚠️  Build step failed or not required\n\n`);
        }

        stream.markdown(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        stream.markdown(`## ✅ Installation Complete!\n\n`);
        stream.markdown(`**${tool.name}** is now installed.\n`);
        stream.markdown(`Start it with: \`@mcp start ${tool.name}\`\n`);

        vscode.window.showInformationMessage(`✅ ${tool.name} installed successfully!`);

    } catch (error) {
        stream.markdown(`\n❌ Installation failed: ${error.message}\n`);
        console.error('Installation error:', error);
    }
}

/**
 * Handle install all command
 */
async function handleInstallAllCommand(stream) {
    stream.markdown(`## 📦 Installing All MCP Servers\n\n`);
    
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const tool of mcpTools) {
        const serverDir = path.join(MCP_SERVERS_DIR, tool.name.replace(/\//g, '-'));
        const isInstalled = await checkIfInstalled(serverDir);

        if (isInstalled) {
            stream.markdown(`⏭️  **${tool.name}** - Already installed\n`);
            skippedCount++;
            continue;
        }

        stream.markdown(`\n### Installing ${tool.name}...\n`);

        try {
            if (!tool.repository) {
                stream.markdown(`❌ No repository URL\n`);
                failedCount++;
                continue;
            }

            await execAsync(`git clone ${tool.repository} "${serverDir}"`);
            stream.markdown(`✅ Cloned\n`);

            await execAsync(`cd "${serverDir}" && npm install`, { 
                maxBuffer: 1024 * 1024 * 10 
            });
            stream.markdown(`✅ Dependencies installed\n`);

            try {
                await execAsync(`cd "${serverDir}" && npm run build`);
                stream.markdown(`✅ Built\n`);
            } catch {}

            successCount++;

        } catch (error) {
            stream.markdown(`❌ Failed: ${error.message}\n`);
            failedCount++;
        }
    }

    stream.markdown(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    stream.markdown(`## Summary\n\n`);
    stream.markdown(`- ✅ Installed: ${successCount}\n`);
    stream.markdown(`- ⏭️  Skipped: ${skippedCount}\n`);
    stream.markdown(`- ❌ Failed: ${failedCount}\n`);
}

/**
 * Handle start command - Starts MCP server process
 */
async function handleStartCommand(serverName, stream) {
    const tool = mcpTools.find(t => t.name.toLowerCase() === serverName.toLowerCase());
    
    if (!tool) {
        stream.markdown(`❌ Server "${serverName}" not found.\n`);
        return;
    }

    stream.markdown(`## 🚀 Starting ${tool.name}\n\n`);

    const serverDir = path.join(MCP_SERVERS_DIR, tool.name.replace(/\//g, '-'));
    const isInstalled = await checkIfInstalled(serverDir);

    if (!isInstalled) {
        stream.markdown(`⚠️  ${tool.name} is not installed.\n\n`);
        stream.markdown(`Install it with: \`@mcp install ${tool.name}\`\n`);
        return;
    }

    if (mcpServerProcesses.has(tool.name)) {
        stream.markdown(`⚠️  ${tool.name} is already running.\n`);
        return;
    }

    try {
        const port = MCP_SERVER_PORTS[tool.name] || 3000;
        
        // Start the MCP server process
        const serverProcess = spawn('npm', ['start'], {
            cwd: serverDir,
            env: {
                ...process.env,
                PORT: port.toString()
            },
            detached: false
        });

        serverProcess.stdout.on('data', (data) => {
            console.log(`[${tool.name}] ${data}`);
        });

        serverProcess.stderr.on('data', (data) => {
            console.error(`[${tool.name}] ${data}`);
        });

        mcpServerProcesses.set(tool.name, serverProcess);

        stream.markdown(`✅ **${tool.name} started successfully!**\n\n`);
        stream.markdown(`- Port: ${port}\n`);
        stream.markdown(`- Process ID: ${serverProcess.pid}\n\n`);
        
        if (tool.name === 'io.github.antonorlov/mcp-postgres-server') {
            stream.markdown(`⚙️  Configure database connection:\n`);
            stream.markdown(`\`@mcp db configure postgresql://user:pass@host:port/database\`\n`);
        }

        vscode.window.showInformationMessage(`✅ ${tool.name} started on port ${port}`);

    } catch (error) {
        stream.markdown(`❌ Failed to start: ${error.message}\n`);
    }
}

/**
 * Handle start all command
 */
async function handleStartAllCommand(stream) {
    stream.markdown(`## 🚀 Starting All Installed Servers\n\n`);
    
    let startedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const tool of mcpTools) {
        const serverDir = path.join(MCP_SERVERS_DIR, tool.name.replace(/\//g, '-'));
        const isInstalled = await checkIfInstalled(serverDir);
        const isRunning = mcpServerProcesses.has(tool.name);

        if (!isInstalled) {
            skippedCount++;
            continue;
        }

        if (isRunning) {
            stream.markdown(`⏭️  **${tool.name}** - Already running\n`);
            skippedCount++;
            continue;
        }

        stream.markdown(`### Starting ${tool.name}...\n`);

        try {
            const port = MCP_SERVER_PORTS[tool.name] || 3000 + startedCount;
            
            const serverProcess = spawn('npm', ['start'], {
                cwd: serverDir,
                env: {
                    ...process.env,
                    PORT: port.toString()
                },
                detached: false
            });

            mcpServerProcesses.set(tool.name, serverProcess);
            stream.markdown(`✅ Started on port ${port}\n\n`);
            startedCount++;

        } catch (error) {
            stream.markdown(`❌ Failed: ${error.message}\n\n`);
            failedCount++;
        }
    }

    stream.markdown(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    stream.markdown(`## Summary\n\n`);
    stream.markdown(`- 🟢 Started: ${startedCount}\n`);
    stream.markdown(`- ⏭️  Skipped: ${skippedCount}\n`);
    stream.markdown(`- ❌ Failed: ${failedCount}\n`);
}

/**
 * Handle stop command - Stops MCP server process
 */
async function handleStopCommand(serverName, stream) {
    const tool = mcpTools.find(t => t.name.toLowerCase() === serverName.toLowerCase());
    
    if (!tool) {
        stream.markdown(`❌ Server "${serverName}" not found.\n`);
        return;
    }

    stream.markdown(`## 🛑 Stopping ${tool.name}\n\n`);

    if (!mcpServerProcesses.has(tool.name)) {
        stream.markdown(`⚠️  ${tool.name} is not running.\n`);
        return;
    }

    try {
        const serverProcess = mcpServerProcesses.get(tool.name);
        serverProcess.kill('SIGTERM');
        mcpServerProcesses.delete(tool.name);

        stream.markdown(`✅ **${tool.name} stopped successfully!**\n`);
        vscode.window.showInformationMessage(`✅ ${tool.name} stopped`);

    } catch (error) {
        stream.markdown(`❌ Failed to stop: ${error.message}\n`);
    }
}

/**
 * Handle stop all command
 */
async function handleStopAllCommand(stream) {
    stream.markdown(`## 🛑 Stopping All Running Servers\n\n`);
    
    if (mcpServerProcesses.size === 0) {
        stream.markdown(`⚠️  No servers are currently running.\n`);
        return;
    }

    let stoppedCount = 0;

    for (const [serverName, serverProcess] of mcpServerProcesses) {
        try {
            serverProcess.kill('SIGTERM');
            stream.markdown(`✅ Stopped ${serverName}\n`);
            stoppedCount++;
        } catch (error) {
            stream.markdown(`❌ Failed to stop ${serverName}: ${error.message}\n`);
        }
    }

    mcpServerProcesses.clear();

    stream.markdown(`\n✅ Stopped ${stoppedCount} server(s).\n`);
}

/**
 * Handle uninstall command
 */
async function handleUninstallCommand(serverName, stream) {
    const tool = mcpTools.find(t => t.name.toLowerCase() === serverName.toLowerCase());
    
    if (!tool) {
        stream.markdown(`❌ Server "${serverName}" not found.\n`);
        return;
    }

    const serverDir = path.join(MCP_SERVERS_DIR, tool.name.replace(/\//g, '-'));
    const isInstalled = await checkIfInstalled(serverDir);

    if (!isInstalled) {
        stream.markdown(`⚠️  ${tool.name} is not installed.\n`);
        return;
    }

    // Stop if running
    if (mcpServerProcesses.has(tool.name)) {
        stream.markdown(`🛑 Stopping ${tool.name} first...\n`);
        const serverProcess = mcpServerProcesses.get(tool.name);
        serverProcess.kill('SIGTERM');
        mcpServerProcesses.delete(tool.name);
    }

    stream.markdown(`## 🗑️  Uninstalling ${tool.name}\n\n`);

    try {
        await fs.rm(serverDir, { recursive: true, force: true });
        stream.markdown(`✅ ${tool.name} has been uninstalled.\n`);
        vscode.window.showInformationMessage(`✅ ${tool.name} uninstalled`);
    } catch (error) {
        stream.markdown(`❌ Failed to uninstall: ${error.message}\n`);
    }
}

/**
 * Handle help command
 */
async function handleHelpCommand(stream) {
    stream.markdown(`## 🤖 MCP Registry Extension - Help (Pure MCP Mode)\n\n`);
    
    stream.markdown(`### MCP Server Management\n\n`);
    stream.markdown(`- \`/list\` - List all available MCP servers\n`);
    stream.markdown(`- \`/status\` - Show installation and running status\n`);
    stream.markdown(`- \`/install <server>\` - Install a specific server\n`);
    stream.markdown(`- \`/install-all\` - Install all available servers\n`);
    stream.markdown(`- \`/start <server>\` - Start an MCP server\n`);
    stream.markdown(`- \`/start-all\` - Start all installed servers\n`);
    stream.markdown(`- \`/stop <server>\` - Stop a running server\n`);
    stream.markdown(`- \`/stop-all\` - Stop all running servers\n`);
    stream.markdown(`- \`/uninstall <server>\` - Uninstall a server\n\n`);
    
    stream.markdown(`### Database Commands (via MCP PostgreSQL Server)\n\n`);
    stream.markdown(`- \`db configure postgresql://...\` - Configure database connection\n`);
    stream.markdown(`- \`db query SELECT ...\` - Execute SQL query via MCP\n`);
    stream.markdown(`- \`db tables\` - List all tables via MCP\n`);
    stream.markdown(`- \`db describe <table>\` - Show table structure via MCP\n`);
    stream.markdown(`- \`db help\` - Show database help\n\n`);
    
    stream.markdown(`### Examples\n\n`);
    stream.markdown(`\`\`\`\n`);
    stream.markdown(`# Setup PostgreSQL MCP Server\n`);
    stream.markdown(`@mcp install io.github.antonorlov/mcp-postgres-server\n`);
    stream.markdown(`@mcp start io.github.antonorlov/mcp-postgres-server\n`);
    stream.markdown(`@mcp db configure postgresql://postgres:postgres@localhost:5431/Adventureworks\n`);
    stream.markdown(`@mcp stop io.github.antonorlov/mcp-postgres-server\n`);
    stream.markdown(`@mcp start io.github.antonorlov/mcp-postgres-server\n`);
    stream.markdown(`\n`);
    stream.markdown(`# Use Database\n`);
    stream.markdown(`@mcp db query SELECT * FROM sales.customer LIMIT 10\n`);
    stream.markdown(`@mcp db tables\n`);
    stream.markdown(`\n`);
    stream.markdown(`# Install markitdown\n`);
    stream.markdown(`@mcp install io.github.mirza-glitch/markitdown-js\n`);
    stream.markdown(`@mcp start io.github.mirza-glitch/markitdown-js\n`);
    stream.markdown(`\`\`\`\n\n`);
    
    stream.markdown(`**Note:** All database operations go through the MCP PostgreSQL server.\n`);
    stream.markdown(`Registry: \`${REGISTRY_URL}\`\n`);
}

/**
 * Check if server is installed
 */
async function checkIfInstalled(serverDir) {
    try {
        await fs.access(serverDir);
        return true;
    } catch {
        return false;
    }
}

/**
 * Load tools from company MCP registry
 */
async function loadMCPRegistry() {
    try {
        const url = require('url');
        const parsedUrl = url.parse(REGISTRY_URL);

        const response = await new Promise((resolve, reject) => {
            const req = http.get(REGISTRY_URL, (res) => {
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
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Registry connection timeout'));
            });
        });

        mcpTools = response.servers.map(item => {
            const server = item.server;
            return {
                name: server.name,
                description: server.description || `Tools from ${server.name}`,
                repository: server.repository?.url || null,
                version: server.version || 'Unknown'
            };
        });

        console.log(`✅ Loaded ${mcpTools.length} tools from company MCP registry`);
        
        vscode.window.showInformationMessage(
            `✅ Connected to MCP registry! Found ${mcpTools.length} server(s).`
        );
    } catch (error) {
        console.error('❌ Failed to load MCP registry:', error);
        vscode.window.showErrorMessage(
            `❌ Cannot connect to MCP registry at ${REGISTRY_URL}.\n\nError: ${error.message}`
        );
        mcpTools = [];
    }
}

/**
 * Enforce MCP policy
 */
async function enforceMCPPolicy() {
    try {
        const config = vscode.workspace.getConfiguration();
        
        await config.update('mcp.servers', {}, vscode.ConfigurationTarget.Global);
        await config.update('mcp.servers', {}, vscode.ConfigurationTarget.Workspace);
        await config.update('chat.mcp.gallery.enabled', false, vscode.ConfigurationTarget.Global);
        await config.update('chat.mcp.gallery.enabled', false, vscode.ConfigurationTarget.Workspace);
        await config.update('github.copilot.chat.mcp.enabled', false, vscode.ConfigurationTarget.Global);
        await config.update('github.copilot.chat.mcp.enabled', false, vscode.ConfigurationTarget.Workspace);
        
        console.log('✅ Company MCP policy enforced');
    } catch (error) {
        console.error('Failed to enforce MCP policy:', error);
    }
}

function deactivate() {
    // Stop all running MCP servers
    for (const [serverName, serverProcess] of mcpServerProcesses) {
        try {
            console.log(`Stopping ${serverName}...`);
            serverProcess.kill('SIGTERM');
        } catch (error) {
            console.error(`Error stopping ${serverName}:`, error);
        }
    }
    mcpServerProcesses.clear();
    console.log('MCP Registry Extension deactivated');
}

module.exports = {
    activate,
    deactivate
};