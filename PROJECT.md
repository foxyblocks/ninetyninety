# NinetyNinety - Elite Movie Discovery Platform

## Project Overview

**NinetyNinety** is a curated movie discovery platform that showcases only the absolute best films - those with both 90%+ critics score AND 90%+ audience score on Rotten Tomatoes. This creates an exclusive collection of universally acclaimed movies that satisfy both professional critics and general audiences.

## Main Features

### 1. Core Movie Discovery
- **Elite Movie Grid**: Clean, visually appealing grid of 90/90 movies
- **Advanced Filtering**: 
  - Genre (Action, Drama, Comedy, etc.)
  - Release decade (1920s-2020s)
- **Intelligent Search**: Search by title, director, actor, or keyword
- **Sort Options**: By release date, critics score, audience score, alphabetical

### 2. Movie Details & Information
- **Rich Movie Pages**: Comprehensive movie information including:
  - High-quality poster and backdrop images
  - Plot synopsis and key details
  - Cast and crew information
  - Trailer integration (YouTube/Vimeo)
  - RT critics and audience scores with links to RT page
  - IMDB rating and link
  - Streaming availability (where to watch)
  - Box office performance
- **Visual Indicators**: Clear badges showing 90/90 status

### 3. User Experience Features
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile
- **Dark/Light Mode**: User preference toggle
- **Performance**: Fast loading with optimized images and lazy loading
- **Accessibility**: WCAG 2.1 AA compliant

### 4. Data Management Features
- **Automated Data Pipeline**: Background processing of new movies and score updates
- **Rate Limit Handling**: Intelligent queuing system for RT data scraping
- **Data Validation**: Ensure data accuracy and completeness

## Architectural Overview

### Technology Stack

**Package Management**
- **Bun**: Fast JavaScript runtime and package manager for improved performance

**Code Quality**
- **Biome**: Fast linter and formatter for JavaScript/TypeScript with zero configuration

**Frontend**
- **Next.js 14+**: React framework with App Router
- **Chakra UI v3**: Component library for consistent, accessible UI (EXCLUSIVE - no Tailwind CSS)
- **TypeScript**: Type safety and better developer experience
- **NO TAILWIND CSS**: We exclusively use Chakra UI for all styling and components

**Backend & Database**
- **Supabase**: 
  - PostgreSQL database for movie data storage
  - Authentication (for future user features)
  - Edge Functions for serverless compute
  - Storage for movie images/assets

**Data Processing**
- **Background Jobs**: Supabase Edge Functions or Vercel Cron
- **Rate Limiting**: Redis for job queuing and rate limit management
- **Data Sources**: 
  - TMDB API for base movie data
  - Rotten Tomatoes scraping (rate-limited)
  - IMDB data integration

### Database Schema

```sql
-- Comprehensive Movies Table (merged with ratings and all metadata)
movies (
  id: uuid (primary key)
  tmdb_id: integer (unique)
  imdb_id: string
  title: string
  original_title: string
  language: string
  release_year: integer
  release_date: date
  genres: string[]
  plot: text
  runtime: integer
  adult: boolean
  budget: string -- string to handle large numbers
  revenue: string -- string to handle large numbers
  homepage: string
  mpaa_rating: string
  keywords: string[]
  countries_of_origin: string[]
  languages: string[]
  cast: string[]
  director: string
  production: string
  awards_summary: text
  status: string
  poster_url: string
  poster_width: integer
  poster_height: integer
  backdrop_url: string
  backdrop_width: integer
  backdrop_height: integer
  trailer_url: string
  trailer_youtube_id: string
  imdb_rating: decimal
  imdb_votes: integer
  imdb_type: string
  tmdb_popularity: decimal
  tmdb_rating: decimal
  tmdb_votes: integer
  metacritic_rating: integer
  metacritic_votes: integer
  rt_critic_rating: integer
  rt_critic_votes: integer
  rt_audience_rating: integer
  rt_audience_votes: integer
  rt_url: string
  letterboxd_score: integer
  letterboxd_votes: integer
  flick_metrix_score: integer
  flick_metrix_id: integer
  foreign: boolean
  relevancy_score: decimal
  imdb_custom_popularity: integer
  created_at: timestamp
  updated_at: timestamp
)

-- Cast & Crew (for detailed cast/crew if needed beyond simple arrays)
movie_people (
  id: uuid (primary key)
  movie_id: uuid (foreign key -> movies.id)
  person_name: string
  role: enum (director, actor, writer, producer)
  character_name: string (nullable, for actors)
  order: integer (for cast ordering)
)

-- Processing Queue
data_processing_queue (
  id: uuid (primary key)
  movie_id: uuid (foreign key -> movies.id)
  task_type: enum (rt_scrape, imdb_update, image_process, flick_metrix_update)
  status: enum (pending, processing, completed, failed)
  priority: integer
  scheduled_for: timestamp
  attempts: integer
  created_at: timestamp
)
```

### Data Pipeline Architecture

1. **Initial Data Population (Phase 1)**
   - Use the [populate-movies](https://github.com/transitive-bullshit/populate-movies) approach as foundation
   - **Step 1**: Fetch base movie data from TMDB (~750k movies)
   - **Step 2**: Process and filter movies (results in ~73k quality movies)
   - **Step 3**: Store in Supabase with basic TMDB data
   - **Step 4**: Add a background job to scrape RT scores for the movies

2. **Enhanced RT/Metacritic Processing (Phase 2)**
   - **RT Scraping**: Rate-limited scraping for detailed RT scores (~4 hours)
   - **90/90 Filtering**: Only promote movies to "featured" status if both `rt_critic_rating >= 90` AND `rt_audience_rating >= 90`

3. **Background Maintenance Pipeline**
   - **Weekly RT Updates**: Refresh RT scores for existing 90/90 movies
   - **Monthly TMDB Sync**: Add new movies and update existing metadata
   - **Quarterly Full Refresh**: Complete data validation and cleanup
   - **Real-time Monitoring**: Track when movies fall below 90/90 threshold

4. **Data Quality Assurance**
   - **Image Processing**: Generate optimized poster/backdrop images with LQIP placeholders

## Technical Decisions

### 1. Environment Variable Management

**Recommended: Supabase + Vercel Environment Variables**

```typescript
// lib/config.ts
const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-only
  },
  apis: {
    tmdbApiKey: process.env.TMDB_API_KEY!,
    redisUrl: process.env.REDIS_URL!, // For rate limiting
  },
  app: {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL!,
    environment: process.env.NODE_ENV,
  }
}
```

**Environment Strategy:**
- Use Vercel Environment Variables for deployment
- Local `.env.local` for development
- Supabase Edge Functions environment variables for serverless functions
- Never expose sensitive keys to client-side

### 2. Rate Limiting Strategy

```typescript
// Rate limiting for RT scraping
const RT_RATE_LIMIT = {
  requestsPerMinute: 20,
  concurrentRequests: 2,
  backoffMultiplier: 2,
  maxRetries: 3
}
```

### 3. Image Optimization

- Use Next.js Image component with Supabase Storage
- Generate multiple sizes for responsive images
- WebP format with fallbacks
- Lazy loading for performance

### 4. Caching Strategy

- **Static Generation**: Movie pages with ISR (revalidate every 24 hours)
- **Client Caching**: SWR/TanStack Query for API calls
- **CDN**: Vercel Edge Network for global performance
- **Database**: Supabase built-in connection pooling

## Implementation Phases

### Phase 1: Foundation
- [x] Set up Next.js project with Chakra UI v3
- [ ] Configure Supabase database and authentication (need to add API keys to .env.local)
- [ ] Create basic database schema
- [ ] Implement movie grid and basic filtering
- [ ] Set up CI/CD pipeline

### Phase 2: Data Pipeline
- [ ] Implement TMDB data fetching
- [ ] Create RT scraping system with rate limiting
- [ ] Build background job processing
- [ ] Populate initial movie dataset
- [ ] Implement data validation and cleanup

### Phase 3: Core Features
- [ ] Build detailed movie pages
- [ ] Implement advanced search and filtering
- [ ] Add responsive design and mobile optimization
- [ ] Integrate trailer and streaming service data
- [ ] Performance optimization

### Phase 4: Polish & Launch
- [ ] UI/UX refinements
- [ ] Accessibility improvements
- [ ] SEO optimization
- [ ] Error handling and edge cases
- [ ] Production deployment and monitoring

## Success Metrics

### Technical Metrics
- **Performance**: Page load times < 2 seconds
- **Uptime**: 99.9% availability
- **Data Accuracy**: <1% incorrect movie ratings

### User Experience Metrics
- **Discovery Success**: Users find movies they want to watch
- **Engagement**: Time spent browsing and returning visits

## Risk Mitigation

### Rotten Tomatoes Rate Limiting
- **Risk**: Getting blocked or rate-limited by RT
- **Mitigation**: Conservative rate limiting, IP rotation if needed, graceful degradation

### Scalability
- **Risk**: Database performance with large datasets
- **Mitigation**: Proper indexing, query optimization, pagination

## Future Enhancements

### User Features (Post-MVP)
- User accounts and watchlists
- Staff lists: Special lists of movies curated by staff
- Email notifications for new 90/90 movies

### Advanced Features
- Machine learning for movie similarity
- Advanced analytics and insights

## Getting Started

1. **Repository Setup**
   ```bash
   bunx create-next-app@latest ninetyninety --typescript --app
   cd ninetyninety
   bun add @chakra-ui/react @chakra-ui/next-js @supabase/supabase-js
   bun add -d @biomejs/biome
   
   # Initialize Biome configuration
   bunx @biomejs/biome init
   ```

2. **Environment Configuration**
   - Set up Supabase project
   - Configure environment variables
   - Initialize database schema

3. **Development Workflow**
   - Use feature branches for development
   - Implement comprehensive testing
   - Regular code reviews and documentation updates
   - Use `bun dev` for local development
   - Use `bun run build` for production builds
   - Use `bunx biome check .` for linting and formatting

**Additional Bun Commands:**
   ```bash
   # Install dependencies
   bun install
   
   # Run development server
   bun dev
   
   # Build for production
   bun run build
   
   # Start production server
   bun start
   
   # Add new dependencies
   bun add <package-name>
   
   # Add dev dependencies
   bun add -d <package-name>
   ```

**Code Quality Commands:**
   ```bash
   # Check code with Biome (lint + format check)
   bunx biome check .
   
   # Format code with Biome
   bunx biome format . --write
   
   # Lint code with Biome
   bunx biome lint .
   
   # Fix linting issues automatically
   bunx biome check . --apply
   ```


---

*This document will be updated as the project evolves and new requirements emerge.* 