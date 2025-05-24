# GitHub Actions CI/CD Setup

This repository uses GitHub Actions for continuous integration.

## Workflows

### CI Workflow (`ci.yml`)
Runs on every push to `main` and on all pull requests.

**Jobs:**
- **Lint and Format Check**: Runs Biome to check code quality
- **Unit Tests**: Runs Bun unit tests with coverage
- **Build**: Builds the Next.js application
- **E2E Tests**: Runs Playwright E2E tests
- **TypeScript Check**: Validates TypeScript types

## Vercel Deployment Options

Vercel automatically deploys your project by default. You have two options:

### Option 1: Vercel Auto-Deploy with Protection (Recommended)
1. Let Vercel handle all deployments automatically
2. Go to Vercel Project Settings → Git → Deployment Protection
3. Enable "Only deploy when all checks have passed"
4. Select which GitHub checks must pass (e.g., "CI / Build", "CI / Unit Tests")

**Benefits:**
- Simple setup
- Vercel handles everything
- Preview deployments for all branches
- Production deployments only when CI passes

### Option 2: Disable Auto-Deploy (Full CI Control)
If you want GitHub Actions to control deployments:

1. Add to `vercel.json`:
   ```json
   {
     "github": {
       "enabled": false
     }
   }
   ```
2. Create a custom deployment workflow

**Benefits:**
- Full control over when deployments happen
- Can add custom deployment logic
- More complex but more flexible

## How Playwright E2E Tests Work in CI

The E2E tests use Playwright's built-in `webServer` configuration to automatically:

1. **Start the Next.js server**: 
   - In CI: Runs `bun run start` (production build on port 3009)
   - Locally: Runs `bun dev` (development server)

2. **Wait for the server to be ready**: Playwright waits until the server responds on the configured port

3. **Run the tests**: Once the server is ready, tests execute against the running application

4. **Clean up**: After tests complete, the server is automatically stopped

**Key differences between local and CI:**
- CI uses the production build (`next start`) to test the actual production behavior
- CI has longer timeouts since production builds can take more time to start
- CI runs tests with a single worker to ensure stability
- The server is always restarted in CI (no reuse of existing servers)

## Required Secrets

Configure these secrets in your GitHub repository settings:

### Application Secrets (Optional)
These are optional - the CI will use placeholder values if not set:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (keep secret!)
- `TMDB_API_KEY`: Your TMDB API key for movie data

## How Environment Variables Work in CI

GitHub Actions automatically exposes secrets as environment variables. We don't need to create `.env.local` files because:

1. **GitHub Secrets → Environment Variables**: When you use `${{ secrets.SECRET_NAME }}`, it becomes available as an environment variable
2. **Direct Usage**: Next.js can read these directly from the environment during build and runtime
3. **Fallback Values**: We use `|| 'placeholder'` syntax to provide defaults when secrets aren't configured yet

Example in our CI:
```yaml
- name: Build application
  run: bun run build
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co' }}
```

This approach is:
- **Cleaner**: No temporary files to manage
- **More Secure**: Secrets stay in environment variables
- **Standard Practice**: Following GitHub Actions conventions

## Setting Up Secrets

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret listed above

Note: All secrets are optional. The CI will run with placeholder values if secrets aren't configured yet.

## Workflow Status Badge

Add this to your main README.md:

```markdown
![CI](https://github.com/YOUR_USERNAME/ninetyninety/workflows/CI/badge.svg)
```

## Local Testing

To test workflows locally, you can use [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS

# Run CI workflow
act -W .github/workflows/ci.yml

# Run with secrets
act -W .github/workflows/ci.yml --secret-file .env.local
```

## Troubleshooting

### CI Failures
- Check the workflow logs in the Actions tab
- Ensure all secrets are properly configured
- Verify that Bun lockfile is up to date: `bun install`

### Deployment Failures
- Verify Vercel tokens are correct
- Check Vercel dashboard for deployment logs
- Ensure environment variables are set in Vercel project settings 