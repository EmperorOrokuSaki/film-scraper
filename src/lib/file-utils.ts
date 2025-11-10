import fs from 'fs';
import path from 'path';
import type { FilmScreening } from './types';

const DATA_FILE = path.join(process.cwd(), 'data', 'screenings.json');

export const ensureDataDir = async () => {
	const dataDir = path.join(process.cwd(), 'data');
	try {
		if (!fs.existsSync(dataDir)) {
			fs.mkdirSync(dataDir, { recursive: true });
		}
		return true;
	} catch (error) {
		console.error('Error ensuring data directory exists:', error);
		return false;
	}
};

export const saveScreeningsToFile = async (screenings: FilmScreening[]) => {
	try {
		await ensureDataDir();
		fs.writeFileSync(DATA_FILE, JSON.stringify(screenings, null, 2));
		return true;
	} catch (error) {
		console.error('Error saving screenings to file:', error);
		return false;
	}
};

export const readScreeningsFromFile = async (): Promise<FilmScreening[]> => {
	try {
		await ensureDataDir();
		if (!fs.existsSync(DATA_FILE)) {
			return [];
		}
		const data = fs.readFileSync(DATA_FILE, 'utf-8');
		return JSON.parse(data);
	} catch (error) {
		console.error('Error reading screenings from file:', error);
		return [];
	}
};
