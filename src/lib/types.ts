export interface FilmScreening {
	title: string;
	date: string;
	runtime?: string;
	category?: string;
	description?: string;
	imageUrl?: string;
	url?: string;
	tags?: string[];
	director?: string;
	year?: string;
	source?: 'babylon' | 'yorck';
	genre?: string;
	day?: string;
	showtimes?: Showtime[];
}

export interface Showtime {
	time: string;
	cinema?: string;
	url?: string;
	date?: string;
	format?: string;
	exactDateTime?: string;
}

export interface DayGroup {
	date: string;
	screenings: FilmScreening[];
}
