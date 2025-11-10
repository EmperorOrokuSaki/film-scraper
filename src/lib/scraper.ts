import * as cheerio from 'cheerio';
import type { FilmScreening, Showtime } from './types';
import { readScreeningsFromFile, saveScreeningsToFile } from './file-utils';

export const getFilmScreenings = async (): Promise<FilmScreening[]> => {
	try {
		return await readScreeningsFromFile();
	} catch (error) {
		return [];
	}
};

const formatDateForUrl = (date: Date): string => {
	return date.toISOString().split('T')[0];
};

const getCurrentDate = (): Date => {
	return new Date();
};

const getNextDays = (startDate: Date, numDays: number): Date[] => {
	const dates: Date[] = [];
	for (let i = 0; i < numDays; i++) {
		const date = new Date(startDate);
		date.setDate(date.getDate() + i);
		dates.push(date);
	}
	return dates;
};

const isDesiredFormat = (format: string): boolean => {
	const lowerFormat = format.toLowerCase();
	return lowerFormat.includes('omu') || lowerFormat.includes('omeu') || lowerFormat.includes('ov');
};

export const scrapeBabylonScreenings = async (
	numDays = 3,
	startDateStr?: string
): Promise<FilmScreening[]> => {
	try {
		const response = await fetch('https://babylonberlin.eu/programm', {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; FilmScraperBot/1.0)'
			},
			cache: 'no-store'
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch data: ${response.status}`);
		}

		const html = await response.text();
		const $ = cheerio.load(html);
		const screenings: FilmScreening[] = [];
		const today = startDateStr ? new Date(startDateStr) : getCurrentDate();

		$('li.mix').each((_, element) => {
			try {
				const $el = $(element);
				const dataDate = $el.attr('data-date') || '';
				const titleElement = $el.find('.right-mix h3 a.mix-title');
				const title = titleElement.text().trim();
				const url = titleElement.attr('href');
				const fullUrl = url ? `https://babylonberlin.eu${url}` : undefined;
				const dateElement = $el.find('.right-mix .mix-date');
				const dateText = dateElement.text().trim();

				let runtime: string | undefined;
				const runtimeSpan = $el.find('.right-mix .mix-date .runtime');
				if (runtimeSpan.length > 0) {
					runtime = runtimeSpan.text().trim();
				}

				const category = $el.find('.right-mix .mix-category a').text().trim();
				const description = $el.find('.right-mix .mix-introtext').text().trim();

				let director: string | undefined;
				const directorMatch = description.match(/R:\s*([^,.]+)/);
				if (directorMatch) {
					director = directorMatch[1].trim();
				}

				let year: string | undefined;
				const yearMatch = description.match(/\b(19|20)\d{2}\b/);
				if (yearMatch) {
					year = yearMatch[0];
				}

				const imageElement = $el.find('.upper-mix img');
				const imageUrl = imageElement.attr('src') || imageElement.attr('data-src');

				const tags: string[] = [];
				if ($el.hasClass('tag-highlight')) tags.push('highlight');
				if ($el.hasClass('tag-english-subtitles')) tags.push('english subtitles');
				if ($el.hasClass('tag-premiere')) tags.push('premiere');
				if (description.includes('OmU') || title.includes('OmU')) {
					tags.push('OmU');
				}
				if (description.includes('OmeU') || title.includes('OmeU')) {
					tags.push('OmeU');
				}

				let formattedDate = dataDate;
				let screeningDate: Date | null = null;

				if (!formattedDate && dateText) {
					const match = dateText.match(/(\d{2})\.(\d{2})\.\s*(\d{2}):(\d{2})/);
					if (match) {
						const [_, day, month, hours, minutes] = match;
						const year = today.getFullYear();
						formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:00`;
						screeningDate = new Date(year, Number.parseInt(month) - 1, Number.parseInt(day));
						screeningDate.setHours(Number.parseInt(hours), Number.parseInt(minutes));
					}
				} else if (formattedDate) {
					screeningDate = new Date(formattedDate);
				}

				if (screeningDate) {
					const daysDiff = Math.floor(
						(screeningDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
					);

					if (daysDiff >= 0 && daysDiff < numDays) {
						if (title && formattedDate) {
							const day = screeningDate.toISOString().split('T')[0];
							const showtime: Showtime = {
								time: formattedDate.split(' ')[1].substring(0, 5),
								cinema: 'Babylon Berlin',
								url: fullUrl
							};

							screenings.push({
								title,
								date: formattedDate,
								runtime,
								category,
								description,
								imageUrl,
								url: fullUrl,
								tags: tags.length > 0 ? tags : undefined,
								director,
								year,
								source: 'babylon',
								day,
								showtimes: [showtime]
							});
						}
					}
				}
			} catch (error) {
				// Silent error handling
			}
		});

		return screenings;
	} catch (error) {
		return [];
	}
};

export const scrapeYorckScreenings = async (
	numDays = 3,
	startDateStr?: string
): Promise<FilmScreening[]> => {
	try {
		const startDate = startDateStr ? new Date(startDateStr) : getCurrentDate();
		const nextDays = getNextDays(startDate, numDays);
		const allScreenings: FilmScreening[] = [];
		const now = new Date();

		for (const date of nextDays) {
			const formattedDate = formatDateForUrl(date);
			const url = `https://www.yorck.de/en/films?sort=Popularity&date=${formattedDate}&tab=daily&sessionsExpanded=true`;

			const response = await fetch(url, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (compatible; FilmScraperBot/1.0)'
				},
				cache: 'no-store'
			});

			if (!response.ok) {
				continue;
			}

			const html = await response.text();
			const nextDataMatch = html.match(
				/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s
			);

			if (!nextDataMatch || !nextDataMatch[1]) {
				continue;
			}

			try {
				const nextData = JSON.parse(nextDataMatch[1]);
				const films = nextData?.props?.pageProps?.films || [];

				for (const film of films) {
					if (!film.fields.sessions || film.fields.sessions.length === 0) {
						continue;
					}

					const title = film.fields.title;
					const runtime = film.fields.runtime ? `${film.fields.runtime} min` : undefined;
					const genre = film.fields.mainLabel;
					const description = film.fields.tagline;
					const year = film.fields.releaseDate ? film.fields.releaseDate.substring(0, 4) : undefined;

					let imageUrl: string | undefined;
					if (film.fields.heroImage?.fields?.image?.fields?.file?.url) {
						imageUrl = `https:${film.fields.heroImage.fields.image.fields.file.url}`;
					}

					const filmSlug = film.fields.slug;
					const filmUrl = filmSlug ? `https://www.yorck.de/en/films/${filmSlug}` : undefined;

					const dayStart = new Date(formattedDate);
					const dayEnd = new Date(formattedDate);
					dayEnd.setHours(23, 59, 59, 999);

					const showtimesByDay: Record<string, Showtime[]> = {};

					for (const session of film.fields.sessions) {
						const startTime = new Date(session.fields.startTime);

						if (startTime < dayStart || startTime > dayEnd) {
							continue;
						}

						if (startTime < now) {
							continue;
						}

						const formats = session.fields.formats || [];
						const formatStr = formats.join(', ');

						if (!formats.some((format: string) => isDesiredFormat(format))) {
							continue;
						}

						const sessionDay = startTime.toISOString().split('T')[0];
						if (!showtimesByDay[sessionDay]) {
							showtimesByDay[sessionDay] = [];
						}

						const startTimeLocal = new Date(session.fields.startTime);
						const hours = startTimeLocal.getHours().toString().padStart(2, '0');
						const minutes = startTimeLocal.getMinutes().toString().padStart(2, '0');
						const timeString = `${hours}:${minutes}`;

						const cinemaName = session.fields.cinema?.fields?.name;
						const showtimeUrl = `https://www.yorck.de/en/checkout/seatselection?sessionid=${session.sys.id}`;

						showtimesByDay[sessionDay].push({
							time: timeString,
							cinema: cinemaName,
							url: showtimeUrl,
							format: formatStr,
							exactDateTime: startTimeLocal.toISOString()
						});
					}

					for (const [day, showtimes] of Object.entries(showtimesByDay)) {
						if (showtimes.length > 0) {
							allScreenings.push({
								title,
								date: `${day} 00:00:00`,
								runtime,
								genre,
								description,
								imageUrl,
								url: filmUrl,
								source: 'yorck',
								day,
								showtimes,
								year
							});
						}
					}
				}
			} catch (error) {
				console.error('Error parsing Yorck JSON data:', error);
			}
		}

		return allScreenings;
	} catch (error) {
		console.error('Error scraping Yorck screenings:', error);
		return [];
	}
};

export const scrapeAndSaveScreenings = async (
	numDays = 3,
	startDateStr?: string
): Promise<FilmScreening[]> => {
	try {
		const existingScreenings = await getFilmScreenings();
		const babylonScreenings = await scrapeBabylonScreenings(numDays, startDateStr);
		const yorckScreenings = await scrapeYorckScreenings(numDays, startDateStr);

		const newScreenings = [...babylonScreenings, ...yorckScreenings];

		let allScreenings = newScreenings;
		if (startDateStr) {
			const newDays = new Set(newScreenings.map((s) => s.day));
			const filteredExisting = existingScreenings.filter((s) => s.day && !newDays.has(s.day));
			allScreenings = [...filteredExisting, ...newScreenings];
		}

		await saveScreeningsToFile(allScreenings);
		return allScreenings;
	} catch (error) {
		console.error('Error in scrapeAndSaveScreenings:', error);
		return [];
	}
};
