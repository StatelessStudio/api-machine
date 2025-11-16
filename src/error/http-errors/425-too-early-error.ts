import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 425 Too Early
 * The server is unwilling to risk processing a request that might be replayed
 */
export class TooEarlyError extends HTTPError {
	constructor(message = 'Too Early', options: HttpErrorOptions = {}) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 425;
	}
}
