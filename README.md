# Film Screening Scraper - Berlin

A clean, minimal web app that scrapes original language film screenings (OmU, OmeU, OV) from Berlin cinemas.

## Features

- Scrapes **Babylon Berlin** and **Yorck Kinos** for film screenings
- Filters for original language films with subtitles (OmU, OmeU, OV)
- Simple, fast, easy-to-read interface
- Search and filter functionality
- Mobile-friendly design

## Tech Stack

- **SvelteKit** - Fast, minimal web framework
- **Cheerio** - HTML parsing for web scraping
- **TypeScript** - Type safety

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## How It Works

1. Scrapes Babylon Berlin and Yorck Kinos websites
2. Extracts film information (title, showtimes, directors, etc.)
3. Filters for original language screenings
4. Displays in a clean timeline view grouped by day
5. Data is cached locally in `data/screenings.json`

## API Routes

- `GET /api/screenings` - Get cached screenings
- `POST /api/scrape?days=7` - Scrape new screenings
