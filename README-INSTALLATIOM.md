# Pure MCP-Based Solution - Complete Installation Guide

## 🎯 What This Solution Does

This is a **100% MCP-based solution** where:
- ✅ All database operations go through the **MCP PostgreSQL server**
- ✅ MCP servers run as separate processes
- ✅ Extension communicates via MCP protocol
- ✅ No direct database connections
- ✅ Centralized, standardized approach

## 📊 Architecture

```
┌─────────────────────────────────────┐
│   VS Code Extension                 │
│   - Manages MCP servers             │
│   - Sends MCP protocol requests     │
└─────────────────┬───────────────────┘
                  │
          (MCP Protocol)
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼────────────┐   ┌──────────▼──────────┐
│ MCP PostgreSQL │   │  markitdown MCP     │
│ Server         │   │  Server             │
│ (Port 3001)    │   │  (Port 3002)        │
└───┬────────────┘   └─────────────────────┘
    │
    │ (pg module)
    │
┌───▼────────────┐
│  PostgreSQL    │
│  Database      │
│  (Port 5431)   │
└────────────────┘
```

## 🚀 Installation Steps

### Step 1: Backup Current Extension

```bash
cd /Users/syedraza/mcp-registry-vscode/
cp extension.js extension.js.backup
```

### Step 2: Replace Extension File

Download `extension-mcp-pure.js` from outputs, then:

```bash
rm extension.js
mv extension-mcp-pure.js extension.js
```

### Step 3: No Additional Dependencies Needed

Unlike the direct solution, this **doesn't need the `pg` module** in the extension.  
The MCP server will handle it.

```bash
# Clean up if you had pg installed
npm uninstall pg
```

### Step 4: Rebuild Extension

```bash
vsce package
code --install-extension mcp-registry-vscode-*.vsix
```

### Step 5: Reload VS Code

Press `Ctrl+Shift+P` → "Developer: Reload Window"

---

## 📦 Setup MCP PostgreSQL Server

### Step 1: List Available Servers

```
@mcp list
```

You should see:
```
📦 Available MCP Servers from Registry

⬜ io.github.antonorlov/mcp-postgres-server
PostgreSQL MCP server - Enables AI models to interact with PostgreSQL...
- Install: @mcp install io.github.antonorlov/mcp-postgres-server

✅ io.github.mirza-glitch/markitdown-js
MarkItDown JS - Converts various file formats...
```

### Step 2: Install PostgreSQL MCP Server

```
@mcp install io.github.antonorlov/mcp-postgres-server
```

**Expected output:**
```
📦 Installing io.github.antonorlov/mcp-postgres-server

📥 Cloning repository...
✅ Cloned

📦 Installing dependencies...
✅ Dependencies installed

🔨 Building...
✅ Build complete

✅ Installation Complete!
Start it with: @mcp start io.github.antonorlov/mcp-postgres-server
```

### Step 3: Start the MCP Server

```
@mcp start io.github.antonorlov/mcp-postgres-server
```

**Expected output:**
```
🚀 Starting io.github.antonorlov/mcp-postgres-server

✅ io.github.antonorlov/mcp-postgres-server started successfully!

- Port: 3001
- Process ID: 12345

⚙️ Configure database connection:
@mcp db configure postgresql://user:pass@host:port/database
```

### Step 4: Configure Database Connection

```
@mcp db configure postgresql://postgres:postgres@localhost:5431/Adventureworks
```

**Expected output:**
```
⚙️ Configuring MCP PostgreSQL server...

✅ Configuration saved!

📍 Database Configuration:
- Database: Adventureworks
- Host: localhost:5431
- User: postgres

🔄 Please restart the MCP server:
@mcp stop io.github.antonorlov/mcp-postgres-server
@mcp start io.github.antonorlov/mcp-postgres-server
```

### Step 5: Restart MCP Server

```
@mcp stop io.github.antonorlov/mcp-postgres-server
@mcp start io.github.antonorlov/mcp-postgres-server
```

---

## ✅ Test Database Connection

### Test 1: List Tables

```
@mcp db tables
```

**Expected output:**
```
📋 Database Tables

🔍 Executing Query via MCP

✅ Query successful

📊 25 row(s) returned

| schemaname | tablename           |
|------------|---------------------|
| sales      | customer            |
| sales      | salesorderheader    |
| production | product             |
...
```

### Test 2: Query Data

```
@mcp db query SELECT * FROM sales.customer LIMIT 5
```

**Expected output:**
```
🔍 Executing Query via MCP

sql
SELECT * FROM sales.customer LIMIT 5


✅ Query successful

📊 5 row(s) returned

| customerid | personid | storeid | territoryid | accountnumber |
|------------|----------|---------|-------------|---------------|
| 1          | 123      | NULL    | 1           | AW00000001    |
...
```

### Test 3: Describe Table

```
@mcp db describe sales.customer
```

---

## 🎯 Complete Command Reference

### MCP Server Management

| Command | Description |
|---------|-------------|
| `@mcp list` | List all MCP servers in registry |
| `@mcp status` | Show which servers are installed/running |
| `@mcp install <server>` | Install an MCP server |
| `@mcp start <server>` | Start an MCP server (runs as process) |
| `@mcp stop <server>` | Stop a running MCP server |
| `@mcp uninstall <server>` | Uninstall an MCP server |

### Database Commands (via MCP)

| Command | Description |
|---------|-------------|
| `@mcp db configure postgresql://...` | Configure database connection |
| `@mcp db query SELECT ...` | Execute SQL via MCP server |
| `@mcp db tables` | List tables via MCP server |
| `@mcp db describe <table>` | Describe table via MCP server |
| `@mcp db help` | Show database help |

---

## 🔄 Daily Workflow

### Starting Your Session

```bash
# 1. Check server status
@mcp status

# 2. Start PostgreSQL MCP server if stopped
@mcp start io.github.antonorlov/mcp-postgres-server

# 3. Start markitdown if needed
@mcp start io.github.mirza-glitch/markitdown-js

# 4. Query database
@mcp db query SELECT * FROM sales.customer LIMIT 10
```

### Ending Your Session

```bash
# Stop all running servers
@mcp stop-all
```

---

## 🔍 Verification Checklist

After installation, verify:

- [ ] Extension installed: Check Extensions panel
- [ ] MCP registry connected: `@mcp list` works
- [ ] PostgreSQL MCP server installed: Shows "✅ Installed" in list
- [ ] Server can start: `@mcp start ...` succeeds
- [ ] Server is running: `@mcp status` shows "🟢 Running"
- [ ] Database configured: Configuration file created
- [ ] Queries work: `@mcp db tables` returns results
- [ ] Can execute SQL: `@mcp db query SELECT 1` works

---

## 🆚 Comparison with Direct Solution

### Pure MCP Solution (This One)

**Pros:**
- ✅ True MCP protocol implementation
- ✅ Centralized server management
- ✅ Can share MCP server across multiple clients
- ✅ Standardized approach
- ✅ Server runs independently

**Cons:**
- ⚠️ More complex setup (install + start + configure)
- ⚠️ Need to manage server processes
- ⚠️ Additional layer (slight overhead)
- ⚠️ Server must be running for queries

### Direct Solution (Previous)

**Pros:**
- ✅ Simple setup
- ✅ No server processes to manage
- ✅ Faster (direct connection)
- ✅ Fewer steps

**Cons:**
- ⚠️ Not using MCP protocol for database
- ⚠️ Can't share with other tools
- ⚠️ Mixed architecture

---

## 🐛 Troubleshooting

### Issue: MCP Server Won't Start

**Error:** `Failed to start: spawn npm ENOENT`

**Solution:**
```bash
# Verify npm is installed
npm --version

# Check server directory exists
ls ~/mcp-servers/io.github.antonorlov-mcp-postgres-server

# Try manual start
cd ~/mcp-servers/io.github.antonorlov-mcp-postgres-server
npm start
```

### Issue: Database Configuration Not Applied

**Problem:** Queries fail after configuration

**Solution:**
```bash
# 1. Stop the server
@mcp stop io.github.antonorlov/mcp-postgres-server

# 2. Check config file was created
cat ~/mcp-servers/io.github.antonorlov-mcp-postgres-server/.mcp-config.json

# 3. Start server again
@mcp start io.github.antonorlov/mcp-postgres-server

# 4. Test connection
@mcp db query SELECT 1
```

### Issue: Port Already in Use

**Error:** `Port 3001 already in use`

**Solution:**
```bash
# Find process using port
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use different port - modify MCP_SERVER_PORTS in extension.js
```

### Issue: MCP Server Crashes

**Check logs:**
```bash
# View server output in VS Code
# View → Output → Select "Extension Host"

# Or check server directory
cd ~/mcp-servers/io.github.antonorlov-mcp-postgres-server
npm start
# Watch for errors
```

### Issue: Cannot Connect to Database

**Verify PostgreSQL is accessible:**
```bash
# Test direct connection
psql -h localhost -p 5431 -U postgres -d Adventureworks

# If this fails, fix PostgreSQL first
```

---

## 📊 Server Status Commands

### Check Running Servers

```
@mcp status
```

Shows:
- 🟢 Running - Server process is active
- ✅ Installed - Server installed but not running
- 📦 Available - Server in registry, not installed

### Start Multiple Servers

```
@mcp start io.github.antonorlov/mcp-postgres-server
@mcp start io.github.mirza-glitch/markitdown-js
```

### Stop All Servers

```
@mcp stop-all
```

---

## 🔐 Security Notes

### Configuration File Security

The database configuration is stored in:
```
~/mcp-servers/io.github.antonorlov-mcp-postgres-server/.mcp-config.json
```

This file contains:
```json
{
  "host": "localhost",
  "port": 5431,
  "database": "Adventureworks",
  "user": "postgres",
  "password": "postgres"
}
```

**⚠️ Security Recommendations:**

1. **File Permissions:**
```bash
chmod 600 ~/mcp-servers/io.github.antonorlov-mcp-postgres-server/.mcp-config.json
```

2. **Use Read-Only User:**
```sql
CREATE USER readonly WITH PASSWORD 'secure_pass';
GRANT CONNECT ON DATABASE "Adventureworks" TO readonly;
GRANT USAGE ON SCHEMA sales, production TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA sales TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA production TO readonly;
```

3. **Environment Variables:**
Instead of hardcoding in config, use environment variables in the MCP server.

---

## 🎓 Usage Examples

### Example 1: Full Setup

```bash
# Install and setup
@mcp install io.github.antonorlov/mcp-postgres-server
@mcp start io.github.antonorlov/mcp-postgres-server
@mcp db configure postgresql://postgres:postgres@localhost:5431/Adventureworks
@mcp stop io.github.antonorlov/mcp-postgres-server
@mcp start io.github.antonorlov/mcp-postgres-server

# Verify
@mcp db query SELECT version()
@mcp db tables
```

### Example 2: Daily Queries

```bash
# Check server status
@mcp status

# If stopped, start it
@mcp start io.github.antonorlov/mcp-postgres-server

# Run queries
@mcp db query SELECT * FROM sales.customer LIMIT 10
@mcp db query SELECT COUNT(*) FROM production.product
@mcp db describe sales.salesorderheader
```

### Example 3: Using Multiple Servers

```bash
# Start database server
@mcp start io.github.antonorlov/mcp-postgres-server

# Start markitdown
@mcp start io.github.mirza-glitch/markitdown-js

# Query database
@mcp db query SELECT * FROM users

# Use Copilot with markitdown (it uses the running MCP server)
@mcp Convert document.docx to markdown

# Stop all when done
@mcp stop-all
```

---

## ✅ Success Criteria

You'll know everything is working when:

1. ✅ `@mcp list` shows PostgreSQL server
2. ✅ `@mcp status` shows server as "🟢 Running"
3. ✅ `@mcp db query SELECT 1` returns result
4. ✅ `@mcp db tables` lists AdventureWorks tables
5. ✅ Queries execute and display formatted results
6. ✅ Server persists between queries
7. ✅ Can stop and restart server

---

## 🎉 You're Done!

Your pure MCP-based solution is complete. All database operations now go through the MCP PostgreSQL server.

### Quick Reference Card

```bash
# Setup (one time)
@mcp install io.github.antonorlov/mcp-postgres-server
@mcp start io.github.antonorlov/mcp-postgres-server
@mcp db configure postgresql://postgres:postgres@localhost:5431/Adventureworks
@mcp stop io.github.antonorlov/mcp-postgres-server
@mcp start io.github.antonorlov/mcp-postgres-server

# Daily use
@mcp status
@mcp start io.github.antonorlov/mcp-postgres-server
@mcp db query SELECT * FROM sales.customer LIMIT 10
@mcp db tables
@mcp stop-all
```

---

**This is a true MCP implementation - everything goes through MCP protocol!** 🚀