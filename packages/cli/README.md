# tracebug CLI

Command-line tool for debugging chatbot session traces. Query session data directly from your terminal without needing the web UI.

## Installation

```bash
npx tracebug@latest
```

Or install globally:

```bash
npm install -g tracebug
```

## Quick Start

```bash
tracebug <share_id>
```

## Commands

### `tracebug <share_id>`

Query a session by share ID.

### `tracebug config`

Print the current configuration file location and any environment variables that are set.

## Usage

```bash
tracebug abc123                    # Pretty-printed output
tracebug abc123 --json             # JSON output
tracebug abc123 --env              # Use environment variables
tracebug config                   # Show configuration location
tracebug --help                    # Show help
tracebug --version                 # Show version
```

## Configuration

### Using environment variables (recommended for AI agents)

```bash
export TRACEBUG_DB_HOST=localhost
export TRACEBUG_DB_PORT=3306
export TRACEBUG_DB_USER=root
export TRACEBUG_DB_PASSWORD=your-password
export TRACEBUG_DB_NAME=bc_app
export TRACEBUG_OUTPUT=json

tracebug abc123 --env
```

### Using config file

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

## Examples for AI Agents

### Bash script example

```bash
#!/bin/bash
export TRACEBUG_DB_HOST=localhost
export TRACEBUG_DB_PASSWORD=secret
export TRACEBUG_DB_NAME=bc_app

npx tracebug@latest abc123 --env --json
```

### Python integration

```python
import json
import subprocess
import os

os.environ["TRACEBUG_DB_HOST"] = "localhost"
os.environ["TRACEBUG_DB_PASSWORD"] = "your-password"
os.environ["TRACEBUG_DB_NAME"] = "bc_app"

result = subprocess.run(
    ["npx", "tracebug@latest", "abc123", "--env", "--json"],
    capture_output=True,
    text=True,
)

session = json.loads(result.stdout)
print(f"Session ID: {session['session_id']}")
```

### Node.js integration

```javascript
import { execSync } from "child_process";

process.env.TRACEBUG_DB_HOST = "localhost";
process.env.TRACEBUG_DB_PASSWORD = "your-password";
process.env.TRACEBUG_DB_NAME = "bc_app";

const output = execSync("npx tracebug@latest abc123 --env --json", {
  encoding: "utf-8",
});

const session = JSON.parse(output);
console.log(`Session ID: ${session.session_id}`);
```

## Programmatic Usage

Import the functions directly in Node.js:

```javascript
import { getSessionByShareId } from "tracebug";

const session = await getSessionByShareId("abc123");
console.log(session);
```

## Output Formats

### Pretty Output

Human-readable text showing messages and pipeline stages with indented JSON.

### JSON Output

Full session data as JSON, suitable for parsing by scripts or AI agents.

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (not found, connection failed, invalid config, etc.) |

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TRACEBUG_DB_HOST` | Database host | `localhost` | Yes |
| `TRACEBUG_DB_PORT` | Database port | `3306` | No |
| `TRACEBUG_DB_USER` | Database user | `root` | No |
| `TRACEBUG_DB_PASSWORD` | Database password | (empty) | Yes |
| `TRACEBUG_DB_NAME` | Database name | `bc_app` | Yes |
| `TRACEBUG_OUTPUT` | Output format | `pretty` | No |

## Development

```bash
# Build
pnpm build

# Run locally
pnpm start abc123

# Watch mode
pnpm dev
```

## Documentation

- [CLI_INSTALL.md](../../CLI_INSTALL.md) - Detailed installation guide for AI agents
- [Main README](../../README.md) - Project overview
