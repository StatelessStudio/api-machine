import { HTTPError } from './http-error';
import { HttpErrorOptions } from '../error-options';

/**
 * 408 Request Timeout
 * The server timed out waiting for the request
 */
export class RequestTimeoutError extends HTTPError {
	constructor(message = 'Request Timeout', options: HttpErrorOptions = {}) {
		super(message, options);
	}

	public override getStatusCode(): number {
		return 408;
	}
}
