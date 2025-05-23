# Claude Development Guidelines for NinetyNinety

## Important Project Constraints

### UI/CSS Framework
- **DO NOT USE TAILWIND CSS** under any circumstances
- We are exclusively using **Chakra UI v3** for all styling and components
- No utility-first CSS frameworks should be suggested or implemented
- All styling should be done through Chakra UI components and its theming system

### Technology Stack Requirements
- **Package Manager**: Bun (not npm or yarn)
- **Frontend Framework**: Next.js 14+ with App Router
- **UI Library**: Chakra UI v3 only
- **Database**: Supabase (PostgreSQL)
- **Language**: TypeScript
- **Code Quality**: Biome for linting and formatting

### Development Principles
- Follow Chakra UI's component-based approach for all UI elements
- Use Chakra UI's responsive design system (breakpoints, responsive arrays)
- Leverage Chakra UI's theming system for consistent design
- Prioritize accessibility through Chakra UI's built-in ARIA support

### Testing Strategy
- Unit Testing: Bun's built-in test runner
- E2E Testing: Playwright
- No Jest or other testing frameworks

## Code Style Guidelines
- Use TypeScript for all files
- Follow Biome's default configuration for linting and formatting
- Use Chakra UI's design tokens for spacing, colors, and typography
- Implement responsive design using Chakra UI's responsive syntax

## Project Structure
- Use Next.js App Router structure
- Components should be Chakra UI-based React components
- Database interactions through Supabase client
- API routes for server-side operations

---

*These guidelines ensure consistency and prevent the introduction of conflicting technologies.* 