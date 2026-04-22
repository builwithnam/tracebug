# Tracebug CLI - Installation Guide for AI Agents

This guide provides step-by-step instructions for installing and using the `tracebug` CLI tool to debug chatbot session traces.

## Overview

The `tracebug` CLI is a command-line tool that allows you to query and inspect chatbot session traces directly from your terminal. It's designed to be easily usable by AI agents through environment variables.

## Quick Start

```bash
npx tracebug@latest <share_id>
```

## Installation Methods

### Method 1: npx (Recommended for AI Agents)

No installation required. Use `npx` to run tracebug directly:

```bash
npx tracebug@latest abc123
```

### Method 2: Global Installation

Install globally for easier access:

```bash
npm install -g tracebug
# or
pnpm add -g tracebug
```

Then run:

```bash
tracebug abc123
```

### Method 3: Local Installation

Install in your project:

```bash
npm install tracebug
# or
pnpm add tracebug
```

Then run with `npx`:

```bash
npx tracebug abc123
```

## Configuration

The CLI requires database configuration to connect to your tracebug database.

### Option 1: Configuration File (Default)

Create `~/.tracebug/settings.json`:

```json
{
  "db": {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "your-password",
    "database": "bc_app"
  },
  "output": "pretty"
}
```

### Option 2: Environment Variables (Recommended for AI Agents)

Set environment variables instead of using a config file:

```bash
export TRACEBUG_DB_HOST=localhost
export TRACEBUG_DB_PORT=3306
export TRACEBUG_DB_USER=root
export TRACEBUG_DB_PASSWORD=your-password
export TRACEBUG_DB_NAME=bc_app
export TRACEBUG_OUTPUT=json  # or "pretty"
```

When using environment variables, pass the `--env` flag:

```bash
tracebug abc123 --env
```

## Usage

### Basic Query

```bash
tracebug abc123
```

### JSON Output

```bash
tracebug abc123 --json
```

### Using Environment Variables

```bash
TRACEBUG_DB_HOST=localhost \
TRACEBUG_DB_PASSWORD=secret \
tracebug abc123 --env
```

### Check Configuration

```bash
tracebug config
```

This shows the config file location (`~/.tracebug/settings.json`) and any environment variables that are set.

### Programmatic Usage

Import in Node.js:

```javascript
import { getSessionByShareId } from "tracebug";

const session = await getSessionByShareId("abc123");
console.log(session);
```

## Output Formats

### Pretty Output (Default)

Human-readable text format showing:
- Share ID and Session ID
- Message list with role, text, code, and feedback
- Trace data per message with all pipeline stages (querier, router, scenario_selector, agent, generator, questioner)

### JSON Output

Full session data as JSON, suitable for parsing by scripts or AI agents:

```bash
tracebug abc123 --json
```

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TRACEBUG_DB_HOST` | Database host | `localhost` | Yes |
| `TRACEBUG_DB_PORT` | Database port | `3306` | No |
| `TRACEBUG_DB_USER` | Database user | `root` | No |
| `TRACEBUG_DB_PASSWORD` | Database password | (empty) | Yes |
| `TRACEBUG_DB_NAME` | Database name | `bc_app` | Yes |
| `TRACEBUG_OUTPUT` | Output format | `pretty` | No |

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (not found, connection failed, invalid config, etc.) |

## Examples for AI Agents

### Example 1: Basic Query

```bash
#!/bin/bash

# Set up database connection
export TRACEBUG_DB_HOST=localhost
export TRACEBUG_DB_PASSWORD=your-db-password
export TRACEBUG_DB_NAME=bc_app

# Query a session
npx tracebug@latest abc123 --env --json
```

### Example 2: Parse Output in Python

```python
import json
import subprocess
import os

# Configure
os.environ["TRACEBUG_DB_HOST"] = "localhost"
os.environ["TRACEBUG_DB_PASSWORD"] = "your-db-password"
os.environ["TRACEBUG_DB_NAME"] = "bc_app"

# Query session
result = subprocess.run(
    ["npx", "tracebug@latest", "abc123", "--env", "--json"],
    capture_output=True,
    text=True,
)

# Parse JSON
session = json.loads(result.stdout)
print(f"Session ID: {session['session_id']}")
print(f"Messages: {len(session['messages'])}")
```

### Example 3: Parse Output in JavaScript/Node.js

```javascript
import { execSync } from "child_process";

// Configure
process.env.TRACEBUG_DB_HOST = "localhost";
process.env.TRACEBUG_DB_PASSWORD = "your-db-password";
process.env.TRACEBUG_DB_NAME = "bc_app";

// Query session
const output = execSync("npx tracebug@latest abc123 --env --json", {
  encoding: "utf-8",
});

// Parse JSON
const session = JSON.parse(output);
console.log(`Session ID: ${session.session_id}`);
console.log(`Messages: ${session.messages.length}`);
```

### Example 4: Check Configuration

```bash
#!/bin/bash

# Check where config is located
tracebug config
```

### Example 5: Check if Session Exists

```bash
#!/bin/bash

export TRACEBUG_DB_HOST=localhost
export TRACEBUG_DB_PASSWORD=your-db-password
export TRACEBUG_DB_NAME=bc_app

if npx tracebug@latest abc123 --env >/dev/null 2>&1; then
    echo "Session exists"
else
    echo "Session not found"
fi
```

## Troubleshooting

### Error: Share ID not found

The share ID doesn't exist in the database. Verify the ID and check database connection.

### Error: Failed to load config

Check that `~/.tracebug/settings.json` exists and is valid JSON. Use `--env` with environment variables instead.

### Error: Connection refused/failed

Verify database credentials and that the MySQL server is running:

```bash
mysql -h localhost -u root -p bc_app
```

### Permission denied

Ensure the user has read access to `~/.tracebug/settings.json` or use environment variables instead.

## Development

To develop the CLI locally:

```bash
cd /path/to/tracebug
pnpm install
cd packages/cli
pnpm build
pnpm start abc123
```

## Related Documentation

- [Main README](README.md) - Project overview
- [CLAUDE.md](CLAUDE.md) - Development guidelines
- [CONTEXT.md](CONTEXT.md) - Terminology and architecture

## Support

For issues or questions, refer to the main project documentation or open an issue in the repository.
