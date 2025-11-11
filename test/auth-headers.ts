import { env } from './env';

export const AUTH_HEADERS = {
	'Content-Type': 'application/json',
	Authorization: `Bearer ${env.BEARER_TOKEN}`,
};
