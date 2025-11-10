import { scrapeAndSaveScreenings } from '../src/lib/scraper.ts';

console.log('🎬 Scraping film screenings for build...');

try {
	await scrapeAndSaveScreenings(7); // Scrape 7 days
	console.log('✅ Scraping completed successfully!');
} catch (error) {
	console.error('❌ Error scraping:', error);
	process.exit(1);
}
