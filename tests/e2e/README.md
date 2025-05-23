# E2E Tests

This directory contains end-to-end tests using Playwright.

## Port Configuration

By default, the E2E tests run on port 3001 (instead of the default 3000) to avoid conflicts with any development server you might have running.

### Running Tests

```bash
# Run all E2E tests (uses port 3001 by default)
bun test:e2e

# Run with a specific port
PORT=3002 bun test:e2e

# Run tests with UI mode
bun test:e2e:ui

# Run tests in headed mode (see the browser)
bun test:e2e:headed

# Debug tests
bun test:e2e:debug
```

### Troubleshooting Port Conflicts

If you get errors about ports being in use:

1. **Check what's using the port:**
   ```bash
   lsof -i :3001  # On macOS/Linux
   ```

2. **Kill the process:**
   ```bash
   kill -9 <PID>  # Replace <PID> with the process ID
   ```

3. **Use a different port:**
   ```bash
   PORT=3002 bun test:e2e
   ```

### How It Works

1. Playwright starts the Next.js dev server on the specified port (default: 3001)
2. It waits for the server to be ready
3. Runs all tests against that server
4. Shuts down the server when done

The configuration in `playwright.config.ts` ensures that:
- The same port is used for both starting the server and connecting to it
- The port can be overridden with the `PORT` environment variable
- Existing servers are reused in development (but not in CI) 