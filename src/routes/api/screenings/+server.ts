import { json } from '@sveltejs/kit';
import { getFilmScreenings } from '$lib/scraper';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const screenings = await getFilmScreenings();
	return json(screenings);
};
