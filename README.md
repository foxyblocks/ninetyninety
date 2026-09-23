# NinetyNinety - Elite Movie Discovery Platform

![CI](https://github.com/YOUR_USERNAME/ninetyninety/workflows/CI/badge.svg)

A curated movie discovery platform showcasing only the absolute best films - those with both 90%+ critics score AND 90%+ audience score on Rotten Tomatoes.

## 🚀 Tech Stack

- **Frontend**: Next.js 14+ with App Router
- **UI Library**: Chakra UI v3 (NO Tailwind CSS)
- **Database**: Neon Postgres with Drizzle ORM
- **Language**: TypeScript
- **Package Manager**: Bun
- **Code Quality**: Biome
- **Testing**: Bun (unit) + Playwright (E2E)

## 📋 Prerequisites

- [Bun](https://bun.sh/) installed
- [Node.js](https://nodejs.org/) 18.17 or later
- Vercel account with the Neon Marketplace integration
- MDBList API key

## 🛠️ Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ninetyninety.git
   cd ninetyninety
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   vercel env pull .env.development.local --environment=development
   ```
   Then edit `.env.local` with your actual values.

4. **Run the development server**
   ```bash
   bun run db:migrate
   bun run dev
   ```

   Open [http://localhost:3009](http://localhost:3009) with your browser.

## 📝 Available Scripts

- `bun dev` - Start development server
- `bun build` - Build for production
- `bun start` - Start production server
- `bun check` - Run Biome linting and formatting checks
- `bun check:fix` - Fix linting and formatting issues
- `bun format` - Format code with Biome
- `bun test` - Run unit tests
- `bun test:watch` - Run tests in watch mode
- `bun test:coverage` - Run tests with coverage
- `bun test:e2e` - Run E2E tests
- `bun test:e2e:ui` - Run E2E tests with UI
- `bun test:e2e:debug` - Debug E2E tests
- `bun run db:generate` - Generate a migration from the Drizzle schema
- `bun run db:migrate` - Apply pending migrations
- `bun run db:studio` - Open Drizzle Studio

## 🏗️ Project Structure

```
ninetyninety/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   ├── movies/       # Movie-related pages
│   │   ├── layout.tsx    # Root layout with Chakra UI
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   ├── catalog/          # Provider, refresh, and reconciliation logic
│   └── db/               # Neon connection and Drizzle schema
├── drizzle/              # Versioned database migrations
├── tests/
│   ├── unit/             # Unit tests
│   └── e2e/              # End-to-end tests
├── public/               # Static assets
├── ARCHITECTURE.md       # Current system design and cutover plan
├── PROJECT.md            # Product vision and backlog
└── biome.json            # Biome configuration
```

## 🧪 Testing

Run unit tests:
```bash
bun test
```

Run E2E tests (uses port 3001 by default):
```bash
bun test:e2e

# Or with a custom port:
PORT=3002 bun test:e2e
```

**Note:** E2E tests use port 3001 by default to avoid conflicts with your development server. See [tests/e2e/README.md](tests/e2e/README.md) for more details.

## 🎨 UI Guidelines

- **NO TAILWIND CSS** - We exclusively use Chakra UI v3
- Follow Chakra UI's component-based approach
- Use Chakra UI's design tokens for consistency
- Implement responsive design using Chakra UI's responsive arrays

## 📚 Documentation

- [PROJECT.md](./PROJECT.md) - Detailed project specifications
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Runtime and data architecture

## 🤝 Contributing

Please read the project documentation before contributing. Ensure all code follows our linting and formatting standards by running `bun check` before committing.

## 📄 License

[MIT License](LICENSE)
