import type { PageLoad } from './$types';
import screeningsData from '../../data/screenings.json';

export const prerender = true;

export const load: PageLoad = async () => {
	return {
		screenings: screeningsData
	};
};
