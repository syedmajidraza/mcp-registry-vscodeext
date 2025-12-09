# MCP Registry Extension with PostgreSQL Database Support

A powerful VS Code extension that connects to your company's MCP registry and provides PostgreSQL database connectivity directly through VS Code Chat. Query databases, manage MCP servers, and leverage AI-powered tools like markitdown—all from your chat interface.

## 🚀 Features

### 🗄️ PostgreSQL Database Connectivity
- Connect to PostgreSQL databases directly from VS Code Chat
- Execute SQL queries with formatted results
- Explore database schemas and tables
- Support for multiple concurrent connections
- Smart query execution with performance metrics

### 📦 MCP Server Management
- Browse company-approved MCP servers from your registry
- Install and manage MCP servers (markitdown, etc.)
- Track installation status
- Automatic tool loading for Copilot integration

### 🤖 AI-Powered Tools
- **markitdown** - Convert various file formats to Markdown
- Additional MCP tools from your company registry
- Seamless integration with GitHub Copilot

---

## 📋 Prerequisites

- **VS Code** 1.90.0 or higher
- **Node.js** 18+ and npm
- **GitHub Copilot** extension (for AI features)
- **PostgreSQL** database (for database features)
- **MCP Registry Server** running at `http://localhost:8080`

---

## 🔧 Installation

### 1. Install Dependencies

```bash
cd /path/to/mcp-registry-vscode/
npm install
npm install pg
```

### 2. Package the Extension

```bash
npm install -g @vscode/vsce
vsce package
```

### 3. Install in VS Code

```bash
code --install-extension mcp-registry-vscode-*.vsix
```

Or manually:
- Open VS Code
- Press `Ctrl+Shift+X` (Extensions)
- Click "..." menu → "Install from VSIX..."
- Select the `.vsix` file

### 4. Reload VS Code

Press `Ctrl+Shift+P` → "Developer: Reload Window"

---

## ⚙️ Configuration

Add to your VS Code `settings.json`:

```json
{
  "mcpRegistry.registryUrl": "http://localhost:8080/v0.1/servers",
  "mcpRegistry.serversDirectory": "~/mcp-servers",
  "mcpRegistry.defaultDatabase": "postgresql://user:password@host:5432/database"
}
```

### Configuration Options

| Setting | Description | Default |
|---------|-------------|---------|
| `mcpRegistry.registryUrl` | URL of your MCP registry server | `http://localhost:8080/v0.1/servers` |
| `mcpRegistry.serversDirectory` | Directory for installed MCP servers | `~/mcp-servers` |
| `mcpRegistry.defaultDatabase` | Default PostgreSQL connection string | `""` |

---

## 📖 Usage Guide

### Opening the Chat Interface

Press `Ctrl+I` (Windows/Linux) or `Cmd+I` (Mac) to open VS Code Chat, then type `@mcp` followed by your command.

---

## 🗄️ Database Commands

### Connect to Database

```bash
@mcp db connect postgresql://postgres:postgres@localhost:5432/mydb
```

**Example with AdventureWorks:**
```bash
@mcp db connect postgresql://postgres:postgres@localhost:5431/Adventureworks
```

**Response:**
```
✅ Connected successfully!

📍 Connection Details:
- Database: Adventureworks
- Host: localhost:5431
- User: postgres

📊 PostgreSQL Version:
PostgreSQL 15.4
```

### List All Tables

```bash
@mcp db tables
```

**Response:**
```
📋 Database Tables

| schemaname | tablename           | size    |
|------------|---------------------|---------|
| sales      | customer            | 1584 kB |
| sales      | salesorderheader    | 5648 kB |
| production | product             | 2048 kB |
| person     | person              | 1024 kB |
...
```

### Execute SQL Queries

```bash
@mcp db query SELECT * FROM sales.customer LIMIT 10
```

Or without the `query` keyword:
```bash
@mcp db SELECT * FROM sales.customer LIMIT 10
```

**Response:**
```
🔍 Executing Query

✅ Query successful (45ms)
📊 10 row(s) returned

| customerid | personid | storeid | territoryid | accountnumber |
|------------|----------|---------|-------------|---------------|
| 1          | 123      | NULL    | 1           | AW00000001    |
| 2          | 124      | NULL    | 1           | AW00000002    |
...
```

### Describe Table Structure

```bash
@mcp db describe sales.customer
```

**Response:**
```
📐 Table Structure: sales.customer

| column_name    | data_type | character_maximum_length | is_nullable | column_default |
|----------------|-----------|--------------------------|-------------|----------------|
| customerid     | integer   | NULL                     | NO          | nextval(...)   |
| personid       | integer   | NULL                     | YES         | NULL           |
| storeid        | integer   | NULL                     | YES         | NULL           |
...
```

### Complex Queries

```bash
@mcp db query 
  SELECT 
    c.customerid,
    COUNT(o.salesorderid) as total_orders,
    SUM(o.totaldue) as total_spent
  FROM sales.customer c
  LEFT JOIN sales.salesorderheader o ON c.customerid = o.customerid
  GROUP BY c.customerid
  ORDER BY total_spent DESC
  LIMIT 10
```

### List Active Connections

```bash
@mcp db list
```

### Disconnect from Database

```bash
@mcp db disconnect
```

### Database Help

```bash
@mcp db help
```

---

## 📦 MCP Server Management

### List Available Servers

```bash
@mcp list
```

**Response:**
```
📦 Available MCP Servers from Registry

✅ Installed markitdown
Convert various file formats to Markdown
- Version: 1.0.0
- Repository: https://github.com/microsoft/markitdown

📦 Available server-postgres
PostgreSQL database access
- Version: 1.0.0
- Install: @mcp install server-postgres
...
```

### Check Installation Status

```bash
@mcp status
```

**Response:**
```
📊 Installation Status

✅ markitdown - Installed
✅ server-filesystem - Installed
📦 server-postgres - Available
📦 server-github - Available

Summary:
- ✅ Installed: 2
- 📦 Available: 2
- 📁 Location: ~/mcp-servers
```

### Install a Server

```bash
@mcp install markitdown
```

**Response:**
```
📦 Installing markitdown

📥 Cloning repository...
✅ Cloned

📦 Installing dependencies...
✅ Dependencies installed

🔨 Building...
✅ Build complete

✅ Installation Complete!
markitdown is now installed and ready to use.
```

### Install All Available Servers

```bash
@mcp install-all
```

### Uninstall a Server

```bash
@mcp uninstall markitdown
```

---

## 🤖 Using AI-Powered MCP Tools

Once MCP servers are installed (like markitdown), they're automatically available to GitHub Copilot in your conversations.

### Example: Using markitdown

**Convert a Word document to Markdown:**

Simply ask in chat:
```
@mcp Convert my document.docx to markdown
```

GitHub Copilot will automatically use the markitdown tool to:
1. Read the Word document
2. Convert it to Markdown format
3. Return the formatted text

**Convert PDF to Markdown:**
```
@mcp Extract text from report.pdf as markdown
```

**Convert PowerPoint to Markdown:**
```
@mcp Convert presentation.pptx to markdown format
```

### How MCP Tools Integration Works

1. You install an MCP server (like markitdown)
2. The extension loads it into the MCP registry
3. GitHub Copilot automatically detects available tools
4. When you ask questions, Copilot can use these tools
5. Results are seamlessly integrated into responses

### Available MCP Tools

Your registry may include:
- **markitdown** - File format conversion to Markdown
- **server-filesystem** - File system operations
- **server-postgres** - PostgreSQL database access
- **server-github** - GitHub API integration
- And more from your company registry

---

## 💡 Real-World Usage Examples

### Example 1: Database Analysis + Documentation

```bash
# 1. Connect to your database
@mcp db connect postgresql://postgres:postgres@localhost:5431/Adventureworks

# 2. Explore the schema
@mcp db tables

# 3. Analyze customer data
@mcp db query 
  SELECT 
    DATE_TRUNC('month', o.orderdate) as month,
    COUNT(*) as orders,
    SUM(o.totaldue) as revenue
  FROM sales.salesorderheader o
  WHERE o.orderdate >= NOW() - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', o.orderdate)
  ORDER BY month

# 4. Ask Copilot to document findings
@mcp Please create a markdown report of the sales trends based on this data

# 5. Copilot uses markitdown to format the report
```

### Example 2: Data Migration Workflow

```bash
# 1. Check source database structure
@mcp db describe sales.customer

# 2. Query sample data
@mcp db query SELECT * FROM sales.customer LIMIT 5

# 3. Ask Copilot to help with migration
@mcp Generate a SQL script to migrate this table structure to a new schema

# 4. Document the migration process
@mcp Create documentation for this migration using markdown format
```

### Example 3: Quick Database Reporting

```bash
# Connect to database
@mcp db connect postgresql://postgres:postgres@localhost:5431/Adventureworks

# Get top customers
@mcp db query 
  SELECT 
    c.customerid,
    COUNT(o.salesorderid) as order_count,
    SUM(o.totaldue) as lifetime_value
  FROM sales.customer c
  JOIN sales.salesorderheader o ON c.customerid = o.customerid
  GROUP BY c.customerid
  ORDER BY lifetime_value DESC
  LIMIT 10

# Ask Copilot to create a report
@mcp Create a business report analyzing these top customers with visualizations suggestions
```

### Example 4: Code Documentation

```bash
# Use markitdown to convert technical docs
@mcp Convert our API_SPEC.docx to markdown

# Then query database for API usage stats
@mcp db query 
  SELECT 
    api_endpoint,
    COUNT(*) as call_count,
    AVG(response_time) as avg_response
  FROM api_logs
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY api_endpoint
  ORDER BY call_count DESC

# Combine into documentation
@mcp Combine the API spec with usage statistics into comprehensive markdown documentation
```

---

## 🎯 Command Reference

### Database Commands

| Command | Description | Example |
|---------|-------------|---------|
| `db connect <url>` | Connect to PostgreSQL database | `@mcp db connect postgresql://user:pass@host:5432/db` |
| `db disconnect` | Close all database connections | `@mcp db disconnect` |
| `db list` | List active connections | `@mcp db list` |
| `db tables` | Show all tables in database | `@mcp db tables` |
| `db describe <table>` | Show table structure | `@mcp db describe sales.customer` |
| `db query <sql>` | Execute SQL query | `@mcp db query SELECT * FROM users` |
| `db SELECT/INSERT/UPDATE/DELETE` | Execute SQL directly | `@mcp db SELECT * FROM users LIMIT 10` |
| `db help` | Show database help | `@mcp db help` |

### MCP Server Management Commands

| Command | Description | Example |
|---------|-------------|---------|
| `list` | List all available MCP servers | `@mcp list` |
| `status` | Show installation status | `@mcp status` |
| `install <server>` | Install a specific server | `@mcp install markitdown` |
| `install-all` | Install all available servers | `@mcp install-all` |
| `uninstall <server>` | Uninstall a server | `@mcp uninstall markitdown` |
| `uninstall-all` | Uninstall all servers | `@mcp uninstall-all` |
| `help` | Show all commands | `@mcp help` |

---

## 🔐 Security Best Practices

### Database Security

#### 1. Use Read-Only Users for Queries

Create a dedicated read-only user:

```sql
-- Connect as admin
psql -h localhost -p 5432 -U postgres

-- Create read-only user
CREATE USER app_readonly WITH PASSWORD 'SecurePassword123!';
GRANT CONNECT ON DATABASE mydb TO app_readonly;
GRANT USAGE ON SCHEMA public TO app_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO app_readonly;
```

Then use this connection string:
```
postgresql://app_readonly:SecurePassword123!@localhost:5432/mydb
```

#### 2. Use Environment Variables

Instead of hardcoding credentials in settings:

```bash
# Add to ~/.bashrc or ~/.zshrc
export DB_CONNECTION_STRING="postgresql://user:pass@host:5432/db"
```

Then in settings.json:
```json
{
  "mcpRegistry.defaultDatabase": "${env:DB_CONNECTION_STRING}"
}
```

#### 3. Limit Query Timeout

Prevent runaway queries:
```json
{
  "mcpRegistry.queryTimeout": 30000
}
```

### MCP Server Security

- Only install servers from your company's approved registry
- Review server source code before installation
- Keep servers updated to latest versions
- Uninstall unused servers

---

## 🐛 Troubleshooting

### Extension Not Showing in Chat

**Problem:** Can't see `@mcp` in VS Code Chat

**Solution:**
1. Verify GitHub Copilot is installed and active
2. Reload VS Code: `Ctrl+Shift+P` → "Developer: Reload Window"
3. Check extension is enabled in Extensions panel (`Ctrl+Shift+X`)

### Database Connection Failed

**Problem:** Cannot connect to PostgreSQL

**Solution:**
```bash
# 1. Verify PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list               # macOS

# 2. Test connection manually
psql -h localhost -p 5432 -U postgres -d mydb

# 3. Check connection string format
# Correct: postgresql://user:pass@host:port/database
# Incorrect: postgres://user@host/database (missing password, port)
```

### MCP Registry Connection Failed

**Problem:** Cannot load MCP servers

**Solution:**
1. Verify registry server is running at `http://localhost:8080`
2. Test with curl: `curl http://localhost:8080/v0.1/servers`
3. Check firewall settings
4. Update registry URL in settings if using different port

### markitdown Not Available

**Problem:** Copilot doesn't use markitdown

**Solution:**
```bash
# 1. Check if installed
@mcp status

# 2. If not installed
@mcp install markitdown

# 3. Reload VS Code
Ctrl+Shift+P → "Developer: Reload Window"

# 4. Verify in chat
@mcp list
# Should show "✅ Installed markitdown"
```

### Query Results Not Displaying

**Problem:** Queries execute but no results show

**Solution:**
1. Check query syntax: `@mcp db query SELECT * FROM table LIMIT 10`
2. Verify table exists: `@mcp db tables`
3. Try simpler query: `@mcp db query SELECT 1`
4. Check for errors in Output panel: View → Output → Extension Host

---

## 📊 Performance Tips

### Database Queries

1. **Always use LIMIT** - Prevent large result sets
   ```sql
   SELECT * FROM large_table LIMIT 100
   ```

2. **Use proper indexes** - Check with EXPLAIN
   ```sql
   @mcp db query EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com'
   ```

3. **Avoid SELECT *** - Be specific
   ```sql
   SELECT id, name, email FROM users  -- Good
   SELECT * FROM users                 -- Slower
   ```

### Extension Performance

1. **Uninstall unused MCP servers** - Reduces loading time
2. **Keep servers updated** - Better performance and security
3. **Use specific queries** - More efficient than broad searches

---

## 🔄 Updating the Extension

### When Changes Are Made

```bash
# 1. Pull latest changes
cd /path/to/mcp-registry-vscode/
git pull

# 2. Reinstall dependencies
npm install

# 3. Rebuild extension
vsce package

# 4. Reinstall
code --install-extension mcp-registry-vscode-*.vsix

# 5. Reload VS Code
Ctrl+Shift+P → "Developer: Reload Window"
```

---

## 🤝 Contributing

### Development Setup

```bash
# 1. Clone repository
git clone <your-repo-url>
cd mcp-registry-vscode

# 2. Install dependencies
npm install

# 3. Open in VS Code
code .

# 4. Press F5 to launch Extension Development Host
# Test your changes in the new window
```

### Testing

```bash
# Run tests
npm test

# Lint code
npm run lint
```

---

## 📚 Additional Resources

### Documentation
- [VS Code Extension API](https://code.visualstudio.com/api)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [GitHub Copilot Chat](https://docs.github.com/en/copilot/using-github-copilot/asking-github-copilot-questions-in-your-ide)
- [MCP Protocol](https://modelcontextprotocol.io)

### Sample Queries
- [AdventureWorks Sample Queries](./ADVENTUREWORKS_CONFIG.md)
- [Implementation Examples](./IMPLEMENTATION_EXAMPLES.md)

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🆘 Support

For issues, questions, or feature requests:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed setup
3. See [IMPLEMENTATION_EXAMPLES.md](./IMPLEMENTATION_EXAMPLES.md) for usage examples
4. Contact your internal development team

---

## ✨ Features Summary

| Feature | Status | Description |
|---------|--------|-------------|
| 🗄️ Database Connectivity | ✅ Ready | Connect and query PostgreSQL databases |
| 📦 MCP Server Management | ✅ Ready | Install and manage MCP servers |
| 🤖 markitdown Integration | ✅ Ready | Convert files to Markdown format |
| 🔍 SQL Query Execution | ✅ Ready | Execute SQL with formatted results |
| 📊 Schema Exploration | ✅ Ready | Browse tables and structures |
| 🔐 Security Features | ✅ Ready | Read-only users, environment variables |
| 💬 AI Assistant Integration | ✅ Ready | Works with GitHub Copilot |
| 🔄 Multi-Connection Support | ✅ Ready | Connect to multiple databases |

---

## 🎉 Quick Start Summary

```bash
# 1. Install extension
code --install-extension mcp-registry-vscode-*.vsix

# 2. Reload VS Code
Ctrl+Shift+P → "Reload Window"

# 3. List MCP servers
@mcp list

# 4. Install markitdown
@mcp install markitdown

# 5. Connect to database
@mcp db connect postgresql://postgres:postgres@localhost:5432/mydb

# 6. Start querying
@mcp db tables
@mcp db query SELECT * FROM users LIMIT 10

# 7. Use with Copilot
@mcp Convert my document.docx to markdown
```

---

**Built with ❤️ for developer productivity**

Version: 1.1.0  
Last Updated: December 2024