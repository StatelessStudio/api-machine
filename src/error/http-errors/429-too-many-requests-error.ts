import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

export interface TooManyRequestsErrorOptions extends HttpErrorOptions {
	retryAfter?: number;
}

/**
 * 429 Too Many Requests
 * The user has sent too many requests in a given amount of time
 */
export class TooManyRequestsError extends HTTPError {
	constructor(
		message = 'Too Many Requests',
		options: TooManyRequestsErrorOptions = {}
	) {
		const headers: Record<string, string> = {};
		if (options.retryAfter) {
			headers['Retry-After'] = options.retryAfter.toString();
		}
		super(message, {
			...options,
			headers: { ...headers, ...options.headers },
		});
	}

	public override getStatusCode(): number {
		return 429;
	}
}
