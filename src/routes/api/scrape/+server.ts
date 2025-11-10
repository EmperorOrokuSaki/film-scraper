import { json } from '@sveltejs/kit';
import { scrapeAndSaveScreenings } from '$lib/scraper';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ url }) => {
	const numDays = parseInt(url.searchParams.get('days') || '3');
	const startDate = url.searchParams.get('startDate') || undefined;

	const screenings = await scrapeAndSaveScreenings(numDays, startDate);
	return json(screenings);
};
