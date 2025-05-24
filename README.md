# NinetyNinety - Elite Movie Discovery Platform

![CI](https://github.com/YOUR_USERNAME/ninetyninety/workflows/CI/badge.svg)
![Deploy](https://github.com/YOUR_USERNAME/ninetyninety/workflows/Deploy%20to%20Vercel/badge.svg)

A curated movie discovery platform showcasing only the absolute best films - those with both 90%+ critics score AND 90%+ audience score on Rotten Tomatoes.

## 🚀 Tech Stack

- **Frontend**: Next.js 14+ with App Router
- **UI Library**: Chakra UI v3 (NO Tailwind CSS)
- **Database**: Supabase (PostgreSQL)
- **Language**: TypeScript
- **Package Manager**: Bun
- **Code Quality**: Biome
- **Testing**: Bun (unit) + Playwright (E2E)

## 📋 Prerequisites

- [Bun](https://bun.sh/) installed
- [Node.js](https://nodejs.org/) 18.17 or later
- Supabase account (for database)
- TMDB API key (for movie data)

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
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your actual values.

4. **Run the development server**
   ```bash
   bun dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser.

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
│   ├── lib/              # Utility functions and configurations
│   └── types/            # TypeScript type definitions
├── tests/
│   ├── unit/             # Unit tests
│   └── e2e/              # End-to-end tests
├── public/               # Static assets
├── PROJECT.md            # Detailed project documentation
├── CLAUDE.md             # AI assistant guidelines
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
- [CLAUDE.md](./CLAUDE.md) - AI assistant development guidelines

## 🤝 Contributing

Please read the project documentation before contributing. Ensure all code follows our linting and formatting standards by running `bun check` before committing.

## 📄 License

[MIT License](LICENSE)
