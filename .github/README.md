# GitHub Actions CI/CD Setup

This repository uses GitHub Actions for continuous integration and deployment.

## Workflows

### 1. CI Workflow (`ci.yml`)
Runs on every push to `main` and on all pull requests.

**Jobs:**
- **Lint and Format Check**: Runs Biome to check code quality
- **Unit Tests**: Runs Bun unit tests with coverage
- **Build**: Builds the Next.js application
- **E2E Tests**: Runs Playwright E2E tests
- **TypeScript Check**: Validates TypeScript types

### 2. Deploy Workflow (`deploy.yml`)
Automatically deploys to Vercel when CI passes on the `main` branch.

### 3. Dependabot (`dependabot.yml`)
Automatically creates PRs for dependency updates weekly.

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

### Application Secrets
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (keep secret!)
- `TMDB_API_KEY`: Your TMDB API key for movie data

### Deployment Secrets
- `VERCEL_TOKEN`: Your Vercel API token for deployments
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

## Setting Up Secrets

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret listed above

## Getting Vercel Tokens

1. **Vercel Token**: 
   - Go to [Vercel Dashboard](https://vercel.com/account/tokens)
   - Create a new token with full access

2. **Vercel Org/Project IDs**:
   - Run `vercel link` in your project directory
   - Check `.vercel/project.json` for the IDs

## Workflow Status Badges

Add these to your main README.md:

```markdown
![CI](https://github.com/YOUR_USERNAME/ninetyninety/workflows/CI/badge.svg)
![Deploy](https://github.com/YOUR_USERNAME/ninetyninety/workflows/Deploy%20to%20Vercel/badge.svg)
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