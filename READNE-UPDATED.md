# MCP Registry Extension - Pure MCP Implementation

A VS Code extension that provides **100% MCP-based** server management and database connectivity. All operations go through proper MCP protocol servers.

## 🎯 Pure MCP Architecture

This extension uses **MCP protocol for everything**:
- ✅ PostgreSQL database queries via **MCP PostgreSQL server**
- ✅ File conversions via **markitdown MCP server**
- ✅ All MCP servers run as independent processes
- ✅ Communication via standardized MCP protocol
- ✅ No direct connections - everything through MCP

## 🏗️ Architecture

```
┌──────────────────────────────────┐
│  VS Code Extension               │
│  - MCP Server Manager            │
│  - MCP Protocol Client           │
└──────────────┬───────────────────┘
               │
       (MCP Protocol)
               │
   ┌───────────┴────────────┐
   │                        │
┌──▼────────────┐   ┌───────▼────────┐
│ PostgreSQL    │   │  markitdown    │
│ MCP Server    │   │  MCP Server    │
│ (Port 3001)   │   │  (Port 3002)   │
└──┬────────────┘   └────────────────┘
   │
   │ (Database Driver)
   ▼
┌──────────────┐
│  PostgreSQL  │
│  Database    │
└──────────────┘
```

## ✨ Features

### 🗄️ PostgreSQL via MCP
- Query databases through MCP PostgreSQL server
- Install, start, stop, configure MCP server
- Execute SQL queries via MCP protocol
- Schema exploration through MCP
- Multi-connection support

### 📦 MCP Server Management
- Browse MCP servers from company registry
- Install MCP servers from repositories
- Start/stop MCP server processes
- Monitor server status (running/stopped/not installed)
- Manage multiple MCP servers simultaneously

### 🤖 AI-Powered Tools
- **markitdown MCP** - File format conversions via MCP
- Seamless GitHub Copilot integration
- Additional MCP tools from your registry

---

## 🚀 Quick Start

### 0. Update VS Code Settings (First!)

Open your `settings.json` and make sure you have **only these 2 lines** for MCP:

```json
{
  "mcpRegistry.registryUrl": "http://localhost:8080/v0.1/servers",
  "mcpRegistry.serversDirectory": "~/mcp-servers"
}
```

**Remove this if you have it** (not needed in pure MCP):
```json
"mcpRegistry.defaultDatabase": "postgresql://..." // ❌ Delete this line
```

💡 **Why?** Database config goes in the MCP server, not VS Code settings!

### 1. Install Extension

```bash
cd /path/to/mcp-registry-vscode/
npm install
vsce package
code --install-extension mcp-registry-vscode-*.vsix
```

Reload VS Code: `Ctrl+Shift+P` → "Reload Window"

### 2. Setup PostgreSQL MCP Server

```bash
# List available servers
@mcp list

# Install PostgreSQL MCP server
@mcp install io.github.antonorlov/mcp-postgres-server

# Start the server
@mcp start io.github.antonorlov/mcp-postgres-server

# Configure database connection (THIS replaces settings.json!)
@mcp db configure postgresql://postgres:postgres@localhost:5431/Adventureworks

# Restart for config to take effect
@mcp stop io.github.antonorlov/mcp-postgres-server
@mcp start io.github.antonorlov/mcp-postgres-server
```

### 3. Query Database via MCP

```bash
# List tables
@mcp db tables

# Execute query
@mcp db query SELECT * FROM sales.customer LIMIT 10

# Describe table
@mcp db describe sales.customer
```

---

## 📖 Command Reference

### MCP Server Management

| Command | Description | Example |
|---------|-------------|---------|
| `list` | List all MCP servers in registry | `@mcp list` |
| `status` | Show server installation/running status | `@mcp status` |
| `install <server>` | Install an MCP server | `@mcp install io.github.antonorlov/mcp-postgres-server` |
| `install-all` | Install all available servers | `@mcp install-all` |
| `start <server>` | Start an MCP server process | `@mcp start io.github.antonorlov/mcp-postgres-server` |
| `start-all` | Start all installed servers | `@mcp start-all` |
| `stop <server>` | Stop a running MCP server | `@mcp stop io.github.antonorlov/mcp-postgres-server` |
| `stop-all` | Stop all running servers | `@mcp stop-all` |
| `uninstall <server>` | Uninstall an MCP server | `@mcp uninstall io.github.antonorlov/mcp-postgres-server` |
| `help` | Show all commands | `@mcp help` |

### Database Commands (via MCP)

| Command | Description | Example |
|---------|-------------|---------|
| `db configure <url>` | Configure PostgreSQL connection | `@mcp db configure postgresql://user:pass@host:5432/db` |
| `db query <sql>` | Execute SQL query via MCP | `@mcp db query SELECT * FROM users` |
| `db SELECT/INSERT/UPDATE/DELETE` | Execute SQL directly | `@mcp db SELECT * FROM users LIMIT 10` |
| `db tables` | List all tables via MCP | `@mcp db tables` |
| `db describe <table>` | Show table structure | `@mcp db describe sales.customer` |
| `db help` | Show database help | `@mcp db help` |

---

## 💡 Usage Examples

### Example 1: Complete Setup

```bash
# Step 1: List what's available
@mcp list

# Step 2: Install PostgreSQL MCP server
@mcp install io.github.antonorlov/mcp-postgres-server

# Step 3: Start the MCP server
@mcp start io.github.antonorlov/mcp-postgres-server

# Step 4: Configure database connection
@mcp db configure postgresql://postgres:postgres@localhost:5431/Adventureworks

# Step 5: Restart server to apply config
@mcp stop io.github.antonorlov/mcp-postgres-server
@mcp start io.github.antonorlov/mcp-postgres-server

# Step 6: Verify it works
@mcp db query SELECT version()
```

### Example 2: Daily Database Queries

```bash
# Check if server is running
@mcp status

# Start if needed
@mcp start io.github.antonorlov/mcp-postgres-server

# List tables
@mcp db tables

# Query customer data
@mcp db query 
  SELECT 
    customerid,
    accountnumber
  FROM sales.customer
  ORDER BY customerid
  LIMIT 20

# Check table structure
@mcp db describe sales.salesorderheader

# Complex query
@mcp db query
  SELECT 
    c.customerid,
    COUNT(o.salesorderid) as order_count,
    SUM(o.totaldue) as total_spent
  FROM sales.customer c
  LEFT JOIN sales.salesorderheader o ON c.customerid = o.customerid
  GROUP BY c.customerid
  ORDER BY total_spent DESC
  LIMIT 10
```

### Example 3: Using Multiple MCP Servers

```bash
# Install both servers
@mcp install io.github.antonorlov/mcp-postgres-server
@mcp install io.github.mirza-glitch/markitdown-js

# Start both
@mcp start io.github.antonorlov/mcp-postgres-server
@mcp start io.github.mirza-glitch/markitdown-js

# Check status
@mcp status

# Use database
@mcp db query SELECT * FROM products LIMIT 5

# Use markitdown with Copilot
@mcp Convert specification.docx to markdown

# Stop all when done
@mcp stop-all
```

### Example 4: Database Schema Exploration

```bash
# Start server
@mcp start io.github.antonorlov/mcp-postgres-server

# List all tables
@mcp db tables

# Examine specific tables
@mcp db describe sales.customer
@mcp db describe production.product
@mcp db describe person.person

# Check foreign keys
@mcp db query
  SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'sales'
```

---

## 🔧 Configuration

### VS Code Settings

Add **only these two lines** to your `settings.json`:

```json
{
  "mcpRegistry.registryUrl": "http://localhost:8080/v0.1/servers",
  "mcpRegistry.serversDirectory": "~/mcp-servers"
}
```

**Important:** In pure MCP solution, you do **NOT** need database connection in VS Code settings!

❌ **Don't add this** (not needed in pure MCP):
```json
"mcpRegistry.defaultDatabase": "postgresql://..." // Remove this!
```

### Complete settings.json Example

```json
{
  "// Your existing company MCP policy": "",
  "mcp.servers": {},
  "github.copilot.chat.mcp.enabled": false,
  "chat.mcp.gallery.enabled": false,
  "chat.mcp.access": "none",
  "chat.mcp.serverSampling": {},
  
  "// Pure MCP solution settings (only 2 lines needed!)": "",
  "mcpRegistry.registryUrl": "http://localhost:8080/v0.1/servers",
  "mcpRegistry.serversDirectory": "~/mcp-servers"
}
```

### MCP Server Configuration

Database configuration is **NOT** in VS Code settings. It's stored in the MCP server:

```
~/mcp-servers/io.github.antonorlov-mcp-postgres-server/.mcp-config.json
```

**How to configure:** Use the command instead of editing settings:
```bash
@mcp db configure postgresql://postgres:postgres@localhost:5431/Adventureworks
```

This creates the config file automatically:
```json
{
  "host": "localhost",
  "port": 5431,
  "database": "Adventureworks",
  "user": "postgres",
  "password": "postgres"
}
```

**Security:** Make sure to secure this file:
```bash
chmod 600 ~/mcp-servers/io.github.antonorlov-mcp-postgres-server/.mcp-config.json
```

### Why Database Config is NOT in VS Code Settings

| Direct Solution | Pure MCP Solution |
|-----------------|-------------------|
| Database config in VS Code settings | ❌ No database config in VS Code |
| Extension connects directly | ✅ MCP server manages connection |
| One config per VS Code instance | ✅ One config shared by all clients |
| `mcpRegistry.defaultDatabase` needed | ✅ Use `@mcp db configure` instead |

---

## 🎯 MCP Server Status

The extension tracks three states for each MCP server:

| Status | Icon | Description |
|--------|------|-------------|
| Running | 🟢 | MCP server process is active |
| Installed | ✅ | Installed but not currently running |
| Available | 📦 | In registry, not yet installed |

Check status anytime with:
```bash
@mcp status
```

Example output:
```
📊 MCP Servers Status

🟢 io.github.antonorlov/mcp-postgres-server - Running
🟢 io.github.mirza-glitch/markitdown-js - Running
✅ io.github.dead8309/markitdown-ts - Installed (stopped)
📦 io.github.postmanlabs/postman-mcp-server - Available

Summary:
- 🟢 Running: 2
- ✅ Installed: 1
- 📦 Available: 1
```

---

## 🔍 How MCP Protocol Works

### Database Query Flow

1. **User enters query** in VS Code Chat:
   ```
   @mcp db query SELECT * FROM users
   ```

2. **Extension sends MCP request** to PostgreSQL MCP server (port 3001):
   ```json
   {
     "method": "tools/call",
     "params": {
       "name": "query",
       "arguments": { "sql": "SELECT * FROM users" }
     }
   }
   ```

3. **MCP PostgreSQL server**:
   - Receives MCP request
   - Validates SQL
   - Connects to PostgreSQL database
   - Executes query
   - Returns results via MCP protocol

4. **Extension receives MCP response**:
   ```json
   {
     "result": {
       "rows": [...],
       "rowCount": 10
     }
   }
   ```

5. **Extension formats and displays** results in VS Code Chat

### Benefits of MCP Protocol

- ✅ **Standardized** - Same protocol for all tools
- ✅ **Centralized** - One MCP server can serve multiple clients
- ✅ **Secure** - MCP server can add authentication/authorization
- ✅ **Auditable** - All requests logged in MCP server
- ✅ **Extensible** - Easy to add new MCP tools

---

## 🐛 Troubleshooting

### Common Questions

#### Q: Do I need `mcpRegistry.defaultDatabase` in settings.json?

**A: NO!** ❌ That was only for the direct solution. In pure MCP:
- Database config goes in the MCP server
- Use `@mcp db configure` command instead
- VS Code settings only need registry URL and directory

#### Q: Where is my database password stored?

**A:** In the MCP server config file:
```
~/mcp-servers/io.github.antonorlov-mcp-postgres-server/.mcp-config.json
```

Secure it with:
```bash
chmod 600 ~/mcp-servers/io.github.antonorlov-mcp-postgres-server/.mcp-config.json
```

#### Q: Can I have multiple database configs?

**A:** Currently one config per MCP server instance. To connect to different databases:
1. Reconfigure: `@mcp db configure postgresql://...`
2. Restart server: `@mcp stop ...` then `@mcp start ...`

Or run multiple instances of the MCP server on different ports (advanced).

### Server Won't Start

**Problem:** `@mcp start` fails

**Solutions:**
```bash
# Check if server is installed
@mcp status

# Verify server directory exists
ls ~/mcp-servers/io.github.antonorlov-mcp-postgres-server

# Check for port conflicts
lsof -i :3001

# Try manual start to see errors
cd ~/mcp-servers/io.github.antonorlov-mcp-postgres-server
npm start
```

### Database Queries Fail

**Problem:** Queries return errors

**Solutions:**
1. **Check server is running:**
   ```
   @mcp status
   ```

2. **Verify configuration:**
   ```bash
   cat ~/mcp-servers/io.github.antonorlov-mcp-postgres-server/.mcp-config.json
   ```

3. **Test PostgreSQL directly:**
   ```bash
   psql -h localhost -p 5431 -U postgres -d Adventureworks
   ```

4. **Restart MCP server:**
   ```
   @mcp stop io.github.antonorlov/mcp-postgres-server
   @mcp start io.github.antonorlov/mcp-postgres-server
   ```

### Configuration Not Applied

**Problem:** Changes to config don't take effect

**Solution:** Always restart the MCP server after configuration changes:
```bash
@mcp stop io.github.antonorlov/mcp-postgres-server
@mcp start io.github.antonorlov/mcp-postgres-server
```

### MCP Server Crashes

**Check logs:**
```bash
# VS Code Output panel
View → Output → Select "Extension Host"

# Or check server logs directly
cd ~/mcp-servers/io.github.antonorlov-mcp-postgres-server
npm start
# Watch console for errors
```

---

## 🔐 Security Best Practices

### 1. Use Read-Only Database Users

```sql
-- Create read-only user
CREATE USER readonly WITH PASSWORD 'SecurePassword123!';
GRANT CONNECT ON DATABASE "Adventureworks" TO readonly;
GRANT USAGE ON SCHEMA sales, production, person TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA sales TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA production TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA person TO readonly;
```

Then configure:
```bash
@mcp db configure postgresql://readonly:SecurePassword123!@localhost:5431/Adventureworks
```

### 2. Secure Configuration Files

```bash
chmod 600 ~/mcp-servers/io.github.antonorlov-mcp-postgres-server/.mcp-config.json
```

### 3. Use Environment Variables

Instead of hardcoding passwords, use environment variables in the MCP server configuration.

### 4. Regular Server Audits

```bash
# Check what's running
@mcp status

# Stop unused servers
@mcp stop <unused-server>
```

---

## 📊 Performance Considerations

### MCP Server Overhead

The MCP protocol adds minimal overhead:
- **Direct connection:** ~5ms
- **Via MCP server:** ~7-10ms

This slight increase is worth it for:
- Centralized management
- Auditing capabilities
- Multi-client support
- Standardized protocol

### Optimization Tips

1. **Keep servers running** during active use
2. **Stop unused servers** to free resources
3. **Use query limits** - Always add LIMIT to queries
4. **Monitor performance** - Check MCP server logs

---

## 🔄 Updating

### Update Extension

```bash
cd /path/to/mcp-registry-vscode/
git pull
npm install
vsce package
code --install-extension mcp-registry-vscode-*.vsix
```

Reload VS Code: `Ctrl+Shift+P` → "Reload Window"

### Update MCP Servers

```bash
# Uninstall old version
@mcp uninstall io.github.antonorlov/mcp-postgres-server

# Install new version
@mcp install io.github.antonorlov/mcp-postgres-server

# Start and reconfigure
@mcp start io.github.antonorlov/mcp-postgres-server
@mcp db configure postgresql://...
```

---

## 🎓 Best Practices

### Daily Workflow

```bash
# Morning - Start servers
@mcp start-all

# Work with databases
@mcp db query ...
@mcp db tables
...

# Evening - Stop servers
@mcp stop-all
```

### Before Deployment

1. Test all MCP servers individually
2. Verify database connections
3. Check query performance
4. Review security settings
5. Document server configurations

### Team Usage

1. Share MCP registry URL
2. Document required servers
3. Provide sample configurations
4. Create connection templates
5. Establish security guidelines

---

## 📚 Additional Resources

- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Installation Guide](./MCP_PURE_INSTALLATION_GUIDE.md)

---

## 📝 License

MIT License

---

## 🎉 Summary

This extension provides a **pure MCP implementation** where:
- ✅ All database operations go through MCP PostgreSQL server
- ✅ MCP servers run as independent processes
- ✅ Everything communicates via MCP protocol
- ✅ Centralized, auditable, standardized approach

**Ready to use MCP the right way!** 🚀

---

**Version:** 2.0.0 (Pure MCP)  
**Last Updated:** December 2024